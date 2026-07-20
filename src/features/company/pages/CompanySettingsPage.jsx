// src/features/company/pages/CompanySettingsPage.jsx

import React, { useEffect, useRef, useState } from 'react';
import { Building2, Plus, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import Button from '../../../shared/components/elements/Button';
import { useCompanies, useToggleCompanyStatus } from '../hooks/useCompanies';
import CompanyTable from '../components/CompanyTable';
import CompanyFilters from '../components/CompanyFilters';
import CompanyPagination from '../components/CompanyPagination';
import CompanyForm from '../components/CompanyForm';
import GenericPage from '../../../shared/components/templates/GenericPage';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import { toast } from '../../../shared/utils/toast';

const CompanySettingsPage = () => {
  const { permissions } = useAuth();
  const { forceHideLoader } = useLoader();
  const didHideInitialRouteLoaderRef = useRef(false);
  const companyPerms = permissions?.COMPANY || {};

  const {
    companies,
    pagination,
    loadingState,
    errorMessage,
    search,
    status,
    sortBy,
    sortOrder,
    handleSearchChange,
    handleStatusChange,
    handleSortChange,
    setPage,
    refetch,
  } = useCompanies();

  const toggleStatusMutation = useToggleCompanyStatus();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [companyToToggle, setCompanyToToggle] = useState(null);

  const handleAddCompany = () => {
    setSelectedCompany(null);
    setIsFormOpen(true);
  };

  const handleEditCompany = (company) => {
    setSelectedCompany(company);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    refetch();
  };

  const handleClearFilters = () => {
    handleSearchChange('');
    handleStatusChange('');
  };

  const handleToggleStatusClick = (company) => {
    setCompanyToToggle(company);
    setIsToggleOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!companyToToggle) return;

    const isActivating = companyToToggle.status === 'INACTIVE';
    const toastId = toast.loading(`Toggling status for ${companyToToggle.name}...`);

    try {
      await toggleStatusMutation.mutateAsync({
        id: companyToToggle.id,
        currentStatus: companyToToggle.status
      });

      toast.success(`${companyToToggle.name} is now ${isActivating ? 'ACTIVE' : 'INACTIVE'}`, { id: toastId });
      setIsToggleOpen(false);
      setCompanyToToggle(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to toggle company status', { id: toastId });
    }
  };

  const hasActiveFilters = !!(search || status);
  const isLoading = loadingState === 'loading';

  useEffect(() => {
    const hasRenderableData = companies.length > 0;
    const hasRenderableResolvedState =
      loadingState === 'empty' || loadingState === 'error';
    if (
      !didHideInitialRouteLoaderRef.current &&
      (hasRenderableData || hasRenderableResolvedState)
    ) {
      forceHideLoader();
      didHideInitialRouteLoaderRef.current = true;
    }
  }, [companies, loadingState, forceHideLoader]);

  return (
    <GenericPage
      title="Company Setup"
      description="Manage your organization's global identity, branding, and legal entity details."
      icon={Building2}
      hideHeader={true}
    >
      <div className="flex flex-col gap-3 sm:gap-4">

        {/* ── Mobile section header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between lg:hidden bg-white px-3 sm:px-4 py-3 border border-slate-200/60">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
              <Building2 size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-800 font-heading leading-tight">Companies</h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {isLoading ? 'Loading…' : `${pagination.total} total`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
            <button
              onClick={refetch}
              disabled={isLoading}
              className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50 active:scale-95"
              title="Refresh"
            >
              <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            {companyPerms.canCreate && (
              <Button
                onClick={handleAddCompany}
                variant="contained"
                size="small"
                startIcon={<Plus size={15} />}
              >
                Add
              </Button>
            )}
          </div>
        </div>

        {/* ── Desktop section header ─────────────────────────────────────── */}
        <div className="hidden lg:flex lg:items-center lg:justify-between bg-white px-5 py-4 border border-slate-200/60">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center text-primary shrink-0 shadow-sm">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-bold text-slate-800 font-heading leading-tight">Entity Registry</h2>
                <button
                  onClick={refetch}
                  disabled={isLoading}
                  className="text-slate-400 hover:text-primary transition-colors disabled:opacity-50 focus:outline-none"
                  title="Refresh Data"
                >
                  <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
                </button>
              </div>
              {!isLoading && pagination.total > 0 && (
                <p className="text-[13px] text-slate-500 font-medium mt-0.5">
                  {pagination.total} {pagination.total === 1 ? 'company' : 'companies'} total
                </p>
              )}
            </div>
          </div>
          {companyPerms.canCreate && (
            <Button
              onClick={handleAddCompany}
              variant="contained"
              size="medium"
              startIcon={<Plus size={18} />}
              className="group shadow-sm hover:shadow-md transition-all"
            >
              Add Company
            </Button>
          )}
        </div>

        {/* ── Content Container (Matches User Manager Layout) ───────────────── */}
        <div className="bg-white border border-slate-200/60 p-4">

          {/* ── Filters bar ───────────────────────────────────────────────── */}
          <CompanyFilters
            search={search}
            status={status}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            onSortChange={handleSortChange}
            isLoading={isLoading}
          />

          {/* ── Table ─────────────────────────────────────────────────────── */}
          <div className="w-full relative z-10 bg-white">
            <CompanyTable
              companies={companies}
              loadingState={loadingState}
              errorMessage={errorMessage}
              onEdit={handleEditCompany}
              onToggleStatus={handleToggleStatusClick}
              canEdit={companyPerms.canEdit}
              onRetry={refetch}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* ── Pagination ────────────────────────────────────────────────── */}
          <div className="w-full mt-4">
            <CompanyPagination
              pagination={pagination}
              onPageChange={setPage}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* ── Add / Edit drawer ─────────────────────────────────────────── */}
        <CompanyForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          company={selectedCompany}
          onSuccess={handleFormSuccess}
        />

        {/* ── Status Change Confirmation Dialog ─────────────────────────── */}
        <ConfirmModal
          isOpen={isToggleOpen}
          onClose={() => setIsToggleOpen(false)}
          title="Confirm Status Change"
          message={
            <span>
              Are you sure you want to change the status of <strong>{companyToToggle?.name}</strong> to{' '}
              <strong className={companyToToggle?.status === 'ACTIVE' ? 'text-slate-500 font-extrabold' : 'text-emerald-600 font-extrabold'}>
                {companyToToggle?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}
              </strong>?
            </span>
          }
          warningMessage={
            companyToToggle?.status === 'ACTIVE'
              ? 'Warning: Setting this company to Inactive will block access for all associated employees.'
              : undefined
          }
          onConfirm={handleConfirmToggle}
          type={companyToToggle?.status === 'ACTIVE' ? 'error' : 'success'}
          isLoading={toggleStatusMutation.isPending}
        />
      </div>
    </GenericPage>
  );
};

export default CompanySettingsPage;
