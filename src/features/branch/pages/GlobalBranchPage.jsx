import React, { useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useCompanies } from '../../company/hooks/useCompanies';
import SelectField from '../../../shared/components/elements/SelectField';
import BranchSettingsPage from './BranchSettingsPage';
import { GitBranch } from 'lucide-react';
import PageHeader from '../../../shared/components/modules/PageHeader';
import GenericPage from '../../../shared/components/templates/GenericPage';

const GlobalBranchPage = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.primaryRole === 'SUPER_ADMIN';
    const [selectedCompanyId, setSelectedCompanyId] = useState(isSuperAdmin ? '' : user?.companyId);

    // Fetch companies if super admin
    const { companies } = useCompanies();

    return (
        <GenericPage
            title="Branch Registry"
            description="Manage geographical and functional hubs across companies."
            icon={GitBranch}
            hideHeader={true}
        >
            <div className="space-y-4">
                <PageHeader
                    title="Branch Registry"
                    description="Manage geographical and functional hubs across companies."
                    icon={GitBranch}
                    className="bg-white px-5 py-4 border border-slate-200"
                    actions={
                        isSuperAdmin && (
                            <div className="w-64">
                                <SelectField
                                    value={selectedCompanyId}
                                    onChange={(val) => setSelectedCompanyId(val)}
                                    options={(companies || []).map(c => ({ value: c.id, label: c.name }))}
                                    placeholder="Select a Company..."
                                    allowEmptyOption={true}
                                />
                            </div>
                        )
                    }
                />

                {!selectedCompanyId ? (
                    <div className="bg-white  border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[300px] ">
                        <div className="h-16 w-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
                            <GitBranch size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2 font-heading">No Company Selected</h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                            Please select a company from the dropdown above to view and manage its branches.
                        </p>
                    </div>
                ) : (
                    <BranchSettingsPage overrideCompanyId={selectedCompanyId} inlineMode={true} />
                )}
            </div>
        </GenericPage>
    );
};

export default GlobalBranchPage;
