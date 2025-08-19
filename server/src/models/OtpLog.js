import mongoose from 'mongoose';

const OtpLogSchema = new mongoose.Schema({
  apiUser: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiUser', index: true },

  // target
  phone: { type: String, index: true },

  // OTP data
  otp: { type: String }, // (optional: you can hash it in the future)
  channel: { type: String, default: 'WHATSAPP' },

  /**
   * Status lifecycle:
   *  - SENT:     message sent with {otp}, meta.expiresAt set
   *  - VERIFIED: verification succeeded; the original SENT doc is updated to VERIFIED
   *  - FAILED:   verification failed (wrong_code or expired). We create a new FAILED attempt row.
   */
  status: { type: String, enum: ['SENT', 'FAILED', 'VERIFIED'], default: 'SENT', index: true },

  cost: { type: Number, default: 0 },

  // extra metadata: expiresAt, templateUsed, reason, verifiedAt, etc.
  meta: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.model('OtpLog', OtpLogSchema);