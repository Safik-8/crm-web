import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Download, Save, TrendingUp, DollarSign, Award, Target, Folder, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line
} from 'recharts';
import Table from '../../../shared/components/elements/Table';
import Pagination from '../../../shared/components/elements/Pagination';
import Button from '../../../shared/components/elements/Button';
import TextField from '../../../shared/components/elements/TextField';
import { SYSTEM_REPORTS_METADATA } from '../constants/reportConstants';
import { apiClient } from '../../../lib/api/api';
import { useExport } from '../../../shared/hooks/useExport';

const ReportResultView = ({ reportType, reportData, filters, builderOptions, onPageChange, onSaveConfig, loading, error, toast }) => {
  const { user } = useAuth();
  const { exportPDFFromData } = useExport();
  const reportPerms = user?.permissions?.REPORT || {};
  const canExport = reportPerms.canExport ?? true;
  const canEdit = reportPerms.canEdit ?? true;

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [configName, setConfigName] = useState('');
  const [isDefaultConfig, setIsDefaultConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [printItems, setPrintItems] = useState(null);
  const [printing, setPrinting] = useState(false);

  // Ref flag: when true, the print-only container has been rendered and we should trigger print
  const printReadyRef = useRef(false);

  // This effect fires AFTER React commits the printItems state to the DOM.
  // Only then do we call window.print(), guaranteeing all rows are rendered.
  useEffect(() => {
    if (printItems !== null && printReadyRef.current) {
      printReadyRef.current = false;
      // requestAnimationFrame ensures the browser has painted before opening the print dialog
      const frameId = requestAnimationFrame(() => {
        setTimeout(() => {
          window.print();
          // Clean up after the print dialog closes
          document.body.classList.remove('is-printing-report');
          setPrintItems(null);
          setPrinting(false);
        }, 150);
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [printItems]);


  const metadata = SYSTEM_REPORTS_METADATA[reportType] || {};
  const columns = metadata.columns || [];

  // 1. Loading State (Issue 4)
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
        <Table
          columns={columns}
          data={[]}
          loadingState="loading"
          className="rounded-2xl"
        />
      </div>
    );
  }

  // 2. Error State (Issue 4)
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto space-y-4">
        <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-heading font-extrabold text-slate-800 text-sm">Something went wrong. Try again</h4>
          <p className="text-xs text-slate-500 font-semibold mt-1">We encountered an error generating the report data.</p>
        </div>
      </div>
    );
  }

  if (!reportData || !reportData.items) return null;

  const { summary = {}, items = [], pagination = {} } = reportData;

  const getScopeName = (category, id) => {
    if (!id || !builderOptions) return 'All';
    const list = builderOptions[category] || [];
    const match = list.find(item => String(item.id) === String(id));
    return match ? match.name : id;
  };

  const fetchFullDataset = async (formatLabel) => {
    if (pagination.total === 0) return [];

    let exportItems = items;
    if (pagination.total > items.length) {
      toast?.info(`Preparing full report dataset for ${formatLabel} export...`);
      const res = await apiClient('/reports/generate', {
        method: 'POST',
        body: {
          ...filters,
          reportType,
          isExport: true,
          page: 1,
          limit: pagination.total
        }
      });
      if (res?.success && res.data?.items) {
        exportItems = res.data.items;
      } else {
        throw new Error('Failed to load complete report dataset from server');
      }
    }

    // Client-side deduplication to prevent repeated records in PDF
    const uniqueItems = [];
    const seenKeys = new Set();
    exportItems.forEach(item => {
      const uniqueKey = item.id || item._id || JSON.stringify(item);
      if (!seenKeys.has(uniqueKey)) {
        seenKeys.add(uniqueKey);
        uniqueItems.push(item);
      }
    });

    return uniqueItems;
  };

  const logReportExportAction = async (exportType, fileName, rowCount) => {
    try {
      await apiClient('/reports/revenue/export-log', {
        method: 'POST',
        body: {
          reportName: metadata.title || reportType,
          exportType: exportType,
          fileName: fileName,
          filtersUsed: filters || {},
          rowCount: rowCount || 0
        }
      });
    } catch (auditErr) {
      console.warn('Failed to record AuditLog entry:', auditErr);
    }
  };

  const handleExportExcel = async () => {
    try {
      const exportItems = await fetchFullDataset('Excel');

      // Sheet 1: Report Data
      const dataRows = [columns.map(c => c.header)];
      if (exportItems.length === 0) {
        dataRows.push(['No data found for the selected filters']);
      } else {
        exportItems.forEach(item => {
          dataRows.push(
            columns.map(c => {
              if (c.cell) {
                return c.cell(item);
              } else if (c.accessorKey) {
                return item[c.accessorKey];
              }
              return '';
            })
          );
        });
      }

      // Sheet 2: Summary
      const branchName = getScopeName('branches', filters?.branchId) || 'Your Branch';
      const companyName = getScopeName('companies', filters?.companyId) || 'Your Company';
      const teamName = getScopeName('teams', filters?.teamId) || 'All Teams';
      const empName = getScopeName('employees', filters?.employeeId) || 'All Employees';

      const scopeStr = `${companyName} -> ${branchName} -> ${teamName} -> ${empName}`;
      const dateRangeStr = `${filters?.startDate || 'All Time'} to ${filters?.endDate || 'All Time'}`;

      const summaryRows = [
        ['Report Name', metadata.title || reportType],
        ['Generated At', new Date().toLocaleString()],
        ['Date Range', dateRangeStr],
        ['Scope', scopeStr],
        [],
        ['Applied Filters'],
        ['Status Filter', filters?.status || filters?.statusId || filters?.paymentStatus || 'All'],
        ['Course/Product Filter', getScopeName('courses', filters?.productId || filters?.courseId || filters?.purchasedProductId) || 'All'],
        ['Lead Source Filter', getScopeName('leadSources', filters?.sourceId) || 'All'],
        ['Deal Outcome Filter', filters?.outcome || 'All'],
        [],
        ['KPI Values']
      ];

      // Add report-specific KPIs
      if (reportType === 'LEAD_REPORT') {
        summaryRows.push(
          ['Total Leads', summary.totalRecords || 0],
          ['Qualified Leads', summary.qualifiedCount || 0],
          ['Lost Leads', summary.lostCount || 0],
          ['Conversion Rate', `${summary.conversionRate || 0}%`]
        );
      } else if (reportType === 'OPPORTUNITY_REPORT') {
        summaryRows.push(
          ['Total Opportunities', summary.totalRecords || 0],
          ['Expected Revenue', currency(summary.totalRevenue)],
          ['Won Opportunities', summary.wonCount || 0],
          ['Average Probability', `${summary.averageProbability || 0}%`]
        );
      } else if (reportType === 'DEAL_REPORT') {
        summaryRows.push(
          ['Total Deals', summary.totalRecords || 0],
          ['Won Value', currency(summary.totalRevenue)],
          ['Win Rate', `${summary.winRate || 0}%`],
          ['Lost Deals', summary.lostCount || 0]
        );
      } else if (reportType === 'REVENUE_REPORT') {
        summaryRows.push(
          ['Total Revenue', currency(summary.totalRevenue)],
          ['Completed Revenue', currency(summary.completedRevenue)],
          ['Pending Revenue', currency(summary.pendingRevenue)],
          ['Total Transactions', summary.totalRecords || 0]
        );
      } else if (reportType === 'CUSTOMER_REPORT') {
        summaryRows.push(
          ['Total Customers', summary.totalRecords || 0],
          ['Total Purchase Value', currency(summary.totalRevenue)],
          ['Active Customers', summary.activeCount || 0],
          ['Inactive Customers', summary.inactiveCount || 0]
        );
      } else if (reportType === 'TEAM_PERFORMANCE_REPORT') {
        summaryRows.push(
          ['Total Employees', summary.totalRecords || 0],
          ['Total Revenue Generated', currency(summary.totalRevenue)],
          ['Total Deals Closed', summary.totalDeals || 0],
          ['Average Conversion Rate', `${summary.averageConversionRate || 0}%`]
        );
      }

      // Generate Workbook
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const wsData = XLSX.utils.aoa_to_sheet(dataRows);
      XLSX.utils.book_append_sheet(wb, wsData, 'Report Data');

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      const exportFileName = `${reportType.toLowerCase()}_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, exportFileName);

      await logReportExportAction('EXCEL', exportFileName, exportItems.length);
      toast?.success('Report exported to Excel successfully');
    } catch (err) {
      console.error(err);
      toast?.error('Failed to export report to Excel: ' + err.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      const exportItems = await fetchFullDataset('CSV');

      // Quote headers the same way as data values to handle commas in column names
      const headers = columns.map(c => `"${String(c.header ?? '').replace(/"/g, '""')}"`).join(',');
      const rows = exportItems.map(item => {
        return columns.map(c => {
          let val = '';
          if (c.cell) {
            val = c.cell(item);
          } else if (c.accessorKey) {
            val = item[c.accessorKey];
          }
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        }).join(',');
      });

      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const exportFileName = `${reportType.toLowerCase()}_export_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', exportFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await logReportExportAction('CSV', exportFileName, exportItems.length);
      toast?.success('Report exported to CSV successfully');
    } catch (err) {
      console.error(err);
      toast?.error('Failed to export report to CSV: ' + err.message);
    }
  };


  const handleExportPDF = async () => {
    try {
      const exportItems = await fetchFullDataset('PDF');

      const companyName = user?.company?.name || user?.companyName || getScopeName('companies', filters?.companyId) || 'ClassDesk';
      const logoUrl = user?.company?.logo || '/src/assets/logos/logo-official.png';

      const pdfOptions = {
        userName: user?.name || user?.email || 'Authorized User',
        companyName,
        companySubtitle: `${companyName} • Enterprise Analytics & Reporting`,
        logoUrl,
        filtersSummary: {
          Scope: `${companyName} -> ${getScopeName('branches', filters?.branchId) || 'All Branches'} -> ${getScopeName('teams', filters?.teamId) || 'All Teams'}`,
          'Date Range': filters?.startDate && filters?.endDate ? `${filters.startDate} to ${filters.endDate}` : 'All Time',
          Status: filters?.status || filters?.statusId || filters?.paymentStatus || null,
          Course: getScopeName('courses', filters?.productId || filters?.courseId || filters?.purchasedProductId) || null
        },
        summaryCards: [
          { label: 'Total Records', value: `${exportItems.length} Rows` },
          { label: 'Total Revenue', value: summary?.totalRevenue ? currency(summary.totalRevenue) : null }
        ].filter(card => card.value !== null)
      };

      const pdfColumns = columns.map(c => ({
        header: c.header,
        accessorKey: c.accessorKey,
        align: c.accessorKey?.toLowerCase().includes('revenue') || c.accessorKey?.toLowerCase().includes('amount') || c.accessorKey?.toLowerCase().includes('rate') ? 'right' : (c.accessorKey?.toLowerCase().includes('id') || c.accessorKey?.toLowerCase().includes('code') || c.accessorKey?.toLowerCase().includes('count') ? 'center' : 'left'),
        formatter: (val, item) => (c.cell ? c.cell(item) : (val !== null && val !== undefined ? String(val) : ''))
      }));

      const exportFileName = `${reportType.toLowerCase()}_export_${new Date().toISOString().slice(0, 10)}.pdf`;

      await exportPDFFromData(
        exportItems,
        pdfColumns,
        metadata.title || reportType,
        exportFileName,
        pdfOptions,
        {
          rawFileName: true,
          onSuccess: async (fmt, fileName, rowCount) => {
            await logReportExportAction('PDF', fileName, rowCount);
          }
        }
      );
    } catch (err) {
      console.error('PDF Export Error:', err);
      toast?.error('Failed to export report to PDF: ' + err.message);
    }
  };



  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!configName.trim()) return;

    setSaving(true);
    try {
      const payload = {
        id: String(Date.now()),
        filterName: configName,
        reportConfig: {
          filters,
          reportType
        },
        isDefault: isDefaultConfig
      };

      if (onSaveConfig) {
        onSaveConfig(payload);
      }
      setSaveModalOpen(false);
      setConfigName('');
      setIsDefaultConfig(false);
    } catch (err) {
      toast?.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  // Modern Responsive SVG Charts
  const currency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const toChartData = (mapping) => Object.entries(mapping || {}).map(([name, value]) => ({ name, value: Number(value || 0) }));

  const renderStatusChart = () => {
    const dist = summary.statusDistribution || {};
    const chartData = toChartData(dist);
    if (chartData.length === 0) return null;

    const palette = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h4 className="font-heading font-bold text-slate-800 text-sm mb-4">Distribution</h4>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" innerRadius={42} outerRadius={76} paddingAngle={4}>
                {chartData.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Count']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 mt-2">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette[index % palette.length] }}></span>{item.name}</span>
              <span className="font-bold text-slate-700">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTrendChart = () => {
    const trends = summary.trends || summary.monthlyRevenueTrend || {};
    const chartData = Object.entries(trends || {}).sort(([a], [b]) => (a > b ? 1 : -1)).map(([name, value]) => ({ name, value: Number(value || 0) }));
    if (chartData.length === 0) return null;

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h4 className="font-heading font-bold text-slate-800 text-sm mb-4">Revenue Trend</h4>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
              <Tooltip formatter={(value) => [currency(value), 'Revenue']} />
              <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderDealChart = () => {
    const chartData = [
      { name: 'Won', value: Number(summary.wonCount || 0) },
      { name: 'Lost', value: Number(summary.lostCount || 0) }
    ];
    if (chartData.every(item => item.value === 0)) return null;

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h4 className="font-heading font-bold text-slate-800 text-sm mb-4">Won vs Lost Deals</h4>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
              <Tooltip formatter={(value) => [value, 'Deals']} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderFunnelChart = () => {
    const dist = summary.stageDistribution || summary.statusDistribution || {};
    const chartData = Object.entries(dist).map(([name, value]) => ({ name, value: Number(value || 0) })).sort((a, b) => b.value - a.value);
    if (chartData.length === 0) return null;

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h4 className="font-heading font-bold text-slate-800 text-sm mb-4">Pipeline Stage Distribution</h4>
        <div className="space-y-3">
          {chartData.map((item) => (
            <div key={item.name}>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                <span>{item.name}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400" style={{ width: `${Math.max((item.value / Math.max(...chartData.map(x => x.value), 1)) * 100, 8)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSummaryCards = () => {
    switch (reportType) {
      case 'LEAD_REPORT':
        return (
          <>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Folder className="w-6 h-6" /></div>
              <div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Total Leads</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.totalRecords || 0}</span></div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Target className="w-6 h-6" /></div>
              <div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Qualified</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.qualifiedCount || 0}</span></div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><AlertCircle className="w-6 h-6" /></div>
              <div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Lost</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.lostCount || 0}</span></div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
              <div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Conversion</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.conversionRate || 0}%</span></div>
            </div>
          </>
        );
      case 'OPPORTUNITY_REPORT':
        return (
          <>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Folder className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Opportunities</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.totalRecords || 0}</span></div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><DollarSign className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Expected Revenue</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{currency(summary.totalRevenue)}</span></div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center"><Award className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Won</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.wonCount || 0}</span></div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Avg Prob.</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.averageProbability || 0}%</span></div></div>
          </>
        );
      case 'DEAL_REPORT':
        return (
          <>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Folder className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Deals Closed</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.totalRecords || 0}</span></div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><DollarSign className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Won Value</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{currency(summary.totalRevenue)}</span></div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center"><Award className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Win Rate</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.winRate || 0}%</span></div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><AlertCircle className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Lost</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.lostCount || 0}</span></div></div>
          </>
        );
      case 'REVENUE_REPORT':
        return (
          <>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><DollarSign className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Total Revenue</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{currency(summary.totalRevenue)}</span></div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Target className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Completed</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{currency(summary.completedRevenue)}</span></div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Pending</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{currency(summary.pendingRevenue)}</span></div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center"><Folder className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Transactions</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.totalRecords || 0}</span></div></div>
          </>
        );
      case 'CUSTOMER_REPORT':
        return (
          <>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Folder className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Total Customers</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.totalRecords || 0}</span></div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><DollarSign className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Total Revenue</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{currency(summary.totalRevenue)}</span></div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center"><Target className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Active</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.activeCount || 0}</span></div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><AlertCircle className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Inactive</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.inactiveCount || 0}</span></div></div>
          </>
        );
      case 'TEAM_PERFORMANCE_REPORT':
        return (
          <>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Award className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Employees</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.totalRecords || 0}</span></div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><DollarSign className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Revenue</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{currency(summary.totalRevenue)}</span></div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center"><Target className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Deals Won</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.totalDeals || 0}</span></div></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div><div><span className="block text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">Avg. Conv.</span><span className="block text-slate-800 font-extrabold text-2xl mt-0.5">{summary.averageConversionRate || 0}%</span></div></div>
          </>
        );
      default:
        return null;
    }
  };

  const renderReportCharts = () => {
    switch (reportType) {
      case 'LEAD_REPORT':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderStatusChart()}
            {renderTrendChart()}
          </div>
        );
      case 'OPPORTUNITY_REPORT':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderFunnelChart()}
            {renderStatusChart()}
          </div>
        );
      case 'DEAL_REPORT':
        return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{renderDealChart()} {renderStatusChart()}</div>;
      case 'REVENUE_REPORT':
        return <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">{renderTrendChart()}</div>;
      case 'CUSTOMER_REPORT':
        return <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">{renderStatusChart()}</div>;
      case 'TEAM_PERFORMANCE_REPORT':
        return <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">{renderStatusChart()}</div>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 report-print-area">
      <style>{`
        /*
         * PORTAL PRINT APPROACH
         * The print container is rendered via ReactDOM.createPortal directly into
         * document.body, making it a sibling of #root — not a descendant.
         *
         * Screen: hide the portal div completely.
         * Print:  hide #root (and everything else), show ONLY the portal div.
         *         Because it is position:static and part of normal document flow,
         *         the browser will paginate it naturally across as many pages as needed.
         */

        /* Hide the portal print div on screen */
        #report-print-portal {
          display: none;
        }

        @media print {
          /* When the body class is active, hide the entire React app */
          body.is-printing-report > #root,
          body.is-printing-report > #app {
            display: none !important;
          }

          /* Reveal the portal print div — static positioning = natural flow = multi-page */
          body.is-printing-report > #report-print-portal {
            display: block !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 16px 0 !important;
            background: white !important;
          }

          /* Table must flow freely across pages */
          #report-print-portal table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }
          /* Repeat the header row on every printed page */
          #report-print-portal thead {
            display: table-header-group !important;
          }
          #report-print-portal tbody {
            display: table-row-group !important;
          }
          #report-print-portal tfoot {
            display: table-footer-group !important;
          }
          /* Each row can break across pages but not mid-row */
          #report-print-portal tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          #report-print-portal td,
          #report-print-portal th {
            font-size: 8.5pt !important;
            padding: 4px 6px !important;
            border: 1px solid #e2e8f0 !important;
          }
          #report-print-portal th {
            background-color: #f1f5f9 !important;
            font-weight: 700 !important;
          }
          /* Remove borders for special thead/tfoot helper rows */
          #report-print-portal .no-print-border td,
          #report-print-portal .no-print-border th {
            border: none !important;
          }
          /* Summary cards: compress for print */
          #report-print-portal .print-card {
            border: 1px solid #e2e8f0 !important;
            padding: 6px 10px !important;
            border-radius: 6px !important;
            font-size: 8pt !important;
          }

          /* Hide any stray action buttons that might end up inside the portal */
          .no-print-action {
            display: none !important;
          }

          @page {
            size: A4 landscape;
            margin: 12mm 15mm;
          }
        }
      `}</style>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
        <div>
          <h4 className="font-heading font-bold text-slate-800 text-base">{metadata.title}</h4>
          <p className="text-slate-500 text-xs font-semibold">{metadata.description}</p>
        </div>
        <div className="flex items-center gap-2 no-print-action">
          {canEdit && (
            <button
              onClick={() => setSaveModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              <Save className="w-4 h-4 text-slate-500" />
              Save Filter
            </button>
          )}
          {canExport && (
            <>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                <Download className="w-4 h-4 text-slate-500" />
                Excel
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                <Download className="w-4 h-4 text-slate-500" />
                CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                <Download className="w-4 h-4 text-slate-500" />
                PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderSummaryCards()}
      </div>

      {/* Report-specific charts */}
      {renderReportCharts()}

      {/* Data Table */}
      <div className="space-y-4">
        <Table
          columns={columns}
          data={items}
          loadingState="success"
          className="rounded-2xl"
        />

        {pagination.pages > 1 && (
          <div className="flex justify-end bg-white border border-slate-200 rounded-2xl p-4">
            <Pagination
              pagination={{
                page: pagination.page,
                totalPages: pagination.pages,
                total: pagination.total,
                limit: pagination.limit
              }}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>

      {/* Save Config Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-heading font-bold text-slate-800 text-lg mb-4">Save Report Configuration</h3>
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <TextField
                label="Report Filter Name"
                placeholder="E.g., Q3 Won Deals HQ"
                value={configName}
                onChange={(e) => setConfigName(e)}
                required
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefaultConfig}
                  onChange={(e) => setIsDefaultConfig(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary/20 h-4 w-4"
                />
                <label htmlFor="isDefault" className="text-xs font-semibold text-slate-600 select-none">
                  Set as default config for this report
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={saving || !configName.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold transition-all"
                >
                  Save Configuration
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Print-Only portal: rendered directly into document.body via createPortal.
           This makes it a sibling of #root, not a descendant, so @media print CSS
           can cleanly hide #root and show only this div — enabling proper multi-page output. */}
      {printItems && (() => {
        const tenantCompanyName = user?.company?.name || user?.companyName || getScopeName('companies', filters?.companyId) || 'ClassDesk';
        const tenantCompanyLogo = user?.company?.logo || '/src/assets/logos/logo-official.png';
        const companyInitials = tenantCompanyName
          .split(' ')
          .map(n => (n ? n[0] : ''))
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'CD';

        return ReactDOM.createPortal(
          <div id="report-print-portal" style={{ padding: '0', backgroundColor: '#fff', color: '#0f172a' }}>
            {/* Page 1 Only Content */}
            <div className="mb-6">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    {tenantCompanyLogo ? (
                      <img src={tenantCompanyLogo} alt="Logo" className="h-8 w-auto object-contain" />
                    ) : (
                      <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        {companyInitials}
                      </div>
                    )}
                    <h2 className="text-lg font-black tracking-widest text-slate-900 uppercase">{tenantCompanyName} <span className="text-slate-500 font-normal">CRM Analytics</span></h2>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">{metadata.title}</h1>
                </div>
                <div className="text-right text-xs font-semibold text-slate-500 space-y-1">
                  <div><span className="text-slate-400">Report Period:</span> {filters?.startDate || 'All Time'} – {filters?.endDate || 'All Time'}</div>
                  <div><span className="text-slate-400">Generated:</span> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div><span className="text-slate-400">Generated By:</span> {user?.name || user?.email || 'Authorized User'}</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Applied Filters & Scope</h3>
                <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-[10px] font-semibold text-slate-600">
                  <div><span className="text-slate-400 block mb-0.5">Company</span> <span className="text-slate-800">{getScopeName('companies', filters?.companyId) || 'All Companies'}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">Branch</span> <span className="text-slate-800">{getScopeName('branches', filters?.branchId) || 'All Branches'}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">Team</span> <span className="text-slate-800">{getScopeName('teams', filters?.teamId) || 'All Teams'}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">Employee</span> <span className="text-slate-800">{getScopeName('employees', filters?.employeeId) || 'All Employees'}</span></div>

                  {filters?.status && <div><span className="text-slate-400 block mb-0.5">Status</span> <span className="text-slate-800">{filters.status}</span></div>}
                  {filters?.paymentStatus && <div><span className="text-slate-400 block mb-0.5">Payment Status</span> <span className="text-slate-800">{filters.paymentStatus}</span></div>}
                  {filters?.productId && <div><span className="text-slate-400 block mb-0.5">Product / Course</span> <span className="text-slate-800">{getScopeName('courses', filters.productId) || 'All Courses'}</span></div>}
                  {filters?.outcome && <div><span className="text-slate-400 block mb-0.5">Outcome</span> <span className="text-slate-800">{filters.outcome}</span></div>}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                {renderSummaryCards()}
              </div>
            </div>

            {/* Table Content (Flows across pages with repeating headers) */}
            <div>
              {printItems.length === 0 ? (
                <div className="border border-slate-200 bg-slate-50 rounded-xl p-8 text-center text-sm font-medium text-slate-500">
                  <h4 className="text-slate-800 font-bold mb-1">No records found</h4>
                  <p>There are no records matching the selected filters and date range.</p>
                </div>
              ) : (
                <table className="w-full border-collapse border border-slate-200 text-[10px]">
                  <thead>
                    <tr className="no-print-border">
                      <td colSpan={columns.length} className="border-0 p-0 pb-2">
                        <div className="flex justify-between items-end border-b border-slate-300 pb-1 mb-1 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                          <span>{tenantCompanyName} CRM — {metadata.title}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-slate-50 border-b-2 border-slate-300">
                      {columns.map((col, i) => (
                        <th key={i} className="p-2 text-left font-bold text-slate-800 border-b border-slate-300 uppercase tracking-wider">{col.header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {printItems.map((item, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-slate-200 hover:bg-slate-50/50">
                        {columns.map((col, colIdx) => {
                          let val = '';
                          if (col.cell) {
                            val = col.cell(item);
                          } else if (col.accessorKey) {
                            val = item[col.accessorKey];
                          }
                          return (
                            <td key={colIdx} className="p-2 text-slate-700 border-b border-slate-200 align-top">
                              {String(val ?? '')}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="no-print-border">
                      <td colSpan={columns.length} className="border-0 pt-4">
                        <div className="flex justify-between items-center border-t border-slate-300 pt-2 text-[9px] text-slate-400 font-bold">
                          <span>Confidential — {tenantCompanyName} CRM</span>
                          <span>Generated by: {user?.name || user?.email || 'User'} &nbsp;|&nbsp; {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>,
          document.body
        );
      })()}

    </div>
  );
};

export default ReportResultView;
