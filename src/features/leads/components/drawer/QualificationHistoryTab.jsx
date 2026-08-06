import React from 'react';
import { useLeadQualificationHistoryQuery } from '../../hooks/useQualification';
import { Target, CheckCircle, Clock } from 'lucide-react';
import CircularProgress from '@mui/material/CircularProgress';

const QualificationHistoryTab = ({ leadId }) => {
  const { data: history, isLoading } = useLeadQualificationHistoryQuery(leadId);

  if (isLoading) {
    return <div className="flex justify-center py-10"><CircularProgress size={24} /></div>;
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Target size={40} className="mb-4 text-slate-300" />
        <p className="text-sm">No qualification history available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2 pl-3 pr-1">
      {history.map((log, idx) => (
        <div key={log.id} className="relative pl-7 pb-6 border-l-2 border-slate-100 last:border-0 last:pb-0 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
          <div className="absolute -left-[11px] top-0 bg-white p-1 rounded-full border-2 border-orange-500 shadow-sm">
            <CheckCircle size={14} className="text-orange-500" />
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm shadow-slate-100/50 hover:shadow-md hover:border-slate-200 transition-all duration-200">
            <div className="flex justify-between items-start mb-3 gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500 tracking-wide uppercase">
                  <span>{log.previousStatus || 'UNQUALIFIED'}</span>
                  <span className="text-slate-300">➔</span>
                  <span className={
                    log.newStatus === 'QUALIFIED' ? 'text-emerald-600' :
                    log.newStatus === 'ON_HOLD' ? 'text-amber-600' :
                    'text-rose-600'
                  }>
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
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                })}
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-50 text-xs text-slate-600 mb-3 leading-relaxed">
              <span className="font-semibold text-slate-700 uppercase tracking-wider text-[9px] block mb-1">Remarks</span>
              {log.remarks || 'No remarks provided.'}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Evaluated by</span>
              <span className="text-slate-600">{log.changedBy?.name || 'System'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QualificationHistoryTab;
