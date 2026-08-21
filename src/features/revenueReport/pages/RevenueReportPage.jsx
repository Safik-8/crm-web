// crm-web/src/features/revenueReport/pages/RevenueReportPage.jsx

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  PieChart,
  BookOpen,
  Users,
  GitBranch,
  FileSpreadsheet,
  FileText,
  Printer
} from 'lucide-react';

import PageHeader from '../../../shared/components/modules/PageHeader';
import Button from '../../../shared/components/elements/Button';

import { RevenueFilterBar } from '../components/RevenueFilterBar';
import { RevenueSummaryCards } from '../components/RevenueSummaryCards';
import { RevenueTrendChart } from '../components/RevenueTrendChart';
import { MonthlyRevenueTable } from '../components/MonthlyRevenueTable';
import { QuarterlyRevenueTable } from '../components/QuarterlyRevenueTable';
import { ProductRevenueTable } from '../components/ProductRevenueTable';
import { TeamRevenueTable } from '../components/TeamRevenueTable';
import { BranchRevenueTable } from '../components/BranchRevenueTable';

import {
  useRevenueSummary,
  useMonthlyRevenue,
  useQuarterlyRevenue,
  useProductRevenue,
  useTeamRevenue,
  useBranchRevenue,
  useRevenueTrend
} from '../hooks/useRevenueReport';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api/api';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useExport } from '../../../shared/hooks/useExport';

