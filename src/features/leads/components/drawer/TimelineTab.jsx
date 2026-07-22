// src/features/leads/components/drawer/TimelineTab.jsx

import React from 'react';
import { useLeadTimelineQuery } from '../../hooks/useLeads';

/**
 * TimelineTab — Displays historical audit logs and activity events for a lead.
 *
 * @param {Object} props
 * @param {number} props.leadId - ID of the target lead
 */
const TimelineTab = ({ leadId }) => {
  const { data: timelineRes, isLoading } = useLeadTimelineQuery(leadId);
  const timeline = timelineRes?.data?.timeline || timelineRes?.timeline || timelineRes || [];

  if (isLoading) return <div className="py-4 text-center text-xs text-slate-400">Loading history...</div>;

  const getTimelineIconConfig = (action) => {
    switch (action) {
      case 'CREATE': return { color: 'bg-emerald-500', ring: 'ring-emerald-50' };
      case 'DELETE': return { color: 'bg-red-500', ring: 'ring-red-50' };
      case 'RESTORE': return { color: 'bg-teal-500', ring: 'ring-teal-50' };
      case 'STAGE_CHANGE': return { color: 'bg-blue-500', ring: 'ring-blue-50' };
      case 'UPDATE': return { color: 'bg-indigo-500', ring: 'ring-indigo-50' };
      case 'NOTE_ADD': return { color: 'bg-amber-500', ring: 'ring-amber-50' };
      case 'NOTE_UPDATE': return { color: 'bg-amber-600', ring: 'ring-amber-50' };
      case 'NOTE_DELETE': return { color: 'bg-rose-500', ring: 'ring-rose-50' };
      default: return { color: 'bg-slate-400', ring: 'ring-slate-50' };
    }
  };

  const getActionLabel = (action, oldValue, newValue) => {
    switch (action) {
      case 'CREATE': return 'created the lead';
      case 'UPDATE': {
        try {
          const oldObj = JSON.parse(oldValue || '{}');
          const newObj = JSON.parse(newValue || '{}');
          const changes = [];
          if (newObj.statusId !== oldObj.statusId || (newObj.status && oldObj.status && newObj.status.name !== oldObj.status.name)) {
            changes.push(`changed status to "${newObj.status?.name || 'Unknown'}"`);
          }
          if (newObj.assignedToId !== oldObj.assignedToId || (newObj.assignedTo && oldObj.assignedTo && newObj.assignedTo.name !== oldObj.assignedTo.name)) {
            changes.push(`reassigned lead to ${newObj.assignedTo?.name || 'nobody'}`);
          }
          if (newObj.stageId !== oldObj.stageId || (newObj.stage && oldObj.stage && newObj.stage.name !== oldObj.stage.name)) {
            changes.push(`moved stage to "${newObj.stage?.name || 'Unknown'}"`);
          }
          if (changes.length > 0) {
            return changes.join(' and ');
          }
        } catch (e) {
          // fallback
        }
        return 'updated lead details';
      }
      case 'DELETE': return 'soft-deleted the lead';
      case 'RESTORE': return 'restored the lead';
      case 'STAGE_CHANGE': return 'moved lead stage';
      case 'NOTE_ADD': {
        try {
          const newObj = JSON.parse(newValue || '{}');
          if (newObj.text) {
            return `added a note: "${newObj.text}"`;
          }
        } catch (e) {}
        return 'added a note';
      }
      case 'NOTE_UPDATE': {
        try {
          const newObj = JSON.parse(newValue || '{}');
          if (newObj.text) {
            return `updated a note to: "${newObj.text}"`;
          }
        } catch (e) {}
        return 'updated a note';
      }
      case 'NOTE_DELETE': return 'deleted a note';
      default: return `performed ${action}`;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px] custom-scrollbar text-xs pr-1 py-1">
      {timeline.length === 0 ? (
        <p className="text-xs text-center text-slate-400 py-6">No history logs found.</p>
      ) : (
        timeline.map((log) => {
          const config = getTimelineIconConfig(log.action);
          return (
            <div key={log.id} className="flex gap-4 items-start border-l border-slate-100 pl-4 ml-2.5 relative">
              <span className={`w-2.5 h-2.5 rounded-full ${config.color} border-2 border-white ring-4 ${config.ring} absolute -left-[5px] top-2 transition-all duration-300`} />
              
              <div className="flex-1 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-3 rounded-2xl transition-all duration-200">
                <p className="text-slate-700 leading-relaxed font-medium">
                  <span className="font-bold text-slate-800">{log.performedBy?.name || 'System'}</span>{' '}
                  {getActionLabel(log.action, log.oldValue, log.newValue)}
                </p>
                <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                  {new Date(log.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default TimelineTab;
