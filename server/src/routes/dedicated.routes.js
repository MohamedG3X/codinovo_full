//dedicated.routes.js
import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

import ApiUser from '../models/ApiUser.js';
import DedicatedOrder from '../models/DedicatedOrder.js';
import WalletTransaction from '../models/WalletTransaction.js';

import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { ensureClient, getSession, isClientReady } from '../whatsapp/client.js';

const r = Router();

/* ---------- uploads: company logo ---------- */
const logosDir = path.join(process.cwd(), 'uploads', 'company-logos');
if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true });
const upload = multer({ dest: logosDir });

/* ---------------------------------------------------------------------------
 * USER ROUTES (mounted at /api/dedicated)
 * ------------------------------------------------------------------------- */

/** POST /api/dedicated/order */
r.post('/order', requireAuth, async (req, res, next) => {
  try {
    const { companyName = '', companyDescription = '' } = req.body || {};
    const apiUserId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(apiUserId)) {
      return res.status(400).json({ error: 'invalid_user' });
    }

    const existingActive = await DedicatedOrder.findOne({
      apiUser: apiUserId,
      status: { $in: ['PENDING', 'ASSIGNED', 'ACTIVE'] }
    });

    if (existingActive) {
      return res.status(409).json({ error: 'order_already_exists' });
    }

    const order = await DedicatedOrder.create({
      apiUser: apiUserId,
      companyName: companyName.trim(),
      companyDescription: companyDescription.trim(),
      status: 'PENDING',
      priceUSD: 20
    });

    res.json({ ok: true, order });
  } catch (err) { next(err); }
});

/** POST /api/dedicated/order/logo */
r.post('/order/logo', requireAuth, upload.single('logo'), async (req, res, next) => {
  try {
    const apiUserId = req.user.id;
    const order = await DedicatedOrder.findOne({ apiUser: apiUserId }).sort({ createdAt: -1 });
    if (!order) return res.status(404).json({ error: 'order_not_found' });

    order.companyLogoPath = req.file?.path || '';
    await order.save();
    res.json({ ok: true, order });
  } catch (err) { next(err); }
});

/** GET /api/dedicated/my */
r.get('/my', requireAuth, async (req, res, next) => {
  try {
    const apiUserId = req.user.id;
    const order = await DedicatedOrder.findOne({ apiUser: apiUserId }).sort({ createdAt: -1 }).lean();
    const user = await ApiUser.findById(apiUserId).lean();

    const now = Date.now();
    const activeUntil = user?.dedicatedActiveUntil ? new Date(user.dedicatedActiveUntil).getTime() : 0;
    const isActive = !!(user?.dedicatedClientId && activeUntil > now);

    res.json({
      order,
      subscription: {
        clientId: user?.dedicatedClientId || null,
        senderPhone: user?.dedicatedSenderPhone || '',
        activeUntil: user?.dedicatedActiveUntil || null,
        active: isActive
      }
    });
  } catch (err) { next(err); }
});

/** POST /api/dedicated/renew */
r.post('/renew', requireAuth, async (req, res, next) => {
  try {
    const apiUserId = req.user.id;

    const order = await DedicatedOrder.findOne({ apiUser: apiUserId }).sort({ createdAt: -1 });
    if (!order) return res.status(404).json({ error: 'no_order_found' });
    if (!order.assignedClientId) {
      return res.status(409).json({ error: 'not_assigned_yet' });
    }

    const user = await ApiUser.findById(apiUserId);
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    const cost = Number(order.priceUSD || 20);
    if ((user.walletBalance || 0) < cost) {
      return res.status(402).json({ error: 'insufficient_balance_for_renew', need: cost, have: Number(user.walletBalance || 0) });
    }

    user.walletBalance = Number(user.walletBalance || 0) - cost;

    const base = (user.dedicatedActiveUntil && new Date(user.dedicatedActiveUntil).getTime() > Date.now())
      ? new Date(user.dedicatedActiveUntil).getTime()
      : Date.now();

    const until = new Date(base + 30 * 24 * 60 * 60 * 1000);

    user.dedicatedClientId = order.assignedClientId;
    user.dedicatedSenderPhone = order.assignedSenderPhone || user.dedicatedSenderPhone || '';
    user.dedicatedActiveUntil = until;
    await user.save();

    order.expiresAt = until;
    order.status = 'ACTIVE';
    if (!order.activatedAt) order.activatedAt = new Date();
    await order.save();

    try {
      await WalletTransaction.create({
        apiUser: user._id,
        type: 'SUBSCRIPTION_RENEW',
        amount: cost,
        status: 'APPROVED',
        description: 'Dedicated number renewal (30 days)',
      });
    } catch (_) {}

    ensureClient(order.assignedClientId);

    res.json({
      ok: true,
      subscription: {
        clientId: user.dedicatedClientId,
        senderPhone: user.dedicatedSenderPhone,
        activeUntil: user.dedicatedActiveUntil,
        active: true
      },
      order
    });
  } catch (err) { next(err); }
});

