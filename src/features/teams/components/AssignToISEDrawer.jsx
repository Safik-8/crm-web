// src/features/teams/components/AssignToISEDrawer.jsx
//
// BDE-scoped assignment drawer reusing shared UI Drawer and Button elements.

import React, { useState } from 'react';
import {
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Users2,
  ClipboardList,
} from 'lucide-react';
import Drawer from '../../../shared/components/elements/Drawer';
import Button from '../../../shared/components/elements/Button';
import { useISEDailyStatsQuery, useBdeAssignLeadMutation } from '../hooks/useTeams';

// ── Workload badge ────────────────────────────────────────────────────────────

const WorkloadBadge = ({ todayCount, maxLimit }) => {
  const pct = maxLimit > 0 ? todayCount / maxLimit : 0;
  const isFull = pct >= 1;

  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-700';
  let bgColor = 'bg-emerald-50';
  let borderColor = 'border-emerald-200';

  if (isFull) {
    barColor = 'bg-rose-500';
    textColor = 'text-rose-700';
    bgColor = 'bg-rose-50';
    borderColor = 'border-rose-200';
  } else if (pct >= 0.8) {
    barColor = 'bg-amber-500';
    textColor = 'text-amber-700';
    bgColor = 'bg-amber-50';
    borderColor = 'border-amber-200';
  }

  const widthPct = Math.min(pct * 100, 100);

  return (
    <div className={`flex flex-col gap-1 px-2.5 py-1.5 rounded-lg border ${bgColor} ${borderColor} min-w-[96px]`}>
      <span className={`text-[11px] font-black ${textColor} text-center tabular-nums`}>
        {todayCount}/{maxLimit}
      </span>
      <div className="w-full h-1.5 rounded-full bg-white/70 overflow-hidden border border-white/50">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <span className={`text-[9px] font-black ${textColor} text-center uppercase tracking-wider`}>
        {isFull ? 'FULL' : 'today'}
      </span>
    </div>
  );
};

// ── ISE option row ────────────────────────────────────────────────────────────

const ISEOptionRow = ({ member, isSelected, onSelect }) => {
  const atLimit = member.isAtLimit;

  return (
    <button
      type="button"
      onClick={() => !atLimit && onSelect(member.userId)}
      disabled={atLimit}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
        ${atLimit
          ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
          : isSelected
            ? 'bg-orange-50 border-orange-300 shadow-sm ring-1 ring-orange-200'
            : 'bg-white border-slate-200 hover:border-orange-200 hover:bg-orange-50/40 hover:shadow-sm'
        }
      `}
    >
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0
        ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
        {member.name?.charAt(0)?.toUpperCase() || '?'}
      </div>

      {/* Name + role */}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-bold truncate ${isSelected ? 'text-orange-700' : 'text-slate-800'}`}>
          {member.name}
        </p>
        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">ISE</p>
      </div>

      {/* Limit badge */}
      <WorkloadBadge todayCount={member.todayCount} maxLimit={member.maxLimit} />

      {/* Selection indicator */}
      {isSelected && !atLimit && (
        <CheckCircle2 size={18} className="text-orange-500 shrink-0" />
      )}
      {atLimit && (
        <AlertTriangle size={16} className="text-rose-400 shrink-0" />
      )}
    </button>
  );
};

// ── Main drawer ───────────────────────────────────────────────────────────────

const AssignToISEDrawer = ({ isOpen, onClose, teamId, leads = [], onSuccess }) => {
  const [selectedISEId, setSelectedISEId] = useState(null);
  const [notes, setNotes] = useState('');

  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
    isError: statsError,
  } = useISEDailyStatsQuery(teamId, { enabled: isOpen && !!teamId });

  const assignMutation = useBdeAssignLeadMutation();

  const memberStats = statsData?.memberStats || [];
  const maxLimit = statsData?.maxLimit ?? 50;

  const handleClose = () => {
    setSelectedISEId(null);
    setNotes('');
    onClose();
  };

  const handleAssign = async () => {
    if (!selectedISEId || leads.length === 0) return;

    try {
      for (const lead of leads) {
        await assignMutation.mutateAsync({
          teamId,
          leadId: lead.id,
          assignedToId: selectedISEId,
          notes: notes.trim() || undefined,
        });
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      // Keep drawer open on rejection so user can retry or select another ISE
    }
  };

  const selectedMember = memberStats.find(m => m.userId === selectedISEId);
  const canSubmit = !!selectedISEId && !assignMutation.isPending && leads.length > 0;

  const drawerSubtitle = leads.length === 1
    ? leads[0]?.name || 'Selected lead'
    : `${leads.length} leads selected`;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title="Assign to ISE"
      subtitle={drawerSubtitle}
    >
      <div className="space-y-5">
        {/* Bulk leads pill tags */}
        {leads.length > 1 && (
          <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
              Leads to assign
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-[72px] overflow-y-auto">
              {leads.map(l => (
                <span key={l.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-700 shadow-xs">
                  <ClipboardList size={10} className="text-slate-400" />
                  {l.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ISE selection list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Select ISE Member
            </p>
            <button
              type="button"
              onClick={() => refetchStats()}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              title="Refresh stats"
            >
              <RefreshCw size={12} className={statsLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {statsLoading && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[60px] rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          )}

          {statsError && !statsLoading && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-700 text-[12px] font-semibold">
              <AlertTriangle size={14} />
              Could not load ISE stats. Please refresh.
            </div>
          )}

          {!statsLoading && !statsError && memberStats.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Users2 size={32} className="text-slate-300" />
              <p className="text-[13px] font-bold text-slate-500">No active ISE members</p>
              <p className="text-[11px] text-slate-400">Add ISE members to your team first.</p>
            </div>
          )}

          {!statsLoading && memberStats.map(member => (
            <ISEOptionRow
              key={member.userId}
              member={member}
              isSelected={selectedISEId === member.userId}
              onSelect={setSelectedISEId}
            />
          ))}
        </div>

        {/* Limit legend info */}
        {!statsLoading && memberStats.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Badge shows leads received <span className="font-bold text-slate-700">today / daily limit ({maxLimit})</span>.
              ISEs at their limit are marked <span className="font-bold text-rose-600">FULL</span> and disabled — the limit cannot be overridden.
            </p>
          </div>
        )}

        {/* Optional assignment note */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Assignment Note <span className="text-slate-300 font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Add a note visible in the lead's timeline…"
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12px] text-slate-700 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
          />
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <Button
            variant="contained"
            disabled={!canSubmit}
            onClick={handleAssign}
            sx={{
              flex: 1,
              backgroundColor: canSubmit ? '#F86F03' : undefined,
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '12px',
              py: '10px',
              '&:hover': { backgroundColor: '#DE5D02' },
            }}
          >
            {assignMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Assigning…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserCheck size={14} />
                {leads.length > 1 ? `Assign ${leads.length} Leads` : 'Assign Lead'}
                {selectedMember ? ` → ${selectedMember.name.split(' ')[0]}` : ''}
              </span>
            )}
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default AssignToISEDrawer;
