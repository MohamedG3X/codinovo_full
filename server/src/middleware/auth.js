// server/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import ApiUser from '../models/ApiUser.js';
import Admin from '../models/Admin.js';

// Toggle public/demo mode with env var:
// PUBLIC_MODE=true npm run dev
const PUBLIC_MODE = String(process.env.PUBLIC_MODE || '').toLowerCase() === 'true';

// ✅ NEW: control expiry handling via env
// - JWT_IGNORE_EXP=true  -> accept tokens even if exp is past/future
// - JWT_CLOCK_TOLERANCE=300 (seconds) -> allow small clock skew (optional)
const IGNORE_EXP = String(process.env.JWT_IGNORE_EXP || '').toLowerCase() === 'true';
const CLOCK_TOL = Number(process.env.JWT_CLOCK_TOLERANCE || 0); // seconds

function passThrough(req, _res, next){
  // Minimal fake identity so downstream code that checks req.user doesn't crash.
  if (!req.user) req.user = { id: null, type: 'PUBLIC' };
  next();
}

export const requireAuth = (req, res, next) => {
  if (PUBLIC_MODE) return passThrough(req, res, next);

  let token = null;

  // 1) Authorization: Bearer <token>
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2) ?token=<token>
  if (!token && typeof req.query.token === 'string' && req.query.token.trim()) {
    token = req.query.token.trim();
  }

  if (!token) return res.status(401).json({ error: 'no_token' });

  try {
    // ⬇️ CHANGED: ignoreExpiration + optional clockTolerance
    const decoded = jwt.verify(
      token,
      config.jwtSecret,
      { ignoreExpiration: IGNORE_EXP, clockTolerance: CLOCK_TOL }
    );
    req.user = decoded;
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'invalid_token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (PUBLIC_MODE) return passThrough(req, res, next);
  if (req.user?.type !== 'ADMIN' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'admin_only' });
  }
  next();
};

export const requireApiUser = (req, res, next) => {
  if (PUBLIC_MODE) return passThrough(req, res, next);
  if (req.user?.type !== 'API') {
    return res.status(403).json({ error: 'api_user_only' });
  }
  next();
};