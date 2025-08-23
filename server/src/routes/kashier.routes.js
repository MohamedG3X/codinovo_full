// server/src/routes/kashier.routes.js
import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth, requireApiUser } from '../middleware/auth.js';
import WalletTransaction from '../models/WalletTransaction.js';

const r = Router();

/* ----------------------- Kashier Config ----------------------- */
const cfg = {
  mode: (process.env.KASHIER_MODE || 'test').toLowerCase(), // "test" | "live"
  mid: process.env.KASHIER_MID,                              // e.g. MID-15725-769
  paymentApiKey: process.env.KASHIER_PAYMENT_API_KEY,        // Payment API Key (HMAC secret for hash & webhook)
  currency: (process.env.KASHIER_CURRENCY || 'EGP').toUpperCase(),
  rate: Number(process.env.KASHIER_USDT_EGP_RATE || 50),     // EGP per 1 USDT
  webhookUrl: process.env.KASHIER_WEBHOOK_URL,               // e.g. http://localhost:4000/webhooks/kashier
  merchantRedirect: process.env.KASHIER_MERCHANT_REDIRECT,   // e.g. http://localhost:4000/api/kashier/return
  hppBase: 'https://payments.kashier.io',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

// Ensure required env vars exist
function assertEnv(ok, name) {
  if (!ok) throw new Error(`[kashier] missing/invalid config: ${name}`);
}

// Hash for Payment UI (HPP) — per Kashier docs:
//   HMAC-SHA256(secret = Payment API Key) of the EXACT path string:
//   "/?payment=<MID>.<merchantOrderId>.<amount>.<currency>"
function generateOrderHash({ mid, orderId, amount, currency, paymentApiKey }) {
  const path = `/?payment=${mid}.${orderId}.${amount}.${currency}`;
  const hash = crypto.createHmac('sha256', paymentApiKey).update(path).digest('hex');
  return { hash, signedPath: path };
}

/* ----------------- Public config for frontend ----------------- */
r.get('/kashier/config', requireAuth, requireApiUser, (_req, res) => {
  try {
    assertEnv(cfg.mid, 'KASHIER_MID');
    assertEnv(cfg.paymentApiKey, 'KASHIER_PAYMENT_API_KEY');
    assertEnv(cfg.merchantRedirect, 'KASHIER_MERCHANT_REDIRECT');
    res.json({
      currency: cfg.currency,
      rate: cfg.rate,
      mode: cfg.mode,
      midPresent: !!cfg.mid,
      webhookConfigured: !!cfg.webhookUrl,
    });
  } catch (e) {
    res.status(500).json({ error: 'kashier_misconfigured', details: e.message });
  }
});

/* --------------------- Start a top-up via HPP --------------------- */
r.post('/kashier/topup', requireAuth, requireApiUser, async (req, res) => {
  try {
    assertEnv(cfg.mid, 'KASHIER_MID');
    assertEnv(cfg.paymentApiKey, 'KASHIER_PAYMENT_API_KEY');
    assertEnv(cfg.merchantRedirect, 'KASHIER_MERCHANT_REDIRECT');

    const { amountUSDT } = req.body || {};
    const usdt = Number(amountUSDT);
    if (!usdt || isNaN(usdt) || usdt <= 0) return res.status(400).json({ error: 'invalid_amount' });
    if (usdt < 10) return res.status(400).json({ error: 'min_topup_is_10', min: 10 });

    const egpStr = Number(usdt * cfg.rate).toFixed(2);
    const merchantOrderId = `WALLET-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

    const { hash, signedPath } = generateOrderHash({
      mid: cfg.mid,
      orderId: merchantOrderId,
      amount: egpStr,
      currency: cfg.currency,
      paymentApiKey: cfg.paymentApiKey,
    });

    console.log('[kashier/topup] order', {
      orderId: merchantOrderId,
      usdt,
      egp: egpStr,
      currency: cfg.currency,
      signedPath,
      hash,
    });

    // Save PENDING tx. (💡 It will STAY PENDING after Kashier success until admin approves.)
    const tx = await WalletTransaction.create({
      apiUser: req.user.id,
      type: 'DEPOSIT',
      amount: usdt,
      status: 'PENDING',
      txHash: merchantOrderId,
      description: `KASHIER HPP • ${egpStr} ${cfg.currency} • awaiting admin approval`,
    });

    // Build HPP URL — include mode param, but NOT in the hash
    const params = new URLSearchParams({
      merchantId: cfg.mid,
      orderId: merchantOrderId,
      amount: egpStr,
      currency: cfg.currency,
      hash,
      mode: cfg.mode,
      merchantRedirect: cfg.merchantRedirect,
    });
    if (cfg.webhookUrl) params.set('serverWebhook', cfg.webhookUrl);
    params.set('allowedMethods', 'card');
    params.set('display', 'en');

    const hppUrl = `${cfg.hppBase}/?${params.toString()}`;
    return res.json({ ok: true, hppUrl, orderId: merchantOrderId, txId: tx._id });
  } catch (e) {
    console.error('[kashier/topup] error:', e);
    return res.status(500).json({ error: 'server_error', details: e.message });
  }
});

/* --------------------------- Return URL --------------------------- */
// ✅ No more auto-credit. We just send the user back with a "pending" flag if SUCCESS.
r.get('/kashier/return', async (req, res) => {
  try {
    const qs = req.query || {};
    const success = String(qs.paymentStatus || '').toUpperCase() === 'SUCCESS';
    const merchantOrderId =
      qs.merchantOrderId || qs.orderId || qs.kashierOrderId || '';

    // Always route the user back; tell them it's pending if success.
    const target =
      `${cfg.clientUrl}/settings?pay=${success ? 'pending' : 'failed'}` +
      (merchantOrderId ? `&orderId=${encodeURIComponent(merchantOrderId)}` : '');

    return res.redirect(target);
  } catch (e) {
    console.error('[kashier/return] error:', e);
    return res.redirect(`${cfg.clientUrl}/settings?pay=unknown`);
  }
});

/* --------------------- Webhook signature check --------------------- */
function isValidKashierSignature(req) {
  try {
    const headerSig = req.header('x-kashier-signature');
    if (!headerSig || !cfg.paymentApiKey) return false;

    const body = req.body || {};
    const keys = body?.data?.signatureKeys;
    if (Array.isArray(keys) && keys.length) {
      const sorted = [...keys].sort();
      const picked = {};
      for (const k of sorted) {
        if (body.data[k] !== undefined && body.data[k] !== null) picked[k] = body.data[k];
      }
      const qs = Object.keys(picked)
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(String(picked[k]))}`)
        .join('&');
      const expected = crypto.createHmac('sha256', cfg.paymentApiKey).update(qs).digest('hex');
      return expected === headerSig;
    }

    const alt = crypto.createHmac('sha256', cfg.paymentApiKey).update(JSON.stringify(body)).digest('hex');
    return alt === headerSig;
  } catch {
    return false;
  }
}

