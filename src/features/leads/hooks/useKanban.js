import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getPipelineStages } from '../../pipelines/services/stageService';
import { getLeads, updateLeadStage } from '../services/leadService';
import { toast } from 'sonner';

/**
 * Manages the full Kanban state for a single pipeline.
 * columns: { [stageId]: { stage, leads: [] } }
 *
 * Performance notes:
 * - columnsRef mirrors columns state so moveCard never needs columns in its
 *   dependency array — eliminates the "new function every render" problem.
 * - orderedStages is memoised so downstream components don't re-render when
 *   unrelated state changes.
 */
export const useKanban = (pipelineId) => {
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mirror of columns kept in a ref so moveCard can read the latest value
  // without being recreated every time columns changes.
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  // Snapshot ref for optimistic-update rollback
  const snapshotRef = useRef(null);

  const fetchBoard = useCallback(async () => {
    if (!pipelineId) return;
    setLoading(true);
    setError(null);
    try {
      const [stagesRes, leadsRes] = await Promise.all([
        getPipelineStages(pipelineId),
        getLeads({ pipelineId }),
      ]);

      const rawStages = stagesRes?.data;
      const stages = Array.isArray(rawStages) ? rawStages
        : Array.isArray(rawStages?.stages) ? rawStages.stages
        : [];

      const rawLeads = leadsRes?.data;
      const leads = Array.isArray(rawLeads) ? rawLeads
        : Array.isArray(rawLeads?.leads) ? rawLeads.leads
        : [];

      const sortedStages = [...stages].sort(
        (a, b) => (a.orderNo ?? a.order_no ?? 0) - (b.orderNo ?? b.order_no ?? 0)
      );

      const cols = {};
      sortedStages.forEach(stage => {
        cols[stage.id] = {
          stage,
          leads: leads.filter(l => l.stageId === stage.id || l.stage_id === stage.id),
        };
      });

      setColumns(cols);
    } catch (err) {
      setError(err?.message || 'Failed to load board');
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

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
      await updateLeadStage(leadId, toStageId);
    } catch (err) {
      // Rollback to snapshot
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

  return { columns, orderedStages, loading, error, moveCard, addLeadToColumn, refetch: fetchBoard };
};
