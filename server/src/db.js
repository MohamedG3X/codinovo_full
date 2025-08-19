import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from './config.js';

export async function connectDB() {
  if (!config.mongoUri) {
    throw new Error('MONGO_URI is missing – check server/.env');
  }
  await mongoose.connect(config.mongoUri, { autoIndex: true });
  console.log('MongoDB connected');
}
