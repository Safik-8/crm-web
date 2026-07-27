// src/features/leads/components/drawer/StageHistoryTab.jsx

import React, { useState, useEffect } from 'react';
import { getLeadPipelineHistory } from '../../services/leadService';

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

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await getLeadPipelineHistory(leadId);
        const list = res?.data?.history || res?.history || [];
        if (isMounted) setHistory(list);
      } catch (err) {
        if (isMounted) setError(err?.message || 'Failed to load stage history');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHistory();
    return () => { isMounted = false; };
  }, [leadId]);

  if (loading) return <div className="py-6 text-center text-xs text-slate-400">Loading stage movement history...</div>;
  if (error) return <div className="py-6 text-center text-xs text-red-500">{error}</div>;
  if (history.length === 0) return <div className="py-6 text-center text-xs text-slate-400">No stage history recorded yet.</div>;

  return (
    <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px] custom-scrollbar text-xs pr-1 py-1">
      {history.map((item) => (
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
      ))}
    </div>
  );
};

export default StageHistoryTab;
