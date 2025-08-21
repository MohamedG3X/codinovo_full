import { Router } from 'express';
import dayjs from 'dayjs';
import ApiUser from '../models/ApiUser.js';
import OtpLog from '../models/OtpLog.js';
import {
  isClientReady,
  sendWaMessageFrom,
  sendViaGlobal,
  trySendViaDefault,   // non-blocking default attempt
} from '../whatsapp/client.js';
import { requireStrictApiAuth } from '../middleware/strictApiAuth.js';
import PricingConfig from '../models/PricingConfig.js';

const r = Router();

function isValidPhone(p) { return typeof p === 'string' && /^\d{10,15}$/.test(p.trim()); }
function genCode() { return Math.floor(100000 + Math.random() * 900000).toString(); }

async function getTierPriceAndCfg(level) {
  const lvl = Number(level) || 1;
  let cfg = await PricingConfig.findOne().lean();
  if (!cfg) {
    cfg = { level1Price: 1.0, level2Price: 0.8, level3Price: 0.6, level2Threshold: 1000, level3Threshold: 10000 };
  }
  const price = (lvl === 3 ? Number(cfg.level3Price ?? 0.6)
               : lvl === 2 ? Number(cfg.level2Price ?? 0.8)
               : Number(cfg.level1Price ?? 1.0));
  return { price, cfg };
}

r.post('/otp/send', requireStrictApiAuth, async (req, res, next) => {
  try {
    if (req.user.type !== 'API') return res.status(403).json({ error: 'API user only' });

    const phone = String(req.body?.phone || '').trim();
    if (!isValidPhone(phone)) return res.status(400).json({ error: 'invalid_phone' });

    const user = await ApiUser.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'invalid_user' });
    if (user.status !== 'ACTIVE' || !user.isActive) return res.status(403).json({ error: 'account_paused_or_pending' });

    const { price, cfg } = await getTierPriceAndCfg(user.level || 1);
    if ((user.walletBalance || 0) < price) {
      return res.status(402).json({ error: 'insufficient_balance', need: price, have: Number(user.walletBalance || 0) });
    }

    const code = genCode();
    const expiresAt = dayjs().add(5, 'minute').toDate();
    const template = user.otpTemplate?.includes('{OTP}')
      ? user.otpTemplate.replace('{OTP}', code)
      : `Your Codinovo OTP is: ${code}. It expires in 5 minutes.`;

    const now = Date.now();
    const hasActiveDedicated =
      !!(user.dedicatedClientId && user.dedicatedActiveUntil && new Date(user.dedicatedActiveUntil).getTime() > now);

    let sentVia = null;
    let lastErr = null;

    // 1) Dedicated first (only if active + ready)
    if (hasActiveDedicated && isClientReady(user.dedicatedClientId)) {
      try {
        await sendWaMessageFrom(user.dedicatedClientId, phone, template);
        sentVia = 'DEDICATED';
      } catch (e) { lastErr = e; }
    }

    // 2) Global pool
    if (!sentVia) {
      const resPool = await sendViaGlobal(phone, template);
      if (resPool.ok) {
        sentVia = 'GLOBAL_POOL';
      } else {
        lastErr = lastErr || resPool.error || 'global_pool_failed';
      }
    }

    // 3) Default (non-blocking; only if ready internally)
    if (!sentVia) {
      const def = await trySendViaDefault(phone, template);
      if (def.ok) {
        sentVia = 'DEFAULT';
      } else {
        lastErr = lastErr || def.error || 'default_failed';
      }
    }

    if (!sentVia) {
      return res.status(503).json({ error: 'no_route_available', detail: String(lastErr || 'unavailable') });
    }

    // Billing + logging
    user.walletBalance = Number(user.walletBalance || 0) - Number(price);
    user.totalSent = Number(user.totalSent || 0) + 1;

    let newLevel = 1;
    if (user.totalSent >= Number(cfg.level3Threshold ?? 10000)) newLevel = 3;
    else if (user.totalSent >= Number(cfg.level2Threshold ?? 1000)) newLevel = 2;

    if (newLevel !== user.level) {
      user.level = newLevel;
      const { price: nextPrice } = await getTierPriceAndCfg(newLevel);
      user.pricePerMessage = Number(nextPrice);
    } else if (Number(user.pricePerMessage) !== Number(price)) {
      user.pricePerMessage = Number(price);
    }
    await user.save();

    await OtpLog.create({
      apiUser: user._id,
      phone,
      otp: code,
      channel: 'WHATSAPP',
      status: 'SENT',
      cost: Number(price),
      meta: { expiresAt, templateUsed: !!user.otpTemplate, sentVia }
    });

    res.json({
      ok: true,
      via: sentVia,
      expiresAt,
      level: user.level,
      totalSent: user.totalSent,
      nextPricePerMessage: user.pricePerMessage
    });
  } catch (err) { next(err); }
});

r.post('/otp/verify', requireStrictApiAuth, async (req, res, next) => {
  try {
    if (req.user.type !== 'API') return res.status(403).json({ error: 'API user only' });

    const phone = String(req.body?.phone || '').trim();
    const code = String(req.body?.code || '').trim();
    if (!isValidPhone(phone) || !/^\d{4,8}$/.test(code)) return res.status(400).json({ error: 'invalid_input' });

    const user = await ApiUser.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'invalid_user' });

    const lastSent = await OtpLog.findOne({ apiUser: user._id, phone, status: 'SENT' }).sort({ createdAt: -1 });
    if (!lastSent) return res.status(404).json({ error: 'otp_not_found' });

    if (!lastSent.meta?.expiresAt || Date.now() > new Date(lastSent.meta.expiresAt).getTime()) {
      await OtpLog.create({ apiUser: user._id, phone, channel: 'WHATSAPP', status: 'FAILED', meta: { reason: 'expired', attemptedCode: code } });
      return res.status(400).json({ error: 'otp_expired' });
    }

    if (lastSent.otp !== code) {
      await OtpLog.create({ apiUser: user._id, phone, channel: 'WHATSAPP', status: 'FAILED', meta: { reason: 'wrong_code', attemptedCode: code } });
      return res.status(400).json({ error: 'invalid_code' });
    }

    lastSent.status = 'VERIFIED';
    lastSent.meta = { ...(lastSent.meta || {}), verifiedAt: new Date() };
    await lastSent.save();

    res.json({ ok: true, message: 'OTP verified successfully' });
  } catch (err) { next(err); }
});

export default r;