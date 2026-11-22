import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEV_FAKE_OTP_CODE,
  assertValidDevOtp,
  isClientDevFakeOtpEnabled,
  isServerDevFakeOtpAllowed,
} from '@ramkin/shared';

/**
 * Security hygiene for Fake OTP — production must never accept 0000.
 * Full callable integration is covered by emulator UAT.
 */
describe('devFakeOtp production rejection', () => {
  it('keeps OTP code fixed at 0000 for DEV docs/tests', () => {
    assert.equal(DEV_FAKE_OTP_CODE, '0000');
    assert.doesNotThrow(() => assertValidDevOtp('0000'));
    assert.throws(() => assertValidDevOtp('9999'));
  });

  it('server gate is off without emulator / ALLOW flag (production default)', () => {
    assert.equal(isServerDevFakeOtpAllowed({ NODE_ENV: 'production' }), false);
    assert.equal(isServerDevFakeOtpAllowed({ GCLOUD_PROJECT: 'ramkincoffee' }), false);
  });

  it('client gate is off when Vite PROD is true', () => {
    assert.equal(
      isClientDevFakeOtpEnabled({ PROD: true, VITE_DEV_FAKE_OTP: 'true' }),
      false,
      'production builds must ignore VITE_DEV_FAKE_OTP',
    );
  });
});
