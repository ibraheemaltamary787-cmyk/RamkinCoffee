import { Link, Navigate } from 'react-router-dom';
import { CustomerShell } from '../components/CustomerShell';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n/LocaleContext';

export function OrderInStorePage() {
  const { loading, user, configured } = useAuth();
  const { t } = useLocale();

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
    <CustomerShell title={t('orderInStoreTitle')}>
      <p className="text-sm leading-relaxed text-[var(--ramkin-mist)]/70">{t('orderInStoreBody')}</p>
      <ol className="mt-8 space-y-3 border border-[var(--ramkin-line)] bg-black/35 px-5 py-5 text-sm text-[var(--ramkin-mist)]/75">
        <li>1. {t('orderAtRamkin')}</li>
        <li>2. {t('howItWorks3')}</li>
        <li>3. {t('counterQrHint')}</li>
      </ol>
      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link to="/loyalty" className="text-[var(--ramkin-gold)] hover:underline">
          {t('navLoyalty')}
        </Link>
        <Link to="/home" className="text-[var(--ramkin-mist)]/50 hover:text-[var(--ramkin-gold)]">
          {t('backHome')}
        </Link>
      </div>
    </CustomerShell>
  );
}
