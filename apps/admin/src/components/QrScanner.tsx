import { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
  onScan: (token: string) => void;
  active: boolean;
}

function extractToken(raw: string): string {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split('/').filter(Boolean);
    const cIndex = parts.indexOf('c');
    if (cIndex >= 0 && parts[cIndex + 1]) {
      return parts[cIndex + 1];
    }
  } catch {
    // not a URL — treat as opaque token
  }
  return trimmed;
}

export function QrScanner({ onScan, active }: QrScannerProps) {
  const regionId = useId().replace(/:/g, '');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!active) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner?.isScanning) {
        void scanner.stop().catch(() => undefined);
      }
      setRunning(false);
      return;
    }

    let cancelled = false;
    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;

    void (async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            const token = extractToken(decoded);
            if (token) onScan(token);
          },
          () => undefined,
        );
        if (!cancelled) {
          setRunning(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setRunning(false);
          setError(
            err instanceof Error ? err.message : 'Camera unavailable — paste the QR token instead.',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      const current = scannerRef.current;
      scannerRef.current = null;
      if (current?.isScanning) {
        void current.stop().catch(() => undefined);
      }
    };
  }, [active, onScan, regionId]);

  return (
    <div className="space-y-2">
      <div
        id={regionId}
        className="overflow-hidden border border-[var(--ramkin-gold)]/25 bg-black/50"
        style={{ minHeight: active ? 240 : 0 }}
      />
      {running ? (
        <p className="text-xs text-[var(--ramkin-gold-soft)]/70">
          Scanner live — point at customer QR.
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-300/90">{error}</p> : null}
    </div>
  );
}
