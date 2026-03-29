import mongoose from 'mongoose';
import { logger } from './logger.js';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not configured.');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== 'production'
  });

  logger.info('MongoDB connected successfully.');
};