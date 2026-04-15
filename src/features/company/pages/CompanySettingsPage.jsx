import React, { useState, useEffect } from 'react';
import { Building2, Plus, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { companyApi } from '../api/companyApi';
import CompanyTable from '../components/CompanyTable';
import CompanyForm from '../components/CompanyForm';
import GenericPage from '../../../shared/components/templates/GenericPage';
import { toast, enhancedToast } from '../../../shared/utils/toast';

/**
 * CompanySettingsPage
 * Main listing page for companies with integrated RBAC and premium UI.
 */
const CompanySettingsPage = () => {
    const { permissions } = useAuth();

    // Data state
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form/Drawer state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);

    // Derive permissions for the COMPANY module
    const companyPerms = permissions?.COMPANY || {};

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            const response = await companyApi.getCompanies();
            if (response && response.success) {
                setCompanies(Array.isArray(response.data) ? response.data : []);
            } else {
                enhancedToast.operationError('fetch', 'companies', response?.message);
            }
        } catch (error) {
            console.error('Fetch companies error:', error);
            if (error?.statusCode >= 500) {
                enhancedToast.networkError();
            } else {
                enhancedToast.operationError('fetch', 'companies', error?.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleAddCompany = () => {
        setSelectedCompany(null);
        setIsFormOpen(true);
    };

    const handleEditCompany = (company) => {
        setSelectedCompany(company);
        setIsFormOpen(true);
    };

    const handleFormSuccess = () => {
        fetchCompanies();
    };

    return (
        <GenericPage
            title="Company Setup"
            description="Manage your organization's global identity, branding, and legal entity details."
            icon={Building2}
        >
            <div className="flex flex-col gap-6">
                {/* Header Actions */}
                <div className="flex flex-col gap-4">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between lg:hidden">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchCompanies}
                                disabled={isLoading}
                                className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 disabled:opacity-50 active:scale-95"
                                title="Refresh Data"
                            >
                                <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 font-heading">Companies</h2>
                                <p className="text-sm text-slate-500 font-medium">Entity Registry</p>
                            </div>
                        </div>
                        {companyPerms.canCreate && (
                            <button
                                onClick={handleAddCompany}
                                className="h-12 w-12 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                                title="Add Company"
                            >
                                <Plus size={20} />
                            </button>
                        )}
                    </div>

                    {/* Desktop Header */}
                    <div className="hidden lg:flex lg:items-center lg:justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchCompanies}
                                disabled={isLoading}
                                className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200 disabled:opacity-50"
                                title="Refresh Data"
                            >
                                <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
                            </button>
                            <h2 className="text-lg font-bold text-slate-800 font-heading">Entity Registry</h2>
                        </div>

                        {companyPerms.canCreate && (
                            <button
                                onClick={handleAddCompany}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group active:scale-95"
                            >
                                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                                Add Company
                            </button>
                        )}
                    </div>

                    {/* Mobile Add Button - Full Width */}
                    {companyPerms.canCreate && (
                        <button
                            onClick={handleAddCompany}
                            className="lg:hidden flex items-center justify-center gap-3 py-4 bg-primary text-white rounded-xl text-base font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 w-full"
                        >
                            <Plus size={20} />
                            Add New Company
                        </button>
                    )}
                </div>

                {/* Company Table */}
                <CompanyTable
                    companies={companies}
                    isLoading={isLoading}
                    onEdit={handleEditCompany}
                    canEdit={companyPerms.canEdit}
                />

                {/* Dynamic Slide-over Form */}
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


