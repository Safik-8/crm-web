// src/features/branch/pages/BranchSettingsPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GitBranch, Plus, RefreshCcw, ChevronLeft } from 'lucide-react';
import { toast } from '../../../shared/utils/toast';
import Button from '../../../shared/components/elements/Button';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import { useBranches, useToggleBranchStatus } from '../hooks/useBranches';
import BranchTable from '../components/BranchTable';
import BranchForm from '../components/BranchForm';
import AssignUserModal from '../components/AssignUserModal';
import BranchFilters from '../components/BranchFilters';
import BranchPagination from '../components/BranchPagination';
import GenericPage from '../../../shared/components/templates/GenericPage';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button as MuiButton
} from '@mui/material';

/**
 * BranchSettingsPage
 * Main listing page for branches, scoped to a company via route param.
 * Orchestrates table, drawer, and modal interactions with full RBAC & caching.
 */
const BranchSettingsPage = () => {
    const { companyId } = useParams();
    const navigate = useNavigate();
    const { permissions, user } = useAuth();
    const { forceHideLoader } = useLoader();
    const didHideInitialRouteLoaderRef = useRef(false);

    // Form/Drawer state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);

    // Assign User Modal state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignBranch, setAssignBranch] = useState(null);

    // Status Confirmation Dialog state
    const [isToggleOpen, setIsToggleOpen] = useState(false);
    const [branchToToggle, setBranchToToggle] = useState(null);

    // Derive permissions for the BRANCH module
    const branchPerms = permissions?.BRANCH || {};

    // TanStack Query list state
    const {
        branches,
        pagination,
        loadingState,
        errorMessage,
        search,
        status,
        handleSearchChange,
        handleStatusChange,
        setPage,
        refetch
    } = useBranches(companyId);

    const toggleStatusMutation = useToggleBranchStatus();

    const isLoading = loadingState === 'loading';
    const hasError = loadingState === 'error';

    // ── Scope Redirection Guard ──
    useEffect(() => {
        if (user && user.primaryRole !== 'SUPER_ADMIN') {
            const userCompanyId = user.company?.id || user.companyId;
            if (Number(companyId) !== userCompanyId) {
                // Instantly redirect to their own company's branches page
                navigate(`/companies/${userCompanyId}/branches`, { replace: true });
            }
        }
    }, [companyId, user, navigate]);

    // ── Hide initial full-page loader ──
    useEffect(() => {
        const hasRenderableData = branches.length > 0;
        const hasRenderableResolvedState = !isLoading && (branches.length === 0 || hasError);
        if (
            !didHideInitialRouteLoaderRef.current &&
            (hasRenderableData || hasRenderableResolvedState)
        ) {
            forceHideLoader();
            didHideInitialRouteLoaderRef.current = true;
        }
    }, [branches, isLoading, hasError, forceHideLoader]);

    const handleAddBranch = () => {
        setSelectedBranch(null);
        setIsFormOpen(true);
    };

    const handleEditBranch = (branch) => {
        setSelectedBranch(branch);
        setIsFormOpen(true);
    };

    const handleAssignUser = (branch) => {
        setAssignBranch(branch);
        setIsAssignModalOpen(true);
    };

    const handleToggleStatusClick = (branch) => {
        setBranchToToggle(branch);
        setIsToggleOpen(true);
    };

    const handleConfirmToggle = async () => {
        if (!branchToToggle) return;
        setIsToggleOpen(false);
        const loadingToastId = toast.loading('Updating branch operational status...');

        try {
            await toggleStatusMutation.mutateAsync({
                id: branchToToggle.id,
                currentStatus: branchToToggle.status
            });
            toast.dismiss(loadingToastId);
            toast.success(
                `Branch "${branchToToggle.name}" has been successfully ${
                    branchToToggle.status === 'ACTIVE' ? 'deactivated' : 'activated'
                }.`
            );
        } catch (error) {
            toast.dismiss(loadingToastId);
            toast.error(error?.message || 'Failed to update branch status.');
        }
    };

    const handleFormSuccess = () => {
        refetch();
    };

    const handleAssignSuccess = () => {
        refetch();
    };

    return (
        <GenericPage
            title="Branch Registry"
            description="Manage geographical and functional hubs for the selected company."
            icon={GitBranch}
        >
            <div className="flex flex-col gap-3 sm:gap-4">

                {/* ── Mobile section header ── */}
                <div className="flex items-center justify-between lg:hidden bg-white rounded-2xl px-4 py-3 border border-slate-200/60 shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => navigate('/settings/company')}
                            className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all active:scale-95"
                            title="Back to Company Registry"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            <GitBranch size={15} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 font-heading leading-tight">Branches</h2>
                            <p className="text-[11px] text-slate-500 font-medium">Hub Directory</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => refetch()}
                            disabled={isLoading}
                            className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50 active:scale-95"
                            title="Refresh"
                        >
                            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        {branchPerms.canCreate && (
                            <Button
                                onClick={handleAddBranch}
                                variant="contained"
                                size="small"
                                startIcon={<Plus size={15} />}
                            >
                                Add
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Desktop section header ── */}
                <div className="hidden lg:flex lg:items-center lg:justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/settings/company')}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200"
                            title="Back to Company Registry"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => refetch()}
                            disabled={isLoading}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200 disabled:opacity-50"
                            title="Refresh Data"
                        >
                            <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <h2 className="text-lg font-bold text-slate-800 font-heading">Hub Directory</h2>
                    </div>
                    {branchPerms.canCreate && (
                        <Button
                            onClick={handleAddBranch}
                            variant="contained"
                            size="medium"
                            startIcon={<Plus size={18} />}
                            className="group"
                        >
                            Add Branch
                        </Button>
                    )}
                </div>

                {/* ── Filters bar ── */}
                <BranchFilters
                    search={search}
                    status={status}
                    onSearchChange={handleSearchChange}
                    onStatusChange={handleStatusChange}
                    isLoading={isLoading}
                />

                {/* Error State */}
                {hasError && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                        <p className="text-red-600 font-bold text-sm">{errorMessage || 'Failed to load branch data.'}</p>
                        <button
                            onClick={() => refetch()}
                            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Branch Table */}
                {!hasError && (
                    <BranchTable
                        branches={branches}
                        isLoading={isLoading}
                        onEdit={handleEditBranch}
                        onToggleStatus={handleToggleStatusClick}
                        onAssignUser={handleAssignUser}
                        canEdit={branchPerms.canEdit}
                    />
                )}

                {/* Pagination */}
                {!hasError && (
                    <BranchPagination
                        pagination={pagination}
                        onPageChange={setPage}
                        isLoading={isLoading}
                    />
                )}

                {/* Dynamic Slide-over Form */}
                <BranchForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    branch={selectedBranch}
                    companyId={companyId}
                    onSuccess={handleFormSuccess}
                />

                {/* Assign User Modal */}
                <AssignUserModal
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    branch={assignBranch}
                    onSuccess={handleAssignSuccess}
                />

                {/* Status Change Confirmation Dialog */}
                <Dialog
                    open={isToggleOpen}
                    onClose={() => setIsToggleOpen(false)}
                    aria-labelledby="branch-status-dialog-title"
                    aria-describedby="branch-status-dialog-description"
                    PaperProps={{
                        sx: {
                            borderRadius: '20px',
                            padding: '8px',
                            maxWidth: '440px'
                        }
                    }}
                >
                    <DialogTitle id="branch-status-dialog-title" sx={{ fontWeight: 800, fontSize: '18px', color: '#1e293b', fontHeading: true }}>
                        Confirm Status Change
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="branch-status-dialog-description" sx={{ fontSize: '14px', color: '#64748b', fontWeight: 500, lineHeight: 1.6 }}>
                            Are you sure you want to change the status of <strong>{branchToToggle?.name}</strong> to{' '}
                            <strong className={branchToToggle?.status === 'ACTIVE' ? 'text-slate-500' : 'text-emerald-600'}>
                                {branchToToggle?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}
                            </strong>?
                            {branchToToggle?.status === 'ACTIVE' && (
                                <span className="block mt-2 text-xs text-red-500 font-semibold bg-red-50 p-2.5 rounded-xl border border-red-100">
                                    Warning: Setting this branch to Inactive will block access for all associated employees.
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
                            color={branchToToggle?.status === 'ACTIVE' ? 'error' : 'success'}
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

export default BranchSettingsPage;
