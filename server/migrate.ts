import Tag from './models/Tag';
import Scan from './models/Scan';
import { encryptKey, hashIp, isEncrypted, isHashedIp, keyCheckValue } from './secure';

// Runs at startup. Converts data saved before encryption existed:
// plain SDM keys are encrypted, plain scan IPs are replaced by hashes.
// Safe to run every time: already converted records are skipped.
export async function migrateSecureData() {
  const tags = await Tag.find().select('+sdmFileReadKey');
  let keys = 0;
  for (const tag of tags) {
    if (isEncrypted(tag.sdmFileReadKey)) continue;
    const plain = tag.sdmFileReadKey.toUpperCase();
    tag.keyCheckValue = keyCheckValue(plain);
    tag.sdmFileReadKey = encryptKey(plain, tag.uid);
    await tag.save();
    keys++;
  }

  const scans = await Scan.find({ ip: { $exists: true, $ne: null } }).select('ip').lean();
  const updates = scans
    .filter((s) => s.ip && !isHashedIp(s.ip))
    .map((s) => ({ updateOne: { filter: { _id: s._id }, update: { $set: { ip: hashIp(s.ip) } } } }));
  if (updates.length) await Scan.bulkWrite(updates);

  if (keys || updates.length) {
    console.log(`Secure data migration: encrypted ${keys} key(s), hashed ${updates.length} scan IP(s)`);
  }
}
