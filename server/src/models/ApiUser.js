import mongoose from 'mongoose';

const ApiUserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, index: true },
  passwordHash: { type: String, required: true },

  status: { type: String, enum: ['PENDING', 'ACTIVE', 'PAUSED'], default: 'PENDING', index: true },
  isActive: { type: Boolean, default: false },

  companyName: { type: String, default: '' },
  contactEmail: { type: String, default: '' },

  contactPhone: { type: String, unique: true, sparse: true, index: true, default: '' },

  applicantPosition: { type: String, default: '' },

  // Pricing & wallet (pricePerMessage will be auto-kept in sync with level by routes)
  pricePerMessage: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },

  // Levels
  level: { type: Number, enum: [1, 2, 3], default: 1, index: true },
  totalSent: { type: Number, default: 0 },

  otpTemplate: { type: String, default: '' },

  serviceToken: { type: String, default: null },
  serviceTokenCreatedAt: { type: Date, default: null },

  signupOtpCode: { type: String, default: null },
  signupOtpExpiresAt: { type: Date, default: null },
}, { timestamps: true });

ApiUserSchema.pre('save', function(next) {
  if (this.isModified('contactPhone') && typeof this.contactPhone === 'string') {
    this.contactPhone = this.contactPhone.replace(/\D/g, '');
  }
  next();
});

export default mongoose.model('ApiUser', ApiUserSchema);