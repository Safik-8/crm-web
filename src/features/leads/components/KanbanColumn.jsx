import { memo, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Inbox, SearchX, Lock } from 'lucide-react';
import LeadCard from './LeadCard';
import { isTerminalStage } from '../../pipelines/utils/stageRules';

/**
 * Prefix helpers — keep DnD ids collision-free between entities.
 * Stage droppable: "stage-{id}"   Card sortable: "card-{id}"
 */
const stageDropId = (id) => `stage-${id}`;
const cardSortId = (id) => `card-${id}`;

// Skeleton card — matches card proportions
const SkeletonCard = () => (
  <div className="bg-white/80 rounded-2xl border border-zinc-200/60 p-4 space-y-3 animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
    <div className="h-3.5 bg-zinc-200 rounded-lg w-3/4" />
    <div className="h-5 bg-zinc-100 rounded-lg w-2/5" />
    <div className="flex items-center gap-2 pt-1">
      <div className="h-5 w-5 rounded-full bg-zinc-200" />
      <div className="h-3 bg-zinc-200 rounded-lg w-24" />
    </div>
    <div className="h-px bg-zinc-100 mt-1" />
    <div className="flex justify-between items-center">
      <div className="h-3 bg-zinc-200 rounded-lg w-20" />
      <div className="h-3 bg-zinc-200 rounded-lg w-12" />
    </div>
  </div>
);

const KanbanColumn = memo(({ stage, leads, loading, isRefetching, isFiltered, onLeadClick, canManage, onEditLead, onDeleteLead, onQualifyLead }) => {
  // Prefixed droppable ID prevents collision with card IDs (lead.id and stage.id share numeric space)
  const droppableId = stageDropId(stage.id);
  const isTerminal = isTerminalStage(stage);
  const isClosureCol = stage.name?.toLowerCase() === 'closure';

  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { type: 'column', stageId: stage.id },
    // Terminal columns still need to be droppable so DnD doesn't error,
    // but we block dragging OUT in handleDragEnd / moveCard.
  });
  // Card sortable IDs are also prefixed to keep them in a separate namespace
  const sortableIds = useMemo(() => leads.map((l) => cardSortId(l.id)), [leads]);
  const columnBudgetSum = useMemo(() => leads.reduce((sum, l) => sum + (Number(l.budget) || 0), 0), [leads]);

  return (
    <div className="flex flex-col w-[76vw] xs:w-[72vw] sm:w-[272px] md:w-[288px] flex-shrink-0 h-full">

      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-0.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {/* Stage dot */}
          <span
            className={`h-2.5 w-2.5 rounded-full flex-shrink-0 transition-all duration-300 ${isRefetching ? 'bg-zinc-300 animate-pulse' : ''
              }`}
            style={{
              backgroundColor: !isRefetching ? (stage.colorCode || (stage.isDefault ? '#f86f03' : isClosureCol ? '#10b981' : '#a1a1aa')) : undefined,
              boxShadow: !isRefetching && (stage.colorCode || stage.isDefault || isClosureCol)
                ? `0 0 0 3px ${(stage.colorCode || (stage.isDefault ? '#f86f03' : '#10b981'))}25`
                : undefined
            }}
          />
          <h3 className="font-semibold text-[13px] text-zinc-800 font-heading truncate max-w-[150px] sm:max-w-[180px] tracking-tight">
            {stage.name}
          </h3>
          {isTerminal && (
            <Lock size={11} className="text-zinc-500 flex-shrink-0" strokeWidth={2.5} title="Terminal stage — leads cannot be moved out once placed here" />
          )}
        </div>

        {/* Lead count & Budget sum badge */}
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center transition-all duration-300 ${isRefetching
            ? 'text-zinc-300 bg-zinc-100 animate-pulse'
            : leads.length > 0
              ? isTerminal
                ? 'text-emerald-600 bg-emerald-50 border border-emerald-200/60'
                : 'text-orange-600 bg-orange-50 border border-orange-200/60'
              : 'text-zinc-400 bg-zinc-100'
          }`}>
          {leads.length}{columnBudgetSum > 0 ? ` • ₹${columnBudgetSum.toLocaleString('en-IN')}` : ''}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-0 flex flex-col rounded-2xl transition-all duration-200 overflow-hidden relative ${isOver && !isTerminal
            ? 'bg-orange-50/80 ring-2 ring-orange-300/50 shadow-[inset_0_0_0_1px_rgba(248,111,3,0.12)]'
            : isTerminal
              ? 'bg-emerald-50/30'
              : 'bg-zinc-100/70'
          }`}
      >
        {/* Refetch overlay — subtle frosted glass */}
        {isRefetching && !loading && (
          <div className="absolute inset-0 z-10 rounded-2xl bg-white/40 backdrop-blur-[1px] pointer-events-none" />
        )}

        {loading ? (
          <div className="p-2.5 space-y-2.5 overflow-hidden">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : leads.length === 0 ? (
          /* Premium empty state */
          <div className={`flex flex-col items-center justify-center flex-1 min-h-32 gap-2 m-2.5 rounded-xl border-2 border-dashed transition-all duration-200 ${isOver
              ? 'border-orange-300/70 bg-orange-50/60 text-orange-500'
              : 'border-zinc-200/80 text-zinc-400'
            }`}>
            {isFiltered ? (
              <>
                <SearchX size={18} className="opacity-50" />
                <span className="text-[11px] font-medium text-zinc-500">No matching leads</span>
              </>
            ) : (
              <>
                <Inbox size={18} className={`transition-colors ${isOver ? 'text-orange-400' : 'text-zinc-300'}`} />
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-zinc-400">No leads yet</p>
                  <p className="text-[10px] text-zinc-300 mt-0.5">Drag a lead here</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar-thin p-2.5 space-y-2">
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  stageId={stage.id}
                  stageName={stage.name}
                  isTerminal={isTerminal}
                  onClick={() => onLeadClick(lead)}
                  canManage={canManage}
                  onEdit={onEditLead}
                  onDelete={onDeleteLead}
                  onQualify={onQualifyLead}
                />
              ))}
            </SortableContext>
          </div>
        )}
      </div>
    </div>
  );
});

KanbanColumn.displayName = 'KanbanColumn';

export default KanbanColumn;
