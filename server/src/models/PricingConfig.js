// server/src/models/PricingConfig.js
import mongoose from 'mongoose';

const PricingConfigSchema = new mongoose.Schema({
  // thresholds are inclusive (>=)
  level2Threshold: { type: Number, default: 1000 },
  level3Threshold: { type: Number, default: 10000 },

  level1Price: { type: Number, default: 1 },     // default $1.00
  level2Price: { type: Number, default: 0.8 },   // example
  level3Price: { type: Number, default: 0.6 },   // example
}, { timestamps: true });

export default mongoose.model('PricingConfig', PricingConfigSchema);