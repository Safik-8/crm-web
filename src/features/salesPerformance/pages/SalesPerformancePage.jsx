// crm-web/src/features/salesPerformance/pages/SalesPerformancePage.jsx

import React, { useState } from 'react';
import { Award, UserCheck, PhoneCall, Users, Building2, Building, TrendingUp, Download, Sparkles, FileSpreadsheet, FileText, Printer, ChevronDown } from 'lucide-react';
import PerformanceFilterBar from '../components/PerformanceFilterBar';
import PerformanceRankingCard from '../components/PerformanceRankingCard';
import PerformanceSummaryCards from '../components/PerformanceSummaryCards';
import PerformanceAnalyticsCharts from '../components/PerformanceAnalyticsCharts';
import BDEPerformanceTable from '../components/BDEPerformanceTable';
import ISEPerformanceTable from '../components/ISEPerformanceTable';
import TeamPerformanceTable from '../components/TeamPerformanceTable';
import BranchPerformanceTable from '../components/BranchPerformanceTable';

import {
  useBDEPerformance,
  useISEPerformance,
  useTeamPerformance,
  useBranchPerformance,
  usePerformanceRankings
} from '../hooks/useSalesPerformance';

import { useQuery } from '@tanstack/react-query';
import axiosClient from '../../../api/axiosClient';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useExport } from '../../../shared/hooks/useExport';