/* ---------------------------------------------------------------------------
 * ADMIN ROUTES (mounted at /admin/dedicated)
 * ------------------------------------------------------------------------- */

/** GET /admin/dedicated/orders?status= */
r.get('/orders', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const status = String(req.query?.status || '').toUpperCase();
    const allowed = ['PENDING', 'ASSIGNED', 'ACTIVE', 'EXPIRED', 'CANCELLED'];
    const q = allowed.includes(status) ? { status } : {};

    const items = await DedicatedOrder.find(q).populate('apiUser').sort({ createdAt: -1 }).lean();

    const out = items.map(o => {
      const clientId = o.assignedClientId || null;
      const sess = clientId ? getSession(clientId) : null;
      const sessionReady = !!sess?.ready;

      const userActiveUntil = o.apiUser?.dedicatedActiveUntil ? new Date(o.apiUser.dedicatedActiveUntil).getTime() : 0;
      const stillWithinSub = userActiveUntil > Date.now();

      const usingDedicated = !!(clientId && sessionReady && stillWithinSub);
      const liveRoute = usingDedicated ? 'DEDICATED' : 'GLOBAL';

      // Action flags (match rules above)
      let canAssign=false, canReassign=false, canActivate=false, canRenew=false, canExpire=false;

      switch (o.status) {
        case 'PENDING':
          canAssign = true;
          break;

        case 'ASSIGNED':
          canReassign = !!clientId && !sessionReady;
          canActivate = !!clientId && sessionReady;
          canExpire = true; // allowed, not a paid period yet
          break;

        case 'ACTIVE':
          canReassign = !!clientId && !sessionReady;
          canRenew = !!clientId;
          // expire only if not healthy+valid
          canExpire = !stillWithinSub || !sessionReady;
          break;

        case 'EXPIRED':
          canRenew = !!clientId;
          break;

        default:
          // CANCELLED or unknown -> all false
          break;
      }

      return {
        ...o,
        _id: String(o._id),
        user: o.apiUser ? {
          id: String(o.apiUser._id),
          username: o.apiUser.username,
          walletBalance: o.apiUser.walletBalance ?? 0,
        } : null,
        session: {
          clientId,
          ready: sessionReady,
          lastError: sess?.lastError || null,
          hasQR: !!sess?.hasQR,
        },
        liveRoute,
        canAssign,
        canReassign,
        canActivate,
        canRenew,
        canExpire,
      };
    });

    res.json(out);
  } catch (err) { next(err); }
});

/** POST /admin/dedicated/:orderId/assign */
r.post('/:orderId/assign', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { clientId, senderPhone } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ error: 'invalid_order_id' });
    if (!clientId) return res.status(400).json({ error: 'clientId_required' });

    const order = await DedicatedOrder.findById(orderId);
    if (!order) return res.status(404).json({ error: 'order_not_found' });

    if (order.status !== 'PENDING') {
      if (order.assignedClientId) {
        if (isClientReady(order.assignedClientId)) return res.status(409).json({ error: 'already_assigned_active' });
        return res.status(409).json({ error: 'use_reassign' });
      }
      return res.status(409).json({ error: 'assign_only_when_pending' });
    }

    order.assignedClientId = String(clientId).trim();
    order.assignedSenderPhone = String(senderPhone || '').replace(/\D/g, '');
    order.assignedAt = new Date();
    order.status = 'ASSIGNED';
    await order.save();

    ensureClient(order.assignedClientId);
    res.json({ ok: true, order, message: 'Assigned. Scan QR in server logs to finish login.' });
  } catch (err) { next(err); }
});

/** POST /admin/dedicated/:orderId/reassign */
/** POST /admin/dedicated/:orderId/reassign
 *   Body: { clientId, senderPhone }
 *   Swap the WhatsApp session backing this order.
 *   IMPORTANT:
 *   - If the order is ACTIVE (paid), KEEP it ACTIVE (no $20 again).
 *   - Update the user's dedicated mapping if the subscription is still active.
 *   - Do not force QR here; ensureClient() will initialize and print QR in logs if needed.
 */
r.post('/:orderId/reassign', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { clientId, senderPhone } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'invalid_order_id' });
    }
    if (!clientId) return res.status(400).json({ error: 'clientId_required' });

    const order = await DedicatedOrder.findById(orderId);
    if (!order) return res.status(404).json({ error: 'order_not_found' });

    if (!order.assignedClientId) {
      return res.status(409).json({ error: 'not_assigned_yet' });
    }

    // Only allow reassign if current session is NOT ready OR admin wants to force move.
    // (If you want to require "broken only", uncomment the readiness check below.)
    // const currentReady = isClientReady(order.assignedClientId);
    // if (currentReady) return res.status(409).json({ error: 'cannot_reassign_healthy_session' });

    // Swap to the new client/session
    order.assignedClientId = String(clientId).trim();
    order.assignedSenderPhone = String(senderPhone || '').replace(/\D/g, '');
    order.assignedAt = new Date();

    // >>> DO NOT DOWNGRADE ACTIVE TO ASSIGNED <<<
    // Keep whatever it was (ACTIVE remains ACTIVE; ASSIGNED remains ASSIGNED)
    // No second activation or extra $20.
    await order.save();

    // If the user has a still-active subscription, point them to the new client immediately
    const user = await ApiUser.findById(order.apiUser);
    if (user && user.dedicatedActiveUntil && new Date(user.dedicatedActiveUntil).getTime() > Date.now()) {
      user.dedicatedClientId = order.assignedClientId;
      if (order.assignedSenderPhone) {
        user.dedicatedSenderPhone = order.assignedSenderPhone;
      }
      await user.save();
    }

    // Initialize new WA session (QR will show in logs if needed)
    ensureClient(order.assignedClientId);

    res.json({
      ok: true,
      order,
      message: 'Reassigned. If login is required, scan the QR in server logs. Subscription status unchanged.'
    });
  } catch (err) {
    next(err);
  }
});

