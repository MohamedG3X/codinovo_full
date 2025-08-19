import rateLimit from 'express-rate-limit';

export const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 requests/minute per IP
});
