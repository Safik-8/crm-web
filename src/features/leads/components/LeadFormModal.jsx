import { useState, useEffect } from 'react';
import { X, Loader2, User, Phone, Calendar, BookOpen, UserCheck } from 'lucide-react';
import { createLead, getBranchUsers } from '../services/leadService';
import { toast } from 'sonner';

const LeadFormModal = ({ pipelineId, onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', mobile: '', date: '', interested_for: '', assignedToId: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

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
    { key: 'name', label: 'Full Name', icon: User, type: 'text', placeholder: 'e.g. Ravi Kumar' },
    { key: 'mobile', label: 'Mobile', icon: Phone, type: 'tel', placeholder: '10-digit number' },
    { key: 'date', label: 'Date', icon: Calendar, type: 'date', placeholder: '' },
    { key: 'interested_for', label: 'Interested In', icon: BookOpen, type: 'text', placeholder: 'e.g. MBA, BBA, Full Stack...' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-heading text-slate-900">Add Lead</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {fields.map(({ key, label, icon: Icon, type, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">{label}</label>
              <div className="relative">
                <Icon size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors[key] ? 'text-red-400' : 'text-slate-400'}`} />
                <input
                  type={type}
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  className={`w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm font-medium outline-none transition-all ${
                    errors[key]
                      ? 'border-red-300 bg-red-50 focus:ring-4 focus:ring-red-500/10 focus:border-red-400'
                      : 'border-slate-200 bg-slate-50 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10'
                  }`}
                />
              </div>
              {errors[key] && <p className="text-xs font-semibold text-red-500">{errors[key]}</p>}
            </div>
          ))}

          {/* Assign To Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Assign To</label>
            <div className="relative">
              <UserCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={form.assignedToId}
                onChange={set('assignedToId')}
                disabled={loadingUsers || busy}
                className="w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm font-medium outline-none transition-all border-slate-200 bg-slate-50 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Unassigned --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.role ? `(${u.role})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              Add Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadFormModal;
