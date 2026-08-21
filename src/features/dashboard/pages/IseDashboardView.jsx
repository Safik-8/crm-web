// crm-web/src/features/dashboard/pages/IseDashboardView.jsx
import {
  Layers, Phone, CheckCircle, Calendar,
  Clock, TrendingUp,
} from 'lucide-react';
import KpiCard            from '../components/KpiCard';
import TargetProgressBar  from '../components/TargetProgressBar';
import ReminderWidget     from '../components/ReminderWidget';
import QuickActionsBar    from '../components/QuickActionsBar';
import { useDashboardMetrics, useKpiTargets, useCallQueue } from '../hooks/useRoleDashboard';
import { useAuth }        from '../../../app/providers/AuthProvider';
import { useNavigate }    from 'react-router-dom';

const IseDashboardView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params   = { rankingPeriod: 'MONTHLY', companyId: user?.companyId };

  const { data: metrics = {}, isLoading }       = useDashboardMetrics(params);
  const { data: kpis    = [], isLoading: kl }   = useKpiTargets(params);
  const { data: callQueue = [], isLoading: ql } = useCallQueue(params);

  const KPI_CARDS = [
    { icon: Layers,      title: 'Assigned Leads',    value: metrics.assignedLeads,       color: 'blue'    },
    { icon: Phone,       title: 'Calls Today',        value: metrics.callsCompletedToday, color: 'emerald' },
    { icon: Clock,         title: "Today's Follow-ups",value: metrics.followupsToday,      color: 'sky'     },
    { icon: CheckCircle, title: 'Qualified Leads',    value: metrics.qualifiedLeads,      color: 'orange'  },
    { icon: Calendar,    title: 'Pending Follow-ups', value: metrics.pendingFollowups,    color: 'purple'  },
    { icon: TrendingUp,  title: 'Revenue',            value: metrics.revenue,            prefix: '₹', color: 'rose' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">My Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Daily call workbench</p>
        </div>
        <QuickActionsBar actions={['add_lead', 'followup']} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {KPI_CARDS.map(card => <KpiCard key={card.title} {...card} isLoading={isLoading} />)}
      </div>

      {/* Call Queue */}
      {callQueue.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Phone size={15} className="text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-700">Call Queue</h3>
            <span className="ml-auto text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-2 py-0.5">
              {callQueue.length} pending
            </span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {callQueue.map(f => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
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

      <ReminderWidget onViewFollowups={() => navigate('/leads')} />
    </div>
  );
};

export default IseDashboardView;
