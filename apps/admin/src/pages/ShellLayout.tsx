import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  BRAND,
  canDisableAccounts,
  canManageStaffRoles,
  canUpdateLoyaltySettings,
  canViewActivityLogs,
  canViewReports,
} from '@ramkin/shared';
import { useAuth } from '../auth/AuthContext';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { useLocale } from '../i18n/LocaleContext';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-sm px-3 py-2.5 text-xs tracking-[0.14em] uppercase transition ${
    isActive
      ? 'bg-[var(--ramkin-gold)]/12 text-[var(--ramkin-gold)]'
      : 'text-[var(--ramkin-mist)]/55 hover:bg-white/5 hover:text-[var(--ramkin-gold-soft)]'
  }`;

export function ShellLayout() {
  const { role, user, signOut } = useAuth();
  const { t } = useLocale();
  const [navOpen, setNavOpen] = useState(false);

  const closeNav = () => setNavOpen(false);

  const nav = (
    <nav className="flex flex-col gap-0.5" onClick={closeNav}>
      <NavLink to="/app" end className={linkClass}>
        {t('navOverview')}
      </NavLink>
      <NavLink to="/app/counter" className={linkClass}>
        {t('navCounter')}
      </NavLink>
      <NavLink to="/app/rewards" className={linkClass}>
        {t('navRewards')}
      </NavLink>
      <NavLink to="/app/customers" className={linkClass}>
        {t('navCustomers')}
      </NavLink>
      <NavLink to="/app/transactions" className={linkClass}>
        {t('navTransactions')}
      </NavLink>
      {canViewReports(role) ? (
        <NavLink to="/app/reports" className={linkClass}>
          {t('navReports')}
        </NavLink>
      ) : null}
      {canManageStaffRoles(role) || canDisableAccounts(role) ? (
        <NavLink to="/app/accounts" className={linkClass}>
          {t('navStaff')}
        </NavLink>
      ) : null}
      {canUpdateLoyaltySettings(role) ? (
        <NavLink to="/app/settings" className={linkClass}>
          {t('navSettings')}
        </NavLink>
      ) : null}
      {canViewActivityLogs(role) ? (
        <NavLink to="/app/activity" className={linkClass}>
          {t('navActivity')}
        </NavLink>
      ) : null}
      <NavLink to="/bootstrap" className={linkClass}>
        {t('navBootstrap')}
      </NavLink>
    </nav>
  );

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="print:hidden border-b border-white/10 bg-black/55 lg:fixed lg:inset-y-0 lg:start-0 lg:flex lg:w-[var(--sidebar-width)] lg:flex-col lg:border-b-0 lg:border-e lg:border-white/10">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/brand/ramkin-logo.jpg"
              alt="RAMKIN"
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-[var(--ramkin-gold)]/40"
            />
            <div className="min-w-0">
              <p
                className="truncate text-lg tracking-[0.16em] text-[var(--ramkin-gold)] animate-gold-sheen"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {BRAND.name}
              </p>
              <p className="truncate text-[10px] tracking-[0.2em] text-[var(--ramkin-mist)]/45 uppercase">
                {role ?? 'unknown'} · {user?.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="border border-white/15 px-2.5 py-1.5 text-[10px] tracking-[0.16em] text-[var(--ramkin-mist)]/70 uppercase lg:hidden"
            onClick={() => setNavOpen((open) => !open)}
            aria-expanded={navOpen}
          >
            {navOpen ? t('close') : t('menu')}
          </button>
        </div>

        <div
          className={`${navOpen ? 'block' : 'hidden'} border-t border-white/10 px-3 py-3 lg:block lg:flex-1 lg:border-t-0 lg:px-3 lg:py-2`}
        >
          <div className="mb-3 px-1">
            <LanguageSwitch />
          </div>
          {nav}
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-4 w-full px-3 py-2 text-start text-[10px] tracking-[0.2em] text-[var(--ramkin-gold-soft)]/70 uppercase transition hover:text-[var(--ramkin-gold)]"
          >
            {t('signOut')}
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:ms-[var(--sidebar-width)]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 print:max-w-none print:px-0 print:py-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
