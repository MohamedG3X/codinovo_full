// server/src/routes/invoices.routes.js
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAuth, requireApiUser, requireAdmin } from '../middleware/auth.js';
import Invoice from '../models/Invoice.js';
import ApiUser from '../models/ApiUser.js';
import OtpLog from '../models/OtpLog.js';
import { generateInvoicePdf } from '../utils/invoicePdf.js';

const r = Router();

/* ---------------- helpers ---------------- */
function monthRange(y, m){
  const start = new Date(Number(y), Number(m) - 1, 1);
  const endExclusive = new Date(Number(y), Number(m), 1);             // exclusive
  const endInclusive = new Date(endExclusive.getTime() - 1);          // 23:59:59.999
  return { start, endExclusive, endInclusive };
}

// Count messages in a period for a user, supporting models that may have sentAt or only createdAt
async function countMessagesForPeriod(apiUserId, start, endExclusive) {
  const q = {
    apiUser: apiUserId,
    status: 'SENT',
    $or: [
      { sentAt: { $gte: start, $lt: endExclusive } },
      { $and: [
          { sentAt: { $exists: false } },
          { createdAt: { $gte: start, $lt: endExclusive } }
        ]
      }
    ]
  };
  return OtpLog.countDocuments(q);
}

/* ====================== API USER ROUTES ====================== */

// List my invoices (existing)
r.get('/invoices', requireAuth, requireApiUser, async (req, res, next) => {
  try {
    const list = await Invoice.find({ apiUser: req.user.id }).sort({ periodStart: -1 });
    res.json(list);
  } catch (err) { next(err); }
});

// NEW: Get my invoice by month (if it exists)
// GET /api/invoices/by-month?year=2025&month=8
r.get('/invoices/by-month', requireAuth, requireApiUser, async (req, res, next) => {
  try {
    const { year, month } = req.query || {};
    if (!year || !month) return res.status(400).json({ error: 'missing_params' });
    const { start, endInclusive } = monthRange(year, month);

    const inv = await Invoice.findOne({
      apiUser: req.user.id,
      periodStart: start,
      periodEnd: endInclusive
    });

    if (!inv) return res.status(404).json({ error: 'not_found' });
    return res.json(inv);
  } catch (err) { next(err); }
});

// NEW: Let user generate/update own invoice for a month
// POST /api/invoices/generate-my  { year, month }
r.post('/invoices/generate-my', requireAuth, requireApiUser, async (req, res, next) => {
  try {
    const { year, month } = req.body || {};
    if (!year || !month) return res.status(400).json({ error: 'missing_params' });

    const { start, endExclusive, endInclusive } = monthRange(year, month);

    const user = await ApiUser.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    const price = Number(user.pricePerMessage || 0);
    const messages = await countMessagesForPeriod(req.user.id, start, endExclusive);
    const total = Number((messages * price).toFixed(2));

    // Upsert my invoice
    const inv = await Invoice.findOneAndUpdate(
      { apiUser: req.user.id, periodStart: start, periodEnd: endInclusive },
      { messageCount: messages, totalAmount: total, currency: 'USD', status: 'ISSUED' },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Generate PDF if missing
    if (!inv.pdfPath || !fs.existsSync(inv.pdfPath)) {
      inv.pdfPath = await generateInvoicePdf(inv, user);
      await inv.save();
    }

    return res.json(inv);
  } catch (err) { next(err); }
});

/* ---- API USER or ADMIN: download invoice PDF (by id) ---- */
r.get('/invoices/:id/pdf', requireAuth, async (req, res, next) => {
  try {
    const inv = await Invoice.findById(req.params.id).populate('apiUser');
    if (!inv) return res.status(404).json({ error: 'not_found' });

    // Users -> only own; Admin -> any
    if (req.user.type !== 'ADMIN' && String(inv.apiUser._id) !== req.user.id) {
      return res.status(403).json({ error: 'forbidden' });
    }

    if (!inv.pdfPath || !fs.existsSync(inv.pdfPath)) {
      const pdfPath = await generateInvoicePdf(inv, inv.apiUser);
      inv.pdfPath = pdfPath;
      await inv.save();
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice_${inv._id}.pdf"`);
    fs.createReadStream(inv.pdfPath).pipe(res);
  } catch (err) { next(err); }
});

/* ====================== ADMIN ROUTES ====================== */

// List all (existing)
r.get('/admin/invoices', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const list = await Invoice.find({})
      .populate('apiUser', 'username companyName')
      .sort({ periodStart: -1 });
    res.json(list);
  } catch (err) { next(err); }
});

// Create/update for a user+month (existing)
r.post('/invoices/generate', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { apiUserId, year, month } = req.body || {};
    if (!apiUserId || !year || !month) return res.status(400).json({ error: 'missing_params' });

    const { start, endExclusive, endInclusive } = monthRange(year, month);

    const user = await ApiUser.findById(apiUserId);
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    const price = Number(user.pricePerMessage || 0);
    const messages = await countMessagesForPeriod(apiUserId, start, endExclusive);
    const total = Number((messages * price).toFixed(2));

    const inv = await Invoice.findOneAndUpdate(
      { apiUser: apiUserId, periodStart: start, periodEnd: endInclusive },
      { messageCount: messages, totalAmount: total, currency: 'USD', status: 'ISSUED' },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!inv.pdfPath || !fs.existsSync(inv.pdfPath)) {
      inv.pdfPath = await generateInvoicePdf(inv, user);
      await inv.save();
    }

    res.json(inv);
  } catch (err) {
    console.error('Invoice generation error:', err);
    next(err);
  }
});

export default r;