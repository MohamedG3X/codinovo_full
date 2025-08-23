// server/src/routes/adminSessions.routes.js
import { Router } from 'express';
import mongoose from 'mongoose';

import { requireAuth, requireAdmin } from '../middleware/auth.js';
import ApiUser from '../models/ApiUser.js';
import DedicatedOrder from '../models/DedicatedOrder.js';
import GlobalSender from '../models/GlobalSender.js';

import {
  listSessionsDetailedWithDisk,
  destroyAndRemoveSession,
} from '../whatsapp/client.js';

const r = Router();

// إعدادات قابلة للتعديل
const SESSION_STALE_HOURS = Number(process.env.SESSION_STALE_HOURS || 6);
const T_STALE_MS = SESSION_STALE_HOURS * 60 * 60 * 1000;

/** Helper: build necessary set from DB */
async function computeNecessaryClientIds() {
  const necessary = new Set();
  const reasons = new Map();

  const now = Date.now();

  // 1) default
  necessary.add('codinovo');
  reasons.set('codinovo', ['DEFAULT']);

  // 2) enabled GlobalSenders
  const globals = await GlobalSender.find({ enabled: true }, { clientId: 1 }).lean();
  for (const g of globals) {
    if (!g?.clientId) continue;
    necessary.add(g.clientId);
    const arr = reasons.get(g.clientId) || [];
    arr.push('GLOBAL_ENABLED');
    reasons.set(g.clientId, arr);
  }

  // 3) DedicatedOrder ASSIGNED / ACTIVE
  const orders = await DedicatedOrder.find(
    { status: { $in: ['ASSIGNED','ACTIVE'] }, assignedClientId: { $nin: [null, ''] } },
    { assignedClientId: 1, status: 1 }
  ).lean();
  for (const o of orders) {
    const id = o.assignedClientId;
    if (!id) continue;
    necessary.add(id);
    const arr = reasons.get(id) || [];
    arr.push(o.status === 'ASSIGNED' ? 'ORDER_ASSIGNED' : 'ORDER_ACTIVE');
    reasons.set(id, arr);
  }

  // 4) ApiUser with active subscription
  const users = await ApiUser.find(
    { dedicatedClientId: { $nin: [null, ''] }, dedicatedActiveUntil: { $gt: new Date(now) } },
    { dedicatedClientId: 1 }
  ).lean();
  for (const u of users) {
    const id = u.dedicatedClientId;
    necessary.add(id);
    const arr = reasons.get(id) || [];
    arr.push('USER_ACTIVE');
    reasons.set(id, arr);
  }

  return { necessary, reasons };
}

/** GET /admin/sessions/sweep
 * يعمل فحص شامل ويصنف الجلسات: necessary / review / suggestedDeletes
 */
r.get('/sweep', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const now = Date.now();
    const { necessary, reasons } = await computeNecessaryClientIds();
    const detailed = listSessionsDetailedWithDisk();

    const foundIds = detailed.map(s => s.clientId);
    const necessaryIds = [];
    const reviewIds = [];
    const suggestedDeletes = [];
    const danglingIds = []; // not necessary

    for (const s of detailed) {
      const id = s.clientId;
      const isNecessary = necessary.has(id);
      const metaReasons = reasons.get(id) || [];

      const lastEventAt = s.lastEventAt || 0;
      const lastReadyAt = s.lastReadyAt || 0;
      const sinceEvent = lastEventAt ? (now - lastEventAt) : Infinity;
      const sinceReady = lastReadyAt ? (now - lastReadyAt) : Infinity;

      const isZombie = s.onDisk && s.default !== true && s.ready === false && s.lastEventAt == null;
      const errorStuck = !!s.lastError && sinceEvent >= T_STALE_MS;
      const notReadyStale = !s.ready && sinceEvent >= T_STALE_MS && sinceReady >= T_STALE_MS;

      if (isNecessary) {
        necessaryIds.push({
          clientId: id,
          reasons: metaReasons,
          ready: s.ready,
          lastError: s.lastError || null,
          lastReadyAt: s.lastReadyAt,
          lastEventAt: s.lastEventAt,
          onDisk: s.onDisk,
          diskSize: s.diskSize,
          diskMtime: s.diskMtime,
        });
        continue;
      }

      // Not necessary
      const itemBase = {
        clientId: id,
        reasons: [],
        ready: s.ready,
        lastError: s.lastError || null,
        lastReadyAt: s.lastReadyAt,
        lastEventAt: s.lastEventAt,
        onDisk: s.onDisk,
        diskSize: s.diskSize,
        diskMtime: s.diskMtime,
      };
      danglingIds.push(itemBase);

      // Classify:
      const recentActivity = (sinceEvent < T_STALE_MS) || (sinceReady < T_STALE_MS);
      if (recentActivity) {
        reviewIds.push({ ...itemBase, reasons: ['RECENT_ACTIVITY'] });
        continue;
      }

      if (isZombie) {
        suggestedDeletes.push({ ...itemBase, reasons: ['ZOMBIE'] });
        continue;
      }
      if (errorStuck) {
        suggestedDeletes.push({ ...itemBase, reasons: ['ERROR_STUCK'] });
        continue;
      }
      if (notReadyStale) {
        suggestedDeletes.push({ ...itemBase, reasons: ['STALE'] });
        continue;
      }

      // default to REVIEW if none matched strictly
      reviewIds.push({ ...itemBase, reasons: ['REVIEW'] });
    }

    res.json({
      config: { SESSION_STALE_HOURS },
      counts: {
        found: foundIds.length,
        necessary: necessaryIds.length,
        review: reviewIds.length,
        suggestedDeletes: suggestedDeletes.length,
        dangling: danglingIds.length,
      },
      necessaryIds,
      reviewIds,
      suggestedDeletes,
      danglingIds,
    });
  } catch (err) { next(err); }
});

