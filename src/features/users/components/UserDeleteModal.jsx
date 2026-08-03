import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, UserCheck, ShieldAlert, Loader2 } from 'lucide-react';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import SelectField from '../../../shared/components/elements/SelectField';
import Skeleton from '../../../shared/components/elements/Skeleton';
import { userService } from '../services/userService';
import { useDeleteUserMutation } from '../hooks/useUsers';
import { toast } from '../../../shared/utils/toast';

const UserDeleteModal = ({ isOpen, onClose, user = null }) => {
  const [selectedReplacementId, setSelectedReplacementId] = useState('');
  const [validationError, setValidationError] = useState('');

  const deleteUserMutation = useDeleteUserMutation();

  // Fetch eligible replacement candidates when modal opens
  const { data: replacementData, isLoading: isFetchingReplacements } = useQuery({
    queryKey: ['eligible-replacements', user?.id],
    queryFn: async () => {
      const res = await userService.getEligibleReplacements(user.id);
      return res?.data || res;
    },
    enabled: !!isOpen && !!user?.id
  });

  const assignedLeadsCount = replacementData?.assignedLeadsCount || 0;
  const directReportsCount = replacementData?.directReportsCount || 0;
  const requiresReassignment = replacementData?.requiresReassignment || assignedLeadsCount > 0 || directReportsCount > 0;
  const candidates = replacementData?.candidates || [];

  // Reset local state on open
  useEffect(() => {
    if (isOpen) {
      setSelectedReplacementId('');
      setValidationError('');
    }
  }, [isOpen]);

  if (!user) return null;

  const candidateOptions = candidates.map(c => ({
    value: c.id,
    label: `${c.name} (${c.roleName} • ${c.branchName})`
  }));

  const handleConfirmDelete = () => {
    if (isFetchingReplacements) return;

    if (requiresReassignment && !selectedReplacementId) {
      const msg = 'Please select a replacement employee to receive active leads and direct reports.';
      setValidationError(msg);
      toast.warning(msg);
      return;
    }

    deleteUserMutation.mutate(
      { id: user.id, replacementUserId: selectedReplacementId || null },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  const getConfirmText = () => {
    if (isFetchingReplacements) return 'Searching Candidates...';
    if (requiresReassignment) return 'Reassign & Hard Delete User';
    return 'Hard Delete User';
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Permanently Delete Employee ${user.name}?`}
      message={`Are you sure you want to hard delete ${user.name} (${user.email})? This action is permanent and cannot be undone.`}
      type="error"
      confirmText={getConfirmText()}
      cancelText="Cancel"
      loadingText={deleteUserMutation.isPending ? 'Reassigning & Deleting...' : 'Searching Candidates...'}
      isLoading={deleteUserMutation.isPending || isFetchingReplacements}
      onConfirm={handleConfirmDelete}
    >
      <div className="space-y-4 pt-2 text-left">
        {isFetchingReplacements ? (
          <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl animate-pulse">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Loader2 size={14} className="animate-spin text-orange-500" />
              <span>Analyzing employee CRM dependencies & candidates...</span>
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* Dependencies Alert Banner */}
            {requiresReassignment ? (
              <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl space-y-2">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-amber-900 leading-tight">
                      CRM Dependencies Detected
                    </p>
                    <p className="text-amber-700 font-medium mt-1 leading-normal">
                      This user currently owns{' '}
                      <span className="font-bold text-amber-950 underline">{assignedLeadsCount} active lead(s)</span>{' '}
                      and manages{' '}
                      <span className="font-bold text-amber-950 underline">{directReportsCount} direct report(s)</span>.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-600">
                <UserCheck size={16} className="text-emerald-500 shrink-0" />
                <span>This user has no active leads or direct reports. Deletion is clean.</span>
              </div>
            )}

            {/* Mandatory Replacement Candidate Dropdown */}
            {requiresReassignment && (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700">
                  Reassign Leads & Direct Reports To <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-400 font-medium">
                  Showing active colleagues in branch <span className="font-semibold text-slate-600">{user.branch?.name || 'Assigned Branch'}</span> & company admins with role rank equal or higher.
                </p>

                {candidateOptions.length > 0 ? (
                  <SelectField
                    id="replacement-user-select"
                    placeholder="Select Replacement Employee..."
                    options={candidateOptions}
                    value={selectedReplacementId}
                    onChange={(val) => {
                      setSelectedReplacementId(val);
                      if (validationError) setValidationError('');
                    }}
                    errorText={validationError}
                  />
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>No eligible replacement users with equal or higher rank found in this branch or company. Please promote or assign another employee first.</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ConfirmModal>
  );
};

export default UserDeleteModal;
