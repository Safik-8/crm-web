// crm-web/src/features/dashboard/pages/DashboardPage.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { getRoleHierarchy } from '../../../lib/utils/roleHierarchy';
import SuperAdminDashboardView from './SuperAdminDashboardView';
import CompanyAdminDashboardView from './CompanyAdminDashboardView';
import BranchDashboardView from './BranchDashboardView';
import BdeDashboardView from './BdeDashboardView';
import IseDashboardView from './IseDashboardView';

const DashboardPage = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const { isSuperAdmin, isCompanyWide, isBranchLevel, isTeamLevel } = getRoleHierarchy(user);

  // ── Exact 4-Tier Operational Dashboard View Routing ──
  if (isSuperAdmin) return <SuperAdminDashboardView />;
  if (isCompanyWide) return <CompanyAdminDashboardView />;
  if (isBranchLevel) return <BranchDashboardView />;
  if (isTeamLevel) return <BdeDashboardView />;

  return <IseDashboardView />;
};

export default DashboardPage;
