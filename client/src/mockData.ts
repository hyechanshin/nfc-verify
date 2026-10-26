// Placeholder data shaped like the server models (Tag, Scan) plus the
// values decoded from an NTAG424 SDM tap URL. Replace with API calls later.

export interface TagInfo {
  uid: string;
  itemName: string;
  ownerName: string;
  registeredAt: string;
}

export interface TapData {
  uid: string;
  counter: number;
  cmac: string;
  valid: boolean;
}

export interface ScanRecord {
  scannedAt: string;
  counter: number;
  valid: boolean;
  ip: string;
}

export const tag: TagInfo = {
  uid: '04A1B2C3D4E5F6',
  itemName: 'Sample Item',
  ownerName: 'Hyechan Shin',
  registeredAt: '2026-10-20T14:32:00Z'
};

export const tap: TapData = {
  uid: '04A1B2C3D4E5F6',
  counter: 42,
  cmac: '94EED9EE65337086',
  valid: true
};

export const scans: ScanRecord[] = [
  { scannedAt: '2026-10-26T09:12:45Z', counter: 42, valid: true, ip: '203.0.113.24' },
  { scannedAt: '2026-10-25T18:03:10Z', counter: 41, valid: true, ip: '198.51.100.7' },
  { scannedAt: '2026-10-24T11:47:22Z', counter: 40, valid: false, ip: '192.0.2.150' }
];
