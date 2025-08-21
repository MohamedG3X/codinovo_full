// server/src/models/GlobalSender.js
import mongoose from 'mongoose';

const GlobalSenderSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true, trim: true },
  label: { type: String, default: '' },
  enabled: { type: Boolean, default: true },
  weight: { type: Number, default: 1, min: 0 },
}, { timestamps: true });

export default mongoose.model('GlobalSender', GlobalSenderSchema);
