// crm-web/src/features/dashboard/pages/BdeDashboardView.jsx
import {
  Layers, Clock, AlertTriangle, Target,
  Handshake, TrendingUp, CheckSquare, BarChart3, LayoutDashboard
} from 'lucide-react';
import KpiCard            from '../components/KpiCard';
import TargetProgressBar  from '../components/TargetProgressBar';
import LeadAgingWidget    from '../components/LeadAgingWidget';
import ReminderWidget     from '../components/ReminderWidget';
import QuickActionsBar    from '../components/QuickActionsBar';
import PageHeader         from '../../../shared/components/modules/PageHeader';
import { useDashboardMetrics, useLeadAging, useKpiTargets } from '../hooks/useRoleDashboard';
import { useAuth }        from '../../../app/providers/AuthProvider';
import { useNavigate }    from 'react-router-dom';

const BdeDashboardView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params   = { rankingPeriod: 'MONTHLY', companyId: user?.companyId };

  const { data: realMetrics = {}, isLoading }       = useDashboardMetrics(params);
  const { data: realAging   = {}, isLoading: al }   = useLeadAging(params);
  const { data: realKpis    = [], isLoading: kl }   = useKpiTargets(params);

  // --- DUMMY DATA FOR BDE DASHBOARD ---
  const dummyMetrics = {
    assignedLeads: 45,
    qualifiedLeads: 18,
    followupsToday: 12,
    pendingFollowups: 5,
    activeOpportunities: 8,
    dealsWon: 3,
    revenue: 125000,
    callsCompletedToday: 34,
  };

  const dummyAging = {
    '0-3': 20,
    '4-7': 12,
    '8-15': 5,
    '16-30': 3,
    '30+': 1,
  };

  const dummyKpis = [
    { id: 1, kpiType: 'LEAD_TARGET', targetValue: 100, achievedValue: 45 },
    { id: 2, kpiType: 'REVENUE_TARGET', targetValue: 500000, achievedValue: 125000 },
    { id: 3, kpiType: 'SALES_TARGET', targetValue: 15, achievedValue: 3 },
  ];

  const metrics = Object.keys(realMetrics).length > 0 ? realMetrics : dummyMetrics;
  const aging = Object.keys(realAging).length > 0 ? realAging : dummyAging;
  const kpis = realKpis.length > 0 ? realKpis : dummyKpis;
  // ------------------------------------

  const KPI_CARDS = [
    { icon: Layers,        title: 'Assigned Leads',    value: metrics.assignedLeads,       color: 'blue'    },
    { icon: CheckSquare,   title: 'Qualified Leads',   value: metrics.qualifiedLeads,      color: 'emerald' },
    { icon: Clock,         title: "Today's Follow-ups",value: metrics.followupsToday,      color: 'sky'     },
    { icon: AlertTriangle, title: 'Pending Follow-ups',value: metrics.pendingFollowups,    color: 'orange'  },
    { icon: Target,        title: 'Opportunities',      value: metrics.activeOpportunities, color: 'purple'  },
    { icon: Handshake,     title: 'Deals Won',          value: metrics.dealsWon,           color: 'rose'    },
    { icon: TrendingUp,    title: 'Revenue',            value: metrics.revenue,            prefix: '₹', color: 'blue' },
    { icon: BarChart3,     title: 'Calls Today',        value: metrics.callsCompletedToday, color: 'slate'  },
  ];

  return (
    <div className=" max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      <PageHeader
        title="My Dashboard"
        description="Your personal performance workbench"
        icon={LayoutDashboard}
        actions={<QuickActionsBar actions={['add_lead', 'followup', 'opportunity', 'customers']} />}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {KPI_CARDS.map(card => <KpiCard key={card.title} {...card} isLoading={isLoading} />)}
      </div>

      {/* KPI Targets */}
      {kpis.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-3">My Targets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {kpis.map(kpi => <TargetProgressBar key={kpi.id} kpi={kpi} isLoading={kl} />)}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <LeadAgingWidget data={aging} isLoading={al} />
        <ReminderWidget />
      </div>
    </div>
  );
};

export default BdeDashboardView;
