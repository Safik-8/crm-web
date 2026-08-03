// src/features/followups/components/FollowupForm.jsx

import React, { useState } from 'react';
import { X, CalendarClock } from 'lucide-react';
import SelectField from '../../../shared/components/elements/SelectField';
import TextField from '../../../shared/components/elements/TextField';
import Button from '../../../shared/components/elements/Button';
import { useCreateFollowupMutation, useUpdateFollowupMutation } from '../hooks/useFollowups';

const FOLLOWUP_TYPE_OPTIONS = [
  { id: 'CALL',     name: '📞 Call' },
  { id: 'MEETING',  name: '🤝 Meeting' },
  { id: 'DEMO',     name: '🖥️ Demo' },
  { id: 'WHATSAPP', name: '💬 WhatsApp' },
  { id: 'EMAIL',    name: '✉️ Email' },
  { id: 'VISIT',    name: '🏢 Visit' },
];

/**
 * FollowupForm — Modal form to schedule or edit a follow-up.
 *
 * @param {Object}   props
 * @param {number}   props.leadId        - Target lead ID
 * @param {Object}   [props.followup]    - Followup record to edit (null for create)
 * @param {Function} props.onClose       - Close callback
 * @param {Function} [props.onSuccess]   - Success callback
 */
const FollowupForm = ({ leadId, followup = null, onClose, onSuccess }) => {
  const isEdit = !!followup;

  const getInitialDate = () => {
    if (!followup?.scheduledAt) return '';
    const d = new Date(followup.scheduledAt);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getInitialTime = () => {
    if (!followup?.scheduledAt) return '';
    const d = new Date(followup.scheduledAt);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const [form, setForm] = useState({
    followupType: followup?.followupType || '',
    scheduledDate: getInitialDate(),
    scheduledTime: getInitialTime(),
    notes: followup?.notes || '',
  });

  const [errors, setErrors] = useState({});

  const createMutation = useCreateFollowupMutation();
  const updateMutation = useUpdateFollowupMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const validate = () => {
    const e = {};
    if (!form.followupType)  e.followupType  = 'Follow-up type is required';
    if (!form.scheduledDate) e.scheduledDate = 'Date is required';
    if (!form.scheduledTime) e.scheduledTime = 'Time is required';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    const localDateTimeStr = `${form.scheduledDate}T${form.scheduledTime}:00`;
    const scheduledAt = new Date(localDateTimeStr).toISOString();

    const payload = {
      followupType: form.followupType,
      scheduledAt,
      notes: form.notes.trim() || null,
    };

    if (!isEdit) {
      createMutation.mutate(
        { ...payload, leadId: Number(leadId) },
        {
          onSuccess: () => {
            onSuccess?.();
            onClose();
          },
        }
      );
    } else {
      updateMutation.mutate(
        { id: followup.id, data: payload },
        {
          onSuccess: () => {
            onSuccess?.();
            onClose();
          },
        }
      );
    }
  };

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
    maxWidth: '480px',
    maxHeight: '90vh',
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
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #F86F03, #FF9A3C)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarClock size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                {isEdit ? 'Edit Follow-up' : 'Schedule Follow-up'}
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                {isEdit ? 'Update scheduled details' : 'Schedule a new activity for this lead'}
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
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SelectField
            id="followup-type"
            label="Follow-up Type"
            required
            options={FOLLOWUP_TYPE_OPTIONS}
            value={form.followupType}
            onChange={(val) => {
              setForm((f) => ({ ...f, followupType: val }));
              setErrors((e) => ({ ...e, followupType: '' }));
            }}
            errorText={errors.followupType}
            placeholder="Select activity type"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <TextField
              id="followup-date"
              label="Date"
              required
              type="date"
              value={form.scheduledDate}
              onChange={(val) => {
                setForm((f) => ({ ...f, scheduledDate: val }));
                setErrors((e) => ({ ...e, scheduledDate: '' }));
              }}
              errorText={errors.scheduledDate}
            />
            <TextField
              id="followup-time"
              label="Time"
              required
              type="time"
              value={form.scheduledTime}
              onChange={(val) => {
                setForm((f) => ({ ...f, scheduledTime: val }));
                setErrors((e) => ({ ...e, scheduledTime: '' }));
              }}
              errorText={errors.scheduledTime}
            />
          </div>

          <TextField
            id="followup-notes"
            label="Notes (optional)"
            value={form.notes}
            onChange={(val) => setForm((f) => ({ ...f, notes: val }))}
            placeholder="Add scheduling notes or agenda..."
            multiline
            rows={3}
            inputProps={{ maxLength: 2000 }}
          />
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: '#F8FAFC' }}>
          <Button variant="outlined" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit} isLoading={isPending}>
            {isEdit ? 'Save Changes' : 'Schedule'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FollowupForm;
