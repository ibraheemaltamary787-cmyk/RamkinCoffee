import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CustomerLookupDto, PurchaseChannel, PurchaseListItemDto } from '@ramkin/shared';
import { QrScanner } from '../components/QrScanner';
import {
  callApproveReward,
  callListPurchases,
  callLookupByPhone,
  callLookupByQr,
  callRecordPurchase,
  callRedeemReward,
  callRejectReward,
  newIdempotencyKey,
} from '../services/callables';

function nextActionHint(customer: CustomerLookupDto): string {
  if (customer.status === 'disabled') return 'Account disabled — no counter actions.';
  if (customer.openRewardStatus === 'requested') {
    return 'Step: approve or reject this reward request.';
  }
  if (customer.openRewardStatus === 'approved') {
    return 'Step: confirm redeem after the free drink is given (resets the combo).';
  }
  if (customer.comboStatus === 'completed') {
    return 'Combo complete — waiting for the customer to request their reward.';
  }
  if (customer.comboStatus === 'active') {
    return `Step: record purchase (${customer.remaining} stamp${customer.remaining === 1 ? '' : 's'} left).`;
  }
  return 'Look up a customer to begin.';
}

export function CounterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<'phone' | 'qr' | 'scan'>('phone');
  const [query, setQuery] = useState('');
  const [customer, setCustomer] = useState<CustomerLookupDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [channel, setChannel] = useState<PurchaseChannel>('in_store');
  const [orderRef, setOrderRef] = useState('');
  const [history, setHistory] = useState<PurchaseListItemDto[]>([]);

  const refreshCustomer = useCallback(async (current: CustomerLookupDto) => {
    if (current.phone) {
      return (await callLookupByPhone(current.phone)).customer;
    }
    return (await callLookupByQr(current.qrToken)).customer;
  }, []);

  const refreshHistory = useCallback(async (customerId: string) => {
    try {
      const result = await callListPurchases({ customerId, limit: 8 });
      setHistory(result.purchases);
    } catch {
      setHistory([]);
    }
  }, []);

  const lookupQr = useCallback(async (token: string) => {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const result = await callLookupByQr(token.trim());
      setCustomer(result.customer);
      setQuery(token.trim());
      setMode('qr');
      setNote('Customer loaded from QR.');
      await refreshHistory(result.customer.customerId);
    } catch (err) {
      setCustomer(null);
      setHistory([]);
      setError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setBusy(false);
    }
  }, [refreshHistory]);

  useEffect(() => {
    const qr = searchParams.get('qr');
    if (qr) {
      void lookupQr(qr);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, lookupQr]);

  async function onLookup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const result =
        mode === 'phone'
          ? await callLookupByPhone(query.trim())
          : await callLookupByQr(query.trim());
      setCustomer(result.customer);
      await refreshHistory(result.customer.customerId);
    } catch (err) {
      setCustomer(null);
      setHistory([]);
      setError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onStamp() {
    if (!customer) return;
    if (channel === 'online' && !orderRef.trim()) {
      setError('Online stamps need a Foodics order/ref id (or switch channel to In store).');
      return;
    }
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const result = await callRecordPurchase({
        customerId: customer.customerId,
        idempotencyKey: newIdempotencyKey(),
        channel,
        orderRef: orderRef.trim() || null,
        source: 'counter',
        verificationStatus: 'verified',
      });
      setNote(
        result.deduped
          ? 'Duplicate submit ignored (idempotency).'
          : result.completed
            ? `Stamp recorded — combo complete (${result.purchaseCount}/${result.requiredPurchases}).`
            : `Stamp recorded (${result.purchaseCount}/${result.requiredPurchases}, ${result.remaining} left).`,
      );
      setOrderRef('');
      setCustomer(await refreshCustomer(customer));
      await refreshHistory(customer.customerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record purchase.');
    } finally {
      setBusy(false);
    }
  }

  async function onApprove() {
    if (!customer?.openRewardRequestId) return;
    setBusy(true);
    setError(null);
    try {
      await callApproveReward({ requestId: customer.openRewardRequestId });
      setNote('Reward approved — stamps still held until redeem.');
      setCustomer(await refreshCustomer(customer));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onReject() {
    if (!customer?.openRewardRequestId) return;
    if (rejectReason.trim().length < 3) {
      setError('Rejection reason required (min 3 characters).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await callRejectReward({
        requestId: customer.openRewardRequestId,
        reason: rejectReason.trim(),
      });
      setNote('Reward rejected — combo returned to completed; customer may re-request.');
      setRejectReason('');
      setCustomer(await refreshCustomer(customer));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onRedeem() {
    if (!customer?.openRewardRequestId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await callRedeemReward({ requestId: customer.openRewardRequestId });
      setNote(`Redeemed — new combo ${result.newComboId.slice(0, 8)}… started at 0 stamps.`);
      setCustomer(await refreshCustomer(customer));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Redeem failed.');
    } finally {
      setBusy(false);
    }
  }

  const pct = customer
    ? Math.min(100, Math.round((customer.purchaseCount / customer.requiredPurchases) * 100))
    : 0;

  return (
    <section className="animate-fade-up">
      <h1
        className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Counter
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--ramkin-mist)]/60">
        Fast phone lookup for the busy counter. Record eligible purchases with channel + order/ref.
        Duplicate order refs are blocked. Customers never self-stamp.
      </p>

      <ol className="mt-5 flex flex-wrap gap-2 text-[10px] tracking-[0.12em] text-[var(--ramkin-mist)]/45 uppercase">
        <li className="border border-white/10 px-2.5 py-1">1 Lookup</li>
        <li className="border border-white/10 px-2.5 py-1">2 Stamp</li>
        <li className="border border-white/10 px-2.5 py-1">3 Approve</li>
        <li className="border border-white/10 px-2.5 py-1">4 Redeem</li>
      </ol>

      <div className="mt-8 flex flex-wrap gap-2">
        {(
          [
            ['phone', 'Phone'],
            ['qr', 'QR token'],
            ['scan', 'Scan camera'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`px-3 py-2 text-xs tracking-[0.15em] uppercase ${
              mode === value
                ? 'border border-[var(--ramkin-gold)] text-[var(--ramkin-gold)]'
                : 'border border-white/15 text-[var(--ramkin-mist)]/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'scan' ? (
        <div className="mt-6 max-w-md">
          <QrScanner
            active={mode === 'scan' && !busy}
            onScan={(token) => {
              if (!busy) void lookupQr(token);
            }}
          />
        </div>
      ) : (
        <form onSubmit={(e) => void onLookup(e)} className="mt-6 flex flex-wrap items-end gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === 'phone' ? '+15550100200' : 'Paste customer QR token'}
            className="min-w-[16rem] flex-1 border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-[var(--ramkin-mist)] outline-none focus:border-[var(--ramkin-gold)]/50"
          />
          <button
            type="submit"
            disabled={busy || !query.trim()}
            className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)]/10 px-4 py-2.5 text-xs tracking-[0.2em] text-[var(--ramkin-gold)] uppercase disabled:opacity-50"
          >
            Lookup
          </button>
        </form>
      )}

      {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}
      {note ? <p className="mt-4 text-sm text-[var(--ramkin-gold-soft)]">{note}</p> : null}

      {customer ? (
        <div className="mt-8 border border-[var(--ramkin-line)] bg-black/40 p-5">
          <p className="text-xs tracking-[0.16em] text-[var(--ramkin-gold-soft)]/70 uppercase">
            {nextActionHint(customer)}
          </p>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg text-[var(--ramkin-mist)]">{customer.displayName}</p>
              <p className="mt-1 text-sm text-[var(--ramkin-mist)]/55">
                {customer.email ?? '—'}
                {customer.phone ? ` · ${customer.phone}` : ''}
              </p>
              <p className="mt-1 text-xs tracking-[0.15em] text-[var(--ramkin-gold-soft)]/60 uppercase">
                {customer.status} · {customer.comboStatus ?? 'no combo'}
              </p>
            </div>
            <div className="text-right">
              <p
                className="text-3xl text-[var(--ramkin-gold)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {customer.purchaseCount}/{customer.requiredPurchases}
              </p>
              <p className="text-xs text-[var(--ramkin-mist)]/45">{customer.remaining} remaining</p>
            </div>
          </div>

          <div className="mt-4 h-1.5 w-full overflow-hidden bg-white/6">
            <div
              className="h-full bg-[var(--ramkin-gold)] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['in_store', 'In store'],
                  ['online', 'Online'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setChannel(value)}
                  className={`px-3 py-2 text-xs tracking-[0.15em] uppercase ${
                    channel === value
                      ? 'border border-[var(--ramkin-gold)] text-[var(--ramkin-gold)]'
                      : 'border border-white/15 text-[var(--ramkin-mist)]/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              value={orderRef}
              onChange={(e) => setOrderRef(e.target.value)}
              placeholder={
                channel === 'online' ? 'Foodics order / ref (required)' : 'Order / ref (optional)'
              }
              className="border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/40"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || customer.status === 'disabled' || customer.comboStatus !== 'active'}
              onClick={() => void onStamp()}
              className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] px-4 py-2.5 text-xs tracking-[0.18em] text-black uppercase disabled:opacity-40"
            >
              Record purchase
            </button>

            {customer.openRewardStatus === 'requested' ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onApprove()}
                  className="border border-[var(--ramkin-gold)]/70 px-4 py-2.5 text-xs tracking-[0.18em] text-[var(--ramkin-gold)] uppercase"
                >
                  Approve reward
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reject reason"
                    className="border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/40"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onReject()}
                    className="border border-white/20 px-4 py-2.5 text-xs tracking-[0.18em] uppercase"
                  >
                    Reject
                  </button>
                </div>
              </>
            ) : null}

            {customer.openRewardStatus === 'approved' ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onRedeem()}
                className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)]/15 px-4 py-2.5 text-xs tracking-[0.18em] text-[var(--ramkin-gold)] uppercase"
              >
                Confirm redeem
              </button>
            ) : null}
          </div>

          {history.length > 0 ? (
            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="text-[10px] tracking-[0.16em] text-[var(--ramkin-mist)]/45 uppercase">
                Recent stamps
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-[var(--ramkin-mist)]/65">
                {history.map((p) => (
                  <li key={p.purchaseId} className="flex flex-wrap justify-between gap-2">
                    <span>
                      {p.channel ?? '—'}
                      {p.orderRef ? ` · ${p.orderRef}` : ''}
                    </span>
                    <span className="text-[var(--ramkin-mist)]/40">
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
