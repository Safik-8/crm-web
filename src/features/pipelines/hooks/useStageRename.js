import { useState, useCallback, useRef } from 'react';
import { updateStage } from '../services/stageService';
import { toast } from 'sonner';

/**
 * Manages inline rename state for a single stage at a time.
 * Handles optimistic updates, rollback on failure, and duplicate/empty validation.
 *
 * @param {Function} onSuccess - Called with (stageId, newName) after a successful rename.
 *                               The parent is responsible for updating masterStages + selectedStages.
 * @param {Function} getAllStageNames - Returns the current list of all stage names (for duplicate check).
 */
export const useStageRename = ({ onSuccess, getAllStageNames }) => {
  // { id, name, colorCode } — the stage currently being edited, or null
  const [editingStage, setEditingStage] = useState(null);
  // The live value of the inline input
  const [editValue, setEditValue] = useState('');
  // The live value of the stage color
  const [editColor, setEditColor] = useState('#3b82f6');
  // Whether the PUT request is in-flight
  const [renaming, setRenaming] = useState(false);
  // Prevent double-submit races
  const inFlightRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  /** Open the inline editor for a stage */
  const startEdit = useCallback((stage) => {
    if (!stage) return;
    setEditingStage(stage);
    setEditValue(stage.name || '');
    setEditColor(stage.colorCode || '#3b82f6');
  }, []);

  /** Close without saving */
  const cancelEdit = useCallback(() => {
    setEditingStage(null);
    setEditValue('');
    setEditColor('#3b82f6');
    setRenaming(false);
    inFlightRef.current = false;
  }, []);

  /**
   * Attempt to save the edit.
   * Returns true if the save was committed (or skipped because unchanged).
   */
  const commitEdit = useCallback(async () => {
    if (!editingStage || inFlightRef.current) return false;

    const trimmed = editValue.trim();

    // Empty name guard
    if (!trimmed) {
      toast.error('Stage name cannot be empty');
      return false;
    }

    const previousName = editingStage.name;
    const previousColor = editingStage.colorCode;
    const stageId = editingStage.id;
    const nameChanged = trimmed !== previousName;
    const colorChanged = editColor && editColor !== previousColor;

    // No change — silently close
    if (!nameChanged && !colorChanged) {
      cancelEdit();
      return true;
    }

    // Duplicate check (case-insensitive, excluding the stage being renamed)
    const allNames = typeof getAllStageNames === 'function' ? getAllStageNames() : [];
    const isDuplicate = allNames.some(
      (n) => n && typeof n === 'string' && n.toLowerCase() === trimmed.toLowerCase() && n.toLowerCase() !== previousName.toLowerCase()
    );
    if (isDuplicate) {
      toast.error(`A stage named "${trimmed}" already exists`);
      return false;
    }

    inFlightRef.current = true;
    setRenaming(true);

    const updatedData = {
      stageId,
      newName: trimmed,
      colorCode: colorChanged ? editColor : previousColor
    };

    // Optimistic update — parent updates its state immediately
    if (typeof onSuccessRef.current === 'function') {
      onSuccessRef.current(updatedData, trimmed);
    }

    try {
      const payload = {};
      if (nameChanged) payload.name = trimmed;
      if (colorChanged) payload.colorCode = editColor;

      await updateStage(stageId, payload);
      toast.success('Stage updated successfully');
      setEditingStage(null);
      setEditValue('');
      setEditColor('#3b82f6');
      return true;
    } catch (err) {
      // Rollback
      if (typeof onSuccessRef.current === 'function') {
        onSuccessRef.current({ stageId, newName: previousName, colorCode: previousColor }, previousName);
      }
      toast.error(err?.message || 'Failed to update stage');
      // Keep editor open so user can retry
      setEditingStage((prev) => (prev ? { ...prev, name: previousName, colorCode: previousColor } : null));
      setEditValue(trimmed);
      return false;
    } finally {
      setRenaming(false);
      inFlightRef.current = false;
    }
  }, [editingStage, editValue, editColor, cancelEdit, getAllStageNames]);

  return {
    editingStage,
    editValue,
    setEditValue,
    editColor,
    setEditColor,
    renaming,
    startEdit,
    cancelEdit,
    commitEdit,
    isEditing: (stageId) => editingStage?.id === stageId,
  };
};
