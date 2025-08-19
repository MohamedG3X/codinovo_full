// server/src/middleware/serviceTokenAuth.js
import jwt from 'jsonwebtoken';
import ApiUser from '../models/ApiUser.js';
import { config } from '../config.js';

/**
 * Middleware that accepts either:
 *  - JWT in Authorization: Bearer <jwt>
 *  - Service token in:
 *      * x-service-token: <token>
 *      * OR Authorization: Bearer <service_token>
 */
export async function hybridApiAuth(req, res, next) {
  try {
    const authHeader = req.headers?.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const serviceHeader = (req.headers?.['x-service-token'] || '').trim();

    // pick a token if any present
    const presented = bearer || serviceHeader;
    if (!presented) return res.status(401).json({ error: 'no_token_provided' });

    // Try JWT first
    if (bearer) {
      try {
        const decoded = jwt.verify(bearer, config.jwtSecret);
        if (decoded?.type !== 'API') return res.status(403).json({ error: 'not_api_user' });
        req.user = { id: decoded.id, type: 'API' };
        return next();
      } catch {
        // Not a valid JWT → fallthrough to service token
      }
    }

    // Try service token (either from x-service-token or in Bearer)
    const apiUser = await ApiUser.findOne({ serviceToken: presented });
    if (!apiUser) return res.status(401).json({ error: 'invalid_token' });
    if (apiUser.status !== 'ACTIVE' || !apiUser.isActive) {
      return res.status(403).json({ error: 'account_paused_or_pending' });
    }

    req.user = { id: apiUser._id, type: 'API' };
    return next();
  } catch (err) {
    console.error('hybridApiAuth error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
}