import React, { useState, useEffect, useRef } from 'react';
import { Shield, Plus, Edit2, Trash2, Power, AlertCircle, RefreshCcw, Check, X } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, useToggleRoleStatus } from '../hooks/useRoles';
import { roleApi } from '../api/roleApi';
import GenericPage from '../../../shared/components/templates/GenericPage';
import Button from '../../../shared/components/elements/Button';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import TextField from '../../../shared/components/elements/TextField';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { companyApi } from '../../company/api/companyApi';
import Table from '../../../shared/components/elements/Table';
import Skeleton from '../../../shared/components/elements/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';

const MODULES_LIST = [
  { value: "SYSTEM_SETTINGS", label: "System Settings" },
  { value: "COMPANY", label: "Company Setup" },
  { value: "BRANCH", label: "Branch Setup" },
  { value: "ROLE_PERMISSION", label: "Roles & Permissions" },
  { value: "USER", label: "User Management" },
  { value: "TEAM", label: "Team Coordination" },
  { value: "LEAD", label: "Leads Management" },
  { value: "LEAD_ASSIGNMENT", label: "Lead Assignment" },
  { value: "PIPELINE", label: "Pipelines" },
  { value: "TASK", label: "Tasks" },
  { value: "ACTIVITY", label: "Activities" },
  { value: "COURSE", label: "Courses" },
  { value: "TARGET", label: "Targets" },
  { value: "CUSTOMER", label: "Customers" },
  { value: "APPROVAL", label: "Approvals" },
  { value: "DASHBOARD", label: "Dashboard" },
  { value: "REPORT", label: "Reports" },
  { value: "NOTIFICATION", label: "Notifications" },
  { value: "AUDIT", label: "Audit Logs" }
];

const ACTIONS = [
  { key: "canView", label: "View" },
  { key: "canCreate", label: "Create" },
  { key: "canEdit", label: "Edit" },
  { key: "canDelete", label: "Delete" },
  { key: "canArchive", label: "Archive" }
];

