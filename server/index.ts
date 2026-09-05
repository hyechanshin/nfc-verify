import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import tagRoutes from './routes/tags';

const app = express();
const PORT = process.env.PORT || 4000;

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error('MONGO_URI is not set in .env');
}

app.get('/', (req, res) => {
  res.send('NFC verify server is running');
});

app.use(express.json());
app.use('/api/tags', tagRoutes);

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
