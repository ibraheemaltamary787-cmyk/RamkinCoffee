import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface CustomerQrProps {
  token: string;
}

export function CustomerQr({ token }: CustomerQrProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // Payload staff scanners accept: opaque token or /c/<token> deep link.
        const payload = `https://ramkin.local/c/${token}`;
        const url = await QRCode.toDataURL(payload, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 220,
          color: {
            dark: '#0a0a0a',
            light: '#f3efe6',
          },
        });
        if (!cancelled) {
          setDataUrl(url);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not render QR.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return <p className="text-xs text-red-300/80">{error}</p>;
  }

  if (!dataUrl) {
    return <p className="text-xs text-[var(--ramkin-mist)]/40">Preparing QR…</p>;
  }

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <img
        src={dataUrl}
        alt="Your counter QR code"
        className="h-48 w-48 border border-[var(--ramkin-gold)]/30 bg-[var(--ramkin-mist)] p-2"
      />
      <p className="max-w-[14rem] break-all text-center text-[10px] tracking-[0.12em] text-[var(--ramkin-mist)]/40 uppercase">
        Show at the counter · {token.slice(0, 8)}…
      </p>
    </div>
  );
}
