// The tag mirrors its 3-byte read counter into the URL MSB first, e.g. 5 -> "000005".
export function counterHex(n: number): string {
  return n.toString(16).padStart(6, '0').toUpperCase();
}

export function formatUid(uid: string): string {
  return uid.match(/../g)!.join(':');
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}
