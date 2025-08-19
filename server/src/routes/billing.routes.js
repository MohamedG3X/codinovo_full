// server/src/routes/billing.routes.js
import { Router } from 'express';
import { requireAuth, requireApiUser } from '../middleware/auth.js';
import OtpLog from '../models/OtpLog.js';
import WalletTransaction from '../models/WalletTransaction.js';
import ApiUser from '../models/ApiUser.js';

const r = Router();

/**
 * 📊 This week's usage & amount due
 */
r.get('/api/billing/due-this-week', requireAuth, requireApiUser, async (req, res) => {
  const user = await ApiUser.findById(req.user.id);
  const price = user?.pricePerMessage ?? 0;

  const now = new Date();
  const day = now.getDay() || 7; // Monday=1..Sunday=7
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (day - 1));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const count = await OtpLog.countDocuments({
    apiUser: req.user.id,
    status: 'SENT',
    createdAt: { $gte: weekStart, $lt: weekEnd }
  });

  res.json({
    weekStart,
    weekEnd,
    messageCount: count,
    amount: Number((count * price).toFixed(2))
  });
});

/**
 * 📅 Monthly wallet transaction report
 */
r.get('/api/billing/monthly-report', requireAuth, requireApiUser, async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const month = Number(req.query.month) || (new Date().getMonth() + 1);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const transactions = await WalletTransaction.find({
    apiUser: req.user.id,
    createdAt: { $gte: start, $lt: end }
  }).sort({ createdAt: -1 });

  const totalDeposits = transactions
    .filter(t => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDeductions = transactions
    .filter(t => t.type === 'DEDUCTION')
    .reduce((sum, t) => sum + t.amount, 0);

  const user = await ApiUser.findById(req.user.id);

  res.json({
    month,
    year,
    balance: user.walletBalance,
    totalDeposits,
    totalDeductions,
    transactions
  });
});

export default r;