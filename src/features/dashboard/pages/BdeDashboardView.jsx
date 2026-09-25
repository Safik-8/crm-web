// crm-web/src/features/dashboard/pages/BdeDashboardView.jsx
import { useState } from 'react';
import {
  Layers, Clock, AlertTriangle, Target,
  Handshake, TrendingUp, CheckSquare, BarChart3, LayoutDashboard
} from 'lucide-react';
import KpiCard            from '../components/KpiCard';
import TargetProgressBar  from '../components/TargetProgressBar';
import LeadAgingWidget    from '../components/LeadAgingWidget';
import ReminderWidget     from '../components/ReminderWidget';
import FollowupsDrawer    from '../components/FollowupsDrawer';
import QuickActionsBar    from '../components/QuickActionsBar';
import PageHeader         from '../../../shared/components/modules/PageHeader';
import { useDashboardMetrics, useLeadAging, useKpiTargets } from '../hooks/useRoleDashboard';
import { useAuth }        from '../../../app/providers/AuthProvider';
import { useNavigate }    from 'react-router-dom';

const BdeDashboardView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [followupDrawerOpen, setFollowupDrawerOpen] = useState(false);
  const [followupFilter, setFollowupFilter]         = useState('today');
  const params   = { rankingPeriod: 'MONTHLY', companyId: user?.companyId };

  const { data: metrics = {}, isLoading }       = useDashboardMetrics(params);
  const { data: aging   = {}, isLoading: al }   = useLeadAging(params);
  const { data: kpis    = [], isLoading: kl }   = useKpiTargets(params);

  const KPI_CARDS = [
    { icon: Layers,        title: 'Assigned Leads',    value: metrics.assignedLeads,       color: 'blue',    onClick: () => navigate('/leads') },
    { icon: CheckSquare,   title: 'Qualified Leads',   value: metrics.qualifiedLeads,      color: 'emerald', onClick: () => navigate('/leads?isQualified=true') },
    { icon: Clock,         title: "Today's Follow-ups",value: metrics.followupsToday,      color: 'sky',     onClick: () => { setFollowupFilter('today'); setFollowupDrawerOpen(true); } },
    { icon: AlertTriangle, title: 'Pending Follow-ups',value: metrics.pendingFollowups,    color: 'orange',  onClick: () => { setFollowupFilter('overdue'); setFollowupDrawerOpen(true); } },
    { icon: Target,        title: 'Opportunities',      value: metrics.activeOpportunities, color: 'purple',  onClick: () => navigate('/opportunities') },
    { icon: Handshake,     title: 'Deals Won',          value: metrics.dealsWon,           color: 'rose',    onClick: () => navigate('/deals?outcome=WON') },
    { icon: TrendingUp,    title: 'Revenue',            value: metrics.revenue,            prefix: '₹', color: 'blue', onClick: () => navigate('/my-performance') },
    {
      icon: BarChart3,
      title: 'Calls Today',
      value: metrics.callsCompletedToday,
      color: 'slate',
      onClick: () => navigate('/leads'),
      badges: [
        { label: '❄️ Cold', value: metrics.coldCallsToday || 0, color: 'sky' },
        { label: '🔄 Follow-up', value: metrics.followupCallsToday || 0, color: 'indigo' },
        { label: '✕ Missed', value: metrics.notReceivedCallsToday || 0, color: 'rose' },
      ],
    },
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

      {/* Follow-up Drawer triggered by Follow-up KPI cards */}
      <FollowupsDrawer
        isOpen={followupDrawerOpen}
        onClose={() => setFollowupDrawerOpen(false)}
        initialFilter={followupFilter}
      />
    </div>
  );
};

export default BdeDashboardView;
