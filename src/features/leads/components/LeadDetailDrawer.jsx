import { X, Phone, Calendar, BookOpen, Tag, User } from 'lucide-react';
import { useEffect } from 'react';
import CommentThread from '../../activities/components/CommentThread';

const LeadDetailDrawer = ({ lead, stageName, onClose }) => {
  if (!lead) return null;

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const date = lead.date
    ? new Date(lead.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const details = [
    { icon: Phone,    label: 'Mobile',       value: lead.mobile || '—' },
    { icon: Calendar, label: 'Date',         value: date },
    { icon: BookOpen, label: 'Interested In', value: lead.interestedFor || lead.interested_for || '—' },
    { icon: Tag,      label: 'Stage',        value: stageName || '—' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[3px] flex items-center justify-center p-3 sm:p-5"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] w-full max-w-sm sm:max-w-2xl h-[92vh] sm:max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-250 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-zinc-100 shrink-0">
            <div className="min-w-0 flex-1 mr-4">
              <h2 className="text-[16px] sm:text-[18px] font-semibold font-heading text-zinc-900 truncate tracking-tight">
                {lead.name}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/60">
                  <Tag size={9} />
                  {stageName}
                </span>
                {lead.assignedTo?.name && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-full">
                    <User size={9} />
                    {lead.assignedTo.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Lead details grid */}
          <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 shrink-0">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-zinc-50 rounded-xl px-3 py-2.5 border border-zinc-100">
                  <dt className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">
                    <Icon size={10} /> {label}
                  </dt>
                  <dd className="text-[13px] font-semibold text-zinc-800 truncate">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Comments */}
          <div className="flex-1 flex flex-col overflow-hidden px-5 sm:px-6 py-4">
            <CommentThread leadId={lead.id} />
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadDetailDrawer;
