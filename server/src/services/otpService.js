import bcrypt from 'bcryptjs';
import OtpCode from '../models/OtpCode.js';

const OTP_TTL_MIN = 5;

function generateCode(){
  return String(Math.floor(100000 + Math.random()*900000));
}

export async function createOtp(phone, apiUserId){
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MIN*60*1000);
  await OtpCode.create({ phone, codeHash, expiresAt, apiUser: apiUserId });
  return { code, expiresAt };
}

export async function verifyOtp(phone, code, apiUserId){
  const rec = await OtpCode.findOne({ phone, apiUser: apiUserId }).sort({ createdAt: -1 });
  if(!rec) return { ok: false, reason: 'no_record' };
  if(new Date() > rec.expiresAt) return { ok: false, reason: 'expired' };
  const ok = await bcrypt.compare(code, rec.codeHash);
  if(!ok) return { ok: false, reason: 'mismatch' };
  return { ok: true };
}
