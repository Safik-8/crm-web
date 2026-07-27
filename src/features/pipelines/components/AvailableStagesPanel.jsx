// src/features/pipelines/components/AvailableStagesPanel.jsx

import React from 'react';
import { Plus, Search, Check, Power, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react';
import Button from '../../../shared/components/elements/Button';
import InlineStageNameEditor from './InlineStageNameEditor';
import { isMandatoryStage } from '../utils/stageRules';

/**
 * AvailableStagesPanel — Left panel of PipelineStageBuilder.
 * Manages stage search, quick-add input with color swatch selector, master stage selection,
 * enable/disable status toggling, inline renaming, and global stage deletion.
 *
 * @param {Object} props
 * @param {number} props.customSelectedCount - Number of non-mandatory stages selected
 * @param {Array} props.masterStages - List of all master stages
 * @param {Array} props.displayStages - Filtered master stages to display
 * @param {Set} props.selectedIds - Set of selected stage IDs
 * @param {string} props.newStageName - Controlled quick-add stage name
 * @param {Function} props.setNewStageName - State setter for quick-add stage name
 * @param {string} props.newStageColor - Controlled quick-add stage color hex
 * @param {Function} props.setNewStageColor - State setter for quick-add color hex
 * @param {string} props.searchTerm - Controlled filter query string
 * @param {Function} props.setSearchTerm - State setter for filter query string
 * @param {Function} props.handleAddNewStage - Submits quick-add stage creation
 * @param {Function} props.toggleStage - Toggles stage inclusion in current pipeline
 * @param {Function} props.handleToggleStatus - Toggles stage active/inactive status
 * @param {number|null} props.togglingStageId - ID of stage currently undergoing status toggle
 * @param {boolean} props.canRename - RBAC boolean for stage renaming permission
 * @param {boolean} props.canDelete - RBAC boolean for stage deletion permission
 * @param {Object} props.stageRename - Stage rename hook state & actions
 * @param {Object} props.stageDelete - Stage delete hook state & actions
 */
const AvailableStagesPanel = ({
  customSelectedCount,
  masterStages,
  displayStages,
  selectedIds,
  newStageName,
  setNewStageName,
  newStageColor,
  setNewStageColor,
  searchTerm,
  setSearchTerm,
  handleAddNewStage,
  toggleStage,
  handleToggleStatus,
  togglingStageId,
  canRename,
  canDelete,
  stageRename,
  stageDelete,
}) => {
  const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
      style={{ height: 560 }}
    >
      {/* Panel Header */}
      <div className="px-6 pt-6 pb-5 border-b border-slate-100 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.18em]">
            Available Stages
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-lg">
              {customSelectedCount} Selected
            </span>
            <span className="text-xs font-bold px-2.5 py-1 bg-slate-50 text-slate-400 rounded-lg border border-slate-100">
              {masterStages.length} Total
            </span>
          </div>
        </div>

        {/* Quick-add with Color Picker */}
        <div className="flex flex-col gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Plus size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNewStage()}
                placeholder="Quick add stage..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl
                  outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/8
                  transition-all font-medium text-slate-700 placeholder-slate-400"
              />
            </div>
            <Button
              type="button"
              onClick={() => handleAddNewStage()}
              variant="contained"
              size="small"
              sx={{ height: '42px', px: '20px' }}
            >
              ADD
            </Button>
          </div>

          {/* Color Swatch Picker */}
          <div className="flex items-center gap-2 pt-1 px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Color:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewStageColor(color)}
                  className={`w-5 h-5 rounded-full transition-transform ${newStageColor === color ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : 'hover:scale-110'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <label className="relative cursor-pointer ml-1">
                <input
                  type="color"
                  value={newStageColor}
                  onChange={(e) => setNewStageColor(e.target.value)}
                  className="sr-only"
                />
                <span
                  className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-500 bg-white"
                  title="Custom color"
                >
                  +
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by name..."
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-xl
              outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/8
              transition-all text-slate-700 font-medium placeholder-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black
                text-slate-400 hover:text-primary uppercase tracking-widest transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stage List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
        {displayStages.length > 0 ? (
          displayStages.map((stage) => {
            const checked = selectedIds.has(stage.id);
            const mandatory = isMandatoryStage(stage);
            const isInactive = stage.status === 'INACTIVE';
            const isEditingThis = stageRename.isEditing(stage.id);
            const isTogglingThis = togglingStageId === stage.id;

            return (
              <div
                key={stage.id}
                className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${
                  isEditingThis
                    ? 'bg-white border-primary/30 shadow-md ring-2 ring-primary/10'
                    : isInactive
                      ? 'bg-slate-50 border-slate-200'
                      : mandatory
                        ? 'bg-primary/[0.02] border-primary/25 border-l-[3px] border-l-primary shadow-sm'
                        : checked
                          ? 'bg-white border-slate-200 border-l-[3px] border-l-primary shadow-sm'
                          : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                }`}
              >
                {/* Checkbox — mandatory stages show locked filled circle */}
                {!isEditingThis && (
                  <button
                    type="button"
                    onClick={() => toggleStage(stage)}
                    disabled={mandatory || isInactive}
                    className="flex-shrink-0"
                    aria-label={
                      mandatory
                        ? `${stage.name} is a required stage`
                        : isInactive
                          ? `${stage.name} is disabled`
                          : checked ? `Deselect ${stage.name}` : `Select ${stage.name}`
                    }
                    title={mandatory ? 'Mandatory system stage — always required' : isInactive ? 'Disabled stage — enable it to select' : undefined}
                  >
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 transition-all ${
                      mandatory
                        ? 'border-primary bg-primary cursor-not-allowed'
                        : isInactive
                          ? 'border-slate-300 bg-slate-100 cursor-not-allowed'
                          : checked
                            ? 'border-primary bg-primary'
                            : 'border-slate-200 bg-white hover:border-primary/50'
                    }`}>
                      {(checked || mandatory) && (
                        <Check size={11} className="text-white" strokeWidth={3.5} />
                      )}
                    </div>
                  </button>
                )}

                {/* Color Dot */}
                {stage.colorCode && (
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stage.colorCode }}
                  />
                )}

                {/* Stage Name or Inline Editor */}
                {isEditingThis ? (
                  <InlineStageNameEditor
                    value={stageRename.editValue}
                    onChange={stageRename.setEditValue}
                    onCommit={stageRename.commitEdit}
                    onCancel={stageRename.cancelEdit}
                    loading={stageRename.renaming}
                  />
                ) : (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleStage(stage)}
                      disabled={mandatory || isInactive}
                      className={`text-left text-sm font-semibold truncate transition-colors ${
                        mandatory
                          ? 'text-primary cursor-default'
                          : isInactive
                            ? 'text-slate-500 line-through cursor-not-allowed'
                            : checked
                              ? 'text-primary'
                              : 'text-slate-700 group-hover:text-slate-900'
                      }`}
                    >
                      {stage.name}
                    </button>
                    {isInactive && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded uppercase">
                        Disabled
                      </span>
                    )}
                  </div>
                )}

                {/* Right Actions */}
                {!isEditingThis && (
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto opacity-100">
                    {mandatory ? (
                      <span
                        className="text-[10px] font-black text-primary uppercase tracking-widest
                          bg-primary/8 border border-primary/20 px-2.5 py-1 rounded-lg"
                        title="Mandatory system stage — always required"
                      >
                        REQUIRED
                      </span>
                    ) : (
                      <>
                        {/* Status Toggle Button */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleStatus(stage); }}
                          disabled={isTogglingThis}
                          className={`p-2 rounded-lg transition-all focus:outline-none ${
                            isInactive
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                          }`}
                          title={isInactive ? 'Enable stage' : 'Disable stage'}
                        >
                          {isTogglingThis ? (
                            <Loader2 size={13} className="animate-spin text-slate-400" />
                          ) : (
                            <Power size={13} strokeWidth={2.5} />
                          )}
                        </button>

                        {/* Rename */}
                        {canRename && !stageDelete.isDeleting(stage.id) && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); stageRename.startEdit(stage); }}
                            className="p-2 rounded-lg bg-slate-100 text-slate-600
                              hover:bg-primary/10 hover:text-primary
                              transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                            title={`Rename ${stage.name}`}
                            aria-label={`Rename ${stage.name}`}
                          >
                            <Pencil size={13} strokeWidth={2} />
                          </button>
                        )}

                        {/* Global Delete */}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); stageDelete.openModal(stage); }}
                            disabled={stageDelete.isDeleting(stage.id)}
                            className="p-2 rounded-lg bg-slate-100 text-slate-500
                              hover:bg-red-50 hover:text-red-500
                              disabled:opacity-50 disabled:cursor-not-allowed
                              transition-all focus:outline-none focus:ring-2 focus:ring-red-200"
                            title={`Delete ${stage.name} globally`}
                            aria-label={`Delete ${stage.name} globally`}
                          >
                            {stageDelete.isDeleting(stage.id) ? (
                              <Loader2 size={13} className="animate-spin text-red-400" />
                            ) : (
                              <Trash2 size={13} strokeWidth={2} />
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400 text-center">
            <AlertCircle size={24} className="text-slate-300" />
            <p className="text-xs font-semibold">No stages found</p>
            {searchTerm ? (
              <p className="text-[11px]">Try clearing your search term</p>
            ) : (
              <button
                type="button"
                onClick={() => handleAddNewStage(searchTerm)}
                className="mt-1 text-xs font-bold text-primary hover:underline"
              >
                + Add stage
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableStagesPanel;
