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
import UserFormModal from '../../users/components/UserFormModal';
import BranchFilters from '../components/BranchFilters';
import BranchPagination from '../components/BranchPagination';
import GenericPage from '../../../shared/components/templates/GenericPage';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import PageHeader from '../../../shared/components/modules/PageHeader';

/**
 * BranchSettingsPage
 * Main listing page for branches, scoped to a company via route param.
 * Orchestrates table, drawer, and modal interactions with full RBAC & caching.
 */
const BranchSettingsPage = ({ overrideCompanyId, inlineMode = false }) => {
    const { companyId: routeCompanyId } = useParams();
    const companyId = overrideCompanyId || routeCompanyId;
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
        try {
            await toggleStatusMutation.mutateAsync({
                id: branchToToggle.id,
                currentStatus: branchToToggle.status
            });
            toast.success(
                `Branch "${branchToToggle.name}" has been successfully ${branchToToggle.status === 'ACTIVE' ? 'deactivated' : 'activated'
                }.`
            );
            setIsToggleOpen(false);
            setBranchToToggle(null);
        } catch (error) {
            toast.error(error?.message || 'Failed to update branch status.');
        }
    };

    const handleFormSuccess = () => {
        refetch();
    };

    const handleAssignSuccess = () => {
        refetch();
    };

    const renderContent = () => (
        <div className="flex flex-col gap-3 sm:gap-4">

            {/* ── Mini header for inline mode ── */}
            {inlineMode && (
                <div className="flex items-center justify-between bg-white rounded-2xl px-5 py-3.5 border border-slate-100 shadow-sm mb-2">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm">
                            <GitBranch size={16} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-[15px] font-black text-slate-800 font-heading leading-tight">Hub Registry</h3>
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
                                Add Branch
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Unified Page Header ── */}
            {!inlineMode && (
                <PageHeader
                    title="Hub Directory"
                    description="Manage geographical and functional hubs for the selected company."
                    icon={GitBranch}
                    className="bg-white px-5 py-4 border border-slate-200"
                    actions={
                        <>
                            <button
                                onClick={() => navigate('/settings/organization')}
                                className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-100 rounded-xl transition-all active:scale-95"
                                title="Back to Company Registry"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => refetch()}
                                disabled={isLoading}
                                className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50 active:scale-95"
                                title="Refresh Data"
                            >
                                <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
                            </button>
                            {branchPerms.canCreate && (
                                <Button
                                    onClick={handleAddBranch}
                                    variant="contained"
                                    size="medium"
                                    startIcon={<Plus size={15} />}
                                >
                                    Add Branch
                                </Button>
                            )}
                        </>
                    }
                />
            )}

            <section className=''>
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


            </section>


            {/* Dynamic Slide-over Form */}
            <BranchForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                branch={selectedBranch}
                companyId={companyId}
                onSuccess={handleFormSuccess}
            />

            {/* Assign User Modal */}
            <UserFormModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                initialValues={assignBranch ? { companyId: assignBranch.companyId, branchId: assignBranch.id } : null}
                onSuccess={handleAssignSuccess}
                currentUser={user}
                isBranchScoped={true}
            />

            {/* Status Change Confirmation Dialog */}
            <ConfirmModal
                isOpen={isToggleOpen}
                onClose={() => setIsToggleOpen(false)}
                title="Confirm Status Change"
                message={
                    <span>
                        Are you sure you want to change the status of <strong>{branchToToggle?.name}</strong> to{' '}
                        <strong className={branchToToggle?.status === 'ACTIVE' ? 'text-slate-500 font-extrabold' : 'text-emerald-600 font-extrabold'}>
                            {branchToToggle?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}
                        </strong>?
                    </span>
                }
                warningMessage={
                    branchToToggle?.status === 'ACTIVE'
                        ? 'Warning: Setting this branch to Inactive will block access for all associated employees.'
                        : undefined
                }
                onConfirm={handleConfirmToggle}
                type={branchToToggle?.status === 'ACTIVE' ? 'error' : 'success'}
                isLoading={toggleStatusMutation.isPending}
            />
        </div>
    );

    if (inlineMode) {
        return renderContent();
    }

    return (
        <GenericPage
            title="Branch Registry"
            description="Manage geographical and functional hubs for the selected company."
            icon={GitBranch}
            hideHeader={true}
        >
            {renderContent()}
        </GenericPage>
    );
};

export default BranchSettingsPage;
