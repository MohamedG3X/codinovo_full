// server/src/middleware/strictApiAuth.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import ApiUser from '../models/ApiUser.js';
import { config } from '../config.js';

const PUBLIC_MODE = String(process.env.PUBLIC_MODE || '').toLowerCase() === 'true';

function parseBasicAuth(req){
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return null;
  try {
    const decoded = Buffer.from(h.slice(6), 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    if (idx === -1) return null;
    const username = decoded.slice(0, idx);
    const password = decoded.slice(idx + 1);
    return { username, password };
  } catch {
    return null;
  }
}

export async function requireStrictApiAuth(req, res, next){
  if (PUBLIC_MODE) {
    req.user = { id: null, type: 'PUBLIC' };
    return next();
  }

  let apiUser = null;

  // JWT
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;
  if (bearer) {
    try {
      const decoded = jwt.verify(bearer, config.jwtSecret);
      if (decoded?.type === 'API' && decoded?.id) {
        apiUser = await ApiUser.findById(decoded.id).lean();
      }
    } catch {}
  }

  // Service token
  if (!apiUser && req.headers['x-service-token']) {
    apiUser = await ApiUser.findOne({ serviceToken: String(req.headers['x-service-token']) }).lean();
  }

  if (!apiUser) {
    return res.status(401).json({ error: 'unauthorized', hint: 'Provide Bearer JWT or X-Service-Token' });
  }

  if (apiUser.status !== 'ACTIVE' || !apiUser.isActive) {
    return res.status(403).json({ error: 'account_paused_or_pending' });
  }

  // Password
  let providedUser = null;
  let providedPass = null;
  const basic = parseBasicAuth(req);
  if (basic?.username && basic?.password) {
    providedUser = basic.username;
    providedPass = basic.password;
  } else if (req.body && typeof req.body.password === 'string') {
    providedUser = req.body.username?.trim() || apiUser.username;
    providedPass = req.body.password;
  }

  if (!providedUser || !providedPass) {
    return res.status(401).json({ error: 'password_required' });
  }
  if (providedUser !== apiUser.username) {
    return res.status(401).json({ error: 'bad_credentials' });
  }

  const freshUser = await ApiUser.findById(apiUser._id);
  if (!freshUser) return res.status(401).json({ error: 'unauthorized' });

  const ok = await bcrypt.compare(providedPass, freshUser.passwordHash || '');
  if (!ok) return res.status(401).json({ error: 'bad_credentials' });

  req.user = { id: String(apiUser._id), type: 'API' };
  req.apiUser = apiUser;
  next();
}