// server/src/routes/wa.routes.js
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { listSessions, getSession, restartSession, logoutSession } from '../whatsapp/client.js';

const r = Router();

// GET /admin/wa/sessions
r.get('/sessions', requireAuth, requireAdmin, (_req, res) => {
  res.json({ ok: true, sessions: listSessions() });
});

// GET /admin/wa/sessions/:clientId
r.get('/sessions/:clientId', requireAuth, requireAdmin, (req, res) => {
  const s = getSession(req.params.clientId);
  if (!s) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true, session: s });
});

// POST /admin/wa/sessions/:clientId/restart
r.post('/sessions/:clientId/restart', requireAuth, requireAdmin, async (req, res) => {
  try {
    await restartSession(req.params.clientId);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: String(e?.message || e) });
  }
});

// POST /admin/wa/sessions/:clientId/logout
r.post('/sessions/:clientId/logout', requireAuth, requireAdmin, async (req, res) => {
  try {
    await logoutSession(req.params.clientId);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: String(e?.message || e) });
  }
});

export default r;
