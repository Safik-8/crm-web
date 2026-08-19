// src/features/teams/components/TeamLeadAssignModal.jsx

import React, { useState } from 'react';
import { X, UserCheck, Loader2, Users2, ClipboardList, CheckCircle2 } from 'lucide-react';
import Button from '../../../shared/components/elements/Button';
import { assignLeads } from '../../leads/services/leadService';
import Alert from '../../../shared/components/elements/Alert';

/**
 * TeamLeadAssignModal
 * 
 * Safe team-level manual lead assignment modal.
 * Uses ONLY POST /api/leads/assign.
 * Dropdown shows ONLY active members of the active team.
 */
const TeamLeadAssignModal = ({ isOpen, onClose, teamId, teamMembers = [], leads = [], onSuccess }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedUserId('');
    setNotes('');
    setErrorMsg(null);
    onClose();
  };

  // Filter active members only
  const activeMembers = teamMembers.filter(
    (m) => m.user && m.user.status === 'ACTIVE' && !m.removedAt
  );

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedUserId || leads.length === 0 || !teamId) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const leadIds = leads.map((l) => Number(l.id));
      const payload = {
        leadIds,
        teamId: Number(teamId),
        assignedToId: Number(selectedUserId),
        notes: notes.trim() || undefined,
      };

      await assignLeads(payload);

      setLoading(false);
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Failed to assign leads. Please try again.');
    }
  };

  const selectedMember = activeMembers.find((m) => Number(m.user?.id) === Number(selectedUserId));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[440px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 shrink-0 bg-slate-50/50">
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
            <UserCheck size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-black text-slate-900 leading-tight">Assign Lead to Team Member</h2>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5 truncate">
              {leads.length === 1
                ? leads[0]?.name || 'Selected Lead'
                : `${leads.length} leads selected`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lead Summary Pills */}
        {leads.length > 0 && (
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
              Leads to assign ({leads.length})
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-[72px] overflow-y-auto">
              {leads.map((l) => (
                <span
                  key={l.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-700 shadow-xs"
                >
                  <ClipboardList size={10} className="text-slate-400" />
                  {l.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleAssign} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {errorMsg && (
            <Alert variant="error" title="Assignment Error" message={errorMsg} />
          )}

          {/* Member Dropdown / List */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Select Active Team Member <span className="text-rose-500">*</span>
            </label>

            {activeMembers.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <Users2 size={32} className="text-slate-300" />
                <p className="text-[13px] font-bold text-slate-500">No active team members found</p>
                <p className="text-[11px] text-slate-400">Ensure users are assigned and active on this team.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {activeMembers.map((member) => {
                  const u = member.user;
                  const isSelected = Number(selectedUserId) === Number(u.id);

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUserId(u.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
                        ${isSelected
                          ? 'bg-orange-50 border-orange-300 shadow-sm ring-1 ring-orange-200'
                          : 'bg-white border-slate-200 hover:border-orange-200 hover:bg-orange-50/40'
                        }
                      `}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0
                        ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-bold truncate ${isSelected ? 'text-orange-700' : 'text-slate-800'}`}>
                          {u.name}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">
                          {u.email} · <span className="text-slate-600 font-bold">{member.memberRole || 'Member'}</span>
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={18} className="text-orange-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Optional Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Assignment Note <span className="text-slate-300 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add a note for team assignment history…"
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12px] text-slate-700 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 shrink-0 flex items-center justify-between gap-3 bg-slate-50/60">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <Button
            variant="contained"
            disabled={!selectedUserId || loading || leads.length === 0}
            onClick={handleAssign}
            sx={{
              flex: 1,
              backgroundColor: selectedUserId && !loading ? '#F86F03' : undefined,
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '12px',
              py: '10px',
              '&:hover': { backgroundColor: '#DE5D02' },
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Assigning…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserCheck size={14} />
                {leads.length > 1 ? `Assign ${leads.length} Leads` : 'Assign Lead'}
                {selectedMember ? ` → ${selectedMember.user?.name?.split(' ')[0]}` : ''}
              </span>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

export default TeamLeadAssignModal;
