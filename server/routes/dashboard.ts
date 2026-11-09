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
      // The 10 most recently scanned tags, each with its latest scan.
      Scan.aggregate([
        { $sort: { scannedAt: -1 } },
        {
          $group: {
            _id: '$tagUid',
            scannedAt: { $first: '$scannedAt' },
            counter: { $first: '$counter' },
            valid: { $first: '$valid' },
            reason: { $first: '$reason' }
          }
        },
        { $sort: { scannedAt: -1 } },
        { $limit: 10 }
      ]),
      // Tags whose most recent scan was invalid.
      Scan.aggregate([
        { $sort: { scannedAt: -1 } },
        { $group: { _id: '$tagUid', valid: { $first: '$valid' } } },
        { $match: { valid: false } },
        { $count: 'n' }
      ])
    ]);

    const names = await Tag.find({ uid: { $in: recent.map((s) => s._id) } }, { uid: 1, itemName: 1 }).lean();
    const nameByUid = new Map(names.map((t) => [t.uid, t.itemName]));

    res.json({
      totalTags,
      totalScans,
      invalidScans,
      flaggedTags: flagged[0]?.n ?? 0,
      recentTags: recent.map(({ _id, ...scan }) => ({
        uid: _id,
        itemName: nameByUid.get(_id) ?? null,
        ...scan
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load dashboard data' });
  }
});

export default router;
