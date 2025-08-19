// server/src/routes/auth.routes.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ApiUser from '../models/ApiUser.js';
import Admin from '../models/Admin.js';
import { config } from '../config.js';
import { sendWaMessage } from '../whatsapp/client.js';

const r = Router();

function digitsOnly(s){ return String(s || '').replace(/\D/g, ''); }
function genOtp(){ return Math.floor(100000 + Math.random() * 900000).toString(); }

// 🔒 password strength validator (min 8, upper, lower, digit, special)
function validatePassword(pw = '') {
  const minLen = 8;
  return (
    pw.length >= minLen &&
    /[a-z]/.test(pw) &&
    /[A-Z]/.test(pw) &&
    /\d/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

// --- ADMIN login (email) or API user login (username) ---
r.post('/login', async (req, res) => {
  const { email, username, password } = req.body || {};

  // Admin by email
  if (email) {
    const admin = await Admin.findOne({ email });
    if (!admin || !(await bcrypt.compare(password || '', admin.passwordHash))) {
      return res.status(401).json({ error: 'invalid_admin_credentials' });
    }
    const token = jwt.sign({ id: admin._id, type: 'ADMIN' }, config.jwtSecret, { expiresIn: '7d' });
    return res.json({ token, type: 'ADMIN', user: { email } });
  }

  // Client by username
  const user = await ApiUser.findOne({ username });
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).json({ error: 'invalid_user_credentials' });
  }

  // Still pending (either not approved or OTP not verified)
  if (user.signupOtpCode || user.status !== 'ACTIVE' || !user.isActive) {
    return res.status(403).json({
      error: 'account_under_review',
      message: 'Your account is under review. Contact support at support@example.com'
    });
  }

  const token = jwt.sign({ id: user._id, type: 'API' }, config.jwtSecret, { expiresIn: '7d' });
  return res.json({
    token,
    type: 'API',
    user: { id: user._id, username: user.username, pricePerMessage: user.pricePerMessage }
  });
});

// --- Registration (step 1): create PENDING user + send OTP ---
r.post('/register', async (req, res) => {
  try {
    const {
      username,
      password,
      companyName,
      contactPhone,
      applicantPosition,
      contactEmail // optional
    } = req.body || {};

    if (!username || !password || !companyName || !contactPhone || !applicantPosition) {
      return res.status(400).json({ error: 'missing_required_fields' });
    }

    // 🔒 enforce strong passwords
    if (!validatePassword(password)) {
      return res.status(400).json({
        error: 'weak_password',
        hint: 'Min 8 chars incl. uppercase, lowercase, number, and special character.'
      });
    }

    // Normalize and validate phone
    const phone = digitsOnly(contactPhone);
    if (!/^\d{10,15}$/.test(phone)) {
      return res.status(400).json({ error: 'invalid_phone' });
    }

    // Uniqueness checks (username + phone)
    const [existsUser, existsPhone] = await Promise.all([
      ApiUser.findOne({ username }),
      ApiUser.findOne({ contactPhone: phone }),
    ]);
    if (existsUser) return res.status(409).json({ error: 'username_taken' });
    if (existsPhone) return res.status(409).json({ error: 'phone_taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const otpCode = genOtp();

    const u = await ApiUser.create({
      username,
      passwordHash,
      companyName,
      contactPhone: phone,
      applicantPosition,
      contactEmail: contactEmail || '',
      pricePerMessage: 0,
      status: 'PENDING',
      isActive: false,
      signupOtpCode: otpCode,
      signupOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
    });

    try {
      await sendWaMessage(phone, `Your Codinovo signup code is: ${otpCode}\nThis code expires in 10 minutes.`);
    } catch (err) {
      console.error('Signup OTP send failed:', err);
      // keep user; they can resend
    }

    return res.json({ ok: true, next: 'verify_otp', username: u.username, phone });
  } catch (err) {
    // Clean dup-key errors (in case of race conditions)
    if (err?.code === 11000) {
      if (String(err.message).includes('contactPhone')) {
        return res.status(409).json({ error: 'phone_taken' });
      }
      if (String(err.message).includes('username')) {
        return res.status(409).json({ error: 'username_taken' });
      }
    }
    console.error('Register error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// --- Verify signup OTP (step 2) ---
r.post('/verify-otp', async (req, res) => {
  const { username, otp } = req.body || {};
  const user = await ApiUser.findOne({ username });
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  const expired = !user.signupOtpExpiresAt || Date.now() > new Date(user.signupOtpExpiresAt).getTime();
  const wrong = !user.signupOtpCode || user.signupOtpCode !== String(otp || '').trim();

  if (expired || wrong) {
    return res.status(400).json({ error: 'invalid_or_expired_otp' });
  }

  // Clear OTP; user remains PENDING for admin review
  user.signupOtpCode = null;
  user.signupOtpExpiresAt = null;
  await user.save();

  return res.json({ ok: true, status: 'PENDING', message: 'OTP verified. Your account is under review.' });
});

// --- Resend signup OTP ---
r.post('/resend-otp', async (req, res) => {
  const { username } = req.body || {};
  const user = await ApiUser.findOne({ username });
  if (!user) return res.status(404).json({ error: 'user_not_found' });
  if (user.status !== 'PENDING' || user.isActive) {
    return res.status(400).json({ error: 'not_eligible' });
  }

  const otpCode = genOtp();
  user.signupOtpCode = otpCode;
  user.signupOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  try {
    await sendWaMessage(user.contactPhone, `Your Codinovo signup code is: ${otpCode}\nThis code expires in 10 minutes.`);
  } catch (err) {
    console.error('Resend OTP failed:', err);
  }

  return res.json({ ok: true, message: 'OTP resent' });
});

export default r;