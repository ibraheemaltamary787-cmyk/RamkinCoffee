/**
 * Emulator UAT for DEV Fake OTP + core loyalty path (Spark-safe).
 * Requires: npm run emulators + npm run seed:dev-accounts
 *
 *   npx tsx scripts/uat-fake-otp.local.ts
 */
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithCustomToken, signOut } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { randomUUID } from 'node:crypto';
import { DEV_FAKE_OTP_CODE } from '../packages/shared/src/index';

const config = {
  apiKey: 'AIzaSyDnowBTQmlqnWcV7tf7yUebVmvXAft8M5A',
  authDomain: 'ramkincoffee.firebaseapp.com',
  projectId: 'ramkincoffee',
  storageBucket: 'ramkincoffee.firebasestorage.app',
  messagingSenderId: '392513147835',
  appId: '1:392513147835:web:1d4888856b3c48e2582a9e',
};

const app = initializeApp(config);
const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1');
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFunctionsEmulator(functions, '127.0.0.1', 5001);

async function call<TIn, TOut>(name: string, data: TIn): Promise<TOut> {
  const fn = httpsCallable<TIn, TOut>(functions, name);
  return (await fn(data)).data;
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main(): Promise<void> {
  const results: string[] = [];
  const phone = `+1555099${String(Date.now()).slice(-4)}`;

  // 1. Invalid OTP rejected
  try {
    await call('devFakeOtpSignIn', {
      mode: 'register',
      identifier: phone,
      otp: '1234',
      displayName: 'UAT Guest',
    });
    throw new Error('expected invalid OTP to fail');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(/Invalid OTP|0000/i.test(msg), `unexpected invalid-otp error: ${msg}`);
    results.push('PASS invalid OTP rejected');
  }

  // 2. Register with Fake OTP 0000
  const reg = await call<{
    mode: string;
    identifier: string;
    otp: string;
    displayName: string;
  }, {
    customToken: string;
    uid: string;
    isNewUser: boolean;
  }>('devFakeOtpSignIn', {
    mode: 'register',
    identifier: phone,
    otp: DEV_FAKE_OTP_CODE,
    displayName: 'UAT Guest',
  });
  assert(reg.isNewUser, 'register should create new user');
  await signInWithCustomToken(auth, reg.customToken);
  const profile = await call<{ displayName: string }, { created: boolean; profile: { phone: string | null } }>(
    'ensureCustomerProfile',
    { displayName: 'UAT Guest' },
  );
  assert(profile.created || profile.profile.phone === phone, 'profile created with phone');
  results.push(`PASS register ${phone}`);

  // 3. Duplicate register rejected
  await signOut(auth);
  try {
    await call('devFakeOtpSignIn', {
      mode: 'register',
      identifier: phone,
      otp: DEV_FAKE_OTP_CODE,
      displayName: 'Dup',
    });
    throw new Error('expected duplicate register to fail');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(/already registered/i.test(msg), `unexpected dup error: ${msg}`);
    results.push('PASS duplicate phone rejected');
  }

  // 4. Login + logout + login
  const login = await call<{ mode: string; identifier: string; otp: string }, { customToken: string }>(
    'devFakeOtpSignIn',
    { mode: 'login', identifier: phone, otp: DEV_FAKE_OTP_CODE },
  );
  await signInWithCustomToken(auth, login.customToken);
  const customerUid = auth.currentUser!.uid;
  await signOut(auth);
  const login2 = await call<{ mode: string; identifier: string; otp: string }, { customToken: string }>(
    'devFakeOtpSignIn',
    { mode: 'login', identifier: phone, otp: DEV_FAKE_OTP_CODE },
  );
  await signInWithCustomToken(auth, login2.customToken);
  assert(auth.currentUser?.uid === customerUid, 'same uid after re-login');
  results.push('PASS logout + re-login session');

  // 5. Staff Fake OTP + 9 purchases
  await signOut(auth);
  const staff = await call<{ mode: string; identifier: string; otp: string }, { customToken: string }>(
    'devFakeOtpSignIn',
    { mode: 'login', identifier: 'staff1@ramkin.local', otp: DEV_FAKE_OTP_CODE },
  );
  await signInWithCustomToken(auth, staff.customToken);
  await auth.currentUser!.getIdToken(true);

  // Stamp 1 + immediate replay of same key (dedupe while combo still active)
  const dedupeKey = `uat-dedupe-${randomUUID()}`;
  const first = await call<
    { customerId: string; idempotencyKey: string; note?: string },
    { purchaseId: string; deduped?: boolean }
  >('recordPurchase', {
    customerId: customerUid,
    idempotencyKey: dedupeKey,
    note: 'UAT stamp 1',
  });
  const second = await call<
    { customerId: string; idempotencyKey: string },
    { purchaseId: string; deduped?: boolean }
  >('recordPurchase', { customerId: customerUid, idempotencyKey: dedupeKey });
  assert(first.purchaseId === second.purchaseId, 'dedupe same purchase id');
  results.push('PASS duplicate purchase idempotency');

  for (let i = 2; i <= 9; i += 1) {
    await call('recordPurchase', {
      customerId: customerUid,
      idempotencyKey: `uat-${randomUUID()}`,
      note: `UAT stamp ${i}`,
    });
  }
  results.push('PASS staff recorded 9 purchases');

  // 6. Customer request reward
  await signOut(auth);
  const custLogin = await call<{ mode: string; identifier: string; otp: string }, { customToken: string }>(
    'devFakeOtpSignIn',
    { mode: 'login', identifier: phone, otp: DEV_FAKE_OTP_CODE },
  );
  await signInWithCustomToken(auth, custLogin.customToken);
  const progressBefore = await call<Record<string, never>, { progress: { purchaseCount: number; rewardEligible: boolean } }>(
    'getLoyaltyProgress',
    {},
  );
  assert(progressBefore.progress.purchaseCount >= 9, 'combo full');
  assert(progressBefore.progress.rewardEligible, 'reward eligible');
  const req = await call<Record<string, never>, { requestId: string }>('requestReward', {});
  results.push(`PASS customer reward request ${req.requestId}`);

  // 7. Manager approve
  await signOut(auth);
  const mgr = await call<{ mode: string; identifier: string; otp: string }, { customToken: string }>(
    'devFakeOtpSignIn',
    { mode: 'login', identifier: 'manager@ramkin.local', otp: DEV_FAKE_OTP_CODE },
  );
  await signInWithCustomToken(auth, mgr.customToken);
  await auth.currentUser!.getIdToken(true);
  await call('approveReward', { requestId: req.requestId });
  results.push('PASS manager approve');

  // 8. Staff redeem → combo reset
  await signOut(auth);
  const staff2 = await call<{ mode: string; identifier: string; otp: string }, { customToken: string }>(
    'devFakeOtpSignIn',
    { mode: 'login', identifier: 'staff1@ramkin.local', otp: DEV_FAKE_OTP_CODE },
  );
  await signInWithCustomToken(auth, staff2.customToken);
  await auth.currentUser!.getIdToken(true);
  await call('redeemReward', { requestId: req.requestId });
  results.push('PASS staff redeem');

  await signOut(auth);
  const cust3 = await call<{ mode: string; identifier: string; otp: string }, { customToken: string }>(
    'devFakeOtpSignIn',
    { mode: 'login', identifier: phone, otp: DEV_FAKE_OTP_CODE },
  );
  await signInWithCustomToken(auth, cust3.customToken);
  const after = await call<
    Record<string, never>,
    { progress: { purchaseCount: number; comboStatus: string | null } }
  >('getLoyaltyProgress', {});
  assert(after.progress.purchaseCount === 0, `combo should reset to 0, got ${after.progress.purchaseCount}`);
  results.push('PASS combo reset to 0/9 after redeem');

  // 9. Rejection path (new combo stamps then reject)
  await signOut(auth);
  const staff3 = await call<{ mode: string; identifier: string; otp: string }, { customToken: string }>(
    'devFakeOtpSignIn',
    { mode: 'login', identifier: 'staff1@ramkin.local', otp: DEV_FAKE_OTP_CODE },
  );
  await signInWithCustomToken(auth, staff3.customToken);
  await auth.currentUser!.getIdToken(true);
  for (let i = 0; i < 9; i += 1) {
    await call('recordPurchase', {
      customerId: customerUid,
      idempotencyKey: `uat-rej-${randomUUID()}`,
    });
  }
  await signOut(auth);
  const cust4 = await call<{ mode: string; identifier: string; otp: string }, { customToken: string }>(
    'devFakeOtpSignIn',
    { mode: 'login', identifier: phone, otp: DEV_FAKE_OTP_CODE },
  );
  await signInWithCustomToken(auth, cust4.customToken);
  const req2 = await call<Record<string, never>, { requestId: string }>('requestReward', {});
  await signOut(auth);
  const mgr2 = await call<{ mode: string; identifier: string; otp: string }, { customToken: string }>(
    'devFakeOtpSignIn',
    { mode: 'login', identifier: 'manager@ramkin.local', otp: DEV_FAKE_OTP_CODE },
  );
  await signInWithCustomToken(auth, mgr2.customToken);
  await auth.currentUser!.getIdToken(true);
  await call('rejectReward', { requestId: req2.requestId, reason: 'UAT rejection sample' });
  results.push('PASS manager reject with reason');

  // 10. Owner export + activity logs
  await signOut(auth);
  const owner = await call<{ mode: string; identifier: string; otp: string }, { customToken: string }>(
    'devFakeOtpSignIn',
    { mode: 'login', identifier: 'owner@ramkin.local', otp: DEV_FAKE_OTP_CODE },
  );
  await signInWithCustomToken(auth, owner.customToken);
  await auth.currentUser!.getIdToken(true);
  const exportResult = await call<
    { format: string; sheets: string[] },
    { ok: true; format: string }
  >('exportReport', { format: 'json', sheets: ['customers', 'purchases', 'rewards'] });
  assert(exportResult.ok, 'export ok');
  const logs = await call<{ limit: number }, { logs: unknown[] }>('listActivityLogs', { limit: 20 });
  assert(Array.isArray(logs.logs) && logs.logs.length > 0, 'activity logs present');
  results.push('PASS owner export + activity logs');

  console.log('\nUAT Fake OTP results');
  console.log('────────────────────');
  for (const line of results) console.log(line);
  console.log(`\nAll ${results.length} checks passed.`);
}

main().catch((err) => {
  console.error('UAT FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
