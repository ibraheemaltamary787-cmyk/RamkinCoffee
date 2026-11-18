import { useCallback, useEffect, useState } from 'react';
import {
  canCreateStaffInvite,
  canDisableAccounts,
  canManageStaffRoles,
  type StaffInviteDto,
  type StaffMemberDto,
} from '@ramkin/shared';
import { useAuth } from '../auth/AuthContext';
import {
  callCancelStaffInvite,
  callCreateStaffInvite,
  callDisableAccount,
  callListStaff,
  callListStaffInvites,
  callSetStaffRole,
} from '../services/callables';

export function AccountsPage() {
  const { role, refreshClaims } = useAuth();
  const [staff, setStaff] = useState<StaffMemberDto[]>([]);
  const [invites, setInvites] = useState<StaffInviteDto[]>([]);
  const [staffUid, setStaffUid] = useState('');
  const [staffRole, setStaffRole] = useState<'MANAGER' | 'STAFF'>('STAFF');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MANAGER' | 'STAFF'>('STAFF');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [staffResult, inviteResult] = await Promise.all([
        callListStaff(),
        callListStaffInvites({ status: 'pending' }),
      ]);
      setStaff(staffResult.staff);
      setInvites(inviteResult.invites);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load staff.');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="animate-fade-up space-y-10">
      <div>
        <h1
          className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Staff
        </h1>
        <p className="mt-2 text-sm text-[var(--ramkin-cream)]/60">
          OWNER assigns roles and invites managers. MANAGER may invite STAFF and disable accounts.
          Server callables enforce RBAC.
        </p>
      </div>

      <div>
        <h2 className="text-sm tracking-[0.2em] text-[var(--ramkin-gold-soft)] uppercase">Team</h2>
        <ul className="mt-3 divide-y divide-white/10 border border-white/10 bg-black/25">
          {staff.length === 0 ? (
            <li className="p-4 text-sm text-[var(--ramkin-cream)]/50">No staff loaded.</li>
          ) : (
            staff.map((member) => (
              <li
                key={member.uid}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-[var(--ramkin-cream)]">
                    {member.displayName || member.email || member.uid}
                  </p>
                  <p className="text-xs text-[var(--ramkin-cream)]/45">
                    {member.email ?? '—'} · {member.status}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs tracking-[0.15em] text-[var(--ramkin-gold)] uppercase">
                    {member.role}
                  </span>
                  {canDisableAccounts(role) &&
                  member.role !== 'OWNER' &&
                  member.status === 'active' ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          const result = await callDisableAccount({
                            uid: member.uid,
                            disabled: true,
                          });
                          setMessage(`Account ${result.uid} → ${result.status}`);
                        })
                      }
                      className="border border-red-400/50 px-2 py-1 text-[10px] tracking-[0.15em] text-red-200 uppercase"
                    >
                      Disable
                    </button>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {(canCreateStaffInvite(role, 'STAFF') || canCreateStaffInvite(role, 'MANAGER')) && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const result = await callCreateStaffInvite({
                email: inviteEmail.trim(),
                role: inviteRole,
              });
              setMessage(`Invite sent for ${result.invite.email} as ${result.invite.role}.`);
              setInviteEmail('');
            });
          }}
          className="max-w-lg space-y-3 border border-white/10 bg-black/30 p-5"
        >
          <h2 className="text-sm tracking-[0.2em] text-[var(--ramkin-gold-soft)] uppercase">
            Invite staff
          </h2>
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="barista@ramkin.example"
            className="w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]"
            required
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'MANAGER' | 'STAFF')}
            className="w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-3 py-2 text-sm"
          >
            <option value="STAFF">STAFF</option>
            {canCreateStaffInvite(role, 'MANAGER') ? (
              <option value="MANAGER">MANAGER</option>
            ) : null}
          </select>
          <button
            type="submit"
            disabled={busy || !canCreateStaffInvite(role, inviteRole)}
            className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] px-4 py-2 text-xs tracking-[0.2em] text-black uppercase disabled:opacity-60"
          >
            Create invite
          </button>
          <p className="text-xs text-[var(--ramkin-cream)]/40">
            Invitee signs in with email/password, then accepts the invite from Login or Bootstrap.
          </p>
        </form>
      )}

      <div>
        <h2 className="text-sm tracking-[0.2em] text-[var(--ramkin-gold-soft)] uppercase">
          Pending invites
        </h2>
        <ul className="mt-3 divide-y divide-white/10 border border-white/10">
          {invites.length === 0 ? (
            <li className="p-3 text-sm text-[var(--ramkin-cream)]/45">No pending invites.</li>
          ) : (
            invites.map((invite) => (
              <li
                key={invite.inviteId}
                className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <div>
                  <p className="text-[var(--ramkin-cream)]/80">
                    {invite.email} · {invite.role}
                  </p>
                  <p className="text-xs text-[var(--ramkin-cream)]/40">
                    expires {invite.expiresAt ?? '—'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await callCancelStaffInvite({ inviteId: invite.inviteId });
                      setMessage(`Invite cancelled for ${invite.email}.`);
                    })
                  }
                  className="border border-white/20 px-2 py-1 text-[10px] tracking-[0.15em] uppercase"
                >
                  Cancel
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {canManageStaffRoles(role) && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const result = await callSetStaffRole({
                uid: staffUid.trim(),
                role: staffRole,
              });
              setMessage(
                `Role ${result.role} set for ${result.uid}. They must refresh their token.`,
              );
              setStaffUid('');
              await refreshClaims();
            });
          }}
          className="max-w-lg space-y-3 border border-white/10 bg-black/30 p-5"
        >
          <h2 className="text-sm tracking-[0.2em] text-[var(--ramkin-gold-soft)] uppercase">
            Set staff role by UID
          </h2>
          <input
            value={staffUid}
            onChange={(e) => setStaffUid(e.target.value)}
            placeholder="Auth UID"
            className="w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]"
            required
          />
          <select
            value={staffRole}
            onChange={(e) => setStaffRole(e.target.value as 'MANAGER' | 'STAFF')}
            className="w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-3 py-2 text-sm"
          >
            <option value="STAFF">STAFF</option>
            <option value="MANAGER">MANAGER</option>
          </select>
          <button
            type="submit"
            disabled={busy}
            className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] px-4 py-2 text-xs tracking-[0.2em] text-black uppercase disabled:opacity-60"
          >
            Assign role
          </button>
        </form>
      )}

      {message && <p className="text-sm text-[var(--ramkin-gold-soft)]">{message}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </section>
  );
}
