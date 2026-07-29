// src/features/followups/components/FollowupList.jsx

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import FollowupCard from './FollowupCard';
import FollowupForm from './FollowupForm';
import CompleteFollowupModal from './CompleteFollowupModal';
import Button from '../../../shared/components/elements/Button';
import Skeleton from '../../../shared/components/elements/Skeleton';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import {
  useFollowupsByLeadQuery,
  useCancelFollowupMutation,
  useDeleteFollowupMutation,
} from '../hooks/useFollowups';

/**
 * FollowupList — Main container component rendering follow-ups tab content within LeadDetailDrawer.
 *
 * @param {Object}  props
 * @param {number}  props.leadId    - ID of target lead
 * @param {boolean} props.canCreate - Role capability to create
 * @param {boolean} props.canEdit   - Role capability to edit/complete/cancel
 * @param {boolean} props.canDelete - Role capability to delete
 */
const FollowupList = ({ leadId, canCreate, canEdit, canDelete }) => {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [editingFollowup, setEditingFollowup] = useState(null);
  const [completingFollowup, setCompletingFollowup] = useState(null);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    action: null,
    target: null,
  });

  const { data: res, isLoading, refetch } = useFollowupsByLeadQuery(leadId);
  const cancelMutation = useCancelFollowupMutation();
  const deleteMutation = useDeleteFollowupMutation();

  const followups = res?.data?.followups || res?.followups || res || [];

  const filteredFollowups = followups.filter((f) => {
    if (filterStatus === 'ALL') return true;
    return f.status === filterStatus;
  });

  const handleOpenCreate = () => {
    setEditingFollowup(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (followup) => {
    setEditingFollowup(followup);
    setIsFormOpen(true);
  };

  const handleOpenComplete = (followup) => {
    setCompletingFollowup(followup);
  };

  const handleCancelRequest = (followup) => {
    setConfirmState({
      isOpen: true,
      title: 'Cancel Follow-up',
      message: `Are you sure you want to cancel this scheduled ${followup.followupType} follow-up?`,
      confirmText: 'Yes, Cancel',
      action: 'CANCEL',
      target: followup,
    });
  };

  const handleDeleteRequest = (followup) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Follow-up Record',
      message: `Are you sure you want to permanently delete this ${followup.followupType} follow-up record?`,
      confirmText: 'Yes, Delete',
      action: 'DELETE',
      target: followup,
    });
  };

  const handleConfirmAction = () => {
    if (!confirmState.target) return;
    const id = confirmState.target.id;

    if (confirmState.action === 'CANCEL') {
      cancelMutation.mutate(id, {
        onSuccess: () => {
          refetch();
          setConfirmState((prev) => ({ ...prev, isOpen: false, target: null, action: null }));
        },
      });
    } else if (confirmState.action === 'DELETE') {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          refetch();
          setConfirmState((prev) => ({ ...prev, isOpen: false, target: null, action: null }));
        },
      });
    }
  };

  const counts = {
    ALL:       followups.length,
    PENDING:   followups.filter((f) => f.status === 'PENDING').length,
    COMPLETED: followups.filter((f) => f.status === 'COMPLETED').length,
    MISSED:    followups.filter((f) => f.status === 'MISSED').length,
    CANCELLED: followups.filter((f) => f.status === 'CANCELLED').length,
  };

  const FILTER_TABS = [
    { key: 'ALL',       label: 'All' },
    { key: 'PENDING',   label: 'Pending' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'MISSED',    label: 'Missed' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '320px' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '10px' }}>
          {FILTER_TABS.map((t) => {
            const isActive = filterStatus === t.key;
            const count = counts[t.key] || 0;
            return (
              <button
                key={t.key}
                onClick={() => setFilterStatus(t.key)}
                style={{
                  border: 'none',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#0F172A' : '#64748B',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{t.label}</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Schedule Button (hidden if no canCreate) */}
        {canCreate && (
          <Button variant="contained" size="small" startIcon={<Plus size={13} />} onClick={handleOpenCreate}>
            Schedule Follow-up
          </Button>
        )}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Skeleton height={80} style={{ borderRadius: '12px' }} />
          <Skeleton height={80} style={{ borderRadius: '12px' }} />
          <Skeleton height={80} style={{ borderRadius: '12px' }} />
        </div>
      ) : filteredFollowups.length === 0 ? (
        <div style={{ padding: '40px 16px', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
          <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>📅</span>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#475569' }}>
            {filterStatus === 'ALL' ? 'No follow-ups scheduled yet' : `No ${filterStatus.toLowerCase()} follow-ups found`}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8' }}>
            {canCreate ? 'Click "Schedule Follow-up" to create a new activity.' : 'Follow-up activities will appear here when scheduled.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '2px' }}>
          {filteredFollowups.map((followup) => {
            const processingAction =
              cancelMutation.isPending && Number(cancelMutation.variables) === Number(followup.id) ? 'CANCEL' :
              deleteMutation.isPending && Number(deleteMutation.variables) === Number(followup.id) ? 'DELETE' : null;

            return (
              <FollowupCard
                key={followup.id}
                followup={followup}
                canEdit={canEdit}
                canDelete={canDelete}
                processingAction={processingAction}
                onEdit={handleOpenEdit}
                onComplete={handleOpenComplete}
                onCancel={handleCancelRequest}
                onDelete={handleDeleteRequest}
              />
            );
          })}
        </div>
      )}

      {/* Modals */}
      {isFormOpen && (
        <FollowupForm
          leadId={leadId}
          followup={editingFollowup}
          onClose={() => {
            setIsFormOpen(false);
            setEditingFollowup(null);
          }}
          onSuccess={() => refetch()}
        />
      )}

      {completingFollowup && (
        <CompleteFollowupModal
          followup={completingFollowup}
          onClose={() => setCompletingFollowup(null)}
          onSuccess={() => refetch()}
        />
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        title={confirmState.title}
        message={confirmState.message}
        type="error"
        confirmText={confirmState.confirmText}
        isLoading={cancelMutation.isPending || deleteMutation.isPending}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};

export default FollowupList;
