import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireStaff } from './components/RequireStaff';
import { RequireSignedIn } from './components/RequireSignedIn';
import { LoginPage } from './pages/LoginPage';
import { ShellLayout } from './pages/ShellLayout';
import { OverviewPage } from './pages/OverviewPage';
import { AccountsPage } from './pages/AccountsPage';
import { BootstrapPage } from './pages/BootstrapPage';
import { CounterPage } from './pages/CounterPage';
import { RewardsPage } from './pages/RewardsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ActivityLogsPage } from './pages/ActivityLogsPage';

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
            <Route path="counter" element={<CounterPage />} />
            <Route path="rewards" element={<RewardsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:customerId" element={<CustomerDetailPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route
              path="settings"
              element={
                <RequireStaff roles={['OWNER']}>
                  <SettingsPage />
                </RequireStaff>
              }
            />
            <Route
              path="accounts"
              element={
                <RequireStaff roles={['OWNER', 'MANAGER']}>
                  <AccountsPage />
                </RequireStaff>
              }
            />
            <Route
              path="activity"
              element={
                <RequireStaff roles={['OWNER', 'MANAGER']}>
                  <ActivityLogsPage />
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
