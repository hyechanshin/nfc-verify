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

export interface Item {
  tag: TagInfo;
  tap: TapData;
  scans: ScanRecord[];
}

export const items: Item[] = [
  {
    tag: {
      uid: '04A1B2C3D4E5F6',
      itemName: 'Sample Item',
      ownerName: 'Hyechan Shin',
      registeredAt: '2026-10-20T14:32:00Z'
    },
    tap: { uid: '04A1B2C3D4E5F6', counter: 42, cmac: '94EED9EE65337086', valid: true },
    scans: [
      { scannedAt: '2026-10-26T09:12:45Z', counter: 42, valid: true, ip: '203.0.113.24' },
      { scannedAt: '2026-10-25T18:03:10Z', counter: 41, valid: true, ip: '198.51.100.7' },
      { scannedAt: '2026-10-24T11:47:22Z', counter: 40, valid: false, ip: '192.0.2.150' }
    ]
  },
  {
    tag: {
      uid: '047F3A92B15C80',
      itemName: 'Leather Wallet',
      ownerName: 'Jordan Lee',
      registeredAt: '2026-09-02T08:15:00Z'
    },
    tap: { uid: '047F3A92B15C80', counter: 17, cmac: '3C8A1F07D2E94B61', valid: true },
    scans: [
      { scannedAt: '2026-10-22T16:40:03Z', counter: 17, valid: true, ip: '198.51.100.42' },
      { scannedAt: '2026-10-11T12:05:51Z', counter: 16, valid: true, ip: '198.51.100.42' },
      { scannedAt: '2026-09-30T19:22:17Z', counter: 15, valid: true, ip: '203.0.113.9' }
    ]
  },
  {
    tag: {
      uid: '04D29E14A7623B',
      itemName: 'Vintage Watch',
      ownerName: 'Mina Park',
      registeredAt: '2026-07-18T10:48:00Z'
    },
    tap: { uid: '04D29E14A7623B', counter: 108, cmac: 'A51F6C09E3B7D248', valid: true },
    scans: [
      { scannedAt: '2026-10-25T07:31:29Z', counter: 108, valid: true, ip: '192.0.2.77' },
      { scannedAt: '2026-10-24T21:14:02Z', counter: 107, valid: true, ip: '192.0.2.77' },
      { scannedAt: '2026-10-19T13:58:44Z', counter: 106, valid: true, ip: '203.0.113.181' },
      { scannedAt: '2026-10-12T09:09:36Z', counter: 105, valid: true, ip: '198.51.100.230' }
    ]
  },
  {
    tag: {
      uid: '04E85B2FC6913D',
      itemName: 'Designer Handbag',
      ownerName: 'Alex Kim',
      registeredAt: '2026-08-05T15:20:00Z'
    },
    tap: { uid: '04E85B2FC6913D', counter: 9, cmac: '7E21C4B98F03A65D', valid: false },
    scans: [
      { scannedAt: '2026-10-26T11:02:58Z', counter: 9, valid: false, ip: '203.0.113.66' },
      { scannedAt: '2026-10-03T17:45:12Z', counter: 8, valid: true, ip: '192.0.2.14' },
      { scannedAt: '2026-09-14T10:27:40Z', counter: 7, valid: true, ip: '192.0.2.14' }
    ]
  },
  {
    tag: {
      uid: '0419C7E03A8D52',
      itemName: 'Limited Edition Sneakers',
      ownerName: 'Sam Rivera',
      registeredAt: '2026-06-27T12:00:00Z'
    },
    tap: { uid: '0419C7E03A8D52', counter: 23, cmac: '5B90E2D47A1C8F36', valid: false },
    scans: [
      { scannedAt: '2026-10-21T20:36:09Z', counter: 23, valid: false, ip: '198.51.100.193' },
      { scannedAt: '2026-10-18T14:11:33Z', counter: 31, valid: true, ip: '203.0.113.52' },
      { scannedAt: '2026-10-02T08:49:26Z', counter: 30, valid: true, ip: '203.0.113.52' }
    ]
  }
];