/* ---------------------------- Webhook ---------------------------- */
// ✅ On SUCCESS we now *keep the tx PENDING* (no credit).
r.post('/webhooks/kashier', async (req, res) => {
  try {
    console.log('[kashier/webhook] raw:', JSON.stringify(req.body));

    // Enforce signature in LIVE; warn in TEST
    if (cfg.mode === 'live') {
      if (!isValidKashierSignature(req)) {
        console.warn('[kashier/webhook] invalid signature (LIVE) — rejected');
        return res.status(403).json({ ok: false });
      }
    } else {
      if (!isValidKashierSignature(req)) {
        console.warn('[kashier/webhook] invalid signature (TEST) — proceeding for dev');
      }
    }

    const body = req.body || {};
    const pick = (...paths) => {
      for (const p of paths) {
        try {
          const val = p.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), body);
          if (val !== undefined && val !== null && String(val).length) return val;
        } catch {}
      }
      return undefined;
    };

    const status = String(
      pick('status', 'response.status', 'result', 'response.result', 'data.status') || ''
    ).toUpperCase();

    const orderId =
      pick('merchantOrderId', 'orderId', 'order.systemOrderId', 'response.merchantOrderId', 'data.merchantOrderId') || null;

    if (!orderId) {
      console.warn('[kashier/webhook] missing orderId in payload');
      return res.status(400).json({ ok: false });
    }

    const tx = await WalletTransaction.findOne({ txHash: orderId });
    if (!tx) {
      console.warn('[kashier/webhook] no pending tx for', orderId);
      return res.json({ ok: true });
    }

    if (['APPROVED', 'SETTLED'].includes(tx.status)) {
      return res.json({ ok: true });
    }

    const success = status === 'SUCCESS' || status === 'CAPTURED';

    if (!success) {
      tx.status = 'REJECTED';
      await tx.save();
      console.log('[kashier/webhook] marked REJECTED for', orderId, 'status:', status);
      return res.json({ ok: true });
    }

    // ✅ Keep as PENDING. Let admin approve later.
    if (tx.status !== 'PENDING') {
      tx.status = 'PENDING';
    }
    if (!/awaiting admin approval/i.test(String(tx.description || ''))) {
      tx.description = `${tx.description || 'KASHIER HPP'} • awaiting admin approval`;
    }
    await tx.save();

    console.log('[kashier/webhook] payment success recorded; awaiting admin approval for', orderId);
    return res.json({ ok: true });
  } catch (e) {
    console.error('[kashier/webhook] error:', e);
    return res.status(500).json({ ok: false });
  }
});

export default r;
