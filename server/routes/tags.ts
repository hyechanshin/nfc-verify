import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Tag from '../models/Tag';
import Scan from '../models/Scan';

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

// List all tags, each with a summary of its most recent scan.
router.get('/', async (req: Request, res: Response) => {
  try {
    const tags = await Tag.find().sort({ createdAt: -1 }).lean();
    const lastScans = await Scan.aggregate([
      { $sort: { scannedAt: -1 } },
      {
        $group: {
          _id: '$tagUid',
          scannedAt: { $first: '$scannedAt' },
          counter: { $first: '$counter' },
          valid: { $first: '$valid' }
        }
      }
    ]);
    const byUid = new Map(lastScans.map(({ _id, ...scan }) => [_id, scan]));
    res.json(tags.map((tag) => ({ ...tag, lastScan: byUid.get(tag.uid) ?? null })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load tags' });
  }
});

// One tag plus its scan history, newest first.
router.get('/:uid', async (req: Request<{ uid: string }>, res: Response) => {
  const uid = req.params.uid.toUpperCase();
  try {
    const tag = await Tag.findOne({ uid }).lean();
    if (!tag) {
      return res.status(404).json({ error: `No tag with UID ${uid}` });
    }
    const scans = await Scan.find({ tagUid: uid }).sort({ scannedAt: -1 }).limit(100).lean();
    res.json({ ...tag, scans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load the tag' });
  }
});

// Delete a tag and its scan history.
router.delete('/:uid', async (req: Request<{ uid: string }>, res: Response) => {
  const uid = req.params.uid.toUpperCase();
  try {
    const tag = await Tag.findOneAndDelete({ uid });
    if (!tag) {
      return res.status(404).json({ error: `No tag with UID ${uid}` });
    }
    await Scan.deleteMany({ tagUid: uid });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete the tag' });
  }
});

export default router;
