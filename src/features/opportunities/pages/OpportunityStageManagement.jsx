import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Lock,
  Layers,
  ArrowLeft,
  Check,
  Search,
  GripVertical,
  X,
} from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import {
  useOpportunityStagesQuery,
  useCreateOpportunityStageMutation,
  useUpdateOpportunityStageMutation,
  useDeleteOpportunityStageMutation,
  useBulkUpdateOpportunityStagesMutation,
} from '../hooks/useOpportunities';
import Button from '../../../shared/components/elements/Button';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import { DynamicFormModal } from '../../../shared/components/elements/DynamicFormModal';
import Checkbox from '../../../shared/components/elements/Checkbox';
import PageHeader from '../../../shared/components/modules/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '../../company/services/companyService';
import SelectField from '../../../shared/components/elements/SelectField';
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
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const isStartStage = (s) => 
  s.stageType === 'QUALIFICATION' || 
  s.code === 'QUALIFICATION' || 
  s.name?.toLowerCase() === 'qualification' ||
  s.stageType === 'PROSPECT' || 
  s.code === 'PROSPECT' || 
  s.name?.toLowerCase() === 'prospect';

const isTerminalStage = (s) => {
  const type = (s.stageType || s.code || '').toUpperCase();
  const name = (s.name || '').toLowerCase();
  return ['WON', 'LOST', 'CANCELLED'].includes(type) || ['won', 'lost', 'cancelled'].includes(name);
};

