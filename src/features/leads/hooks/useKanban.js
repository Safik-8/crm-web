import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getPipelineById } from '../../pipelines/services/pipelineService';
import { updateLeadStage } from '../services/leadService';
import { toast } from '../../../shared/utils/toast';

/**
 * useKanban — Manages full Kanban board state for a single pipeline.
 *
 * columns: { [stageId]: { stage, leads: [] } }
 *
 * Loading states:
 *   loading      → true only on the FIRST load (no columns yet). Shows skeleton.
 *   isRefetching → true on subsequent fetches (columns already visible). Shows
 *                  subtle overlay — board stays mounted, no flash.
 *
 * Performance:
 *   - columnsRef mirrors columns so moveCard never needs columns in its dep array.
 *   - orderedStages is memoised to prevent downstream re-renders.
 *   - Request sequence tracking prevents stale response race conditions.
 *   - AbortController cancels in-flight requests on unmount / filter change.
 */
export const useKanban = (pipelineId, filters = {}) => {
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);       // initial skeleton load
  const [isRefetching, setIsRefetching] = useState(false); // background refresh
  const [error, setError] = useState(null);
  const [pipelineName, setPipelineName] = useState('');
  // Users assignable within this pipeline — sourced directly from pipeline response.
  // No separate API call needed; backend guarantees branch/company-scoped correctness.
  const [assignableUsers, setAssignableUsers] = useState([]);

  // Mirror of columns kept in a ref so moveCard can read the latest value
  // without being recreated every time columns changes.
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  // Snapshot ref for optimistic-update rollback
  const snapshotRef = useRef(null);

  // Track request sequence to prevent out-of-order stale response race conditions
  const activeRequestSeqRef = useRef(0);

  // Deep-stringify filters so useEffect dependencies are stable
  const stringifiedFilters = JSON.stringify(filters);

  const fetchBoard = useCallback(
    async (signal = null) => {
      if (!pipelineId) return;

      const currentSeq = ++activeRequestSeqRef.current;
      const isInitialLoad = Object.keys(columnsRef.current).length === 0;

      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefetching(true);
      }
      setError(null);

      try {
        const res = await getPipelineById(pipelineId, filters, { signal });

        // Discard if a newer request has already started or request was cancelled
        if (currentSeq !== activeRequestSeqRef.current) return;
        if (!res) return;

        const pipeline = res?.data?.pipeline || res?.pipeline;
        if (!pipeline) throw new Error('Pipeline board details not found');

        setPipelineName(pipeline.name || '');
        setAssignableUsers(pipeline.assignableUsers || []);

        const stages = pipeline.stages || [];
        const cols = {};
        stages.forEach((stage) => {
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
        // AbortError is intentional cancellation — swallow silently, no toast
        if (err?.name === 'AbortError') return;
        setError(err?.message || 'Failed to load board');
      } finally {
        if (currentSeq === activeRequestSeqRef.current) {
          setLoading(false);
          setIsRefetching(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pipelineId, stringifiedFilters]
  );

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
   *
   * RULE: Leads in the Closure stage are permanently locked — they cannot be
   * moved to any other stage. This is enforced here (data layer) as the single
   * source of truth, in addition to UI-layer guards in the page component.
   */
  const moveCard = useCallback(async (leadId, fromStageId, toStageId) => {
    // Normalize to strings — JS object keys are always strings
    const fromKey = String(fromStageId);
    const toKey = String(toStageId);
    if (fromKey === toKey) return;

    // ── Closure lock: leads in the closure stage cannot be moved out ──────
    const fromStage = columnsRef.current[fromKey]?.stage;
    if (fromStage?.name?.toLowerCase() === 'closure') {
      toast.error('Leads in Closure cannot be moved to another stage.');
      return;
    }

    // Deep-clone current state for rollback
    snapshotRef.current = JSON.parse(JSON.stringify(columnsRef.current));

    setColumns((prev) => {
      const lead = prev[fromKey]?.leads.find((l) => l.id === leadId);
      if (!lead) return prev;
      return {
        ...prev,
        [fromKey]: {
          ...prev[fromKey],
          leads: prev[fromKey].leads.filter((l) => l.id !== leadId),
        },
        [toKey]: {
          ...prev[toKey],
          leads: [...(prev[toKey]?.leads || []), { ...lead, stageId: Number(toStageId) }],
        },
      };
    });

    try {
      await updateLeadStage(leadId, toStageId);
    } catch (err) {
      if (snapshotRef.current) setColumns(snapshotRef.current);
      toast.error(err?.message || 'Could not move lead. Try again.');
    }
  }, []); // stable: no columns dependency

  const addLeadToColumn = useCallback((stageId, lead) => {
    setColumns((prev) => {
      if (!prev[stageId]) return prev;
      return {
        ...prev,
        [stageId]: { ...prev[stageId], leads: [lead, ...prev[stageId].leads] },
      };
    });
  }, []);

  /**
   * Update a lead's data in local state (optimistic update after successful PUT).
   * Finds the lead across all columns and merges the updated fields.
   */
  const updateLeadLocal = useCallback((leadId, updatedFields) => {
    setColumns((prev) => {
      const next = { ...prev };
      for (const stageId of Object.keys(next)) {
        const col = next[stageId];
        const idx = col.leads.findIndex((l) => l.id === leadId);
        if (idx !== -1) {
          const updatedLeads = [...col.leads];
          updatedLeads[idx] = { ...updatedLeads[idx], ...updatedFields };
          next[stageId] = { ...col, leads: updatedLeads };
          break;
        }
      }
      return next;
    });
  }, []);

  /**
   * Remove a lead from local state immediately (after successful DELETE or 404).
   */
  const deleteLeadLocal = useCallback((leadId) => {
    setColumns((prev) => {
      const next = { ...prev };
      for (const stageId of Object.keys(next)) {
        const col = next[stageId];
        if (col.leads.some((l) => l.id === leadId)) {
          next[stageId] = {
            ...col,
            leads: col.leads.filter((l) => l.id !== leadId),
          };
          break;
        }
      }
      return next;
    });
  }, []);

  const orderedStages = useMemo(
    () =>
      Object.values(columns)
        .map((c) => c.stage)
        .sort(
          (a, b) =>
            (a.orderNo ?? a.order_no ?? 0) - (b.orderNo ?? b.order_no ?? 0)
        ),
    [columns]
  );

  return {
    columns,
    orderedStages,
    loading,
    isRefetching,
    error,
    moveCard,
    addLeadToColumn,
    updateLeadLocal,
    deleteLeadLocal,
    refetch: () => fetchBoard(null),
    pipelineName,
    assignableUsers,
  };
};
