import { Router, Request, Response } from 'express';
import Tag from '../models/Tag';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const tag = await Tag.create(req.body);
    res.status(201).json(tag);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  const tags = await Tag.find().sort({ createdAt: -1 });
  res.json(tags);
});

export default router;
