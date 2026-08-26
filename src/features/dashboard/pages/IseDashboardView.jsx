// crm-web/src/features/dashboard/pages/IseDashboardView.jsx
import {
  Layers, Phone, CheckCircle, Calendar,
  Clock, TrendingUp, LayoutDashboard
} from 'lucide-react';
import KpiCard from '../components/KpiCard';
import TargetProgressBar from '../components/TargetProgressBar';
import ReminderWidget from '../components/ReminderWidget';
import QuickActionsBar from '../components/QuickActionsBar';
import PageHeader from '../../../shared/components/modules/PageHeader';
import { useDashboardMetrics, useKpiTargets, useCallQueue } from '../hooks/useRoleDashboard';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';

const IseDashboardView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = { rankingPeriod: 'MONTHLY', companyId: user?.companyId };

  const { data: realMetrics = {}, isLoading } = useDashboardMetrics(params);
  const { data: realKpis = [], isLoading: kl } = useKpiTargets(params);
  const { data: realCallQueue = [], isLoading: ql } = useCallQueue(params);

  // --- DUMMY DATA FOR ISE DASHBOARD ---
  const dummyMetrics = {
    assignedLeads: 85,
    callsCompletedToday: 42,
    followupsToday: 18,
    qualifiedLeads: 24,
    pendingFollowups: 6,
    revenue: 45000,
  };

  const dummyKpis = [
    { id: 1, kpiType: 'CALLS_TARGET', targetValue: 100, achievedValue: 42 },
    { id: 2, kpiType: 'CONVERSION_TARGET', targetValue: 20, achievedValue: 5 },
  ];

  const dummyCallQueue = [
    { id: 1, lead: { name: 'Rahul Sharma', mobile: '+91 9876543210', interestedFor: 'Premium Plan' } },
    { id: 2, lead: { name: 'Priya Singh', mobile: '+91 8765432109', interestedFor: 'Basic Plan' } },
    { id: 3, lead: { name: 'Amit Verma', mobile: '+91 7654321098', interestedFor: 'Pro Plan' } },
  ];

  const metrics = Object.keys(realMetrics).length > 0 ? realMetrics : dummyMetrics;
  const kpis = realKpis.length > 0 ? realKpis : dummyKpis;
  const callQueue = realCallQueue.length > 0 ? realCallQueue : dummyCallQueue;
  // ------------------------------------

  const KPI_CARDS = [
    { icon: Layers, title: 'Assigned Leads', value: metrics.assignedLeads, color: 'blue' },
    { icon: Phone, title: 'Calls Today', value: metrics.callsCompletedToday, color: 'emerald' },
    { icon: Clock, title: "Today's Follow-ups", value: metrics.followupsToday, color: 'sky' },
    { icon: CheckCircle, title: 'Qualified Leads', value: metrics.qualifiedLeads, color: 'orange' },
    { icon: Calendar, title: 'Pending Follow-ups', value: metrics.pendingFollowups, color: 'purple' },
    { icon: TrendingUp, title: 'Revenue', value: metrics.revenue, prefix: '₹', color: 'rose' },
  ];

  return (
    <div className=" max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      <PageHeader
        title="My Dashboard"
        description="Daily call workbench"
        icon={LayoutDashboard}
        actions={<QuickActionsBar actions={['add_lead', 'followup']} />}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {KPI_CARDS.map(card => <KpiCard key={card.title} {...card} isLoading={isLoading} />)}
      </div>

      {/* Call Queue */}
      {callQueue.length > 0 && (
        <div className="bg-white border border-slate-100  p-5">
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
    </div>
  );
};

export default IseDashboardView;
