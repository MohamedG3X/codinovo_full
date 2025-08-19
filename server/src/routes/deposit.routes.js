// server/src/routes/deposit.routes.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, requireAdmin, requireApiUser } from '../middleware/auth.js';
import DepositConfig from '../models/DepositConfig.js';

const r = Router();

// Ensure upload dir
const dir = path.join(process.cwd(), 'uploads', 'deposit');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Multer (accept image for QR and a PDF guide)
const upload = multer({
  dest: dir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true); // QR image
    if (file.mimetype === 'application/pdf') return cb(null, true); // PDF
    cb(new Error('invalid_file_type'));
  }
});

// ---------- Admin: get current config ----------
r.get('/admin/deposit', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const config = await DepositConfig.findOne().lean();
    res.json(config || null);
  } catch (err) { next(err); }
});

// ---------- Admin: update config (with optional files) ----------
r.post(
  '/admin/deposit',
  requireAuth,
  requireAdmin,
  upload.fields([{ name: 'qr', maxCount: 1 }, { name: 'guide', maxCount: 1 }]),
  async (req, res, next) => {
    try {
      const { address, network, minAmount } = req.body || {};
      if (!address) return res.status(400).json({ error: 'address_required' });

      const update = {
        address: String(address),
        network: network ? String(network) : 'BNB Chain',
        minAmount: Number(minAmount) || 1
      };
      const qr = req.files?.qr?.[0];
      const guide = req.files?.guide?.[0];
      if (qr) update.qrPath = qr.path;
      if (guide) update.guidePdfPath = guide.path;

      let cfg = await DepositConfig.findOne();
      if (!cfg) cfg = await DepositConfig.create(update);
      else {
        Object.assign(cfg, update);
        await cfg.save();
      }

      res.json(cfg);
    } catch (err) {
      if (String(err?.message) === 'invalid_file_type') {
        return res.status(400).json({ error: 'invalid_file_type' });
      }
      next(err);
    }
  }
);

// ---------- API user: public deposit info ----------
r.get('/api/deposit', requireAuth, requireApiUser, async (_req, res, next) => {
  try {
    const cfg = await DepositConfig.findOne().lean();
    if (!cfg) return res.json(null);
    // Build public URLs
    const toUrl = (p) => (p ? `/uploads/${p.split('uploads/')[1]}` : null);
    res.json({
      address: cfg.address,
      network: cfg.network || 'BNB Chain',
      minAmount: Number(cfg.minAmount || 1),
      qrUrl: toUrl(cfg.qrPath),
      guideUrl: toUrl(cfg.guidePdfPath)
    });
  } catch (err) { next(err); }
});

export default r;