import mongoose from 'mongoose';
import { Router } from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import PricingConfig from '../models/PricingConfig.js';

import WalletTransaction from '../models/WalletTransaction.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import ApiUser from '../models/ApiUser.js';
import Invoice from '../models/Invoice.js';
import OtpLog from '../models/OtpLog.js';

const r = Router();

// ---------- uploads for invoice proofs ----------
const transferDir = path.join(process.cwd(), 'uploads', 'transfers');
if (!fs.existsSync(transferDir)) fs.mkdirSync(transferDir, { recursive: true });
const upload = multer({ dest: transferDir });

const isYMD = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

/* ----------------- helper: tier price by level ----------------- */
async function getTierPriceForLevel(level) {
  const lvl = Number(level) || 1;
  let cfg = await PricingConfig.findOne().lean();
  if (!cfg) {
    cfg = { level1Price: 1.0, level2Price: 0.8, level3Price: 0.6 };
  }
  if (lvl === 3) return Number(cfg.level3Price ?? 0.6);
  if (lvl === 2) return Number(cfg.level2Price ?? 0.8);
  return Number(cfg.level1Price ?? 1.0);
}

/* -------------------- Users -------------------- */

// Create API user  -> POST /admin/users
// pricePerMessage is derived from level (default level=1)
r.post('/users', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { username, password, companyName } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username_and_password_required' });

    const exists = await ApiUser.findOne({ username });
    if (exists) return res.status(409).json({ error: 'username_taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const level = 1;
    const pricePerMessage = await getTierPriceForLevel(level);

    const user = await ApiUser.create({
      username,
      passwordHash,
      companyName: companyName || '',
      level,
      pricePerMessage,
    });
    res.json(user);
  } catch (err) { next(err); }
});

// List API users   -> GET /admin/users
r.get('/users', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const users = await ApiUser.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { next(err); }
});

// Update user -> PATCH /admin/users/:id
// pricePerMessage is NOT editable here; it’s tied to level
r.patch('/users/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { isActive, otpTemplate, status } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'invalid_user_id' });
    }

    const updates = {};
    if (otpTemplate !== undefined) updates.otpTemplate = otpTemplate;

    if (status && ['PENDING', 'ACTIVE', 'PAUSED'].includes(status)) {
      updates.status = status;
      updates.isActive = status === 'ACTIVE';
    } else if (isActive !== undefined) {
      updates.isActive = !!isActive;
      updates.status = !!isActive ? 'ACTIVE' : 'PAUSED';
    }

    const user = await ApiUser.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Approve user -> price from current level
r.post('/users/:id/approve', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'invalid_user_id' });
    }

    const userDoc = await ApiUser.findById(req.params.id);
    if (!userDoc) return res.status(404).json({ error: 'user_not_found' });

    const price = await getTierPriceForLevel(userDoc.level || 1);

    userDoc.status = 'ACTIVE';
    userDoc.isActive = true;
    userDoc.pricePerMessage = price;
    await userDoc.save();

    return res.json({ ok: true, user: userDoc.toObject() });
  } catch (err) { next(err); }
});

// Reject user -> PAUSED
r.post('/users/:id/reject', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'invalid_user_id' });
    }

    const user = await ApiUser.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'PAUSED', isActive: false } },
      { new: true }
    ).lean();

    if (!user) return res.status(404).json({ error: 'user_not_found' });
    return res.json({ ok: true, user });
  } catch (err) { next(err); }
});

// Full user profile for admin
r.get('/users/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'invalid_user_id' });
    }

    const u = await ApiUser.findById(req.params.id)
      .select('username companyName contactPhone contactEmail applicantPosition createdAt updatedAt status isActive pricePerMessage walletBalance level totalSent')
      .lean();

    if (!u) return res.status(404).json({ error: 'user_not_found' });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const messagesThisMonth = await OtpLog.countDocuments({
      apiUser: req.params.id,
      status: 'SENT',
      createdAt: { $gte: monthStart, $lte: now }
    });

    res.json({
      user: u,
      stats: { messagesThisMonth }
    });
  } catch (err) { next(err); }
});

