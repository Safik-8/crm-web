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
            <div className="flex flex-col gap-6">
                {/* Header Actions */}
                <div className="flex flex-col gap-4">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between lg:hidden">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/settings/company')}
                                className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 active:scale-95"
                                title="Back to Company Registry"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={fetchBranches}
                                disabled={isLoading}
                                className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 disabled:opacity-50 active:scale-95"
                                title="Refresh Data"
                            >
                                <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 font-heading">Branches</h2>
                                <p className="text-sm text-slate-500 font-medium">Hub Directory</p>
                            </div>
                        </div>
                        {branchPerms.canCreate && (
                            <button
                                onClick={handleAddBranch}
                                className="h-12 w-12 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                                title="Add Branch"
                            >
                                <Plus size={20} />
                            </button>
                        )}
                    </div>

                    {/* Desktop Header */}
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

                    {/* Mobile Add Button - Full Width */}
                    {branchPerms.canCreate && (
                        <button
                            onClick={handleAddBranch}
                            className="lg:hidden flex items-center justify-center gap-3 py-4 bg-primary text-white rounded-xl text-base font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 w-full"
                        >
                            <Plus size={20} />
                            Add New Branch
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
