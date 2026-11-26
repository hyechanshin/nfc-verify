import type { DashboardData, Scan, ScanReason, TagDetail, TagListItem } from './api';

// Demo mode: the admin pages run on sample data kept in this browser tab.
// Nothing is sent to the server, and every change disappears on refresh or exit.

const FLAG = 'nfc-verify-demo';

export function isDemo(): boolean {
  try {
    return sessionStorage.getItem(FLAG) === '1';
  } catch {
    return false;
  }
}

export function enterDemo() {
  try {
    sessionStorage.setItem(FLAG, '1');
  } catch {
    // Storage blocked: demo still works until the page is refreshed.
  }
  store = sampleData();
  demoOn = true;
}

export function exitDemo() {
  try {
    sessionStorage.removeItem(FLAG);
  } catch {
    // ignore
  }
  demoOn = false;
}

let demoOn = isDemo();
export const demoActive = () => demoOn;

interface DemoTag extends TagDetail {
  scans: Scan[];
}

const DEFAULT_KEY_KCV = '66E94B'; // key check value of the all-zeros factory key

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
let nextId = 1;
const id = () => `demo-${nextId++}`;

// Fake visitor IDs, shaped like the real hashed IPs.
const VISITORS = ['3fa91c0d', '8b27e4a1', 'c05d7712', '5e6f90ab'];

function scan(minutes: number, counter: number, reason: ScanReason, visitor = 0): Scan {
  return {
    _id: id(),
    scannedAt: minutesAgo(minutes),
    counter,
    valid: reason === 'ok',
    reason,
    ip: VISITORS[visitor] + '0'.repeat(24)
  };
}

function tag(uid: string, itemName: string, ownerName: string, days: number, kcv: string, scans: Scan[]): DemoTag {
  return {
    _id: id(),
    uid,
    itemName,
    ownerName,
    createdAt: minutesAgo(days * 24 * 60),
    keyCheckValue: kcv,
    defaultKey: kcv === DEFAULT_KEY_KCV,
    scans
  };
}

// Sample tags covering every state the real app shows. UIDs start with "DE" (demo).
function sampleData(): DemoTag[] {
  return [
    tag('DE000000000001', 'Leather wallet', 'Alex Example', 21, '3C9A1F', [
      scan(12, 7, 'ok', 0),
      scan(60 * 26, 6, 'ok', 0),
      scan(60 * 50, 5, 'ok', 1),
      scan(60 * 24 * 6, 4, 'ok', 0)
    ]),
    tag('DE000000000002', 'Mechanical watch', 'Sam Sample', 14, 'B41E07', [
      scan(45, 12, 'ok', 2),
      scan(90, 11, 'bad_cmac', 3),
      scan(60 * 30, 11, 'ok', 2)
    ]),
    tag('DE000000000003', 'Designer handbag', 'Alex Example', 10, '7D20C5', [
      scan(150, 4, 'replay', 3),
      scan(60 * 72, 5, 'ok', 1),
      scan(60 * 96, 4, 'ok', 1)
    ]),
    tag('DE000000000004', 'Limited sneakers', 'Jo Demo', 5, DEFAULT_KEY_KCV, [scan(60 * 8, 2, 'ok', 0)]),
    tag('DE000000000005', 'Vintage camera', 'Sam Sample', 1, '0F5B92', [])
  ];
}

let store: DemoTag[] = sampleData();

function listItem({ scans, ...t }: DemoTag): TagListItem {
  const last = scans[0];
  return { ...t, lastScan: last ? { scannedAt: last.scannedAt, counter: last.counter, valid: last.valid } : null };
}

function dashboard(): DashboardData {
  const all = store.flatMap((t) => t.scans);
  const recentTags = store
    .filter((t) => t.scans.length)
    .map((t) => ({ uid: t.uid, itemName: t.itemName ?? null, ...pickScan(t.scans[0]) }))
    .sort((a, b) => b.scannedAt.localeCompare(a.scannedAt))
    .slice(0, 10);
  // Same rule as the server: flagged when the latest scan with a valid signature was a replay.
  const flaggedTags = store.filter((t) => t.scans.find((s) => s.reason !== 'bad_cmac')?.valid === false).length;
  return {
    totalTags: store.length,
    totalScans: all.length,
    invalidScans: all.filter((s) => !s.valid).length,
    flaggedTags,
    recentTags
  };
}

function pickScan(s: Scan) {
  return { scannedAt: s.scannedAt, counter: s.counter, valid: s.valid, reason: s.reason };
}

// Stand-in key check value for keys entered in the demo (not the real AES calculation).
function fakeKcv(key: string): string {
  if (/^0+$/.test(key)) return DEFAULT_KEY_KCV;
  let h = 0x811c9dc5;
  for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193);
  return ((h >>> 0) & 0xffffff).toString(16).toUpperCase().padStart(6, '0');
}

export interface DemoResponse {
  status: number;
  body: unknown;
}

const ok = (body: unknown, status = 200): DemoResponse => ({ status, body });
const fail = (status: number, error: string): DemoResponse => ({ status, body: { error } });

// Answers the admin API calls the pages make, the way the real server would.
export function handleDemo(path: string, method: string, body: unknown): DemoResponse {
  const tagMatch = path.match(/^\/api\/tags\/([^/?]+)$/);

  if (method === 'GET' && path === '/api/auth/me') return ok({ admin: true });
  if (method === 'GET' && path === '/api/dashboard') return ok(dashboard());
  if (method === 'GET' && path === '/api/tags') {
    return ok([...store].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(listItem));
  }

  if (tagMatch) {
    const uid = decodeURIComponent(tagMatch[1]).toUpperCase();
    const found = store.find((t) => t.uid === uid);
    if (!found) return fail(404, `No tag with UID ${uid}`);
    if (method === 'GET') return ok(found);
    if (method === 'PATCH') {
      const { itemName, ownerName } = (body ?? {}) as Record<string, string | undefined>;
      if (!itemName?.trim()) return fail(400, 'Enter an item name.');
      found.itemName = itemName.trim();
      found.ownerName = ownerName?.trim() || undefined;
      const { scans: _scans, ...saved } = found;
      return ok(saved);
    }
    if (method === 'DELETE') {
      store = store.filter((t) => t !== found);
      return ok(null, 204);
    }
  }

  if (method === 'POST' && path === '/api/tags') {
    const { uid, itemName, ownerName, sdmFileReadKey } = (body ?? {}) as Record<string, string | undefined>;
    const cleanUid = String(uid ?? '').toUpperCase();
    if (store.some((t) => t.uid === cleanUid)) {
      return fail(409, `A tag with UID ${cleanUid} is already registered`);
    }
    if (store.length >= 50) return fail(400, 'The demo holds at most 50 tags. Delete one first.');
    const kcv = fakeKcv(String(sdmFileReadKey ?? '').toUpperCase());
    const created = tag(cleanUid, itemName ?? '', ownerName ?? '', 0, kcv, []);
    store.push(created);
    const { scans: _scans, ...saved } = created;
    return ok(saved, 201);
  }

  return fail(404, 'Not available in the demo');
}