// ─── Sortable Row Component ──────────────────────────────────────────────────
const SortableStageRow = ({ stage, onRemove, onEdit }) => {
  const isSystem = stage.isSystem;
  const isLocked = isSystem || isStartStage(stage) || isTerminalStage(stage);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between bg-white border rounded-xl px-4 py-3 shadow-sm hover:shadow transition-all ${
        isDragging
          ? 'border-primary/40 shadow-md scale-[1.01] ring-2 ring-primary/5'
          : isLocked
          ? 'border-slate-100 bg-slate-50/50'
          : 'border-slate-200 border-l-[3px] border-l-primary hover:border-slate-300'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle or Lock */}
        <div
          {...(isLocked ? {} : { ...attributes, ...listeners })}
          className={`flex-shrink-0 flex items-center justify-center p-1 text-slate-300 ${
            isLocked
              ? 'cursor-not-allowed opacity-40'
              : 'cursor-grab hover:text-slate-500 active:cursor-grabbing touch-none'
          }`}
        >
          {isLocked ? <Lock size={13} /> : <GripVertical size={14} />}
        </div>

        {/* Color swatch */}
        <div
          className="h-3.5 w-3.5 rounded-full border border-slate-200"
          style={{ backgroundColor: stage.colorCode }}
        />

        {/* Name and Code */}
        <div>
          <span className="text-sm font-semibold text-slate-800">{stage.name}</span>
          <span className="ml-2 text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            {stage.code}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-500 mr-2">
          {stage.defaultProbabilityPct}%
        </span>
        {!isSystem && (
          <button
            type="button"
            onClick={() => onEdit(stage)}
            className="p-1 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
            title="Edit Stage"
          >
            <Pencil size={14} />
          </button>
        )}
        {!isSystem && (
          <button
            type="button"
            onClick={() => onRemove(stage.id)}
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Deselect Stage"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const OpportunityStageManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.primaryRole === 'SUPER_ADMIN';

  // Filters & State
  const [companyFilter, setCompanyFilter] = useState('1');
  const [searchTerm, setSearchTerm] = useState('');
  
  // DnD & Ordered Lists
  const [selectedStages, setSelectedStages] = useState([]);

  // Modal / overlay states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedStage, setSelectedStage] = useState(null);
  const [stageToDelete, setStageToDelete] = useState(null);

  // Fetch companies (for Super Admin filter)
  const { data: companiesRaw, isLoading: companiesLoading } = useQuery({
    queryKey: ['companies-raw'],
    queryFn: async () => {
      const res = await companyService.getCompaniesRaw();
      const raw = res?.data || res;
      return Array.isArray(raw) ? raw : [];
    },
    enabled: isSuperAdmin,
    staleTime: 60000,
  });
  const companies = companiesRaw || [];

  // Fetch master list of opportunity stages (including inactive ones for configuration)
  const { data: stagesRaw, isLoading: stagesLoading, isError, error, refetch } = useOpportunityStagesQuery({
    includeInactive: true,
    companyId: isSuperAdmin ? companyFilter : undefined,
  });
  const masterStages = useMemo(() => Array.isArray(stagesRaw) ? stagesRaw : [], [stagesRaw]);

  // Sync selectedStages from masterStages on initial fetch or refetch
  useEffect(() => {
    if (masterStages.length > 0) {
      // Filter out only active stages, sorted by displayOrder
      const active = masterStages
        .filter((s) => s.status === 'ACTIVE')
        .sort((a, b) => a.displayOrder - b.displayOrder);
      setSelectedStages(enforceOpportunityAnchorPositions(active));
    }
  }, [masterStages]);

  // Mutations
  const createMutation = useCreateOpportunityStageMutation();
  const updateMutation = useUpdateOpportunityStageMutation();
  const deleteMutation = useDeleteOpportunityStageMutation();
  const bulkUpdateMutation = useBulkUpdateOpportunityStagesMutation();

  // Sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Anchor position helpers
  const enforceOpportunityAnchorPositions = (stages) => {
    const first = stages.find(s => isStartStage(s));
    const lasts = stages.filter(s => isTerminalStage(s));
    const middle = stages.filter(s => !isStartStage(s) && !isTerminalStage(s));

    const result = [];
    if (first) result.push(first);
    result.push(...middle);
    
    // Sort lasts: Won first, then Lost, then Cancelled
    const terminalOrder = ['WON', 'LOST', 'CANCELLED'];
    const getTerminalWeight = (s) => {
      const type = (s.stageType || s.code || '').toUpperCase();
      const idx = terminalOrder.indexOf(type);
      if (idx !== -1) return idx;
      const name = (s.name || '').toLowerCase();
      return terminalOrder.indexOf(name.toUpperCase());
    };
    lasts.sort((a, b) => getTerminalWeight(a) - getTerminalWeight(b));

    result.push(...lasts);
    return result;
  };

  const calculateDefaultProbability = () => {
    const mainPathStages = selectedStages.filter(s => {
      const type = (s.stageType || s.code || '').toUpperCase();
      const name = (s.name || '').toLowerCase();
      return type !== 'LOST' && type !== 'CANCELLED' && name !== 'lost' && name !== 'cancelled';
    });
    const M = mainPathStages.length;
    if (M <= 1) return 50;
    return Math.round(((M - 1) / M) * 100);
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    
    setSelectedStages((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return prev;

      const moving = prev[oldIndex];
      const targetStage = prev[newIndex];

      // 1. Cannot drag/move the start stage or terminal stages
      if (isStartStage(moving) || isTerminalStage(moving)) {
        return prev;
      }

      // 2. Cannot drop over/into the start stage or terminal stages
      if (isStartStage(targetStage) || isTerminalStage(targetStage)) {
        return prev;
      }

      const moved = arrayMove(prev, oldIndex, newIndex);
      return enforceOpportunityAnchorPositions(moved);
    });
  };

  // Handlers for available stages (left panel selection)
  const toggleStageInSelection = (stage) => {
    if (stage.isSystem) return;

    const isSelected = selectedStages.some((s) => s.id === stage.id);
    if (isSelected) {
      // Remove it
      setSelectedStages((prev) => prev.filter((s) => s.id !== stage.id));
    } else {
      // Add it before the terminal system stages
      setSelectedStages((prev) => {
        const firstTerminalIdx = prev.findIndex((s) => isTerminalStage(s));
        const next = [...prev];
        if (firstTerminalIdx === -1) {
          next.push(stage);
        } else {
          next.splice(firstTerminalIdx, 0, stage);
        }
        return enforceOpportunityAnchorPositions(next);
      });
    }
  };

  const handleRemoveFromOrder = (stageId) => {
    setSelectedStages((prev) => prev.filter((s) => s.id !== stageId));
  };

  const handleSave = async () => {
    // Construct bulk save payload
    const selectedIds = new Set(selectedStages.map((s) => s.id));
    const stageOrders = masterStages.map((stage) => {
      const isSelected = selectedIds.has(stage.id);
      const displayOrder = isSelected 
        ? selectedStages.findIndex((s) => s.id === stage.id) + 1 
        : 999;
      return {
        id: stage.id,
        displayOrder,
        status: isSelected ? 'ACTIVE' : 'INACTIVE',
      };
    });

    await bulkUpdateMutation.mutateAsync({
      stageOrders,
      companyId: isSuperAdmin ? Number(companyFilter) : undefined,
    });
  };

  const handleAddClick = () => {
    setModalMode('create');
    setSelectedStage(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (stage) => {
    setModalMode('edit');
    setSelectedStage(stage);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (stage) => {
    if (stage.isSystem) return;
    setStageToDelete(stage);
  };

  const handleConfirmDelete = async () => {
    if (stageToDelete) {
      await deleteMutation.mutateAsync({
        id: stageToDelete.id,
        companyId: isSuperAdmin ? Number(companyFilter) : undefined,
      });
      setStageToDelete(null);
    }
  };

  const handleFormSubmit = async (formData) => {
    const payload = {
      name: formData.name,
      code: formData.code || undefined,
      displayOrder: formData.displayOrder ? Number(formData.displayOrder) : undefined,
      colorCode: formData.colorCode || undefined,
      defaultProbabilityPct: formData.defaultProbabilityPct !== undefined ? Number(formData.defaultProbabilityPct) : undefined,
      stageType: formData.stageType || undefined,
      companyId: isSuperAdmin ? Number(companyFilter) : undefined,
    };

    if (modalMode === 'create') {
      await createMutation.mutateAsync(payload);
    } else {
      await updateMutation.mutateAsync({
        id: selectedStage.id,
        data: payload,
      });
    }
    setIsModalOpen(false);
  };

  // Local filtering
  const displayStages = useMemo(() => {
    const list = !searchTerm.trim()
      ? [...masterStages]
      : masterStages.filter((s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
          s.code?.toLowerCase().includes(searchTerm.toLowerCase().trim())
        );
    return enforceOpportunityAnchorPositions(list);
  }, [masterStages, searchTerm]);

  const selectedIdsSet = useMemo(() => new Set(selectedStages.map((s) => s.id)), [selectedStages]);

  const { firstStage, middleStages, terminalStages } = useMemo(() => {
    const first = selectedStages.find((s) => isStartStage(s));
    const lasts = selectedStages.filter((s) => isTerminalStage(s));
    const middle = selectedStages.filter((s) => !isStartStage(s) && !isTerminalStage(s));

    // Sort lasts: Won first, then Lost, then Cancelled
    const terminalOrder = ['WON', 'LOST', 'CANCELLED'];
    const getTerminalWeight = (s) => {
      const type = (s.stageType || s.code || '').toUpperCase();
      const idx = terminalOrder.indexOf(type);
      if (idx !== -1) return idx;
      const name = (s.name || '').toLowerCase();
      return terminalOrder.indexOf(name.toUpperCase());
    };
    lasts.sort((a, b) => getTerminalWeight(a) - getTerminalWeight(b));

    return { firstStage: first, middleStages: middle, terminalStages: lasts };
  }, [selectedStages]);

  if (stagesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Save CTA */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" /> Configure Opportunity Stages
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Select stages from the left panel to include in the opportunity pipeline. Drag on the right to reorder.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={bulkUpdateMutation.isPending}
          isLoading={bulkUpdateMutation.isPending}
          variant="contained"
          size="medium"
          startIcon={<Check size={16} strokeWidth={3} />}
        >
          Save Stages
        </Button>
      </div>

      {/* Two-panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* LEFT: Available Stages Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[580px]">
          {/* Panel Header */}
          <div className="px-6 pt-6 pb-5 border-b border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.18em]">
                Available Stages
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-lg">
                  {selectedStages.length} Selected
                </span>
                <span className="text-xs font-bold px-2.5 py-1 bg-slate-50 text-slate-400 rounded-lg border border-slate-100">
                  {masterStages.length} Total
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {isSuperAdmin && (
                <div className="w-48">
                  <SelectField
                    placeholder="Select Company"
                    value={companyFilter}
                    onChange={(val) => setCompanyFilter(val || '1')}
                    isLoading={companiesLoading}
                    options={companies.map((c) => ({ value: String(c.id), label: c.name }))}
                  />
                </div>
              )}
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search stages..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl
                    outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/8
                    transition-all text-slate-700 font-medium placeholder-slate-400"
                />
              </div>
              <Button
                onClick={handleAddClick}
                variant="contained"
                size="small"
                startIcon={<Plus size={14} />}
                sx={{ height: '38px' }}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Master Stage List */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
            {displayStages.length > 0 ? (
              displayStages.map((stage) => {
                const isSelected = selectedIdsSet.has(stage.id);
                return (
                  <div
                    key={stage.id}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-primary/[0.02] border-primary/25 shadow-sm'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`stage-${stage.id}`}
                        checked={isSelected}
                        disabled={stage.isSystem}
                        onChange={() => toggleStageInSelection(stage)}
                        sx={{ width: 'auto', p: 0 }}
                      />
                      <div
                        className="h-3 w-3 rounded-full border border-slate-200"
                        style={{ backgroundColor: stage.colorCode }}
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-800">{stage.name}</span>
                        <span className="ml-2 text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {stage.code}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!stage.isSystem && (
                        <button
                          onClick={() => handleEditClick(stage)}
                          className="p-1 text-slate-400 hover:text-primary hover:bg-slate-50 rounded"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {!stage.isSystem && (
                        <button
                          onClick={() => handleDeleteClick(stage)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                No stages match your search query.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Stage Order DnD Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[580px]">
          {/* Panel Header */}
          <div className="px-6 pt-6 pb-5 border-b border-slate-100 space-y-1">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.18em]">
              Stage Order
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Drag to reorder stages. Qualification stays first; Won, Lost, and Cancelled stay last.
            </p>
          </div>

          {/* DnD Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="space-y-2">
                {/* 1. Qualification Stage (Static, first) */}
                {firstStage && (
                  <SortableStageRow
                    key={firstStage.id}
                    stage={firstStage}
                    onRemove={handleRemoveFromOrder}
                    onEdit={handleEditClick}
                  />
                )}

                {/* 2. Custom Middle Stages (Sortable) */}
                <SortableContext items={middleStages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {middleStages.map((stage) => (
                      <SortableStageRow
                        key={stage.id}
                        stage={stage}
                        onRemove={handleRemoveFromOrder}
                        onEdit={handleEditClick}
                      />
                    ))}
                  </div>
                </SortableContext>

                {/* 3. Terminal Stages (Static, last) */}
                {terminalStages.map((stage) => (
                  <SortableStageRow
                    key={stage.id}
                    stage={stage}
                    onRemove={handleRemoveFromOrder}
                    onEdit={handleEditClick}
                  />
                ))}
              </div>
            </DndContext>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <DynamicFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create Opportunity Stage' : 'Edit Opportunity Stage'}
        subtitle={modalMode === 'create' ? 'Define a new stage for the pipeline.' : 'Modify custom stage settings.'}
        fields={[
          {
            key: 'name',
            label: 'Stage Name',
            type: 'text',
            required: true,
            placeholder: 'e.g., Value Proposition',
            disabled: modalMode === 'edit' && selectedStage?.isSystem,
          },
          {
            key: 'colorCode',
            label: 'Color Code',
            required: true,
            render: (value, onChange, values, errorText) => {
              const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];
              return (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-700">Color Code *</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => onChange('colorCode', color)}
                        className={`w-7 h-7 rounded-full transition-transform ${value === color ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <label className="relative cursor-pointer ml-1">
                      <input
                        type="color"
                        value={value || '#3b82f6'}
                        onChange={(e) => onChange('colorCode', e.target.value)}
                        className="sr-only"
                      />
                      <span
                        className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-sm font-bold text-slate-500 bg-white hover:bg-slate-50"
                        title="Custom color"
                      >
                        +
                      </span>
                    </label>
                  </div>
                  {errorText && <span className="text-red-500 text-[11px]">{errorText}</span>}
                </div>
              );
            }
          },
          {
            key: 'defaultProbabilityPct',
            label: 'Default Probability (%)',
            type: 'number',
            placeholder: 'e.g., 40',
            required: true,
          },
        ]}
        initialValues={
          selectedStage
            ? {
                name: selectedStage.name,
                colorCode: selectedStage.colorCode,
                defaultProbabilityPct: selectedStage.defaultProbabilityPct,
              }
            : {
                name: '',
                colorCode: '#6366f1',
                defaultProbabilityPct: calculateDefaultProbability(),
              }
        }
        onSubmit={handleFormSubmit}
        submitText={modalMode === 'create' ? 'Save Stage' : 'Update Stage'}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!stageToDelete}
        onClose={() => setStageToDelete(null)}
        title="Delete Stage?"
        message={`Are you sure you want to permanently delete "${stageToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        danger
      />
    </div>
  );
};

export default OpportunityStageManagement;
