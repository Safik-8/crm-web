import { useState, useEffect, useCallback } from 'react';
import { getAllStages, getPipelineStages } from '../services/stageService';

export const useStages = (pipelineId = null) => {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (pipelineId) {
        res = await getPipelineStages(pipelineId);
        const raw = res?.data;
        const arr = Array.isArray(raw) ? raw
          : Array.isArray(raw?.stages) ? raw.stages
          : [];
        setStages(arr);
      } else {
        res = await getAllStages();
        const raw = res?.data;
        const arr = Array.isArray(raw) ? raw
          : Array.isArray(raw?.stages) ? raw.stages
          : [];
        setStages(arr);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load stages');
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  useEffect(() => { fetchStages(); }, [fetchStages]);

  return { stages, setStages, loading, error, refetch: fetchStages };
};
