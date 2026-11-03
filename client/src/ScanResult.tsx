// "Genuine" / "Invalid" text for a scan, or "Not scanned" when there is none.
export default function ScanResult({ scan }: { scan: { valid?: boolean } | null }) {
  if (!scan) return <span className="subtle">Not scanned</span>;
  return scan.valid ? <span className="ok-text">Genuine</span> : <span className="bad-text">Invalid</span>;
}
