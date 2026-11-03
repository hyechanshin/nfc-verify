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

export function registerTag(tag: NewTag): Promise<SavedTag> {
  return request<SavedTag>('/api/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tag)
  });
}
