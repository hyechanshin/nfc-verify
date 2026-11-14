import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decryptKey, encryptKey, hashIp, isEncrypted, isHashedIp, keyCheckValue, DEFAULT_KEY_KCV } from './secure';

// secure.ts reads the secret when it is used, so setting it here is enough.
process.env.KEY_ENCRYPTION_SECRET = 'test-secret-only-for-unit-tests';

const KEY = '00112233445566778899AABBCCDDEEFF';
const UID = '047F0DEAA72290';

test('encrypted key decrypts back to the original', () => {
  const stored = encryptKey(KEY, UID);
  assert.ok(isEncrypted(stored));
  assert.ok(!stored.includes(KEY) && !stored.toUpperCase().includes(KEY));
  assert.equal(decryptKey(stored, UID), KEY);
});

test('same key encrypts differently each time (random IV)', () => {
  assert.notEqual(encryptKey(KEY, UID), encryptKey(KEY, UID));
});

test('encrypted key cannot be moved to another tag or altered', () => {
  const stored = encryptKey(KEY, UID);
  assert.throws(() => decryptKey(stored, '04000000000000'));
  const last = stored.at(-1) === '0' ? '1' : '0';
  assert.throws(() => decryptKey(stored.slice(0, -1) + last, UID));
});

test('IP hashes are stable, not reversible, and differ per address', () => {
  const a = hashIp('203.0.113.7')!;
  assert.equal(a, hashIp('203.0.113.7'));
  assert.notEqual(a, hashIp('203.0.113.8'));
  assert.ok(isHashedIp(a) && !a.includes('203'));
  assert.equal(hashIp(undefined), undefined);
});

test('key check value spots the factory-default key', () => {
  assert.equal(keyCheckValue('0'.repeat(32)), DEFAULT_KEY_KCV);
  assert.notEqual(keyCheckValue(KEY), DEFAULT_KEY_KCV);
  assert.match(DEFAULT_KEY_KCV, /^[0-9A-F]{6}$/);
});
