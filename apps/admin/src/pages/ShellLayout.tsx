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

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm tracking-[0.12em] uppercase ${
    isActive
      ? 'text-[var(--ramkin-gold)]'
      : 'text-[var(--ramkin-cream)]/50 hover:text-[var(--ramkin-gold-soft)]'
  }`;

export function ShellLayout() {
  const { role, user, signOut } = useAuth();

  return (
    <div className="min-h-dvh">
      <header className="print:hidden border-b border-white/10 bg-black/50 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/brand/ramkin-logo.jpg"
              alt="RAMKIN"
              className="h-10 w-10 rounded-full object-cover ring-1 ring-[var(--ramkin-gold)]/40"
            />
            <div>
              <p
                className="text-lg tracking-[0.15em] text-[var(--ramkin-gold)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {BRAND.name}
              </p>
              <p className="text-[10px] tracking-[0.25em] text-[var(--ramkin-cream)]/45 uppercase">
                {role ?? 'unknown'} · {user?.email}
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-4">
            <NavLink to="/app" end className={linkClass}>
              Overview
            </NavLink>
            <NavLink to="/app/counter" className={linkClass}>
              Counter
            </NavLink>
            <NavLink to="/app/rewards" className={linkClass}>
              Rewards
            </NavLink>
            <NavLink to="/app/customers" className={linkClass}>
              Customers
            </NavLink>
            <NavLink to="/app/transactions" className={linkClass}>
              Transactions
            </NavLink>
            {canViewReports(role) && (
              <NavLink to="/app/reports" className={linkClass}>
                Reports
              </NavLink>
            )}
            {(canManageStaffRoles(role) || canDisableAccounts(role)) && (
              <NavLink to="/app/accounts" className={linkClass}>
                Staff
              </NavLink>
            )}
            {canUpdateLoyaltySettings(role) && (
              <NavLink to="/app/settings" className={linkClass}>
                Settings
              </NavLink>
            )}
            {canViewActivityLogs(role) && (
              <NavLink to="/app/activity" className={linkClass}>
                Activity
              </NavLink>
            )}
            <NavLink to="/bootstrap" className={linkClass}>
              Bootstrap
            </NavLink>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-xs tracking-[0.2em] text-[var(--ramkin-gold-soft)]/70 uppercase hover:text-[var(--ramkin-gold)]"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8 print:max-w-none print:px-0 print:py-0">
        <Outlet />
      </div>
    </div>
  );
}
