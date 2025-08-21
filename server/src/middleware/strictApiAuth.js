// server/src/middleware/strictApiAuth.js
import jwt from 'jsonwebtoken';
import ApiUser from '../models/ApiUser.js';
import { config } from '../config.js';

const PUBLIC_MODE = String(process.env.PUBLIC_MODE || '').toLowerCase() === 'true';

// ✅ SAME flags as requireAuth
const IGNORE_EXP = String(process.env.JWT_IGNORE_EXP || '').toLowerCase() === 'true';
const CLOCK_TOL = Number(process.env.JWT_CLOCK_TOLERANCE || 0); // seconds

export async function requireStrictApiAuth(req, res, next) {
  try {
    if (PUBLIC_MODE) {
      req.user = { id: null, type: 'PUBLIC' };
      return next();
    }

    let apiUser = null;

    // 1) Try Bearer JWT
    const auth = req.headers.authorization || '';
    const bearer = auth.startsWith('Bearer ') ? auth.split(' ')[1] : null;
    if (bearer) {
      try {
        // ⬇️ CHANGED: ignoreExpiration + clockTolerance
        const decoded = jwt.verify(
          bearer,
          config.jwtSecret,
          { ignoreExpiration: IGNORE_EXP, clockTolerance: CLOCK_TOL }
        );
        if (decoded?.type === 'API' && decoded?.id) {
          apiUser = await ApiUser.findById(decoded.id).lean();
        }
      } catch {
        // ignore, try service token next
      }
    }

    // 2) Try service token
    if (!apiUser && req.headers['x-service-token']) {
      apiUser = await ApiUser.findOne({ serviceToken: String(req.headers['x-service-token']) }).lean();
    }

    // 3) No identity → unauthorized
    if (!apiUser) {
      return res.status(401).json({ error: 'unauthorized', hint: 'Provide Bearer JWT or X-Service-Token' });
    }

    // 4) Must be active
    if (apiUser.status !== 'ACTIVE' || !apiUser.isActive) {
      return res.status(403).json({ error: 'account_paused_or_pending' });
    }

    // ✅ JWT/service token is enough — no password re-check.
    req.user = { id: String(apiUser._id), type: 'API' };
    req.apiUser = apiUser;
    return next();
  } catch (err) {
    console.error('requireStrictApiAuth error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
}