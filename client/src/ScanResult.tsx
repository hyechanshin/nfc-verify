import type { ScanReason } from './api';

const INVALID_LABEL: Record<ScanReason, string> = {
  ok: 'Invalid',
  bad_cmac: 'Invalid · bad signature',
  replay: 'Invalid · reused link'
};

// "Genuine" / "Invalid" text for a scan, or "Not scanned" when there is none.
export default function ScanResult({ scan }: { scan: { valid?: boolean; reason?: ScanReason } | null }) {
  if (!scan) return <span className="subtle">Not scanned</span>;
  if (scan.valid) return <span className="ok-text">Genuine</span>;
  return <span className="bad-text">{scan.reason ? INVALID_LABEL[scan.reason] : 'Invalid'}</span>;
}
