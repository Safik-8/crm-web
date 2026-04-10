import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../../features/auth/pages/LoginPage';
import BaseLayout from '../../shared/layouts/BaseLayout';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import LeadsPage from '../../features/leads/pages/LeadsPage';
import CustomersPage from '../../features/customers/pages/CustomersPage';
import DealsPage from '../../features/deals/pages/DealsPage';
import TasksPage from '../../features/tasks/pages/TasksPage';
import CompanySettingsPage from '../../features/company/pages/CompanySettingsPage';
import BranchSettingsPage from '../../features/branches/pages/BranchSettingsPage';
import ProspectsPage from '../../features/prospects/pages/ProspectsPage';
import ActivitiesPage from '../../features/activities/pages/ActivitiesPage';
import SessionsPage from '../../features/sessions/pages/SessionsPage';
import ReportsPage from '../../features/reports/pages/ReportsPage';
import UsersPage from '../../features/users/pages/UsersPage';
import ApprovalsPage from '../../features/approvals/pages/ApprovalsPage';
import AuditPage from '../../features/audit/pages/AuditPage';
import TargetsPage from '../../features/targets/pages/TargetsPage';
import NotificationsPage from '../../features/notifications/pages/NotificationsPage';
import { PERMISSIONS } from '../../lib/constants/permissions';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <BaseLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_DASHBOARD}>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/company',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_COMPANY_DASHBOARD}>
            <DashboardPage title="Company Dashboard" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'prospects',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_PROSPECTS}>
            <ProspectsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'activities',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_ACTIVITIES}>
            <ActivitiesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sessions',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_SESSIONS}>
            <SessionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'leads',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_LEADS}>
            <LeadsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'customers',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_CUSTOMERS}>
            <CustomersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'deals',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_DEALS}>
            <DealsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'tasks',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_TASKS}>
            <TasksPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_REPORTS}>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports/team',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_TEAM_REPORTS}>
            <ReportsPage title="Team Reports" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'approvals',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.APPROVE_TRANSFERS}>
            <ApprovalsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_USERS}>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_SETTINGS}>
            <CompanySettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/branch',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_BRANCH_SETTINGS}>
            <BranchSettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/company',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_COMPANY_SETUP}>
            <CompanySettingsPage title="Company Setup" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'audit',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_AUDIT}>
            <AuditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'targets',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_TARGETS}>
            <TargetsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_NOTIFICATIONS}>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
