import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RootRedirect from './RootRedirect';
import LoginPage from '../../features/auth/pages/LoginPage';
import UnauthorizedPage from '../../features/auth/pages/UnauthorizedPage';
import BaseLayout from '../../shared/layouts/BaseLayout';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import BranchDashboardPage from '../../features/dashboard/pages/BranchDashboardPage';
import LeadsPage from '../../features/leads/pages/LeadsPage';
import CustomersPage from '../../features/customers/pages/CustomersPage';
import DealsPage from '../../features/deals/pages/DealsPage';
import TasksPage from '../../features/tasks/pages/TasksPage';
import CompanyRoutes from '../../features/company/routes/CompanyRoutes';
import BranchRoutes from '../../features/branch/routes/BranchRoutes';
import ProspectsPage from '../../features/prospects/pages/ProspectsPage';
import ActivitiesPage from '../../features/activities/pages/ActivitiesPage';
import SessionsPage from '../../features/sessions/pages/SessionsPage';
import ReportsPage from '../../features/reports/pages/ReportsPage';

import UsersPage from '../../features/users/pages/UsersPage';
import CoursesPage from '../../features/courses/pages/CoursesPage';
import TeamsPage from '../../features/teams/pages/TeamsPage';
import RoleManagementPage from '../../features/roles/pages/RoleManagementPage';
import ApprovalsPage from '../../features/approvals/pages/ApprovalsPage';
import AuditPage from '../../features/audit/pages/AuditPage';
import TargetsPage from '../../features/targets/pages/TargetsPage';
import NotificationsPage from '../../features/notifications/pages/NotificationsPage';
import PipelinesPage from '../../features/pipelines/pages/PipelinesPage';
import PipelineStageBuilderPage from '../../features/pipelines/pages/PipelineStageBuilderPage';
import LeadsKanbanPage from '../../features/leads/pages/LeadsKanbanPage';
import UserProfilePage from '../../features/userprofile/pages/UserProfilePage';
import LeadSourcePage from '../../features/leadsources/pages/LeadSourcePage';
import { PERMISSIONS } from '../../lib/constants/permissions';


export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
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
        element: <RootRedirect />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <RootRedirect />
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
        path: 'dashboard/branch',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_BRANCH_DASHBOARD}>
            <BranchDashboardPage />
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
        path: 'teams',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_TEAMS}>
            <TeamsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'courses',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_COURSES}>
            <CoursesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/lead-sources',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_LEAD_SOURCES}>
            <LeadSourcePage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'roles',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_ROLES}>
            <RoleManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/*',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_SETTINGS}>
            <CompanyRoutes />
          </ProtectedRoute>
        ),
      },
      {
        path: 'companies/:companyId/branches/*',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_BRANCHES}>
            <BranchRoutes />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/organization/*',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_SETTINGS}>
            <CompanyRoutes />
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
      // ---- Phase 1: Pipeline & Kanban routes ----
      {
        path: 'pipelines',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_PIPELINES}>
            <PipelinesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pipelines/:id/stages',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_STAGES}>
            <PipelineStageBuilderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pipelines/:id/board',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_LEADS_KANBAN}>
            <LeadsKanbanPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        ),
      },

    ],
  },
  {
    path: '*',
    element: <RootRedirect />,
  },
]);
