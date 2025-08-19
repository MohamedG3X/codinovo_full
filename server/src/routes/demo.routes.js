// server/src/routes/demo.routes.js
import { Router } from 'express';
import dayjs from 'dayjs';
import DemoOtp from '../models/DemoOtp.js';
import { sendWaMessage } from '../whatsapp/client.js';

const r = Router();

function clientIp(req) {
  const fwd = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req.socket?.remoteAddress || req.ip || 'unknown';
}
function isValidPhone(p) { return typeof p === 'string' && /^\d{10,15}$/.test(p.trim()); }
function genCode() { return Math.floor(100000 + Math.random() * 900000).toString(); }

function todayRange() {
  const start = dayjs().startOf('day').toDate();
  const end = dayjs().endOf('day').toDate();
  return { start, end };
}

// POST /demo/otp/send (no auth) -> limit 2/day per IP
r.post('/otp/send', async (req, res) => {
  try {
    const ip = clientIp(req);
    const phone = String(req.body?.phone || '').trim();
    if (!isValidPhone(phone)) return res.status(400).json({ error: 'invalid_phone' });

    const { start, end } = todayRange();
    const sentToday = await DemoOtp.countDocuments({
      ip, createdAt: { $gte: start, $lte: end }, status: 'SENT'
    });

    const DAILY_LIMIT = 2;
    if (sentToday >= DAILY_LIMIT) {
      return res.status(429).json({ error: 'rate_limited', remaining: 0, limit: DAILY_LIMIT });
    }

    const code = genCode();
    const expiresAt = dayjs().add(5, 'minute').toDate();

    // Try WhatsApp send; if it fails, fall back to console log (still counts)
    const text = `Codinovo demo OTP: ${code} (valid 5m)`;
    try {
      await sendWaMessage(phone, text);
    } catch (e) {
      console.warn('[DEMO] WA send failed; falling back to console:', e?.message || e);
      console.log(`[DEMO] OTP for ${ip}/${phone}: ${code}`);
    }

    await DemoOtp.create({ ip, phone, code, expiresAt, status: 'SENT' });
    const remaining = Math.max(0, DAILY_LIMIT - sentToday - 1);
    return res.json({ ok: true, expiresAt, remaining });
  } catch (err) {
    console.error('DEMO send error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// POST /demo/otp/verify (no auth)
r.post('/otp/verify', async (req, res) => {
  try {
    const ip = clientIp(req);
    const phone = String(req.body?.phone || '').trim();
    const code = String(req.body?.code || '').trim();

    if (!isValidPhone(phone) || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'invalid_input' });
    }

    const rec = await DemoOtp.findOne({ ip, phone, status: 'SENT' })
      .sort({ createdAt: -1 });

    if (!rec) return res.status(404).json({ error: 'not_found' });
    if (dayjs().isAfter(rec.expiresAt)) {
      rec.status = 'FAILED';
      await rec.save();
      return res.status(400).json({ error: 'expired' });
    }
    if (rec.code !== code) {
      rec.status = 'FAILED';
      await rec.save();
      return res.status(400).json({ error: 'wrong_code' });
    }

    rec.status = 'VERIFIED';
    await rec.save();
    return res.json({ ok: true });
  } catch (err) {
    console.error('DEMO verify error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// GET /demo/otp/remaining (no auth) -> how many sends left today from this IP
r.get('/otp/remaining', async (req, res) => {
  try {
    const ip = clientIp(req);
    const { start, end } = todayRange();
    const DAILY_LIMIT = 2;

    const sentToday = await DemoOtp.countDocuments({
      ip, createdAt: { $gte: start, $lte: end }, status: 'SENT'
    });
    const remaining = Math.max(0, DAILY_LIMIT - sentToday);
    res.json({ remaining, limit: DAILY_LIMIT });
  } catch (err) {
    console.error('DEMO remaining error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

export default r;