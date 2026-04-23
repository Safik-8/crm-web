import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, Calendar, BookOpen, GripVertical } from 'lucide-react';

const LeadCard = ({ lead, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
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
      className={`relative bg-white rounded-2xl border border-slate-100 shadow-soft p-4 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 group select-none touch-manipulation overflow-hidden ${isDragging ? 'shadow-2xl ring-2 ring-primary/40 rotate-1' : ''}`}
    >
      <div 
        className="absolute inset-0 z-0 cursor-pointer" 
        onClick={onClick}
      />

      {/* Visual Accent - Left Stage Indicator */}
      <div className={`absolute top-0 left-0 w-1.5 h-full z-10 ${lead.interested_for ? 'bg-primary' : 'bg-primary/20'}`} />

      {/* Drag handle - explicitly for dragging */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-lg transition-all cursor-grab active:cursor-grabbing z-20 opacity-0 group-hover:opacity-100"
      >
        <GripVertical size={16} />
      </div>

      {/* Lead content */}
      <div className="relative z-10 pointer-events-none">
        <div className="flex items-start justify-between gap-2 pr-6">
          <p className="font-heading font-bold text-slate-900 text-[15px] group-hover:text-primary transition-colors leading-snug">
            {lead.name}
          </p>
        </div>

      {/* Interest tag - Redesigned as a premium label */}
      {lead.interested_for && (
        <div className="mt-3 flex">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-orange-50 border border-orange-100/50">
            <BookOpen size={12} className="text-primary/70" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              {lead.interested_for}
            </span>
          </div>
        </div>
      )}

      {/* Metadata - Phone + Date */}
      <div className="mt-5 flex items-center justify-between text-slate-500 border-t border-slate-50 pt-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:text-primary transition-colors">
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
};

export default LeadCard;
