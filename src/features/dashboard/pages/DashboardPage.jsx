// crm-web/src/features/dashboard/pages/DashboardPage.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import SuperAdminDashboardView    from './SuperAdminDashboardView';
import CompanyAdminDashboardView  from './CompanyAdminDashboardView';
import BranchDashboardView        from './BranchDashboardView';
import BdeDashboardView           from './BdeDashboardView';
import IseDashboardView           from './IseDashboardView';

const DashboardPage = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)   return <Navigate to="/login" replace />;

  const role = user.primaryRole;

  if (role === 'BRANCH_MANAGER') return <BranchDashboardView />;
  if (role === 'SUPER_ADMIN')    return <SuperAdminDashboardView />;
  if (role === 'COMPANY_ADMIN')  return <CompanyAdminDashboardView />;
  if (role === 'BDE')            return <BdeDashboardView />;
  if (role === 'ISE')            return <IseDashboardView />;

  return <BranchDashboardView />;
};

export default DashboardPage;
