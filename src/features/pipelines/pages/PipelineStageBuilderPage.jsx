import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLoader } from '../../../shared/context/LoaderContext';
import { useAuth } from '../../../app/providers/AuthProvider';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { getPipelineById, assignPipelineStages } from '../services/pipelineService';
import { getAllStages, createStage } from '../services/stageService';
import { toast } from 'sonner';
import SortableStageRow from '../components/SortableStageRow';
import DeleteStageModal from '../components/DeleteStageModal';
import { useStageRename } from '../hooks/useStageRename';
import { useStageDelete } from '../hooks/useStageDelete';
import {
  isMandatoryStage,
  isClosureStage,
  enforceAnchorPositions,
  applyConstrainedDragMove,
  ensureMandatoryStages,
} from '../utils/stageRules';
import {
  ArrowLeft, Check, Plus, Loader2, AlertCircle,
  Search, Pencil, Trash2,
} from 'lucide-react';
import InlineStageNameEditor from '../components/InlineStageNameEditor';

const PipelineStageBuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { forceHideLoader } = useLoader();
  const { hasPermission } = useAuth();
  const didHideInitialRouteLoaderRef = useRef(false);

  const [pipeline, setPipeline] = useState(null);
  const [masterStages, setMasterStages] = useState([]);
  const [selectedStages, setSelectedStages] = useState([]);
  const [newStageName, setNewStageName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const canRename = hasPermission('manage:stages');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [pRes, sRes] = await Promise.all([getPipelineById(id), getAllStages()]);
        const p = pRes?.data?.pipeline;
        const rawStages = sRes?.data;
        const all = Array.isArray(rawStages)
          ? rawStages
          : Array.isArray(rawStages?.stages) ? rawStages.stages : [];

        setPipeline(p);
        setMasterStages(all);

        // Normalize p.stages — backend join may use stageId instead of id
        const rawAssigned = p?.stages?.length > 0
          ? p.stages
              .slice()
              .sort((a, b) => (a.orderNo ?? a.order_no ?? 0) - (b.orderNo ?? b.order_no ?? 0))
              .map(s => ({
                id: s.id ?? s.stageId ?? s.stage_id,
                name: s.name ?? s.stage?.name,
                isDefault: s.isDefault ?? s.is_default ?? s.stage?.isDefault ?? false,
                orderNo: s.orderNo ?? s.order_no ?? 0,
              }))
              .filter(s => s.id != null)
          : all.filter(s => s.isDefault);

        // Always enforce Prospect first + Closure last, injecting from master if missing
        setSelectedStages(ensureMandatoryStages(rawAssigned, all));
      } catch {
        toast.error('Failed to load pipeline');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  useEffect(() => {
    if (!didHideInitialRouteLoaderRef.current && (!loading || (!!pipeline && masterStages.length > 0))) {
      forceHideLoader();
      didHideInitialRouteLoaderRef.current = true;
    }
  }, [pipeline, masterStages, loading, forceHideLoader]);

  // ── Rename ────────────────────────────────────────────────────────────────
  const handleRenameSuccess = useCallback((stageId, newName) => {
    setMasterStages(prev => prev.map(s => s.id === stageId ? { ...s, name: newName } : s));
    setSelectedStages(prev => prev.map(s => s.id === stageId ? { ...s, name: newName } : s));
  }, []);

  const getAllStageNames = useCallback(() => masterStages.map(s => s.name), [masterStages]);
  const stageRename = useStageRename({ onSuccess: handleRenameSuccess, getAllStageNames });

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteSuccess = useCallback((stageId) => {
    setMasterStages(prev => prev.filter(s => s.id !== stageId));
    setSelectedStages(prev =>
      enforceAnchorPositions(prev.filter(s => s.id !== stageId))
    );
  }, []);

  const stageDelete = useStageDelete({ onSuccess: handleDeleteSuccess });
  const canDelete = hasPermission('manage:stages');

  // ── DnD — constrained drag ────────────────────────────────────────────────
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setSelectedStages(prev => {
      const oldIndex = prev.findIndex(s => s.id === active.id);
      const newIndex = prev.findIndex(s => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return applyConstrainedDragMove(prev, oldIndex, newIndex);
    });
  };

  // ── Stage selection ───────────────────────────────────────────────────────
  const toggleStage = (stage) => {
    // Mandatory stages can never be toggled off
    if (isMandatoryStage(stage)) return;
    if (stageRename.isEditing(stage.id)) return;

    const isSelected = selectedStages.some(s => s.id === stage.id);
    if (isSelected) {
      // Remove from middle — anchors stay
      setSelectedStages(prev =>
        enforceAnchorPositions(prev.filter(s => s.id !== stage.id))
      );
    } else {
      // Insert before Closure (always second-to-last when Closure exists)
      setSelectedStages(prev => {
        const closureIdx = prev.findIndex(isClosureStage);
        if (closureIdx === -1) return enforceAnchorPositions([...prev, stage]);
        const next = [...prev];
        next.splice(closureIdx, 0, stage);
        return next;
      });
    }
  };

  // ── Add new stage ─────────────────────────────────────────────────────────
  const handleAddNewStage = async (overrideName) => {
    const name = (overrideName || newStageName || searchTerm).trim();
    if (!name) return;
    if (masterStages.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error('A stage with this name already exists');
      return;
    }
    try {
      const res = await createStage({ name });
      const newStage = res?.data?.stage || res?.data;
      if (!newStage?.id) throw new Error('Invalid stage data returned');

      setMasterStages(prev => [...prev, newStage]);

      // Insert before Closure in selectedStages
      setSelectedStages(prev => {
        const closureIdx = prev.findIndex(isClosureStage);
        if (closureIdx === -1) return enforceAnchorPositions([...prev, newStage]);
        const next = [...prev];
        next.splice(closureIdx, 0, newStage);
        return next;
      });

      setNewStageName('');
      toast.success(`Stage "${name}" created and added`);
    } catch (err) {
      toast.error(err?.message || 'Failed to create stage');
    }
  };

  // ── Remove from right panel (deselect) ───────────────────────────────────
  const handleRemoveFromOrder = useCallback((stageId) => {
    setSelectedStages(prev => {
      const stage = prev.find(s => s.id === stageId);
      if (!stage || isMandatoryStage(stage)) return prev; // guard
      return enforceAnchorPositions(prev.filter(s => s.id !== stageId));
    });
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (selectedStages.length === 0) { toast.error('Please select at least one stage'); return; }

    // Final enforcement before sending — guarantee anchors are correct
    const finalStages = ensureMandatoryStages(selectedStages, masterStages);
    const orderedIds = finalStages.map(s => s.id);

    setSaving(true);
    toast.info('Saving stage configuration...');
    try {
      await assignPipelineStages(id, {
        stageIds: orderedIds,
        orderedStageIds: orderedIds,
      });
      toast.success('Stages saved successfully!');
      setTimeout(() => navigate(`/pipelines/${id}/board`), 800);
    } catch (err) {
      toast.error(err?.message || 'Failed to save stages');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <div className="h-8 w-56 rounded-xl bg-slate-100 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1].map(i => (
          <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 space-y-3">
            {[...Array(5)].map((_, j) => <div key={j} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}
          </div>
        ))}
      </div>
    </div>
  );

  if (!pipeline) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-400">
      <AlertCircle size={40} className="text-red-400" />
      <p className="text-base font-medium">Pipeline not found</p>
    </div>
  );

  const selectedIds = new Set(selectedStages.map(s => s.id));

  // Left panel sort: mandatory first, then selected, then alpha
  const allFiltered = masterStages
    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aM = isMandatoryStage(a), bM = isMandatoryStage(b);
      if (aM && !bM) return -1;
      if (!aM && bM) return 1;
      const aS = selectedIds.has(a.id), bS = selectedIds.has(b.id);
      if (aS && !bS) return -1;
      if (!aS && bS) return 1;
      return a.name.localeCompare(b.name);
    });

  const isTruncated = !searchTerm && allFiltered.length > 25;
  const displayStages = isTruncated
    ? [...allFiltered.filter(s => selectedIds.has(s.id)), ...allFiltered.filter(s => !selectedIds.has(s.id)).slice(0, 15)]
    : allFiltered;

  // Count only non-mandatory selected stages for the badge
  const customSelectedCount = selectedStages.filter(s => !isMandatoryStage(s)).length;

  return (
    <>
      {/* ── Delete confirmation modal ──────────────────────────────────── */}
      {stageDelete.pendingStage && (
        <DeleteStageModal
          stage={stageDelete.pendingStage}
          onConfirm={stageDelete.confirmDelete}
          onCancel={stageDelete.cancelDelete}
          isDeleting={stageDelete.isDeleting(stageDelete.pendingStage?.id)}
        />
      )}

      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-2 space-y-8">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/pipelines')}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configure Stages</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            <span className="font-semibold text-slate-600">{pipeline.name}</span>
            <span className="mx-2 text-slate-300">·</span>
            Select and order stages in your pipeline
          </p>
        </div>
      </div>

      {/* ── Two-panel grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

        {/* ── LEFT: Available Stages ───────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
          style={{ height: 560 }}
        >
          {/* Panel header */}
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

            {/* Quick-add */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Plus size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  value={newStageName}
                  onChange={e => setNewStageName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNewStage()}
                  placeholder="Quick add stage..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl
                    outline-none focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/8
                    transition-all font-medium text-slate-700 placeholder-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddNewStage()}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold
                  hover:bg-black transition-all shadow-sm active:scale-95 tracking-wide"
              >
                ADD
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
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

          {/* Stage list */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
            {displayStages.length > 0 ? (
              displayStages.map(stage => {
                const checked = selectedIds.has(stage.id);
                const mandatory = isMandatoryStage(stage);
                const isEditingThis = stageRename.isEditing(stage.id);

                return (
                  <div
                    key={stage.id}
                    className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${
                      isEditingThis
                        ? 'bg-white border-primary/30 shadow-md ring-2 ring-primary/10'
                        : mandatory
                          ? 'bg-primary/[0.02] border-primary/25 border-l-[3px] border-l-primary shadow-sm'
                          : checked
                            ? 'bg-white border-slate-200 border-l-[3px] border-l-primary shadow-sm'
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                    }`}
                  >
                    {/* Checkbox — mandatory stages show a locked filled circle */}
                    {!isEditingThis && (
                      <button
                        type="button"
                        onClick={() => toggleStage(stage)}
                        disabled={mandatory}
                        className="flex-shrink-0"
                        aria-label={
                          mandatory
                            ? `${stage.name} is a required stage`
                            : checked ? `Deselect ${stage.name}` : `Select ${stage.name}`
                        }
                        title={mandatory ? 'Mandatory system stage — always required' : undefined}
                      >
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 transition-all ${
                          mandatory
                            ? 'border-primary bg-primary cursor-not-allowed'
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

                    {/* Name or inline editor */}
                    {isEditingThis ? (
                      <InlineStageNameEditor
                        value={stageRename.editValue}
                        onChange={stageRename.setEditValue}
                        onCommit={stageRename.commitEdit}
                        onCancel={stageRename.cancelEdit}
                        loading={stageRename.renaming}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleStage(stage)}
                        disabled={mandatory}
                        className={`flex-1 text-left text-sm font-semibold truncate transition-colors ${
                          mandatory
                            ? 'text-primary cursor-default'
                            : checked
                              ? 'text-primary'
                              : 'text-slate-700 group-hover:text-slate-900'
                        }`}
                      >
                        {stage.name}
                      </button>
                    )}

                    {/* Right actions */}
                    {!isEditingThis && (
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
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
                            {/* Rename */}
                            {canRename && !stageDelete.isDeleting(stage.id) && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); stageRename.startEdit(stage); }}
                                className="p-2 rounded-lg bg-slate-100 text-slate-500
                                  hover:bg-primary/10 hover:text-primary
                                  transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                                title={`Rename ${stage.name}`}
                                aria-label={`Rename ${stage.name}`}
                              >
                                <Pencil size={13} strokeWidth={2} />
                              </button>
                            )}
                            {/* Global delete — shown for ALL non-mandatory stages */}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); stageDelete.requestDelete(stage); }}
                                disabled={stageDelete.isDeleting(stage.id)}
                                className="p-2 rounded-lg bg-slate-100 text-slate-500
                                  hover:bg-red-50 hover:text-red-500
                                  disabled:opacity-50 disabled:cursor-not-allowed
                                  transition-all focus:outline-none focus:ring-2 focus:ring-red-200"
                                title={`Delete ${stage.name} globally`}
                                aria-label={`Delete ${stage.name}`}
                              >
                                {stageDelete.isDeleting(stage.id)
                                  ? <Loader2 size={13} className="animate-spin text-red-400" />
                                  : <Trash2 size={13} strokeWidth={2} />
                                }
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
              <div className="py-16 text-center space-y-3">
                <p className="text-sm text-slate-400 font-medium">No stages found</p>
                {searchTerm && (
                  <button
                    onClick={() => handleAddNewStage()}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Create "{searchTerm}" as a new stage?
                  </button>
                )}
              </div>
            )}

            {isTruncated && displayStages.length < allFiltered.length && (
              <div className="py-5 text-center">
                <p className="text-xs text-slate-400 italic">
                  Showing {displayStages.length} of {allFiltered.length} stages — search to find more
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Stage Order (DnD) ─────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
          style={{ height: 560 }}
        >
          {/* Panel header */}
          <div className="px-6 pt-6 pb-5 border-b border-slate-100">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.18em]">Stage Order</h2>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              Drag to reorder. Prospect is always first, Closure is always last.
            </p>
          </div>

          {/* DnD list */}
          <div className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar">
            {selectedStages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                <p className="text-sm font-medium">No stages selected yet</p>
                <p className="text-xs">Select stages from the left panel</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={selectedStages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {selectedStages.map(stage => (
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
                        onDelete={() => stageDelete.requestDelete(stage)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer actions ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2 pb-4">
        <button
          onClick={() => navigate('/pipelines')}
          className="px-6 py-3 rounded-xl border border-slate-200 text-sm font-semibold
            text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || selectedStages.length === 0}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white text-sm font-bold
            shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
            transition-all active:scale-[0.98]"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
          Save &amp; Open Board
        </button>
      </div>
    </div>
    </>
  );
};

export default PipelineStageBuilderPage;
