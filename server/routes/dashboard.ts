import { Router, Request, Response } from 'express';
import Tag from '../models/Tag';
import Scan from '../models/Scan';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const [totalTags, totalScans, invalidScans, recent, flagged] = await Promise.all([
      Tag.countDocuments(),
      Scan.countDocuments(),
      Scan.countDocuments({ valid: false }),
      Scan.find({ valid: false }).sort({ scannedAt: -1 }).limit(10).lean(),
      // Tags whose most recent scan was invalid.
      Scan.aggregate([
        { $sort: { scannedAt: -1 } },
        { $group: { _id: '$tagUid', valid: { $first: '$valid' } } },
        { $match: { valid: false } },
        { $count: 'n' }
      ])
    ]);

    const names = await Tag.find({ uid: { $in: recent.map((s) => s.tagUid) } }, { uid: 1, itemName: 1 }).lean();
    const nameByUid = new Map(names.map((t) => [t.uid, t.itemName]));

    res.json({
      totalTags,
      totalScans,
      invalidScans,
      flaggedTags: flagged[0]?.n ?? 0,
      recentInvalidScans: recent.map((s) => ({
        uid: s.tagUid,
        itemName: nameByUid.get(s.tagUid) ?? null,
        scannedAt: s.scannedAt,
        counter: s.counter,
        ip: s.ip
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load dashboard data' });
  }
});

export default router;
