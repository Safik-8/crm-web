// src/features/company/pages/OrganizationSettingsPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import CompanySettingsPage from './CompanySettingsPage';
import CompanyForm from '../components/CompanyForm';
import BranchSettingsPage from '../../branch/pages/BranchSettingsPage';
import GenericPage from '../../../shared/components/templates/GenericPage';
import { Building2, GitBranch } from 'lucide-react';
import { Tabs, Tab } from '@mui/material';

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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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

  // ── 1. SUPER ADMIN: Master Company Registry View ──
  if (primaryRole === 'SUPER_ADMIN') {
    return <CompanySettingsPage />;
  }

  // ── 2. COMPANY ADMIN or custom role with COMPANY permissions: Tabbed Company Profile + Branch Registry View ──
  if (primaryRole === 'COMPANY_ADMIN' || hasPermission('COMPANY', 'canView')) {
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
              <Tab icon={<GitBranch size={16} />} iconPosition="start" label="Branches" />
            </Tabs>
          </div>

          {activeTab === 0 && (
            <div className="w-full">
              <CompanyForm
                company={user.company}
                isEdit={true}
                inlineMode={true}
                onSuccess={refetchUser}
              />
            </div>
          )}

          {activeTab === 1 && (
            <div className="w-full">
              <BranchSettingsPage
                overrideCompanyId={companyId}
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
