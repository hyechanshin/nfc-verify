import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import Tag from '../models/Tag';
import Scan, { ScanReason } from '../models/Scan';
import { sdmMac } from '../sdm';
import { decryptKey, hashIp } from '../secure';

const router = Router();

// Anyone can send a made-up signature for a known UID, so bad_cmac scans prove
// nothing about the tag. They are logged for the admin but hidden from the
// public history, so spam cannot make a genuine item look suspicious.
const PUBLIC_HISTORY = (uid: string) => ({ tagUid: uid, reason: { $ne: 'bad_cmac' as const } });

// GET /api/verify?uid=..&ctr=..&cmac=.. : the values a tag mirrors into its URL on each tap.
router.get('/', async (req: Request, res: Response) => {
  const uid = String(req.query.uid ?? '').toUpperCase();
  const ctr = String(req.query.ctr ?? '').toUpperCase();
  const cmac = String(req.query.cmac ?? '').toUpperCase();

  if (!/^[0-9A-F]{14}$/.test(uid) || !/^[0-9A-F]{6}$/.test(ctr) || !/^[0-9A-F]{16}$/.test(cmac)) {
    return res.status(400).json({ error: 'This link is incomplete or damaged. Tap the tag again.' });
  }

  try {
    const tag = await Tag.findOne({ uid }).select('+sdmFileReadKey').lean();
    if (!tag) {
      return res.status(404).json({ error: 'This tag is not registered with NFC Verify.' });
    }

    const counter = parseInt(ctr, 16);
    const expected = Buffer.from(sdmMac(decryptKey(tag.sdmFileReadKey, uid), uid, ctr), 'hex');
    const signatureOk = crypto.timingSafeEqual(expected, Buffer.from(cmac, 'hex'));

    // A genuine tap always has a higher counter than the last genuine tap.
    // A lower or equal one means an old URL was reused (copied link or cloned data).
    const lastGenuine = await Scan.findOne({ tagUid: uid, valid: true }).sort({ counter: -1 }).lean();
    const lastGenuineCounter = lastGenuine?.counter ?? null;

    const history = () =>
      Promise.all([
        Scan.countDocuments(PUBLIC_HISTORY(uid)),
        Scan.find(PUBLIC_HISTORY(uid)).sort({ scannedAt: -1 }).limit(5).select('scannedAt counter valid reason -_id').lean()
      ]);

    // The exact link of the last genuine tap, opened again from browser history,
    // an old tab or a refresh. Not a new tap, so it is not logged and does not flag
    // the tag. It is never shown as genuine either: the visitor is asked to tap again.
    if (signatureOk && lastGenuine && counter === lastGenuine.counter && cmac === lastGenuine.cmac) {
      const [scanCount, recentScans] = await history();
      return res.json({
        result: 'checked',
        reason: 'reopened',
        uid,
        itemName: tag.itemName ?? null,
        ctr,
        counter,
        cmac,
        lastGenuineCounter,
        scannedAt: lastGenuine.scannedAt,
        scanCount,
        recentScans
      });
    }

    let reason: ScanReason = 'ok';
    if (!signatureOk) reason = 'bad_cmac';
    else if (lastGenuineCounter !== null && counter <= lastGenuineCounter) reason = 'replay';
    const valid = reason === 'ok';

    const scan = await Scan.create({ tagUid: uid, counter, cmac, valid, reason, ip: hashIp(req.ip) });

    const [scanCount, recentScans] = await history();

    res.json({
      result: valid ? 'genuine' : 'invalid',
      reason,
      uid,
      itemName: tag.itemName ?? null,
      ctr,
      counter,
      cmac,
      lastGenuineCounter,
      scannedAt: scan.scannedAt,
      scanCount,
      recentScans
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not verify the tag. Please try again.' });
  }
});

export default router;
