import { BRAND } from '@ramkin/shared';

export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim =
    size === 'lg' ? 'h-28 w-28 sm:h-36 sm:w-36' : size === 'sm' ? 'h-12 w-12 sm:h-14 sm:w-14' : 'h-20 w-20';

  return (
    <img
      src="/brand/ramkin-logo.jpg"
      alt={`${BRAND.name} logo`}
      className={`${dim} rounded-full object-cover ring-1 ring-[var(--ramkin-gold)]/45 shadow-[0_0_48px_rgba(212,175,55,0.22)]`}
    />
  );
}
