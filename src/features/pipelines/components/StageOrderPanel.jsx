import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Check } from 'lucide-react';
import Button from '../../../shared/components/elements/Button';
import SortableStageRow from './SortableStageRow';

/**
 * StageOrderPanel — Right panel of PipelineStageBuilder.
 * Renders the drag-and-drop sortable list of stages assigned to the active pipeline.
 */
const StageOrderPanel = ({
  selectedStages,
  sensors,
  handleDragEnd,
  handleRemoveFromOrder,
  canRename,
  canDelete,
  stageRename,
  stageDelete,
  handleSave,
  saving,
}) => {
  return (
    <div className="bg-white border border-slate-200 flex flex-col overflow-hidden h-[580px]">
      {/* Panel Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
        <div className="space-y-0.5 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Stage Order
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-200">
              {selectedStages.length} Assigned
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium leading-normal">
            Drag to reorder stages. Prospect stays first; Closure stays last.
          </p>
        </div>
        {handleSave && (
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            isLoading={saving}
            variant="contained"
            size="small"
            startIcon={<Check size={15} strokeWidth={3} />}
            sx={{
              height: '38px',
              borderRadius: '8px',
              backgroundColor: '#F86F03',
              fontWeight: 700,
              fontSize: '12px',
              whiteSpace: 'nowrap',
              shrink: 0,
              '&:hover': { backgroundColor: '#DE5D02' }
            }}
          >
            Save Pipeline Stages
          </Button>
        )}
      </div>

      {/* Sortable DnD Context */}
      <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={selectedStages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {selectedStages.map((stage) => (
                <SortableStageRow
                  key={stage.id}
                  stage={stage}
                  onRemove={handleRemoveFromOrder}
                  canRename={canRename}
                  isEditing={stageRename.isEditing(stage.id)}
                  editValue={stageRename.editValue}
                  onEditChange={stageRename.setEditValue}
                  onEditCommit={stageRename.commitEdit}
                  onEditCancel={stageRename.cancelEdit}
                  renaming={stageRename.renaming}
                  onStartEdit={() => stageRename.startEdit(stage)}
                  canDelete={canDelete}
                  isDeleting={stageDelete.isDeleting(stage.id)}
                  onDelete={() => stageDelete.openModal(stage)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default StageOrderPanel;
