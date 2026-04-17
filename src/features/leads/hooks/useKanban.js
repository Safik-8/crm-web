import { useState, useEffect, useCallback, useRef } from 'react';
import { getPipelineStages } from '../../pipelines/services/stageService';
import { getLeads, updateLeadStage } from '../services/leadService';
import { toast } from 'sonner';

/**
 * Manages the full Kanban state for a single pipeline.
 * columns: { [stageId]: { stage, leads: [] } }
 */
export const useKanban = (pipelineId) => {
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Keep a snapshot for rollback on failed DND moves
  const snapshotRef = useRef(null);

  const fetchBoard = useCallback(async () => {
    if (!pipelineId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch ordered stage columns
      const stagesRes = await getPipelineStages(pipelineId);
      const rawStages = stagesRes?.data;
      const stages = Array.isArray(rawStages) ? rawStages
        : Array.isArray(rawStages?.stages) ? rawStages.stages
        : [];

      // 2. Fetch all leads for this pipeline
      const leadsRes = await getLeads({ pipelineId });
      const rawLeads = leadsRes?.data;
      const leads = Array.isArray(rawLeads) ? rawLeads
        : Array.isArray(rawLeads?.leads) ? rawLeads.leads
        : [];

      // 3. Bucket leads into their respective stage columns
      const cols = {};
      stages.forEach(stage => {
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
   * Optimistic card move. Moves a lead card from one column to another,
   * then calls the API. Rolls back on failure.
   */
  const moveCard = useCallback(async (leadId, fromStageId, toStageId) => {
    if (fromStageId === toStageId) return;

    // Snapshot for rollback
    snapshotRef.current = JSON.parse(JSON.stringify(columns));

    // Optimistic update
    setColumns(prev => {
      const next = { ...prev };
      const lead = next[fromStageId]?.leads.find(l => l.id === leadId);
      if (!lead) return prev;
      next[fromStageId] = { ...next[fromStageId], leads: next[fromStageId].leads.filter(l => l.id !== leadId) };
      next[toStageId] = { ...next[toStageId], leads: [...(next[toStageId]?.leads || []), { ...lead, stageId: toStageId }] };
      return next;
    });

    try {
      await updateLeadStage(leadId, toStageId);
    } catch (err) {
      // Rollback
      setColumns(snapshotRef.current);
      toast.error(err?.message || 'Could not move lead. Try again.');
    }
  }, [columns]);

  const addLeadToColumn = useCallback((stageId, lead) => {
    setColumns(prev => {
      if (!prev[stageId]) return prev;
      return {
        ...prev,
        [stageId]: { ...prev[stageId], leads: [lead, ...prev[stageId].leads] },
      };
    });
  }, []);

  // Ordered stage list for rendering columns left-to-right
  const orderedStages = Object.values(columns).map(c => c.stage);

  return { columns, orderedStages, loading, error, moveCard, addLeadToColumn, refetch: fetchBoard };
};
