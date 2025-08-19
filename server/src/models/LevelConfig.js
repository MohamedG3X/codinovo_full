// server/src/models/LevelConfig.js
import mongoose from 'mongoose';

const LevelConfigSchema = new mongoose.Schema({
  level1Price: { type: Number, default: 1.0 },   // Default $1.00
  level2Price: { type: Number, default: 0.8 },   // Default $0.80
  level3Price: { type: Number, default: 0.5 },   // Default $0.50
}, { timestamps: true });

// Ensure only one config exists
LevelConfigSchema.statics.getConfig = async function () {
  let cfg = await this.findOne();
  if (!cfg) {
    cfg = await this.create({});
  }
  return cfg;
};

export default mongoose.model('LevelConfig', LevelConfigSchema);