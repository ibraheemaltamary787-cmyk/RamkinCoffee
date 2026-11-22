import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth, type UserRecord } from 'firebase-admin/auth';
import { ZodError } from 'zod';
import {
  ACTIVITY_ACTIONS,
  DEV_FAKE_OTP_CODE,
  assertValidDevOtp,
  devFakeOtpSignInSchema,
  isDevLocalIdentifier,
  isE164Phone,
  isServerDevFakeOtpAllowed,
  toE164Phone,
  type DevFakeOtpSignInResult,
} from '@ramkin/shared';
import { writeActivityLog } from './activity';

function rejectIfNotDev(): void {
  if (!isServerDevFakeOtpAllowed(process.env)) {
    throw new HttpsError(
      'failed-precondition',
      'Development Fake OTP is disabled outside the Functions emulator. Production builds must not use OTP 0000.',
    );
  }
}

function zodToHttpsError(err: ZodError): HttpsError {
  const issue = err.issues[0];
  const path = issue?.path?.length ? issue.path.join('.') : 'input';
  const detail = issue?.message ?? 'Invalid request.';
  return new HttpsError('invalid-argument', `${path}: ${detail}`);
}

function mapUnexpectedAuthError(err: unknown, fallback: string): never {
  if (err instanceof HttpsError) throw err;
  const message = err instanceof Error ? err.message : String(err);
  if (/credential|signBlob|default credentials|service account/i.test(message)) {
    throw new HttpsError(
      'failed-precondition',
      'Could not mint a custom token. Start Auth + Functions emulators together (`npm run emulators`) so FIREBASE_AUTH_EMULATOR_HOST is set. See docs/LOCAL_TESTING_GUIDE.md.',
    );
  }
  throw new HttpsError('internal', message || fallback);
}

async function findUserByIdentifier(identifier: string): Promise<UserRecord | null> {
  const auth = getAuth();
  try {
    if (isDevLocalIdentifier(identifier)) {
      return await auth.getUserByEmail(identifier.trim().toLowerCase());
    }
    const phone = toE164Phone(identifier);
    if (!isE164Phone(phone)) {
      throw new HttpsError(
        'invalid-argument',
        'Enter a valid E.164 phone (e.g. +9627XXXXXXXX) or a @ramkin.local identifier.',
      );
    }
    return await auth.getUserByPhoneNumber(phone);
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code: unknown }).code)
        : '';
    if (code === 'auth/user-not-found') return null;
    throw err;
  }
}

/**
 * DEV ONLY — exchange Fake OTP `0000` for a Firebase custom token.
 * Enabled on Functions emulator (or ALLOW_DEV_FAKE_OTP=true). Rejected in production.
 */
export const devFakeOtpSignIn = onCall({ cors: true }, async (request) => {
  rejectIfNotDev();

  let input;
  try {
    input = devFakeOtpSignInSchema.parse(request.data ?? {});
  } catch (err) {
    if (err instanceof ZodError) throw zodToHttpsError(err);
    throw err;
  }

  try {
    assertValidDevOtp(input.otp);
  } catch {
    throw new HttpsError(
      'invalid-argument',
      `Invalid OTP. Development Fake OTP is ${DEV_FAKE_OTP_CODE}.`,
    );
  }

  const auth = getAuth();
  const rawId = input.identifier.trim();

  try {
    if (input.mode === 'register') {
      if (isDevLocalIdentifier(rawId)) {
        throw new HttpsError(
          'invalid-argument',
          'Customer registration uses a mobile phone number, not a @ramkin.local identifier.',
        );
      }

      const phone = toE164Phone(rawId);
      if (!isE164Phone(phone)) {
        throw new HttpsError(
          'invalid-argument',
          'Enter a valid phone in E.164 format, e.g. +9627XXXXXXXX.',
        );
      }

      const existing = await findUserByIdentifier(phone);
      if (existing) {
        throw new HttpsError(
          'already-exists',
          'This phone number is already registered. Sign in instead.',
        );
      }

      if (!input.displayName?.trim()) {
        throw new HttpsError('invalid-argument', 'Enter your name to register.');
      }

      const user = await auth.createUser({
        phoneNumber: phone,
        displayName: input.displayName.trim(),
      });

      const customToken = await auth.createCustomToken(user.uid, { role: 'CUSTOMER' });

      await writeActivityLog({
        actorUid: user.uid,
        actorRole: 'CUSTOMER',
        action: ACTIVITY_ACTIONS.DEV_FAKE_OTP,
        entityType: 'user',
        entityId: user.uid,
        metadata: {
          mode: 'register',
          phoneLast4: phone.slice(-4),
          devFakeOtp: true,
        },
      });

      const result: DevFakeOtpSignInResult = {
        ok: true,
        customToken,
        uid: user.uid,
        phone,
        email: null,
        isNewUser: true,
        mode: 'register',
        devFakeOtp: true,
      };
      return result;
    }

    // login
    const existing = await findUserByIdentifier(rawId);
    if (!existing) {
      throw new HttpsError(
        'not-found',
        isDevLocalIdentifier(rawId)
          ? 'No account for that @ramkin.local identifier. Run `npm run seed:dev-accounts` first.'
          : 'No account for that phone. Register first.',
      );
    }

    if (existing.disabled) {
      throw new HttpsError('permission-denied', 'This account is disabled.');
    }

    const customToken = await auth.createCustomToken(existing.uid);

    await writeActivityLog({
      actorUid: existing.uid,
      actorRole: (existing.customClaims?.role as string | undefined) ?? null,
      action: ACTIVITY_ACTIONS.DEV_FAKE_OTP,
      entityType: 'user',
      entityId: existing.uid,
      metadata: {
        mode: 'login',
        phoneLast4: existing.phoneNumber ? existing.phoneNumber.slice(-4) : null,
        email: existing.email ?? null,
        devFakeOtp: true,
      },
    });

    const result: DevFakeOtpSignInResult = {
      ok: true,
      customToken,
      uid: existing.uid,
      phone: existing.phoneNumber ?? null,
      email: existing.email ?? null,
      isNewUser: false,
      mode: 'login',
      devFakeOtp: true,
    };
    return result;
  } catch (err) {
    mapUnexpectedAuthError(err, 'Fake OTP sign-in failed.');
  }
});
