import React, { useMemo } from 'react';
import { UserPlus, User, Mail, Lock, ShieldAlert } from 'lucide-react';
import { toast } from '../../../shared/utils/toast';
import { useAssignUserToBranch } from '../hooks/useBranches';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useRoles } from '../../roles/hooks/useRoles';
import DynamicFormModal from '../../../shared/components/elements/DynamicFormModal';

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
          roleName: values.roleName
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
      key: 'roleName',
      label: 'Assign Role',
      icon: ShieldAlert,
      type: 'select',
      placeholder: 'Select a role',
      required: true,
      options: roleOptions
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
      initialValues={{ name: '', email: '', password: '', roleName: roleOptions[0]?.value || '' }}
      onSubmit={handleSubmit}
      submitText="Create & Assign User"
      validate={validate}
    />
  );
};

export default AssignUserModal;
