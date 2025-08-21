// server/src/routes/debug.routes.js
import { Router } from 'express';
import {
  listSessions,
  getSession,
  restartSession,
  logoutSession,
  sendWaMessage,
  waitWhatsAppReady,
} from '../whatsapp/client.js';

const r = Router();

/** List all WA sessions (default + pool) */
r.get('/whats/sessions', (_req, res) => {
  res.json(listSessions());
});

/** Inspect a single session by clientId */
r.get('/whats/session/:id', (req, res) => {
  const s = getSession(req.params.id);
  if (!s) return res.status(404).json({ error: 'not_found' });
  res.json(s);
});

/** Restart a session (destroy + re-init, prints QR if needed) */
r.post('/whats/session/:id/restart', async (req, res) => {
  try {
    await restartSession(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

/** Logout a session (clears auth; next init will show QR again) */
r.post('/whats/session/:id/logout', async (req, res) => {
  try {
    await logoutSession(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

/** Quick send via GLOBAL (default) client to test connectivity */
r.post('/whats/test-send', async (req, res) => {
  try {
    await waitWhatsAppReady();
    const { phone, text } = req.body || {};
    await sendWaMessage(phone, text || 'Hello from debug');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e?.code || String(e?.message || e) });
  }
});

export default r;
