import React, { useState, useEffect, useRef } from 'react';
import { Shield, Plus, Edit2, Trash2, Power, AlertCircle, RefreshCcw, Check, X, MoreVertical, Info } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, useToggleRoleStatus } from '../hooks/useRoles';
import { roleApi } from '../api/roleApi';
import RoleScopePreview from '../components/RoleScopePreview';
import RoleSummaryBox from '../components/RoleSummaryBox';
import GenericPage from '../../../shared/components/templates/GenericPage';
import PageHeader from '../../../shared/components/modules/PageHeader';
import Button from '../../../shared/components/elements/Button';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import Checkbox from '../../../shared/components/elements/Checkbox';
import SearchInput from '../../../shared/components/elements/SearchInput';
import { toast } from '../../../shared/utils/toast';
import { useQuery } from '@tanstack/react-query';
import { companyApi } from '../../company/api/companyApi';
import Table from '../../../shared/components/elements/Table';
import Pagination from '../../../shared/components/elements/Pagination';
import Skeleton from '../../../shared/components/elements/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tooltip from '@mui/material/Tooltip';
import Select from '@mui/material/Select';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';

const MODULES_LIST = [
  {
    value: "SYSTEM_SETTINGS",
    label: "System Settings",
    uiLocation: "/settings/system",
    controls: "Global system configuration, timezone, branding & default limits"
  },
  {
    value: "COMPANY",
    label: "Company Setup",
    uiLocation: "/settings/organization",
    controls: "Company entities, profile information & branding"
  },
  {
    value: "BRANCH",
    label: "Branch Setup",
    uiLocation: "/settings/branch",
    controls: "Branch locations, managers & branch assignments"
  },
  {
    value: "USER",
    label: "User Management",
    uiLocation: "/users",
    controls: "Employee directory, user creation & role assignments"
  },
  {
    value: "TEAM",
    label: "Team Coordination",
    uiLocation: "/teams & /my-team",
    controls: "Team pods, BDE leads & ISE member assignments"
  },
  {
    value: "LEAD",
    label: "Leads Management",
    uiLocation: "/leads",
    controls: "Lead records, comments, notes, call logs & quick actions"
  },
  {
    value: "FOLLOWUP",
    label: "Follow-ups & Reminders",
    uiLocation: "Dashboard & Leads > Follow-ups",
    controls: "Schedule, complete, view & manage lead follow-ups and due reminders"
  },
  {
    value: "TASK",
    label: "Tasks Management",
    uiLocation: "Dashboard & Leads > Tasks",
    controls: "Create, track, reassign & manage follow-up tasks and deadlines"
  },
  {
    value: "ACTIVITY",
    label: "Activity History",
    uiLocation: "Leads & Deals > Activity Log",
    controls: "View timeline of customer interactions, stage transitions & notes"
  },
  {
    value: "QUALIFICATION",
    label: "Lead Qualification",
    uiLocation: "/settings/qualification",
    controls: "Qualification scoring criteria & lead qualification drawer"
  },
  {
    value: "LEAD_ASSIGNMENT",
    label: "Lead Assignment",
    uiLocation: "/assignment-settings",
    controls: "Round-robin distribution, capacity limits & assign drawer"
  },
  {
    value: "LEAD_SOURCE",
    label: "Lead Sources",
    uiLocation: "/settings/lead-sources",
    controls: "Inbound channels (Website, Ads, Referrals, Social)"
  },
  {
    value: "LEAD_STATUS",
    label: "Lead Statuses",
    uiLocation: "/settings/lead-statuses",
    controls: "Lead status tags (Hot, Warm, Cold, Junk, Disqualified)"
  },
  {
    value: "PIPELINE",
    label: "Pipelines",
    uiLocation: "/pipelines",
    controls: "Pipeline stages, transition rules & Kanban boards"
  },
  {
    value: "OPPORTUNITY_PIPELINE",
    label: "Opportunity Pipelines",
    uiLocation: "Opportunities > Manage Stages",
    controls: "Opportunity lifecycle stage definitions & probabilities"
  },
  {
    value: "OPPORTUNITY",
    label: "Opportunities Engine",
    uiLocation: "/opportunities",
    controls: "Deal conversions, opportunity records & value tracking"
  },
  {
    value: "CUSTOMER",
    label: "Customers",
    uiLocation: "/customers",
    controls: "Converted client accounts, purchase history & directory"
  },
  {
    value: "DEAL",
    label: "Deals",
    uiLocation: "/deals",
    controls: "Closed-won transactions, payment tracking & contracts"
  },
  {
    value: "COURSE",
    label: "Courses",
    uiLocation: "/courses",
    controls: "Product/course catalog, curriculums & pricing packages"
  },
  {
    value: "APPROVAL",
    label: "Approvals",
    uiLocation: "Proposals & Deals Drawers",
    controls: "Discount approvals, manager overrides & proposal sign-offs"
  },
  {
    value: "DASHBOARD",
    label: "Dashboard",
    uiLocation: "/dashboard",
    controls: "Executive, branch, BDE & ISE analytical dashboards"
  },
  {
    value: "TARGET",
    label: "Targets",
    uiLocation: "/kpi-management (KPI Setup)",
    controls: "Monthly/quarterly targets for users, teams & branches"
  },
  {
    value: "KPI",
    label: "KPI & Performance",
    uiLocation: "/my-performance & /kpi-analytics",
    controls: "Personal & team conversion KPI tracking & analytics"
  },
  {
    value: "NOTIFICATION",
    label: "Notifications",
    uiLocation: "Topbar Bell & /notifications",
    controls: "Alert center, system notifications & reminder dispatches"
  },
  {
    value: "AUDIT",
    label: "Audit Logs",
    uiLocation: "/audit-logs",
    controls: "Security audit trails & record change inspection"
  },
  {
    value: "REPORT",
    label: "Reports Engine",
    uiLocation: "/reports",
    controls: "General reporting suite, filtering & data exports"
  },
  {
    value: "REVENUE_REPORT",
    label: "Revenue & Financial Reports",
    uiLocation: "/reports/revenue",
    controls: "Branch revenue trends, turnover & financial forecasting"
  },
  {
    value: "SALES_PERFORMANCE",
    label: "Sales Performance Reports",
    uiLocation: "/reports/sales-performance",
    controls: "BDE/ISE sales leaderboards, call ratios & conversion rates"
  }
];

