import 'dotenv/config';
import mongoose from 'mongoose';

try {
  console.log('Testing MongoDB Atlas connection...');

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    autoSelectFamily: false,
  });

  console.log('SUCCESS: MongoDB Atlas connected!');
} catch (error) {
  console.error('FAILED:', error.message);
  console.error('CAUSE:', error.cause?.message || 'No additional cause');
} finally {
  await mongoose.disconnect().catch(() => {});
}