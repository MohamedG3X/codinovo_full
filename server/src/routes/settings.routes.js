// server/src/routes/settings.routes.js
import { Router } from 'express';
import crypto from 'crypto';

import ApiUser from '../models/ApiUser.js';
import OtpLog from '../models/OtpLog.js';
import { requireAuth, requireApiUser } from '../middleware/auth.js';

const r = Router();

/* ------------------------- helpers ------------------------- */
function startOfWeekMonday(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();               // 0 Sun, 1 Mon, ... 6 Sat
  const diff = x.getDate() - day + (day === 0 ? -6 : 1); // back to Monday
  x.setDate(diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfWeekFrom(start) {
  const e = new Date(start);
  e.setDate(e.getDate() + 7);           // exclusive end (next Monday 00:00)
  return e;
}

/* ===========================================================
   SERVICE TOKEN (Permanent, created once and always visible)
   =========================================================== */

// GET: Always return the token (create if it doesn’t exist)
r.get('/settings/service-token', requireAuth, requireApiUser, async (req, res) => {
  let user = await ApiUser.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  if (!user.serviceToken) {
    user.serviceToken = crypto.randomBytes(32).toString('hex'); // 64 chars
    user.serviceTokenCreatedAt = new Date();
    await user.save();
  }
  res.json({ token: user.serviceToken, createdAt: user.serviceTokenCreatedAt });
});

/* ===========================================================
   OTP TEMPLATE (view / update)
   =========================================================== */

// Get current template
r.get('/settings/otp-template', requireAuth, requireApiUser, async (req, res) => {
  const user = await ApiUser.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'user_not_found' });
  res.json({ otpTemplate: user.otpTemplate || 'Your code is {OTP}' });
});

// Update template (must include {OTP})
r.patch('/settings/otp-template', requireAuth, requireApiUser, async (req, res) => {
  const { otpTemplate } = req.body || {};
  if (!otpTemplate || !otpTemplate.includes('{OTP}')) {
    return res.status(400).json({ error: 'template_must_include_{OTP}' });
  }
  const user = await ApiUser.findByIdAndUpdate(
    req.user.id,
    { otpTemplate },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'user_not_found' });
  res.json({ otpTemplate: user.otpTemplate });
});

/* ===========================================================
   BILLING: amount due this week (messages × price)
   =========================================================== */

// GET /api/billing/due-this-week
r.get('/billing/due-this-week', requireAuth, requireApiUser, async (req, res) => {
  const userId = req.user.id;
  const user = await ApiUser.findById(userId);
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  const weekStart = startOfWeekMonday(new Date());
  const weekEndExclusive = endOfWeekFrom(weekStart);

  const messageCount = await OtpLog.countDocuments({
    apiUser: userId,
    status: 'SENT',
    createdAt: { $gte: weekStart, $lt: weekEndExclusive }
  });

  const amount = Number(((user.pricePerMessage || 0) * messageCount).toFixed(2));

  res.json({
    weekStart,
    weekEnd: new Date(weekEndExclusive.getTime() - 1), // show inclusive end (Sun 23:59:59.999)
    messageCount,
    amount
  });
});

/* ===========================================================
   PROFILE (view / update email only)
   =========================================================== */

// GET /api/settings/profile
r.get('/settings/profile', requireAuth, requireApiUser, async (req, res, next) => {
  try {
    const u = await ApiUser.findById(req.user.id)
      .select('username companyName contactPhone contactEmail applicantPosition createdAt');
    if (!u) return res.status(404).json({ error: 'user_not_found' });

    res.json({
      username: u.username,
      companyName: u.companyName || '',
      contactPhone: u.contactPhone || '',
      contactEmail: u.contactEmail || '',
      applicantPosition: u.applicantPosition || '',
      createdAt: u.createdAt,
    });
  } catch (err) { next(err); }
});

// PATCH /api/settings/profile   { contactEmail }
r.patch('/settings/profile', requireAuth, requireApiUser, async (req, res, next) => {
  try {
    const { contactEmail } = req.body || {};
    const email = (contactEmail || '').trim();

    // simple email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'invalid_email' });
    }

    const u = await ApiUser.findByIdAndUpdate(
      req.user.id,
      { contactEmail: email },
      { new: true, select: 'username companyName contactPhone contactEmail applicantPosition createdAt' }
    );
    if (!u) return res.status(404).json({ error: 'user_not_found' });

    res.json({
      username: u.username,
      companyName: u.companyName || '',
      contactPhone: u.contactPhone || '',
      contactEmail: u.contactEmail || '',
      applicantPosition: u.applicantPosition || '',
      createdAt: u.createdAt,
    });
  } catch (err) { next(err); }
});
r.get('/settings/account', requireAuth, requireApiUser, async (req, res) => {
  const u = await ApiUser.findById(req.user.id).select('username companyName contactPhone contactEmail level totalSent pricePerMessage status isActive').lean();
  if (!u) return res.status(404).json({ error: 'user_not_found' });
  res.json(u);
});


export default r;