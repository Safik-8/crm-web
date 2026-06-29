import React, { useEffect, useRef, useState } from 'react';
import { Building2, Plus, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import Button from '../../../shared/components/elements/Button';
import useCompanies from '../hooks/useCompanies';
import CompanyTable from '../components/CompanyTable';
import CompanyFilters from '../components/CompanyFilters';
import CompanyPagination from '../components/CompanyPagination';
import CompanyForm from '../components/CompanyForm';
import GenericPage from '../../../shared/components/templates/GenericPage';

/**
 * CompanySettingsPage
 * Paginated companies listing with search, filter, sort, and full RBAC.
 * Uses GET /api/companies/paginated via the useCompanies hook.
 */
const CompanySettingsPage = () => {
  const { permissions } = useAuth();
  const { forceHideLoader } = useLoader();
  const didHideInitialRouteLoaderRef = useRef(false);
  const companyPerms = permissions?.COMPANY || {};

  // ── Paginated data + filter state (all in one hook) ──────────────────────
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

  // ── Form / drawer state ──────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen]       = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

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
    >
      <div className="flex flex-col gap-3 sm:gap-4">

        {/* ── Mobile section header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between lg:hidden bg-white rounded-2xl px-3 sm:px-4 py-3 border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
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
        <div className="hidden lg:flex lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-heading leading-tight">Entity Registry</h2>
              {!isLoading && pagination.total > 0 && (
                <p className="text-[13px] text-slate-500 font-medium">
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
              startIcon={<Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />}
              sx={{
                px: 5,
                '&:hover .MuiButton-startIcon svg': {
                  transform: 'rotate(90deg)',
                },
                '& .MuiButton-startIcon svg': {
                  transition: 'transform 0.3s ease-in-out',
                }
              }}
              className="group"
            >
              Add Company
            </Button>
          )}
        </div>

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
        <CompanyTable
          companies={companies}
          loadingState={loadingState}
          errorMessage={errorMessage}
          onEdit={handleEditCompany}
          canEdit={companyPerms.canEdit}
          onRetry={refetch}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />

        {/* ── Pagination ────────────────────────────────────────────────── */}
        <CompanyPagination
          pagination={pagination}
          onPageChange={setPage}
          isLoading={isLoading}
        />

        {/* ── Add / Edit drawer ─────────────────────────────────────────── */}
        <CompanyForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          company={selectedCompany}
          onSuccess={handleFormSuccess}
        />
      </div>
    </GenericPage>
  );
};

export default CompanySettingsPage;
