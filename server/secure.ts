import crypto from 'crypto';

// Data protection for what the database stores:
// - SDM keys are encrypted with AES-256-GCM before they are saved.
// - Scan IPs are stored as keyed hashes (HMAC-SHA256), never as plain addresses.
// Both use KEY_ENCRYPTION_SECRET, which lives only in .env / Render, so a leaked
// database (or backup) alone reveals neither the keys nor who scanned.

const PREFIX = 'enc:v1:';

function derive(purpose: string): Buffer {
  const secret = process.env.KEY_ENCRYPTION_SECRET;
  if (!secret) throw new Error('KEY_ENCRYPTION_SECRET is not set in .env');
  return crypto.createHash('sha256').update(`${purpose}:${secret}`).digest();
}

export function isEncrypted(stored: string): boolean {
  return stored.startsWith(PREFIX);
}

// Stored form: "enc:v1:<iv>:<auth tag>:<ciphertext>" (hex). The tag UID is bound
// as associated data, so an encrypted key copied onto another tag will not decrypt.
export function encryptKey(keyHex: string, uid: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', derive('sdm-keys'), iv);
  cipher.setAAD(Buffer.from(uid));
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(keyHex, 'hex')), cipher.final()]);
  return `${PREFIX}${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${ciphertext.toString('hex')}`;
}

export function decryptKey(stored: string, uid: string): string {
  if (!isEncrypted(stored)) throw new Error(`Key for tag ${uid} is not encrypted`);
  const [iv, tag, ciphertext] = stored.slice(PREFIX.length).split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', derive('sdm-keys'), Buffer.from(iv, 'hex'));
  decipher.setAAD(Buffer.from(uid));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'hex')), decipher.final()]).toString('hex').toUpperCase();
}

// Same visitor gives the same hash, so repeated scans from one network are still
// visible to the admin, but the address itself cannot be read back.
export function hashIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined;
  return crypto.createHmac('sha256', derive('scan-ip')).update(ip).digest('hex').slice(0, 32);
}

export function isHashedIp(value: string): boolean {
  return /^[0-9a-f]{32}$/.test(value);
}

// Key check value: first 3 bytes of AES(key, zero block). A standard way to tell
// which key a tag uses without revealing the key.
export function keyCheckValue(keyHex: string): string {
  const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(keyHex, 'hex'), null);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(Buffer.alloc(16)), cipher.final()]).subarray(0, 3).toString('hex').toUpperCase();
}

// KCV of the NTAG 424 factory key (all zeros).
export const DEFAULT_KEY_KCV = keyCheckValue('0'.repeat(32));
