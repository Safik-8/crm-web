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
            <div className="flex flex-col gap-3 sm:gap-4">

                {/* ── Mobile section header ── */}
                <div className="flex items-center justify-between lg:hidden bg-white rounded-2xl px-3 sm:px-4 py-3 border border-slate-200/60 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                            <Building2 size={16} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-slate-800 font-heading leading-tight">Companies</h2>
                            <p className="text-[11px] text-slate-500 font-medium">Entity Registry</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
                        <button
                            onClick={fetchCompanies}
                            disabled={isLoading}
                            className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50 active:scale-95"
                            title="Refresh"
                        >
                            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        {companyPerms.canCreate && (
                            <button
                                onClick={handleAddCompany}
                                className="flex items-center gap-1.5 h-9 px-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-95 whitespace-nowrap"
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


