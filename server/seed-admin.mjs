import 'dotenv/config'
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from './src/models/Admin.js';

await mongoose.connect(process.env.MONGO_URI);
await Admin.create({ email: 'you@codinovo.com', passwordHash: await bcrypt.hash('admin123',10) });
console.log('✅ Admin created'); process.exit();
