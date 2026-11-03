import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aesCmac, sdmMac } from './sdm';

const ZERO_KEY = '00000000000000000000000000000000';

test('aesCmac matches the RFC 4493 test vectors', () => {
  const key = Buffer.from('2b7e151628aed2a6abf7158809cf4f3c', 'hex');
  const vectors: [string, string][] = [
    ['', 'bb1d6929e95937287fa37d129b756746'],
    ['6bc1bee22e409f96e93d7e117393172a', '070a16b46b4d4144f79bdd9dd04a287c'],
    [
      '6bc1bee22e409f96e93d7e117393172aae2d8a571e03ac9c9eb76fac45af8e5130c81c46a35ce411',
      'dfa66747de9ae63030ca32611497c827'
    ]
  ];
  for (const [message, expected] of vectors) {
    assert.equal(aesCmac(key, Buffer.from(message, 'hex')).toString('hex'), expected);
  }
});

test('sdmMac matches a real tap of tag 047F0DEAA72290', () => {
  // https://nfc-verify.onrender.com/verify?uid=047F0DEAA72290&ctr=000005&cmac=5A3E2846F0350C00
  assert.equal(sdmMac(ZERO_KEY, '047F0DEAA72290', '000005'), '5A3E2846F0350C00');
});

test('sdmMac changes when the counter or UID changes', () => {
  assert.notEqual(sdmMac(ZERO_KEY, '047F0DEAA72290', '000006'), '5A3E2846F0350C00');
  assert.notEqual(sdmMac(ZERO_KEY, '047F09EAA72290', '000005'), '5A3E2846F0350C00');
});
