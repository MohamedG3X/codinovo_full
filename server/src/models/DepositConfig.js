// server/src/models/DepositConfig.js
import mongoose from 'mongoose';

const DepositConfigSchema = new mongoose.Schema({
  address: { type: String, required: true },       // e.g. BNB address
  network: { type: String, default: 'BNB Chain' }, // optional label
  minAmount: { type: Number, default: 1 },         // min top-up amount
  qrPath: { type: String },                        // uploads path to QR image
  guidePdfPath: { type: String },                  // uploads path to PDF (how-to)
}, { timestamps: true });

export default mongoose.model('DepositConfig', DepositConfigSchema);