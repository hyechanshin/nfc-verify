// Counter is a 3-byte little-endian value in the SDM payload.
export function counterHex(n: number): string {
  const hex = n.toString(16).padStart(6, '0').toUpperCase();
  return hex.match(/../g)!.reverse().join('');
}

export function formatUid(uid: string): string {
  return uid.match(/../g)!.join(':');
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}
