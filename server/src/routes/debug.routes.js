// server/src/routes/debug.routes.js
import { Router } from 'express';
import { sendWaMessage, waitWhatsAppReady } from '../whatsapp/client.js';

const r = Router();

// POST /debug/send-wa { phone, text }
r.post('/debug/send-wa', async (req, res) => {
  try {
    const { phone, text } = req.body || {};
    if (!phone || !text) return res.status(400).json({ error: 'missing_params' });

    await waitWhatsAppReady();
    await sendWaMessage(phone, text);
    return res.json({ ok: true });
  } catch (err) {
    console.error('DEBUG send failed:', err);
    return res.status(500).json({ error: err?.code || 'send_failed' });
  }
});

export default r;