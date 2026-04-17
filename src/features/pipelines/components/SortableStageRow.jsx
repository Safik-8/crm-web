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
      className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 shadow-sm transition-all ${
        stage.isDefault
          ? 'border-primary/30 bg-primary/5'
          : isDragging
          ? 'border-slate-300 shadow-lg'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Drag handle */}
      <div
        {...(stage.isDefault ? {} : { ...attributes, ...listeners })}
        className={`flex-shrink-0 ${stage.isDefault ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 cursor-grab active:cursor-grabbing'}`}
      >
        {stage.isDefault ? <Lock size={16} className="text-primary" /> : <GripVertical size={16} />}
      </div>

      {/* Stage name */}
      <span className={`flex-1 text-sm font-semibold ${stage.isDefault ? 'text-primary' : 'text-slate-800'}`}>
        {stage.name}
      </span>

      {/* Prospect badge */}
      {stage.isDefault && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
          Required
        </span>
      )}

      {/* Remove button — hidden for Prospect */}
      {!stage.isDefault && (
        <button
          type="button"
          onClick={() => onRemove(stage.id)}
          className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};

export default SortableStageRow;
