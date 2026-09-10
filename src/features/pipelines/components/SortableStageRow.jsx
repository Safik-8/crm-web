import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Lock, X, Pencil, Trash2, Loader2 } from 'lucide-react';
import InlineStageNameEditor from './InlineStageNameEditor';
import { isMandatoryStage } from '../utils/stageRules';

/**
 * Sortable stage row for the Stage Order (right) panel.
 *
 * Mandatory stages (Prospect, Closure) are fully locked — no drag, rename, remove, or delete.
 *
 * Props:
 *  stage        - stage object
 *  onRemove     - (stageId) => void  — deselect from pipeline
 *  canRename    - bool
 *  isEditing / editValue / onEditChange / onEditCommit / onEditCancel / renaming / onStartEdit
 *  canDelete    - bool   — show global delete button
 *  isDeleting   - bool   — spinner while API call in-flight
 *  onDelete     - () => void — triggers confirmation modal in parent
 */
const SortableStageRow = ({
  stage,
  onRemove,
  canRename = false,
  isEditing = false,
  editValue = '',
  onEditChange,
  onEditCommit,
  onEditCancel,
  renaming = false,
  onStartEdit,
  canDelete = false,
  isDeleting = false,
  onDelete,
}) => {
  const mandatory = isMandatoryStage(stage);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id, disabled: mandatory || isEditing || isDeleting });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : isDeleting ? 0.55 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const getStageTypeBadge = () => {
    switch (stage.stageType) {
      case 'WON':
        return <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md">WON</span>;
      case 'LOST':
        return <span className="text-[9px] font-extrabold text-red-600 bg-red-50 border border-red-200/80 px-1.5 py-0.5 rounded-md">LOST</span>;
      case 'PROSPECT':
        return <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 rounded-md">PROSPECT</span>;
      case 'CLOSURE':
        return <span className="text-[9px] font-extrabold text-purple-600 bg-purple-50 border border-purple-200/80 px-1.5 py-0.5 rounded-md">CLOSURE</span>;
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 bg-white border rounded-none px-4 py-3.5 transition-all ${
        isDragging
          ? 'border-orange-300 shadow-2xl scale-[1.02] ring-4 ring-orange-100'
          : isEditing
            ? 'border-orange-300 shadow-md ring-2 ring-orange-100'
            : isDeleting
              ? 'border-red-200 bg-red-50/30'
              : mandatory
                ? 'border-slate-200 border-l-[3px] border-l-orange-300 bg-orange-50/[0.08]'
                : 'border-slate-200 border-l-[3px] border-l-orange-300 hover:border-slate-300'
      }`}
    >
      {/* Drag handle / lock */}
      <div
        {...(mandatory || isEditing || isDeleting ? {} : { ...attributes, ...listeners })}
        className={`flex-shrink-0 flex items-center justify-center transition-colors
          min-h-[40px] min-w-[28px] sm:min-h-0 sm:min-w-0
          ${mandatory
            ? 'text-orange-500/60 cursor-not-allowed'
            : isEditing || isDeleting
              ? 'text-slate-300 cursor-default'
              : 'text-slate-500 hover:text-slate-800 cursor-grab active:cursor-grabbing touch-none'
          }`}
        style={{ touchAction: 'none' }}
        title={mandatory ? 'Mandatory system stage — cannot be moved' : undefined}
      >
        {mandatory
          ? <Lock size={14} strokeWidth={2.5} />
          : <GripVertical size={18} strokeWidth={2.5} />
        }
      </div>

      {/* Stage color dot */}
      {stage.colorCode && (
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: stage.colorCode }}
          title={`Color: ${stage.colorCode}`}
        />
      )}

      {/* Stage name or inline editor */}
      {isEditing ? (
        <InlineStageNameEditor
          value={editValue}
          onChange={onEditChange}
          onCommit={onEditCommit}
          onCancel={onEditCancel}
          loading={renaming}
        />
      ) : (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`text-sm font-bold truncate transition-colors ${
            mandatory ? 'text-orange-950' : isDeleting ? 'text-slate-400' : 'text-slate-900'
          }`}>
            {stage.name}
          </span>

          {/* Code badge (only if different from stageType) */}
          {stage.code && stage.code !== stage.stageType && (
            <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
              {stage.code}
            </span>
          )}

          {/* StageType badge */}
          {getStageTypeBadge()}
        </div>
      )}

      {/* Right side actions */}
      {!isEditing && (
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
          {mandatory ? (
            <span
              className="text-[10px] font-black text-orange-600 uppercase tracking-widest
                bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg"
              title="Mandatory system stage — always required"
            >
              REQUIRED
            </span>
          ) : (
            <>
              {/* Rename */}
              {canRename && !isDeleting && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onStartEdit?.(); }}
                  className="p-2 rounded-lg bg-slate-100 text-slate-700
                    hover:bg-orange-50 hover:text-orange-600
                    transition-all focus:outline-none focus:ring-2 focus:ring-orange-200"
                  title="Rename stage"
                  aria-label={`Rename ${stage.name}`}
                >
                  <Pencil size={14} strokeWidth={2.2} />
                </button>
              )}

              {/* Global delete */}
              {canDelete && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                  disabled={isDeleting}
                  className="p-2 rounded-lg bg-slate-100 text-slate-700
                    hover:bg-red-50 hover:text-red-600
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all focus:outline-none focus:ring-2 focus:ring-red-200"
                  title="Delete stage globally"
                  aria-label={`Delete ${stage.name}`}
                >
                  {isDeleting
                    ? <Loader2 size={13} className="animate-spin text-red-400" />
                    : <Trash2 size={14} strokeWidth={2.2} />
                  }
                </button>
              )}

              {/* Remove from pipeline (deselect) */}
              {!isDeleting && (
                <button
                  type="button"
                  onClick={() => onRemove(stage.id)}
                  className="p-2 rounded-lg bg-slate-100 text-slate-700
                    hover:bg-red-50 hover:text-red-600
                    transition-all focus:outline-none focus:ring-2 focus:ring-red-200"
                  title="Remove from pipeline"
                  aria-label={`Remove ${stage.name} from pipeline`}
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SortableStageRow;