/** POST /admin/sessions/delete-many
 * body: { ids: string[] }
 * - يمنع حذف الضروري/الافتراضي
 * - يوقف ويمسح الذاكرة + مجلد LocalAuth
 * - يُنظّف DB: GlobalSender, DedicatedOrder (غير الضرورية), ApiUser (اشتراك منتهي)
 */
r.post('/delete-many', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    if (!ids.length) return res.status(400).json({ error: 'ids_required' });

    const { necessary } = await computeNecessaryClientIds();
    const results = [];
    const now = Date.now();

    for (const id of ids) {
      const out = { clientId: id, ok: false, skipped: false, reason: null, changes: { memoryStopped: false, diskRemoved: false, db: { globalSenderDeleted: 0, ordersUnassigned: 0, usersCleared: 0 } } };

      // safety checks
      if (!id || id === 'codinovo') {
        out.skipped = true;
        out.reason = 'cannot_delete_default';
        results.push(out);
        continue;
      }
      if (necessary.has(id)) {
        out.skipped = true;
        out.reason = 'session_is_necessary';
        results.push(out);
        continue;
      }

      // 1) Destroy memory + remove LocalAuth
      try {
        await destroyAndRemoveSession(id, { deleteAuthFolder: true });
        out.changes.memoryStopped = true;
        out.changes.diskRemoved = true; // destroyAndRemoveSession حذف المجلد
      } catch (e) {
        // نكمل تنظيف DB حتى لو فشل التدمير (قد يكون غير موجود أصلاً)
      }

      // 2) DB cleanup

      // 2.a) GlobalSender: حذف الوثيقة إن وجدت
      const gsDel = await GlobalSender.deleteOne({ clientId: id });
      out.changes.db.globalSenderDeleted = gsDel?.deletedCount ? 1 : 0;

      // 2.b) DedicatedOrder: تفريغ الـassignedClientId للأوردرات غير الضرورية فقط
      const ordRes = await DedicatedOrder.updateMany(
        { assignedClientId: id, status: { $nin: ['ASSIGNED','ACTIVE'] } },
        { $set: { assignedClientId: null, assignedSenderPhone: '' } }
      );
      out.changes.db.ordersUnassigned = ordRes?.modifiedCount || 0;

      // 2.c) ApiUser: إزالة الربط لو الاشتراك منتهي
      const userRes = await ApiUser.updateMany(
        {
          dedicatedClientId: id,
          $or: [
            { dedicatedActiveUntil: { $exists: false } },
            { dedicatedActiveUntil: { $eq: null } },
            { dedicatedActiveUntil: { $lte: new Date(now) } },
          ],
        },
        { $set: { dedicatedClientId: null, dedicatedSenderPhone: '' } }
      );
      out.changes.db.usersCleared = userRes?.modifiedCount || 0;

      out.ok = true;
      results.push(out);
    }

    const summary = {
      requested: ids.length,
      deletedOk: results.filter(x => x.ok).length,
      skipped: results.filter(x => x.skipped).length,
      dbTotals: results.reduce((acc, r) => {
        acc.globalSenderDeleted += r.changes.db.globalSenderDeleted || 0;
        acc.ordersUnassigned += r.changes.db.ordersUnassigned || 0;
        acc.usersCleared += r.changes.db.usersCleared || 0;
        return acc;
      }, { globalSenderDeleted: 0, ordersUnassigned: 0, usersCleared: 0 }),
    };

    res.json({ summary, results });
  } catch (err) { next(err); }
});

export default r;