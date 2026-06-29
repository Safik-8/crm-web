import React from 'react';
import { UserPlus, User, Mail, Lock, ShieldAlert } from 'lucide-react';
import { toast } from '../../../shared/utils/toast';
import { branchApi } from '../api/branchApi';
import { ROLES } from '../../../lib/constants/roles';
import DynamicFormModal from '../../../shared/components/elements/DynamicFormModal';

const ROLE_OPTIONS = [
  { value: ROLES.BRANCH_MANAGER, label: 'Branch Manager' },
  { value: ROLES.BDE, label: 'BDE' },
  { value: ROLES.ISE, label: 'ISE' }
];

/**
 * AssignUserModal Component
 * Centered dialog to CREATE a new user and assign to a branch.
 * Powered by reusable DynamicFormModal.
 */
const AssignUserModal = ({ isOpen, onClose, branch, onSuccess }) => {
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
      const response = await branchApi.assignUser(branch.id, {
        name: values.name,
        email: values.email,
        password: values.password,
        roleName: values.roleName
      });

      if (response && response.success) {
        toast.success(`User "${values.name}" created & assigned to ${branch.name}`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(response?.message || 'Failed to assign user');
      }
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
      options: ROLE_OPTIONS
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
      initialValues={{ name: '', email: '', password: '', roleName: 'BRANCH_MANAGER' }}
      onSubmit={handleSubmit}
      submitText="Create & Assign User"
      validate={validate}
    />
  );
};

export default AssignUserModal;
