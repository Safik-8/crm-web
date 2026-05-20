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
  // { id, name } — the stage currently being edited, or null
  const [editingStage, setEditingStage] = useState(null);
  // The live value of the inline input
  const [editValue, setEditValue] = useState('');
  // Whether the PUT request is in-flight
  const [renaming, setRenaming] = useState(false);
  // Prevent double-submit races
  const inFlightRef = useRef(false);

  /** Open the inline editor for a stage */
  const startEdit = useCallback((stage) => {
    if (stage.isDefault) return;
    setEditingStage(stage);
    setEditValue(stage.name);
  }, []);

  /** Close without saving */
  const cancelEdit = useCallback(() => {
    setEditingStage(null);
    setEditValue('');
    setRenaming(false);
    inFlightRef.current = false;
  }, []);

  /**
   * Attempt to save the rename.
   * Returns true if the save was committed (or skipped because name unchanged).
   */
  const commitEdit = useCallback(async () => {
    if (!editingStage || inFlightRef.current) return false;

    const trimmed = editValue.trim();

    // No change — silently close
    if (trimmed === editingStage.name) {
      cancelEdit();
      return true;
    }

    // Empty name guard
    if (!trimmed) {
      toast.error('Stage name cannot be empty');
      return false;
    }

    // Duplicate check (case-insensitive, excluding the stage being renamed)
    const allNames = getAllStageNames();
    const isDuplicate = allNames.some(
      (n) => n.toLowerCase() === trimmed.toLowerCase() && n !== editingStage.name
    );
    if (isDuplicate) {
      toast.error(`A stage named "${trimmed}" already exists`);
      return false;
    }

    inFlightRef.current = true;
    setRenaming(true);

    const previousName = editingStage.name;
    const stageId = editingStage.id;

    // Optimistic update — parent updates its state immediately
    onSuccess(stageId, trimmed);

    try {
      await updateStage(stageId, { name: trimmed });
      toast.success('Stage renamed successfully');
      setEditingStage(null);
      setEditValue('');
      return true;
    } catch (err) {
      // Rollback
      onSuccess(stageId, previousName);
      toast.error(err?.message || 'Failed to rename stage');
      // Keep editor open so user can retry
      setEditingStage((prev) => (prev ? { ...prev, name: previousName } : null));
      setEditValue(trimmed); // keep what they typed so they can fix it
      return false;
    } finally {
      setRenaming(false);
      inFlightRef.current = false;
    }
  }, [editingStage, editValue, cancelEdit, onSuccess, getAllStageNames]);

  return {
    editingStage,
    editValue,
    setEditValue,
    renaming,
    startEdit,
    cancelEdit,
    commitEdit,
    isEditing: (stageId) => editingStage?.id === stageId,
  };
};