const RoleManagementPage = () => {
  const { user } = useAuth();
  const { forceHideLoader } = useLoader();
  const didHideLoader = useRef(false);

  // TanStack Query Hooks
  const { roles, loadingState, refetch, search, handleSearchChange } = useRoles();
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
  const [formPermissions, setFormPermissions] = useState({});

  // Query Companies for Super Admin dropdown selection
  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'list-raw'],
    queryFn: () => companyApi.getCompanies(),
    enabled: user?.primaryRole === 'SUPER_ADMIN'
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
        
        // Map permissions list to object map
        const permMap = {};
        selectedRole.rolePermissions?.forEach(p => {
          permMap[p.module] = {
            canView: p.canView,
            canCreate: p.canCreate,
            canEdit: p.canEdit,
            canDelete: p.canDelete,
            canArchive: p.canArchive
          };
        });
        setFormPermissions(permMap);
      } else {
        setFormName('');
        setFormDescription('');
        setFormCompanyId('');
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

  // Toggle permission checkbox in matrix
  const handlePermissionChange = (module, action, checked) => {
    setFormPermissions(prev => ({
      ...prev,
      [module]: {
        ...(prev[module] || { canView: false, canCreate: false, canEdit: false, canDelete: false, canArchive: false }),
        [action]: checked
      }
    }));
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
      companyId: formCompanyId ? parseInt(formCompanyId, 10) : null,
      permissions: payloadPermissions
    };

    const toastId = toast.loading(selectedRole ? 'Updating role...' : 'Creating role...');
    try {
      if (selectedRole) {
        await updateRoleMutation.mutateAsync({ id: selectedRole.id, data });
        toast.success('Role updated successfully', { id: toastId });
      } else {
        await createRoleMutation.mutateAsync(data);
        toast.success('Role created successfully', { id: toastId });
      }
      setIsFormOpen(false);
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

  const isSuperOrCompanyAdmin = user?.primaryRole === 'SUPER_ADMIN' || user?.primaryRole === 'COMPANY_ADMIN';

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
      align: 'center',
      cell: (role) => (
        <span className="font-bold text-[13px] text-slate-700">{role.rank}</span>
      ),
      skeleton: () => <Skeleton className="h-5 w-10 mx-auto" />,
    },
    {
      header: 'Type',
      cell: (role) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
          role.isSystem 
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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
          role.status === 'ACTIVE'
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
        <div className="flex items-center justify-end gap-1.5">
          {isSuperOrCompanyAdmin && (
            <>
              <button
                onClick={() => handleEditClick(role)}
                disabled={role.rank >= user?.primaryRoleRank || (role.isSystem && user?.primaryRole !== 'SUPER_ADMIN')}
                className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all disabled:opacity-40"
                title="Edit Role"
              >
                <Edit2 size={15} />
              </button>
              
              {!role.isSystem && (
                <>
                  <button
                    onClick={() => handleToggleStatusClick(role)}
                    className={`p-1.5 rounded-lg transition-all ${
                      role.status === 'ACTIVE' 
                        ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' 
                        : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'
                    }`}
                    title={role.status === 'ACTIVE' ? 'Deactivate Role' : 'Activate Role'}
                  >
                    <Power size={15} />
                  </button>

                  <button
                    onClick={() => handleDeleteClick(role)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete Role"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      ),
      skeleton: () => <Skeleton className="h-8 w-24 rounded-lg ml-auto" />,
    }
  ];

  return (
    <GenericPage
      title="Role & Permission Settings"
      description="Manage role-based security configurations, custom roles, and functional permission matrices."
      icon={Shield}
    >
      <div className="flex flex-col gap-4">
        {/* Top filter and action bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search roles..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={refetch}
              className="p-2 text-slate-400 hover:text-orange-500 hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
            >
              <RefreshCcw size={18} className={loadingState === 'loading' ? 'animate-spin' : ''} />
            </button>
            {isSuperOrCompanyAdmin && (
              <Button
                onClick={handleCreateClick}
                variant="contained"
                startIcon={<Plus size={18} />}
              >
                Add Role
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Cards (visible on smaller screens, hidden on md+) */}
        <div className="block md:hidden space-y-4">
          {loadingState === 'loading' ? (
            <div className="py-8 text-center text-slate-400 font-medium">
              Loading roles...
            </div>
          ) : roles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center">
              <AlertCircle className="text-slate-300 mx-auto mb-2" size={32} />
              <p className="font-bold text-slate-700">No Roles Found</p>
              <p className="text-xs text-slate-400">Add a custom role or refine your search.</p>
            </div>
          ) : (
            roles.map((role) => (
              <div key={role.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${role.isSystem ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                      <Shield size={14} />
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{role.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border ${
                    role.isSystem 
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
                    <span className="text-[10px] font-semibold text-slate-400">Status:</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      role.status === 'ACTIVE' 
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
        <div className="hidden md:block">
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

        {/* Create/Edit Slideover */}
        <DynamicFormSlideover
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={selectedRole ? "Edit Role & Permissions" : "Create Custom Role"}
          subtitle="Configure permissions and authority ranking level for application modules."
          icon={Shield}
          onSubmit={handleFormSubmit}
          submitText={selectedRole ? "Save Changes" : "Create Role"}
        >
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Role Name</label>
              <input
                type="text"
                disabled={selectedRole?.isSystem}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Sales Coordinator"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Description</label>
              <textarea
                value={formDescription}
                disabled={selectedRole?.isSystem && user?.primaryRole !== 'SUPER_ADMIN'}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe role responsibilities..."
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-700 min-h-[70px] resize-y disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {user?.primaryRole === 'SUPER_ADMIN' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Assign to Company</label>
                <select
                  disabled={selectedRole?.isSystem}
                  value={formCompanyId}
                  onChange={(e) => setFormCompanyId(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-700 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">Global / System Role</option>
                  {companiesList.map(comp => (
                    <option key={comp.id} value={comp.id}>{comp.name} ({comp.code})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Permission Matrix Grid */}
            <div className="border-t border-slate-100 pt-4 mt-2">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-3">Module Permissions Matrix</h3>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 px-3">Module</th>
                        {ACTIONS.map(act => (
                          <th key={act.key} className="py-2.5 px-2 text-center">{act.label}</th>
                        ))}
                        <th className="py-2.5 px-3 text-center">Toggle All</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {MODULES_LIST.map(mod => (
                        <tr key={mod.value} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-xs font-bold text-slate-700">
                            {mod.label}
                          </td>
                          {ACTIONS.map(act => {
                            const isChecked = !!formPermissions[mod.value]?.[act.key];
                            return (
                              <td key={act.key} className="py-2 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={selectedRole?.isSystem && user?.primaryRole !== 'SUPER_ADMIN'}
                                  onChange={(e) => handlePermissionChange(mod.value, act.key, e.target.checked)}
                                  className="h-3.5 w-3.5 accent-orange-500 rounded border-slate-300 text-orange-600 focus:ring-orange-500/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                />
                              </td>
                            );
                          })}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                disabled={selectedRole?.isSystem && user?.primaryRole !== 'SUPER_ADMIN'}
                                onClick={() => handleToggleRowPermissions(mod.value, true)}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded transition-all disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                                title="Select All"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={selectedRole?.isSystem && user?.primaryRole !== 'SUPER_ADMIN'}
                                onClick={() => handleToggleRowPermissions(mod.value, false)}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded transition-all disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                                title="Deselect All"
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
        </DynamicFormSlideover>

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
    </GenericPage>
  );
};

export default RoleManagementPage;
