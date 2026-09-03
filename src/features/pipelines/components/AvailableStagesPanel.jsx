import React from 'react';
import { Plus, Search, Check, Power, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react';
import Button from '../../../shared/components/elements/Button';
import SearchInput from '../../../shared/components/elements/SearchInput';
import InlineStageNameEditor from './InlineStageNameEditor';
import { isMandatoryStage } from '../utils/stageRules';

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
    <div className="bg-white border border-slate-200 flex flex-col overflow-hidden h-[580px]">
      {/* Panel Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Available Stages
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold px-2.5 py-0.5 bg-orange-50 text-orange-600 rounded-md border border-orange-100">
              {customSelectedCount} Selected
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-200">
              {masterStages.length} Total
            </span>
          </div>
        </div>

        {/* Quick-add with Color Picker */}
        <div className="flex flex-col gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchInput
                value={newStageName}
                onChange={(val) => setNewStageName(val)}
                placeholder="Quick add stage..."
              />
            </div>
            <Button
              type="button"
              onClick={() => handleAddNewStage()}
              variant="contained"
              size="small"
              sx={{
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#F86F03',
                fontWeight: 700,
                px: 2.5,
                '&:hover': { backgroundColor: '#DE5D02' }
              }}
            >
              ADD
            </Button>
          </div>

          {/* Color Swatch Picker */}
          <div className="flex items-center gap-2 pt-0.5 px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Color:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewStageColor(color)}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${newStageColor === color ? 'scale-125 ring-2 ring-offset-1 ring-orange-400' : 'hover:scale-110'}`}
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
        <div>
          <SearchInput
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            placeholder="Filter by name..."
          />
        </div>
      </div>

      {/* Stage List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2 custom-scrollbar">
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
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-md border transition-all ${
                  isEditingThis
                    ? 'bg-white border-orange-400 ring-2 ring-orange-100'
                    : isInactive
                      ? 'bg-slate-50 border-slate-200'
                      : mandatory
                        ? 'bg-orange-50/20 border-orange-200 border-l-[3px] border-l-orange-500'
                        : checked
                          ? 'bg-white border-slate-200 border-l-[3px] border-l-orange-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
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
