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
import SearchInput from '../../../shared/components/elements/SearchInput';
import Pagination from '../../../shared/components/elements/Pagination';
import ExportMenu from '../../../shared/components/elements/ExportMenu';
import PageHeader from '../../../shared/components/modules/PageHeader';

const exportColumns = [
  { header: 'Code', accessorKey: 'code' },
  { header: 'Course Name', accessorKey: 'name' },
  { header: 'Category', accessorKey: 'category' },
  { header: 'Price', accessorKey: 'price' },
  { header: 'Duration', accessorKey: 'duration' },
  { header: 'Status', accessorKey: 'status' }
];

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
    isTogglingStatus,
    sortBy,
    sortOrder,
    toggleSort
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

  // Derived filter state: true ONLY when user actively searches or selects a filter option
  const isFilterApplied = Boolean(search || status || category || (isSuperAdmin && companyId));

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
      <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
        {/* Top Header Card */}
        <PageHeader
          title="Course Management"
          description="Manage academic programs, course modules, pricing, and curriculum."
          icon={BookOpen}
          actions={
            <button onClick={() => refetch()} className="text-slate-400 hover:text-orange-500 transition-colors" title="Refresh">
              <RefreshCw size={15} className={loadingState === 'loading' ? 'animate-spin' : ''} />
            </button>
          }
        />

        {/* ── SEARCH AND FILTERS BAR ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3.5">
          {/* Search & Select Filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
            <div className="w-full sm:w-64">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder="Search..."
                isLoading={loadingState === 'loading'}
              />
            </div>

            {isSuperAdmin && (
              <div className="w-full sm:w-[150px]">
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

            <div className="w-full sm:w-[150px]">
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

            <div className="w-full sm:w-[130px]">
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

            {isFilterApplied && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-all cursor-pointer whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <ExportMenu
              data={courses}
              columns={exportColumns}
              fileName="courses"
            />

            {canCreate && (
              <Button
                onClick={handleOpenCreateForm}
                variant="contained"
                startIcon={<Plus size={16} />}
              >
                Add Course
              </Button>
            )}
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
          hasActiveFilters={isFilterApplied}
          onClearFilters={clearFilters}
          canEdit={canEdit}
          canDelete={canDelete}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={toggleSort}
        />

        {/* Pagination Bar */}
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          isLoading={loadingState === 'loading'}
          entityName="courses"
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
