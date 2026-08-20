// crm-web/src/features/salesPerformance/pages/SalesPerformancePage.jsx

import React, { useState } from 'react';
import { Award, UserCheck, PhoneCall, Users, Building2, Building, TrendingUp, Download, Sparkles, FileSpreadsheet, FileText, FileCode, ChevronDown } from 'lucide-react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
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
import { salesPerformanceService } from '../services/salesPerformanceService';

export default function SalesPerformancePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bde');
  const { exportCSV, exportExcel, exportPDFFromData, isExporting } = useExport();
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState(null);
  const isExportMenuOpen = Boolean(exportMenuAnchorEl);

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
    queryKey: ['companiesOptions'],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const res = await axiosClient.get('/companies');
      if (Array.isArray(res)) return res;
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.companies)) return res.data.companies;
      if (Array.isArray(res.companies)) return res.companies;
      return [];
    }
  });

  // Fetch Branches for filter options
  const { data: branches = [] } = useQuery({
    queryKey: ['branchesOptions', filters.companyId],
    enabled: (isSuperAdmin && Boolean(filters.companyId)) || isCompanyAdmin,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.companyId) params.set('companyId', filters.companyId);
      const res = await axiosClient.get(`/branches?${params.toString()}`);
      if (Array.isArray(res)) return res;
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.branches)) return res.data.branches;
      if (Array.isArray(res.branches)) return res.branches;
      return [];
    }
  });

  // Fetch Teams for filter options (ALL ROLES)
  const { data: teams = [] } = useQuery({
    queryKey: ['teamsOptions', filters.companyId, filters.branchId],
    enabled: (isSuperAdmin && Boolean(filters.companyId)) || !isSuperAdmin,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.companyId) params.set('companyId', filters.companyId);
      if (filters.branchId) params.set('branchId', filters.branchId);
      const res = await axiosClient.get(`/teams?${params.toString()}`);
      if (Array.isArray(res)) return res;
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.teams)) return res.data.teams;
      if (Array.isArray(res.teams)) return res.teams;
      return [];
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

  const topBDEs = rankingsQuery.data?.topBDEs || [];
  const topTeams = rankingsQuery.data?.topTeams || [];

  const handleOpenExportMenu = (e) => {
    setExportMenuAnchorEl(e.currentTarget);
  };

  const handleCloseExportMenu = () => {
    setExportMenuAnchorEl(null);
  };

  const getExportDataSetAndColumns = () => {
    let currentDataSet = [];
    let columns = [];
    let reportTypePrefix = 'sales_performance';
    let reportTitle = 'Sales Performance Report';

    if (activeTab === 'bde') {
      currentDataSet = bdeQuery.data?.data || [];
      reportTypePrefix = 'bde_performance_report';
      reportTitle = 'BDE Performance Report';
      columns = [
        { header: 'Rank', accessorKey: 'rank', align: 'center' },
        { header: 'Employee Code', accessorKey: 'employeeCode' },
        { header: 'Name', accessorKey: 'name' },
        { header: 'Branch', accessorKey: 'branchName' },
        { header: 'Assigned Leads', accessorKey: 'leadsAssigned', align: 'center' },
        { header: 'Qualified Leads', accessorKey: 'qualifiedLeads', align: 'center' },
        { header: 'Opportunities', accessorKey: 'opportunitiesCreated', align: 'center' },
        { header: 'Deals Won', accessorKey: 'dealsWon', align: 'center' },
        {
          header: 'Total Revenue (INR)',
          accessorKey: 'totalRevenue',
          align: 'right',
          formatter: (val) => (val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0')
        },
        {
          header: 'Conversion Rate %',
          accessorKey: 'conversionRate',
          align: 'right',
          formatter: (val) => `${Number(val || 0).toFixed(2)}%`
        },
        { header: 'Performance Score', accessorKey: 'performanceScore', align: 'center' }
      ];
    } else if (activeTab === 'ise') {
      currentDataSet = iseQuery.data?.data || [];
      reportTypePrefix = 'ise_activity_report';
      reportTitle = 'ISE Activity Report';
      columns = [
        { header: 'Rank', accessorKey: 'rank', align: 'center' },
        { header: 'Employee Code', accessorKey: 'employeeCode' },
        { header: 'Name', accessorKey: 'name' },
        { header: 'Branch', accessorKey: 'branchName' },
        { header: 'Calls Completed', accessorKey: 'callsCompleted', align: 'center' },
        { header: 'Followups Completed', accessorKey: 'followupsCompleted', align: 'center' },
        { header: 'Meetings Scheduled', accessorKey: 'meetingsScheduled', align: 'center' },
        { header: 'Assigned Leads', accessorKey: 'assignedLeads', align: 'center' },
        { header: 'Qualified Leads', accessorKey: 'qualifiedLeads', align: 'center' },
        {
          header: 'Conversion Rate %',
          accessorKey: 'conversionRate',
          align: 'right',
          formatter: (val) => `${Number(val || 0).toFixed(2)}%`
        },
        { header: 'Performance Score', accessorKey: 'performanceScore', align: 'center' }
      ];
    } else if (activeTab === 'team') {
      currentDataSet = teamQuery.data?.data || [];
      reportTypePrefix = 'team_performance_report';
      reportTitle = 'Team Performance Report';
      columns = [
        { header: 'Rank', accessorKey: 'rank', align: 'center' },
        { header: 'Team Code', accessorKey: 'teamCode' },
        { header: 'Team Name', accessorKey: 'teamName' },
        { header: 'Branch', accessorKey: 'branchName' },
        { header: 'Team Leader', accessorKey: 'bdeName' },
        { header: 'Member Count', accessorKey: 'memberCount', align: 'center' },
        { header: 'Total Leads', accessorKey: 'totalLeads', align: 'center' },
        { header: 'Opportunities', accessorKey: 'totalOpportunities', align: 'center' },
        { header: 'Deals Won', accessorKey: 'dealsWon', align: 'center' },
        {
          header: 'Team Revenue (INR)',
          accessorKey: 'totalRevenue',
          align: 'right',
          formatter: (val) => (val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0')
        },
        {
          header: 'Conversion Rate %',
          accessorKey: 'conversionRate',
          align: 'right',
          formatter: (val) => `${Number(val || 0).toFixed(2)}%`
        },
        { header: 'Performance Score', accessorKey: 'performanceScore', align: 'center' }
      ];
    } else if (activeTab === 'branch') {
      currentDataSet = branchQuery.data?.data || [];
      reportTypePrefix = 'branch_performance_report';
      reportTitle = 'Branch Performance Report';
      columns = [
        { header: 'Rank', accessorKey: 'rank', align: 'center' },
        { header: 'Branch Code', accessorKey: 'branchCode' },
        { header: 'Branch Name', accessorKey: 'branchName' },
        { header: 'Location', accessorKey: 'location' },
        { header: 'Total Leads', accessorKey: 'totalLeads', align: 'center' },
        { header: 'Qualified Leads', accessorKey: 'qualifiedLeads', align: 'center' },
        { header: 'Opportunities', accessorKey: 'opportunitiesCount', align: 'center' },
        { header: 'Deals Won', accessorKey: 'dealsWon', align: 'center' },
        { header: 'New Customers', accessorKey: 'newCustomers', align: 'center' },
        {
          header: 'Total Revenue (INR)',
          accessorKey: 'totalRevenue',
          align: 'right',
          formatter: (val) => (val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0')
        },
        {
          header: 'Conversion Rate %',
          accessorKey: 'conversionRate',
          align: 'right',
          formatter: (val) => `${Number(val || 0).toFixed(2)}%`
        },
        { header: 'Performance Score', accessorKey: 'performanceScore', align: 'center' }
      ];
    }

    const fileName = `${reportTypePrefix}_${filters.rankingPeriod || 'MONTHLY'}`;

    return { currentDataSet, columns, fileName, reportTitle };
  };


  const handleExportFormat = async (format) => {
    handleCloseExportMenu();
    const { currentDataSet, columns, fileName, reportTitle } = getExportDataSetAndColumns();

    if (!currentDataSet || currentDataSet.length === 0) {
      return;
    }

    const logOptions = {
      rawFileName: true,
      onSuccess: async (fmt, exportedFileName, rowCount) => {
        try {
          await salesPerformanceService.logExportAction({
            reportType: activeTab,
            format: fmt,
            filters,
            rowCount
          });
        } catch (err) {
          console.warn('Failed to record AuditLog entry:', err);
        }
      }
    };

    if (format === 'XLSX') {
      await exportExcel(currentDataSet, columns, `${fileName}.xlsx`, logOptions);
    } else if (format === 'CSV') {
      await exportCSV(currentDataSet, columns, `${fileName}.csv`, logOptions);
    } else if (format === 'PDF') {
      const selectedCompanyObj = companies.find((c) => String(c.id) === String(filters.companyId));
      const selectedBranchObj = branches.find((b) => String(b.id) === String(filters.branchId));
      const selectedTeamObj = teams.find((t) => String(t.id) === String(filters.teamId));

      const companyName = user?.company?.name || user?.companyName || selectedCompanyObj?.name || 'ClassDesk';
      const logoUrl = user?.company?.logo || '/src/assets/logos/logo-official.png';

      const totalRev = currentDataSet.reduce((sum, item) => sum + (Number(item.totalRevenue) || 0), 0);
      const avgConv = (
        currentDataSet.reduce((sum, item) => sum + (Number(item.conversionRate) || 0), 0) /
        (currentDataSet.length || 1)
      ).toFixed(1);

      const pdfOptions = {
        userName: user?.name || user?.email || 'Authorized User',
        companyName,
        companySubtitle: `${companyName} • Analytics & Reporting`,
        logoUrl,
        filtersSummary: {
          Period: filters.rankingPeriod || 'MONTHLY',
          Company: isSuperAdmin ? (selectedCompanyObj?.name || null) : companyName,
          Branch: selectedBranchObj?.name || null,
          Team: selectedTeamObj?.name || null,
          'Date Range': filters.startDate && filters.endDate ? `${filters.startDate} to ${filters.endDate}` : null
        },
        summaryCards: [
          { label: 'Total Records', value: `${currentDataSet.length} Rows` },
          { label: 'Total Revenue', value: `₹${totalRev.toLocaleString('en-IN')}` },
          { label: 'Avg Conversion', value: `${avgConv}%` }
        ]
      };

      await exportPDFFromData(currentDataSet, columns, reportTitle, `${fileName}.pdf`, pdfOptions, logOptions);
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

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenExportMenu}
            disabled={!isQueryEnabled || isExporting}
            className="h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium text-xs rounded-md border border-slate-200 shadow-2xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Download size={14} className={isExporting ? 'animate-bounce text-orange-500' : 'text-slate-500'} />
            <span>{isExporting ? 'Exporting...' : 'Export Data'}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          <Menu
            anchorEl={exportMenuAnchorEl}
            open={isExportMenuOpen}
            onClose={handleCloseExportMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(226,232,240,0.8)',
                  p: 0.5,
                  minWidth: '170px',
                  '& .MuiMenuItem-root': {
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#334155',
                    borderRadius: '6px',
                    mx: 0.5,
                    my: 0.25,
                    py: 1,
                    px: 2,
                    gap: 1.5,
                    transition: 'all 0.15s ease-in-out',
                    '&:hover': {
                      bgcolor: '#F8FAFC',
                      color: '#F86F03'
                    }
                  }
                }
              }
            }}
          >
            <MenuItem onClick={() => handleExportFormat('XLSX')}>
              <FileSpreadsheet size={15} className="text-emerald-600" />
              <span>Export as Excel (.xlsx)</span>
            </MenuItem>
            <MenuItem onClick={() => handleExportFormat('CSV')}>
              <FileText size={15} className="text-blue-600" />
              <span>Export as CSV (.csv)</span>
            </MenuItem>
            <MenuItem onClick={() => handleExportFormat('PDF')}>
              <FileCode size={15} className="text-rose-600" />
              <span>Export as PDF (.pdf)</span>
            </MenuItem>
          </Menu>
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

