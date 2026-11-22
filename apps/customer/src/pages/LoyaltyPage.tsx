import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import type { LoyaltyProgressDto } from '@ramkin/shared';
import { CustomerQr } from '../components/CustomerQr';
import { CustomerShell } from '../components/CustomerShell';
import { StampCard } from '../components/StampCard';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { callGetLoyaltyProgress } from '../services/callables';

export function LoyaltyPage() {
  const { loading, user, configured } = useAuth();
  const { t } = useLocale();
  const [progress, setProgress] = useState<LoyaltyProgressDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await callGetLoyaltyProgress();
      setProgress(result.progress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load loyalty.');
    }
  }, []);

  useEffect(() => {
    if (!configured || !user) return;
    void refresh();
  }, [configured, user, refresh]);

  if (!configured) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-5 text-[var(--ramkin-gold-soft)]">
        {t('configureFirebase')}
      </main>
    );
  }
  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-[var(--ramkin-gold-soft)]">
        {t('loading')}
      </main>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <CustomerShell title={t('myLoyalty')} subtitle={t('myLoyaltySub')}>
      <StampCard progress={progress} />
      {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}

      <section className="mt-8">
        <h2 className="text-xs tracking-[0.2em] text-[var(--ramkin-gold-soft)] uppercase">
          {t('howItWorksTitle')}
        </h2>
        <ol className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--ramkin-mist)]/70">
          <li>1. {t('howItWorks1')}</li>
          <li>2. {t('howItWorks2')}</li>
          <li>3. {t('howItWorks3')}</li>
          <li>4. {t('howItWorks4')}</li>
        </ol>
      </section>

      {progress?.qrToken ? (
        <section className="mt-8 border border-white/10 bg-black/30 p-5 text-center">
          <h2 className="text-xs tracking-[0.22em] text-[var(--ramkin-gold-soft)] uppercase">
            {t('counterQrTitle')}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-xs text-[var(--ramkin-mist)]/48">
            {t('counterQrHint')}
          </p>
          <div className="mt-5 flex justify-center">
            <CustomerQr token={progress.qrToken} />
          </div>
        </section>
      ) : null}
    </CustomerShell>
  );
}
