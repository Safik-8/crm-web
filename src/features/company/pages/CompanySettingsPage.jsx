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
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions,
  Button as MuiButton 
} from '@mui/material';
import { toast } from 'sonner';

/**
 * CompanySettingsPage
 * Paginated companies listing with search, filter, sort, and full RBAC.
 * Integrated with Axios and TanStack Query.
 */
const CompanySettingsPage = () => {
  const { permissions } = useAuth();
  const { forceHideLoader } = useLoader();
  const didHideInitialRouteLoaderRef = useRef(false);
  const companyPerms = permissions?.COMPANY || {};

  // ── Paginated TanStack data + filter states ──────────────────────────────
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

  // ── Mutation hook for status toggles ──────────────────────────────────────
  const toggleStatusMutation = useToggleCompanyStatus();

  // ── Form slide-over state ────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen]           = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // ── Status toggle modal confirmation state ─────────────────────────────────
  const [isToggleOpen, setIsToggleOpen]       = useState(false);
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

  // Triggered when clicking the power icon in the company table
  const handleToggleStatusClick = (company) => {
    setCompanyToToggle(company);
    setIsToggleOpen(true);
  };

  // Triggered when confirming in the dialog modal
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
              startIcon={<Plus size={18} />}
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
          onToggleStatus={handleToggleStatusClick}
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

        {/* ── Status Change Confirmation Dialog ─────────────────────────── */}
        <Dialog
          open={isToggleOpen}
          onClose={() => setIsToggleOpen(false)}
          aria-labelledby="status-dialog-title"
          aria-describedby="status-dialog-description"
          PaperProps={{
            sx: {
              borderRadius: '20px',
              padding: '8px',
              maxWidth: '440px'
            }
          }}
        >
          <DialogTitle id="status-dialog-title" sx={{ fontWeight: 800, fontSize: '18px', color: '#1e293b', fontHeading: true }}>
            Confirm Status Change
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="status-dialog-description" sx={{ fontSize: '14px', color: '#64748b', fontWeight: 500, lineHeight: 1.6 }}>
              Are you sure you want to change the status of <strong>{companyToToggle?.name}</strong> to{' '}
              <strong className={companyToToggle?.status === 'ACTIVE' ? 'text-slate-500' : 'text-emerald-600'}>
                {companyToToggle?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}
              </strong>?
              {companyToToggle?.status === 'ACTIVE' && (
                <span className="block mt-2 text-xs text-red-500 font-semibold bg-red-50 p-2.5 rounded-xl border border-red-100">
                  Warning: Setting this company to Inactive will block access for all associated employees.
                </span>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <MuiButton
              onClick={() => setIsToggleOpen(false)}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                color: '#64748b',
                px: 3,
                py: 1,
                bgcolor: '#f1f5f9',
                '&:hover': { bgcolor: '#e2e8f0' }
              }}
            >
              Cancel
            </MuiButton>
            <MuiButton
              onClick={handleConfirmToggle}
              variant="contained"
              color={companyToToggle?.status === 'ACTIVE' ? 'error' : 'success'}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                py: 1,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' }
              }}
            >
              Yes, Confirm
            </MuiButton>
          </DialogActions>
        </Dialog>
      </div>
    </GenericPage>
  );
};

export default CompanySettingsPage;
