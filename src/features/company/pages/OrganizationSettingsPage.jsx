// src/features/company/pages/OrganizationSettingsPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import CompanySettingsPage from './CompanySettingsPage';
import CompanyForm from '../components/CompanyForm';
import BranchSettingsPage from '../../branch/pages/BranchSettingsPage';
import GenericPage from '../../../shared/components/templates/GenericPage';
import { Building2, GitBranch, ChevronLeft, Building, RefreshCcw } from 'lucide-react';
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
  const didHideInitialLoaderRef = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCompanyId = searchParams.get('companyId');
  const tabParam = searchParams.get('tab');
  const activeTab = (tabParam === 'branch' || tabParam === 'branches') ? 1 : 0;
  const { data: queriedCompany, isLoading: isQueryingCompany, refetch: refetchCompany } = useCompany(queryCompanyId);

  const handleTabChange = (newValue) => {
    const newParams = new URLSearchParams(searchParams);
    if (newValue === 1) {
      newParams.set('tab', 'branch');
    } else {
      newParams.delete('tab');
    }
    setSearchParams(newParams);
  };

  const handleBackToRegistry = () => {
    setSearchParams({});
  };

  const handleRefresh = () => {
    if (queryCompanyId) {
      refetchCompany();
    } else {
      refetchUser();
    }
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
  if (primaryRole === 'SUPER_ADMIN' && !queryCompanyId && tabParam !== 'branch' && tabParam !== 'branches') {
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
        <div className="flex flex-col gap-4">
          {/* ── Desktop section header ─────────────────────────────────────── */}
          <div className="hidden lg:flex lg:items-center lg:justify-between bg-white px-5 py-4 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center text-primary shrink-0 shadow-sm">
                <Building2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[17px] font-bold text-slate-800 font-heading leading-tight">Organization Settings</h2>
                  <button
                    onClick={handleRefresh}
                    className="text-slate-400 hover:text-primary transition-colors focus:outline-none"
                    title="Refresh Data"
                  >
                    <RefreshCcw size={14} className={isQueryingCompany ? 'animate-spin' : ''} />
                  </button>
                </div>
                <p className="text-[13px] text-slate-500 font-medium mt-0.5">
                  Manage your company's profile details and coordinate branch directories.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4">
            {/* Top navigation tabs with segmented control styling */}
            <div className="mb-8 flex">
              <div className="inline-flex items-center p-1 bg-slate-100/70 border border-slate-200 rounded-xl shadow-inner">
                <button
                  onClick={() => handleTabChange(0)}
                  className={`flex items-center gap-2 px-6 py-2.5 text-[14px] font-bold font-heading rounded-lg transition-all focus:outline-none ${activeTab === 0
                    ? 'bg-white text-slate-900 shadow-[0_2px_10px_rgb(0,0,0,0.06)] border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'
                    }`}
                >
                  <Building2 size={16} className={activeTab === 0 ? 'text-primary' : 'text-slate-400'} />
                  Company Profile
                </button>
                {canViewBranches && (
                  <button
                    onClick={() => handleTabChange(1)}
                    className={`flex items-center gap-2 px-6 py-2.5 text-[14px] font-bold font-heading rounded-lg transition-all focus:outline-none ${activeTab === 1
                      ? 'bg-white text-slate-900 shadow-[0_2px_10px_rgb(0,0,0,0.06)] border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'
                      }`}
                  >
                    <GitBranch size={16} className={activeTab === 1 ? 'text-primary' : 'text-slate-400'} />
                    Branches
                  </button>
                )}
              </div>
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
