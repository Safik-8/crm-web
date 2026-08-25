// crm-web/src/features/dashboard/pages/BranchDashboardView.jsx
import React, { useState } from 'react';
import {
  Layers, Users, UserCheck, Handshake, TrendingUp,
  Clock, CheckSquare, Target, RefreshCw, BarChart3,
  Award, ArrowUpRight, ShieldCheck,
} from 'lucide-react';
import KpiCard            from '../components/KpiCard';
import LeadAgingWidget    from '../components/LeadAgingWidget';
import ActivityFeedWidget from '../components/ActivityFeedWidget';
import ReminderWidget     from '../components/ReminderWidget';
import QuickActionsBar    from '../components/QuickActionsBar';
import BranchTeamPerformanceWidget from '../components/BranchTeamPerformanceWidget';
import SelectField       from '../../../shared/components/elements/SelectField';
import Button            from '../../../shared/components/elements/Button';
import PageHeader        from '../../../shared/components/modules/PageHeader';
import { useDashboardMetrics, useLeadAging, useActivityFeed } from '../hooks/useRoleDashboard';
import { useAuth }        from '../../../app/providers/AuthProvider';
import { useNavigate }    from 'react-router-dom';

const PERIOD_OPTIONS = [
  { id: 'MONTHLY', name: 'This Month' },
  { id: 'QUARTERLY', name: 'This Quarter' },
  { id: 'YEARLY', name: 'This Year' },
];

const BranchDashboardView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('MONTHLY');

  const params = {
    rankingPeriod: period,
    companyId: user?.companyId,
    branchId: user?.branchId,
  };

  const { data: metrics = {}, isLoading, isFetching, refetch } = useDashboardMetrics(params);
  const { data: aging   = {}, isLoading: al }      = useLeadAging(params);
  const { data: activities = [], isLoading: actl } = useActivityFeed(params);

  const revenueTitle =
    period === 'QUARTERLY' ? 'Quarterly Revenue' :
    period === 'YEARLY'    ? 'Yearly Revenue' :
                             'Monthly Revenue';

  const KPI_CARDS = [
    { icon: Layers,      title: 'Branch Leads',       value: metrics.totalLeads,         color: 'blue'    },
    { icon: CheckSquare, title: 'Qualified Leads',     value: metrics.qualifiedLeads,      color: 'emerald' },
    { icon: Target,      title: 'Opportunities',       value: metrics.activeOpportunities, color: 'purple'  },
    { icon: Handshake,   title: 'Won Deals',          value: metrics.wonDeals,            color: 'rose'    },
    { icon: TrendingUp,  title: revenueTitle,         value: metrics.revenue,             prefix: '₹', color: 'blue' },
    { icon: Clock,       title: "Today's Follow-ups", value: metrics.followupsToday,      color: 'sky'     },
    { icon: Users,       title: 'Active BDEs',        value: metrics.bdeCount,            color: 'orange'  },
    { icon: UserCheck,   title: 'Active ISEs',        value: metrics.iseCount,            color: 'emerald' },
  ];

  const teamMembers = metrics.teamPerformance || [];

  const HeaderActions = (
    <>
      <div className="w-40">
        <SelectField
          value={period}
          onChange={(val) => setPeriod(val)}
          options={PERIOD_OPTIONS}
          searchable={false}
          sx={{ minWidth: 140 }}
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

      <QuickActionsBar actions={['add_lead', 'followup', 'opportunity', 'customers']} />
    </>
  );

  return (
    <div className=" max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      <PageHeader
        title="Branch Manager Dashboard"
        description={user?.branch?.name ? `${user.branch.name} — Operational performance and team overview` : 'Operational performance and team overview'}
        icon={BarChart3}
        actions={HeaderActions}
      />

      {/* 8 Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {KPI_CARDS.map((card) => (
          <KpiCard key={card.title} {...card} isLoading={isLoading} />
        ))}
      </div>

      {/* Conversion Rate Card */}
      <div className="bg-white border border-slate-100 shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Branch Conversion Rate</p>
            <p className="text-2xl font-extrabold text-purple-600 mt-0.5">
              {metrics.conversionRate ?? 0}%
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400 hidden sm:block">
          Ratio of total closed-won deals to branch leads
        </p>
      </div>

      {/* Team Performance & Contribution (Scalable with sorting, podium ranks, team filter & roster drawer) */}
      <BranchTeamPerformanceWidget teamMembers={teamMembers} isLoading={isLoading} />

      {/* Lead Aging & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <LeadAgingWidget data={aging} isLoading={al} />
        <ActivityFeedWidget activities={activities} isLoading={actl} />
      </div>

      {/* Follow-up Reminders Widget */}
      <ReminderWidget />
    </div>
  );
};

export default BranchDashboardView;
