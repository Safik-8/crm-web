import { X, Phone, Calendar, BookOpen, Tag } from 'lucide-react';
import CommentThread from '../../activities/components/CommentThread';

const LeadDetailDrawer = ({ lead, stageName, onClose }) => {
  if (!lead) return null;

  const date = lead.date ? new Date(lead.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  const details = [
    { icon: Phone,    label: 'Mobile',      value: lead.mobile || '—' },
    { icon: Calendar, label: 'Date',        value: date },
    { icon: BookOpen, label: 'Interested In', value: lead.interestedFor || '—' },
    { icon: Tag,      label: 'Stage',       value: stageName || '—' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-900">{lead.name}</h2>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
              {stageName}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Lead details */}
        <div className="px-6 py-4 border-b border-slate-100">
          <dl className="grid grid-cols-2 gap-3">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1">
                  <Icon size={11} /> {label}
                </dt>
                <dd className="text-sm font-semibold text-slate-800 truncate">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Comments */}
        <div className="flex-1 overflow-hidden px-6 py-4 flex flex-col min-h-0">
          <CommentThread leadId={lead.id} />
        </div>
      </div>
    </>
  );
};

export default LeadDetailDrawer;
