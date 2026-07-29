// src/features/followups/components/FollowupCard.jsx

import React from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, Edit, Trash2, AlertCircle, Loader2 } from 'lucide-react';

const TYPE_ICONS = {
  CALL:     '📞',
  MEETING:  '🤝',
  DEMO:     '🖥️',
  WHATSAPP: '💬',
  EMAIL:    '✉️',
  VISIT:    '🏢',
};

/**
 * FollowupCard — Card representation of a single follow-up record.
 *
 * @param {Object}   props
 * @param {Object}   props.followup         - Followup entity
 * @param {boolean}  props.canEdit          - Can current user edit/complete/cancel
 * @param {boolean}  props.canDelete        - Can current user delete
 * @param {string}   [props.processingAction]- In-flight mutation type ('CANCEL' | 'DELETE' | null)
 * @param {Function} props.onEdit           - Edit click callback
 * @param {Function} props.onComplete       - Complete click callback
 * @param {Function} props.onCancel         - Cancel click callback
 * @param {Function} props.onDelete         - Delete click callback
 */
const FollowupCard = ({ followup, canEdit, canDelete, processingAction, onEdit, onComplete, onCancel, onDelete }) => {
  const isPending   = followup.status === 'PENDING';
  const isCompleted = followup.status === 'COMPLETED';
  const isMissed    = followup.status === 'MISSED';
  const isCancelled = followup.status === 'CANCELLED';

  const scheduledDt = new Date(followup.scheduledAt);
  const isOverdue   = isPending && scheduledDt < new Date();

  const formattedDate = scheduledDt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = scheduledDt.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const typeIcon = TYPE_ICONS[followup.followupType] || '📅';

  // Card container style
  const cardStyle = {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'all 0.15s ease',
    opacity: processingAction ? 0.7 : 1,
    pointerEvents: processingAction ? 'none' : 'auto',
  };

  return (
    <div style={cardStyle} className="hover:border-slate-300 hover:shadow-xs">
      {/* Top Row: Type badge + Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px' }}>{typeIcon}</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
            {followup.followupType}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isOverdue && (
            <span style={{ padding: '2px 8px', borderRadius: '20px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#EF4444', fontSize: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={10} /> OVERDUE
            </span>
          )}

          {isPending && !isOverdue && (
            <span style={{ padding: '2px 8px', borderRadius: '20px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#D97706', fontSize: '10px', fontWeight: 700 }}>
              PENDING
            </span>
          )}

          {isCompleted && (
            <span style={{ padding: '2px 8px', borderRadius: '20px', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', fontSize: '10px', fontWeight: 700 }}>
              COMPLETED
            </span>
          )}

          {isMissed && (
            <span style={{ padding: '2px 8px', borderRadius: '20px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '10px', fontWeight: 700 }}>
              MISSED
            </span>
          )}

          {isCancelled && (
            <span style={{ padding: '2px 8px', borderRadius: '20px', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#64748B', fontSize: '10px', fontWeight: 700 }}>
              CANCELLED
            </span>
          )}
        </div>
      </div>

      {/* Date & Time Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#475569' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Calendar size={13} color="#94A3B8" />
          <span>{formattedDate}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Clock size={13} color="#94A3B8" />
          <span>{formattedTime}</span>
        </div>
        {followup.assignedTo?.name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
            <User size={12} color="#94A3B8" />
            <span style={{ fontWeight: 600, color: '#64748B' }}>{followup.assignedTo.name}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {followup.notes && (
        <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.45 }}>
          {followup.notes}
        </div>
      )}

      {/* Completion Notes */}
      {followup.completionNotes && (
        <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#166534', lineHeight: 1.45 }}>
          <strong>Outcome:</strong> {followup.completionNotes}
        </div>
      )}

      {/* Action Footer */}
      {(canEdit || canDelete) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
          {canEdit && (isPending || isMissed) && (
            <button
              onClick={() => onComplete(followup)}
              disabled={!!processingAction}
              style={{ padding: '4px 10px', borderRadius: '6px', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', fontSize: '11px', fontWeight: 600, cursor: processingAction ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <CheckCircle size={12} /> Complete
            </button>
          )}

          {canEdit && isPending && (
            <button
              onClick={() => onEdit(followup)}
              disabled={!!processingAction}
              style={{ padding: '4px 10px', borderRadius: '6px', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569', fontSize: '11px', fontWeight: 600, cursor: processingAction ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Edit size={12} /> Reschedule
            </button>
          )}

          {canEdit && isPending && (
            <button
              onClick={() => onCancel(followup)}
              disabled={!!processingAction}
              style={{ padding: '4px 10px', borderRadius: '6px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '11px', fontWeight: 600, cursor: processingAction ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {processingAction === 'CANCEL' ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Cancelling...
                </>
              ) : (
                <>
                  <XCircle size={12} /> Cancel
                </>
              )}
            </button>
          )}

          {canDelete && !isPending && (
            <button
              onClick={() => onDelete(followup)}
              disabled={!!processingAction}
              style={{ padding: '4px 8px', borderRadius: '6px', background: 'transparent', border: 'none', color: '#94A3B8', cursor: processingAction ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Delete follow-up"
            >
              {processingAction === 'DELETE' ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FollowupCard;
