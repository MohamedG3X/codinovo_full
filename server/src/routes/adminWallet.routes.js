// server/src/routes/adminWallet.routes.js
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import WalletTopupRequest from '../models/WalletTopupRequest.js';
import ApiUser from '../models/ApiUser.js';
import WalletTransaction from '../models/WalletTransaction.js';

const r = Router();

// list pending topups
r.get('/wallet-requests', requireAuth, requireAdmin, async (req, res) => {
  const requests = await WalletTopupRequest.find().populate('apiUser', 'username companyName').sort({ createdAt: -1 });
  res.json(requests);
});

// approve topup
r.post('/wallet-requests/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  const request = await WalletTopupRequest.findById(req.params.id);
  if (!request || request.status !== 'PENDING') return res.status(400).json({ error: 'invalid_request' });

  const user = await ApiUser.findById(request.apiUser);
  user.walletBalance += request.amount;
  await user.save();

  await WalletTransaction.create({
    apiUser: user._id,
    type: 'DEPOSIT',
    amount: request.amount,
    description: `Top-up approved by admin`
  });

  request.status = 'APPROVED';
  await request.save();

  res.json({ ok: true });
});

export default r;