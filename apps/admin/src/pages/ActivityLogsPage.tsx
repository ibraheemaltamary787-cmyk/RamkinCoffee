import { useCallback, useEffect, useState } from 'react';
import type { ActivityLogDto } from '@ramkin/shared';
import { useLocale } from '../i18n/LocaleContext';
import { callListActivityLogs } from '../services/callables';

export function ActivityLogsPage() {
  const { t, locale } = useLocale();
  const [actorUid, setActorUid] = useState('');
  const [action, setAction] = useState('');
  const [logs, setLogs] = useState<ActivityLogDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await callListActivityLogs({
        actorUid: actorUid.trim() || undefined,
        action: action.trim() || undefined,
        limit: 50,
      });
      setLogs(result.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('activityLoadError'));
    } finally {
      setBusy(false);
    }
  }, [actorUid, action, t]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="animate-fade-up">
      <h1
        className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {t('activityTitle')}
      </h1>
      <p className="mt-2 text-sm text-[var(--ramkin-mist)]/60">{t('activitySub')}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void refresh();
        }}
        className="mt-8 flex flex-wrap gap-3"
      >
        <input
          value={actorUid}
          onChange={(e) => setActorUid(e.target.value)}
          placeholder={t('activityActorUid')}
          className="min-w-[12rem] flex-1 border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
        />
        <input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder={t('activityActionPlaceholder')}
          className="min-w-[12rem] flex-1 border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
        />
        <button
          type="submit"
          disabled={busy}
          className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)]/10 px-4 py-2 text-xs tracking-[0.2em] text-[var(--ramkin-gold)] uppercase disabled:opacity-50"
        >
          {busy ? t('loading') : t('filter')}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}

      <ul className="mt-6 divide-y divide-white/10 border border-white/10 bg-black/25">
        {logs.length === 0 ? (
          <li className="p-4 text-sm text-[var(--ramkin-mist)]/50">{t('activityEmpty')}</li>
        ) : (
          logs.map((log) => (
            <li key={log.logId} className="px-4 py-3 text-sm">
              <p className="text-[var(--ramkin-gold-soft)]/80">{log.action}</p>
              <p className="mt-1 text-xs text-[var(--ramkin-mist)]/45">
                {log.actorRole} · {log.actorUid.slice(0, 8)}… · {log.entityType}/{log.entityId}
                {log.createdAt
                  ? ` · ${new Date(log.createdAt).toLocaleString(locale === 'ar' ? 'ar' : 'en')}`
                  : ''}
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
