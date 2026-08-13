// src/features/opportunities/components/OpportunityCard.jsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IndianRupee, Calendar, User, TrendingUp } from 'lucide-react';

/**
 * OpportunityCard — Presentational & sortable card for Kanban board
 */
export const OpportunityCard = ({ opportunity, onClick, isOverlay = false }) => {
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

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick && onClick(opportunity)}
      className={`group bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm hover:shadow hover:border-orange-300 transition-all cursor-grab active:cursor-grabbing select-none mb-2.5 ${
        isOverlay ? 'shadow-lg border-orange-400 rotate-1 scale-[1.02]' : ''
      }`}
    >
      {/* Title & Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-slate-800 text-sm group-hover:text-orange-600 transition-colors line-clamp-1">
          {opportunity.opportunityName}
        </h4>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
            opportunity.status === 'WON'
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : opportunity.status === 'LOST'
              ? 'bg-rose-50 text-rose-600 border border-rose-200'
              : 'bg-orange-50 text-orange-700 border border-orange-200'
          }`}
        >
          {opportunity.status}
        </span>
      </div>

      {/* Lead Name */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">{opportunity.lead?.name || 'Unassigned Lead'}</span>
      </div>

      {/* Revenue & Probability */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1 font-semibold text-slate-900">
          <IndianRupee className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
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
