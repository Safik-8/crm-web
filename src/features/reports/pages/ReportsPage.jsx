import React, { useState, useEffect } from 'react';
import { BarChart3, Star, Clock, Search, Filter, ArrowLeft, Trash2, Edit, Save, Play, Check } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useLoader } from '../../../shared/context/LoaderContext';
import { useAuth } from '../../../app/providers/AuthProvider';
import GenericPage from '../../../shared/components/templates/GenericPage';
import SearchInput from '../../../shared/components/elements/SearchInput';
import SelectField from '../../../shared/components/elements/SelectField';
import Button from '../../../shared/components/elements/Button';
import Drawer from '../../../shared/components/elements/Drawer';
import { toast } from '../../../shared/utils/toast';
import { REPORT_CATEGORIES, SYSTEM_REPORTS_METADATA } from '../constants/reportConstants';
import ReportBuilder from '../components/ReportBuilder';
import ReportResultView from '../components/ReportResultView';
import { apiClient } from '../../../lib/api/api';

const ReportsPage = () => {
  const { showLoader, hideLoader, forceHideLoader } = useLoader();
  const { user } = useAuth();
  const userRank = user?.primaryRoleRank ? Number(user.primaryRoleRank) : 0;
  
  // Scoped storage keys per user
  const favStorageKey = user ? `reports_fav_${user.id}` : 'reports_fav_guest';
  const recentStorageKey = user ? `reports_recent_${user.id}` : 'reports_recent_guest';
  const savedReportsKey = user ? `reports_${user.id}` : 'reports_guest';

  // Landing states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(favStorageKey)) || [];
    } catch { return []; }
  });
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(recentStorageKey)) || [];
    } catch { return []; }
  });

  // Builder states
  const [searchParams, setSearchParams] = useSearchParams();
  const activeReportType = searchParams.get('type');
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState('');

  // Generation & Result states
  const [reportData, setReportData] = useState(null);
  const [currentFilters, setCurrentFilters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(false);

  const [builderOptions, setBuilderOptions] = useState(null);

  useEffect(() => {
    forceHideLoader();
  }, [forceHideLoader]);

  // Load Saved configs when entering a report builder
  useEffect(() => {
    if (activeReportType) {
      fetchSavedConfigs();
      // Initialize default smart filters on load/type transition
      setCurrentFilters({
        companyId: user?.companyId || '',
        branchId: (user?.primaryRole !== 'SUPER_ADMIN' && user?.primaryRole !== 'COMPANY_ADMIN') ? (user?.branchId || '') : '',
        teamId: '',
        employeeId: (user?.primaryRole === 'BDE' || user?.primaryRole === 'ISE') ? (user?.id || '') : '',
        startDate: '',
        endDate: '',
        status: '',
        statusId: '',
        courseId: '',
        productId: '',
        purchasedProductId: '',
        sourceId: '',
        stageId: '',
        outcome: '',
        paymentStatus: ''
      });
    }
  }, [activeReportType, user]);

  const fetchSavedConfigs = () => {
    try {
      const stored = localStorage.getItem(savedReportsKey);
      const allSaved = stored ? JSON.parse(stored) : [];
      // Filter saved configs by active report type
      const filtered = allSaved.filter(c => c.reportConfig?.reportType === activeReportType);
      setSavedConfigs(filtered);

      // Auto load default if exists
      const defaultCfg = filtered.find(c => c.isDefault);
      if (defaultCfg) {
        setSelectedConfigId(String(defaultCfg.id));
        handleLoadConfig(defaultCfg);
      }
    } catch (err) {
      console.error('Failed to load saved report configurations', err);
    }
  };

  const handleSaveConfig = (newConfig) => {
    try {
      const stored = localStorage.getItem(savedReportsKey);
      let allSaved = stored ? JSON.parse(stored) : [];

      if (newConfig.isDefault) {
        // Unset other defaults for this report type
        allSaved = allSaved.map(c => 
          c.reportConfig?.reportType === activeReportType 
            ? { ...c, isDefault: false } 
            : c
        );
      }

      allSaved.push(newConfig);
      localStorage.setItem(savedReportsKey, JSON.stringify(allSaved));
      toast.success('Report configuration saved successfully');
      fetchSavedConfigs();
    } catch (err) {
      toast.error('Failed to save configuration');
    }
  };

  const handleToggleFavorite = (reportType, e) => {
    e.stopPropagation();
    let updated;
    if (favorites.includes(reportType)) {
      updated = favorites.filter(f => f !== reportType);
      toast.success('Removed from Favorites');
    } else {
      updated = [...favorites, reportType];
      toast.success('Added to Favorites');
    }
    setFavorites(updated);
    localStorage.setItem(favStorageKey, JSON.stringify(updated));
  };

  const handleOpenReport = (reportType) => {
    if (!canAccessReportType(reportType)) {
      toast.error('You do not have permission to open this report.');
      return;
    }

    setReportData(null);
    setCurrentFilters(null);
    setSelectedConfigId('');
    if (reportType) {
      setSearchParams({ type: reportType });
    } else {
      setSearchParams({});
    }

    // Update recently viewed list
    if (reportType) {
      const updatedRecent = [reportType, ...recentlyViewed.filter(r => r !== reportType)].slice(0, 5);
      setRecentlyViewed(updatedRecent);
      localStorage.setItem(recentStorageKey, JSON.stringify(updatedRecent));
    }
  };

  const canAccessReportType = (type) => {
    if (!type) return false;

    const role = user?.primaryRole;
    const rank = user?.primaryRoleRank ? parseInt(user.primaryRoleRank) : 0;

    const allowed = {
      SUPER_ADMIN: ['LEAD_REPORT', 'OPPORTUNITY_REPORT', 'DEAL_REPORT', 'REVENUE_REPORT', 'CUSTOMER_REPORT', 'TEAM_PERFORMANCE_REPORT'],
      COMPANY_ADMIN: ['LEAD_REPORT', 'OPPORTUNITY_REPORT', 'DEAL_REPORT', 'REVENUE_REPORT', 'CUSTOMER_REPORT', 'TEAM_PERFORMANCE_REPORT'],
      BRANCH_MANAGER: ['LEAD_REPORT', 'OPPORTUNITY_REPORT', 'DEAL_REPORT', 'REVENUE_REPORT', 'CUSTOMER_REPORT', 'TEAM_PERFORMANCE_REPORT'],
      BDE: ['LEAD_REPORT', 'OPPORTUNITY_REPORT', 'DEAL_REPORT', 'CUSTOMER_REPORT', 'TEAM_PERFORMANCE_REPORT'],
      ISE: ['LEAD_REPORT', 'OPPORTUNITY_REPORT', 'DEAL_REPORT', 'CUSTOMER_REPORT', 'TEAM_PERFORMANCE_REPORT']
    };

    const getAllowedReportsForRank = (r) => {
      if (r >= 60) {
        return ['LEAD_REPORT', 'OPPORTUNITY_REPORT', 'DEAL_REPORT', 'REVENUE_REPORT', 'CUSTOMER_REPORT', 'TEAM_PERFORMANCE_REPORT'];
      }
      if (r >= 20) {
        return ['LEAD_REPORT', 'OPPORTUNITY_REPORT', 'DEAL_REPORT', 'CUSTOMER_REPORT', 'TEAM_PERFORMANCE_REPORT'];
      }
      return [];
    };

    const allowedReports = allowed[role] || getAllowedReportsForRank(rank);
    return allowedReports.includes(type);
  };

  const handleGenerateReport = async (filters, page = 1) => {
    const targetType = activeReportType || filters?.reportType;
    if (!canAccessReportType(targetType)) {
      setError(true);
      toast.error('You do not have access to this report type.');
      return;
    }

    setLoading(true);
    setError(false);
    showLoader('Generating report...');
    setCurrentFilters(filters);
    setCurrentPage(page);
    try {
      const res = await apiClient('/reports/generate', {
        method: 'POST',
        body: {
          ...filters,
          reportType: targetType,
          page,
          limit: 10
        }
      });
      if (res?.success) {
        setReportData(res.data);
        toast.success('Report generated successfully');
      } else {
        setError(true);
        toast.error(res?.message || 'Failed to generate report');
      }
    } catch (err) {
      setError(true);
      toast.error(err.message || 'Error generating report');
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  const handleLoadConfig = (config) => {
    if (config?.reportConfig?.filters) {
      handleGenerateReport(config.reportConfig.filters, 1);
    }
  };

  const handleConfigDropdownChange = (val) => {
    setSelectedConfigId(val);
    if (!val) return;
    const config = savedConfigs.find(c => String(c.id) === String(val));
    if (config) {
      handleLoadConfig(config);
    }
  };

  const handleDeleteConfig = (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;

    try {
      const stored = localStorage.getItem(savedReportsKey);
      let allSaved = stored ? JSON.parse(stored) : [];
      allSaved = allSaved.filter(c => String(c.id) !== String(id));
      localStorage.setItem(savedReportsKey, JSON.stringify(allSaved));
      
      toast.success('Configuration deleted successfully');
      setSelectedConfigId('');
      fetchSavedConfigs();
    } catch (err) {
      toast.error('Failed to delete configuration');
    }
  };

  const handleSetDefaultConfig = (id, e) => {
    e.stopPropagation();
    try {
      const stored = localStorage.getItem(savedReportsKey);
      let allSaved = stored ? JSON.parse(stored) : [];
      
      allSaved = allSaved.map(c => {
        if (c.reportConfig?.reportType === activeReportType) {
          return { ...c, isDefault: String(c.id) === String(id) };
        }
        return c;
      });

      localStorage.setItem(savedReportsKey, JSON.stringify(allSaved));
      toast.success('Default configuration updated');
      fetchSavedConfigs();
    } catch (err) {
      toast.error('Failed to set default configuration');
    }
  };

  // Get allowed reports based on role
  const reportsList = Object.entries(SYSTEM_REPORTS_METADATA)
    .map(([type, meta]) => ({
      reportType: type,
      reportName: meta.title,
      description: meta.description,
      category: meta.category
    }))
    .filter(report => canAccessReportType(report.reportType));

  // Filtered lists
  const filteredReports = reportsList.filter(r => {
    const matchesSearch = r.reportName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categoryOptions = [
    { id: 'ALL', name: 'All Categories' },
    ...reportsList.map(c => {
      const catVal = c.category;
      const displayLabel = catVal === 'LEADS' ? 'Leads Reports'
                         : catVal === 'TEAM' ? 'Team Performance'
                         : catVal === 'OPPORTUNITY' ? 'Opportunities & Stages'
                         : catVal === 'DEALS' ? 'Deals & Outcome'
                         : catVal === 'FINANCE' ? 'Revenue & Payments'
                         : 'Customers Reports';
      return { id: catVal, name: displayLabel };
    })
  ].filter((item, index, self) => self.findIndex(t => t.id === item.id) === index);

  const reportPermissions = user?.permissions?.REPORT || {};
  const canViewPage = reportPermissions.canView ?? true;
  const canEdit = reportPermissions.canEdit ?? true;
  const canDelete = reportPermissions.canDelete ?? true;

  if (!canViewPage) {
    return (
      <GenericPage
        title="Reports Hub"
        description="Generate, customize, and analyze performance reports."
        icon={BarChart3}
      >
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-white border border-slate-200/60 rounded-2xl space-y-3">
          <h3 className="text-base font-bold text-slate-800">You do not have permission to perform this action</h3>
          <p className="text-xs text-slate-400 font-medium max-w-sm leading-normal">
            Please contact your system administrator to request access to the Reports module.
          </p>
        </div>
      </GenericPage>
    );
  }

  if (activeReportType && !canAccessReportType(activeReportType)) {
    return (
      <GenericPage
        title="Access Denied"
        description="You do not have permission to view this report."
        icon={BarChart3}
      >
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-white border border-slate-200/60 rounded-2xl space-y-3">
          <h3 className="text-base font-bold text-slate-800">You do not have permission to access this report</h3>
          <p className="text-xs text-slate-400 font-medium max-w-sm leading-normal">
            Please contact your system administrator to request access to this specific report.
          </p>
        </div>
      </GenericPage>
    );
  }

  return (
    <GenericPage
      title={activeReportType ? SYSTEM_REPORTS_METADATA[activeReportType]?.title : "Reports Hub"}
      description={activeReportType ? SYSTEM_REPORTS_METADATA[activeReportType]?.description : "Generate, customize, and analyze performance reports."}
      icon={BarChart3}
    >
      {activeReportType ? (
        // REPORT BUILDER & RESULTS PANEL VIEW
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Saved Configurations Dropdown */}
          {savedConfigs.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Saved Configurations:</span>
                <div className="w-52">
                  <SelectField
                    value={selectedConfigId}
                    onChange={handleConfigDropdownChange}
                    options={savedConfigs.map(c => ({
                      id: String(c.id),
                      name: `${c.filterName} ${c.isDefault ? '(Default)' : ''}`
                    }))}
                    placeholder="Load Saved Config"
                    allowEmptyOption
                  />
                </div>
                {selectedConfigId && (
                  <div className="flex gap-1">
                    {canEdit && (
                      <button
                        onClick={(e) => handleSetDefaultConfig(selectedConfigId, e)}
                        title="Set as Default"
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-primary transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={(e) => handleDeleteConfig(selectedConfigId, e)}
                        title="Delete saved configuration"
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filter Summary Bar (Only shown at top after report has been generated) */}
          {reportData && currentFilters && (() => {
            const getOptionName = (category, id) => {
              if (!id || !builderOptions) return id;
              const list = builderOptions[category] || [];
              const match = list.find(item => String(item.id) === String(id));
              return match ? match.name : id;
            };

            const branchName = getOptionName('branches', currentFilters.branchId) || 'Your Branch';
            const startStr = currentFilters.startDate ? new Date(currentFilters.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';
            const endStr = currentFilters.endDate ? new Date(currentFilters.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';

            let viewDesc = `Showing data for ${branchName} (Organization View)`;
            if (user?.primaryRoleRank < 60) {
              viewDesc = `Showing data for ${user.branch?.name || 'Your Branch'} → ${user.name}`;
            } else if (currentFilters.viewMode === 'TEAM') {
              const teamName = getOptionName('teams', currentFilters.teamId) || 'Selected Team';
              viewDesc = `Showing data for ${branchName} → ${teamName}`;
            } else if (currentFilters.viewMode === 'INDIVIDUAL') {
              const teamName = getOptionName('teams', currentFilters.teamId) || 'Selected Team';
              const empName = getOptionName('employees', currentFilters.employeeId) || 'Selected Employee';
              viewDesc = `Showing data for ${branchName} → ${teamName} → ${empName}`;
            }

            const statusLabel = getOptionName('leadStatuses', currentFilters.statusId) || currentFilters.status || currentFilters.paymentStatus || '';

            return (
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 shadow-sm text-xs font-semibold text-slate-600 flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-800 font-extrabold">{viewDesc}</span>
                  <span className="text-slate-300 font-normal">|</span>
                  <span>Date: {startStr} to {endStr}</span>
                  {statusLabel && (
                    <>
                      <span className="text-slate-300 font-normal">|</span>
                      <span>Status: {statusLabel}</span>
                    </>
                  )}
                </div>
                {/* Reset Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    const defaultMode = user?.primaryRoleRank < 60 ? 'INDIVIDUAL' : (user?.primaryRoleRank >= 60 && user?.primaryRoleRank < 80 ? 'TEAM' : 'ORGANIZATION');
                    const updated = {
                      ...currentFilters,
                      viewMode: defaultMode,
                      startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
                      endDate: new Date().toISOString().split('T')[0],
                      teamId: '',
                      employeeId: (user?.primaryRoleRank < 60) ? user.id : '',
                      statusId: '',
                      status: '',
                      paymentStatus: '',
                      courseId: '',
                      productId: '',
                      purchasedProductId: '',
                      sourceId: '',
                      stageId: '',
                      outcome: ''
                    };
                    setCurrentFilters(updated);
                    handleGenerateReport(updated, 1);
                  }}
                  className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  Clear Filters
                </button>
              </div>
            );
          })()}

          <ReportBuilder
            reportType={activeReportType}
            onGenerate={(filters) => handleGenerateReport(filters, 1)}
            currentFilters={currentFilters || {}}
            onChangeFilters={setCurrentFilters}
            onOptionsLoaded={setBuilderOptions}
            loading={loading}
          />

          {!reportData ? (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-white border border-dashed border-slate-200 rounded-2xl space-y-4 shadow-sm animate-in fade-in duration-200">
              <div className="bg-primary/5 p-4 rounded-full text-primary">
                <Filter className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-bold text-slate-800">Select filters to generate report</h3>
                <p className="text-xs text-slate-400 font-medium mt-1 leading-normal">
                  Choose date ranges, branch scopes, and optional parameters above, then click the Generate button to load real-time analytics.
                </p>
              </div>
            </div>
          ) : (
            <ReportResultView
              reportType={activeReportType}
              reportData={reportData}
              filters={currentFilters}
              builderOptions={builderOptions}
              onPageChange={(page) => handleGenerateReport(currentFilters, page)}
              onSaveConfig={handleSaveConfig}
              loading={loading}
              error={error}
              toast={toast}
            />
          )}
        </div>
      ) : (
        // REPORTS LANDING PAGE HUB VIEW
        <div className="space-y-6">
          {/* Favorites Bar (rendered if any exists) */}
          {favorites.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/5 to-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3 text-amber-600">
                <Star className="w-5 h-5 fill-current" />
                <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider">Favorite Reports</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportsList
                  .filter(r => favorites.includes(r.reportType))
                  .map(report => (
                    <div
                      key={report.reportType}
                      onClick={() => handleOpenReport(report.reportType)}
                      className="bg-white border border-slate-200/80 hover:border-amber-400 hover:shadow-md rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-amber-600 block mb-0.5">{REPORT_CATEGORIES[report.category]?.label}</span>
                        <h4 className="font-bold text-slate-800 text-sm">{report.reportName}</h4>
                      </div>
                      <button
                        onClick={(e) => handleToggleFavorite(report.reportType, e)}
                        className="text-amber-500 hover:scale-115 transition-transform"
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Quick Access / Recently Viewed */}
          {recentlyViewed.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-hide">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 whitespace-nowrap">
                <Clock className="w-4 h-4" />
                Recently Viewed:
              </div>
              {recentlyViewed.map(rType => {
                const rep = reportsList.find(rl => rl.reportType === rType);
                if (!rep) return null;
                return (
                  <button
                    key={rType}
                    onClick={() => handleOpenReport(rType)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                  >
                    {rep.reportName}
                  </button>
                );
              })}
            </div>
          )}

          {/* Search, Filter controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search reports..."
            />
            <div className="w-full sm:w-64">
              <SelectField
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={categoryOptions}
              />
            </div>
          </div>

          {/* Grid Layout of Report Cards */}
          {filteredReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map(report => {
                const isFav = favorites.includes(report.reportType);
                return (
                  <div
                    key={report.reportType}
                    onClick={() => handleOpenReport(report.reportType)}
                    className="group bg-white border border-slate-200 hover:border-primary/45 hover:shadow-xl rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                          {REPORT_CATEGORIES[report.category]?.label || report.category}
                        </span>
                        <button
                          onClick={(e) => handleToggleFavorite(report.reportType, e)}
                          className={`p-1.5 rounded-xl hover:bg-slate-100 transition-colors ${isFav ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'}`}
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      <h3 className="font-heading font-extrabold text-slate-800 text-base mb-1 group-hover:text-primary transition-colors">
                        {report.reportName}
                      </h3>
                      <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-4">
                        {report.description}
                      </p>
                    </div>

                    <div className="flex justify-end border-t border-slate-100 pt-3">
                      <Button
                        type="button"
                        className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300"
                      >
                        Open Builder
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-slate-700 text-base">No Reports Found</h3>
              <p className="text-slate-500 text-xs mt-1">Try adjusting your filters or search term.</p>
            </div>
          )}
        </div>
      )}
    </GenericPage>
  );
};

export default ReportsPage;
