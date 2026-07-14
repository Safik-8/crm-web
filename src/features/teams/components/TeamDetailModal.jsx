// src/features/teams/components/TeamDetailModal.jsx

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTeamQuery, useRemoveTeamMemberMutation, useReplaceTeamOwnerMutation } from '../hooks/useTeams';
import { Calendar, Users2, Shield, Building2, User, Power, Info, Award, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { userService } from '../../users/services/userService';
import { teamService } from '../services/teamService';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';
import Spinner from '../../../shared/components/elements/Spinner';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import { SearchableSelect } from '../../../shared/components/elements/SearchableSelect';

const TeamDetailModal = ({ isOpen, onClose, teamId = null }) => {
  const { data: team, isLoading, error } = useTeamQuery(teamId);
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('TEAM', 'canEdit');

  const removeMemberMutation = useRemoveTeamMemberMutation();
  const replaceOwnerMutation = useReplaceTeamOwnerMutation();

  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false);
  const [selectedMemberToRemove, setSelectedMemberToRemove] = useState(null);
  const [isReplacingOwner, setIsReplacingOwner] = useState(false);
  const [newBdeId, setNewBdeId] = useState('');
  const [replaceError, setReplaceError] = useState('');

  // Reset states when modal closes or teamId changes
  useEffect(() => {
    setIsReplacingOwner(false);
    setNewBdeId('');
    setReplaceError('');
    setSelectedMemberToRemove(null);
    setIsConfirmRemoveOpen(false);
  }, [isOpen, teamId]);

  // Fetch eligible BDEs for same branch
  const branchId = team?.branchId;
  const { data: usersRes, isLoading: isLoadingBdes } = useQuery({
    queryKey: ['branch-bdes-options-detail', branchId],
    queryFn: () => userService.getUsers({ branchId, status: 'ACTIVE', limit: 150 }),
    enabled: !!branchId && isOpen && isReplacingOwner,
    staleTime: 0
  });

  const { data: allTeamsRes } = useQuery({
    queryKey: ['all-teams-bde-filter-detail'],
    queryFn: () => teamService.getTeams({ limit: 1000 }),
    enabled: isOpen && isReplacingOwner,
    staleTime: 0
  });

  const allTeams = allTeamsRes?.data?.teams || allTeamsRes?.teams || [];
  const assignedBdeIds = allTeams
    .filter((t) => t.id !== teamId)
    .map((t) => t.bdeId);

  const allUsers = usersRes?.data?.users || usersRes?.data || [];
  const bdeOptions = allUsers
    .filter((u) => u.userRoles?.some((ur) => ur.role?.name === 'BDE'))
    .filter((u) => !assignedBdeIds.includes(u.id))
    .map((u) => ({
      id: u.id,
      name: `${u.name} (${u.employeeId || 'No ID'})`
    }));

  const handleRemoveMemberClick = (member) => {
    setSelectedMemberToRemove(member);
    setIsConfirmRemoveOpen(true);
  };

  const handleConfirmRemove = () => {
    if (!selectedMemberToRemove) return;
    removeMemberMutation.mutate(
      { id: team.id, userId: selectedMemberToRemove.userId },
      {
        onSuccess: () => {
          setIsConfirmRemoveOpen(false);
          setSelectedMemberToRemove(null);
        }
      }
    );
  };

  const handleReplaceOwnerSubmit = (e) => {
    if (e) e.preventDefault();
    if (!newBdeId) {
      setReplaceError('Please select a new BDE owner');
      return;
    }
    setReplaceError('');
    replaceOwnerMutation.mutate(
      { id: team.id, bdeId: Number(newBdeId) },
      {
        onSuccess: () => {
          setIsReplacingOwner(false);
          setNewBdeId('');
        },
        onError: (err) => {
          setReplaceError(err?.message || 'Failed to replace team owner');
        }
      }
    );
  };

  // Classify team members into active and historical
  const activeMembers = team?.members?.filter((m) => !m.removedAt) || [];
  const historicalMembers = team?.members?.filter((m) => !!m.removedAt) || [];

  const DetailItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      {Icon && <Icon size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none">
          {label}
        </p>
        <p className="text-[13px] font-semibold text-slate-700 leading-tight mt-1.5 break-words">
          {value || <span className="text-slate-300 font-semibold">—</span>}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <DynamicFormSlideover
        isOpen={isOpen}
        onClose={onClose}
        title="Team Specification Sheet"
        subtitle="Detailed overview of team leadership, scope, and active members"
        icon={Users2}
        showFooter={true}
        cancelText="Close Details"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner size={32} className="text-primary" />
            <span className="text-xs font-semibold text-slate-400">Loading team specification sheet...</span>
          </div>
        ) : error || !team ? (
          <div className="text-center py-10">
            <p className="text-sm font-bold text-slate-500">Failed to load team details.</p>
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            {/* Archived Alert Badge */}
            {team.isDeleted && (
              <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-xs font-bold leading-normal">
                <Shield size={16} className="shrink-0 mt-0.5" />
                <span>This team is archived. All configuration is read-only.</span>
              </div>
            )}

            {/* Header Card */}
            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white text-lg font-black shadow-md uppercase">
                {team.name?.charAt(0) || 'T'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-slate-800 text-[15px] leading-tight truncate">
                  {team.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-600 uppercase tracking-wider">
                    {team.code}
                  </span>
                  {team.isDeleted ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100">
                      ARCHIVED
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        team.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {team.status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 1: Team & Branch Info */}
            <div className="space-y-1">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5 mb-2">
                Team & Scope details
              </h3>
              <DetailItem icon={Info} label="Team Name" value={team.name} />
              <DetailItem icon={Award} label="Team Code" value={team.code} />
              <DetailItem
                icon={Building2}
                label="Branch Scope"
                value={`${team.branch?.name} (${team.branch?.code || 'N/A'})`}
              />
              <DetailItem
                icon={Calendar}
                label="Created Date"
                value={new Date(team.createdAt).toLocaleDateString()}
              />
            </div>

            {/* Section 2: Team Leadership */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-orange-100 pb-1.5 mb-1">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-orange-500">
                  Team Leadership
                </h3>
                {canEdit && !isReplacingOwner && !team.isDeleted && (
                  <button
                    onClick={() => setIsReplacingOwner(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-[#E06202] transition-colors cursor-pointer"
                  >
                    <RefreshCw size={11} />
                    <span>Replace Owner</span>
                  </button>
                )}
              </div>

              {!isReplacingOwner ? (
                <>
                  <DetailItem icon={User} label="Team Owner (BDE Lead)" value={team.bde?.name || 'Unassigned'} />
                  <DetailItem icon={Shield} label="BDE Email" value={team.bde?.email} />
                  <DetailItem icon={Power} label="BDE Employee ID" value={team.bde?.employeeId} />
                </>
              ) : (
                <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">Reassign Team Owner (BDE)</h4>
                  <div className="space-y-2">
                    <SearchableSelect
                      id="newBdeOwnerSelect"
                      label="Select New Owner"
                      placeholder={isLoadingBdes ? 'Loading eligible BDEs...' : 'Choose a BDE...'}
                      value={newBdeId}
                      onChange={(val) => {
                        setNewBdeId(val);
                        setReplaceError('');
                      }}
                      options={bdeOptions}
                      disabled={isLoadingBdes || replaceOwnerMutation.isPending}
                      required
                    />
                    {replaceError && (
                      <p className="text-xs font-semibold text-rose-500 mt-1 pl-1">
                        {replaceError}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1.5">
                    <button
                      type="button"
                      disabled={replaceOwnerMutation.isPending}
                      onClick={handleReplaceOwnerSubmit}
                      className="inline-flex items-center justify-center rounded-xl bg-primary hover:bg-[#E06202] text-xs font-bold text-white px-4 py-2 shadow-sm transition-colors cursor-pointer select-none disabled:opacity-50"
                    >
                      {replaceOwnerMutation.isPending ? 'Saving...' : 'Confirm Reassignment'}
                    </button>
                    <button
                      type="button"
                      disabled={replaceOwnerMutation.isPending}
                      onClick={() => {
                        setIsReplacingOwner(false);
                        setNewBdeId('');
                        setReplaceError('');
                      }}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 bg-white font-bold text-xs px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer select-none"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Active Members */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5 mb-2">
                Active Team Members ({activeMembers.filter(m => m.memberRole === 'ISE').length})
              </h3>
              {activeMembers.filter(m => m.memberRole === 'ISE').length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                  {activeMembers
                    .filter((m) => m.memberRole === 'ISE')
                    .map((member) => (
                      <div key={member.id} className="p-3 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-700">{member.user?.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{member.user?.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-700">
                            {member.memberRole}
                          </span>
                          {canEdit && !team.isDeleted && (
                            <button
                              onClick={() => handleRemoveMemberClick(member)}
                              className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Remove member"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-400 italic py-2 pl-1">
                  No active team members assigned yet.
                </p>
              )}
            </div>

            {/* Section 4: Historical Members */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5 mb-2">
                Historical Membership History ({historicalMembers.length})
              </h3>
              {historicalMembers.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                  {historicalMembers.map((member) => (
                    <div key={member.id} className="p-3 flex items-center justify-between opacity-70">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-700 line-through decoration-slate-400">{member.user?.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Assigned: {new Date(member.assignedDate).toLocaleDateString()} | Left: {new Date(member.removedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-600">
                        {member.memberRole} (EX)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-400 italic py-2 pl-1">
                  No prior membership changes on record.
                </p>
              )}
            </div>
          </div>
        )}
      </DynamicFormSlideover>

      {/* Confirm Member Removal Modal */}
      <ConfirmModal
        isOpen={isConfirmRemoveOpen}
        onClose={() => {
          setIsConfirmRemoveOpen(false);
          setSelectedMemberToRemove(null);
        }}
        title="Remove Member from Team?"
        message={`Are you sure you want to remove "${selectedMemberToRemove?.user?.name}" from this team?`}
        warningMessage="This member will no longer be active on this team. Their historical metrics and membership timeline will remain intact."
        onConfirm={handleConfirmRemove}
        confirmText="Remove Member"
        type="error"
        isLoading={removeMemberMutation.isPending}
      />
    </>
  );
};

export default TeamDetailModal;
