import { useState } from 'react';
import {
  Layers, Phone, CheckCircle, Calendar,
  Clock, TrendingUp, LayoutDashboard, RefreshCw
} from 'lucide-react';
import KpiCard from '../components/KpiCard';
import TargetProgressBar from '../components/TargetProgressBar';
import ReminderWidget from '../components/ReminderWidget';
import FollowupsDrawer from '../components/FollowupsDrawer';
import QuickActionsBar from '../components/QuickActionsBar';
import SelectField from '../../../shared/components/elements/SelectField';
import Button from '../../../shared/components/elements/Button';
import PageHeader from '../../../shared/components/modules/PageHeader';
import { useDashboardMetrics, useKpiTargets, useCallQueue } from '../hooks/useRoleDashboard';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';

const PERIOD_OPTIONS = [
  { id: 'ALL', name: 'All Time' },
  { id: 'MONTHLY', name: 'This Month' },
  { id: 'QUARTERLY', name: 'This Quarter' },
  { id: 'YEARLY', name: 'This Year' },
];

const IseDashboardView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('MONTHLY');
  const [followupDrawerOpen, setFollowupDrawerOpen] = useState(false);
  const [followupFilter, setFollowupFilter]         = useState('today');
  const params = { rankingPeriod: period, companyId: user?.companyId };

  const { data: metrics = {}, isLoading, isFetching, refetch } = useDashboardMetrics(params);
  const { data: kpis = [], isLoading: kl } = useKpiTargets(params);
  const { data: callQueue = [], isLoading: ql } = useCallQueue(params);

  const revenueTitle =
    period === 'ALL'       ? 'Total Revenue' :
    period === 'QUARTERLY' ? 'Quarterly Revenue' :
    period === 'YEARLY'    ? 'Yearly Revenue' :
                             'Monthly Revenue';

  const scrollToCallQueue = () => {
    const el = document.getElementById('call-queue-widget');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      navigate('/leads');
    }
  };

  const KPI_CARDS = [
    { icon: Layers, title: 'Assigned Leads', value: metrics.assignedLeads, color: 'blue', onClick: () => navigate('/leads') },
    {
      icon: Phone,
      title: 'Calls Today',
      value: metrics.callsCompletedToday,
      color: 'emerald',
      onClick: scrollToCallQueue,
      badges: [
        { label: '❄️ Cold', value: metrics.coldCallsToday || 0, color: 'sky' },
        { label: '🔄 Follow-up', value: metrics.followupCallsToday || 0, color: 'indigo' },
        { label: '✕ Missed', value: metrics.notReceivedCallsToday || 0, color: 'rose' },
      ],
    },
    { icon: Clock, title: "Today's Follow-ups", value: metrics.followupsToday, color: 'sky', onClick: () => { setFollowupFilter('today'); setFollowupDrawerOpen(true); } },
    { icon: CheckCircle, title: 'Qualified Leads', value: metrics.qualifiedLeads, color: 'orange', onClick: () => navigate('/leads?isQualified=true') },
    { icon: Calendar, title: 'Pending Follow-ups', value: metrics.pendingFollowups, color: 'purple', onClick: () => { setFollowupFilter('overdue'); setFollowupDrawerOpen(true); } },
    { icon: TrendingUp, title: revenueTitle, value: metrics.revenue ?? metrics.monthlyRevenue ?? 0, prefix: '₹', color: 'rose', onClick: () => navigate('/my-performance') },
  ];

  return (
    <div className=" max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      <PageHeader
        title="My Dashboard"
        description="Daily call workbench"
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
            <QuickActionsBar actions={['add_lead', 'followup']} />
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {KPI_CARDS.map(card => <KpiCard key={card.title} {...card} isLoading={isLoading} />)}
      </div>

      {/* Call Queue */}
      {callQueue.length > 0 && (
        <div id="call-queue-widget" className="bg-white border border-slate-200 shadow-sm p-5 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <Phone size={15} className="text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-700">Call Queue</h3>
            <span className="ml-auto text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-2 py-0.5">
              {callQueue.length} pending
            </span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {callQueue.map(f => (
              <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100">
                <div className="flex h-8 w-8 items-center justify-center bg-emerald-50">
                  <Phone size={14} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{f.lead?.name ?? 'Unknown'}</p>
                  <p className="text-[10px] text-slate-400">{f.lead?.mobile ?? '—'}</p>
                </div>
                <p className="text-[10px] text-slate-400 whitespace-nowrap">
                  {f.lead?.interestedFor ?? '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Targets */}
      {kpis.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-3">My Targets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {kpis.map(kpi => <TargetProgressBar key={kpi.id} kpi={kpi} isLoading={kl} />)}
          </div>
        </div>
      )}

      <ReminderWidget />

      {/* Follow-up Drawer triggered by Follow-up KPI cards */}
      <FollowupsDrawer
        isOpen={followupDrawerOpen}
        onClose={() => setFollowupDrawerOpen(false)}
        initialFilter={followupFilter}
      />
    </div>
  );
};

export default IseDashboardView;
