import { ROLES } from '../../lib/constants/roles';

export const MOCK_USERS = {
  ise_user: {
    id: 'u1',
    name: 'Arjun Singh',
    roles: [ROLES.ISE],
    designation: 'Inside Sales Executive',
    email: 'arjun@stackdot.com',
    password: 'password123',
    token: 'mock_token_ise',
  },
  manager_user: {
    id: 'u2',
    name: 'Priya Sharma',
    roles: [ROLES.MANAGER],
    designation: 'Sales Manager',
    email: 'priya@stackdot.com',
    password: 'password123',
    token: 'mock_token_manager',
  },
  ceo_user: {
    id: 'u3',
    name: 'Vikram Malhotra',
    roles: [ROLES.CEO],
    designation: 'Chief Executive Officer',
    email: 'vikram@stackdot.com',
    password: 'password123',
    token: 'mock_token_ceo',
  },
  super_admin: {
    id: 'u4',
    name: 'Admin User',
    roles: [ROLES.SUPER_ADMIN],
    designation: 'System Administrator',
    email: 'admin@stackdot.com',
    password: 'password123',
    token: 'mock_token_super',
  },
  multi_role_user: {
    id: 'u5',
    name: 'Raj K.',
    roles: [ROLES.ISE, ROLES.MANAGER],
    designation: 'Senior Account Lead',
    email: 'raj@stackdot.com',
    password: 'password123',
    token: 'mock_token_multi',
  },
};