export default function SalesPerformancePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bde');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const { exportCSV, exportExcel, exportPDFFromData, isExporting } = useExport();

  // Role Scoping Matrix Identification
  const primaryRole = user?.primaryRole || '';
  const primaryRoleRank = user?.primaryRoleRank ?? 0;

  const isSuperAdmin = primaryRole === 'SUPER_ADMIN' || primaryRoleRank >= 100;
  const isCompanyAdmin = primaryRole === 'COMPANY_ADMIN' || primaryRoleRank === 80;
  const isBranchManager = primaryRole === 'BRANCH_MANAGER' || primaryRoleRank === 60;
  const isBdeOrIse = !isSuperAdmin && !isCompanyAdmin && !isBranchManager;

  const userRoleInfo = { isSuperAdmin, isCompanyAdmin, isBranchManager, isBdeOrIse };

  const [filters, setFilters] = useState({
    rankingPeriod: 'MONTHLY',
    companyId: '',
    branchId: '',
    teamId: '',
    startDate: '',
    endDate: ''
  });

  // Super Admin must select a company first before analytics queries execute
  const isQueryEnabled = !isSuperAdmin || Boolean(filters.companyId);

  // Fetch Companies (SUPER ADMIN ONLY)
  const { data: companies = [] } = useQuery({
    queryKey: ['sales-perf-companies'],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const res = await axiosClient.get('/companies');
      const data = res?.data?.companies || res?.data || [];
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch Branches for filter options
  const { data: branches = [] } = useQuery({
    queryKey: ['sales-perf-branches', filters.companyId],
    enabled: (isSuperAdmin && Boolean(filters.companyId)) || isCompanyAdmin,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.companyId) params.append('company_id', filters.companyId);
      const str = params.toString();
      const res = await axiosClient.get(`/branches${str ? '?' + str : ''}`);
      const data = res?.data?.branches || res?.data || [];
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch Teams for filter options (ALL ROLES)
  const { data: teams = [] } = useQuery({
    queryKey: ['sales-perf-teams', filters.companyId, filters.branchId],
    enabled: (isSuperAdmin && Boolean(filters.companyId)) || !isSuperAdmin,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.companyId) params.append('companyId', filters.companyId);
      if (filters.branchId) params.append('branchId', filters.branchId);
      const str = params.toString();
      const res = await axiosClient.get(`/teams${str ? '?' + str : ''}`);
      const data = res?.data?.teams || res?.data || [];
      return Array.isArray(data) ? data : [];
    }
  });

  // Data hooks based on current active tab & filters
  const bdeQuery = useBDEPerformance(filters, { enabled: isQueryEnabled });
  const iseQuery = useISEPerformance(filters, { enabled: isQueryEnabled });
  const teamQuery = useTeamPerformance(filters, { enabled: isQueryEnabled });
  const branchQuery = useBranchPerformance(filters, { enabled: isQueryEnabled });
  const rankingsQuery = usePerformanceRankings(filters, { enabled: isQueryEnabled });

  // Cascading Filter Reset Handler
  const handleFilterChange = (key, val) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: val };
      if (key === 'companyId') {
        updated.branchId = '';
        updated.teamId = '';
      } else if (key === 'branchId') {
        updated.teamId = '';
      }
      return updated;
    });
  };

  const handleResetFilters = () => {
    setFilters({
      rankingPeriod: 'MONTHLY',
      companyId: '',
      branchId: '',
      teamId: '',
      startDate: '',
      endDate: ''
    });
  };

  const topBDEs = rankingsQuery.data?.data?.topBDEs || rankingsQuery.data?.topBDEs || [];
  const topTeams = rankingsQuery.data?.data?.topTeams || rankingsQuery.data?.topTeams || [];

  const handleExport = async (type = 'excel') => {
    setIsExportMenuOpen(false);
    let currentDataSet = [];
    let columns = [];
    let fileName = 'sales_performance';
    let reportTitle = 'Sales Performance Analytics';

    if (activeTab === 'bde') {
      currentDataSet = bdeQuery.data?.data || [];
      fileName = 'bde_performance_report';
      reportTitle = 'BDE Performance Report';
      columns = [
        { header: 'Rank', accessorKey: 'rank' },
        { header: 'Employee Code', accessorKey: 'employeeCode' },
        { header: 'Name', accessorKey: 'name' },
        { header: 'Branch', accessorKey: 'branchName' },
        { header: 'Assigned Leads', accessorKey: 'leadsAssigned' },
        { header: 'Qualified Leads', accessorKey: 'qualifiedLeads' },
        { header: 'Opportunities', accessorKey: 'opportunitiesCreated' },
        { header: 'Deals Won', accessorKey: 'dealsWon' },
        { header: 'Total Revenue (INR)', accessorKey: 'totalRevenue' },
        { header: 'Conversion Rate %', accessorKey: 'conversionRate' },
        { header: 'Performance Score', accessorKey: 'performanceScore' }
      ];
    } else if (activeTab === 'ise') {
      currentDataSet = iseQuery.data?.data || [];
      fileName = 'ise_activity_report';
      reportTitle = 'ISE Activity Report';
      columns = [
        { header: 'Rank', accessorKey: 'rank' },
        { header: 'Employee Code', accessorKey: 'employeeCode' },
        { header: 'Name', accessorKey: 'name' },
        { header: 'Branch', accessorKey: 'branchName' },
        { header: 'Calls Completed', accessorKey: 'callsCompleted' },
        { header: 'Followups Completed', accessorKey: 'followupsCompleted' },
        { header: 'Meetings Scheduled', accessorKey: 'meetingsScheduled' },
        { header: 'Assigned Leads', accessorKey: 'assignedLeads' },
        { header: 'Qualified Leads', accessorKey: 'qualifiedLeads' },
        { header: 'Conversion Rate %', accessorKey: 'conversionRate' },
        { header: 'Performance Score', accessorKey: 'performanceScore' }
      ];
    } else if (activeTab === 'team') {
      currentDataSet = teamQuery.data?.data || [];
      fileName = 'team_rankings_report';
      reportTitle = 'Team Rankings Report';
      columns = [
        { header: 'Rank', accessorKey: 'rank' },
        { header: 'Team Code', accessorKey: 'teamCode' },
        { header: 'Team Name', accessorKey: 'teamName' },
        { header: 'Branch', accessorKey: 'branchName' },
        { header: 'Team Leader', accessorKey: 'bdeName' },
        { header: 'Member Count', accessorKey: 'memberCount' },
        { header: 'Total Leads', accessorKey: 'totalLeads' },
        { header: 'Opportunities', accessorKey: 'totalOpportunities' },
        { header: 'Deals Won', accessorKey: 'dealsWon' },
        { header: 'Team Revenue (INR)', accessorKey: 'totalRevenue' },
        { header: 'Conversion Rate %', accessorKey: 'conversionRate' },
        { header: 'Performance Score', accessorKey: 'performanceScore' }
      ];
    } else if (activeTab === 'branch') {
      currentDataSet = branchQuery.data?.data || [];
      fileName = 'branch_performance_report';
      reportTitle = 'Branch Performance Report';
      columns = [
        { header: 'Rank', accessorKey: 'rank' },
        { header: 'Branch Code', accessorKey: 'branchCode' },
        { header: 'Branch Name', accessorKey: 'branchName' },
        { header: 'Location', accessorKey: 'location' },
        { header: 'Total Leads', accessorKey: 'totalLeads' },
        { header: 'Qualified Leads', accessorKey: 'qualifiedLeads' },
        { header: 'Opportunities', accessorKey: 'opportunitiesCount' },
        { header: 'Deals Won', accessorKey: 'dealsWon' },
        { header: 'New Customers', accessorKey: 'newCustomers' },
        { header: 'Total Revenue (INR)', accessorKey: 'totalRevenue' },
        { header: 'Conversion Rate %', accessorKey: 'conversionRate' },
        { header: 'Performance Score', accessorKey: 'performanceScore' }
      ];
    }

    if (type === 'excel') {
      exportExcel(currentDataSet, columns, `${fileName}_${filters.rankingPeriod}`);
    } else if (type === 'csv') {
      exportCSV(currentDataSet, columns, `${fileName}_${filters.rankingPeriod}`);
    } else if (type === 'pdf') {
      const companyName = user?.company?.name || 'ClassDesk CRM';
      const pdfOptions = {
        companyName,
        companySubtitle: 'Sales Performance & Analytics Report',
        userName: user?.name || user?.email || 'Authorized User',
        filtersSummary: {
          Period: filters.rankingPeriod,
          Scope: `${companies.find(c => c.id === filters.companyId)?.name || 'All Companies'} -> ${branches.find(b => b.id === filters.branchId)?.name || 'All Branches'}`
        },
        summaryCards: [
          { label: 'Total Records', value: `${currentDataSet.length} Rows` }
        ]
      };
      await exportPDFFromData(currentDataSet, columns, reportTitle, `${fileName}_${filters.rankingPeriod}.pdf`, pdfOptions);
    }
  };

  return (
    <div className="w-full space-y-5 pb-12">
      {/* Clean World-Class Enterprise Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Sales Performance
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Monitor conversion efficiency, revenue attribution, team productivity & executive leaderboards.
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsExportMenuOpen(prev => !prev)}
            disabled={!isQueryEnabled || isExporting}
            className="h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium text-xs rounded-md border border-slate-200 shadow-2xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={14} className="text-slate-500" />
            <span>Export Report</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {isExportMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => handleExport('excel')}
                className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors text-left"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Export CSV (.csv)</span>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors text-left"
              >
                <Printer className="w-4 h-4 text-rose-600" />
                <span>Export PDF (.pdf)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Role-Aware Filter Bar */}
      <PerformanceFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        companies={companies}
        branches={branches}
        teams={teams}
        userRoleInfo={userRoleInfo}
        isFetching={bdeQuery.isFetching || iseQuery.isFetching}
      />

      {/* Super Admin Prompt when no company is selected */}
      {isSuperAdmin && !filters.companyId ? (
        <div className="bg-white rounded-none border border-slate-200/80 shadow-xs p-12 text-center max-w-lg mx-auto my-8 space-y-3">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-none flex items-center justify-center mx-auto shadow-xs">
            <Building size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">Select a Company to View Analytics</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            As Super Admin, please choose a target company from the dropdown filter above to inspect performance metrics, top leaderboards, and branch data.
          </p>
        </div>
      ) : (
        <>
          {/* Executive KPI Summary Cards */}
          <PerformanceSummaryCards
            bdeData={bdeQuery.data?.data || []}
            teamData={teamQuery.data?.data || []}
            branchData={branchQuery.data?.data || []}
            topBDEs={topBDEs}
          />

          {/* Interactive Recharts Analytics Visualization Section */}
          <PerformanceAnalyticsCharts
            bdeData={bdeQuery.data?.data || []}
            teamData={teamQuery.data?.data || []}
          />

          {/* Top Leaderboards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PerformanceRankingCard
              title="Top BDE Performers"
              subtitle="Leading Business Development Executives by weighted performance score"
              items={topBDEs}
              type="bde"
            />
            <PerformanceRankingCard
              title="Top Sales Teams"
              subtitle="Highest revenue contributing teams across all branches"
              items={topTeams}
              type="team"
            />
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-slate-200/80">
            <nav className="flex space-x-6 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('bde')}
                className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'bde'
                    ? 'border-orange-500 text-orange-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck size={18} />
                <span>BDE Performance ({bdeQuery.data?.data?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('ise')}
                className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'ise'
                    ? 'border-orange-500 text-orange-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <PhoneCall size={18} />
                <span>ISE Activity ({iseQuery.data?.data?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('team')}
                className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'team'
                    ? 'border-orange-500 text-orange-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users size={18} />
                <span>Team Rankings ({teamQuery.data?.data?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('branch')}
                className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'branch'
                    ? 'border-orange-500 text-orange-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 size={18} />
                <span>Branch Performance ({branchQuery.data?.data?.length || 0})</span>
              </button>
            </nav>
          </div>

          {/* Tab Content Rendering */}
          <div>
            {activeTab === 'bde' && (
              <BDEPerformanceTable
                data={bdeQuery.data?.data || []}
                isLoading={bdeQuery.isLoading}
              />
            )}

            {activeTab === 'ise' && (
              <ISEPerformanceTable
                data={iseQuery.data?.data || []}
                isLoading={iseQuery.isLoading}
              />
            )}

            {activeTab === 'team' && (
              <TeamPerformanceTable
                data={teamQuery.data?.data || []}
                isLoading={teamQuery.isLoading}
              />
            )}

            {activeTab === 'branch' && (
              <BranchPerformanceTable
                data={branchQuery.data?.data || []}
                isLoading={branchQuery.isLoading}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
