// crm-web/src/features/dashboard/pages/DashboardPage.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import SuperAdminDashboardView from './SuperAdminDashboardView';
import CompanyAdminDashboardView from './CompanyAdminDashboardView';
import BranchDashboardView from './BranchDashboardView';
import BdeDashboardView from './BdeDashboardView';
import IseDashboardView from './IseDashboardView';

const DashboardPage = () => {
  const { user, loading, hasPermission } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const role = user.primaryRole;
  const rank = user.primaryRoleRank ?? 0;

  // ── Default system roles (exact name match — always hits first) ──
  if (role === 'SUPER_ADMIN') return <SuperAdminDashboardView />;
  if (role === 'COMPANY_ADMIN') return <CompanyAdminDashboardView />;
  if (role === 'BRANCH_MANAGER') return <BranchDashboardView />;
  if (role === 'BDE') return <BdeDashboardView />;
  if (role === 'ISE') return <IseDashboardView />;

  // ── Custom roles: pick dashboard by permission, then rank ──
  if (hasPermission('COMPANY', 'canView') || hasPermission('view:company_setup')) return <CompanyAdminDashboardView />;
  if (hasPermission('BRANCH', 'canView') || hasPermission('view:branches')) return <BranchDashboardView />;
  if (rank >= 61) return <CompanyAdminDashboardView />;
  if (rank >= 41) return <BranchDashboardView />;
  if (rank >= 21) return <BdeDashboardView />;

  return <IseDashboardView />;
};

export default DashboardPage;
