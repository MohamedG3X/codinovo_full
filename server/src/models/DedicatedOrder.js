// server/src/models/DedicatedOrder.js
import mongoose from 'mongoose';

const DedicatedOrderSchema = new mongoose.Schema({
  apiUser: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiUser', required: true, index: true },

  companyName: { type: String, default: '' },
  companyDescription: { type: String, default: '' },
  companyLogoPath: { type: String, default: '' },

  status: {
    type: String,
    enum: ['PENDING', 'ASSIGNED', 'ACTIVE', 'EXPIRED', 'CANCELLED'],
    default: 'PENDING',
    index: true
  },

  assignedClientId: { type: String, default: null },
  assignedSenderPhone: { type: String, default: '' },

  assignedAt: { type: Date, default: null },
  activatedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },

  priceUSD: { type: Number, default: 20 },
}, { timestamps: true });

export default mongoose.model('DedicatedOrder', DedicatedOrderSchema);
