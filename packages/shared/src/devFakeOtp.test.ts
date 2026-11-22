import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEV_FAKE_OTP_CODE,
  assertValidDevOtp,
  devFakeOtpSignInSchema,
  isClientDevFakeOtpEnabled,
  isDevLocalIdentifier,
  isE164Phone,
  isServerDevFakeOtpAllowed,
  toE164Phone,
} from './devFakeOtp';

describe('devFakeOtp gates', () => {
  it('exposes fixed DEV OTP 0000', () => {
    assert.equal(DEV_FAKE_OTP_CODE, '0000');
  });

  it('blocks client Fake OTP in production builds even if env is true', () => {
    assert.equal(isClientDevFakeOtpEnabled({ PROD: true, VITE_DEV_FAKE_OTP: 'true' }), false);
    assert.equal(isClientDevFakeOtpEnabled({ PROD: false, VITE_DEV_FAKE_OTP: 'true' }), true);
    assert.equal(isClientDevFakeOtpEnabled({ PROD: false, VITE_DEV_FAKE_OTP: 'false' }), false);
  });

  it('allows server Fake OTP only on emulator or explicit ALLOW flag', () => {
    assert.equal(isServerDevFakeOtpAllowed({}), false);
    assert.equal(isServerDevFakeOtpAllowed({ FUNCTIONS_EMULATOR: 'true' }), true);
    assert.equal(isServerDevFakeOtpAllowed({ ALLOW_DEV_FAKE_OTP: 'true' }), true);
    assert.equal(isServerDevFakeOtpAllowed({ FUNCTIONS_EMULATOR: 'false' }), false);
  });

  it('rejects non-0000 OTP', () => {
    assert.doesNotThrow(() => assertValidDevOtp('0000'));
    assert.throws(() => assertValidDevOtp('1234'));
    assert.throws(() => assertValidDevOtp(''));
  });
});

describe('devFakeOtp identifiers', () => {
  it('validates E.164 phones', () => {
    assert.equal(isE164Phone('+962791234567'), true);
    assert.equal(isE164Phone('+15550101001'), true);
    assert.equal(isE164Phone('962791234567'), false);
    assert.equal(isE164Phone('+0123'), false);
  });

  it('normalizes phone input toward E.164', () => {
    assert.equal(toE164Phone('+1 (555) 010-1001'), '+15550101001');
    assert.equal(toE164Phone('15550101001'), '+15550101001');
  });

  it('recognizes @ramkin.local identifiers', () => {
    assert.equal(isDevLocalIdentifier('owner@ramkin.local'), true);
    assert.equal(isDevLocalIdentifier('OWNER@Ramkin.Local'), true);
    assert.equal(isDevLocalIdentifier('user@gmail.com'), false);
  });

  it('parses sign-in schema', () => {
    const parsed = devFakeOtpSignInSchema.parse({
      mode: 'register',
      identifier: '+15550101001',
      otp: '0000',
      displayName: 'Customer One',
    });
    assert.equal(parsed.mode, 'register');
    assert.throws(() =>
      devFakeOtpSignInSchema.parse({ mode: 'login', identifier: 'x', otp: '0000' }),
    );
  });

  it('accepts null displayName on login (callable serialization)', () => {
    const parsed = devFakeOtpSignInSchema.parse({
      mode: 'login',
      identifier: '+15550101001',
      otp: '0000',
      displayName: null,
    });
    assert.equal(parsed.displayName, null);
  });
});
