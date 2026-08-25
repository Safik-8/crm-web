// crm-web/src/features/dashboard/pages/SuperAdminDashboardView.jsx
import { useState } from 'react';
import {
  Building2, GitBranch, Users, Layers, Target, Handshake,
  TrendingUp, UserCheck, BarChart3, RefreshCw,
} from 'lucide-react';
import KpiCard from '../components/KpiCard';
import LeadAgingWidget from '../components/LeadAgingWidget';
import ActivityFeedWidget from '../components/ActivityFeedWidget';
import ReminderWidget from '../components/ReminderWidget';
import Button from '../../../shared/components/elements/Button';
import SelectField from '../../../shared/components/elements/SelectField';
import PageHeader from '../../../shared/components/modules/PageHeader';
import { CrmBarChart } from '../../../shared/components/charts';
import { useDashboardMetrics, useLeadAging, useActivityFeed } from '../hooks/useRoleDashboard';
import { useNavigate } from 'react-router-dom';

const SuperAdminDashboardView = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('MONTHLY');

  const params = { rankingPeriod: period };
  const { data: metrics = {}, isLoading, isFetching, refetch } = useDashboardMetrics(params);
  const { data: aging = {}, isLoading: agingLoading } = useLeadAging(params);
  const { data: activities = [], isLoading: activitiesLoading } = useActivityFeed(params);

  const revenueTitle =
    period === 'QUARTERLY' ? 'Quarterly Revenue' :
      period === 'YEARLY' ? 'Yearly Revenue' :
        'Monthly Revenue';

  const KPI_CARDS = [
    { icon: Building2, title: 'Total Companies', value: metrics.totalCompanies, color: 'blue' },
    { icon: GitBranch, title: 'Total Branches', value: metrics.totalBranches, color: 'purple' },
    { icon: Users, title: 'Total Users', value: metrics.totalUsers, color: 'sky' },
    { icon: Layers, title: 'Total Leads', value: metrics.totalLeads, color: 'orange' },
    { icon: Target, title: 'Active Opportunities', value: metrics.activeOpportunities, color: 'emerald' },
    { icon: Handshake, title: 'Deals Won', value: metrics.dealsWon, color: 'rose' },
    { icon: TrendingUp, title: revenueTitle, value: metrics.monthlyRevenue, prefix: '₹', color: 'blue' },
    { icon: UserCheck, title: 'Active Customers', value: metrics.activeCustomers, color: 'purple' },
  ];

  const dummyBranches = [
    { name: 'NEXUS SOUTH MEGA BRANCH', revenue: 110000, deals: 45 },
    { name: 'NEXUS NORTH MEGA BRANCH', revenue: 62000, deals: 28 },
    { name: 'NEXUS EAST MEGA BRANCH', revenue: 85000, deals: 35 },
    { name: 'NEXUS WEST MEGA BRANCH', revenue: 95000, deals: 40 },
  ];

  const topBranchChartData = dummyBranches;

  const HeaderActions = (
    <>
      <div className="w-36">
        <SelectField
          value={period}
          onChange={(val) => setPeriod(val)}
          searchable={false}
          options={[
            { value: 'MONTHLY', label: 'This Month' },
            { value: 'QUARTERLY', label: 'This Quarter' },
            { value: 'YEARLY', label: 'This Year' },
          ]}
        />
      </div>
      <Button
        variant="outlined"
        size="small"
        onClick={() => refetch()}
        disabled={isFetching}
        startIcon={<RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />}
        sx={{
          height: '38px',
          borderColor: '#E2E8F0',
          color: '#475569',
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: 600,
          padding: '0 16px',
          textTransform: 'none',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          '&:hover': {
            borderColor: '#CBD5E1',
            backgroundColor: '#F8FAFC',
          },
        }}
      >
        Refresh
      </Button>
    </>
  );

  return (
    <div className=" max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      <PageHeader
        title="Super Admin Dashboard"
        description="Global business overview — all companies"
        icon={BarChart3}
        actions={HeaderActions}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {KPI_CARDS.map(card => (
          <KpiCard key={card.title} {...card} isLoading={isLoading} />
        ))}
      </div>

      {/* Conversion Rate Card */}
      <div className="bg-white border border-slate-100 shadow-sm p-5 flex items-center gap-4">
        <div>
          <p className="text-3xl font-extrabold text-blue-600">{metrics.conversionRate ?? 0}%</p>
          <p className="text-sm font-semibold text-slate-600">Overall Conversion Rate</p>
          <p className="text-xs text-slate-400">Deals Won ÷ Total Leads × 100</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {topBranchChartData.length > 0 ? (
          (() => {
            const isManyBranches = topBranchChartData.length > 4;
            return (
              <div className={`bg-white border border-slate-100 shadow-sm p-5 flex flex-col ${isManyBranches ? 'h-96' : 'h-80'}`}>
                <h3 className="text-sm font-bold text-slate-700 mb-4 shrink-0">Top Branches by Revenue</h3>
                <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
                  <CrmBarChart
                    data={topBranchChartData}
                    xKey="name"
                    layout={isManyBranches ? "vertical" : "horizontal"}
                    height={isManyBranches ? Math.max(300, topBranchChartData.length * 55) : '100%'}
                    yAxisWidth={isManyBranches ? 180 : undefined}
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    bars={[
                      { dataKey: 'revenue', name: 'Revenue (₹)', color: '#3b82f6' },
                      { dataKey: 'deals', name: 'Deals Won', color: '#10b981' },
                    ]}
                  />
                </div>
              </div>
            );
          })()
        ) : null}
        <LeadAgingWidget data={aging} isLoading={agingLoading} />
      </div>

      {/* Activity Feed & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ActivityFeedWidget activities={activities} isLoading={activitiesLoading} />
        <ReminderWidget />
      </div>
    </div>
  );
};

export default SuperAdminDashboardView;
