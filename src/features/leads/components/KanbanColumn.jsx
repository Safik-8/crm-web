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

const KanbanColumn = ({ stage, leads, loading, onLeadClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className={`flex items-center justify-between mb-3 px-1 ${stage.isDefault ? '' : ''}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${stage.isDefault ? 'bg-primary' : 'bg-slate-400'}`} />
          <h3 className="font-bold text-sm text-slate-800 font-heading truncate max-w-44">{stage.name}</h3>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full min-w-[28px] text-center">
          {leads.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-2xl p-3 space-y-3 min-h-32 transition-colors ${
          isOver ? 'bg-primary/5 ring-2 ring-primary/30' : 'bg-slate-100/70'
        }`}
      >
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : leads.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-xs text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-xl">
            Drop leads here
          </div>
        ) : (
          <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
            {leads.map(lead => (
              <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
