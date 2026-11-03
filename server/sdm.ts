import crypto from 'crypto';

function aesEncryptBlock(key: Buffer, block: Buffer): Buffer {
  const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(block), cipher.final()]);
}

// Multiply by x in GF(2^128), used to derive the CMAC subkeys.
function doubleBlock(block: Buffer): Buffer {
  const out = Buffer.alloc(16);
  let carry = 0;
  for (let i = 15; i >= 0; i--) {
    out[i] = ((block[i] << 1) | carry) & 0xff;
    carry = block[i] >> 7;
  }
  if (block[0] & 0x80) out[15] ^= 0x87;
  return out;
}

// AES-128-CMAC as defined in RFC 4493.
export function aesCmac(key: Buffer, message: Buffer): Buffer {
  const k1 = doubleBlock(aesEncryptBlock(key, Buffer.alloc(16)));
  const k2 = doubleBlock(k1);

  const blocks = Math.max(1, Math.ceil(message.length / 16));
  const lastIsComplete = message.length > 0 && message.length % 16 === 0;
  const tail = message.subarray((blocks - 1) * 16);
  const last = Buffer.alloc(16);
  if (lastIsComplete) {
    for (let i = 0; i < 16; i++) last[i] = tail[i] ^ k1[i];
  } else {
    tail.copy(last);
    last[tail.length] = 0x80;
    for (let i = 0; i < 16; i++) last[i] ^= k2[i];
  }

  let x: Buffer = Buffer.alloc(16);
  for (let b = 0; b < blocks - 1; b++) {
    for (let i = 0; i < 16; i++) x[i] ^= message[b * 16 + i];
    x = aesEncryptBlock(key, x);
  }
  for (let i = 0; i < 16; i++) x[i] ^= last[i];
  return aesEncryptBlock(key, x);
}

/**
 * SDMMAC of an NTAG 424 DNA tap with plain UID + counter mirroring (NXP AN12196).
 *
 *   session key = CMAC(key, SV2),  SV2 = 3CC3 0001 0080 || UID || counter (LSB first), zero-padded
 *   SDMMAC      = CMAC(session key, MAC input), keeping only the odd-indexed bytes
 *
 * The URL shows the counter MSB first ("000005"), so it is reversed for SV2.
 * The MAC input is empty because the tags are encoded with MAC input offset = MAC offset.
 * Verified against real taps of tag 047F0DEAA72290 (see sdm.test.ts).
 */
export function sdmMac(keyHex: string, uidHex: string, ctrHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const counterLsbFirst = Buffer.from(ctrHex, 'hex').reverse();

  const sv2 = Buffer.alloc(16);
  Buffer.concat([Buffer.from('3CC300010080', 'hex'), Buffer.from(uidHex, 'hex'), counterLsbFirst]).copy(sv2);

  const sessionKey = aesCmac(key, sv2);
  const full = aesCmac(sessionKey, Buffer.alloc(0));
  const truncated = Buffer.from([1, 3, 5, 7, 9, 11, 13, 15].map((i) => full[i]));
  return truncated.toString('hex').toUpperCase();
}
