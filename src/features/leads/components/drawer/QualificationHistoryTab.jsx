import React, { useState } from 'react';
import { useLeadQualificationHistoryQuery } from '../../hooks/useQualification';
import { Target, CheckCircle, Clock, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import CircularProgress from '@mui/material/CircularProgress';

const QualificationHistoryTab = ({ leadId }) => {
  const { data: history, isLoading } = useLeadQualificationHistoryQuery(leadId);
  const [expandedLogId, setExpandedLogId] = useState(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <CircularProgress size={24} />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Target size={40} className="mb-4 text-slate-300" />
        <p className="text-sm font-semibold">No qualification history records available.</p>
      </div>
    );
  }

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="space-y-4 pt-2 pl-3 pr-1">
      {history.map((log, idx) => {
        const isExpanded = expandedLogId === log.id;
        const snapshot = Array.isArray(log.criteriaSnapshot) ? log.criteriaSnapshot : null;

        return (
          <div
            key={log.id}
            className="relative pl-7 pb-6 border-l-2 border-slate-100 last:border-0 last:pb-0 animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
          >
            <div className="absolute -left-[11px] top-0 bg-white p-1 rounded-full border-2 border-orange-500 shadow-xs">
              <CheckCircle size={14} className="text-orange-500" />
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs shadow-slate-100/50 hover:shadow-md hover:border-slate-200 transition-all duration-200">
              <div className="flex justify-between items-start mb-3 gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-extrabold text-slate-500 tracking-wide uppercase">
                    <span>{log.previousStatus || 'UNQUALIFIED'}</span>
                    <span className="text-slate-300">➔</span>
                    <span
                      className={
                        log.newStatus === 'QUALIFIED'
                          ? 'text-emerald-600'
                          : log.newStatus === 'ON_HOLD'
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }
                    >
                      {log.newStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100/50 text-[11px] font-black text-indigo-700 tracking-tight">
                    <Target size={12} className="text-indigo-500" />
                    {log.score}/100
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold bg-slate-50 px-2 py-1 rounded-md shrink-0">
                  <Clock size={11} className="text-slate-400" />
                  {new Date(log.changedAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-50 text-xs text-slate-600 mb-3 leading-relaxed">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[9px] block mb-1">
                  Remarks / Context
                </span>
                {log.remarks || 'No remarks provided.'}
              </div>

              {/* Frozen Criteria Snapshot Breakdown (Edge Case 1) */}
              {snapshot && snapshot.length > 0 && (
                <div className="mt-2 border-t border-slate-100 pt-2">
                  <button
                    onClick={() => toggleExpand(log.id)}
                    className="flex items-center justify-between w-full text-[10px] font-extrabold text-slate-500 hover:text-slate-700 py-1 transition-colors"
                  >
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      Frozen Criteria Matrix ({snapshot.length} factors)
                    </span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 grid grid-cols-1 gap-1.5 text-[10px] animate-in fade-in duration-200">
                      {snapshot.map((c) => (
                        <div key={c.key} className="flex justify-between items-center text-slate-600">
                          <span className="font-semibold">{c.label}</span>
                          <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-bold">
                            Max +{c.maxPoints} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-2.5">
                <span>Evaluated by</span>
                <span className="text-slate-600 font-bold">
                  {log.changedBy?.name ||
                    [log.changedBy?.firstName, log.changedBy?.lastName].filter(Boolean).join(' ') ||
                    'System'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QualificationHistoryTab;
