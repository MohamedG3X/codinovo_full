import { Router } from 'express';
import dayjs from 'dayjs';
import ApiUser from '../models/ApiUser.js';
import OtpLog from '../models/OtpLog.js';
import { sendWaMessage } from '../whatsapp/client.js';

// Strict auth: JWT OR X-Service-Token (+ username/password either in Basic-Auth or JSON)
// If you don’t have this file yet, use the one I gave you earlier.
import { requireStrictApiAuth } from '../middleware/strictApiAuth.js';

// Tier thresholds + prices
import PricingConfig from '../models/PricingConfig.js';

const r = Router();

function isValidPhone(p) {
  return typeof p === 'string' && /^\d{10,15}$/.test(p.trim());
}

function genCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function getTierPriceAndCfg(level) {
  const lvl = Number(level) || 1;
  let cfg = await PricingConfig.findOne().lean();
  if (!cfg) {
    cfg = {
      level1Price: 1.0,
      level2Price: 0.8,
      level3Price: 0.6,
      level2Threshold: 1000,
      level3Threshold: 10000
    };
  }
  const price =
    lvl === 3 ? Number(cfg.level3Price ?? 0.6) :
    lvl === 2 ? Number(cfg.level2Price ?? 0.8) :
                Number(cfg.level1Price ?? 1.0);
  return { price, cfg };
}

/**
 * POST /api/otp/send
 * Auth: Bearer JWT OR X-Service-Token + (Basic OR JSON password)
 * Body: { phone }
 */
r.post('/otp/send', requireStrictApiAuth, async (req, res, next) => {
  try {
    if (req.user.type !== 'API') {
      return res.status(403).json({ error: 'API user only' });
    }

    const phone = String(req.body?.phone || '').trim();
    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'invalid_phone' });
    }

    const user = await ApiUser.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'invalid_user' });

    if (user.status !== 'ACTIVE' || !user.isActive) {
      return res.status(403).json({ error: 'account_paused_or_pending' });
    }

    // tier price by level
    const { price, cfg } = await getTierPriceAndCfg(user.level || 1);

    if ((user.walletBalance || 0) < price) {
      return res.status(402).json({
        error: 'insufficient_balance',
        need: price,
        have: Number(user.walletBalance || 0)
      });
    }

    const code = genCode();
    const expiresAt = dayjs().add(5, 'minute').toDate();

    const template = user.otpTemplate?.includes('{OTP}')
      ? user.otpTemplate.replace('{OTP}', code)
      : `Your Codinovo OTP is: ${code}. It expires in 5 minutes.`;

    try {
      await sendWaMessage(phone, template);
    } catch (err) {
      console.error('WhatsApp send failed:', err?.message || err);
      return res.status(500).json({ error: 'send_failed' });
    }

    // Deduct now at current tier price
    user.walletBalance = Number(user.walletBalance || 0) - Number(price);

    // Lifetime counters + auto-promotion
    user.totalSent = Number(user.totalSent || 0) + 1;

    let newLevel = 1;
    if (user.totalSent >= Number(cfg.level3Threshold ?? 10000)) newLevel = 3;
    else if (user.totalSent >= Number(cfg.level2Threshold ?? 1000)) newLevel = 2;

    if (newLevel !== user.level) {
      user.level = newLevel;
      // sync stored price for future sends
      const { price: nextPrice } = await getTierPriceAndCfg(newLevel);
      user.pricePerMessage = Number(nextPrice);
    } else {
      // keep stored price aligned with current tier config
      if (Number(user.pricePerMessage) !== Number(price)) {
        user.pricePerMessage = Number(price);
      }
    }

    await user.save();

    // Log THIS send (SENT) with the code + expiry
    await OtpLog.create({
      apiUser: user._id,
      phone,
      otp: code,
      channel: 'WHATSAPP',
      status: 'SENT',
      cost: Number(price),
      meta: { expiresAt, templateUsed: !!user.otpTemplate }
    });

    res.json({
      ok: true,
      expiresAt,
      level: user.level,
      totalSent: user.totalSent,
      nextPricePerMessage: user.pricePerMessage
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/otp/verify
 * Auth: Bearer JWT OR X-Service-Token + (Basic OR JSON password)
 * Body: { phone, code }
 * Behavior: Verifies against the MOST RECENT SENT code for this user+phone.
 *  - If success: the original SENT doc is updated to VERIFIED (cannot be reused).
 *  - If expired/wrong: a new FAILED attempt row is added for auditing.
 */
r.post('/otp/verify', requireStrictApiAuth, async (req, res, next) => {
  try {
    if (req.user.type !== 'API') {
      return res.status(403).json({ error: 'API user only' });
    }

    const phone = String(req.body?.phone || '').trim();
    const code = String(req.body?.code || '').trim();

    if (!isValidPhone(phone) || !/^\d{4,8}$/.test(code)) {
      return res.status(400).json({ error: 'invalid_input' });
    }

    const user = await ApiUser.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'invalid_user' });

    // Find latest SENT log (active OTP)
    const lastSent = await OtpLog.findOne({
      apiUser: user._id,
      phone,
      status: 'SENT'
    }).sort({ createdAt: -1 });

    if (!lastSent) {
      return res.status(404).json({ error: 'otp_not_found' });
    }

    // expired?
    if (!lastSent.meta?.expiresAt || Date.now() > new Date(lastSent.meta.expiresAt).getTime()) {
      // audit a failed attempt (expired)
      await OtpLog.create({
        apiUser: user._id,
        phone,
        channel: 'WHATSAPP',
        status: 'FAILED',
        meta: { reason: 'expired', attemptedCode: code }
      });
      return res.status(400).json({ error: 'otp_expired' });
    }

    // wrong code?
    if (lastSent.otp !== code) {
      // audit a failed attempt (wrong code)
      await OtpLog.create({
        apiUser: user._id,
        phone,
        channel: 'WHATSAPP',
        status: 'FAILED',
        meta: { reason: 'wrong_code', attemptedCode: code }
      });
      return res.status(400).json({ error: 'invalid_code' });
    }

    // ✅ success: mutate the original SENT row to VERIFIED (invalidation)
    lastSent.status = 'VERIFIED';
    lastSent.meta = { ...(lastSent.meta || {}), verifiedAt: new Date() };
    // Optionally, erase the OTP value after success:
    // lastSent.otp = undefined;
    await lastSent.save();

    res.json({ ok: true, message: 'OTP verified successfully' });
  } catch (err) {
    next(err);
  }
});

export default r;