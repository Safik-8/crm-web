import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, Calendar, BookOpen } from 'lucide-react';

const LeadCard = ({ lead, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Partially mask mobile per privacy best practices
  const maskedMobile = lead.mobile
    ? lead.mobile.toString().replace(/^(\d{2})(\d+)(\d{2})$/, '$1••••••$3')
    : '—';

  const date = lead.date ? new Date(lead.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-100 shadow-sm p-4 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all group select-none ${isDragging ? 'shadow-xl ring-2 ring-primary/30' : ''}`}
    >
      {/* Lead name */}
      <p className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors truncate">{lead.name}</p>

      {/* Interest tag */}
      {lead.interested_for && (
        <div className="flex items-center gap-1.5 mt-2">
          <BookOpen size={12} className="text-primary flex-shrink-0" />
          <span className="text-xs text-primary font-semibold bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 truncate">
            {lead.interested_for}
          </span>
        </div>
      )}

      {/* Mobile + Date */}
      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Phone size={11} />
          <span className="text-xs font-mono">{maskedMobile}</span>
        </div>
        {date && (
          <div className="flex items-center gap-1 text-slate-400">
            <Calendar size={11} />
            <span className="text-xs">{date}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadCard;
