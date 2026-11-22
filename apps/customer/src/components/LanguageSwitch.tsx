import { useLocale } from '../i18n/LocaleContext';

export function LanguageSwitch({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className={`inline-flex items-center gap-1 border border-[var(--ramkin-line)] bg-black/35 p-1 ${className}`}
      role="group"
      aria-label={t('language')}
    >
      {(['en', 'ar'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`min-w-11 px-2.5 py-1.5 text-xs tracking-[0.16em] uppercase transition ${
            locale === code
              ? 'bg-[var(--ramkin-gold)] text-black'
              : 'text-[var(--ramkin-gold-soft)]/75 hover:text-[var(--ramkin-gold)]'
          }`}
        >
          {code === 'en' ? 'EN' : 'عربي'}
        </button>
      ))}
    </div>
  );
}
