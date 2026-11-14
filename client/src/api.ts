import { useEffect, useState } from 'react';

export interface NewTag {
  uid: string;
  itemName: string;
  ownerName?: string;
  sdmFileReadKey: string;
  // A tap of the tag; when given, the server checks the key against it before saving.
  tap?: { ctr: string; cmac: string };
}

export interface SavedTag {
  _id: string;
  uid: string;
  itemName?: string;
  ownerName?: string;
  createdAt: string;
}

export type ScanReason = 'ok' | 'bad_cmac' | 'replay';

export interface Scan {
  _id: string;
  scannedAt: string;
  counter?: number;
  valid?: boolean;
  reason?: ScanReason;
  ip?: string;
}

export interface TagListItem extends SavedTag {
  lastScan: Pick<Scan, 'scannedAt' | 'counter' | 'valid'> | null;
}

export interface VerifyResult {
  // checked/reopened: the same link as the last genuine tap, opened again (not logged).
  result: 'genuine' | 'invalid' | 'checked';
  reason: ScanReason | 'reopened';
  uid: string;
  itemName: string | null;
  ctr: string;
  counter: number;
  cmac: string;
  lastGenuineCounter: number | null;
  scannedAt: string;
  scanCount: number;
  recentScans: Pick<Scan, 'scannedAt' | 'counter' | 'valid' | 'reason'>[];
}

export interface TagDetail extends SavedTag {
  scans: Scan[];
}

export interface DashboardData {
  totalTags: number;
  totalScans: number;
  invalidScans: number;
  flaggedTags: number;
  // The 10 most recently scanned tags, each with its latest scan.
  recentTags: ({
    uid: string;
    itemName: string | null;
  } & Pick<Scan, 'scannedAt' | 'counter' | 'valid' | 'reason'>)[];
}

// Error with the HTTP status, so pages can react to e.g. 404 differently.
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ApiError("Can't reach the server. Is it running?", 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (body?.error) throw new ApiError(body.error, res.status);
    // Vite's proxy answers 5xx with an empty body when the API is down.
    throw new ApiError(
      res.status >= 500 ? "Can't reach the server. Is it running?" : `Request failed (${res.status})`,
      res.status
    );
  }
  return body as T;
}

// Loads `path` on mount and whenever it changes.
export function useApi<T>(path: string) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({
    data: null,
    error: null,
    loading: true
  });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, error: null, loading: true });
    request<T>(path).then(
      (data) => !cancelled && setState({ data, error: null, loading: false }),
      (err: Error) => !cancelled && setState({ data: null, error: err.message, loading: false })
    );
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}

export function registerTag(tag: NewTag): Promise<SavedTag> {
  return request<SavedTag>('/api/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tag)
  });
}

// Every call records a scan, so the same tap URL must only be sent once.
// React runs effects twice in development; caching by URL keeps that to one request.
const verifyRequests = new Map<string, Promise<VerifyResult>>();

export function verifyTap(search: string): Promise<VerifyResult> {
  let pending = verifyRequests.get(search);
  if (!pending) {
    pending = request<VerifyResult>(`/api/verify${search}`);
    verifyRequests.set(search, pending);
  }
  return pending;
}

export function getSession(): Promise<{ admin: boolean }> {
  return request('/api/auth/me');
}

export function login(password: string): Promise<{ admin: boolean }> {
  return request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
}

export function logout(): Promise<{ admin: boolean }> {
  return request('/api/auth/logout', { method: 'POST' });
}

export function deleteTag(uid: string): Promise<void> {
  return request<void>(`/api/tags/${uid}`, { method: 'DELETE' });
}
