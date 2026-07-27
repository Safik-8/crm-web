import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPipelineById } from '../../pipelines/services/pipelineService';
import { updateLeadStage } from '../services/leadService';
import { toast } from '../../../shared/utils/toast';
import { isTerminalStage } from '../../pipelines/utils/stageRules';

export const KANBAN_KEYS = {
  all: ['kanban'],
  board: (pipelineId, filters) => [...KANBAN_KEYS.all, pipelineId, filters],
};

/**
 * useKanban — Manages full Kanban board state using TanStack Query.
 * Includes in-flight mutation counter to prevent query refetch race conditions
 * during rapid drag-and-drop actions.
 */
export const useKanban = (pipelineId, filters = {}) => {
  const queryClient = useQueryClient();
  const [columns, setColumns] = useState({});
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const snapshotRef = useRef(null);

  // Track in-flight card move mutations to prevent refetch race conditions during rapid dragging
  const inFlightMoveCountRef = useRef(0);

  const queryKey = useMemo(() => KANBAN_KEYS.board(pipelineId, filters), [pipelineId, filters]);

  const {
    data: boardData,
    isLoading: isQueryLoading,
    isFetching: isRefetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const res = await getPipelineById(pipelineId, filters, { signal });
      return res?.data?.pipeline || res?.pipeline || res;
    },
    enabled: !!pipelineId,
    staleTime: 10000,
  });

  // Sync local columns state when Query Data updates, UNLESS rapid card moves are currently in-flight
  useEffect(() => {
    if (!boardData) return;
    // Skip overwriting local optimistic columns while user has active card moves processing on the server
    if (inFlightMoveCountRef.current > 0) return;

    const stages = boardData.stages || [];
    const cols = {};
    stages.forEach((stage) => {
      cols[stage.id] = {
        stage: {
          id: stage.id,
          name: stage.name,
          isDefault: stage.isDefault,
          orderNo: stage.orderNo,
          stageType: stage.stageType || null,
          colorCode: stage.colorCode || null,
          code: stage.code || null,
          status: stage.status || 'ACTIVE',
        },
        leads: stage.leads || [],
      };
    });

    setColumns(cols);
  }, [boardData]);

  const pipelineName = boardData?.name || '';
  const assignableUsers = boardData?.assignableUsers || [];
  const loading = isQueryLoading && Object.keys(columns).length === 0;
  const error = queryError ? (queryError?.message || 'Failed to load board') : null;

  // TanStack Mutation for card moves
  const moveCardMutation = useMutation({
    mutationFn: async ({ leadId, toStageId, reason }) => {
      return updateLeadStage(leadId, toStageId, reason);
    },
    onSuccess: () => {
      inFlightMoveCountRef.current = Math.max(0, inFlightMoveCountRef.current - 1);
      // Only trigger query invalidation when ALL in-flight rapid moves have completed processing
      if (inFlightMoveCountRef.current === 0) {
        queryClient.invalidateQueries({ queryKey: KANBAN_KEYS.all });
      }
    },
    onError: (err) => {
      inFlightMoveCountRef.current = Math.max(0, inFlightMoveCountRef.current - 1);
      if (snapshotRef.current) setColumns(snapshotRef.current);
      toast.error(err?.message || 'Could not move lead. Try again.');
      if (inFlightMoveCountRef.current === 0) {
        queryClient.invalidateQueries({ queryKey: KANBAN_KEYS.all });
      }
    },
  });

  const moveCard = useCallback(
    async (leadId, fromStageId, toStageId, reason = null) => {
      const fromKey = String(fromStageId);
      const toKey = String(toStageId);
      if (fromKey === toKey) return;

      const fromStage = columnsRef.current[fromKey]?.stage;
      if (isTerminalStage(fromStage)) {
        toast.error(`Leads in "${fromStage?.name}" stage cannot be moved to another stage.`);
        return;
      }

      snapshotRef.current = JSON.parse(JSON.stringify(columnsRef.current));

      // Optimistically update local UI columns immediately
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

      inFlightMoveCountRef.current++;
      return moveCardMutation.mutateAsync({ leadId, toStageId, reason });
    },
    [moveCardMutation]
  );

  const addLeadToColumn = useCallback((stageId, lead) => {
    setColumns((prev) => {
      if (!prev[stageId]) return prev;
      return {
        ...prev,
        [stageId]: { ...prev[stageId], leads: [lead, ...prev[stageId].leads] },
      };
    });
    queryClient.invalidateQueries({ queryKey: KANBAN_KEYS.all });
  }, [queryClient]);

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
    queryClient.invalidateQueries({ queryKey: KANBAN_KEYS.all });
  }, [queryClient]);

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
    queryClient.invalidateQueries({ queryKey: KANBAN_KEYS.all });
  }, [queryClient]);

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
    refetch,
    pipelineName,
    assignableUsers,
  };
};
