import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Lock, X } from 'lucide-react';

/**
 * A single sortable stage row used inside the Stage Aligner.
 * Prospect stage is locked (cannot be removed or dragged away from position 1).
 */
const SortableStageRow = ({ stage, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id, disabled: stage.isDefault });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 bg-white border rounded-xl px-4 py-3.5 transition-all ${
        isDragging
          ? 'border-primary/50 shadow-2xl scale-[1.02] ring-4 ring-primary/5 z-50'
          : 'border-slate-100 border-l-[4px] border-l-primary shadow-sm hover:border-slate-200 hover:shadow-md'
      }`}
    >
      {/* Drag handle */}
      <div
        {...(stage.isDefault ? {} : { ...attributes, ...listeners })}
        className={`flex-shrink-0 transition-colors ${
          stage.isDefault 
            ? 'text-primary/40 cursor-not-allowed' 
            : 'text-slate-300 group-hover:text-primary/60 cursor-grab active:cursor-grabbing'
        }`}
      >
        {stage.isDefault ? <Lock size={14} strokeWidth={3} /> : <GripVertical size={18} strokeWidth={2.5} />}
      </div>

      {/* Stage name */}
      <span className={`flex-1 text-sm font-bold tracking-tight ${stage.isDefault ? 'text-primary' : 'text-slate-900'}`}>
        {stage.name}
      </span>

      {/* Prospect badge */}
      {stage.isDefault && (
        <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">
          Required
        </span>
      )}

      {/* Remove button — hidden for Prospect */}
      {!stage.isDefault && (
        <button
          type="button"
          onClick={() => onRemove(stage.id)}
          className="flex-shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};

export default SortableStageRow;
