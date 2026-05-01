import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GitBranch, Plus, RefreshCcw, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../app/providers/AuthProvider';
import { branchApi } from '../api/branchApi';
import BranchTable from '../components/BranchTable';
import BranchForm from '../components/BranchForm';
import AssignUserModal from '../components/AssignUserModal';
import GenericPage from '../../../shared/components/templates/GenericPage';

/**
 * BranchSettingsPage
 * Main listing page for branches, scoped to a company via route param.
 * Orchestrates table, drawer, and modal interactions with full RBAC.
 */
const BranchSettingsPage = () => {
    const { companyId } = useParams();
    const navigate = useNavigate();
    const { permissions } = useAuth();

    // Data state
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // Form/Drawer state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);

    // Assign User Modal state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignBranch, setAssignBranch] = useState(null);

    // Derive permissions for the BRANCH module
    const branchPerms = permissions?.BRANCH || {};

    const fetchBranches = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const response = await branchApi.getBranches(companyId);
            if (response && response.success) {
                const data = response.data;
                setBranches(Array.isArray(data?.branches) ? data.branches : []);
            } else {
                toast.error(response?.message || 'Failed to fetch branches');
                setFetchError('Failed to load branch data.');
            }
        } catch (error) {
            console.error('Fetch branches error:', error);
            toast.error(error?.message || 'Connection error to backend');
            setFetchError('Unable to connect. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (companyId) {
            fetchBranches();
        }
    }, [companyId]);

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

    const handleFormSuccess = () => {
        fetchBranches();
    };

    const handleAssignSuccess = () => {
        fetchBranches();
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
                            onClick={fetchBranches}
                            disabled={isLoading}
                            className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50 active:scale-95"
                            title="Refresh"
                        >
                            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        {branchPerms.canCreate && (
                            <button
                                onClick={handleAddBranch}
                                className="flex items-center gap-1.5 h-9 px-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-95"
                            >
                                <Plus size={15} />
                                Add
                            </button>
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
                            onClick={fetchBranches}
                            disabled={isLoading}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200 disabled:opacity-50"
                            title="Refresh Data"
                        >
                            <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <h2 className="text-lg font-bold text-slate-800 font-heading">Hub Directory</h2>
                    </div>
                    {branchPerms.canCreate && (
                        <button
                            onClick={handleAddBranch}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group active:scale-95"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                            Add Branch
                        </button>
                    )}
                </div>

                {/* Error State */}
                {fetchError && !isLoading && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                        <p className="text-red-600 font-bold text-sm">{fetchError}</p>
                        <button
                            onClick={fetchBranches}
                            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Branch Table */}
                {!fetchError && (
                    <BranchTable
                        branches={branches}
                        isLoading={isLoading}
                        onEdit={handleEditBranch}
                        onAssignUser={handleAssignUser}
                        canEdit={branchPerms.canEdit}
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
            </div>
        </GenericPage>
    );
};

export default BranchSettingsPage;
