// crm-web/src/features/dashboard/components/LeadAgingWidget.jsx
import { AlertTriangle } from 'lucide-react';

const BUCKETS = [
  { key: '0-3',   label: '0–3 Days',   color: 'bg-emerald-400', text: 'text-emerald-600' },
  { key: '4-7',   label: '4–7 Days',   color: 'bg-amber-400',   text: 'text-amber-600'   },
  { key: '8-15',  label: '8–15 Days',  color: 'bg-orange-400',  text: 'text-orange-600'  },
  { key: '16-30', label: '16–30 Days', color: 'bg-red-400',     text: 'text-red-600'     },
  { key: '30+',   label: '30+ Days',   color: 'bg-rose-600',    text: 'text-rose-700'    },
];

const LeadAgingWidget = ({ data = {}, isLoading = false }) => {
  const total = Object.values(data).reduce((s, v) => s + (v || 0), 0);

  return (
    <section aria-label="Lead Aging" className="bg-white border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={15} className="text-amber-500" />
        <h3 className="text-sm font-bold text-slate-700">Active Lead Aging</h3>
        {data['30+'] > 0 && (
          <span className="ml-auto text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-full px-2 py-0.5">
            {data['30+']} overdue
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {BUCKETS.map(b => (
            <div key={b.key} className="animate-pulse bg-slate-100 h-8" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {BUCKETS.map(({ key, label, color, text }) => {
            const count = data[key] ?? 0;
            const pct   = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={key}>
                <div className="flex justify-between mb-0.5">
                  <p className="text-[11px] font-medium text-slate-600">{label}</p>
                  <p className={`text-[11px] font-bold ${text}`}>{count}</p>
                </div>
                <div className="w-full bg-slate-100 h-1.5">
                  <div
                    className={`h-1.5 ${color} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default LeadAgingWidget;
