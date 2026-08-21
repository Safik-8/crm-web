// crm-web/src/features/dashboard/pages/DashboardPage.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import SuperAdminDashboardView    from './SuperAdminDashboardView';
import CompanyAdminDashboardView  from './CompanyAdminDashboardView';
import BdeDashboardView           from './BdeDashboardView';
import IseDashboardView           from './IseDashboardView';

const DashboardPage = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)   return <Navigate to="/login" replace />;

  const role = user.primaryRole;

  // BRANCH_MANAGER redirects to existing /dashboard/branch (BranchDashboardPage.jsx untouched)
  if (role === 'BRANCH_MANAGER') return <Navigate to="/dashboard/branch" replace />;
  if (role === 'SUPER_ADMIN')    return <SuperAdminDashboardView />;
  if (role === 'COMPANY_ADMIN')  return <CompanyAdminDashboardView />;
  if (role === 'BDE')            return <BdeDashboardView />;
  if (role === 'ISE')            return <IseDashboardView />;

  return <Navigate to="/dashboard/branch" replace />;
};

export default DashboardPage;
