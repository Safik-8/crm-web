import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../../features/auth/pages/LoginPage';
import BaseLayout from '../../shared/layouts/BaseLayout';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import LeadsPage from '../../features/leads/pages/LeadsPage';
import CustomersPage from '../../features/customers/pages/CustomersPage';
import DealsPage from '../../features/deals/pages/DealsPage';
import TasksPage from '../../features/tasks/pages/TasksPage';
import SettingsPage from '../../features/settings/pages/SettingsPage';

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
        element: <DashboardPage />,
      },
      {
        path: 'leads',
        element: <LeadsPage />,
      },
      {
        path: 'customers',
        element: <CustomersPage />,
      },
      {
        path: 'deals',
        element: <DealsPage />,
      },
      {
        path: 'tasks',
        element: <TasksPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