export default function RevenueReportPage() {
  const { user } = useAuth();
  const { exportCSV, exportExcel, exportPDF, exportPDFFromData, isExporting } = useExport();
  const [activeTab, setActiveTab] = useState('overview');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Role Scoping Matrix Identification
  const primaryRole = user?.primaryRole || '';
  const primaryRoleRank = user?.primaryRoleRank ?? 0;

  const isSuperAdmin = primaryRole === 'SUPER_ADMIN' || primaryRoleRank >= 100;
  const isCompanyAdmin = primaryRole === 'COMPANY_ADMIN' || primaryRoleRank === 80;
  const isBranchManager = primaryRole === 'BRANCH_MANAGER' || primaryRoleRank === 60;
  const isBDE = primaryRole === 'BDE' || primaryRoleRank === 40;
  const isISE = primaryRole === 'ISE' || primaryRoleRank === 20;

  const userRoleInfo = { isSuperAdmin, isCompanyAdmin, isBranchManager, isBDE, isISE };

  const [filters, setFilters] = useState({
    rankingPeriod: 'ALL',
    companyId: '',
    branchId: '',
    teamId: '',
    courseId: '',
    startDate: '',
    endDate: ''
  });

  // Fetch Companies (SUPER ADMIN ONLY)
  const { data: companies = [] } = useQuery({
    queryKey: ['companiesOptions'],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const res = await apiClient('/companies');
      const data = res?.data?.companies || res?.data || [];
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch Branches for filter options
  const { data: branches = [] } = useQuery({
    queryKey: ['branchesOptions', filters.companyId],
    enabled: (isSuperAdmin && Boolean(filters.companyId)) || isCompanyAdmin,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.companyId) params.set('companyId', filters.companyId);
      const str = params.toString();
      const res = await apiClient(`/branches${str ? '?' + str : ''}`);
      const data = res?.data?.branches || res?.data || [];
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch Teams for filter options
  const { data: teams = [] } = useQuery({
    queryKey: ['teamsOptions', filters.companyId, filters.branchId],
    enabled: true,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.companyId) params.set('companyId', filters.companyId);
      if (filters.branchId) params.set('branchId', filters.branchId);
      const str = params.toString();
      const res = await apiClient(`/teams${str ? '?' + str : ''}`);
      const data = res?.data?.teams || res?.data || [];
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch Courses for filter options
  const { data: courses = [] } = useQuery({
    queryKey: ['coursesOptions', filters.companyId],
    enabled: true,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.companyId) params.set('companyId', filters.companyId);
      const str = params.toString();
      const res = await apiClient(`/courses${str ? '?' + str : ''}`);
      const data = res?.data?.courses || res?.data || [];
      return Array.isArray(data) ? data : [];
    }
  });

  // Query Hooks
  const summaryQuery = useRevenueSummary(filters);
  const trendQuery = useRevenueTrend(filters);
  const monthlyQuery = useMonthlyRevenue(filters);
  const quarterlyQuery = useQuarterlyRevenue(filters);
  const productQuery = useProductRevenue(filters);
  const teamQuery = useTeamRevenue(filters);
  const branchQuery = useBranchRevenue(filters);

  // Multi-Format Export Handler
  const handleExport = async (type) => {
    setIsExportMenuOpen(false);
    const logOpts = {
      reportName: `Revenue Report - ${activeTab.toUpperCase()}`,
      filtersUsed: filters
    };

    let exportData = [];
    let exportCols = [];
    let filePrefix = `revenue_report_${activeTab}`;
    let reportTitle = `Revenue Report (${activeTab.toUpperCase()})`;

    if (activeTab === 'monthly') {
      exportData = monthlyQuery.data?.data || [];
      exportCols = [
        { header: 'Period', accessorKey: 'periodKey' },
        { header: 'Month', accessorKey: 'monthName' },
        { header: 'Year', accessorKey: 'year' },
        { header: 'Total Revenue (INR)', accessorKey: 'totalRevenue' },
        { header: 'Deals Closed', accessorKey: 'dealsClosed' },
        { header: 'Customers Added', accessorKey: 'customersAdded' },
        { header: 'MoM Growth %', accessorKey: 'growthPct' }
      ];
    } else if (activeTab === 'quarterly') {
      exportData = quarterlyQuery.data?.data || [];
      exportCols = [
        { header: 'Quarter', accessorKey: 'periodKey' },
        { header: 'Year', accessorKey: 'year' },
        { header: 'Total Revenue (INR)', accessorKey: 'totalRevenue' },
        { header: 'Deals Closed', accessorKey: 'dealsClosed' },
        { header: 'Customers Added', accessorKey: 'customersAdded' },
        { header: 'QoQ Growth %', accessorKey: 'growthPct' }
      ];
    } else if (activeTab === 'product') {
      exportData = productQuery.data?.data || [];
      exportCols = [
        { header: 'Product Name', accessorKey: 'productName' },
        { header: 'Product Code', accessorKey: 'productCode' },
        { header: 'Category', accessorKey: 'category' },
        { header: 'Sales Count', accessorKey: 'salesCount' },
        { header: 'Average Selling Price', accessorKey: 'averageSellingPrice' },
        { header: 'Total Revenue (INR)', accessorKey: 'totalRevenue' },
        { header: 'Contribution %', accessorKey: 'contributionPct' }
      ];
    } else if (activeTab === 'team') {
      exportData = teamQuery.data?.data || [];
      exportCols = [
        { header: 'Team Name', accessorKey: 'teamName' },
        { header: 'Branch', accessorKey: 'branchName' },
        { header: 'Deals Won', accessorKey: 'dealsWon' },
        { header: 'Customers', accessorKey: 'customerCount' },
        { header: 'Total Revenue (INR)', accessorKey: 'totalRevenue' }
      ];
    } else if (activeTab === 'branch') {
      exportData = branchQuery.data?.data || [];
      exportCols = [
        { header: 'Branch Name', accessorKey: 'branchName' },
        { header: 'Company', accessorKey: 'companyName' },
        { header: 'Deals Won', accessorKey: 'dealsWon' },
        { header: 'Customers', accessorKey: 'customerCount' },
        { header: 'Total Revenue (INR)', accessorKey: 'totalRevenue' }
      ];
    } else {
      // Overview summary export
      exportData = [summaryQuery.data?.metrics || {}];
      exportCols = [
        { header: 'Total Revenue', accessorKey: 'totalRevenue' },
        { header: 'Monthly Revenue', accessorKey: 'monthlyRevenue' },
        { header: 'Quarterly Revenue', accessorKey: 'quarterlyRevenue' },
        { header: 'Yearly Revenue', accessorKey: 'yearlyRevenue' },
        { header: 'Average Deal Size', accessorKey: 'averageDealSize' },
        { header: 'Total Deals', accessorKey: 'totalDeals' }
      ];
    }

    if (type === 'excel') {
      exportExcel(exportData, exportCols, filePrefix, logOpts);
    } else if (type === 'csv') {
      exportCSV(exportData, exportCols, filePrefix, logOpts);
    } else if (type === 'pdf') {
      if (exportPDFFromData && exportData.length > 0) {
        const companyName = user?.company?.name || 'ClassDesk CRM';
        const pdfOptions = {
          companyName,
          companySubtitle: 'Revenue & Financial Analytics Report',
          userName: user?.name || user?.email || 'Authorized User',
          filtersSummary: {
            Period: filters.rankingPeriod,
            Scope: `${companies.find(c => c.id === filters.companyId)?.name || 'All Companies'} -> ${branches.find(b => b.id === filters.branchId)?.name || 'All Branches'}`
          },
          summaryCards: [
            { label: 'Total Revenue', value: summaryQuery.data?.metrics?.totalRevenue ? `₹${Number(summaryQuery.data.metrics.totalRevenue).toLocaleString('en-IN')}` : null },
            { label: 'Total Records', value: `${exportData.length} Rows` }
          ].filter(c => c.value !== null)
        };
        await exportPDFFromData(exportData, exportCols, reportTitle, `${filePrefix}.pdf`, pdfOptions);
      } else {
        exportPDF('revenue-report-printable', filePrefix, logOpts);
      }
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'monthly', label: 'Monthly Statement', icon: Calendar },
    { id: 'quarterly', label: 'Quarterly Breakdown', icon: PieChart },
    { id: 'product', label: 'By Product', icon: BookOpen },
    { id: 'team', label: 'By Team', icon: Users },
    ...(isSuperAdmin || isCompanyAdmin
      ? [{ id: 'branch', label: 'By Branch', icon: GitBranch }]
      : [])
  ];

  return (
    <div className=" max-w-7xl mx-auto space-y-4">
      {/* Header Section */}
      <PageHeader
        icon={DollarSign}
        iconClassName="bg-orange-50 text-orange-600 border border-orange-100"
        title="Revenue & Financial Reports"
        description="Real-time financial analytics, earnings attribution, growth trends, and multi-format exports"
        className=""
        actions={
          <>
            <div className="hidden md:flex items-center px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-700 h-[36px]">
              <span className="w-2 h-2 rounded-full bg-orange-500 mr-2 animate-pulse"></span>
              Role: <strong className="ml-1 text-slate-900">{primaryRole || 'User'}</strong>
            </div>

            <div className="relative">
              <Button
                variant="contained"
                startIcon={<Download className="w-4 h-4" />}
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                disabled={isExporting}
                sx={{
                  backgroundColor: '#DE5D02',
                  '&:hover': { backgroundColor: '#C24102' },
                  height: '36px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {isExporting ? 'Exporting...' : 'Export Report'}
              </Button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-orange-600" />
                    <span>Export Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Export CSV (.csv)</span>
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                  >
                    <Printer className="w-4 h-4 text-rose-600" />
                    <span>Export PDF (.pdf)</span>
                  </button>
                </div>
              )}
            </div>
          </>
        }
      />

      {/* Filter Bar */}
      <RevenueFilterBar
        filters={filters}
        setFilters={setFilters}
        companies={companies}
        branches={branches}
        teams={teams}
        courses={courses}
        userRoleInfo={userRoleInfo}
      />

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 flex space-x-1 sm:space-x-4 overflow-x-auto pb-px">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${isActive
                ? 'border-orange-600 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Printable Report Container */}
      <div id="revenue-report-printable" className="pt-2">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div>
            <RevenueSummaryCards
              metrics={summaryQuery.data?.metrics}
              period={filters.rankingPeriod}
              isLoading={summaryQuery.isLoading}
            />
            <RevenueTrendChart
              trendData={trendQuery.data?.trend}
              isLoading={trendQuery.isLoading}
            />
          </div>
        )}

        {/* Tab 2: Monthly Statement */}
        {activeTab === 'monthly' && (
          <MonthlyRevenueTable
            data={monthlyQuery.data?.data}
            isLoading={monthlyQuery.isLoading}
          />
        )}

        {/* Tab 3: Quarterly Breakdown */}
        {activeTab === 'quarterly' && (
          <QuarterlyRevenueTable
            data={quarterlyQuery.data?.data}
            isLoading={quarterlyQuery.isLoading}
          />
        )}

        {/* Tab 4: Product / Course Revenue */}
        {activeTab === 'product' && (
          <ProductRevenueTable
            data={productQuery.data?.data}
            isLoading={productQuery.isLoading}
          />
        )}

        {/* Tab 5: Team Revenue */}
        {activeTab === 'team' && (
          <TeamRevenueTable
            data={teamQuery.data?.data}
            isLoading={teamQuery.isLoading}
          />
        )}

        {/* Tab 6: Branch Revenue (Super Admin / Company Admin) */}
        {activeTab === 'branch' && (isSuperAdmin || isCompanyAdmin) && (
          <BranchRevenueTable
            data={branchQuery.data?.data}
            isLoading={branchQuery.isLoading}
          />
        )}
      </div>
    </div>
  );
}
