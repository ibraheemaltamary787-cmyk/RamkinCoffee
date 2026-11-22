import { progressPercent, type LoyaltyProgressDto } from '@ramkin/shared';
import { useLocale } from '../i18n/LocaleContext';

interface StampCardProps {
  progress: LoyaltyProgressDto | null;
  large?: boolean;
}

export function StampCard({ progress, large = true }: StampCardProps) {
  const { t } = useLocale();
  const purchaseCount = progress?.purchaseCount ?? 0;
  const required = progress?.requiredPurchases ?? 9;
  const remaining = progress?.remaining ?? required;
  const pct = progressPercent(purchaseCount, required);
  const complete =
    progress?.comboStatus === 'completed' ||
    progress?.comboStatus === 'reward_pending' ||
    progress?.comboStatus === 'reward_approved';

  let status = t('stampsRemaining', { n: remaining });
  if (remaining === 1 && !complete) status = t('stampRemainingOne');
  if (progress?.comboStatus === 'completed') status = t('rewardReady');
  if (progress?.comboStatus === 'reward_pending') status = t('rewardPending');
  if (progress?.comboStatus === 'reward_approved') status = t('rewardApproved');

  const stamps = Array.from({ length: required }, (_, i) => i < purchaseCount);

  return (
    <div
      className={`stamp-card relative overflow-hidden border border-[var(--ramkin-line)] bg-[linear-gradient(160deg,rgba(212,175,55,0.12),rgba(0,0,0,0.72)_42%,rgba(42,28,18,0.55))] ${
        large ? 'p-5 sm:p-7' : 'p-4'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 0%, rgba(212,175,55,0.28), transparent 45%), radial-gradient(circle at 90% 100%, rgba(120,72,32,0.35), transparent 40%)',
        }}
        aria-hidden
      />

      <div className="relative flex items-end justify-between gap-3">
        <p
          className={`font-semibold text-[var(--ramkin-gold)] ${large ? 'text-4xl sm:text-5xl' : 'text-3xl'}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {purchaseCount}
          <span className="text-[var(--ramkin-gold-soft)]/60"> / {required}</span>
        </p>
        <p className="max-w-[14rem] text-end text-xs leading-relaxed text-[var(--ramkin-gold-soft)]/85">
          {progress ? status : t('loading')}
        </p>
      </div>

      <div
        className={`relative mt-5 grid gap-2.5 sm:gap-3 ${
          required <= 9 ? 'grid-cols-3' : 'grid-cols-4'
        }`}
        aria-label={`${purchaseCount} / ${required}`}
      >
        {stamps.map((filled, index) => (
          <div
            key={index}
            className={`stamp-slot aspect-square ${filled ? 'stamp-slot--filled' : ''}`}
            style={filled ? { animationDelay: `${Math.min(index, 8) * 45}ms` } : undefined}
          >
            <span className="stamp-slot__inner" aria-hidden>
              {filled ? '◆' : index + 1}
            </span>
          </div>
        ))}
      </div>

      <div className="relative mt-5 h-1.5 w-full overflow-hidden bg-white/8">
        <div
          key={`${purchaseCount}-${required}`}
          className="stamp-bar-fill h-full bg-[var(--ramkin-gold)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="relative mt-2 text-xs tracking-[0.12em] text-[var(--ramkin-gold-soft)]/65 uppercase">
        {t('remainingLabel', { n: remaining })} · {t('buyNGetFree', { n: required })}
      </p>

      {complete ? (
        <div className="combo-congrats relative mt-5 border border-[var(--ramkin-gold)]/45 bg-black/45 px-4 py-3 text-center">
          <p
            className="text-sm tracking-[0.18em] text-[var(--ramkin-gold)] uppercase"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('comboCompleteTitle')}
          </p>
          <p className="mt-1 text-xs text-[var(--ramkin-mist)]/65">{t('comboCompleteBody')}</p>
        </div>
      ) : null}
    </div>
  );
}
