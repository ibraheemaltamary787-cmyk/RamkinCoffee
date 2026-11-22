import { isClientDevFakeOtpEnabled, DEV_FAKE_OTP_CODE } from '@ramkin/shared';

/** True when this Vite app may show / call Fake OTP (never in production builds). */
export function isDevFakeOtpEnabled(): boolean {
  return isClientDevFakeOtpEnabled({
    PROD: import.meta.env.PROD,
    VITE_DEV_FAKE_OTP: import.meta.env.VITE_DEV_FAKE_OTP,
  });
}

export { DEV_FAKE_OTP_CODE };
