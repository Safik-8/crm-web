import { useState, useCallback, useRef } from 'react';
import { deleteStage } from '../services/stageService';
import { toast } from 'sonner';

export const useStageDelete = ({ onSuccess }) => {
  const [pendingStage, setPendingStage] = useState(null);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const inFlightRef = useRef(false);
  // Keep onSuccess in a ref so confirmDelete never closes over a stale version
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const requestDelete = useCallback((stage) => {
    if (!stage || stage.isDefault) return;
    if (deletingIds.has(stage.id)) return;
    setPendingStage(stage);
  }, [deletingIds]);

  const cancelDelete = useCallback(() => {
    setPendingStage(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingStage || inFlightRef.current) return;

    const stage = pendingStage;
    inFlightRef.current = true;
    setPendingStage(null);

    setDeletingIds(prev => new Set([...prev, stage.id]));

    try {
      await deleteStage(stage.id);
      // Use ref to always call the latest onSuccess — never stale
      onSuccessRef.current(stage.id);
      toast.success('Stage deleted successfully');
    } catch (err) {
      const msg = err?.message || '';
      const status = err?.statusCode ?? err?.status;

      if (status === 400 || msg.toLowerCase().includes('contains leads') || msg.toLowerCase().includes('has leads')) {
        toast.error('Cannot delete this stage because it is still used by leads. Move or delete the leads first.');
      } else if (status === 403) {
        toast.error('You do not have permission to delete this stage.');
      } else if (status === 404) {
        onSuccessRef.current(stage.id);
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
  }, [pendingStage]); // no onSuccess dep — using ref instead

  return {
    pendingStage,
    deletingIds,
    isDeleting: (id) => deletingIds.has(id),
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
};