const ACTIONS = [
  { key: "canView", label: "View" },
  { key: "canCreate", label: "Create" },
  { key: "canEdit", label: "Edit" },
  { key: "canDelete", label: "Delete" }
];

const HIERARCHY_DETAILS = {
  COMPANY_ADMIN_TO_BRANCH_MANAGER: {
    title: 'Company-Wide Access',
    badgeText: 'All Branches & Teams',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    description: 'The user can view and manage all company operations across every branch (e.g. Operations Director, General Manager).',
    scopeList: [
      'Access to leads, deals & opportunities across all branches',
      'Company-wide analytics, targets & performance reports',
      'Visibility into all branches and employee directories'
    ]
  },
  BRANCH_MANAGER_TO_BDE: {
    title: 'Branch-Level Access',
    badgeText: 'Assigned Branch Only',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80',
    description: 'The user is limited to data and operations within their assigned branch location (e.g. Assistant Branch Manager, Shift Lead).',
    scopeList: [
      'Views all leads, customers & deals within their branch',
      'Can create and manage team pods in their branch',
      'Tracks branch KPI targets and team performance'
    ]
  },
  BDE_TO_ISE: {
    title: 'Team Pod Access',
    badgeText: 'Assigned Team Members & Self',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    description: 'The user can view and work on records assigned to themselves and all members within their active team pod (e.g. Team Lead, Senior Sales Rep).',
    scopeList: [
      'Sees leads, deals & pipeline stages for their whole team',
      'Can monitor team member follow-ups and assignments',
      'Views team target progress and conversion metrics'
    ]
  },
  BELOW_ISE: {
    title: 'Personal Access Only',
    badgeText: 'Own Records Only',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80',
    description: 'The user can only view and edit records directly assigned to their own user account (e.g. Sales Executive, Junior Telecaller).',
    scopeList: [
      'Strictly locked to only their own assigned leads & deals',
      'Personal follow-up tasks, notes & call history only',
      'Personal individual achievement scores only'
    ]
  }
};

