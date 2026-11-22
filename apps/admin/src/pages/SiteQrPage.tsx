import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { BRAND } from '@ramkin/shared';
import { useAuth } from '../auth/AuthContext';
import {
  getDefaultQrLandingUrl,
  parseQrLandingUrl,
  readStoredQrLandingUrl,
  writeStoredQrLandingUrl,
} from '../config';
import { useLocale } from '../i18n/LocaleContext';

export function SiteQrPage() {
  const { role } = useAuth();
  const { t } = useLocale();
  const isOwner = role === 'OWNER';

  const [destinationDraft, setDestinationDraft] = useState(() => {
    return readStoredQrLandingUrl() ?? getDefaultQrLandingUrl();
  });
  const [activeUrl, setActiveUrl] = useState(() => {
    return readStoredQrLandingUrl() ?? getDefaultQrLandingUrl();
  });
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const regenerate = useCallback(
    async (url: string) => {
      setBusy(true);
      setError(null);
      try {
        const parsed = parseQrLandingUrl(url);
        if (!parsed.ok) {
          setDataUrl(null);
          setError(t('qrInvalidUrl'));
          return;
        }
        const png = await QRCode.toDataURL(parsed.url, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 512,
          color: {
            dark: '#0a0a0a',
            light: '#f3efe6',
          },
        });
        setActiveUrl(parsed.url);
        setDataUrl(png);
      } catch (err) {
        setDataUrl(null);
        setError(err instanceof Error ? err.message : t('qrInvalidUrl'));
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void regenerate(activeUrl);
  }, [activeUrl, regenerate]);

  if (!isOwner) {
    return (
      <section className="animate-fade-up">
        <h1
          className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('qrTitle')}
        </h1>
        <p className="mt-3 text-sm text-[var(--ramkin-mist)]/60">{t('qrOwnerOnly')}</p>
      </section>
    );
  }

  function onSaveDestination(e: React.FormEvent) {
    e.preventDefault();
    setSavedNote(null);
    const parsed = parseQrLandingUrl(destinationDraft);
    if (!parsed.ok) {
      setError(t('qrInvalidUrl'));
      return;
    }
    writeStoredQrLandingUrl(parsed.url);
    setDestinationDraft(parsed.url);
    setActiveUrl(parsed.url);
    setSavedNote(t('qrSaved'));
  }

  function onUseDefault() {
    const next = getDefaultQrLandingUrl();
    setDestinationDraft(next);
    writeStoredQrLandingUrl(next);
    setActiveUrl(next);
    setSavedNote(t('qrSaved'));
    setError(null);
  }

  function onDownload() {
    if (!dataUrl) return;
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = `ramkin-customer-landing-qr.png`;
    anchor.click();
  }

  return (
    <section className="animate-fade-up site-qr-print-root space-y-8">
      <div className="print:hidden">
        <h1
          className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('qrTitle')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ramkin-mist)]/60">{t('qrSub')}</p>
        <p className="mt-3 max-w-2xl border border-[var(--ramkin-gold)]/25 bg-[var(--ramkin-gold)]/5 px-3 py-2 text-xs leading-relaxed text-[var(--ramkin-gold-soft)]">
          {t('qrWarning')}
        </p>

        <form onSubmit={onSaveDestination} className="mt-8 max-w-xl space-y-3">
          <label className="block">
            <span className="text-xs tracking-[0.2em] text-[var(--ramkin-mist)]/45 uppercase">
              {t('qrDestination')}
            </span>
            <input
              value={destinationDraft}
              onChange={(e) => {
                setDestinationDraft(e.target.value);
                setSavedNote(null);
              }}
              placeholder={getDefaultQrLandingUrl()}
              className="mt-2 w-full border border-white/15 bg-black/40 px-3 py-2.5 font-mono text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
              autoComplete="url"
              inputMode="url"
            />
          </label>
          <p className="text-xs text-[var(--ramkin-mist)]/45">{t('qrDestinationHint')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)]/10 px-4 py-2 text-xs tracking-[0.2em] text-[var(--ramkin-gold)] uppercase disabled:opacity-50"
            >
              {t('qrSaveDestination')}
            </button>
            <button
              type="button"
              onClick={onUseDefault}
              className="border border-white/15 px-4 py-2 text-xs tracking-[0.2em] uppercase hover:border-[var(--ramkin-gold)]/40"
            >
              {t('qrUseDefault')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void regenerate(destinationDraft)}
              className="border border-white/15 px-4 py-2 text-xs tracking-[0.2em] uppercase hover:border-[var(--ramkin-gold)]/40 disabled:opacity-50"
            >
              {busy ? t('qrGenerating') : t('generate')}
            </button>
          </div>
        </form>

        {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}
        {savedNote ? (
          <p className="mt-4 text-sm text-[var(--ramkin-gold-soft)]">{savedNote}</p>
        ) : null}
      </div>

      <div className="border border-white/10 bg-black/30 p-6 print:border-0 print:bg-white print:p-0">
        <div className="print:hidden mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs tracking-[0.2em] text-[var(--ramkin-mist)]/45 uppercase">
            {t('qrCurrent')}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!dataUrl}
              onClick={onDownload}
              className="border border-[var(--ramkin-gold)]/50 px-3 py-1.5 text-[10px] tracking-[0.18em] text-[var(--ramkin-gold)] uppercase disabled:opacity-40"
            >
              {t('qrDownloadPng')}
            </button>
            <button
              type="button"
              disabled={!dataUrl}
              onClick={() => window.print()}
              className="border border-white/20 px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase disabled:opacity-40"
            >
              {t('qrPrint')}
            </button>
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/20 px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase hover:border-[var(--ramkin-gold)]/40"
            >
              {t('qrPreviewOpen')}
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex items-center gap-3">
            <img
              src="/brand/ramkin-logo.jpg"
              alt={BRAND.name}
              className="h-14 w-14 rounded-full object-cover ring-1 ring-[var(--ramkin-gold)]/40 print:ring-black/20"
            />
            <div className="text-start">
              <p
                className="text-2xl tracking-[0.16em] text-[var(--ramkin-gold)] print:text-black"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {BRAND.name}
              </p>
              <p className="text-[10px] tracking-[0.2em] text-[var(--ramkin-mist)]/50 uppercase print:text-black/60">
                {BRAND.tagline}
              </p>
            </div>
          </div>

          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`${BRAND.name} customer landing QR`}
              className="h-56 w-56 border border-[var(--ramkin-gold)]/30 bg-[var(--ramkin-mist)] p-2 print:h-64 print:w-64 print:border-black/20"
            />
          ) : (
            <p className="text-sm text-[var(--ramkin-mist)]/45">{t('qrGenerating')}</p>
          )}

          <p className="max-w-md break-all font-mono text-xs text-[var(--ramkin-mist)]/55 print:text-black/70">
            {activeUrl}
          </p>
          <p className="max-w-sm text-xs text-[var(--ramkin-mist)]/45 print:text-black/55">
            {t('qrWarning')}
          </p>
        </div>
      </div>
    </section>
  );
}
