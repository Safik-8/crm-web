// crm-web/src/features/dashboard/components/ActivityFeedWidget.jsx
import { Activity, User } from 'lucide-react';

const ActivityFeedWidget = ({ activities = [], isLoading = false }) => {
  return (
    <section aria-label="Recent Activities" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={15} className="text-blue-500" />
        <h3 className="text-sm font-bold text-slate-700">Recent Activities</h3>
        <span className="ml-auto text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5">
          Live Feed
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-100 rounded-xl h-12" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400">
          No recent activities found.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {activities.map((act) => (
            <div key={act.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-slate-700 truncate">
                  {act.lead?.name || 'Unknown Lead'}
                </p>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(act.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-slate-600 mt-1">
                {act.description || act.activityType?.replace(/_/g, ' ')}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1.5">
                <User size={10} />
                <span>{act.performedBy?.name || 'System'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ActivityFeedWidget;
