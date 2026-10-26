import { useState } from 'react';
import {
  Layers, Clock, AlertTriangle, Target,
  Handshake, TrendingUp, CheckSquare, BarChart3, LayoutDashboard, RefreshCw
} from 'lucide-react';
import KpiCard            from '../components/KpiCard';
import TargetProgressBar  from '../components/TargetProgressBar';
import LeadAgingWidget    from '../components/LeadAgingWidget';
import ReminderWidget     from '../components/ReminderWidget';
import FollowupsDrawer    from '../components/FollowupsDrawer';
import QuickActionsBar    from '../components/QuickActionsBar';
import SelectField        from '../../../shared/components/elements/SelectField';
import Button             from '../../../shared/components/elements/Button';
import PageHeader         from '../../../shared/components/modules/PageHeader';
import { useDashboardMetrics, useLeadAging, useKpiTargets } from '../hooks/useRoleDashboard';
import { useAuth }        from '../../../app/providers/AuthProvider';
import { useNavigate }    from 'react-router-dom';

const PERIOD_OPTIONS = [
  { id: 'ALL', name: 'All Time' },
  { id: 'MONTHLY', name: 'This Month' },
  { id: 'QUARTERLY', name: 'This Quarter' },
  { id: 'YEARLY', name: 'This Year' },
];

const BdeDashboardView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('MONTHLY');
  const [followupDrawerOpen, setFollowupDrawerOpen] = useState(false);
  const [followupFilter, setFollowupFilter]         = useState('today');
  const params   = { rankingPeriod: period, companyId: user?.companyId };

  const { data: metrics = {}, isLoading, isFetching, refetch } = useDashboardMetrics(params);
  const { data: aging   = {}, isLoading: al }   = useLeadAging(params);
  const { data: kpis    = [], isLoading: kl }   = useKpiTargets(params);

  const revenueTitle =
    period === 'ALL'       ? 'Total Revenue' :
    period === 'QUARTERLY' ? 'Quarterly Revenue' :
    period === 'YEARLY'    ? 'Yearly Revenue' :
                             'Monthly Revenue';

  const KPI_CARDS = [
    { icon: Layers,        title: 'Assigned Leads',    value: metrics.assignedLeads,       color: 'blue',    onClick: () => navigate('/leads') },
    { icon: CheckSquare,   title: 'Qualified Leads',   value: metrics.qualifiedLeads,      color: 'emerald', onClick: () => navigate('/leads?isQualified=true') },
    { icon: Clock,         title: "Today's Follow-ups",value: metrics.followupsToday,      color: 'sky',     onClick: () => { setFollowupFilter('today'); setFollowupDrawerOpen(true); } },
    { icon: AlertTriangle, title: 'Pending Follow-ups',value: metrics.pendingFollowups,    color: 'orange',  onClick: () => { setFollowupFilter('overdue'); setFollowupDrawerOpen(true); } },
    { icon: Target,        title: 'Opportunities',      value: metrics.activeOpportunities, color: 'purple',  onClick: () => navigate('/opportunities') },
    { icon: Handshake,     title: 'Deals Won',          value: metrics.dealsWon ?? metrics.wonDeals ?? 0, color: 'rose', onClick: () => navigate('/deals?outcome=WON') },
    { icon: TrendingUp,    title: revenueTitle,         value: metrics.revenue ?? metrics.monthlyRevenue ?? 0, prefix: '₹', color: 'blue', onClick: () => navigate('/my-performance') },
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
        actions={
          <div className="flex items-center gap-2">
            <div className="w-36">
              <SelectField
                value={period}
                onChange={(val) => setPeriod(val)}
                options={PERIOD_OPTIONS}
                searchable={false}
                sx={{ minWidth: 130 }}
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
                padding: '0 14px',
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
          </div>
        }
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
