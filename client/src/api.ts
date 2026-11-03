import { useEffect, useState } from 'react';

export interface NewTag {
  uid: string;
  itemName: string;
  ownerName?: string;
  sdmFileReadKey: string;
}

export interface SavedTag {
  _id: string;
  uid: string;
  itemName?: string;
  ownerName?: string;
  createdAt: string;
}

export interface Scan {
  _id: string;
  scannedAt: string;
  counter?: number;
  valid?: boolean;
  ip?: string;
}

export interface TagListItem extends SavedTag {
  lastScan: Pick<Scan, 'scannedAt' | 'counter' | 'valid'> | null;
}

export interface TagDetail extends SavedTag {
  scans: Scan[];
}

export interface DashboardData {
  totalTags: number;
  totalScans: number;
  invalidScans: number;
  flaggedTags: number;
  recentInvalidScans: {
    uid: string;
    itemName: string | null;
    scannedAt: string;
    counter?: number;
    ip?: string;
  }[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new Error("Can't reach the server. Is it running?");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (body?.error) throw new Error(body.error);
    // Vite's proxy answers 5xx with an empty body when the API is down.
    throw new Error(res.status >= 500 ? "Can't reach the server. Is it running?" : `Request failed (${res.status})`);
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

export function deleteTag(uid: string): Promise<void> {
  return request<void>(`/api/tags/${uid}`, { method: 'DELETE' });
}
