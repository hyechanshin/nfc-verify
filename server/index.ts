import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import mongoose from 'mongoose';
import tagRoutes from './routes/tags';
import dashboardRoutes from './routes/dashboard';
import verifyRoutes from './routes/verify';
import { authRoutes, requireAdmin } from './auth';

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(express.json());
// Public: phones tapping a tag, and logging in.
app.use('/api/verify', verifyRoutes);
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
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
  });
