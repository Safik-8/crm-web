// src/features/opportunities/components/OpportunityCard.jsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User, TrendingUp } from 'lucide-react';
import { useFormatters } from '../../../shared/hooks/useFormatters';

/**
 * OpportunityCard — Presentational & sortable card for Kanban board
 */
export const OpportunityCard = ({ opportunity, onClick, isOverlay = false }) => {
  const { formatCurrency, formatDate } = useFormatters();
  const cardId = `card-${opportunity.id}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: cardId,
    data: { type: 'card', opportunity },
    disabled: opportunity.status !== 'OPEN',
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick && onClick(opportunity)}
      className={`bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs hover:shadow-md hover:border-orange-300/80 transition-all cursor-pointer select-none group relative ${
        isOverlay ? 'shadow-xl rotate-1 scale-105 ring-2 ring-primary/20 cursor-grabbing' : ''
      }`}
    >
      {/* Header / ID & Priority badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-mono font-bold text-slate-400">
          OPP-{opportunity.id}
        </span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
          {opportunity.stage?.name || 'In Progress'}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
        {opportunity.title}
      </h4>

      {/* Lead Name */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">{opportunity.lead?.name || 'Unassigned Lead'}</span>
      </div>

      {/* Revenue & Probability */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1 font-bold text-emerald-600">
          <span>{formatCurrency(opportunity.expectedRevenue)}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <div className="flex items-center gap-1 text-[11px]">
            <TrendingUp className="w-3 h-3 text-orange-500 shrink-0" />
            <span>{opportunity.probabilityPercentage || 10}%</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{formatDate(opportunity.closingDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
