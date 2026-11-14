import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import tagRoutes from './routes/tags';
import dashboardRoutes from './routes/dashboard';
import verifyRoutes from './routes/verify';
import { authRoutes, requireAdmin } from './auth';
import { migrateSecureData } from './migrate';

const app = express();
// Render sits behind a proxy; this makes req.ip the visitor's address.
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error('MONGO_URI is not set in .env');
}
if (!process.env.ADMIN_PASSWORD) {
  throw new Error('ADMIN_PASSWORD is not set in .env');
}
if (!process.env.KEY_ENCRYPTION_SECRET) {
  throw new Error('KEY_ENCRYPTION_SECRET is not set in .env');
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Security headers (no sniffing, no framing, a content security policy, ...).
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Rate limits per IP: stop password guessing and floods of fake taps.
const tooMany = (message: string) => ({ windowMs: 15 * 60 * 1000, standardHeaders: true, legacyHeaders: false, message: { error: message } });
const loginLimit = rateLimit({ ...tooMany('Too many login attempts. Try again in 15 minutes.'), limit: 10 });
const verifyLimit = rateLimit({ ...tooMany('Too many checks from this network. Try again in a few minutes.'), limit: 100 });

// Public: phones tapping a tag, and logging in.
app.use('/api/verify', verifyLimit, verifyRoutes);
app.use('/api/auth/login', loginLimit);
app.use('/api/auth', authRoutes);
// Admin only.
app.use('/api/tags', requireAdmin, tagRoutes);
app.use('/api/dashboard', requireAdmin, dashboardRoutes);
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// In production the server also serves the built React app (client/dist).
// Scripts run from the server folder, so the client build is one level up.
const clientDist = path.resolve(process.cwd(), '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // Let React Router handle page URLs like /tags/047F...
  app.get('/{*page}', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('NFC verify server is running');
  });
}

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB');
    await migrateSecureData();
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
  });
