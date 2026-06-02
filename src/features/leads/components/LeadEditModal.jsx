import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, User, Phone, Calendar, BookOpen, UserCheck, Pencil, AlertCircle } from 'lucide-react';
import { updateLead, getBranchUsers } from '../services/leadService';
import { toast } from '../../../shared/utils/toast';

/**
 * LeadEditModal — Professional SaaS-level edit modal.
 *
 * Editable fields: name, mobile, date, interestedFor, assignedToId
 * NOT editable: stageId, pipelineId (stage movement is drag-and-drop only)
 *
 * Permission gate: caller must only render this when user has LEAD.canCreate === true.
 *
 * On success: calls onUpdated(updatedLead) so parent can update local state
 *             without resetting board filters/search/sort.
 */
const LeadEditModal = ({ lead, assignableUsers: propUsers = [], onClose, onUpdated }) => {
  // Pre-fill form from current lead data
  const [form, setForm] = useState({
    name: lead.name || '',
    mobile: lead.mobile?.toString() || '',
    date: lead.date ? lead.date.split('T')[0] : '',
    interestedFor: lead.interestedFor || lead.interested_for || '',
    assignedToId: lead.assignedTo?.id?.toString() || lead.assignedToId?.toString() || '',
  });

  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState(propUsers);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Fetch branch users if not provided via props
  useEffect(() => {
    if (propUsers.length > 0) return;
    let mounted = true;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await getBranchUsers();
        if (mounted && res?.success) {
          setUsers(res.data.users || []);
        }
      } catch (err) {
        console.error('Failed to fetch branch users:', err);
      } finally {
        if (mounted) setLoadingUsers(false);
      }
    };
    fetchUsers();
    return () => { mounted = false; };
  }, [propUsers.length]);

  const setField = useCallback((field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  }, [errors]);

  const validate = () => {
    const errs = {};
    const name = form.name.trim();
    const mobile = form.mobile.trim();

    if (!name) errs.name = 'Name is required';
    else if (!/^[a-zA-Z\s.]+$/.test(name)) errs.name = 'Name should only contain letters';

    if (!mobile) errs.mobile = 'Mobile is required';
    else if (!/^\d{10}$/.test(mobile)) errs.mobile = 'Enter a valid 10-digit mobile number';

    if (!form.date) errs.date = 'Date is required';

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        date: form.date,
        interestedFor: form.interestedFor.trim() || null,
        assignedToId: form.assignedToId ? Number(form.assignedToId) : null,
      };

      const res = await updateLead(lead.id, payload);
      const updatedLead = res?.data?.lead || res?.lead;

      toast.success('Lead updated successfully');

      // Pass back the updated lead (merge with existing if backend doesn't return full object)
      onUpdated(updatedLead || { ...lead, ...payload });
      onClose();
    } catch (err) {
      // Map backend validation errors to form fields
      if (err?.details && Array.isArray(err.details)) {
        const fieldErrors = {};
        err.details.forEach(({ field, message }) => {
          if (field) fieldErrors[field] = message;
        });
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          return;
        }
      }
      toast.error(err?.message || 'Failed to update lead');
    } finally {
      setBusy(false);
    }
  };

  // Keyboard: Escape to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const textFields = [
    { key: 'name',         label: 'Full Name',     icon: User,     type: 'text', placeholder: 'e.g. Ravi Kumar' },
    { key: 'mobile',       label: 'Mobile',        icon: Phone,    type: 'tel',  placeholder: '10-digit number' },
    { key: 'date',         label: 'Date',          icon: Calendar, type: 'date', placeholder: '' },
    { key: 'interestedFor', label: 'Interested In', icon: BookOpen, type: 'text', placeholder: 'e.g. MBA, BBA, Full Stack…' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[3px] p-3 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] w-full max-w-md animate-in fade-in zoom-in-95 duration-250 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 shrink-0">
              <Pencil size={15} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] sm:text-[16px] font-semibold font-heading text-zinc-900 tracking-tight">
                Edit Lead
              </h2>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5 truncate max-w-[200px]">
                {lead.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex items-center justify-center w-8 h-8 rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors disabled:opacity-40 shrink-0"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-4 sm:py-5 space-y-4" noValidate>
          {textFields.map(({ key, label, icon: Icon, type, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label
                htmlFor={`edit-lead-${key}`}
                className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.12em]"
              >
                {label}
              </label>
              <div className="relative">
                <Icon
                  size={14}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                    errors[key] ? 'text-red-400' : 'text-zinc-400'
                  }`}
                />
                <input
                  id={`edit-lead-${key}`}
                  type={type}
                  value={form[key]}
                  onChange={setField(key)}
                  placeholder={placeholder}
                  disabled={busy}
                  className={`w-full rounded-xl border pl-9 pr-3 py-2.5 text-[13px] font-medium outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${
                    errors[key]
                      ? 'border-red-300 bg-red-50 focus:ring-4 focus:ring-red-500/10 focus:border-red-400'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10'
                  }`}
                />
              </div>
              {errors[key] && (
                <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500 animate-in fade-in slide-in-from-top-1 duration-150">
                  <AlertCircle size={10} className="shrink-0" />
                  {errors[key]}
                </p>
              )}
            </div>
          ))}

          {/* Assign To */}
          <div className="space-y-1.5">
            <label
              htmlFor="edit-lead-assignedToId"
              className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.12em]"
            >
              Assign To
            </label>
            <div className="relative">
              <UserCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <select
                id="edit-lead-assignedToId"
                value={form.assignedToId}
                onChange={setField('assignedToId')}
                disabled={loadingUsers || busy}
                className="w-full rounded-xl border pl-9 pr-3 py-2.5 text-[13px] font-medium outline-none transition-all duration-150 border-zinc-200 bg-zinc-50 text-zinc-900 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">— Unassigned —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}{u.role ? ` (${u.role})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Note: stage cannot be changed here */}
          <p className="text-[10px] text-zinc-400 font-medium px-0.5 leading-relaxed">
            Stage can only be changed by dragging the card on the board.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-[13px] font-semibold text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-[13px] font-bold shadow-sm shadow-primary/20 hover:bg-primary/90 disabled:opacity-60 transition-all duration-150 active:scale-[0.98]"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={13} />}
              {busy ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadEditModal;