/* -------------------- Invoices -------------------- */

r.post('/invoices', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { apiUserId, periodStart, periodEnd } = req.body;
    if (!apiUserId || !mongoose.Types.ObjectId.isValid(apiUserId)) {
      return res.status(400).json({ error: 'invalid_apiUserId' });
    }
    if (!isYMD(periodStart) || !isYMD(periodEnd)) {
      return res.status(400).json({ error: 'invalid_date_format', hint: 'Use YYYY-MM-DD' });
    }

    const start = new Date(`${periodStart}T00:00:00`);
    const endExclusive = new Date(`${periodEnd}T00:00:00`);
    if (isNaN(start) || isNaN(endExclusive)) {
      return res.status(400).json({ error: 'invalid_period' });
    }
    endExclusive.setDate(endExclusive.getDate() + 1);

    const user = await ApiUser.findById(apiUserId);
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    const logs = await OtpLog.find({
      apiUser: apiUserId,
      createdAt: { $gte: start, $lt: endExclusive },
      status: 'SENT'
    }).lean();

    const messageCount = logs.length;
    const price = user.pricePerMessage ?? 0;
    const totalAmount = logs.reduce((sum, l) => sum + (l.cost ?? price), 0);

    const inv = await Invoice.create({
      apiUser: apiUserId,
      periodStart: start,
      periodEnd: new Date(endExclusive.getTime() - 1),
      messageCount,
      totalAmount,
      currency: 'USD',
      status: 'ISSUED'
    });

    res.json(inv);
  } catch (err) { next(err); }
});

r.get('/invoices', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const invoices = await Invoice.find().populate('apiUser').sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) { next(err); }
});

r.post('/invoices/:id/proof', requireAuth, requireAdmin, upload.single('proof'), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'invalid_invoice_id' });
    }
    const inv = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status: 'PAID', bankTransferProofPath: req.file?.path || null },
      { new: true }
    );
    if (!inv) return res.status(404).json({ error: 'invoice_not_found' });
    res.json(inv);
  } catch (err) { next(err); }
});

/* -------------------- Stats (Admin Dashboard) -------------------- */

r.get('/stats/overview', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const now = new Date();
    const y = Number(req.query.year) || now.getFullYear();
    const m = Number(req.query.month) || (now.getMonth() + 1);

    const monthStart = new Date(y, m - 1, 1);
    const nextMonthStart = new Date(y, m, 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const users = await ApiUser.find({}, { _id: 1, pricePerMessage: 1, isActive: 1 }).lean();
    const priceMap = new Map(users.map(u => [String(u._id), Number(u.pricePerMessage) || 0]));
    const activeUsers = users.filter(u => u.isActive).length;

    const grouped = await OtpLog.aggregate([
      { $match: { status: 'SENT', createdAt: { $gte: monthStart, $lt: nextMonthStart } } },
      { $group: { _id: '$apiUser', count: { $sum: 1 } } }
    ]);

    const totalMessagesMonth = grouped.reduce((s, g) => s + g.count, 0);
    const revenueMonth = grouped.reduce((s, g) => s + g.count * (priceMap.get(String(g._id)) || 0), 0);

    const totalMessagesToday = await OtpLog.countDocuments({
      status: 'SENT',
      createdAt: { $gte: todayStart }
    });

    res.json({
      month: { year: y, month: m, messages: totalMessagesMonth, revenue: Number(revenueMonth.toFixed(2)) },
      today: { messages: totalMessagesToday },
      users: { total: users.length, active: activeUsers }
    });
  } catch (err) { next(err); }
});

