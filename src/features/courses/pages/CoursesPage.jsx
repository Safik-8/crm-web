// src/features/courses/pages/CoursesPage.jsx

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, RefreshCw, Filter, Search } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import { useQuery } from '@tanstack/react-query';

import Button from '../../../shared/components/elements/Button';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import SelectField from '../../../shared/components/elements/SelectField';

import { companyApi } from '../../company/api/companyApi';
import { useCourseList } from '../hooks/useCourseList';
import { useDeleteCourseMutation, useCourseCategoriesQuery } from '../hooks/useCourses';

import CourseListTable from '../components/CourseListTable';
import CourseFormModal from '../components/CourseFormModal';
import CourseDetailModal from '../components/CourseDetailModal';
import CoursePagination from '../components/CoursePagination';

/**
 * CoursesPage Component
 * Main page for the Course / Product Master Module.
 * Displays Course Catalog data with searching, filtering, and CRUD management.
 */
const CoursesPage = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const { forceHideLoader } = useLoader();

  // Modal display states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState(null);

  const [isConfirmStatusOpen, setIsConfirmStatusOpen] = useState(false);
  const [selectedCourseForStatus, setSelectedCourseForStatus] = useState(null);

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedCourseForDelete, setSelectedCourseForDelete] = useState(null);

  // Hook handles listing states (search, status filter, category filter, pagination)
  const {
    courses,
    pagination,
    search,
    status,
    category,
    companyId,
    loadingState,
    errorMessage,
    hasActiveFilters,
    page,
    setPage,
    handleSearchChange,
    handleFilterChange,
    clearFilters,
    refetch,
    handleToggleStatus,
    isTogglingStatus
  } = useCourseList(currentUser);

  const deleteMutation = useDeleteCourseMutation();

  // Force hide page loader on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      forceHideLoader();
    }, 100);
    return () => clearTimeout(timer);
  }, [forceHideLoader]);

  // Enforce RBAC permissions
  const canEdit = hasPermission('COURSE', 'canEdit');
  const canCreate = hasPermission('COURSE', 'canCreate');
  const canDelete = hasPermission('COURSE', 'canDelete');

  // Tenant dropdown list (for Super Admin only)
  const isSuperAdmin = currentUser?.primaryRole === 'SUPER_ADMIN';

  const { data: companiesRes } = useQuery({
    queryKey: ['companies-all-options'],
    queryFn: () => companyApi.getCompanies(),
    enabled: isSuperAdmin
  });
  const companies = Array.isArray(companiesRes?.data) ? companiesRes.data : (companiesRes?.data?.companies || []);

  const targetCompanyId = isSuperAdmin ? companyId : currentUser?.companyId;

  // Retrieve distinct categories currently saved for courses in active company
  const { data: dbCategories = [] } = useCourseCategoriesQuery(targetCompanyId);

  const defaultCategories = [
    'Software Development',
    'Data Science & AI',
    'Cybersecurity',
    'UI/UX Design',
    'Digital Marketing',
    'Business & Management',
    'Cloud Computing'
  ];

  // Merge defaults with unique DB entries using Set
  const categorySet = new Set([...defaultCategories, ...dbCategories]);

  // Map to select options format { value, label } expected by filter inputs
  const categoryOptions = Array.from(categorySet).map((cat) => ({
    value: cat,
    label: cat
  }));

  // ── TRIGGER HANDLERS ────────────────────────────────────────

  const handleOpenCreateForm = () => {
    setSelectedCourseForEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (course) => {
    setSelectedCourseForEdit(course);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (course) => {
    setSelectedCourseForDetails(course);
    setIsDetailsOpen(true);
  };

  const handleOpenToggleStatus = (course) => {
    setSelectedCourseForStatus(course);
    setIsConfirmStatusOpen(true);
  };

  const handleConfirmToggleStatus = () => {
    if (!selectedCourseForStatus) return;
    handleToggleStatus(selectedCourseForStatus.id, selectedCourseForStatus.status);
    setIsConfirmStatusOpen(false);
    setSelectedCourseForStatus(null);
  };

  const handleOpenDelete = (course) => {
    setSelectedCourseForDelete(course);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedCourseForDelete) return;
    deleteMutation.mutate(selectedCourseForDelete.id, {
      onSuccess: () => {
        setIsConfirmDeleteOpen(false);
        setSelectedCourseForDelete(null);
      }
    });
  };

  return (
    <>
      <div className="space-y-4 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pb-8">
        
        {/* Header Actions Panel */}
        <div className="p-4 bg-white border border-slate-200/60 shadow-sm rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Filter size={15} className="text-orange-500" />
              <span>Course Catalog Search & Filters</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => refetch()}
                className="flex items-center gap-1.5 h-9 px-3 text-xs"
                title="Refresh course list"
              >
                <RefreshCw size={14} />
                <span>Refresh</span>
              </Button>

              {canCreate && (
                <Button
                  onClick={handleOpenCreateForm}
                  className="flex items-center gap-1.5 h-9 px-3 text-xs"
                >
                  <Plus size={14} />
                  <span>Add Course</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-3 bg-white border border-slate-200/60 shadow-sm rounded-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            
            {/* Search input field */}
            <div className="relative flex-1 min-w-[240px]">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Search course name or code..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-[13px] font-medium text-slate-800 placeholder-slate-400
                           focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
              />
            </div>

            {/* Select dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              
              {isSuperAdmin && (
                <div className="w-[160px]">
                  <SelectField
                    id="companyFilter"
                    value={companyId}
                    onChange={(val) => handleFilterChange('companyId', val)}
                    options={companies.map(c => ({ value: c.id, label: c.name }))}
                    placeholder="All Companies"
                    allowEmptyOption={true}
                    searchable={true}
                  />
                </div>
              )}

              <div className="w-[160px]">
                <SelectField
                  id="categoryFilter"
                  value={category}
                  onChange={(val) => handleFilterChange('category', val)}
                  options={categoryOptions}
                  placeholder="All Categories"
                  allowEmptyOption={true}
                  searchable={true}
                />
              </div>

              <div className="w-[140px]">
                <SelectField
                  id="statusFilter"
                  value={status}
                  onChange={(val) => handleFilterChange('status', val)}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' }
                  ]}
                  placeholder="All Statuses"
                  allowEmptyOption={true}
                />
              </div>

              {/* Reset trigger */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50/50 hover:bg-orange-50 border border-orange-100/50 rounded-xl transition-all"
                >
                  Clear Filters
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Data Table */}
        <CourseListTable
          courses={courses}
          loadingState={loadingState}
          errorMessage={errorMessage}
          onRetry={() => refetch()}
          onViewDetails={handleOpenDetails}
          onEdit={handleOpenEditForm}
          onToggleStatus={handleOpenToggleStatus}
          onDelete={handleOpenDelete}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          canEdit={canEdit}
          canDelete={canDelete}
        />

        {/* Pagination Bar */}
        <CoursePagination
          pagination={pagination}
          onPageChange={setPage}
          isLoading={loadingState === 'loading'}
        />

        {/* Modals & Slide-overs */}
        
        {/* Form Modal (Create / Edit Slide-over) */}
        <CourseFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialValues={selectedCourseForEdit}
          currentUser={currentUser}
          companies={companies}
        />

        {/* Detail Sheet Sliding Drawer */}
        <CourseDetailModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          course={selectedCourseForDetails}
        />

        {/* Status Confirmation Modal */}
        <ConfirmModal
          isOpen={isConfirmStatusOpen}
          onClose={() => setIsConfirmStatusOpen(false)}
          title={selectedCourseForStatus?.status === 'ACTIVE' ? 'Deactivate Course?' : 'Activate Course?'}
          message={
            selectedCourseForStatus?.status === 'ACTIVE'
              ? `Are you sure you want to deactivate course '${selectedCourseForStatus?.name}'? When deactivated, sales agents cannot assign this course to new leads.`
              : `Are you sure you want to activate course '${selectedCourseForStatus?.name}'? This will allow agents to select it for new lead registrations.`
          }
          type={selectedCourseForStatus?.status === 'ACTIVE' ? 'error' : 'success'}
          onConfirm={handleConfirmToggleStatus}
          confirmText={selectedCourseForStatus?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          isLoading={isTogglingStatus}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => setIsConfirmDeleteOpen(false)}
          title="Delete Course Catalog Entry?"
          message={`Are you sure you want to delete '${selectedCourseForDelete?.name}'? This will remove the course record from standard catalog interfaces.`}
          warningMessage="This is a soft-delete: historical reports, leads, and quotations referencing this course will remain valid and intact."
          type="error"
          onConfirm={handleConfirmDelete}
          confirmText="Delete"
          isLoading={deleteMutation.isPending}
        />

      </div>
    </>
  );
};

export default CoursesPage;
