import { memo, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import LeadCard from './LeadCard';

// Skeleton card — higher contrast so it's visible on the column background
const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 animate-pulse shadow-sm">
    <div className="h-3.5 bg-slate-200 rounded-md w-3/4" />
    <div className="h-3 bg-slate-150 rounded-md w-1/2" style={{ backgroundColor: '#e8ecf0' }} />
    <div className="h-px bg-slate-200 my-1" />
    <div className="flex justify-between items-center">
      <div className="h-3 bg-slate-200 rounded w-20" />
      <div className="h-3 bg-slate-200 rounded w-12" />
    </div>
  </div>
);

const KanbanColumn = memo(({ stage, leads, loading, isRefetching, isFiltered, onLeadClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const leadIds = useMemo(() => leads.map((l) => l.id), [leads]);

  return (
    <div className="flex flex-col w-[72vw] sm:w-[272px] md:w-72 flex-shrink-0 h-full">

      {/* Column header */}
      <div className="flex items-center justify-between mb-2.5 px-1 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 transition-colors duration-300 ${
            isRefetching
              ? 'bg-slate-300 animate-pulse'
              : stage.isDefault
              ? 'bg-primary shadow-[0_0_0_3px_rgba(248,111,3,0.15)]'
              : 'bg-slate-400'
          }`} />
          <h3 className="font-bold text-sm text-slate-800 font-heading truncate max-w-[140px] sm:max-w-44">
            {stage.name}
          </h3>
        </div>
        {/* Lead count badge — stronger contrast */}
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[28px] text-center transition-all duration-300 ${
          isRefetching
            ? 'text-slate-300 bg-slate-100 animate-pulse'
            : leads.length > 0
            ? 'text-primary bg-primary/10 border border-primary/20'
            : 'text-slate-500 bg-slate-200'
        }`}>
          {leads.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-0 flex flex-col rounded-2xl transition-all duration-200 overflow-hidden relative ${
          isOver
            ? 'bg-primary/8 ring-2 ring-primary/40 shadow-[inset_0_0_0_2px_rgba(248,111,3,0.15)]'
            : 'bg-slate-200/60'
        }`}
        style={isOver ? { backgroundColor: 'rgba(248,111,3,0.06)' } : {}}
      >
        {/* Refetch overlay — subtle frosted glass */}
        {isRefetching && !loading && (
          <div className="absolute inset-0 z-10 rounded-2xl bg-white/50 backdrop-blur-[1px] pointer-events-none" />
        )}

        {loading ? (
          <div className="p-2.5 space-y-2.5 overflow-hidden">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : leads.length === 0 ? (
          <div className={`flex flex-col items-center justify-center flex-1 min-h-28 text-xs font-medium border-2 border-dashed rounded-xl m-2.5 transition-colors ${
            isOver ? 'border-primary/50 text-primary bg-primary/5' : 'border-slate-300 text-slate-400'
          }`}>
            {isFiltered
              ? <span className="text-slate-500 font-medium">No matching leads</span>
              : <span className="text-slate-400">Drop here</span>
            }
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar-thin p-2.5 space-y-2.5">
            <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
              {leads.map((lead) => (
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
