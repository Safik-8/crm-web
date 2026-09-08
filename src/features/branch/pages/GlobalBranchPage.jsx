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
        <BranchSettingsPage
            overrideCompanyId={selectedCompanyId}
            onSelectCompany={setSelectedCompanyId}
            companies={companies || []}
            isSuperAdmin={isSuperAdmin}
        />
    );
};

export default GlobalBranchPage;
