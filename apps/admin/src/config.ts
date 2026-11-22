/** Default customer landing for site QR stickers (never a stamp / counter token). */
export const QR_LANDING_STORAGE_KEY = 'ramkin.admin.qrLandingUrl';

const LOCAL_CUSTOMER_ORIGIN = 'http://127.0.0.1:5173';

/**
 * Resolve the default QR destination for this admin build.
 * Prefer explicit env; fall back to local customer Vite origin (not the admin origin).
 */
export function getDefaultQrLandingUrl(): string {
  const fromQr = import.meta.env.VITE_QR_LANDING_URL?.trim();
  if (fromQr) return stripTrailingSlash(fromQr);

  const fromCustomer = import.meta.env.VITE_CUSTOMER_URL?.trim();
  if (fromCustomer) return stripTrailingSlash(fromCustomer);

  return LOCAL_CUSTOMER_ORIGIN;
}

export function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/** Accept only absolute http(s) URLs suitable for a customer landing sticker. */
export function parseQrLandingUrl(raw: string): { ok: true; url: string } | { ok: false; reason: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, reason: 'empty' };
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: 'invalid' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'protocol' };
  }
  // Reject accidental stamp / counter deep links in the destination field.
  const path = parsed.pathname.toLowerCase();
  if (path.includes('/c/') || path.includes('stamp') || path.includes('self-stamp')) {
    return { ok: false, reason: 'self-stamp' };
  }
  return { ok: true, url: stripTrailingSlash(parsed.toString()) };
}

export function readStoredQrLandingUrl(): string | null {
  try {
    const stored = localStorage.getItem(QR_LANDING_STORAGE_KEY);
    if (!stored) return null;
    const parsed = parseQrLandingUrl(stored);
    return parsed.ok ? parsed.url : null;
  } catch {
    return null;
  }
}

export function writeStoredQrLandingUrl(url: string): void {
  try {
    localStorage.setItem(QR_LANDING_STORAGE_KEY, url);
  } catch {
    // ignore quota / private mode
  }
}
