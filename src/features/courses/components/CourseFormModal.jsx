// src/features/courses/components/CourseFormModal.jsx

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import { SearchableSelect } from '../../../shared/components/elements/SearchableSelect';
import Button from '../../../shared/components/elements/Button';
import { useCourseForm } from '../hooks/useCourseForm';
import { useCourseCategoriesQuery } from '../hooks/useCourses';
import { companyApi } from '../../company/api/companyApi';

/**
 * Slideover modal form component for creating or editing a Course.
 * Follows the dynamic forms/slideover pattern implemented in UserFormModal.
 *
 * @param {boolean} isOpen - Control display state of the modal
 * @param {function} onClose - Closes the modal drawer
 * @param {object|null} initialValues - Current course data if updating
 * @param {object|null} currentUser - Logged in session context
 * @param {Array} companies - Preloaded companies list (optional fallback)
 */
const CourseFormModal = ({
  isOpen,
  onClose,
  initialValues = null,
  currentUser = null,
  companies = []
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
  } = useCourseForm(handleFormSuccess, initialValues, isOpen);

  // Automatically lock companyId for non-Super Admins (Company Admin / Branch Manager)
  useEffect(() => {
    if (!isEditMode && isOpen && currentUser?.companyId && values.companyId !== currentUser.companyId) {
      handleChange('companyId', currentUser.companyId);
    }
  }, [currentUser, isEditMode, isOpen, handleChange, values.companyId]);

  // Fetch all companies to populate dropdown (only if currentUser is Super Admin)
  const isSuperAdmin = currentUser?.primaryRole === 'SUPER_ADMIN';
  
  const { data: companiesRes } = useQuery({
    queryKey: ['companies-all-options'],
    queryFn: () => companyApi.getCompanies(),
    enabled: isSuperAdmin && isOpen
  });

  const formCompanies = companies.length > 0
    ? companies
    : (Array.isArray(companiesRes?.data) ? companiesRes.data : (Array.isArray(companiesRes) ? companiesRes : []));

  const companyOptions = formCompanies.map((c) => ({
    id: String(c.id),
    name: c.name
  }));

  const targetCompanyId = isSuperAdmin ? values.companyId : currentUser?.companyId;

  // Fetch unique categories currently stored in database for the active companyId
  const { data: dbCategories = [] } = useCourseCategoriesQuery(targetCompanyId);

  // Standard category options to seed the select field
  const defaultCategories = [
    'Software Development',
    'Data Science & AI',
    'Cybersecurity',
    'UI/UX Design',
    'Digital Marketing',
    'Business & Management',
    'Cloud Computing'
  ];

  // Combine default categories with database custom categories
  const categorySet = new Set([...defaultCategories, ...dbCategories]);
  
  // Format to { id, name } mapping expected by SearchableSelect
  const categoryOptions = Array.from(categorySet).map((cat) => ({
    id: cat,
    name: cat
  }));

  // Append 'OTHER' option to input custom categories
  categoryOptions.push({
    id: 'OTHER',
    name: 'Other (Create Custom Category...)'
  });

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
        sx={{
          bgcolor: '#F86F03',
          color: '#FFFFFF',
          px: 5,
          fontWeight: 600,
          '&:hover': {
            bgcolor: '#E05D02'
          }
        }}
      >
        {isEditMode ? 'Save Changes' : 'Create Course'}
      </Button>
    </div>
  );

  return (
    <DynamicFormSlideover
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={isEditMode ? 'Edit Course Catalog' : 'Add New Course'}
      description={isEditMode ? 'Modify details of the selected course.' : 'Add a new training course to the system catalog.'}
      icon={BookOpen}
      customFooter={customFooter}
    >
      <div className="space-y-6">
        
        {/* SECTION 1: Tenant Assignment (Super Admin view only) */}
        {isSuperAdmin && !isEditMode && (
          <div className="border-b border-slate-100 pb-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Tenant Assignment
            </h3>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-[#475569] mb-1 ml-0.5">
                Assign to Company <span style={{ color: '#F86F03', fontWeight: 'bold' }}>*</span>
              </label>
              <SearchableSelect
                options={companyOptions}
                value={values.companyId}
                onChange={(val) => handleChange('companyId', val ? Number(val) : '')}
                placeholder="Select Assign to Company..."
                hasError={!!errors.companyId}
              />
              {errors.companyId && (
                <p className="mx-1 mt-1 text-[11px] font-medium text-red-500">{errors.companyId}</p>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: Course Information */}
        <div className="border-b border-slate-100 pb-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Course Information
          </h3>
          <div className="space-y-4">
            <TextField
              id="name"
              label="Course Name"
              placeholder="e.g. Full Stack Web Development"
              value={values.name}
              onChange={(val) => handleChange('name', val)}
              errorText={errors.name}
              required
            />
            
            {/* Display code as read-only field only when editing */}
            {isEditMode && (
              <TextField
                id="code"
                label="Course Code"
                value={values.code}
                disabled
              />
            )}

            <TextField
              id="description"
              label="Description"
              placeholder="Enter brief description of course topics, target audience..."
              value={values.description}
              onChange={(val) => handleChange('description', val)}
              errorText={errors.description}
              multiline
              rows={3}
            />
          </div>
        </div>

        {/* SECTION 3: Categorization & Logistics */}
        <div className="border-b border-slate-100 pb-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Categorization & Pricing
          </h3>
          <div className="grid grid-cols-1 gap-4">
            
            {/* Searchable Select Dropdown for Categories */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-[#475569] mb-1 ml-0.5">
                Primary Category <span style={{ color: '#F86F03', fontWeight: 'bold' }}>*</span>
              </label>
              <SearchableSelect
                options={categoryOptions}
                value={values.category}
                onChange={(val) => handleChange('category', val)}
                placeholder="Select category..."
                hasError={!!errors.category}
              />
              {errors.category && (
                <p className="mx-1 mt-1 text-[11px] font-medium text-red-500">{errors.category}</p>
              )}
            </div>

            {/* Custom Category text input if "Other" was selected */}
            {values.category === 'OTHER' && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <TextField
                  id="customCategory"
                  label="New Category Name"
                  placeholder="e.g. Mobile App Development"
                  value={values.customCategory}
                  onChange={(val) => handleChange('customCategory', val)}
                  errorText={errors.customCategory}
                  required
                />
              </div>
            )}

            <TextField
              id="parentCategory"
              label="Sub/Parent Category"
              placeholder="e.g. JavaScript Frameworks"
              value={values.parentCategory || ''}
              onChange={(val) => handleChange('parentCategory', val)}
              errorText={errors.parentCategory}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <TextField
              id="price"
              label="Price (INR)"
              type="number"
              placeholder="0.00"
              value={values.price}
              onChange={(val) => handleChange('price', val)}
              errorText={errors.price}
              required
            />
            <TextField
              id="duration"
              label="Duration (Months)"
              type="number"
              placeholder="e.g. 6"
              value={values.duration || ''}
              onChange={(val) => handleChange('duration', val)}
              errorText={errors.duration}
            />
          </div>
        </div>

        {/* SECTION 4: Status Configuration (Edit Mode Only) */}
        {isEditMode && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Availability Status
            </h3>
            <SelectField
              id="status"
              label="Catalog Status"
              value={values.status}
              onChange={(val) => handleChange('status', val)}
              errorText={errors.status}
              required
              options={[
                { label: 'Active (Available for sales)', value: 'ACTIVE' },
                { label: 'Inactive (Archived / Unavailable)', value: 'INACTIVE' }
              ]}
            />
          </div>
        )}

      </div>
    </DynamicFormSlideover>
  );
};

export default CourseFormModal;
