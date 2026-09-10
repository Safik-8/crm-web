// src/features/pipelines/pages/PipelineStageBuilderPage.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ArrowLeft, Check, Layers, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Services & Hooks
import { getPipelineById, assignPipelineStages } from '../services/pipelineService';
import { getAllStagesAdmin, createStage, toggleStageStatus } from '../services/stageService';
import DeleteStageModal from '../components/DeleteStageModal';
import { useStageRename } from '../hooks/useStageRename';
import { useStageDelete } from '../hooks/useStageDelete';
import { useAuth } from '../../../app/providers/AuthProvider';
import Button from '../../../shared/components/elements/Button';
import PageHeader from '../../../shared/components/modules/PageHeader';
import Skeleton from '../../../shared/components/elements/Skeleton';
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

  // Load data callback
  const fetchData = useCallback(async () => {
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
  }, [pipelineId]);

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
        {/* Top Header Card Skeleton */}
        <div className="bg-white border border-slate-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton variant="rounded" width={40} height={40} className="rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton variant="text" width={240} height={24} />
              <Skeleton variant="text" width={360} height={16} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton variant="rounded" width={100} height={38} className="rounded-xl" />
            <Skeleton variant="rounded" width={120} height={38} className="rounded-xl" />
          </div>
        </div>

        {/* 2-Column Panels Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <Skeleton variant="text" width={140} height={20} />
              <Skeleton variant="rounded" width={70} height={24} className="rounded-lg" />
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="rounded" width={18} height={18} className="rounded" />
                    <Skeleton variant="circular" width={12} height={12} />
                    <Skeleton variant="text" width={120} height={16} />
                  </div>
                  <Skeleton variant="rounded" width={24} height={24} className="rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <Skeleton variant="text" width={160} height={20} />
              <Skeleton variant="rounded" width={90} height={32} className="rounded-lg" />
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="rounded" width={12} height={16} />
                    <Skeleton variant="circular" width={12} height={12} />
                    <Skeleton variant="text" width={150} height={16} />
                  </div>
                  <Skeleton variant="rounded" width={24} height={24} className="rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <PageHeader
        icon={Layers}
        iconClassName="bg-orange-50 text-orange-600 border border-orange-100"
        title={pipeline?.name ? `${pipeline.name} — Pipeline Stages` : 'Configure Pipeline Stages'}
        description="Select stages from the left panel to include in this pipeline. Drag on the right to reorder."
        actions={
          <button
            type="button"
            onClick={fetchData}
            className="text-slate-400 hover:text-orange-500 transition-colors focus:outline-none cursor-pointer p-2"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      {/* Two-panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
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
          handleSave={handleSave}
          saving={saving}
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
