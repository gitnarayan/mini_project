import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';

const app = createApp({
  jwtSecret: process.env.JWT_SECRET,
  clientOrigin: process.env.CLIENT_ORIGIN,
  production: process.env.NODE_ENV === 'production',
});

let mongoConnection;

export default async function handler(req, res) {
  if (mongoose.connection.readyState === 0) {
    mongoConnection ||= mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mini-project-manager',
    );
    await mongoConnection;
  }

  return app(req, res);
}
