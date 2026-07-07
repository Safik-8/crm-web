// src/features/company/pages/OrganizationSettingsPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import CompanySettingsPage from './CompanySettingsPage';
import CompanyForm from '../components/CompanyForm';
import BranchSettingsPage from '../../branch/pages/BranchSettingsPage';
import GenericPage from '../../../shared/components/templates/GenericPage';
import { Building2, GitBranch, ChevronLeft } from 'lucide-react';
import { Tabs, Tab } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useCompany } from '../hooks/useCompanies';

/**
 * OrganizationSettingsPage
 * Central setting workspace that adapts based on user role permissions:
 * - SUPER_ADMIN: Global company list view
 * - COMPANY_ADMIN: Company Profile & Branches tab panel
 * - BRANCH_MANAGER / BDE / ISE: Scoped branch settings view
 */
const OrganizationSettingsPage = () => {
  const { user, refetchUser, hasPermission } = useAuth();
  const { forceHideLoader } = useLoader();
  const [activeTab, setActiveTab] = useState(0);
  const didHideInitialLoaderRef = useRef(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const queryCompanyId = searchParams.get('companyId');
  const { data: queriedCompany, isLoading: isQueryingCompany } = useCompany(queryCompanyId);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleBackToRegistry = () => {
    setSearchParams({});
  };

  const primaryRole = user?.primaryRole || '';
  const companyId = user?.company?.id || user?.companyId;

  // ── Hide page transition loader ──
  useEffect(() => {
    if (primaryRole && primaryRole !== 'SUPER_ADMIN') {
      forceHideLoader();
      didHideInitialLoaderRef.current = true;
    }
  }, [primaryRole, forceHideLoader]);

  // If a Super Admin is loading a specific company's details, force hide the loader
  useEffect(() => {
    if (primaryRole === 'SUPER_ADMIN' && queryCompanyId && !isQueryingCompany) {
      forceHideLoader();
    }
  }, [primaryRole, queryCompanyId, isQueryingCompany, forceHideLoader]);

  // ── 1. SUPER ADMIN: Master Company Registry View ──
  if (primaryRole === 'SUPER_ADMIN' && !queryCompanyId) {
    return <CompanySettingsPage />;
  }

  // Loader state when drilldown is fetching data
  if (queryCompanyId && isQueryingCompany) {
    return (
      <GenericPage title="Organization Settings" icon={Building2} hideHeader={true}>
        <div className="w-full mt-1 animate-pulse space-y-6">
          <div className="h-8 w-40 bg-slate-100 rounded-xl" />
          <div className="h-24 bg-slate-100 rounded-3xl" />
        </div>
      </GenericPage>
    );
  }

  const canViewBranches = primaryRole === 'COMPANY_ADMIN' || primaryRole === 'SUPER_ADMIN' || hasPermission('BRANCH', 'canView');

  // ── 2. COMPANY ADMIN or custom role with COMPANY permissions: Tabbed Company Profile + Branch Registry View ──
  if (primaryRole === 'COMPANY_ADMIN' || primaryRole === 'SUPER_ADMIN' || hasPermission('COMPANY', 'canView')) {
    return (
      <GenericPage
        title="Organization Settings"
        description="Manage your company's profile details and coordinate branch directories."
        icon={Building2}
        hideHeader={true}
      >
        <div className="w-full mt-1">
          {/* Top navigation tabs spanning full width matching reference image */}
          <div className="border-b border-[#E2E8F0] mb-8">
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="organization settings tabs"
              sx={{
                '& .MuiTabs-scroller': {
                  overflow: 'visible !important',
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '14.5px',
                  fontFamily: '"DM Sans", sans-serif',
                  minWidth: 'auto',
                  px: 1,
                  mr: 4,
                  pb: 1.5,
                  pt: 1,
                  color: '#64748b', // Slate-500
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'color 0.2s ease',
                  minHeight: 'auto',
                  '&:hover': {
                    color: '#0F172A', // Slate-900
                  },
                  '&.Mui-selected': {
                    color: '#F86F03', // Accent Orange
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#F86F03',
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
            >
              <Tab icon={<Building2 size={16} />} iconPosition="start" label="Company Profile" />
              {canViewBranches && <Tab icon={<GitBranch size={16} />} iconPosition="start" label="Branches" />}
            </Tabs>
          </div>

          {queryCompanyId && (
            <button
              onClick={handleBackToRegistry}
              className="flex items-center gap-2 mb-6 text-sm font-bold text-slate-500 hover:text-primary transition-colors focus:outline-none"
            >
              <ChevronLeft size={16} />
              Back to Registry
            </button>
          )}

          {activeTab === 0 && (
            <div className="w-full">
              <CompanyForm
                company={queryCompanyId ? queriedCompany?.data?.company : user.company}
                isEdit={true}
                inlineMode={true}
                onSuccess={queryCompanyId ? undefined : refetchUser}
              />
            </div>
          )}

          {activeTab === 1 && canViewBranches && (
            <div className="w-full">
              <BranchSettingsPage
                overrideCompanyId={queryCompanyId || companyId}
                inlineMode={true}
              />
            </div>
          )}
        </div>
      </GenericPage>
    );
  }

  // ── 3. BRANCH STAFF: Direct Scoped Branch view ──
  return (
    <BranchSettingsPage
      overrideCompanyId={companyId}
      inlineMode={false} // Renders with GenericPage title header directly
    />
  );
};

export default OrganizationSettingsPage;
