import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
const app = createApp({ jwtSecret: process.env.JWT_SECRET, clientOrigin: process.env.CLIENT_ORIGIN, production: process.env.NODE_ENV === 'production' });
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mini-project-manager');
const server = app.listen(process.env.PORT || 4000, () => console.log(`API ready at http://localhost:${process.env.PORT || 4000}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => { await mongoose.disconnect(); process.exit(0); }));
