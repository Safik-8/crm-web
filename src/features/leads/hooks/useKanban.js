import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getPipelineById } from '../../pipelines/services/pipelineService';
import { updateLeadStage } from '../services/leadService';
import { toast } from 'sonner';

/**
 * Manages the full Kanban state for a single pipeline using backend filters and sorting.
 * columns: { [stageId]: { stage, leads: [] } }
 *
 * Performance notes:
 * - columnsRef mirrors columns state so moveCard never needs columns in its
 *   dependency array — eliminates the "new function every render" problem.
 * - orderedStages is memoised so downstream components don't re-render when
 *   unrelated state changes.
 */
export const useKanban = (pipelineId, filters = {}) => {
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pipelineName, setPipelineName] = useState('');

  // Mirror of columns kept in a ref so moveCard can read the latest value
  // without being recreated every time columns changes.
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  // Snapshot ref for optimistic-update rollback
  const snapshotRef = useRef(null);

  // Track request sequence to prevent out-of-order stale response race conditions
  const activeRequestSeqRef = useRef(0);

  // Deep-stringify filters object so useEffect dependencies are stable and don't re-trigger on reference changes
  const stringifiedFilters = JSON.stringify(filters);

  const fetchBoard = useCallback(async (signal = null) => {
    if (!pipelineId) return;
    
    // Increment local request sequence token
    const currentSeq = ++activeRequestSeqRef.current;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await getPipelineById(pipelineId, filters, { signal });
      
      // Stop execution if a newer request has already started or request was cancelled
      if (currentSeq !== activeRequestSeqRef.current) return;
      if (!res) return;

      const pipeline = res?.data?.pipeline || res?.pipeline;
      if (!pipeline) {
        throw new Error('Pipeline board details not found');
      }

      setPipelineName(pipeline.name || '');

      const stages = pipeline.stages || [];
      const cols = {};

      // Map backend stages and backend-grouped/filtered/sorted leads directly to columns
      stages.forEach(stage => {
        cols[stage.id] = {
          stage: {
            id: stage.id,
            name: stage.name,
            isDefault: stage.isDefault,
            orderNo: stage.orderNo,
          },
          leads: stage.leads || [],
        };
      });

      setColumns(cols);
    } catch (err) {
      if (currentSeq !== activeRequestSeqRef.current) return;
      if (err?.name !== 'AbortError') {
        setError(err?.message || 'Failed to load board');
      }
    } finally {
      if (currentSeq === activeRequestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [pipelineId, stringifiedFilters]);

  // Trigger board refetch on mount and whenever filters/pipelineId change
  useEffect(() => {
    const controller = new AbortController();
    fetchBoard(controller.signal);
    
    return () => {
      controller.abort();
    };
  }, [fetchBoard]);

  /**
   * Optimistic card move.
   * Reads current columns from columnsRef — no dependency on columns state,
   * so this function is created exactly once per mount.
   */
  const moveCard = useCallback(async (leadId, fromStageId, toStageId) => {
    if (fromStageId === toStageId) return;

    // Deep-clone current state for rollback
    snapshotRef.current = JSON.parse(JSON.stringify(columnsRef.current));

    // Optimistic update — functional form so React batches correctly
    setColumns(prev => {
      const lead = prev[fromStageId]?.leads.find(l => l.id === leadId);
      if (!lead) return prev;
      
      return {
        ...prev,
        [fromStageId]: {
          ...prev[fromStageId],
          leads: prev[fromStageId].leads.filter(l => l.id !== leadId),
        },
        [toStageId]: {
          ...prev[toStageId],
          leads: [...(prev[toStageId]?.leads || []), { ...lead, stageId: toStageId }],
        },
      };
    });

    try {
      // Patch backend stage; do NOT refetch full board to prevent layout flickers
      await updateLeadStage(leadId, toStageId);
    } catch (err) {
      // Rollback to snapshot on failure
      if (snapshotRef.current) setColumns(snapshotRef.current);
      toast.error(err?.message || 'Could not move lead. Try again.');
    }
  }, []); // ← stable: no columns dependency

  const addLeadToColumn = useCallback((stageId, lead) => {
    setColumns(prev => {
      if (!prev[stageId]) return prev;
      return {
        ...prev,
        [stageId]: { ...prev[stageId], leads: [lead, ...prev[stageId].leads] },
      };
    });
  }, []);

  // Memoised so consumers don't re-render when unrelated state changes
  const orderedStages = useMemo(
    () =>
      Object.values(columns)
        .map(c => c.stage)
        .sort((a, b) => (a.orderNo ?? a.order_no ?? 0) - (b.orderNo ?? b.order_no ?? 0)),
    [columns]
  );

  return {
    columns,
    orderedStages,
    loading,
    error,
    moveCard,
    addLeadToColumn,
    refetch: () => fetchBoard(null),
    pipelineName,
  };
};
