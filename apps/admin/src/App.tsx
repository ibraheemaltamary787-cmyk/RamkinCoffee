import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireStaff } from './components/RequireStaff';
import { RequireSignedIn } from './components/RequireSignedIn';
import { LoginPage } from './pages/LoginPage';
import { ShellLayout } from './pages/ShellLayout';
import { OverviewPage } from './pages/OverviewPage';
import { AccountsPage } from './pages/AccountsPage';
import { BootstrapPage } from './pages/BootstrapPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/bootstrap"
            element={
              <RequireSignedIn>
                <BootstrapPage />
              </RequireSignedIn>
            }
          />
          <Route
            path="/app"
            element={
              <RequireStaff>
                <ShellLayout />
              </RequireStaff>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route
              path="accounts"
              element={
                <RequireStaff roles={['OWNER', 'MANAGER']}>
                  <AccountsPage />
                </RequireStaff>
              }
            />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
