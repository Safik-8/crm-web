import React, { useEffect } from 'react';
import { X, Phone, Calendar, BookOpen, Tag, User, Mail, DollarSign, MapPin, FileText, Compass, Award, Activity, ShieldAlert } from 'lucide-react';
import CommentThread from '../../activities/components/CommentThread';

const LeadDetailDrawer = ({ lead, stageName, onClose }) => {
  if (!lead) return null;

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const date = lead.createdAt
    ? new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : lead.date
    ? new Date(lead.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const locationStr = [lead.city, lead.state, lead.country].filter(Boolean).join(', ') || '—';

  const details = [
    { icon: Phone,      label: 'Mobile',       value: lead.mobile || '—' },
    { icon: Phone,      label: 'Alt Contact',  value: lead.alternateMobile || '—' },
    { icon: Mail,       label: 'Email',        value: lead.email || '—' },
    { icon: Calendar,   label: 'Created Date', value: date },
    { icon: Compass,    label: 'Lead Source',  value: lead.source?.name || '—' },
    { icon: Award,      label: 'Interested In', value: lead.course?.name || lead.interestedFor || lead.interested_for || '—' },
    { icon: DollarSign, label: 'Budget',       value: lead.budget !== null && lead.budget !== undefined ? `₹${lead.budget.toLocaleString('en-IN')}` : '—' },
    { icon: MapPin,     label: 'Location',     value: locationStr },
  ];

  // Stage name lookup
  const currentStageName = stageName || lead.stage?.name || '—';

  // Priority color config
  const priorityColors = {
    HIGH: 'text-red-700 bg-red-50 border-red-200',
    MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200',
    LOW: 'text-green-700 bg-green-50 border-green-200'
  };

  const priorityStyle = priorityColors[lead.priority] || priorityColors.MEDIUM;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[3px] flex items-center justify-center p-3 sm:p-5"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] w-full max-w-sm sm:max-w-3xl h-[92vh] sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-250 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
            <div className="min-w-0 flex-1 mr-4">
              <h2 className="text-[18px] sm:text-[20px] font-bold font-heading text-zinc-900 truncate tracking-tight">
                {lead.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* Stage Badge */}
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/60">
                  <Tag size={10} />
                  {currentStageName}
                </span>

                {/* Status Badge */}
                {lead.status && (
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: lead.status.displayColor + '18',
                      color: lead.status.displayColor,
                      borderColor: lead.status.displayColor + '40'
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lead.status.displayColor }} />
                    {lead.status.name}
                  </span>
                )}

                {/* Priority Badge */}
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${priorityStyle}`}>
                  <ShieldAlert size={10} />
                  {lead.priority || 'MEDIUM'}
                </span>

                {/* Assigned User */}
                {lead.assignedTo?.name && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
                    <User size={10} />
                    Assigned: {lead.assignedTo.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Scrollable Grid */}
          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-zinc-100">
            {/* Info Grid */}
            <div className="px-6 py-5">
              <h3 className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Lead Parameters</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {details.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-zinc-50 rounded-2xl px-4 py-3 border border-zinc-100/80">
                    <dt className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">
                      <Icon size={10} /> {label}
                    </dt>
                    <dd className="text-[13px] font-semibold text-zinc-800 break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Quick Notes Section */}
            {lead.notes && (
              <div className="px-6 py-5 bg-orange-50/20">
                <h3 className="flex items-center gap-1.5 text-[12px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  <FileText size={12} className="text-orange-500" /> Lead Summary / Notes
                </h3>
                <p className="text-[13px] text-zinc-700 leading-relaxed font-medium whitespace-pre-wrap">
                  {lead.notes}
                </p>
              </div>
            )}

            {/* Activity Stream/Comments Thread */}
            <div className="px-6 py-5 flex flex-col h-[350px]">
              <h3 className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Activity Stream</h3>
              <div className="flex-1 overflow-y-auto">
                <CommentThread leadId={lead.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadDetailDrawer;
