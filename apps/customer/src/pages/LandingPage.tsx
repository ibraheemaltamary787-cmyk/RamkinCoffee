import { Link } from 'react-router-dom';
import { BRAND, DEV_FAKE_OTP_CODE } from '@ramkin/shared';
import { BrandMark } from '../components/BrandMark';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { isDevFakeOtpEnabled } from '../services/devFakeOtp';

export function LandingPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const fakeOtp = isDevFakeOtpEnabled();

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 90% 55% at 50% -8%, rgba(212,175,55,0.26), transparent 55%),
            radial-gradient(ellipse 55% 40% at 0% 100%, rgba(92,48,22,0.45), transparent 55%),
            radial-gradient(ellipse 45% 35% at 100% 70%, rgba(212,175,55,0.08), transparent 50%),
            linear-gradient(168deg, #030303 0%, #12100c 48%, #070707 100%)
          `,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(212,175,55,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.07) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 12%, transparent 72%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-1 flex-col px-5 pb-12 pt-6 sm:px-8">
        <div className="flex justify-end">
          <LanguageSwitch />
        </div>

        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center text-center">
          <div className="animate-fade-up mb-6">
            <BrandMark size="lg" />
          </div>

          <h1
            className="animate-fade-up text-5xl font-semibold tracking-[0.2em] text-[var(--ramkin-gold)] sm:text-6xl"
            style={{ fontFamily: 'var(--font-display)', animationDelay: '60ms' }}
          >
            {BRAND.name}
          </h1>

          <p
            className="animate-fade-up animate-gold-sheen mt-4 text-sm font-medium tracking-[0.28em] text-[var(--ramkin-gold-soft)]/90 uppercase"
            style={{ animationDelay: '120ms' }}
          >
            {t('brandTagline')}
          </p>

          <p
            className="animate-fade-up mt-8 max-w-md text-lg leading-snug text-[var(--ramkin-mist)] sm:text-xl"
            style={{ fontFamily: 'var(--font-display)', animationDelay: '180ms' }}
          >
            {t('loyaltyOffer')}
          </p>
          <p
            className="animate-fade-up mt-3 max-w-md text-sm leading-relaxed text-[var(--ramkin-mist)]/65"
            style={{ animationDelay: '220ms' }}
          >
            {t('loyaltyOfferSub')}
          </p>

          <div
            className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: '280ms' }}
          >
            {user ? (
              <Link
                to="/home"
                className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] px-8 py-3 text-sm font-medium tracking-[0.2em] text-black uppercase transition hover:bg-[var(--ramkin-gold-soft)]"
              >
                {t('openHome')}
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] px-8 py-3 text-sm font-medium tracking-[0.2em] text-black uppercase transition hover:bg-[var(--ramkin-gold-soft)]"
                >
                  {t('join')}
                </Link>
                <Link
                  to="/login"
                  className="border border-[var(--ramkin-gold)]/45 px-8 py-3 text-sm font-medium tracking-[0.2em] text-[var(--ramkin-gold)] uppercase transition hover:border-[var(--ramkin-gold)] hover:bg-white/5"
                >
                  {t('login')}
                </Link>
              </>
            )}
          </div>

          {fakeOtp && !user ? (
            <p
              className="animate-fade-up mt-8 max-w-sm border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-xs leading-relaxed text-amber-100/85"
              style={{ animationDelay: '340ms' }}
            >
              {t('fakeOtpTip', { code: DEV_FAKE_OTP_CODE })}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
