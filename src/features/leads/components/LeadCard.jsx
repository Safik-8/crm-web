import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, Calendar, BookOpen, User } from 'lucide-react';

const LeadCard = memo(({ lead, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 50 : 'auto',
    willChange: isDragging ? 'transform' : 'auto',
    touchAction: 'none',
  };

  const maskedMobile = lead.mobile
    ? lead.mobile.toString().replace(/^(\d{2})(\d+)(\d{2})$/, '$1••••••$3')
    : '—';

  const date = lead.date
    ? new Date(lead.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative bg-white rounded-2xl border select-none overflow-hidden group
        cursor-grab active:cursor-grabbing
        ${isDragging
          ? 'shadow-2xl ring-2 ring-primary/50 rotate-1 border-primary/30'
          : 'border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.07),0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12),0_1px_4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-primary/25 transition-[transform,box-shadow,border-color] duration-200'
        }`}
    >
      {/* Left accent bar — full-height, vivid when interested_for set */}
      <div className={`absolute top-0 left-0 w-[3px] h-full z-10 rounded-l-2xl ${
        lead.interested_for ? 'bg-primary' : 'bg-slate-200'
      }`} />

      {/* Card content */}
      <div className="relative z-10 px-4 pt-3.5 pb-3">

        {/* Name */}
        <div
          className="pr-1 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        >
          <p className="font-heading font-bold text-slate-900 text-[14px] leading-snug group-hover:text-primary transition-colors duration-150 truncate">
            {lead.name}
          </p>
        </div>

        {/* Interest badge */}
        {lead.interested_for && (
          <div className="mt-2.5 flex pointer-events-none">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200/70">
              <BookOpen size={11} className="text-primary shrink-0" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wide truncate max-w-[140px]">
                {lead.interested_for}
              </span>
            </div>
          </div>
        )}

        {/* Assigned user */}
        <div className="mt-3 flex items-center gap-2 pointer-events-none">
          <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shrink-0">
            <User size={10} />
          </div>
          <span className={`text-[11px] font-semibold truncate ${
            lead.assignedTo ? 'text-slate-700' : 'text-slate-400 italic'
          }`}>
            {lead.assignedTo?.name || 'Unassigned'}
          </span>
        </div>

        {/* Footer: mobile + date */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 pointer-events-none">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-md bg-slate-100 text-slate-500">
              <Phone size={11} />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 tracking-tight">{maskedMobile}</span>
          </div>

          {date && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
              <Calendar size={10} />
              <span className="text-[10px] font-semibold">{date}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

LeadCard.displayName = 'LeadCard';

export default LeadCard;
