import { X, Phone, Calendar, BookOpen, Tag } from 'lucide-react';
import { useEffect } from 'react';
import CommentThread from '../../activities/components/CommentThread';

const LeadDetailDrawer = ({ lead, stageName, onClose }) => {
  if (!lead) return null;

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
        
        {/* Modal */}
        <div 
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-2xl h-[95vh] sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 shrink-0">
            <div className="min-w-0 flex-1 mr-3">
              <h2 className="text-base sm:text-lg font-bold font-heading text-slate-900 truncate">{lead.name}</h2>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 sm:px-2.5 py-0.5 rounded-full border border-primary/20 inline-block mt-1">
                {stageName}
              </span>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0">
              <X size={20} />
            </button>
          </div>

          {/* Lead details */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 shrink-0">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-slate-50 rounded-lg sm:rounded-xl px-3 py-2 sm:py-2.5">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1">
                    <Icon size={11} /> {label}
                  </dt>
                  <dd className="text-sm font-semibold text-slate-800 truncate">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Comments */}
          <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 py-3 sm:py-4">
            <CommentThread leadId={lead.id} />
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadDetailDrawer;
