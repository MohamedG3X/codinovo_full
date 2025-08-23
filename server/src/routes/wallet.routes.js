// server/src/routes/wallet.routes.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, requireApiUser } from '../middleware/auth.js';
import WalletTransaction from '../models/WalletTransaction.js';
import ApiUser from '../models/ApiUser.js';

const proofDir = path.join(process.cwd(), 'uploads', 'wallet_proofs');
if (!fs.existsSync(proofDir)) fs.mkdirSync(proofDir, { recursive: true });

const upload = multer({
  dest: proofDir,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error('invalid_file_type'));
  }
});

const r = Router();

// current balance
r.get('/wallet/balance', requireAuth, requireApiUser, async (req, res) => {
  const user = await ApiUser.findById(req.user.id, { walletBalance: 1 });
  if (!user) return res.status(401).json({ error: 'invalid_user' });
  res.json({ balance: Number(user.walletBalance || 0) });
});

// submit manual top-up (with proof)
r.post('/wallet/topup', requireAuth, requireApiUser, upload.single('proof'), async (req, res) => {
  try {
    const { amount, txHash } = req.body || {};
    const amt = Number(amount);

    if (!amt || isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: 'invalid_amount' });
    }
    if (amt < 10) {
      return res.status(400).json({ error: 'min_topup_is_10', min: 10 });
    }

    const tx = await WalletTransaction.create({
      apiUser: req.user.id,
      type: 'DEPOSIT',
      amount: amt,
      status: 'PENDING',
      proofPath: req.file ? req.file.path : null,
      description: txHash ? `User top-up, tx: ${txHash}` : 'User requested top-up',
    });

    res.json({ ok: true, transaction: tx });
  } catch (err) {
    if (String(err?.message) === 'invalid_file_type') {
      return res.status(400).json({ error: 'invalid_file_type' });
    }
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// list my transactions
r.get('/wallet/transactions', requireAuth, requireApiUser, async (req, res) => {
  try {
    const { status } = req.query;
    const q = { apiUser: req.user.id };
    if (status && ['PENDING','APPROVED','REJECTED','SETTLED'].includes(status)) {
      q.status = status;
    }

    const items = await WalletTransaction
      .find(q)
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ data: items });
  } catch (err) {
    console.error('wallet/transactions error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

// refresh (no auto-approval; just return latest balance + txs)
r.post('/wallet/refresh', requireAuth, requireApiUser, async (req, res) => {
  try {
    const user = await ApiUser.findById(req.user.id, { walletBalance: 1 });
    const items = await WalletTransaction
      .find({ apiUser: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      ok: true,
      balance: Number(user?.walletBalance || 0),
      transactions: items,
    });
  } catch (e) {
    console.error('[wallet/refresh] error:', e);
    res.status(500).json({ ok: false });
  }
});

export default r;
