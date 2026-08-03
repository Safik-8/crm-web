// src/features/leads/components/drawer/TimelineTab.jsx

import React, { useState } from 'react';
import { useLeadTimelineQuery } from '../../hooks/useLeads';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { useUsersQuery } from '../../../users/hooks/useUsers';
import { RotateCcw, RotateCw } from 'lucide-react';
import { SearchableSelect } from '../../../../shared/components/elements/SearchableSelect';

/**
 * TimelineTab — Displays historical audit logs and activity events for a lead with filtering capabilities.
 *
 * @param {Object} props
 * @param {number} props.leadId - ID of the target lead
 * @param {number} [props.branchId] - Branch ID to scope user filters
 */
const TimelineTab = ({ leadId, branchId }) => {
  const { user: currentUser } = useAuth();
  
  // Filter states
  const [activityType, setActivityType] = useState('');
  const [performedById, setPerformedById] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Fetch users for filter dropdown options (scoped to the lead's branch)
  const { data: usersData } = useUsersQuery({
    companyId: currentUser?.companyId,
    branchId: branchId || undefined,
    limit: 1000
  });
  const users = usersData?.data?.users || usersData?.users || [];

  const datesSelected = dateFrom && dateTo;
  const { data: timelineRes, isLoading, refetch } = useLeadTimelineQuery(leadId, {
    activityType,
    performedById,
    ...(datesSelected ? { dateFrom, dateTo } : {})
  });

  const timeline = timelineRes?.data?.timeline || timelineRes?.timeline || timelineRes || [];

  const handleResetFilters = () => {
    setActivityType('');
    setPerformedById('');
    setDateFrom('');
    setDateTo('');
  };

  const getTimelineIconConfig = (action) => {
    switch (action) {
      case 'CREATED':
      case 'CREATE': return { color: 'bg-emerald-500', ring: 'ring-emerald-50' };
      case 'DELETE': return { color: 'bg-red-500', ring: 'ring-red-50' };
      case 'RESTORED':
      case 'RESTORE': return { color: 'bg-teal-500', ring: 'ring-teal-50' };
      case 'STAGE_CHANGE': return { color: 'bg-blue-500', ring: 'ring-blue-50' };
      case 'UPDATED':
      case 'UPDATE': return { color: 'bg-indigo-500', ring: 'ring-indigo-50' };
      case 'NOTE_ADD': return { color: 'bg-amber-500', ring: 'ring-amber-50' };
      case 'NOTE_UPDATE': return { color: 'bg-amber-600', ring: 'ring-amber-50' };
      case 'NOTE_DELETE': return { color: 'bg-rose-500', ring: 'ring-rose-50' };
      case 'FOLLOWUP_CREATED':   return { color: 'bg-cyan-500',    ring: 'ring-cyan-50' };
      case 'FOLLOWUP_UPDATED':   return { color: 'bg-sky-500',     ring: 'ring-sky-50' };
      case 'FOLLOWUP_COMPLETED': return { color: 'bg-emerald-600', ring: 'ring-emerald-50' };
      case 'FOLLOWUP_CANCELLED': return { color: 'bg-gray-400',    ring: 'ring-gray-50' };
      case 'FOLLOWUP_MISSED':    return { color: 'bg-rose-400',    ring: 'ring-rose-50' };
      case 'FOLLOWUP_DELETED':   return { color: 'bg-red-400',     ring: 'ring-red-50' };
      case 'ASSIGNED': return { color: 'bg-sky-500', ring: 'ring-sky-50' };
      case 'REASSIGNED': return { color: 'bg-violet-500', ring: 'ring-violet-50' };
      case 'COMMUNICATION_LOGGED': return { color: 'bg-orange-500', ring: 'ring-orange-50' };
      case 'COMMUNICATION_DELETED': return { color: 'bg-zinc-500', ring: 'ring-zinc-50' };
      default: return { color: 'bg-slate-400', ring: 'ring-slate-50' };
    }
  };

  const getActionLabel = (action, oldValue, newValue) => {
    switch (action) {
      case 'CREATE':
      case 'CREATED': return 'created the lead';
      case 'UPDATE':
      case 'UPDATED': {
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
      case 'RESTORE':
      case 'RESTORED': return 'restored the lead';
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
      case 'FOLLOWUP_CREATED':   return 'scheduled a follow-up';
      case 'FOLLOWUP_UPDATED':   return 'rescheduled a follow-up';
      case 'FOLLOWUP_COMPLETED': return 'completed a follow-up';
      case 'FOLLOWUP_CANCELLED': return 'cancelled a follow-up';
      case 'FOLLOWUP_MISSED':    return 'missed a follow-up';
      case 'FOLLOWUP_DELETED':   return 'deleted a follow-up';
      case 'ASSIGNED': return 'assigned the lead';
      case 'REASSIGNED': return 'reassigned the lead';
      case 'COMMUNICATION_LOGGED': return 'logged a communication interaction';
      case 'COMMUNICATION_DELETED': return 'deleted a communication log';
      default: return `performed ${action}`;
    }
  };

  const activityTypes = [
    { value: 'CREATED', label: 'Lead Created' },
    { value: 'UPDATED', label: 'Details Updated' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'REASSIGNED', label: 'Reassigned' },
    { value: 'STAGE_CHANGE', label: 'Stage Changed' },
    { value: 'NOTE_ADD', label: 'Note Added' },
    { value: 'NOTE_UPDATE', label: 'Note Updated' },
    { value: 'NOTE_DELETE', label: 'Note Deleted' },
    { value: 'COMMUNICATION_LOGGED', label: 'Communication Logged' },
    { value: 'COMMUNICATION_DELETED', label: 'Communication Deleted' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full space-y-4">
      {/* Dynamic Filter Header */}
      <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex flex-col gap-2.5 text-xs">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-0.5">Filters & Controls</span>
          <button 
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center disabled:opacity-50"
            title="Refresh timeline log"
          >
            <RotateCw size={12} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          {/* Activity Type Filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">Activity Type</span>
            <SearchableSelect
              options={activityTypes.map(t => ({ id: t.value, name: t.label }))}
              value={activityType}
              onChange={(val) => setActivityType(val)}
              placeholder="All Types"
              allowEmptyOption={true}
              searchable={true}
            />
          </div>

          {/* Performed By Filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">Performed By</span>
            <SearchableSelect
              options={users.map(u => ({ id: u.id, name: u.name }))}
              value={performedById}
              onChange={(val) => setPerformedById(val)}
              placeholder="All Users"
              allowEmptyOption={true}
              searchable={true}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Date From */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">From Date</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full text-[13px] px-3.5 py-2.5 border border-[#E2E8F0] rounded-[10px] focus:outline-none focus:border-[#F86F03] focus:ring-3 focus:ring-[#F86F03]/14 bg-[#F8FAFC] hover:bg-[#F1F5F9] hover:border-[#CBD5E1] text-slate-700 font-medium transition-all"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">To Date</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full text-[13px] px-3.5 py-2.5 border border-[#E2E8F0] rounded-[10px] focus:outline-none focus:border-[#F86F03] focus:ring-3 focus:ring-[#F86F03]/14 bg-[#F8FAFC] hover:bg-[#F1F5F9] hover:border-[#CBD5E1] text-slate-700 font-medium transition-all"
            />
          </div>
        </div>

        {(activityType || performedById || dateFrom || dateTo) && (
          <div className="flex justify-end border-t border-slate-200/60 pt-2">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-orange-500 transition-colors font-semibold"
            >
              <RotateCcw size={10} />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Chronological activity feed */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 custom-scrollbar text-xs pr-1 py-1">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RotateCw size={18} className="animate-spin text-orange-500" />
            <span className="font-semibold text-slate-500">Loading timeline logs...</span>
          </div>
        ) : timeline.length === 0 ? (
          <p className="text-xs text-center text-slate-400 py-6">No history logs found matching these filters.</p>
        ) : (
          timeline.map((log) => {
            const config = getTimelineIconConfig(log.activityType || log.action);
            return (
              <div key={log.id} className="flex gap-4 items-start border-l border-slate-100 pl-4 ml-2.5 relative">
                <span className={`w-2.5 h-2.5 rounded-full ${config.color} border-2 border-white ring-4 ${config.ring} absolute -left-[5px] top-2 transition-all duration-300`} />
                
                <div className="flex-1 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-3 rounded-2xl transition-all duration-200">
                  <p className="text-slate-700 leading-relaxed font-medium">
                    <span className="font-bold text-slate-800">{log.performedBy?.name || 'System'}</span>{' '}
                    {log.description || getActionLabel(log.activityType || log.action, log.oldValue, log.newValue)}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                    {new Date(log.performedAt || log.createdAt).toLocaleString('en-IN', {
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
    </div>
  );
};

export default TimelineTab;
