// src/features/teams/components/AssignToISEDrawer.jsx
//
// Clean BDE assignment drawer. Selects ISE from built-in SelectField dropdown.
// Daily limit is read dynamically from the branch settings (e.g. 30, 50, 100).
// On Assign click, if the limit is reached, a dynamic toast alert is displayed.

import React, { useState } from 'react';
import {
  UserCheck,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ClipboardList,
} from 'lucide-react';
import Drawer from '../../../shared/components/elements/Drawer';
import Button from '../../../shared/components/elements/Button';
import SelectField from '../../../shared/components/elements/SelectField';
import { toast } from '../../../shared/utils/toast';
import { useISEDailyStatsQuery, useBdeAssignLeadMutation } from '../hooks/useTeams';

const AssignToISEDrawer = ({ isOpen, onClose, teamId, leads = [], onSuccess }) => {
  const [selectedISEId, setSelectedISEId] = useState('');
  const [notes, setNotes] = useState('');

  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
    isError: statsError,
  } = useISEDailyStatsQuery(teamId, { enabled: isOpen && !!teamId });

  const assignMutation = useBdeAssignLeadMutation();

  const memberStats = statsData?.memberStats || [];
  // Dynamic branch daily limit (e.g., 20, 30, 50, 100) — fallback to 50 if unconfigured
  const maxLimit = statsData?.maxLimit ?? 50;

  const handleClose = () => {
    setSelectedISEId('');
    setNotes('');
    onClose();
  };

  const handleAssign = async () => {
    if (!selectedISEId || leads.length === 0) return;

    const selectedMember = memberStats.find(m => Number(m.userId) === Number(selectedISEId));

    // Dynamic daily limit check on assign button click
    if (selectedMember && selectedMember.todayCount >= maxLimit) {
      toast.error(
        `${selectedMember.name} has reached their daily limit (${selectedMember.todayCount}/${maxLimit}). Cannot assign lead to them.`
      );
      return;
    }

    try {
      for (const lead of leads) {
        await assignMutation.mutateAsync({
          teamId,
          leadId: lead.id,
          assignedToId: Number(selectedISEId),
          notes: notes.trim() || undefined,
        });
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      // Backend error toast handles rejection; drawer stays open for retry or alternative selection
    }
  };

  const selectedMember = memberStats.find(m => Number(m.userId) === Number(selectedISEId));
  const canSubmit = !!selectedISEId && !assignMutation.isPending && leads.length > 0;

  const drawerSubtitle = leads.length === 1
    ? leads[0]?.name || 'Selected lead'
    : `${leads.length} leads selected`;

  // Clean dropdown options without cluttered numbers
  const selectOptions = memberStats.map(m => ({
    value: String(m.userId),
    label: `${m.name} (${m.memberRole || 'ISE'})`
  }));

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

        {/* Clean SelectField Dropdown for selecting ISE Member */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-bold text-slate-700">
              Select ISE Member <span className="text-orange-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => refetchStats()}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              title="Refresh stats"
            >
              <RefreshCw size={12} className={statsLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <SelectField
            id="iseMemberSelect"
            value={selectedISEId}
            onChange={(val) => setSelectedISEId(val)}
            options={selectOptions}
            placeholder="Choose an ISE team member..."
            isLoading={statsLoading}
            disabled={statsLoading || selectOptions.length === 0}
            allowEmptyOption={true}
          />

          {statsError && !statsLoading && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-700 text-[12px] font-semibold">
              <AlertTriangle size={14} />
              Could not load ISE member list. Please refresh.
            </div>
          )}

          {!statsLoading && memberStats.length === 0 && (
            <p className="text-xs text-amber-600 font-medium">No active ISE members found in your team.</p>
          )}
        </div>

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
