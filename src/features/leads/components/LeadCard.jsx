import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, Calendar, BookOpen } from 'lucide-react';

/**
 * LeadCard
 * The entire card is the drag handle — listeners are on the root div.
 * A separate click handler on the content area opens the detail drawer.
 * touch-none on the root prevents the browser from stealing the touch
 * for page scroll before dnd-kit can capture it.
 */
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
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
    willChange: isDragging ? 'transform' : 'auto',
    touchAction: 'none', // must be inline — Tailwind touch-none alone isn't enough for dnd-kit
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
      className={`relative bg-white rounded-2xl border border-slate-100 shadow-soft select-none overflow-hidden group
        cursor-grab active:cursor-grabbing
        ${isDragging
          ? 'shadow-2xl ring-2 ring-primary/40 rotate-1'
          : 'hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/30 transition-[transform,box-shadow,border-color] duration-200'
        }`}
    >
      {/* Left accent bar */}
      <div className={`absolute top-0 left-0 w-1.5 h-full z-10 ${lead.interested_for ? 'bg-primary' : 'bg-primary/20'}`} />

      {/* Card content */}
      <div className="relative z-10 p-4">
        {/* Name row — click opens detail drawer, pointer-events isolated */}
        <div
          className="pr-2 cursor-pointer"
          onClick={(e) => {
            // Only fire click if the pointer didn't move (i.e. not a drag)
            e.stopPropagation();
            onClick?.();
          }}
        >
          <p className="font-heading font-bold text-slate-900 text-[15px] leading-snug group-hover:text-primary transition-colors duration-150">
            {lead.name}
          </p>
        </div>

        {lead.interested_for && (
          <div className="mt-3 flex pointer-events-none">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-orange-50 border border-orange-100/50">
              <BookOpen size={12} className="text-primary/70" />
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                {lead.interested_for}
              </span>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between text-slate-500 border-t border-slate-50 pt-4 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400">
              <Phone size={12} />
            </div>
            <span className="text-xs font-semibold tracking-tight">{maskedMobile}</span>
          </div>

          {date && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50/50 text-slate-400">
              <Calendar size={11} />
              <span className="text-[11px] font-medium">{date}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

LeadCard.displayName = 'LeadCard';

export default LeadCard;
