import { useState, useCallback, useRef } from 'react';
import { deleteStage } from '../services/stageService';
import { toast } from 'sonner';

export const useStageDelete = ({ onSuccess }) => {
  const [stageToDelete, setStageToDelete] = useState(null);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const inFlightRef = useRef(false);
  // Keep onSuccess in a ref so confirmDelete never closes over a stale version
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const openModal = useCallback((stage) => {
    if (!stage || stage.isDefault) return;
    if (deletingIds.has(stage.id)) return;
    setStageToDelete(stage);
  }, [deletingIds]);

  const closeModal = useCallback(() => {
    setStageToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!stageToDelete || inFlightRef.current) return;

    const stage = stageToDelete;
    inFlightRef.current = true;
    setStageToDelete(null);

    setDeletingIds(prev => new Set([...prev, stage.id]));

    try {
      await deleteStage(stage.id);
      // Use ref to always call the latest onSuccess — support both ({ stageId, stage }) and (stageId)
      if (typeof onSuccessRef.current === 'function') {
        onSuccessRef.current({ stageId: stage.id, stage });
      }
      toast.success('Stage deleted successfully');
    } catch (err) {
      const msg = err?.message || '';
      const status = err?.statusCode ?? err?.status;

      if (status === 400 || msg.toLowerCase().includes('contains leads') || msg.toLowerCase().includes('has leads')) {
        toast.error('Cannot delete this stage because it is still used by leads. Move or delete the leads first.');
      } else if (status === 403) {
        toast.error('You do not have permission to delete this stage.');
      } else if (status === 404) {
        if (typeof onSuccessRef.current === 'function') {
          onSuccessRef.current({ stageId: stage.id, stage });
        }
        toast.success('Stage removed');
      } else {
        toast.error('Failed to delete stage. Please try again.');
      }
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(stage.id);
        return next;
      });
      inFlightRef.current = false;
    }
  }, [stageToDelete]);

  return {
    isOpen: !!stageToDelete,
    stageToDelete,
    pendingStage: stageToDelete,
    openModal,
    requestDelete: openModal,
    closeModal,
    cancelDelete: closeModal,
    confirmDelete,
    deletingIds,
    isDeleting: (id) => deletingIds.has(id),
  };
};