/** POST /admin/dedicated/:orderId/activate */
r.post('/:orderId/activate', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ error: 'invalid_order_id' });

    const order = await DedicatedOrder.findById(orderId);
    if (!order) return res.status(404).json({ error: 'order_not_found' });
    if (!order.assignedClientId) return res.status(409).json({ error: 'assign_first' });
    if (!isClientReady(order.assignedClientId)) return res.status(409).json({ error: 'scan_qr_before_activation' });

    const user = await ApiUser.findById(order.apiUser);
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    const cost = Number(order.priceUSD || 20);
    if ((user.walletBalance || 0) < cost) {
      return res.status(402).json({ error: 'insufficient_balance_for_activation', need: cost });
    }

    user.walletBalance = Number(user.walletBalance || 0) - cost;

    const clientId = order.assignedClientId;
    const senderPhone = order.assignedSenderPhone || '';
    const now = new Date();
    const until = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    user.dedicatedClientId = clientId;
    user.dedicatedSenderPhone = senderPhone;
    user.dedicatedActiveUntil = until;
    await user.save();

    order.activatedAt = now;
    order.expiresAt = until;
    order.status = 'ACTIVE';
    await order.save();

    ensureClient(clientId);

    res.json({ ok: true, order, subscription: { clientId, senderPhone, activeUntil: until } });
  } catch (err) { next(err); }
});

/** POST /admin/dedicated/:orderId/renew */
r.post('/:orderId/renew', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ error: 'invalid_order_id' });

    const order = await DedicatedOrder.findById(orderId);
    if (!order) return res.status(404).json({ error: 'order_not_found' });

    const user = await ApiUser.findById(order.apiUser);
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    const cost = Number(order.priceUSD || 20);
    if ((user.walletBalance || 0) < cost) {
      return res.status(402).json({ error: 'insufficient_balance_for_renew', need: cost });
    }

    user.walletBalance = Number(user.walletBalance || 0) - cost;

    const base = (user.dedicatedActiveUntil && new Date(user.dedicatedActiveUntil).getTime() > Date.now())
      ? new Date(user.dedicatedActiveUntil).getTime()
      : Date.now();

    const until = new Date(base + 30 * 24 * 60 * 60 * 1000);

    user.dedicatedActiveUntil = until;
    await user.save();

    order.expiresAt = until;
    order.status = 'ACTIVE';
    if (!order.activatedAt) order.activatedAt = new Date();
    await order.save();

    try {
      await WalletTransaction.create({
        apiUser: user._id,
        type: 'SUBSCRIPTION_RENEW',
        amount: cost,
        status: 'APPROVED',
        description: 'Dedicated number renewal (30 days)',
      });
    } catch (_) {}

    ensureClient(order.assignedClientId);

    res.json({
      ok: true,
      order,
      subscription: {
        clientId: user.dedicatedClientId,
        senderPhone: user.dedicatedSenderPhone,
        activeUntil: until
      }
    });
  } catch (err) { next(err); }
});

/** POST /admin/dedicated/:orderId/expire */
r.post('/:orderId/expire', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ error: 'invalid_order_id' });

    const order = await DedicatedOrder.findById(orderId);
    if (!order) return res.status(404).json({ error: 'order_not_found' });

    const user = await ApiUser.findById(order.apiUser);
    const now = Date.now();
    const stillWithinSub = user?.dedicatedActiveUntil && new Date(user.dedicatedActiveUntil).getTime() > now;

    if (stillWithinSub && order.assignedClientId && isClientReady(order.assignedClientId)) {
      return res.status(409).json({ error: 'cannot_expire_healthy_subscription' });
    }

    if (user) {
      user.dedicatedActiveUntil = new Date(now - 1000);
      await user.save();
    }

    order.expiresAt = new Date();
    order.status = 'EXPIRED';
    await order.save();

    res.json({ ok: true, order });
  } catch (err) { next(err); }
});

/** POST /admin/dedicated/:orderId/cancel */
r.post('/:orderId/cancel', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ error: 'invalid_order_id' });

    const order = await DedicatedOrder.findById(orderId);
    if (!order) return res.status(404).json({ error: 'order_not_found' });

    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    await order.save();

    res.json({ ok: true, order });
  } catch (err) { next(err); }
});

export default r;