// crm-web/src/features/dashboard/pages/CompanyAdminDashboardView.jsx
import { useState } from 'react';
import {
  GitBranch, Users, TrendingUp, Layers, Target,
  Handshake, UserCheck, Clock, BarChart3, RefreshCw,
} from 'lucide-react';
import KpiCard            from '../components/KpiCard';
import LeadAgingWidget    from '../components/LeadAgingWidget';
import ActivityFeedWidget from '../components/ActivityFeedWidget';
import ReminderWidget     from '../components/ReminderWidget';
import Button             from '../../../shared/components/elements/Button';
import SelectField        from '../../../shared/components/elements/SelectField';
import { CrmBarChart }    from '../../../shared/components/charts';
import { useDashboardMetrics, useLeadAging, useActivityFeed } from '../hooks/useRoleDashboard';
import { useAuth }        from '../../../app/providers/AuthProvider';
import { useNavigate }    from 'react-router-dom';

const CompanyAdminDashboardView = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [period, setPeriod] = useState('MONTHLY');

  const params = { rankingPeriod: period, companyId: user?.companyId };
  const { data: metrics = {}, isLoading, isFetching, refetch } = useDashboardMetrics(params);
  const { data: aging   = {}, isLoading: agingLoading } = useLeadAging(params);
  const { data: activities = [], isLoading: activitiesLoading } = useActivityFeed(params);

  const revenueTitle =
    period === 'QUARTERLY' ? 'Quarterly Revenue' :
    period === 'YEARLY'    ? 'Yearly Revenue' :
                             'Monthly Revenue';

  const KPI_CARDS = [
    { icon: GitBranch,     title: 'Total Branches',      value: metrics.totalBranches,      color: 'blue'    },
    { icon: Users,         title: 'Total Users',          value: metrics.totalUsers,         color: 'purple'  },
    { icon: Layers,        title: 'Total Leads',          value: metrics.totalLeads,         color: 'sky'     },
    { icon: Target,        title: 'Opportunities',         value: metrics.activeOpportunities, color: 'orange'  },
    { icon: Handshake,     title: 'Deals Won',            value: metrics.dealsWon,           color: 'emerald' },
    { icon: TrendingUp,    title: revenueTitle,           value: metrics.monthlyRevenue,     prefix: '₹', color: 'blue' },
    { icon: UserCheck,     title: 'Active Customers',     value: metrics.activeCustomers,    color: 'purple'  },
    { icon: Clock,         title: "Today's Follow-ups",  value: metrics.followupsToday,     color: 'rose'    },
  ];

  const branchChartData = (metrics.branchRankings ?? []).map((b) => ({
    name: b.branchName || `Branch ${b.branchId}`,
    revenue: Number(b._sum?.finalAmount ?? 0),
    deals:   b._count?.id ?? 0,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <BarChart3 size={22} className="text-purple-500" /> Company Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Company-level performance overview</p>
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {KPI_CARDS.map(card => <KpiCard key={card.title} {...card} isLoading={isLoading} />)}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <p className="text-2xl font-extrabold text-purple-600">{metrics.conversionRate ?? 0}%</p>
        <p className="text-sm font-semibold text-slate-600">Conversion Rate</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {branchChartData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Branch Revenue Rankings</h3>
            <div className="h-64">
              <CrmBarChart
                data={branchChartData}
                xKey="name"
                bars={[
                  { dataKey: 'revenue', name: 'Revenue (₹)', color: '#a855f7' },
                  { dataKey: 'deals',   name: 'Deals Won',   color: '#10b981' },
                ]}
              />
            </div>
          </div>
        )}
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

export default CompanyAdminDashboardView;
