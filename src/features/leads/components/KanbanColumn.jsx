import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import LeadCard from './LeadCard';

// Skeleton card shown while loading
const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-2 animate-pulse">
    <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
    <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
    <div className="h-px bg-slate-100 my-2" />
    <div className="flex justify-between">
      <div className="h-3 bg-slate-100 rounded w-20" />
      <div className="h-3 bg-slate-100 rounded w-12" />
    </div>
  </div>
);

const KanbanColumn = memo(({ stage, leads, loading, onLeadClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    /*
     * Width:
     *   mobile  → 72vw  (shows ~1.3 columns, hinting there's more to swipe)
     *   sm      → 17rem (272px)
     *   md+     → 18rem (288px)
     * flex-shrink-0 keeps columns from collapsing inside the horizontal scroll container.
     */
    <div className="flex flex-col w-[72vw] sm:w-[272px] md:w-72 flex-shrink-0 h-full">
      {/* Column header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3 px-1 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full flex-shrink-0 ${stage.isDefault ? 'bg-primary' : 'bg-slate-400'}`} />
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 font-heading truncate max-w-[120px] sm:max-w-44">
            {stage.name}
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 sm:px-2.5 py-0.5 rounded-full min-w-[24px] sm:min-w-[28px] text-center">
          {leads.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-0 flex flex-col rounded-xl sm:rounded-2xl transition-colors overflow-hidden ${
          isOver ? 'bg-primary/5 ring-2 ring-primary/30' : 'bg-slate-100/70'
        }`}
      >
        {loading ? (
          <div className="p-2 sm:p-3 space-y-2 sm:space-y-3 overflow-hidden">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : leads.length === 0 ? (
          <div className={`flex items-center justify-center flex-1 min-h-24 sm:min-h-32 text-xs font-medium border-2 border-dashed rounded-lg sm:rounded-xl m-2 sm:m-3 transition-colors ${
            isOver ? 'border-primary/40 text-primary' : 'border-slate-200 text-slate-400'
          }`}>
            Drop here
          </div>
        ) : (
          /* touch-pan-x lets the user scroll the board horizontally even when
             their finger starts on a card — only the drag handle triggers DnD */
          <div className="flex-1 overflow-y-auto custom-scrollbar-thin p-2 sm:p-3 space-y-2 sm:space-y-3">
            <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
              {leads.map(lead => (
                <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
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
