import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, Calendar, BookOpen, User, MoreVertical, Pencil, Trash2, Lock, Target } from 'lucide-react';

const LeadCard = memo(({ lead, stageId, stageName, isTerminal = false, onClick, canManage = false, onEdit, onDelete, onQualify }) => {
  const sortableId = `card-${lead.id}`;

  // Card is locked if user lacks edit/create permissions OR if the stage is terminal (WON/CLOSURE)
  const isLocked = !canManage || isTerminal;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    data: { type: 'card', leadId: lead.id, stageId },
    disabled: isLocked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
    willChange: isDragging ? 'transform' : 'auto',
    touchAction: isLocked ? 'auto' : 'none',
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onOutside = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) setMenuOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [menuOpen]);

  const handleMenuToggle = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuOpen((v) => !v);
  }, []);

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onEdit?.(lead);
  }, [lead, onEdit]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onDelete?.(lead);
  }, [lead, onDelete]);

  const handleQualify = useCallback((e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onQualify?.(lead);
  }, [lead, onQualify]);

  const maskedMobile = lead.mobile
    ? lead.mobile.toString().replace(/^(\d{2})(\d+)(\d{2})$/, '$1••••••$3')
    : '—';

  const followUpDate = lead.nextFollowUpDate || lead.next_followup_date || lead.followUpDate || lead.date;
  const formattedFollowUp = followUpDate
    ? new Date(followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : null;

  const isFollowUpOverdue = followUpDate && new Date(followUpDate) < new Date();

  const interest = lead.course?.name || lead.interestedFor || lead.interested_for;

  const priorityUpper = lead.priority?.toUpperCase();
  const priorityBadgeStyle = {
    HIGH: 'bg-rose-50 border-rose-200/80 text-rose-700',
    MEDIUM: 'bg-amber-50 border-amber-200/80 text-amber-700',
    LOW: 'bg-blue-50 border-blue-200/80 text-blue-700',
  }[priorityUpper];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isLocked ? {} : listeners)}
      onClick={() => {
        if (!isDragging) onClick?.();
      }}
      className={`relative bg-white rounded-xl border select-none overflow-visible group cursor-pointer
        ${isLocked
          ? 'border-emerald-200/80 bg-emerald-50/20 shadow-sm'
          : isDragging
            ? 'shadow-2xl ring-2 ring-primary/25 rotate-[1deg] border-primary/20 scale-[1.02] cursor-grabbing'
            : 'border-zinc-200 shadow-sm hover:shadow-md hover:-translate-y-px hover:border-zinc-300 transition-[transform,box-shadow,border-color] duration-150 ease-out cursor-pointer active:cursor-grabbing'
        }`}
    >

      {/* Lock badge for locked cards — replaces drag affordance */}
      {isLocked && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <div
            className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-100/80 text-emerald-600"
            title={isTerminal ? "Terminal stage — leads cannot be moved out" : "Read-only access"}
          >
            <Lock size={11} strokeWidth={2.5} />
          </div>
        </div>
      )}

      {/* Three-dot trigger — top right */}
      {canManage && !isLocked && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <button
            ref={triggerRef}
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleMenuToggle}
            className={`flex items-center justify-center w-6 h-6 rounded-md transition-all duration-100 outline-none
              ${menuOpen
                ? 'bg-zinc-200 text-zinc-700'
                : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700'
              }`}
            aria-label="Lead actions"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <MoreVertical size={14} strokeWidth={2.5} />
          </button>

          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full mt-1 z-[60] bg-white rounded-lg border border-zinc-200 shadow-lg py-1 w-36 animate-in fade-in zoom-in-95 duration-100 origin-top-right"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleEdit}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 transition-colors outline-none"
              >
                <Pencil size={11} className="text-zinc-400 shrink-0" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleQualify}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 transition-colors outline-none"
              >
                <Target size={11} className="text-zinc-400 shrink-0" />
                Qualify Lead
              </button>
              <div className="h-px bg-zinc-100 mx-2 my-0.5" />
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors outline-none"
              >
                <Trash2 size={11} className="shrink-0" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="px-3.5 pt-3 pb-3">

        {/* Name */}
        <div
          className="cursor-pointer pr-5"
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        >
          <p className="font-semibold text-zinc-900 text-[13.5px] leading-snug tracking-tight truncate group-hover:text-primary transition-colors duration-150">
            {lead.name}
          </p>
        </div>

        {/* Badges container: Qualification, Course & Priority */}
        {(interest || priorityBadgeStyle || lead.qualification) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 pointer-events-none">
            {lead.qualification && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-[9.5px] font-bold text-emerald-600 uppercase tracking-wide shrink-0">
                <Target size={9} className="shrink-0 text-emerald-500" />
                Qualified {lead.qualification.score ? `• ${lead.qualification.score}%` : ''}
              </span>
            )}
            {interest && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-50 border border-orange-100 text-[10px] font-semibold text-orange-600 truncate max-w-[130px]">
                <BookOpen size={9} className="shrink-0 text-orange-400" />
                <span className="truncate">{interest}</span>
              </span>
            )}
            {priorityBadgeStyle && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[9.5px] font-bold tracking-wide uppercase shrink-0 ${priorityBadgeStyle}`}>
                {priorityUpper}
              </span>
            )}
          </div>
        )}

        {/* Assigned user */}
        <div className="mt-2.5 flex items-center gap-1.5 pointer-events-none">
          <User size={11} className={lead.assignedTo ? 'text-zinc-400' : 'text-zinc-300'} />
          <span className={`text-[11.5px] truncate ${lead.assignedTo ? 'text-zinc-500 font-medium' : 'text-zinc-300 italic'
            }`}>
            {lead.assignedTo?.name || 'Unassigned'}
          </span>
        </div>

        {/* Divider */}
        <div className="mt-2.5 mb-2.5 h-px bg-zinc-100" />

        {/* Footer */}
        <div className="flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5">
            <Phone size={10} className="text-zinc-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-500 tabular-nums tracking-tight">
              {maskedMobile}
            </span>
          </div>

          {formattedFollowUp && (
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium transition-colors ${isFollowUpOverdue
                  ? 'bg-rose-50 text-rose-600 font-bold border border-rose-100'
                  : 'text-zinc-500'
                }`}
              title={lead.nextFollowUpDate ? (isFollowUpOverdue ? 'Overdue Follow-up' : 'Next Follow-up Due') : 'Lead Date'}
            >
              <Calendar size={9} className={`shrink-0 ${isFollowUpOverdue ? 'text-rose-500' : 'text-zinc-400'}`} />
              <span>{formattedFollowUp}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
});

LeadCard.displayName = 'LeadCard';

export default LeadCard;
