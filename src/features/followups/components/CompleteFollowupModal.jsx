// src/features/followups/components/CompleteFollowupModal.jsx

import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import TextField from '../../../shared/components/elements/TextField';
import Button from '../../../shared/components/elements/Button';
import { useCompleteFollowupMutation } from '../hooks/useFollowups';

/**
 * CompleteFollowupModal — Modal to mark a follow-up as completed with optional completion notes.
 *
 * @param {Object}   props
 * @param {Object}   props.followup - The followup record being completed
 * @param {Function} props.onClose  - Close callback
 * @param {Function} [props.onSuccess] - Success callback
 */
const CompleteFollowupModal = ({ followup, onClose, onSuccess }) => {
  const [completionNotes, setCompletionNotes] = useState('');
  const completeMutation = useCompleteFollowupMutation();

  const handleComplete = () => {
    completeMutation.mutate(
      { id: followup.id, data: { completionNotes: completionNotes.trim() || null } },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  const formattedDate = followup?.scheduledAt
    ? new Date(followup.scheduledAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '';

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 1300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  };

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    width: '100%',
    maxWidth: '440px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #10B981, #34D399)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                Complete Follow-up
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                {followup?.followupType} scheduled for {formattedDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px', borderRadius: '8px', display: 'flex', alignItems: 'center', color: '#94A3B8' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
            Mark this follow-up as completed. Optionally add notes detailing the outcome of the interaction.
          </p>
          <TextField
            id="completion-notes"
            label="Outcome / Completion Notes (optional)"
            value={completionNotes}
            onChange={(val) => setCompletionNotes(val)}
            placeholder="Summarize outcome, next steps, or discussion details..."
            multiline
            rows={4}
            inputProps={{ maxLength: 2000 }}
          />
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: '#F8FAFC' }}>
          <Button variant="outlined" onClick={onClose} disabled={completeMutation.isPending}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleComplete} isLoading={completeMutation.isPending}>
            Mark Completed
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompleteFollowupModal;
