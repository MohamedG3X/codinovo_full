// server/src/models/WalletTransaction.js
import mongoose from 'mongoose';

const WalletTxSchema = new mongoose.Schema({
  apiUser: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiUser', required: true, index: true },
  type: { type: String, enum: ['DEPOSIT', 'DEDUCTION'], required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'SETTLED'], default: 'PENDING', index: true },

  // For DEPOSIT:
  txHash: { type: String },
  proofPath: { type: String },       // uploaded image path
  description: { type: String },

}, { timestamps: true });

export default mongoose.model('WalletTransaction', WalletTxSchema);