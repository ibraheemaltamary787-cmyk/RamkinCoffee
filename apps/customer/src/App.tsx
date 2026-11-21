import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ConfigBanner } from './components/ConfigBanner';
import { EmulatorBanner } from './components/EmulatorBanner';
import { LandingPage } from './pages/LandingPage';
import { PhoneAuthPage } from './pages/PhoneAuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <EmulatorBanner />
        <ConfigBanner />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PhoneAuthPage mode="login" />} />
          <Route path="/register" element={<PhoneAuthPage mode="register" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
