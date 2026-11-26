import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findMissing, missingMessage, REQUIRED_ENV } from './env';

const ALL_SET = {
  MONGO_URI: 'mongodb://localhost/test',
  ADMIN_PASSWORD: 'a-password',
  KEY_ENCRYPTION_SECRET: 'a-secret'
};

test('nothing is reported when every required variable is set', () => {
  assert.deepEqual(findMissing(ALL_SET), []);
});

test('every missing variable is reported at once, not just the first', () => {
  const names = findMissing({}).map((v) => v.name);
  assert.deepEqual(names, REQUIRED_ENV.map((v) => v.name));
});

test('an empty or blank value counts as missing', () => {
  const names = findMissing({ ...ALL_SET, ADMIN_PASSWORD: '', KEY_ENCRYPTION_SECRET: '   ' }).map((v) => v.name);
  assert.deepEqual(names, ['ADMIN_PASSWORD', 'KEY_ENCRYPTION_SECRET']);
});

test('the message names each missing variable and says how to fix it', () => {
  const message = missingMessage(findMissing({ ...ALL_SET, MONGO_URI: undefined }));
  assert.match(message, /1 required environment variable is missing/);
  assert.match(message, /add it to server/);
  assert.match(message, /MONGO_URI/);
  assert.doesNotMatch(message, /ADMIN_PASSWORD/);
  assert.match(message, /server\/\.env/);
  assert.match(message, /Render/);
});
