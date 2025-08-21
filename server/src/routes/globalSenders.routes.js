// server/src/routes/globalSenders.routes.js
import { Router } from 'express';
import mongoose from 'mongoose';
import GlobalSender from '../models/GlobalSender.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  ensureClient,
  getSession,
  restartSession,
  logoutSession,
  globalPoolAdd,
  globalPoolRemove,
} from '../whatsapp/client.js';

const r = Router();

/* List all global senders, with live session status */
r.get('/', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const items = await GlobalSender.find().sort({ createdAt: -1 }).lean();
    const enriched = items.map(g => {
      const s = getSession(g.clientId);
      return {
        ...g,
        _id: String(g._id),
        session: s ? {
          clientId: s.clientId,
          ready: !!s.ready,
          lastError: s.lastError || null,
          hasQR: !!s.hasQR,
        } : { clientId: g.clientId, ready: false, lastError: null, hasQR: false },
      };
    });
    res.json(enriched);
  } catch (err) { next(err); }
});

/* Create a global sender entry */
r.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { clientId, label = '', enabled = true, weight = 1 } = req.body || {};
    if (!clientId) return res.status(400).json({ error: 'clientId_required' });

    const existed = await GlobalSender.findOne({ clientId });
    if (existed) return res.status(409).json({ error: 'clientId_exists' });

    const doc = await GlobalSender.create({ clientId: String(clientId).trim(), label, enabled: !!enabled, weight: Number(weight) || 1 });

    if (doc.enabled) {
      globalPoolAdd(doc.clientId, doc.weight);
      ensureClient(doc.clientId); // initialize; QR will print if not logged in
    }

    res.json({ ok: true, item: doc });
  } catch (err) { next(err); }
});

/* Update label/enabled/weight */
r.patch('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'invalid_id' });

    const payload = {};
    if (req.body.label !== undefined) payload.label = String(req.body.label);
    if (req.body.enabled !== undefined) payload.enabled = !!req.body.enabled;
    if (req.body.weight !== undefined) payload.weight = Math.max(0, Number(req.body.weight) || 0);

    const doc = await GlobalSender.findByIdAndUpdate(id, payload, { new: true });
    if (!doc) return res.status(404).json({ error: 'not_found' });

    // reflect to pool
    if (doc.enabled) {
      globalPoolAdd(doc.clientId, doc.weight);
      ensureClient(doc.clientId);
    } else {
      globalPoolRemove(doc.clientId);
    }

    res.json({ ok: true, item: doc });
  } catch (err) { next(err); }
});

/* Restart a session */
r.post('/:id/restart', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'invalid_id' });
    const doc = await GlobalSender.findById(id);
    if (!doc) return res.status(404).json({ error: 'not_found' });

    await restartSession(doc.clientId);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

/* Logout a session */
r.post('/:id/logout', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'invalid_id' });
    const doc = await GlobalSender.findById(id);
    if (!doc) return res.status(404).json({ error: 'not_found' });

    await logoutSession(doc.clientId);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default r;
