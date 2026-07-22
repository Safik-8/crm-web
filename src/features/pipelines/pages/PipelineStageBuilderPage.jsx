// src/features/pipelines/pages/PipelineStageBuilderPage.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';

// Services & Hooks
import { getPipelineById, assignPipelineStages } from '../services/pipelineService';
import { getAllStagesAdmin, createStage, toggleStageStatus } from '../services/stageService';
import DeleteStageModal from '../components/DeleteStageModal';
import { useStageRename } from '../hooks/useStageRename';
import { useStageDelete } from '../hooks/useStageDelete';
import { useAuth } from '../../../app/providers/AuthProvider';
import Button from '../../../shared/components/elements/Button';
import {
  isMandatoryStage, isClosureStage, enforceAnchorPositions, applyConstrainedDragMove
} from '../utils/stageRules';

// Extracted Sub-Panels (Sprint 4 Refactoring)
import AvailableStagesPanel from '../components/AvailableStagesPanel';
import StageOrderPanel from '../components/StageOrderPanel';

/**
 * PipelineStageBuilderPage — Admin page to configure, reorder, assign, toggle,
 * rename, and create stages for a sales pipeline.
 */
export const PipelineStageBuilderPage = () => {
  const { id: pipelineId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [pipeline, setPipeline] = useState(null);
  const [masterStages, setMasterStages] = useState([]);
  const [selectedStages, setSelectedStages] = useState([]);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingStageId, setTogglingStageId] = useState(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Permissions
  const canRename = hasPermission('manage:stages');
  const canDelete = hasPermission('manage:stages');

  // Load data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pipeRes, masterRes] = await Promise.all([
          getPipelineById(pipelineId),
          getAllStagesAdmin(),
        ]);

        const pipeData = pipeRes?.data?.pipeline || pipeRes?.data || pipeRes;
        const rawMaster = masterRes?.data?.stages || masterRes?.stages || masterRes || [];
        const stagesList = Array.isArray(rawMaster) ? rawMaster : [];

        setPipeline(pipeData);
        setMasterStages(stagesList);

        if (pipeData?.stages?.length > 0) {
          const mapped = pipeData.stages.map(ps => ps.stage || ps);
          setSelectedStages(enforceAnchorPositions(mapped));
        } else {
          const defaults = stagesList.filter(s => isMandatoryStage(s));
          setSelectedStages(enforceAnchorPositions(defaults));
        }
      } catch (err) {
        toast.error(err?.message || 'Failed to load pipeline stages');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pipelineId]);

  // Rename & Delete Hooks
  const handleRenameSuccess = useCallback(({ stageId, newName }) => {
    setMasterStages(prev =>
      prev.map(s => (s.id === stageId ? { ...s, name: newName } : s))
    );
    setSelectedStages(prev =>
      prev.map(s => (s.id === stageId ? { ...s, name: newName } : s))
    );
  }, []);

  const stageRename = useStageRename({ onSuccess: handleRenameSuccess });

  const handleDeleteSuccess = useCallback(({ stageId }) => {
    setMasterStages(prev => prev.filter(s => s.id !== stageId));
    setSelectedStages(prev =>
      enforceAnchorPositions(prev.filter(s => s.id !== stageId))
    );
  }, []);

  const stageDelete = useStageDelete({ onSuccess: handleDeleteSuccess });

  // Toggle Stage Status
  const handleToggleStatus = async (stage) => {
    if (isMandatoryStage(stage)) {
      toast.error(`System stage "${stage.name}" cannot be disabled.`);
      return;
    }
    const newStatus = stage.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';

    if (newStatus === 'INACTIVE') {
      const isAssigned = selectedStages.some(s => s.id === stage.id);
      if (isAssigned) {
        toast.error(`Cannot disable "${stage.name}" because it is currently assigned to this pipeline. Remove it from the pipeline first.`);
        return;
      }
    }

    setTogglingStageId(stage.id);
    try {
      await toggleStageStatus(stage.id, newStatus);
      toast.success(`Stage "${stage.name}" is now ${newStatus}`);
      setMasterStages(prev => prev.map(s => s.id === stage.id ? { ...s, status: newStatus } : s));
    } catch (err) {
      toast.error(err?.message || 'Failed to update stage status');
    } finally {
      setTogglingStageId(null);
    }
  };

  // DnD — constrained drag
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setSelectedStages(prev => {
      const oldIndex = prev.findIndex(s => s.id === active.id);
      const newIndex = prev.findIndex(s => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return applyConstrainedDragMove(prev, oldIndex, newIndex);
    });
  };

  // Stage selection toggle
  const toggleStage = (stage) => {
    if (isMandatoryStage(stage)) return;
    if (stage.status === 'INACTIVE') {
      toast.error('Cannot select a disabled stage. Enable it first.');
      return;
    }
    if (stageRename.isEditing(stage.id)) return;

    const isSelected = selectedStages.some(s => s.id === stage.id);
    if (isSelected) {
      setSelectedStages(prev =>
        enforceAnchorPositions(prev.filter(s => s.id !== stage.id))
      );
    } else {
      setSelectedStages(prev => {
        const closureIdx = prev.findIndex(isClosureStage);
        if (closureIdx === -1) return enforceAnchorPositions([...prev, stage]);
        const next = [...prev];
        next.splice(closureIdx, 0, stage);
        return next;
      });
    }
  };

  // Add new stage
  const handleAddNewStage = async (overrideName) => {
    const name = (overrideName || newStageName || searchTerm).trim();
    if (!name) return;
    if (masterStages.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error('A stage with this name already exists');
      return;
    }
    try {
      const res = await createStage({ name, colorCode: newStageColor });
      const newStage = res?.data?.stage || res?.data;
      if (!newStage?.id) throw new Error('Invalid stage data returned');

      setMasterStages(prev => [...prev, newStage]);

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

  // Remove from right panel
  const handleRemoveFromOrder = (stageId) => {
    const target = selectedStages.find(s => s.id === stageId);
    if (isMandatoryStage(target)) {
      toast.error('Mandatory stages (Prospect / Closure) cannot be removed.');
      return;
    }
    setSelectedStages(prev =>
      enforceAnchorPositions(prev.filter(s => s.id !== stageId))
    );
  };

  // Save stage configuration
  const handleSave = async () => {
    if (selectedStages.length < 2) {
      toast.error('Pipeline must contain at least Prospect and Closure stages');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        stageIds: selectedStages.map(s => s.id),
      };
      await assignPipelineStages(pipelineId, payload);
      toast.success('Pipeline stages saved successfully!');
      navigate(`/pipelines/${pipelineId}/board`);
    } catch (err) {
      toast.error(err?.message || 'Failed to save pipeline stages');
    } finally {
      setSaving(false);
    }
  };

  // Derived state
  const selectedIds = useMemo(
    () => new Set(selectedStages.map(s => s.id)),
    [selectedStages]
  );

  const displayStages = useMemo(() => {
    if (!searchTerm.trim()) return masterStages;
    return masterStages.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [masterStages, searchTerm]);

  const customSelectedCount = useMemo(
    () => selectedStages.filter(s => !isMandatoryStage(s)).length,
    [selectedStages]
  );

  if (loading) {
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
          <button
            onClick={() => navigate('/pipelines')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {pipeline?.name ? `${pipeline.name} — Stages` : 'Configure Pipeline Stages'}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Select stages from the left panel to include in this pipeline. Drag on the right to reorder.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          isLoading={saving}
          variant="contained"
          size="medium"
          startIcon={<Check size={16} strokeWidth={3} />}
        >
          Save Pipeline Stages
        </Button>
      </div>

      {/* Two-panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* LEFT: Available Stages Panel */}
        <AvailableStagesPanel
          customSelectedCount={customSelectedCount}
          masterStages={masterStages}
          displayStages={displayStages}
          selectedIds={selectedIds}
          newStageName={newStageName}
          setNewStageName={setNewStageName}
          newStageColor={newStageColor}
          setNewStageColor={setNewStageColor}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleAddNewStage={handleAddNewStage}
          toggleStage={toggleStage}
          handleToggleStatus={handleToggleStatus}
          togglingStageId={togglingStageId}
          canRename={canRename}
          canDelete={canDelete}
          stageRename={stageRename}
          stageDelete={stageDelete}
        />

        {/* RIGHT: Stage Order DnD Panel */}
        <StageOrderPanel
          selectedStages={selectedStages}
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          handleRemoveFromOrder={handleRemoveFromOrder}
          canRename={canRename}
          canDelete={canDelete}
          stageRename={stageRename}
          stageDelete={stageDelete}
        />
      </div>

      {/* Global Delete Confirmation Modal */}
      <DeleteStageModal
        isOpen={stageDelete.isOpen}
        stage={stageDelete.stageToDelete}
        hasLeads={stageDelete.hasLeads}
        leadCount={stageDelete.leadCount}
        isLoading={stageDelete.isDeleting(stageDelete.stageToDelete?.id)}
        onConfirm={stageDelete.confirmDelete}
        onClose={stageDelete.closeModal}
      />
    </div>
  );
};

export default PipelineStageBuilderPage;
