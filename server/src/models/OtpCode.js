import mongoose from 'mongoose';

const OtpCodeSchema = new mongoose.Schema({
  phone: { type: String, index: true },
  codeHash: String,
  expiresAt: Date,
  attempts: { type: Number, default: 0 },
  apiUser: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiUser' }
}, { timestamps: true });

OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('OtpCode', OtpCodeSchema);
