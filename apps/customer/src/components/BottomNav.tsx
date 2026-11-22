import { NavLink } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleContext';

const links = [
  { to: '/home', key: 'navHome' as const },
  { to: '/loyalty', key: 'navLoyalty' as const },
  { to: '/rewards', key: 'navRewards' as const },
  { to: '/profile', key: 'navProfile' as const },
];

export function BottomNav() {
  const { t } = useLocale();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--ramkin-line)] bg-[rgba(5,5,5,0.92)] backdrop-blur-md"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] tracking-[0.14em] uppercase transition ${
                isActive
                  ? 'text-[var(--ramkin-gold)]'
                  : 'text-[var(--ramkin-mist)]/45 hover:text-[var(--ramkin-gold-soft)]'
              }`
            }
          >
            <span
              className="h-1 w-6 rounded-full bg-current opacity-80"
              aria-hidden
            />
            {t(link.key)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
