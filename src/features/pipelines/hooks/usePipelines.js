import { useState, useEffect, useCallback } from 'react';
import { getPipelines, createPipeline, deletePipeline, updatePipeline } from '../services/pipelineService';
import { toast } from 'sonner';

export const usePipelines = () => {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPipelines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPipelines();
      const raw = res?.data;
      const arr = Array.isArray(raw) ? raw
        : Array.isArray(raw?.pipelines) ? raw.pipelines
        : [];
      setPipelines(arr);
    } catch (err) {
      setError(err?.message || 'Failed to load pipelines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPipelines(); }, [fetchPipelines]);

  const addPipeline = async (data) => {
    try {
      const res = await createPipeline(data);
      const newPipeline = res?.data?.pipeline;
      if (newPipeline) {
        setPipelines(prev => [newPipeline, ...prev]);
        toast.success('Pipeline created!');
      }
      return { success: true, pipeline: newPipeline };
    } catch (err) {
      const msg = err?.message || 'Failed to create pipeline';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const editPipeline = async (id, data) => {
    try {
      const res = await updatePipeline(id, data);
      const updated = res?.data?.pipeline;
      if (updated) {
        setPipelines(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
        toast.success('Pipeline updated!');
      }
      return { success: true };
    } catch (err) {
      toast.error(err?.message || 'Failed to update pipeline');
      return { success: false };
    }
  };

  const removePipeline = async (id) => {
    try {
      await deletePipeline(id);
      setPipelines(prev => prev.filter(p => p.id !== id));
      toast.success('Pipeline deleted');
      return { success: true };
    } catch (err) {
      toast.error(err?.message || 'Failed to delete pipeline');
      return { success: false };
    }
  };

  return { pipelines, loading, error, refetch: fetchPipelines, addPipeline, editPipeline, removePipeline };
};
