// src/features/branch/pages/BranchSettingsPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GitBranch, Plus, RefreshCcw, ChevronLeft } from 'lucide-react';
import { toast } from '../../../shared/utils/toast';
import Button from '../../../shared/components/elements/Button';
import SelectField from '../../../shared/components/elements/SelectField';
import SearchInput from '../../../shared/components/elements/SearchInput';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import { useBranches, useToggleBranchStatus } from '../hooks/useBranches';
import BranchTable from '../components/BranchTable';
import BranchForm from '../components/BranchForm';
import UserFormModal from '../../users/components/UserFormModal';
import BranchPagination from '../components/BranchPagination';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import PageHeader from '../../../shared/components/modules/PageHeader';

/**
 * BranchSettingsPage
 * Main listing page for branches, scoped to a company via route param.
 * Orchestrates table, drawer, and modal interactions with full RBAC & caching.
 */
const BranchSettingsPage = ({ overrideCompanyId, onSelectCompany, companies = [], isSuperAdmin: isSuperAdminProp }) => {
    const { companyId: routeCompanyId } = useParams();
    const companyId = overrideCompanyId || routeCompanyId;
    const navigate = useNavigate();
    const { permissions, user } = useAuth();
    const { forceHideLoader } = useLoader();
    const didHideInitialRouteLoaderRef = useRef(false);

    const isSuperAdmin = isSuperAdminProp ?? (user?.primaryRole === 'SUPER_ADMIN');

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
        clearFilters,
        hasActiveFilters,
        setPage,
        refetch
    } = useBranches(companyId);

    const toggleStatusMutation = useToggleBranchStatus();

    const isLoading = loadingState === 'loading';
    const hasError = loadingState === 'error';

    // ── Scope Redirection Guard ──
    useEffect(() => {
        if (user && user.primaryRole !== 'SUPER_ADMIN' && companyId) {
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

    return (
        <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
            {/* Header Title Section */}
            <PageHeader
                title="Branch Registry"
                description="Manage geographical and functional hubs across companies"
                icon={GitBranch}
                actions={
                    <button
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="text-slate-400 hover:text-orange-500 transition-colors focus:outline-none"
                        title="Refresh Data"
                    >
                        <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                }
            />

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3.5">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
                    {/* Search Input */}
                    <div className="w-full sm:w-64">
                        <SearchInput
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Search..."
                            isLoading={isLoading}
                        />
                    </div>

                    {/* Company Filter (Super Admin only) */}
                    {isSuperAdmin && companies.length > 0 && (
                        <div className="w-full sm:w-52">
                            <SelectField
                                value={companyId}
                                onChange={(val) => onSelectCompany ? onSelectCompany(val) : null}
                                options={companies.map(c => ({ value: c.id, label: c.name }))}
                                placeholder="All Companies"
                                allowEmptyOption={true}
                                searchable
                            />
                        </div>
                    )}

                    {/* Status Filter */}
                    <div className="w-full sm:w-36">
                        <SelectField
                            id="branch-status-filter"
                            value={status}
                            onChange={handleStatusChange}
                            disabled={isLoading}
                            placeholder="All Statuses"
                            allowEmptyOption={true}
                            options={[
                                { value: 'ACTIVE', label: 'Active' },
                                { value: 'INACTIVE', label: 'Inactive' }
                            ]}
                        />
                    </div>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Create Action Button */}
                {branchPerms.canCreate && (
                    <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                        <Button
                            onClick={handleAddBranch}
                            variant="contained"
                            size="medium"
                            startIcon={<Plus size={18} />}
                            className="group shadow-sm hover:shadow-md transition-all whitespace-nowrap"
                        >
                            Add Branch
                        </Button>
                    </div>
                )}
            </div>

            {/* Error State */}
            {hasError && (
                <div className="bg-red-50 border border-red-100 p-6 text-center">
                    <p className="text-red-600 font-bold text-sm">{errorMessage || 'Failed to load branch data.'}</p>
                    <button
                        onClick={() => refetch()}
                        className="mt-3 px-4 py-2 bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all cursor-pointer"
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
};

export default BranchSettingsPage;
