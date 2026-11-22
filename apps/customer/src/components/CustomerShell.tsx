import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '@ramkin/shared';
import { BrandMark } from './BrandMark';
import { BottomNav } from './BottomNav';
import { LanguageSwitch } from './LanguageSwitch';
import { useLocale } from '../i18n/LocaleContext';

interface CustomerShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBottomNav?: boolean;
  actions?: ReactNode;
}

export function CustomerShell({
  children,
  title,
  subtitle,
  showBottomNav = true,
  actions,
}: CustomerShellProps) {
  const { t } = useLocale();

  return (
    <div className="page-enter mx-auto min-h-dvh w-full max-w-lg px-5 pb-28 pt-6 sm:px-6 sm:pt-8">
      <header className="mb-6 flex items-start justify-between gap-3">
        <Link to="/home" className="flex min-w-0 items-center gap-3">
          <BrandMark size="sm" />
          <div className="min-w-0">
            <p
              className="truncate text-lg tracking-[0.16em] text-[var(--ramkin-gold)] sm:text-xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {title ?? BRAND.name}
            </p>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-[var(--ramkin-mist)]/50">{subtitle}</p>
            ) : (
              <p className="text-[10px] tracking-[0.2em] text-[var(--ramkin-mist)]/40 uppercase">
                {t('brandTagline')}
              </p>
            )}
          </div>
        </Link>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <LanguageSwitch />
          {actions}
        </div>
      </header>
      {children}
      {showBottomNav ? <BottomNav /> : null}
    </div>
  );
}
