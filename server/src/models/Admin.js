import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, enum: ['SUPER_ADMIN'], default: 'SUPER_ADMIN' }
}, { timestamps: true });

export default mongoose.model('Admin', AdminSchema);
