import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ConfigBanner } from './components/ConfigBanner';
import { DevOtpBanner } from './components/DevOtpBanner';
import { EmulatorBanner } from './components/EmulatorBanner';
import { LandingPage } from './pages/LandingPage';
import { EmailAuthPage } from './pages/EmailAuthPage';
import { PhoneAuthPage } from './pages/PhoneAuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { RewardsPage } from './pages/RewardsPage';
import { isDevFakeOtpEnabled } from './services/devFakeOtp';

export default function App() {
  const fakeOtp = isDevFakeOtpEnabled();

  return (
    <AuthProvider>
      <BrowserRouter>
        <DevOtpBanner />
        <EmulatorBanner />
        <ConfigBanner />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/* When DEV Fake OTP is on, phone is the primary auth path. */}
          <Route
            path="/login"
            element={fakeOtp ? <PhoneAuthPage mode="login" /> : <EmailAuthPage mode="login" />}
          />
          <Route
            path="/register"
            element={
              fakeOtp ? <PhoneAuthPage mode="register" /> : <EmailAuthPage mode="register" />
            }
          />
          <Route path="/login/email" element={<EmailAuthPage mode="login" />} />
          <Route path="/register/email" element={<EmailAuthPage mode="register" />} />
          <Route path="/login/phone" element={<PhoneAuthPage mode="login" />} />
          <Route path="/register/phone" element={<PhoneAuthPage mode="register" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