const RoleManagementPage = () => {
  const { user } = useAuth();
  const { forceHideLoader } = useLoader();
  const didHideLoader = useRef(false);

  // TanStack Query Hooks
  const isSuperAdmin = user?.primaryRole === 'SUPER_ADMIN' || (user?.primaryRoleRank ?? 0) >= 100;

  // Company filter — Super Admin only
  const [companyFilter, setCompanyFilter] = useState('');

  const { roles, pagination, loadingState, refetch, search, handleSearchChange, setPage } = useRoles(companyFilter);
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const toggleStatusMutation = useToggleRoleStatus();

  // Dialog & Drawer States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [roleToStatusToggle, setRoleToStatusToggle] = useState(null);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [associatedUsers, setAssociatedUsers] = useState([]);
  const [reassignRoleId, setReassignRoleId] = useState('');

  // Form Field States
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCompanyId, setFormCompanyId] = useState('');
  const [formHierarchyBracket, setFormHierarchyBracket] = useState('COMPANY_ADMIN_TO_BRANCH_MANAGER');
  const [formPermissions, setFormPermissions] = useState({});

  // Query Companies for Super Admin dropdown selection
  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'list-raw'],
    queryFn: () => companyApi.getCompanies(),
    enabled: isSuperAdmin
  });
  const companiesList = Array.isArray(companiesData?.data) ? companiesData.data : [];

  useEffect(() => {
    if (loadingState !== 'loading' && !didHideLoader.current) {
      forceHideLoader();
      didHideLoader.current = true;
    }
  }, [loadingState, forceHideLoader]);

  // Form Initialization
  useEffect(() => {
    if (isFormOpen) {
      if (selectedRole) {
        setFormName(selectedRole.name);
        setFormDescription(selectedRole.description || '');
        setFormCompanyId(selectedRole.companyId || '');

        // Map rank to corresponding hierarchy bracket
        const r = Number(selectedRole.rank || 0);
        let bracket = 'COMPANY_ADMIN_TO_BRANCH_MANAGER';
        if (r >= 61 && r <= 79) bracket = 'COMPANY_ADMIN_TO_BRANCH_MANAGER';
        else if (r >= 41 && r <= 59) bracket = 'BRANCH_MANAGER_TO_BDE';
        else if (r >= 21 && r <= 39) bracket = 'BDE_TO_ISE';
        else if (r <= 19) bracket = 'BELOW_ISE';
        setFormHierarchyBracket(bracket);

        // Map permissions list to object map
        const permMap = {};
        const rawPerms = selectedRole.rolePermissions || selectedRole.permissions || [];
        rawPerms.forEach(p => {
          permMap[p.module] = {
            canView: Boolean(p.canView),
            canCreate: Boolean(p.canCreate),
            canEdit: Boolean(p.canEdit),
            canDelete: Boolean(p.canDelete),
            canArchive: Boolean(p.canArchive)
          };
        });
        setFormPermissions(permMap);
      } else {
        setFormName('');
        setFormDescription('');
        setFormCompanyId('');
        setFormHierarchyBracket('COMPANY_ADMIN_TO_BRANCH_MANAGER');
        setFormPermissions({});
      }
    }
  }, [isFormOpen, selectedRole]);

  const handleCreateClick = () => {
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (role) => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (role) => {
    setRoleToDelete(role);
    const userCount = role._count?.userRoles ?? 0;

    if (userCount > 0) {
      const toastId = toast.loading('Retrieving associated users...');
      try {
        const res = await roleApi.getRoleUsers(role.id);
        toast.dismiss(toastId);
        if (res && res.success && res.data?.users) {
          setAssociatedUsers(res.data.users);
          setReassignRoleId('');
          setIsReassignOpen(true);
        } else {
          setIsDeleteOpen(true);
        }
      } catch (err) {
        toast.dismiss(toastId);
        console.error(err);
        setIsDeleteOpen(true);
      }
    } else {
      setIsDeleteOpen(true);
    }
  };

  const handleToggleStatusClick = (role) => {
    setRoleToStatusToggle(role);
    setIsStatusOpen(true);
  };

  // Toggle permission checkbox in matrix with view dependencies
  const handlePermissionChange = (module, action, checked) => {
    setFormPermissions(prev => {
      const current = prev[module] || { canView: false, canCreate: false, canEdit: false, canDelete: false, canArchive: false };
      let updatedModule = { ...current, [action]: checked };

      if (action === 'canView' && !checked) {
        // Unchecking View automatically deselects all other actions for this module
        updatedModule = {
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canArchive: false
        };
      } else if (action !== 'canView' && checked) {
        // Checking Create, Edit, Delete, or Archive automatically checks View
        updatedModule.canView = true;
      }

      return {
        ...prev,
        [module]: updatedModule
      };
    });
  };

  // Select all or deselect all permissions for a module
  const handleToggleRowPermissions = (module, selectAll) => {
    setFormPermissions(prev => ({
      ...prev,
      [module]: {
        canView: selectAll,
        canCreate: selectAll,
        canEdit: selectAll,
        canDelete: selectAll,
        canArchive: selectAll
      }
    }));
  };

  const handleFormSubmit = async () => {
    if (!formName.trim()) {
      toast.error('Role name is required');
      return;
    }

    const payloadPermissions = Object.keys(formPermissions).map(mod => ({
      module: mod,
      ...formPermissions[mod]
    }));

    const data = {
      name: formName,
      description: formDescription,
      hierarchyBracket: formHierarchyBracket,
      companyId: formCompanyId ? parseInt(formCompanyId, 10) : null,
      permissions: payloadPermissions
    };

    const toastId = toast.loading(selectedRole ? 'Updating role...' : 'Creating role...');
    try {
      if (selectedRole) {
        const res = await updateRoleMutation.mutateAsync({ id: selectedRole.id, data });
        toast.success('Role updated successfully', { id: toastId });
        const updatedRole = res?.data?.role || res?.data;
        if (updatedRole) {
          setSelectedRole(updatedRole);
        }
      } else {
        await createRoleMutation.mutateAsync(data);
        toast.success('Role created successfully', { id: toastId });
        setIsFormOpen(false);
      }
      refetch();
    } catch (err) {
      toast.error(err?.message || 'Action failed', { id: toastId });
    }
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;
    const toastId = toast.loading('Deleting role...');
    try {
      const res = await deleteRoleMutation.mutateAsync(roleToDelete.id);
      if (res && res.success === false && res.code === 'ROLE_HAS_USERS') {
        toast.dismiss(toastId);
        setAssociatedUsers(res.users || []);
        setIsDeleteOpen(false);
        setReassignRoleId('');
        setIsReassignOpen(true);
      } else {
        toast.success('Role deleted successfully', { id: toastId });
        setIsDeleteOpen(false);
        setRoleToDelete(null);
        refetch();
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to delete role', { id: toastId });
    }
  };

  const handleConfirmReassignDelete = async () => {
    if (!roleToDelete || !reassignRoleId) {
      toast.error('Please select a role to reassign users to');
      return;
    }
    const toastId = toast.loading('Reassigning users and deleting role...');
    try {
      await deleteRoleMutation.mutateAsync({
        id: roleToDelete.id,
        reassignRoleId: parseInt(reassignRoleId, 10)
      });
      toast.success('Users reassigned and role successfully deleted', { id: toastId });
      setIsReassignOpen(false);
      setRoleToDelete(null);
      setReassignRoleId('');
      setAssociatedUsers([]);
      refetch();
    } catch (err) {
      toast.error(err?.message || 'Failed to reassign and delete role', { id: toastId });
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!roleToStatusToggle) return;
    const toastId = toast.loading('Toggling status...');
    try {
      await toggleStatusMutation.mutateAsync(roleToStatusToggle.id);
      toast.success('Role status updated successfully', { id: toastId });
      setIsStatusOpen(false);
      setRoleToStatusToggle(null);
      refetch();
    } catch (err) {
      toast.error(err?.message || 'Failed to toggle status', { id: toastId });
    }
  };

  const isSuperOrCompanyAdmin = isSuperAdmin || user?.primaryRole === 'COMPANY_ADMIN';

  const RoleActionsMenu = ({ role }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleOpen = (e) => {
      e.stopPropagation();
      setAnchorEl(e.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    if (!isSuperOrCompanyAdmin) return null;

    const userRank = user?.primaryRoleRank || 0;
    const isEditDisabled = role.rank >= userRank;
    const isStatusDisabled = role.isSystem || role.rank >= userRank;

    return (
      <>
        <button
          type="button"
          onClick={handleOpen}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
          title="Actions"
        >
          <MoreVertical size={16} />
        </button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          elevation={0}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            className: "mt-1 shadow-lg border border-slate-200/80 rounded-xl bg-white min-w-[150px] py-1 text-slate-700 font-sans"
          }}
        >
          <MenuItem
            onClick={() => {
              handleClose();
              handleEditClick(role);
            }}
            disabled={isEditDisabled}
            className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800"
            sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Edit2 size={14} className="text-slate-400" />
            <span>Edit Role</span>
          </MenuItem>

          {!role.isSystem && (
            <MenuItem
              onClick={() => {
                handleClose();
                handleToggleStatusClick(role);
              }}
              disabled={isStatusDisabled}
              className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800 border-t border-slate-100/50"
              sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <Power size={14} className={role.status === 'ACTIVE' ? 'text-amber-500' : 'text-emerald-500'} />
              <span>{role.status === 'ACTIVE' ? 'Deactivate Role' : 'Activate Role'}</span>
            </MenuItem>
          )}

          {!role.isSystem && (
            <MenuItem
              onClick={() => {
                handleClose();
                handleDeleteClick(role);
              }}
              disabled={isStatusDisabled}
              className="px-3.5 py-2 text-[12px] font-bold hover:bg-rose-50 transition-colors text-rose-600 hover:text-rose-700 border-t border-slate-100/50"
              sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <Trash2 size={14} className="text-rose-500" />
              <span>Delete Role</span>
            </MenuItem>
          )}
        </Menu>
      </>
    );
  };

  const columns = [
    {
      header: 'Role Name',
      cell: (role) => (
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${role.isSystem ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
            <Shield size={16} />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-[13px]">{role.name}</p>
          </div>
        </div>
      ),
      skeleton: () => <Skeleton className="h-5 w-40" />,
    },
    {
      header: 'Description',
      cell: (role) => (
        <div className="text-[13px] text-slate-500 font-medium max-w-xs truncate" title={role.description}>
          {role.description || 'No description provided'}
        </div>
      ),
      skeleton: () => <Skeleton className="h-5 w-48" />,
    },
    {
      header: 'Rank',
      align: 'left',
      cell: (role) => (
        <span className="font-bold text-[13px] text-slate-700">{role.rank}</span>
      ),
      skeleton: () => <Skeleton className="h-5 w-10" />,
    },
    {
      header: 'Users',
      align: 'left',
      cell: (role) => (
        <span className="font-bold text-[13px] text-slate-700">
          {role._count?.userRoles ?? 0}
        </span>
      ),
      skeleton: () => <Skeleton className="h-5 w-8" />,
    },
    {
      header: 'Type',
      cell: (role) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${role.isSystem
          ? 'bg-slate-50 text-slate-600 border-slate-200/60'
          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
          }`}>
          {role.isSystem ? 'System' : 'Custom'}
        </span>
      ),
      skeleton: () => <Skeleton className="h-6 w-16 rounded-lg" />,
    },
    {
      header: 'Status',
      cell: (role) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${role.status === 'ACTIVE'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
          : 'bg-slate-50 text-slate-500 border-slate-100'
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${role.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          {role.status}
        </span>
      ),
      skeleton: () => <Skeleton className="h-6 w-20 rounded-full" />,
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (role) => (
        <div className="flex items-center justify-end">
          <RoleActionsMenu role={role} />
        </div>
      ),
      skeleton: () => <Skeleton className="h-8 w-24 rounded-lg ml-auto" />,
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* ── Section Header ─────────────────────────────────────── */}
      <PageHeader
        title="Role & Permission Settings"
        description="Manage role-based security configurations and permission matrices."
        icon={Shield}
        actions={
          <button
            onClick={refetch}
            className="text-slate-400 hover:text-orange-500 transition-colors focus:outline-none"
            title="Refresh Data"
          >
            <RefreshCcw size={14} className={loadingState === 'loading' ? 'animate-spin' : ''} />
          </button>
        }
      />

      {/* Top filter and action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3.5">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <div className="w-full sm:w-64">
            <SearchInput
              placeholder="Search..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          {/* Company filter — Super Admin only */}
          {isSuperAdmin && (
            <div className="w-full sm:w-52">
              <SelectField
                placeholder="All Companies"
                value={companyFilter}
                onChange={(val) => setCompanyFilter(val === undefined ? '' : val)}
                allowEmptyOption
                searchable
                options={companiesList.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                }))}
              />
            </div>
          )}
        </div>

        {isSuperOrCompanyAdmin && (
          <div className="w-full sm:w-auto shrink-0 flex">
            <Button
              onClick={handleCreateClick}
              variant="contained"
              size="medium"
              startIcon={<Plus size={18} />}
              className="w-full sm:w-auto justify-center group shadow-sm hover:shadow-md transition-all"
            >
              Add Role
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Cards (visible on smaller screens, hidden on md+) */}
      <div className="block md:hidden space-y-4">
        {loadingState === 'loading' ? (
          <div className="py-8 text-center text-slate-400 font-medium">
            Loading roles...
          </div>
        ) : roles.length === 0 ? (
          <div className="bg-white border border-slate-200 p-8 text-center">
            <AlertCircle className="text-slate-300 mx-auto mb-2" size={32} />
            <p className="font-bold text-slate-700">No Roles Found</p>
            <p className="text-xs text-slate-400">Add a custom role or refine your search.</p>
          </div>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="bg-white border border-slate-200 p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${role.isSystem ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                    <Shield size={14} />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{role.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border ${role.isSystem
                  ? 'bg-slate-50 text-slate-600 border-slate-200/60'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                  }`}>
                  {role.isSystem ? 'System' : 'Custom'}
                </span>
              </div>

              <p className="text-xs text-slate-500 font-medium line-clamp-2">
                {role.description || 'No description provided'}
              </p>

              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400">Rank:</span>
                  <span className="text-xs font-bold text-slate-700">{role.rank}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400">Users:</span>
                  <span className="text-xs font-bold text-slate-700">{role._count?.userRoles ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400">Status:</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${role.status === 'ACTIVE'
                    ? 'bg-green-50 text-green-700 border border-green-100'
                    : 'bg-slate-50 text-slate-500 border border-slate-200'
                    }`}>
                    {role.status}
                  </span>
                </div>
              </div>

              {isSuperOrCompanyAdmin && (
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => handleToggleStatusClick(role)}
                    disabled={role.isSystem || role.rank >= user?.primaryRoleRank}
                    className="p-2 text-slate-500 hover:text-orange-500 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 disabled:opacity-40"
                    title="Toggle Status"
                  >
                    <Power size={14} />
                  </button>
                  <button
                    onClick={() => handleEditClick(role)}
                    disabled={role.rank >= user?.primaryRoleRank}
                    className="p-2 text-slate-500 hover:text-orange-500 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 disabled:opacity-40"
                    title="Edit Role"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(role)}
                    disabled={role.isSystem || role.rank >= user?.primaryRoleRank}
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-slate-100 disabled:opacity-40"
                    title="Delete Role"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (hidden on mobile, visible on md+) */}
      <div className="hidden md:block w-full relative z-10 bg-white">
        <Table
          columns={columns}
          data={roles}
          loadingState={loadingState}
          emptyTitle="No Roles Found"
          emptyDescription="Add a custom role or refine your search filters."
          emptyIcon={Shield}
          skeletonRows={5}
        />
      </div>

      {/* Pagination Bar */}
      <Pagination
        pagination={pagination}
        onPageChange={setPage}
        isLoading={loadingState === 'loading'}
        entityName="roles"
      />

      {/* Create/Edit Detailed Modal Popup */}
      <Dialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-2xs">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">
                {selectedRole ? "Edit Role & Permissions" : "Create Custom Role"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Configure authority ranking level and module permissions across the application.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, flex: 1, overflowY: 'auto', bgcolor: '#f8fafc' }}>
          <div className="space-y-4">
            {/* Card 1 — Role Profile & Authority Level (1 Orange Badge) */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-[11px] font-bold">1</span>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Role Profile & Authority Level
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Core Configuration</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  id="role-name"
                  label="Role Name"
                  disabled={selectedRole?.isSystem}
                  value={formName}
                  onChange={setFormName}
                  placeholder="e.g. Senior Sales Consultant"
                  required
                />

                {(!selectedRole || !selectedRole.isSystem) ? (
                  <SelectField
                    id="hierarchy-bracket"
                    label="Data Access Level"
                    value={formHierarchyBracket}
                    onChange={(val) => setFormHierarchyBracket(val)}
                    options={[
                      { value: 'COMPANY_ADMIN_TO_BRANCH_MANAGER', label: 'Company-Wide (Above Branch Manager)' },
                      { value: 'BRANCH_MANAGER_TO_BDE', label: 'Branch-Level (Below Branch Manager / Above BDE)' },
                      { value: 'BDE_TO_ISE', label: 'Team Pod (Below BDE / Above ISE)' },
                      { value: 'BELOW_ISE', label: 'Personal Only (Below ISE)' },
                    ]}
                    required
                  />
                ) : (
                  <div className="flex flex-col justify-end">
                    <label className="text-xs font-bold text-slate-600 mb-1.5">System Role Hierarchy Rank</label>
                    <div className="px-3.5 py-2.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                      Rank {selectedRole?.rank} (Locked System Role)
                    </div>
                  </div>
                )}

                {isSuperAdmin && !selectedRole && (
                  <div className="md:col-span-2">
                    <SelectField
                      id="assign-company"
                      label="Assign to Company"
                      disabled={selectedRole?.isSystem}
                      value={formCompanyId}
                      onChange={(val) => setFormCompanyId(val)}
                      placeholder="Global / System Role (All Companies)"
                      allowEmptyOption={true}
                      options={companiesList.map(comp => ({
                        value: comp.id,
                        label: `${comp.name} (${comp.code})`
                      }))}
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <TextField
                    id="role-description"
                    label="Description"
                    multiline
                    rows={2}
                    disabled={selectedRole?.isSystem && user?.primaryRole !== 'SUPER_ADMIN'}
                    value={formDescription}
                    onChange={setFormDescription}
                    placeholder="Describe role responsibilities, operational purpose, and key assignments..."
                  />
                </div>
              </div>
            </div>

            {/* Card 2 — Data Visibility & Scope Boundaries (2 Indigo Badge) */}
            {(!selectedRole || !selectedRole.isSystem) && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[11px] font-bold">2</span>
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Data Visibility & Scope Boundaries
                    </h3>
                  </div>
                  <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Dynamic Scope Engine
                  </span>
                </div>

                <RoleScopePreview
                  hierarchyBracket={formHierarchyBracket}
                  rank={selectedRole?.rank}
                />
              </div>
            )}

            {/* Card 3 — Configuration Summary & Review (3 Blue Badge) */}
            <RoleSummaryBox
              roleName={formName}
              hierarchyBracket={formHierarchyBracket}
              rank={selectedRole?.rank}
              permissions={formPermissions}
              totalModulesCount={MODULES_LIST.length}
              stepNumber={3}
            />

            {/* Card 4 — Module Permissions Matrix (4 Emerald Badge) */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-[11px] font-bold">4</span>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Module Permissions Matrix
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Grant granular action privileges. Enabling Create, Edit, or Delete automatically enables View access.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[460px]">
                  <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-2xs">
                      <tr>
                        <th className="py-3 px-3.5 min-w-[170px]">Module</th>
                        <th className="py-3 px-3 min-w-[150px]">UI Location</th>
                        <th className="py-3 px-3 min-w-[240px]">What It Controls</th>
                        {ACTIONS.map(act => (
                          <th key={act.key} className="py-3 px-2 text-center w-14">{act.label}</th>
                        ))}
                        <th className="py-3 px-3 text-center w-24">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {MODULES_LIST.map(mod => (
                        <tr key={mod.value} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3.5 text-xs font-bold text-slate-800 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{mod.label}</span>
                              <Tooltip title={mod.controls} arrow placement="top">
                                <span className="cursor-help text-slate-400 hover:text-indigo-600 transition-colors">
                                  <Info size={13} />
                                </span>
                              </Tooltip>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-600">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/60 whitespace-nowrap font-mono">
                              {mod.uiLocation}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500 font-normal leading-snug">
                            {mod.controls}
                          </td>
                          {ACTIONS.map(act => {
                            const isChecked = !!formPermissions[mod.value]?.[act.key];
                            const isPermissionDisabled = selectedRole ? (selectedRole.rank >= (user?.primaryRoleRank || 0)) : false;
                            return (
                              <td key={act.key} className="py-2 px-2 text-center">
                                <Checkbox
                                  id={`permission-${mod.value}-${act.key}`}
                                  checked={isChecked}
                                  disabled={isPermissionDisabled}
                                  onChange={(checked) => handlePermissionChange(mod.value, act.key, checked)}
                                  sx={{ p: 0, width: 'auto' }}
                                />
                              </td>
                            );
                          })}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={selectedRole ? (selectedRole.rank >= (user?.primaryRoleRank || 0)) : false}
                                onClick={() => handleToggleRowPermissions(mod.value, true)}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:bg-transparent cursor-pointer"
                                title="Grant All"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={selectedRole ? (selectedRole.rank >= (user?.primaryRoleRank || 0)) : false}
                                onClick={() => handleToggleRowPermissions(mod.value, false)}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-rose-50 rounded transition-all disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:bg-transparent cursor-pointer"
                                title="Revoke All"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>

        {/* Modal Footer */}
        <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => setIsFormOpen(false)}
            disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleFormSubmit}
            isLoading={createRoleMutation.isPending || updateRoleMutation.isPending}
          >
            {selectedRole ? "Save Changes" : "Create Role"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Delete Role"
        message={
          <span>
            Are you sure you want to permanently delete the custom role <strong>{roleToDelete?.name}</strong>? This action cannot be undone.
          </span>
        }
        warningMessage="Warning: Deleting this role will fail if it is currently assigned to any system users."
        onConfirm={handleConfirmDelete}
        type="error"
        isLoading={deleteRoleMutation.isPending}
      />

      {/* Status Toggle Confirmation Modal */}
      <ConfirmModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        title="Confirm Status Change"
        message={
          <span>
            Are you sure you want to toggle the status of <strong>{roleToStatusToggle?.name}</strong> to{' '}
            <strong>{roleToStatusToggle?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}</strong>?
          </span>
        }
        onConfirm={handleConfirmStatusToggle}
        type={roleToStatusToggle?.status === 'ACTIVE' ? 'error' : 'success'}
        isLoading={toggleStatusMutation.isPending}
      />

      {/* Reassign & Delete Dialog */}
      <Dialog
        open={isReassignOpen}
        onClose={() => {
          setIsReassignOpen(false);
          setRoleToDelete(null);
          setAssociatedUsers([]);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1.5,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Sora", "DM Sans", sans-serif' }}>
          Reassign Users & Delete Role
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 2 }}>
          <p className="text-sm text-slate-600">
            The role <strong>{roleToDelete?.name}</strong> is currently assigned to <strong>{associatedUsers.length}</strong> user(s). Before you can delete this role, you must assign these users a new role.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Affected Users:</span>
            <ul className="list-disc list-inside text-xs font-semibold text-slate-700 space-y-1">
              {associatedUsers.map(u => (
                <li key={u.id}>
                  {u.name} <span className="text-slate-400 font-normal">({u.email})</span>
                </li>
              ))}
            </ul>
          </div>

          <FormControl fullWidth size="medium">
            <InputLabel id="reassign-role-label">Select New Role</InputLabel>
            <Select
              labelId="reassign-role-label"
              id="reassign-role-select"
              value={reassignRoleId}
              label="Select New Role"
              onChange={(e) => setReassignRoleId(e.target.value)}
            >
              {roles
                .filter(r => r.id !== roleToDelete?.id && r.status === 'ACTIVE' && r.rank < (user?.primaryRoleRank || 80))
                .map(r => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
                  </MenuItem>
                ))
              }
            </Select>
            <FormHelperText>All affected users will be transitioned to this role.</FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ gap: 1, px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setIsReassignOpen(false);
              setRoleToDelete(null);
              setAssociatedUsers([]);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmReassignDelete}
            disabled={!reassignRoleId || deleteRoleMutation.isPending}
            isLoading={deleteRoleMutation.isPending}
          >
            Reassign & Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RoleManagementPage;
