import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CustomerLookupDto } from '@ramkin/shared';
import { QrScanner } from '../components/QrScanner';
import {
  callApproveReward,
  callLookupByPhone,
  callLookupByQr,
  callRecordPurchase,
  callRedeemReward,
  callRejectReward,
  newIdempotencyKey,
} from '../services/callables';

export function CounterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<'phone' | 'qr' | 'scan'>('phone');
  const [query, setQuery] = useState('');
  const [customer, setCustomer] = useState<CustomerLookupDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const refreshCustomer = useCallback(async (current: CustomerLookupDto) => {
    if (current.phone) {
      return (await callLookupByPhone(current.phone)).customer;
    }
    return (await callLookupByQr(current.qrToken)).customer;
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
    } catch (err) {
      setCustomer(null);
      setError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setBusy(false);
    }
  }, []);

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
    } catch (err) {
      setCustomer(null);
      setError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onStamp() {
    if (!customer) return;
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const result = await callRecordPurchase({
        customerId: customer.customerId,
        idempotencyKey: newIdempotencyKey(),
      });
      setNote(
        result.deduped
          ? 'Duplicate submit ignored (idempotency).'
          : result.completed
            ? `Stamp recorded — combo complete (${result.purchaseCount}/${result.requiredPurchases}).`
            : `Stamp recorded (${result.purchaseCount}/${result.requiredPurchases}, ${result.remaining} left).`,
      );
      setCustomer(await refreshCustomer(customer));
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

  return (
    <section className="animate-fade-up">
      <h1
        className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Counter
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--ramkin-cream)]/60">
        Look up by phone, paste a QR token, or scan the customer’s dashboard QR. Record purchases
        and handle reward approve / reject / redeem. Customers never self-stamp.
      </p>

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
                : 'border border-white/15 text-[var(--ramkin-cream)]/50'
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
            placeholder={mode === 'phone' ? '+15550100200' : '32-char qr token'}
            className="min-w-[16rem] flex-1 border border-white/15 bg-black/40 px-3 py-2 text-sm text-[var(--ramkin-cream)] outline-none focus:border-[var(--ramkin-gold)]/50"
          />
          <button
            type="submit"
            disabled={busy || !query.trim()}
            className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)]/10 px-4 py-2 text-xs tracking-[0.2em] text-[var(--ramkin-gold)] uppercase disabled:opacity-50"
          >
            Lookup
          </button>
        </form>
      )}

      {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}
      {note ? <p className="mt-4 text-sm text-[var(--ramkin-gold-soft)]">{note}</p> : null}

      {customer ? (
        <div className="mt-8 border border-[var(--ramkin-gold)]/20 bg-black/35 p-5 shadow-[0_0_40px_rgba(201,169,98,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg text-[var(--ramkin-cream)]">{customer.displayName}</p>
              <p className="mt-1 text-sm text-[var(--ramkin-cream)]/55">{customer.phone}</p>
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
              <p className="text-xs text-[var(--ramkin-cream)]/45">
                {customer.remaining} remaining
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || customer.status === 'disabled' || customer.comboStatus !== 'active'}
              onClick={() => void onStamp()}
              className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)]/15 px-4 py-2 text-xs tracking-[0.18em] text-[var(--ramkin-gold)] uppercase disabled:opacity-40"
            >
              Record purchase
            </button>

            {customer.openRewardStatus === 'requested' ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onApprove()}
                  className="border border-white/20 px-4 py-2 text-xs tracking-[0.18em] uppercase hover:border-[var(--ramkin-gold)]/50"
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
                    className="border border-white/20 px-4 py-2 text-xs tracking-[0.18em] uppercase"
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
                className="border border-[var(--ramkin-gold)] px-4 py-2 text-xs tracking-[0.18em] text-[var(--ramkin-gold)] uppercase"
              >
                Confirm redeem
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
