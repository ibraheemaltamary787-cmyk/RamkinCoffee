import { DEV_FAKE_OTP_CODE } from '@ramkin/shared';
import { isDevFakeOtpEnabled } from '../services/devFakeOtp';

/** Persistent label when development Fake OTP mode is active. */
export function DevOtpBanner() {
  if (!isDevFakeOtpEnabled()) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-500/40 bg-amber-950/90 px-4 py-2 text-center text-xs tracking-[0.12em] text-amber-100 uppercase"
    >
      DEV OTP mode — use code {DEV_FAKE_OTP_CODE} (disabled in production builds)
    </div>
  );
}
