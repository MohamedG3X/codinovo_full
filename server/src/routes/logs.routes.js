import { Router } from 'express';
import { hybridApiAuth } from '../middleware/serviceTokenAuth.js'; // ✅ use hybrid auth
import OtpLog from '../models/OtpLog.js';

const r = Router();

// server/src/routes/logs.routes.js
r.get('/logs', hybridApiAuth, async (req, res) => {
  if (req.user.type !== 'API') {
    return res.status(403).json({ error: 'API user only' });
  }

  const { page = 1, limit = 20, month, year } = req.query;
  const q = { apiUser: req.user.id };

  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    q.$or = [
      { sentAt: { $gte: start, $lt: end } },
      { $and: [
        { sentAt: { $exists: false } },
        { createdAt: { $gte: start, $lt: end } }
      ]}
    ];

    // ⚡ when analytics mode: return ALL rows (no pagination)
    const docs = await OtpLog.find(q).sort({ createdAt: -1 });
    const total = docs.length;
    return res.json({ data: docs, total });
  }

  // normal paginated logs
  const docs = await OtpLog.find(q)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await OtpLog.countDocuments(q);

  res.json({ data: docs, total });
});
export default r;