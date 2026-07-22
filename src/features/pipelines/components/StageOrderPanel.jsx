// src/features/pipelines/components/StageOrderPanel.jsx

import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableStageRow from './SortableStageRow';

/**
 * StageOrderPanel — Right panel of PipelineStageBuilder.
 * Renders the drag-and-drop sortable list of stages assigned to the active pipeline.
 *
 * @param {Object} props
 * @param {Array} props.selectedStages - Ordered list of selected stages
 * @param {Object} props.sensors - DnD sensors instance
 * @param {Function} props.handleDragEnd - Callback invoked when a stage is dropped
 * @param {Function} props.handleRemoveFromOrder - Callback to remove non-mandatory stage
 * @param {boolean} props.canRename - RBAC boolean for stage rename permission
 * @param {boolean} props.canDelete - RBAC boolean for stage delete permission
 * @param {Object} props.stageRename - Stage rename hook state & actions
 * @param {Object} props.stageDelete - Stage delete hook state & actions
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
}) => {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
      style={{ height: 560 }}
    >
      {/* Panel Header */}
      <div className="px-6 pt-6 pb-5 border-b border-slate-100 space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.18em]">
            Stage Order
          </h2>
          <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
            {selectedStages.length} Stages Assigned
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Drag to reorder stages. Prospect stays first; Closure stays last.
        </p>
      </div>

      {/* Sortable DnD Context */}
      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
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
