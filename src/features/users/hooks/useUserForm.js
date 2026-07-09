// src/features/users/hooks/useUserForm.js

import { useState, useEffect } from 'react';
import { useCreateUserMutation, useUpdateUserMutation } from './useUsers';

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  mobileNumber: '',
  employeeId: '',
  joiningDate: '',
  companyId: '',
  branchId: '',
  roleId: '',
  reportingManagerId: '',
  address: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
  emergencyContact: '',
  status: 'ACTIVE'
};

export const useUserForm = (onSuccess, initialValues = null) => {
  const [values, setValues] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUserMutation();

  const isEditMode = !!initialValues;
  const isLoading = createUserMutation.isPending || updateUserMutation.isPending;

  // Initialize form values if editing
  useEffect(() => {
    if (initialValues) {
      // Find roleId
      const primaryUserRole = initialValues.userRoles?.find(ur => ur.isPrimary) || initialValues.userRoles?.[0];
      const roleId = primaryUserRole?.role?.id || '';

      const nameParts = (initialValues.name || '').trim().split(/\s+/);
      const fallbackFirst = nameParts[0] || '';
      const fallbackLast = nameParts.slice(1).join(' ') || '';

      setValues({
        firstName: initialValues.firstName || fallbackFirst,
        lastName: initialValues.lastName || fallbackLast,
        email: initialValues.email || '',
        mobileNumber: initialValues.mobileNumber || '',
        employeeId: initialValues.employeeId || '',
        joiningDate: initialValues.joiningDate ? initialValues.joiningDate.split('T')[0] : '',
        companyId: initialValues.companyId || '',
        branchId: initialValues.branchId || '',
        roleId: roleId,
        reportingManagerId: initialValues.reportingManagerId || '',
        address: initialValues.profile?.address || '',
        city: initialValues.profile?.city || '',
        state: initialValues.profile?.state || '',
        country: initialValues.profile?.country || '',
        pincode: initialValues.profile?.pincode || '',
        emergencyContact: initialValues.profile?.emergencyContact || '',
        status: initialValues.status || 'ACTIVE'
      });
    } else {
      setValues(initialFormState);
    }
    setErrors({});
  }, [initialValues]);

  const handleChange = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const tempErrors = {};

    // Common validations
    if (!values.firstName?.trim()) tempErrors.firstName = 'First name is required';
    if (!values.lastName?.trim()) tempErrors.lastName = 'Last name is required';
    
    // Email validation (creation only)
    if (!isEditMode) {
      if (!values.email?.trim()) {
        tempErrors.email = 'Email is required';
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
        tempErrors.email = 'Invalid email address format';
      }
      if (!values.joiningDate) tempErrors.joiningDate = 'Joining date is required';
      if (!values.companyId) tempErrors.companyId = 'Company is required';
    }

    if (!values.mobileNumber?.trim()) {
      tempErrors.mobileNumber = 'Mobile number is required';
    } else if (values.mobileNumber.trim().length < 10) {
      tempErrors.mobileNumber = 'Mobile number must be at least 10 digits';
    }

    if (!values.branchId) tempErrors.branchId = 'Branch is required';
    if (!values.roleId) tempErrors.roleId = 'Role is required';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) {
      setTimeout(() => {
        const errorElement = document.querySelector('.Mui-error, [aria-invalid="true"], .text-red-500');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const input = errorElement.querySelector('input, select, textarea');
          if (input && typeof input.focus === 'function') {
            input.focus();
          }
        }
      }, 50);
      return;
    }

    const payload = {
      ...values,
      companyId: Number(values.companyId),
      branchId: Number(values.branchId),
      roleId: Number(values.roleId),
      reportingManagerId: values.reportingManagerId ? Number(values.reportingManagerId) : null
    };

    if (isEditMode) {
      updateUserMutation.mutate({
        id: initialValues.id,
        data: payload
      }, {
        onSuccess: () => {
          onSuccess?.();
        },
        onError: (err) => {
          if (err?.code === 'CONFLICT' && err?.details?.field) {
            setErrors(prev => ({ ...prev, [err.details.field]: err.message }));
          } else if (err?.details && Array.isArray(err.details)) {
            const backendErrors = {};
            err.details.forEach(item => {
              backendErrors[item.field] = item.message;
            });
            setErrors(backendErrors);
          }
        }
      });
    } else {
      createUserMutation.mutate(payload, {
        onSuccess: (data) => {
          onSuccess?.(data);
          setValues(initialFormState);
        },
        onError: (err) => {
          if (err?.code === 'CONFLICT' && err?.details?.field) {
            setErrors(prev => ({ ...prev, [err.details.field]: err.message }));
          } else if (err?.details && Array.isArray(err.details)) {
            const backendErrors = {};
            err.details.forEach(item => {
              backendErrors[item.field] = item.message;
            });
            setErrors(backendErrors);
          }
        }
      });
    }
  };

  return {
    values,
    errors,
    isLoading,
    isEditMode,
    handleChange,
    handleSubmit,
    setValues
  };
};
