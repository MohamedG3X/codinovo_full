// server/src/models/DemoOtp.js
import mongoose from 'mongoose';

const DemoOtpSchema = new mongoose.Schema({
  ip: { type: String, index: true, required: true },
  phone: { type: String, required: true },
  code: { type: String, required: true },
  status: { type: String, enum: ['SENT', 'VERIFIED', 'FAILED'], default: 'SENT', index: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

DemoOtpSchema.index({ ip: 1, createdAt: 1 });

export default mongoose.model('DemoOtp', DemoOtpSchema);