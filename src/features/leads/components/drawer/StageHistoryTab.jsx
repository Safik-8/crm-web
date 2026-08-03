// src/features/leads/components/drawer/StageHistoryTab.jsx

import React, { useState, useEffect } from 'react';
import { getLeadPipelineHistory } from '../../services/leadService';
import { RotateCw } from 'lucide-react';

/**
 * StageHistoryTab — Audits stage movements for a lead (Sprint 4 Task 3).
 * Displays stage color badges, transition timestamps, performing user, and reason for lost deals.
 *
 * @param {Object} props
 * @param {number} props.leadId - ID of the target lead
 */
const StageHistoryTab = ({ leadId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLeadPipelineHistory(leadId);
      const list = res?.data?.history || res?.history || [];
      setHistory(list);
    } catch (err) {
      setError(err?.message || 'Failed to load stage history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [leadId]);

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Header with manual refresh */}
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 shrink-0">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-0.5">Stage Movements</span>
        <button 
          type="button"
          onClick={fetchHistory}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center disabled:opacity-50"
          title="Refresh stage history"
        >
          <RotateCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* History timeline list */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 custom-scrollbar text-xs pr-1 py-1">
        {loading && history.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RotateCw size={18} className="animate-spin text-orange-500" />
            <span className="font-semibold text-slate-500">Loading stage history...</span>
          </div>
        ) : error ? (
          <div className="py-6 text-center text-xs text-red-500">{error}</div>
        ) : history.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">No stage history recorded yet.</div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="bg-slate-50/70 hover:bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-1.5 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white border border-slate-200/80 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.previousStage?.colorCode || '#94a3b8' }} />
                    {item.previousStage?.name || 'Prospect'}
                  </span>
                  <span className="text-slate-400 font-bold">→</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white border border-slate-200/80 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.newStage?.colorCode || '#f97316' }} />
                    {item.newStage?.name || 'Unknown'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {new Date(item.changedAt || item.createdAt).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                  })}
                </span>
              </div>
              {item.reason && (
                <p className="text-[11px] text-slate-600 italic bg-amber-50/70 border border-amber-200/60 px-2.5 py-1 rounded-xl">
                  Reason: {item.reason}
                </p>
              )}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
                <span>By <strong className="text-slate-700">{item.changedByUser?.name || 'System'}</strong></span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StageHistoryTab;
