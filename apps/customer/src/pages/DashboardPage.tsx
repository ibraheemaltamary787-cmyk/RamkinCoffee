import { Navigate } from 'react-router-dom';

/** Legacy path — home is now `/home`. */
export function DashboardPage() {
  return <Navigate to="/home" replace />;
}
