// server/src/routes/adminWallet.routes.js
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import ApiUser from '../models/ApiUser.js';
import WalletTransaction from '../models/WalletTransaction.js';

const r = Router();

/**
 * List PENDING wallet top-ups (manual uploads AND Kashier HPP)
 * We return WalletTransaction documents with status=PENDING and type=DEPOSIT.
 */
r.get('/wallet/topups', requireAuth, requireAdmin, async (_req, res) => {
  const items = await WalletTransaction
    .find({ type: 'DEPOSIT', status: 'PENDING' })
    .sort({ createdAt: -1 })
    .lean();

  // Hydrate with basic user info
  const userIds = [...new Set(items.map(i => String(i.apiUser)))];
  const users = await ApiUser.find(
    { _id: { $in: userIds } },
    { username: 1, companyName: 1 }
  ).lean();
  const userMap = new Map(users.map(u => [String(u._id), u]));

  const result = items.map(i => ({
    ...i,
    apiUser: userMap.get(String(i.apiUser)) || { username: '—' },
  }));

  res.json(result);
});

/**
 * Approve a pending topup (credits user's wallet and marks tx APPROVED)
 */
r.post('/wallet/topups/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  const tx = await WalletTransaction.findById(req.params.id);
  if (!tx || tx.type !== 'DEPOSIT' || tx.status !== 'PENDING') {
    return res.status(400).json({ error: 'invalid_transaction' });
  }

  await ApiUser.updateOne({ _id: tx.apiUser }, { $inc: { walletBalance: Number(tx.amount || 0) } });
  tx.status = 'APPROVED';
  tx.description = `${tx.description || 'Top-up'} • approved by admin`;
  await tx.save();

  res.json({ ok: true });
});

/**
 * Reject a pending topup (marks tx REJECTED; no balance change)
 */
r.post('/wallet/topups/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  const tx = await WalletTransaction.findById(req.params.id);
  if (!tx || tx.type !== 'DEPOSIT' || tx.status !== 'PENDING') {
    return res.status(400).json({ error: 'invalid_transaction' });
  }

  tx.status = 'REJECTED';
  tx.description = `${tx.description || 'Top-up'} • rejected by admin`;
  await tx.save();

  res.json({ ok: true });
});

export default r;
