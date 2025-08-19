// server/src/models/WalletTopupRequest.js
import mongoose from 'mongoose';

const WalletTopupRequestSchema = new mongoose.Schema({
  apiUser: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiUser', required: true },
  amount: { type: Number, required: true },
  txHash: { type: String }, // optional if they send a hash
  proofImage: { type: String }, // path to uploaded image
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('WalletTopupRequest', WalletTopupRequestSchema);