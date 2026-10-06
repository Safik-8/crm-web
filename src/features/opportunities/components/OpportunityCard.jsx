// src/features/opportunities/components/OpportunityCard.jsx
import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User, TrendingUp, Lock } from 'lucide-react';
import { useFormatters } from '../../../shared/hooks/useFormatters';
import { useAuth } from '../../../app/providers/AuthProvider';

/**
 * OpportunityCard — Presentational & sortable card for Kanban board
 */
export const OpportunityCard = ({ opportunity, onClick, isOverlay = false }) => {
  const { formatCurrency, formatDate } = useFormatters();
  const { user } = useAuth();
  const cardId = `card-${opportunity.id}`;

  const canMove = useMemo(() => {
    if (opportunity.status !== 'OPEN') return false;
    if (!user) return false;
    const rank = Number(user.primaryRoleRank || 0);
    const isSuperAdmin = user.primaryRole === 'SUPER_ADMIN' || rank >= 100;
    if (isSuperAdmin) return true;

    const isCompanyAdmin = user.primaryRole === 'COMPANY_ADMIN' || rank >= 61;
    if (isCompanyAdmin) return true;

    const isBranchManager = (user.primaryRole === 'BRANCH_MANAGER' || (rank >= 41 && rank <= 60)) &&
      Number(user.branchId) === Number(opportunity.branchId);
    if (isBranchManager) return true;

    // Rep tier (ISE, BDE, custom rep): must be assigned owner
    return Number(opportunity.ownerId) === Number(user.id);
  }, [opportunity, user]);

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
    disabled: !canMove,
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
      {...(canMove ? attributes : {})}
      {...(canMove ? listeners : {})}
      onClick={() => onClick && onClick(opportunity)}
      className={`bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs transition-all select-none group relative ${
        canMove ? 'cursor-pointer hover:shadow-md hover:border-orange-300/80' : 'cursor-pointer hover:border-slate-300'
      } ${
        isOverlay ? 'shadow-xl rotate-1 scale-105 ring-2 ring-primary/20 cursor-grabbing' : ''
      }`}
    >
      {/* Header / ID & Priority badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-mono font-bold text-slate-400">
          OPP-{opportunity.id}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {!canMove && opportunity.status === 'OPEN' && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 shrink-0"
              title={`Assigned to ${opportunity.owner?.name || 'another user'}. Only the assigned owner or manager can move this card.`}
            >
              <Lock className="w-2.5 h-2.5" />
              <span>Assigned to {opportunity.owner?.name?.split(' ')[0] || 'Manager'}</span>
            </span>
          )}
          {/* Qualification Score Badge — only shown if a score exists */}
          {(opportunity.qualificationScore != null || opportunity.lead?.qualificationScore != null) && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
              🏆 {opportunity.qualificationScore ?? opportunity.lead?.qualificationScore}%
            </span>
          )}
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
            {opportunity.stage?.name || 'In Progress'}
          </span>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
        {opportunity.title || opportunity.opportunityName}
      </h4>

      {/* Lead Name & Lead ID */}
      <div className="flex items-center justify-between gap-1.5 text-xs text-slate-500 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate font-medium">{opportunity.lead?.name || 'Unassigned Lead'}</span>
        </div>
        {(opportunity.lead?.leadNumber || opportunity.lead?.id) && (
          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
            {opportunity.lead?.leadNumber || `#${opportunity.lead?.id}`}
          </span>
        )}
      </div>

      {/* Attribution: Created By (who closed lead) & Assigned To (handling deal) */}
      <div className="bg-slate-50/80 rounded-lg p-2 mb-2.5 border border-slate-100/80 space-y-1 text-[11px]">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Created By:</span>
          <span className="font-semibold text-slate-700 truncate text-right" title={opportunity.createdBy?.name || 'System'}>
            {opportunity.createdBy?.name || 'System'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Assigned To:</span>
          <span className="font-semibold text-primary truncate text-right" title={opportunity.owner?.name || 'Unassigned'}>
            {opportunity.owner?.name || 'Unassigned'}
          </span>
        </div>
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
