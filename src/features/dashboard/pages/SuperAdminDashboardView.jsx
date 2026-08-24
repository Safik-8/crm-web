// crm-web/src/features/dashboard/pages/SuperAdminDashboardView.jsx
import { useState } from 'react';
import {
  Building2, GitBranch, Users, Layers, Target, Handshake,
  TrendingUp, UserCheck, BarChart3, RefreshCw,
} from 'lucide-react';
import KpiCard            from '../components/KpiCard';
import LeadAgingWidget    from '../components/LeadAgingWidget';
import ActivityFeedWidget from '../components/ActivityFeedWidget';
import ReminderWidget     from '../components/ReminderWidget';
import Button             from '../../../shared/components/elements/Button';
import SelectField        from '../../../shared/components/elements/SelectField';
import { CrmBarChart }    from '../../../shared/components/charts';
import { useDashboardMetrics, useLeadAging, useActivityFeed } from '../hooks/useRoleDashboard';
import { useNavigate }    from 'react-router-dom';

const SuperAdminDashboardView = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('MONTHLY');

  const params = { rankingPeriod: period };
  const { data: metrics = {}, isLoading, isFetching, refetch } = useDashboardMetrics(params);
  const { data: aging   = {}, isLoading: agingLoading } = useLeadAging(params);
  const { data: activities = [], isLoading: activitiesLoading } = useActivityFeed(params);

  const revenueTitle =
    period === 'QUARTERLY' ? 'Quarterly Revenue' :
    period === 'YEARLY'    ? 'Yearly Revenue' :
                             'Monthly Revenue';

  const KPI_CARDS = [
    { icon: Building2,      title: 'Total Companies',     value: metrics.totalCompanies,    color: 'blue'    },
    { icon: GitBranch,      title: 'Total Branches',      value: metrics.totalBranches,     color: 'purple'  },
    { icon: Users,          title: 'Total Users',         value: metrics.totalUsers,        color: 'sky'     },
    { icon: Layers,         title: 'Total Leads',         value: metrics.totalLeads,        color: 'orange'  },
    { icon: Target,         title: 'Active Opportunities',value: metrics.activeOpportunities, color: 'emerald' },
    { icon: Handshake,      title: 'Deals Won',           value: metrics.dealsWon,          color: 'rose'    },
    { icon: TrendingUp,     title: revenueTitle,          value: metrics.monthlyRevenue,    prefix: '₹', color: 'blue' },
    { icon: UserCheck,      title: 'Active Customers',    value: metrics.activeCustomers,   color: 'purple'  },
  ];

  const topBranchChartData = (metrics.topBranches ?? []).map((b) => ({
    name: b.branchName || `Branch ${b.branchId}`,
    revenue: Number(b._sum?.finalAmount ?? 0),
    deals:   b._count?.id ?? 0,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <BarChart3 size={22} className="text-blue-500" /> Super Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Global business overview — all companies</p>
        </div>
        <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {KPI_CARDS.map(card => (
          <KpiCard key={card.title} {...card} isLoading={isLoading} />
        ))}
      </div>

      {/* Conversion Rate Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
        <div>
          <p className="text-3xl font-extrabold text-blue-600">{metrics.conversionRate ?? 0}%</p>
          <p className="text-sm font-semibold text-slate-600">Overall Conversion Rate</p>
          <p className="text-xs text-slate-400">Deals Won ÷ Total Leads × 100</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {topBranchChartData.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Top Branches by Revenue</h3>
            <div className="h-64">
              <CrmBarChart
                data={topBranchChartData}
                xKey="name"
                bars={[
                  { dataKey: 'revenue', name: 'Revenue (₹)', color: '#3b82f6' },
                  { dataKey: 'deals',   name: 'Deals Won',   color: '#10b981' },
                ]}
              />
            </div>
          </div>
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
