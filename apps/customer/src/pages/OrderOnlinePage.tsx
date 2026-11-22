import { Link, Navigate } from 'react-router-dom';
import { CustomerShell } from '../components/CustomerShell';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { getFoodicsMenuUrl, openFoodicsMenu } from '../config';

export function OrderOnlinePage() {
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
    <CustomerShell title={t('orderOnlinePageTitle')}>
      <p className="text-sm leading-relaxed text-[var(--ramkin-mist)]/70">{t('orderOnlinePageBody')}</p>
      <button
        type="button"
        onClick={() => openFoodicsMenu()}
        className="mt-8 w-full border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] py-3.5 text-sm font-medium tracking-[0.18em] text-black uppercase transition hover:bg-[var(--ramkin-gold-soft)]"
      >
        {t('openMenu')}
      </button>
      <p className="mt-3 break-all text-center text-[10px] text-[var(--ramkin-mist)]/35">
        {getFoodicsMenuUrl()}
      </p>
      <Link
        to="/home"
        className="mt-8 inline-block text-sm text-[var(--ramkin-gold)] hover:underline"
      >
        {t('backHome')}
      </Link>
    </CustomerShell>
  );
}
