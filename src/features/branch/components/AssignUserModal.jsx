import React, { useMemo } from 'react';
import { UserPlus, User, Mail, Lock, ShieldAlert, Network } from 'lucide-react';
import { toast } from '../../../shared/utils/toast';
import { useAssignUserToBranch } from '../hooks/useBranches';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useRoles } from '../../roles/hooks/useRoles';
import DynamicFormModal from '../../../shared/components/elements/DynamicFormModal';
import Checkbox from '../../../shared/components/elements/Checkbox';

/**
 * AssignUserModal Component
 * Centered dialog to CREATE a new user and assign to a branch.
 * Integrated with TanStack Query.
 */
const AssignUserModal = ({ isOpen, onClose, branch, onSuccess }) => {
  const assignUserMutation = useAssignUserToBranch();
  const { user } = useAuth();
  const { roles } = useRoles(branch?.companyId);

  const userRank = user?.primaryRoleRank || 80;

  // Filter roles dynamically: active status, rank lower than user's rank.
  // Super Admin (rank 100) can assign Company Admin (rank 80) and below.
  // Company Admin (rank 80) can assign Branch Manager (rank 60) and below.
  const roleOptions = useMemo(() => {
    const maxRank = userRank === 100 ? 90 : 80;
    return roles
      .filter(r => r.status === 'ACTIVE' && r.rank < maxRank)
      .map(r => ({
        value: r.name,
        label: r.isSystem 
          ? (r.name === 'SUPER_ADMIN' ? 'Super Admin' : r.name === 'COMPANY_ADMIN' ? 'Company Admin' : r.name === 'BRANCH_MANAGER' ? 'Branch Manager' : r.name)
          : r.name
      }));
  }, [roles, userRank]);

  const validate = (values) => {
    const errs = {};
    const email = (values.email || '').trim();
    const password = (values.password || '').trim();

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address.';
    }
    if (password && password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    return errs;
  };

  const handleSubmit = async (values) => {
    try {
      await assignUserMutation.mutateAsync({
        branchId: branch.id,
        userData: {
          name: values.name,
          email: values.email,
          password: values.password,
          primaryRole: values.primaryRole,
          secondaryRoles: Array.isArray(values.secondaryRoles) ? values.secondaryRoles : []
        }
      });

      toast.success(`User "${values.name}" created & assigned to ${branch.name}`);
      onSuccess?.();
      onClose();
    } catch (error) {
      if (error && (error.statusCode === 409 || error.status === 409)) {
        toast.error('Email is already in use.');
        throw { email: 'A user with this email already exists.' };
      } else {
        toast.error(error?.message || 'An unexpected error occurred. Please try again.');
        throw error;
      }
    }
  };

  const fields = [
    { key: 'name', label: 'Full Name', icon: User, type: 'text', placeholder: 'Enter user full name...', required: true },
    { key: 'email', label: 'Email Address', icon: Mail, type: 'email', placeholder: 'user@company.com', required: true },
    { key: 'password', label: 'Password', icon: Lock, type: 'password', placeholder: 'Minimum 6 characters', required: true },
    {
      key: 'primaryRole',
      label: 'Primary Role',
      icon: ShieldAlert,
      type: 'select',
      placeholder: 'Select a role',
      required: true,
      options: roleOptions
    },
    {
      key: 'secondaryRoles',
      label: 'Secondary Roles',
      render: (value, onChange, formValues) => {
        const primarySelected = formValues.primaryRole;
        const primaryRoleObj = roles.find(r => r.name === primarySelected);
        const primaryRank = primaryRoleObj ? (primaryRoleObj.rank ?? 0) : 0;
        const maxRank = userRank === 100 ? 90 : 80;
        // Filter secondary roles: active, rank lower than actor's rank, and less than or equal to the primary role's rank (excluding itself)
        const eligibleSecondaryRoles = roles.filter(
          r => r.status === 'ACTIVE' && r.rank < maxRank && r.rank <= primaryRank && r.name !== primarySelected
        );

        if (eligibleSecondaryRoles.length === 0) return null;

        const currentVal = Array.isArray(value) ? value : [];

        const handleToggle = (roleName) => {
          const nextVal = currentVal.includes(roleName)
            ? currentVal.filter(n => n !== roleName)
            : [...currentVal, roleName];
          onChange('secondaryRoles', nextVal);
        };

        return (
          <div className="flex flex-col gap-2 mt-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Secondary Roles (Optional)</span>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {eligibleSecondaryRoles.map(role => {
                const isChecked = currentVal.includes(role.name);
                const roleLabel = role.isSystem 
                  ? (role.name === 'BRANCH_MANAGER' ? 'Branch Manager' : role.name)
                  : role.name;
                return (
                  <label
                    key={role.id}
                    className={`flex items-center pl-2 pr-4 py-1 border rounded-xl cursor-pointer hover:bg-slate-50 select-none transition-all duration-150 ${
                      isChecked ? 'border-orange-500 bg-orange-50/20 shadow-sm' : 'border-slate-200'
                    }`}
                  >
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={isChecked}
                      onChange={() => handleToggle(role.name)}
                      sx={{ p: 0.5, mr: 1, width: 'auto' }}
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {roleLabel}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <DynamicFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create & Assign User"
      subtitle={branch ? `Registering to ${branch.name}` : ''}
      icon={UserPlus}
      fields={fields}
      initialValues={{ name: '', email: '', password: '', primaryRole: roleOptions[0]?.value || '', reportingManagerId: '', secondaryRoles: [] }}
      onSubmit={handleSubmit}
      submitText="Create & Assign User"
      validate={validate}
    />
  );
};

export default AssignUserModal;
