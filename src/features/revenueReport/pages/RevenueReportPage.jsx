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
  Printer,
  ChevronDown
} from 'lucide-react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

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
import { revenueReportService } from '../services/revenueReportService';

export default function RevenueReportPage() {
  const { user } = useAuth();
  const { exportCSV, exportExcel, exportPDFFromData, isExporting } = useExport();
  const [activeTab, setActiveTab] = useState('overview');
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState(null);
  const isExportMenuOpen = Boolean(exportMenuAnchorEl);

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

  const handleOpenExportMenu = (e) => {
    setExportMenuAnchorEl(e.currentTarget);
  };

  const handleCloseExportMenu = () => {
    setExportMenuAnchorEl(null);
  };

  const getExportDataSetAndColumns = () => {
    let exportData = [];
    let exportCols = [];
    let filePrefix = `revenue_report_${activeTab}_${filters.rankingPeriod || 'ALL'}`;
    let reportTitle = 'Revenue & Financial Report';

    if (activeTab === 'monthly') {
      exportData = monthlyQuery.data?.data || [];
      reportTitle = 'Monthly Revenue Statement';
      exportCols = [
        { header: 'Period', accessorKey: 'periodKey' },
        { header: 'Month', accessorKey: 'monthName' },
        { header: 'Year', accessorKey: 'year', align: 'center' },
        {
          header: 'Total Revenue (INR)',
          accessorKey: 'totalRevenue',
          align: 'right',
          formatter: (val) => (val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0')
        },
        { header: 'Deals Closed', accessorKey: 'dealsClosed', align: 'center' },
        { header: 'Customers Added', accessorKey: 'customersAdded', align: 'center' },
        {
          header: 'MoM Growth %',
          accessorKey: 'growthPct',
          align: 'right',
          formatter: (val) => `${Number(val || 0).toFixed(2)}%`
        }
      ];
    } else if (activeTab === 'quarterly') {
      exportData = quarterlyQuery.data?.data || [];
      reportTitle = 'Quarterly Revenue Breakdown';
      exportCols = [
        { header: 'Quarter', accessorKey: 'periodKey' },
        { header: 'Year', accessorKey: 'year', align: 'center' },
        {
          header: 'Total Revenue (INR)',
          accessorKey: 'totalRevenue',
          align: 'right',
          formatter: (val) => (val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0')
        },
        { header: 'Deals Closed', accessorKey: 'dealsClosed', align: 'center' },
        { header: 'Customers Added', accessorKey: 'customersAdded', align: 'center' },
        {
          header: 'QoQ Growth %',
          accessorKey: 'growthPct',
          align: 'right',
          formatter: (val) => `${Number(val || 0).toFixed(2)}%`
        }
      ];
    } else if (activeTab === 'product') {
      exportData = productQuery.data?.data || [];
      reportTitle = 'Product & Course Revenue Report';
      exportCols = [
        { header: 'Product Name', accessorKey: 'productName' },
        { header: 'Product Code', accessorKey: 'productCode' },
        { header: 'Category', accessorKey: 'category' },
        { header: 'Sales Count', accessorKey: 'salesCount', align: 'center' },
        {
          header: 'Average Selling Price',
          accessorKey: 'averageSellingPrice',
          align: 'right',
          formatter: (val) => (val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0')
        },
        {
          header: 'Total Revenue (INR)',
          accessorKey: 'totalRevenue',
          align: 'right',
          formatter: (val) => (val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0')
        },
        {
          header: 'Contribution %',
          accessorKey: 'contributionPct',
          align: 'right',
          formatter: (val) => `${Number(val || 0).toFixed(2)}%`
        }
      ];
    } else if (activeTab === 'team') {
      exportData = teamQuery.data?.data || [];
      reportTitle = 'Team Revenue Performance Report';
      exportCols = [
        { header: 'Team Name', accessorKey: 'teamName' },
        { header: 'Branch', accessorKey: 'branchName' },
        { header: 'Deals Won', accessorKey: 'dealsWon', align: 'center' },
        { header: 'Customers', accessorKey: 'customerCount', align: 'center' },
        {
          header: 'Total Revenue (INR)',
          accessorKey: 'totalRevenue',
          align: 'right',
          formatter: (val) => (val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0')
        }
      ];
    } else if (activeTab === 'branch') {
      exportData = branchQuery.data?.data || [];
      reportTitle = 'Branch Revenue Performance Report';
      exportCols = [
        { header: 'Branch Name', accessorKey: 'branchName' },
        { header: 'Company', accessorKey: 'companyName' },
        { header: 'Deals Won', accessorKey: 'dealsWon', align: 'center' },
        { header: 'Customers', accessorKey: 'customerCount', align: 'center' },
        {
          header: 'Total Revenue (INR)',
          accessorKey: 'totalRevenue',
          align: 'right',
          formatter: (val) => (val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0')
        }
      ];
    } else {
      // Overview summary export
      const metrics = summaryQuery.data?.metrics || {};
      exportData = [metrics];
      reportTitle = 'Revenue & Financial Overview';
      exportCols = [
        {
          header: 'Total Revenue',
          accessorKey: 'totalRevenue',
          align: 'right',
          formatter: (val) => (val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0')
        },
        {
          header: 'Monthly Revenue',
          accessorKey: 'monthlyRevenue',
          align: 'right',
          formatter: (val) => (val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0')
        },
        {
          header: 'Quarterly Revenue',
          accessorKey: 'quarterlyRevenue',
          align: 'right',
          formatter: (val) => (val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0')
        },
        {
          header: 'Yearly Revenue',
          accessorKey: 'yearlyRevenue',
          align: 'right',
          formatter: (val) => (val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0')
        },
        {
          header: 'Average Deal Size',
          accessorKey: 'averageDealSize',
          align: 'right',
          formatter: (val) => (val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0')
        },
        { header: 'Total Deals', accessorKey: 'totalDeals', align: 'center' }
      ];
    }

    return { exportData, exportCols, filePrefix, reportTitle };
  };

  const handleExportFormat = async (format) => {
    handleCloseExportMenu();
    const { exportData, exportCols, filePrefix, reportTitle } = getExportDataSetAndColumns();

    if (!exportData || exportData.length === 0) {
      return;
    }

    const logOpts = {
      rawFileName: true,
      onSuccess: async (fmt, exportedFileName, rowCount) => {
        try {
          await revenueReportService.logExport({
            reportName: `Revenue Report - ${activeTab.toUpperCase()}`,
            exportType: fmt === 'XLSX' ? 'EXCEL' : fmt,
            fileName: exportedFileName,
            filtersUsed: filters
          });
        } catch (err) {
          console.warn('Failed to record AuditLog entry:', err);
        }
      }
    };

    if (format === 'XLSX') {
      await exportExcel(exportData, exportCols, `${filePrefix}.xlsx`, logOpts);
    } else if (format === 'CSV') {
      await exportCSV(exportData, exportCols, `${filePrefix}.csv`, logOpts);
    } else if (format === 'PDF') {
      const selectedCompanyObj = companies.find((c) => String(c.id) === String(filters.companyId));
      const selectedBranchObj = branches.find((b) => String(b.id) === String(filters.branchId));
      const selectedTeamObj = teams.find((t) => String(t.id) === String(filters.teamId));
      const selectedCourseObj = courses.find((c) => String(c.id) === String(filters.courseId));

      const companyName = user?.company?.name || user?.companyName || selectedCompanyObj?.name || 'ClassDesk';
      const logoUrl = user?.company?.logo || '/src/assets/logos/logo-official.png';

      const totalRev = exportData.reduce((sum, item) => sum + (Number(item.totalRevenue) || 0), 0);

      const pdfOptions = {
        userName: user?.name || user?.email || 'Authorized User',
        companyName,
        companySubtitle: `${companyName} • Financial & Revenue Analytics`,
        logoUrl,
        filtersSummary: {
          Period: filters.rankingPeriod || 'ALL',
          Company: isSuperAdmin ? (selectedCompanyObj?.name || null) : companyName,
          Branch: selectedBranchObj?.name || null,
          Team: selectedTeamObj?.name || null,
          Course: selectedCourseObj?.name || null,
          'Date Range': filters.startDate && filters.endDate ? `${filters.startDate} to ${filters.endDate}` : null
        },
        summaryCards: [
          { label: 'Total Records', value: `${exportData.length} Rows` },
          { label: 'Total Revenue', value: `₹${totalRev.toLocaleString('en-IN')}` }
        ]
      };

      await exportPDFFromData(exportData, exportCols, reportTitle, `${filePrefix}.pdf`, pdfOptions, logOpts);
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

            <div>
              <Button
                variant="contained"
                startIcon={<Download className="w-4 h-4" />}
                endIcon={<ChevronDown className="w-3.5 h-3.5" />}
                onClick={handleOpenExportMenu}
                disabled={isExporting}
                sx={{
                  backgroundColor: '#10B981',
                  '&:hover': { backgroundColor: '#059669' },
                  height: '36px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'none',
                }}
              >
                {isExporting ? 'Exporting...' : 'Export Report'}
              </Button>

            <Menu
              anchorEl={exportMenuAnchorEl}
              open={isExportMenuOpen}
              onClose={handleCloseExportMenu}
              PaperProps={{
                style: {
                  borderRadius: '16px',
                  marginTop: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e2e8f0'
                }
              }}
            >
              <MenuItem
                onClick={() => handleExportFormat('XLSX')}
                className="text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 py-2.5 px-4"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 mr-2" />
                <span>Export as Excel (.xlsx)</span>
              </MenuItem>
              <MenuItem
                onClick={() => handleExportFormat('CSV')}
                className="text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 py-2.5 px-4"
              >
                <FileText className="w-4 h-4 text-blue-600 mr-2" />
                <span>Export as CSV (.csv)</span>
              </MenuItem>
              <MenuItem
                onClick={() => handleExportFormat('PDF')}
                className="text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 py-2.5 px-4"
              >
                <Printer className="w-4 h-4 text-rose-600 mr-2" />
                <span>Export as PDF (.pdf)</span>
              </MenuItem>
            </Menu>
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
