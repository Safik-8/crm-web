// src/features/users/components/UserFormModal.jsx

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users2 } from 'lucide-react';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import Button from '../../../shared/components/elements/Button';
import { useUserForm } from '../hooks/useUserForm';
import { branchService } from '../../branch/services/branchService';
import { roleApi } from '../../roles/api/roleApi';
import { userService } from '../services/userService';
import { companyService } from '../../company/services/companyService';
import { toast } from '../../../shared/utils/toast';

const UserFormModal = ({
  isOpen,
  onClose,
  initialValues = null,
  companies = [],
  currentUser = null,
  isBranchScoped = false
}) => {
  const handleFormSuccess = () => {
    onClose();
  };

  const {
    values,
    errors,
    isLoading,
    isEditMode,
    handleChange,
    handleSubmit
  } = useUserForm(handleFormSuccess, initialValues);

  // Automatically bind companyId for Company Admin / Branch Manager (non-SuperAdmins)
  useEffect(() => {
    if (!isEditMode && isOpen && currentUser?.companyId) {
      handleChange('companyId', currentUser.companyId);
    }
  }, [currentUser, isEditMode, isOpen, handleChange]);

  // Automatically lock Branch Manager to their branch
  useEffect(() => {
    if (!isEditMode && isOpen && currentUser?.primaryRole === 'BRANCH_MANAGER' && currentUser?.branchId) {
      handleChange('branchId', currentUser.branchId);
    }
  }, [currentUser, isEditMode, isOpen, handleChange]);

  // Fetch Companies (for Super Admin)
  const { data: companiesRes } = useQuery({
    queryKey: ['companies-all-options'],
    queryFn: () => companyService.getCompaniesRaw(),
    enabled: (currentUser?.primaryRoleRank ?? 0) >= 100 && isOpen
  });
  const formCompanies = companies.length > 0
    ? companies
    : (Array.isArray(companiesRes?.data) ? companiesRes.data : []);

  // 1. Fetch Branches for selected company
  const formActorRank = currentUser?.primaryRoleRank ?? 0;
  const formCanSelectCompany = formActorRank >= 100; // rank-based, works for any custom role
  const formCanViewRoles     = formActorRank >= 80;  // rank-based: Company Admin+ can use roleApi
  const targetCompanyId = formCanSelectCompany ? values.companyId : currentUser?.companyId;

  const { data: branchesRes } = useQuery({
    queryKey: ['branches-form-options', targetCompanyId],
    queryFn: () => branchService.getBranchesRaw(targetCompanyId),
    enabled: !!targetCompanyId && isOpen
  });
  const filteredBranches = Array.isArray(branchesRes?.data) ? branchesRes.data : (branchesRes?.data?.branches || []);

  // 2. Fetch Roles for selected company
  // rank >= 80 (Company Admin+): use roleApi (full list, scoped by company)
  // rank < 80 (Branch Manager, BDE, ISE): use getAssignableRoles (no ROLE_PERMISSION required)
  const { data: rolesAdminRes } = useQuery({
    queryKey: ['roles-form-options', targetCompanyId],
    queryFn: () => roleApi.getRoles({ companyId: targetCompanyId, limit: 100 }),
    enabled: !!targetCompanyId && isOpen && formCanViewRoles
  });

  const { data: rolesAssignableRes } = useQuery({
    queryKey: ['assignable-roles-form-options'],
    queryFn: () => userService.getAssignableRoles(),
    enabled: isOpen && !formCanViewRoles
  });

  const filteredRoles = formCanViewRoles
    ? (Array.isArray(rolesAdminRes?.data?.roles) ? rolesAdminRes.data.roles : (Array.isArray(rolesAdminRes?.data) ? rolesAdminRes.data : []))
    : (Array.isArray(rolesAssignableRes?.data?.roles) ? rolesAssignableRes.data.roles : []);

  // 3. Fetch Managers for selected company
  const { data: managersRes } = useQuery({
    queryKey: ['managers-form-options', targetCompanyId],
    queryFn: () => userService.getUsers({ companyId: targetCompanyId, limit: 150, status: 'ACTIVE' }),
    enabled: !!targetCompanyId && isOpen
  });
  const formManagers = Array.isArray(managersRes?.data?.users) ? managersRes.data.users : (Array.isArray(managersRes?.data) ? managersRes.data : []);
  
  // Find rank of selected role
  const selectedRole = filteredRoles.find(r => r.id === Number(values.roleId));
  const selectedRoleRank = selectedRole ? (selectedRole.rank || 0) : 0;

  // Filter managers: Manager's role rank must be strictly higher, and branchId must match (if manager is branch-restricted)
  const filteredManagers = formManagers.filter(m => {
    if (m.id === initialValues?.id) return false;
    if (!values.roleId) return false;
    
    // 1. Rank Check
    const managerRole = m.userRoles?.[0]?.role;
    const managerRank = managerRole ? (managerRole.rank || 0) : 0;
    if (managerRank <= selectedRoleRank) return false;

    // 2. Branch Alignment Check
    // If the manager is tied to a specific branch, it must match the form's branch.
    // If the manager has no branchId (like Company Admin), they are company-wide.
    if (m.branchId && values.branchId && Number(m.branchId) !== Number(values.branchId)) {
      return false;
    }
    
    return true;
  });

  // Automatically reset and notify if selected role rank exceeds current manager's rank
  useEffect(() => {
    if (values.roleId && values.reportingManagerId) {
      const selectedManager = formManagers.find(m => m.id === Number(values.reportingManagerId));
      if (selectedManager) {
        const managerRole = selectedManager.userRoles?.[0]?.role;
        const managerRank = managerRole ? (managerRole.rank || 0) : 0;
        
        if (managerRank <= selectedRoleRank) {
          handleChange('reportingManagerId', '');
          toast.warning('Reporting Manager Reset', {
            description: `The previously assigned manager (${selectedManager.name}) has an authority rank of ${managerRank}, which is not higher than the newly assigned role rank (${selectedRoleRank}).`
          });
        }
      }
    }
  }, [values.roleId, selectedRoleRank, formManagers, values.reportingManagerId, handleChange]);

  // Automatically reset and notify if selected branch mismatches the manager's branch scope
  useEffect(() => {
    if (values.branchId && values.reportingManagerId) {
      const selectedManager = formManagers.find(m => m.id === Number(values.reportingManagerId));
      if (selectedManager && selectedManager.branchId) {
        if (Number(selectedManager.branchId) !== Number(values.branchId)) {
          handleChange('reportingManagerId', '');
          toast.warning('Reporting Manager Reset', {
            description: `The previously assigned manager (${selectedManager.name}) belongs to a different branch and cannot report to the new branch.`
          });
        }
      }
    }
  }, [values.branchId, formManagers, values.reportingManagerId, handleChange]);

  const customFooter = (
    <div className="flex items-center gap-2.5">
      <Button
        type="button"
        variant="text"
        onClick={onClose}
        disabled={isLoading}
        sx={{
          color: '#475569',
          px: 4.5,
          '&:hover': {
            color: '#0F172A',
            bgcolor: 'transparent'
          }
        }}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        loading={isLoading}
        onClick={handleSubmit}
        sx={{ px: 6 }}
      >
        {isEditMode ? 'Update Employee' : 'Onboard Employee'}
      </Button>
    </div>
  );

  return (
    <DynamicFormSlideover
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit User Details' : 'Onboard New Employee'}
      subtitle={isEditMode ? 'Modify employee profile, status, and reporting managers.' : 'Register a new employee, set their role, and assign their branch.'}
      icon={Users2}
      showFooter={true}
      customFooter={customFooter}
    >
      <form onSubmit={handleSubmit} className="space-y-6 pb-6">
        
        {/* Section 1: Personal Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              id="firstName"
              label="First Name"
              placeholder="e.g. John"
              value={values.firstName}
              onChange={(val) => handleChange('firstName', val)}
              errorText={errors.firstName}
              required
            />
            <TextField
              id="lastName"
              label="Last Name"
              placeholder="e.g. Doe"
              value={values.lastName}
              onChange={(val) => handleChange('lastName', val)}
              errorText={errors.lastName}
              required
            />
          </div>
        </div>

        {/* Section 2: Contact Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5">
            Contact Details
          </h3>
          <div className="space-y-4">
            <TextField
              id="email"
              label="Email Address"
              type="email"
              placeholder="e.g. john.doe@stackdot.com"
              value={values.email}
              onChange={(val) => handleChange('email', val)}
              errorText={errors.email}
              disabled={isEditMode}
              required
            />
            <TextField
              id="mobileNumber"
              label="Mobile Number"
              placeholder="e.g. +91 9876543210"
              value={values.mobileNumber}
              onChange={(val) => handleChange('mobileNumber', val)}
              errorText={errors.mobileNumber}
              required
            />
          </div>
        </div>

        {/* Section 3: Organization Mapping */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5">
            Organization Mapping
          </h3>
          <div className="space-y-4">
            {!isEditMode && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  id="employeeId"
                  label="Employee ID"
                  placeholder="e.g. EMP-101 (or auto-generated)"
                  value={values.employeeId}
                  onChange={(val) => handleChange('employeeId', val)}
                  errorText={errors.employeeId}
                />
                <TextField
                  id="joiningDate"
                  label="Joining Date"
                  type="date"
                  value={values.joiningDate}
                  onChange={(val) => handleChange('joiningDate', val)}
                  errorText={errors.joiningDate}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </div>
            )}

            {/* Company selection: locked for edit, only visible to Super Admin for creation */}
            {currentUser?.primaryRole === 'SUPER_ADMIN' ? (
              <SelectField
                id="companyId"
                label="Company"
                value={values.companyId}
                onChange={(val) => {
                  handleChange('companyId', val);
                  handleChange('branchId', ''); // reset branch
                  handleChange('reportingManagerId', ''); // reset manager
                }}
                errorText={errors.companyId}
                options={formCompanies.map(c => ({ value: c.id, label: c.name }))}
                disabled={isEditMode || isBranchScoped}
                required
              />
            ) : null}

            {/* Branch Selection */}
            {currentUser?.primaryRole === 'BRANCH_MANAGER' && !isEditMode ? null : (
              <SelectField
                id="branchId"
                label="Branch"
                value={values.branchId}
                onChange={(val) => handleChange('branchId', val)}
                errorText={errors.branchId}
                options={filteredBranches.map(b => ({ value: b.id, label: b.name }))}
                required
                disabled={!values.companyId || isBranchScoped || (currentUser?.primaryRoleRank ?? 0) < 80}
              />
            )}

            {/* Role Selection */}
            <SelectField
              id="roleId"
              label="Assign Role"
              value={values.roleId}
              onChange={(val) => handleChange('roleId', val)}
              errorText={errors.roleId}
              options={filteredRoles.map(r => ({ value: r.id, label: `${r.name} (Rank ${r.rank})` }))}
              required
              disabled={!values.companyId}
            />
          </div>
        </div>

        {/* Section 4: Reporting Manager */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5">
            Reporting Structure
          </h3>
          <SelectField
            id="reportingManagerId"
            label="Reporting Manager"
            value={values.reportingManagerId}
            onChange={(val) => handleChange('reportingManagerId', val)}
            errorText={errors.reportingManagerId}
            options={
              !values.roleId
                ? [{ value: '', label: 'Please assign a Role first to view eligible managers' }]
                : [
                    { value: '', label: 'None (Direct Report / Head)' },
                    ...filteredManagers.map(m => {
                      const mRole = m.userRoles?.[0]?.role;
                      const roleText = mRole ? ` [${mRole.name} - Rank ${mRole.rank || 0}]` : '';
                      return {
                        value: m.id,
                        label: `${m.name} (${m.email})${roleText}`
                      };
                    })
                  ]
            }
            disabled={!values.companyId || !values.roleId}
          />
        </div>

        {/* Section 5: Profile & Address Detail (Optional) */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5">
            Address & Emergency Contact
          </h3>
          <div className="space-y-4">
            <TextField
              id="address"
              label="Street Address"
              placeholder="e.g. 123 Main St"
              value={values.address}
              onChange={(val) => handleChange('address', val)}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                id="city"
                label="City"
                placeholder="e.g. Mumbai"
                value={values.city}
                onChange={(val) => handleChange('city', val)}
              />
              <TextField
                id="state"
                label="State"
                placeholder="e.g. Maharashtra"
                value={values.state}
                onChange={(val) => handleChange('state', val)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                id="country"
                label="Country"
                placeholder="e.g. India"
                value={values.country}
                onChange={(val) => handleChange('country', val)}
              />
              <TextField
                id="pincode"
                label="Pincode"
                placeholder="e.g. 400001"
                value={values.pincode}
                onChange={(val) => handleChange('pincode', val)}
              />
            </div>
            <TextField
              id="emergencyContact"
              label="Emergency Contact Info"
              placeholder="e.g. Jane Doe - 9876543211"
              value={values.emergencyContact}
              onChange={(val) => handleChange('emergencyContact', val)}
            />
          </div>
        </div>

        {/* Section 6: Status Toggle (Edit Mode Only) */}
        {isEditMode && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5">
              Account Status
            </h3>
            <SelectField
              id="status"
              label="User Status"
              value={values.status}
              onChange={(val) => handleChange('status', val)}
              options={[
                { value: 'ACTIVE', label: 'Active (Full Access)' },
                { value: 'INACTIVE', label: 'Inactive (Login Blocked)' }
              ]}
              required
            />
          </div>
        )}
      </form>
    </DynamicFormSlideover>
  );
};

export default UserFormModal;
