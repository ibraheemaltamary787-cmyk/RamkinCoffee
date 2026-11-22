import { isClientDevFakeOtpEnabled, DEV_FAKE_OTP_CODE } from '@ramkin/shared';

export function isDevFakeOtpEnabled(): boolean {
  return isClientDevFakeOtpEnabled({
    PROD: import.meta.env.PROD,
    VITE_DEV_FAKE_OTP: import.meta.env.VITE_DEV_FAKE_OTP,
  });
}

export { DEV_FAKE_OTP_CODE };
