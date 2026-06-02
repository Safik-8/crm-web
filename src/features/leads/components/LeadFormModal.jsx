import { useState, useEffect } from 'react';
import { X, Loader2, User, Phone, Calendar, BookOpen, UserCheck, Plus } from 'lucide-react';
import { createLead, getBranchUsers } from '../services/leadService';
import { toast } from 'sonner';

const LeadFormModal = ({ pipelineId, onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', mobile: '', date: '', interested_for: '', assignedToId: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
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
  }, []);

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (!/^[a-zA-Z\s.]+$/.test(form.name.trim())) errs.name = 'Name should only contain letters';
    if (!form.mobile.trim()) errs.mobile = 'Mobile is required';
    else if (!/^\d{10}$/.test(form.mobile.trim())) errs.mobile = 'Enter a valid 10-digit mobile';
    if (!form.date) errs.date = 'Date is required';
    if (!form.interested_for.trim()) errs.interested_for = 'Interest is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setBusy(true);
    try {
      const res = await createLead({
        ...form,
        pipelineId,
        date: new Date(form.date).toISOString(),
        assignedToId: form.assignedToId ? Number(form.assignedToId) : null
      });
      const lead = res?.data?.lead;
      toast.success('Lead added!');
      onCreated(lead);
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to add lead');
    } finally {
      setBusy(false);
    }
  };

  const fields = [
    { key: 'name',          label: 'Full Name',     icon: User,     type: 'text', placeholder: 'e.g. Ravi Kumar' },
    { key: 'mobile',        label: 'Mobile',        icon: Phone,    type: 'tel',  placeholder: '10-digit number' },
    { key: 'date',          label: 'Date',          icon: Calendar, type: 'date', placeholder: '' },
    { key: 'interested_for', label: 'Interested In', icon: BookOpen, type: 'text', placeholder: 'e.g. MBA, BBA, Full Stack…' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[3px] p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] w-full max-w-md animate-in fade-in zoom-in-95 duration-250 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 border border-orange-100">
              <Plus size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold font-heading text-zinc-900 tracking-tight">Add Lead</h2>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Fill in the lead details below</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" noValidate>
          {fields.map(({ key, label, icon: Icon, type, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.12em]">{label}</label>
              <div className="relative">
                <Icon
                  size={14}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                    errors[key] ? 'text-red-400' : 'text-zinc-400'
                  }`}
                />
                <input
                  type={type}
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  className={`w-full rounded-xl border pl-9 pr-3 py-2.5 text-[13px] font-medium outline-none transition-all duration-150 ${
                    errors[key]
                      ? 'border-red-300 bg-red-50 focus:ring-4 focus:ring-red-500/10 focus:border-red-400'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10'
                  }`}
                />
              </div>
              {errors[key] && (
                <p className="text-[11px] font-semibold text-red-500 animate-in fade-in slide-in-from-top-1 duration-150">
                  {errors[key]}
                </p>
              )}
            </div>
          ))}

          {/* Assign To */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.12em]">Assign To</label>
            <div className="relative">
              <UserCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <select
                value={form.assignedToId}
                onChange={set('assignedToId')}
                disabled={loadingUsers || busy}
                className="w-full rounded-xl border pl-9 pr-3 py-2.5 text-[13px] font-medium outline-none transition-all duration-150 border-zinc-200 bg-zinc-50 text-zinc-900 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="">— Unassigned —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}{u.role ? ` (${u.role})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-[13px] font-semibold text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-150 active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-[13px] font-bold shadow-sm shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all duration-150 active:scale-[0.98]"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : null}
              {busy ? 'Adding…' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadFormModal;
