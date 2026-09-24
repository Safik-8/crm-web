import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePipelines } from '../hooks/usePipelines';
import { useAuth } from '../../../app/providers/AuthProvider';
import { PERMISSIONS } from '../../../lib/constants/permissions';
import { useLoader } from '../../../shared/context/LoaderContext';
import { Kanban } from 'lucide-react';

/**
 * PipelineIndexRedirect
 * Intelligent entrypoint for /pipelines:
 * - Checks user role & board permissions.
 * - Resolves the target pipeline (Last Visited in localStorage -> First Available).
 * - Redirects to /pipelines/:id/board or /pipelines/cards (for cards-only roles/empty state).
 */
const PipelineIndexRedirect = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { pipelines, loading, error } = usePipelines();
  const { forceHideLoader } = useLoader();
  const redirectedRef = useRef(false);

  const canViewKanban = hasPermission(PERMISSIONS.VIEW_LEADS_KANBAN);

  useEffect(() => {
    if (loading || redirectedRef.current) return;

    // 1. If role doesn't have Kanban board access, redirect to all cards view
    if (!canViewKanban) {
      redirectedRef.current = true;
      forceHideLoader();
      navigate('/pipelines/cards', { replace: true });
      return;
    }

    // 2. If no pipelines exist or error occurred, redirect to cards view where empty/error state is handled
    if (!pipelines || pipelines.length === 0 || error) {
      redirectedRef.current = true;
      forceHideLoader();
      navigate('/pipelines/cards', { replace: true });
      return;
    }

    // 3. Resolve target pipeline:
    //    Step A: Check user's last visited pipeline in localStorage
    //    Step B: Fallback to the first accessible pipeline (pipelines[0])
    const storageKey = `last_active_pipeline_${user?.id || 'default'}`;
    let targetPipelineId = null;

    try {
      const savedId = localStorage.getItem(storageKey);
      if (savedId) {
        const parsedSavedId = Number(savedId);
        const existsInAllowed = pipelines.some((p) => Number(p.id) === parsedSavedId);
        if (existsInAllowed) {
          targetPipelineId = parsedSavedId;
        }
      }
    } catch {
      // Ignore localStorage read errors
    }

    if (!targetPipelineId) {
      targetPipelineId = pipelines[0].id;
    }

    // Keep storage in sync
    try {
      localStorage.setItem(storageKey, String(targetPipelineId));
    } catch {
      // Ignore localStorage write errors
    }

    redirectedRef.current = true;
    forceHideLoader();
    navigate(`/pipelines/${targetPipelineId}/board`, { replace: true });
  }, [loading, pipelines, error, canViewKanban, user?.id, navigate, forceHideLoader]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-500 animate-in fade-in duration-200">
      <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-primary animate-pulse">
        <Kanban size={22} />
      </div>
      <p className="text-xs font-semibold text-slate-500">Loading active pipeline...</p>
    </div>
  );
};

export default PipelineIndexRedirect;
