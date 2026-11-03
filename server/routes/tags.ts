import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Tag from '../models/Tag';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { uid, itemName, ownerName, sdmFileReadKey } = req.body ?? {};
  try {
    const tag = await Tag.create({ uid, itemName, ownerName, sdmFileReadKey });
    const { sdmFileReadKey: _key, ...safe } = tag.toObject();
    res.status(201).json(safe);
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const first = Object.values(err.errors)[0];
      return res.status(400).json({ error: first.message });
    }
    if ((err as { code?: number }).code === 11000) {
      return res.status(409).json({ error: `A tag with UID ${String(uid).toUpperCase()} is already registered` });
    }
    console.error(err);
    res.status(500).json({ error: 'Could not save the tag' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const tags = await Tag.find().sort({ createdAt: -1 });
    res.json(tags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load tags' });
  }
});

export default router;