r.get('/stats/users', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const now = new Date();
    const y = Number(req.query.year) || now.getFullYear();
    const m = Number(req.query.month) || (now.getMonth() + 1);
    const monthStart = new Date(y, m - 1, 1);
    const nextMonthStart = new Date(y, m, 1);

    const users = await ApiUser.find(
      {},
      {
        username: 1,
        companyName: 1,
        isActive: 1,
        status: 1,
        pricePerMessage: 1,
        contactPhone: 1,
        applicantPosition: 1,
        level: 1,
        totalSent: 1,
      }
    ).lean();

    const counts = await OtpLog.aggregate([
      { $match: { status: 'SENT', createdAt: { $gte: monthStart, $lt: nextMonthStart } } },
      { $group: { _id: '$apiUser', count: { $sum: 1 } } }
    ]);
    const map = new Map(counts.map(c => [String(c._id), c.count]));

    const result = users.map(u => ({
      id: String(u._id),
      username: u.username,
      companyName: u.companyName || '',
      contactPhone: u.contactPhone || '',
      applicantPosition: u.applicantPosition || '',
      status: u.status || 'PENDING',
      isActive: !!u.isActive,
      pricePerMessage: Number(u.pricePerMessage) || 0,
      messagesThisMonth: map.get(String(u._id)) || 0,
      level: Number(u.level || 1),
      totalSent: Number(u.totalSent || 0),
    }));

    res.json(result);
  } catch (err) { next(err); }
});

/* -------------------- Wallet Top-ups -------------------- */

r.get('/wallet/topups', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const status = (req.query.status || 'PENDING').toUpperCase();
    const allowed = ['PENDING', 'APPROVED', 'REJECTED'];
    const q = allowed.includes(status) ? { type: 'DEPOSIT', status } : { type: 'DEPOSIT' };

    const items = await WalletTransaction.find(q)
      .populate('apiUser')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { next(err); }
});

r.post('/wallet/topups/:id/approve', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const tx = await WalletTransaction.findById(req.params.id);
    if (!tx || tx.type !== 'DEPOSIT') return res.status(404).json({ error: 'not_found' });
    if (tx.status !== 'PENDING') return res.status(400).json({ error: 'not_pending' });

    tx.status = 'APPROVED';
    await tx.save();

    await ApiUser.findByIdAndUpdate(tx.apiUser, { $inc: { walletBalance: tx.amount } });

    res.json({ ok: true, message: 'Top-up approved and wallet credited' });
  } catch (err) { next(err); }
});

r.post('/wallet/topups/:id/reject', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const tx = await WalletTransaction.findById(req.params.id);
    if (!tx || tx.type !== 'DEPOSIT') return res.status(404).json({ error: 'not_found' });
    if (tx.status !== 'PENDING') return res.status(400).json({ error: 'not_pending' });

    tx.status = 'REJECTED';
    await tx.save();

    res.json({ ok: true, message: 'Top-up rejected' });
  } catch (err) { next(err); }
});

/* -------------------- Pricing tiers (admin configurable) -------------------- */

// GET /admin/tiers
r.get('/tiers', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    let cfg = await PricingConfig.findOne().lean();
    if (!cfg) {
      cfg = await PricingConfig.create({}); // defaults
      cfg = cfg.toObject();
    }
    res.json(cfg);
  } catch (err) { next(err); }
});

// PATCH /admin/tiers   body: { level1Price, level2Price, level3Price, level2Threshold, level3Threshold }
r.patch('/tiers', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const payload = {};
    const allowed = ['level1Price','level2Price','level3Price','level2Threshold','level3Threshold'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) payload[k] = Number(req.body[k]);
    }
    let cfg = await PricingConfig.findOne();
    if (!cfg) cfg = new PricingConfig({});
    Object.assign(cfg, payload);
    await cfg.save();

    res.json({ ok: true, config: cfg });
  } catch (err) { next(err); }
});

// Manual level override (keeps price aligned with tiers)
r.patch('/users/:id/level', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const level = Number(req.body?.level);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'invalid_user_id' });
    }
    if (![1, 2, 3].includes(level)) {
      return res.status(400).json({ error: 'invalid_level' });
    }

    const price = await getTierPriceForLevel(level);

    const user = await ApiUser.findByIdAndUpdate(
      id,
      { $set: { level, pricePerMessage: price } },
      { new: true }
    ).lean();

    if (!user) return res.status(404).json({ error: 'user_not_found' });
    res.json({ ok: true, user });
  } catch (err) { next(err); }
});

export default r;