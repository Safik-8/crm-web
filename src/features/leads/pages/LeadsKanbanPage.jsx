import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Plus, ArrowLeft, RefreshCw, AlertCircle, Kanban, Upload, SlidersHorizontal } from 'lucide-react';
import { useKanban } from '../hooks/useKanban';
import { useKanbanFilters } from '../hooks/useKanbanFilters';
import { KanbanFilterSidebar } from '../components/KanbanFilterSidebar';
import { useAuth } from '../../../app/providers/AuthProvider';
import { PERMISSIONS } from '../../../lib/constants/permissions';
import { useLoader } from '../../../shared/context/LoaderContext';
import KanbanColumn from '../components/KanbanColumn';
import LeadCard from '../components/LeadCard';
import LeadCreateModal from '../components/LeadCreateModal';
import LeadImportModal from '../components/LeadImportModal';
import LeadDetailDrawer from '../components/LeadDetailDrawer';
import LeadEditModal from '../components/LeadEditModal';
import LeadDeleteModal from '../components/LeadDeleteModal';
import LostReasonModal from '../components/LostReasonModal';
import { toast } from '../../../shared/utils/toast';
import { isTerminalStage, requiresReason } from '../../pipelines/utils/stageRules';


/**
 * LeadsKanbanPage — Main Kanban board orchestrator.
 *
 * Layout:
 *   [ KanbanFilterSidebar ] [ Kanban board (horizontal scroll) ]
 *
 *   Desktop (lg+): Sidebar is a fixed-width panel, collapsible to icon rail.
 *   Mobile/Tablet: Sidebar is a slide-over drawer triggered by the header button.
 *
 * Filter flow (unchanged):
 *   1. Sidebar edits draftFilters locally — no API calls.
 *   2. Apply → commits draft to URL → one API request.
 *   3. isRefetching → board dims subtly, Apply shows spinner.
 *   4. On complete → success toast.
 */

/**
 * Custom collision detector for the Kanban board.
 *
 * Strategy:
 *  1. Try pointerWithin first — most accurate when pointer is inside a column.
 *  2. Fall back to closestCenter when pointer is between columns or near edges.
 *
 * This prevents the closestCorners bug (wrong column activates) while also
 * preventing the pointerWithin bug (no column activates near column edges).
 */
const kanbanCollision = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  return closestCenter(args);
};

const LeadsKanbanPage = () => {
  const { id: pipelineId } = useParams();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const { forceHideLoader } = useLoader();

  // ── Sidebar collapse/mobile state ───────────────────────────────────────
  // Desktop: start expanded. Persisted in localStorage so it survives navigation.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('kanban-sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // ── Lost Reason Modal state (Sprint 4) ─────────────────────────────
  // When drag targets a LOST stage, we intercept and store the pending move
  // here instead of calling moveCard immediately.
  const [lostReasonModal, setLostReasonModal] = useState(null); // { leadId, fromStageId, toStageId, leadName, targetStageName }
  const [isMovingLead, setIsMovingLead] = useState(false);

  const handleToggleCollapse = useCallback(() => {
    setIsSidebarCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem('kanban-sidebar-collapsed', String(next)); } catch { }
      return next;
    });
  }, []);

  // ── Filter state (staged: draft → applied) ──────────────────────────────
  const {
    draftFilters,
    setDraftFilters,
    apiParams,
    hasActiveFilters,
    hasDraftActiveFilters,
    applyFilters,
    resetFilters,
    isDirty,
    dateRangeError,
  } = useKanbanFilters();

  // ── Board state ──────────────────────────────────────────────────────────
  const {
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
  } = useKanban(pipelineId, apiParams);

  // ── Toast feedback for filter actions ───────────────────────────────────
  const prevIsRefetchingRef = useRef(false);
  const pendingFilterActionRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  const handleApplyFilters = useCallback(() => {
    pendingFilterActionRef.current = 'apply';
    applyFilters();
  }, [applyFilters]);

  const handleResetFilters = useCallback(() => {
    pendingFilterActionRef.current = 'reset';
    resetFilters();
  }, [resetFilters]);

  const handleRefetch = useCallback(() => {
    pendingFilterActionRef.current = 'refresh';
    refetch();
  }, [refetch]);

  useEffect(() => {
    const wasRefetching = prevIsRefetchingRef.current;
    prevIsRefetchingRef.current = isRefetching;

    if (isFirstLoadRef.current) {
      if (!loading && !isRefetching) isFirstLoadRef.current = false;
      return;
    }

    if (wasRefetching && !isRefetching && !error) {
      const action = pendingFilterActionRef.current;
      pendingFilterActionRef.current = null;
      if (action === 'apply') toast.success('Filters applied');
      else if (action === 'reset') toast.success('Filters reset');
      else if (action === 'refresh') toast.success('Board refreshed');
    }
  }, [isRefetching, loading, error]);

  // ── DnD setup ────────────────────────────────────────────────────────────
  const didHideInitialRouteLoaderRef = useRef(false);

  const [activeCard, setActiveCard] = useState(null);
  const [activeFrom, setActiveFrom] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showImport, setShowImport] = useState(false);

  // Edit / Delete modal state
  const [editingLead, setEditingLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);

  const canCreate = hasPermission(PERMISSIONS.CREATE_LEAD);
  const canEdit = hasPermission(PERMISSIONS.EDIT_LEAD);

  // canManage gates Edit, Delete, and Kanban drag actions:
  const canManage = hasPermission(PERMISSIONS.MANAGE_KANBAN) || hasPermission(PERMISSIONS.MANAGE_LEADS) || canEdit || canCreate || !!(user?.permissions?.LEAD?.canCreate);

  const scrollContainerRef = useRef(null);
  const dragPositionRef = useRef({ x: 0, y: 0 });
  const autoScrollRafRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const currentSpeedXRef = useRef(0);
  const currentSpeedYRef = useRef(0);

  const startAutoScroll = useCallback(() => {
    const tick = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const { x, y } = dragPositionRef.current;

      const thresholdX = Math.min(110, Math.max(50, rect.width * 0.22));
      const thresholdY = Math.min(70, Math.max(35, rect.height * 0.18));

      const distLeft = x - rect.left;
      const distRight = rect.right - x;
      const distTop = y - rect.top;
      const distBottom = rect.bottom - y;

      let targetSpeedX = 0;
      let targetSpeedY = 0;

      // Horizontal target speed calculation
      if (distLeft < thresholdX && container.scrollLeft > 0) {
        const intensity = Math.min(1, Math.max(0.15, (thresholdX - distLeft) / thresholdX));
        targetSpeedX = -Math.round(intensity * 22); // Negative for left
      } else if (distRight < thresholdX) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (container.scrollLeft < maxScroll) {
          const intensity = Math.min(1, Math.max(0.15, (thresholdX - distRight) / thresholdX));
          targetSpeedX = Math.round(intensity * 22); // Positive for right
        }
      }

      // Vertical target speed calculation
      if (distTop < thresholdY && container.scrollTop > 0) {
        const intensity = Math.min(1, Math.max(0.15, (thresholdY - distTop) / thresholdY));
        targetSpeedY = -Math.round(intensity * 14);
      } else if (distBottom < thresholdY) {
        const maxScrollY = container.scrollHeight - container.clientHeight;
        if (container.scrollTop < maxScrollY) {
          const intensity = Math.min(1, Math.max(0.15, (thresholdY - distBottom) / thresholdY));
          targetSpeedY = Math.round(intensity * 14);
        }
      }

      // Physics LERP (Linear Interpolation) for buttery smooth momentum
      currentSpeedXRef.current = currentSpeedXRef.current * 0.72 + targetSpeedX * 0.28;
      currentSpeedYRef.current = currentSpeedYRef.current * 0.72 + targetSpeedY * 0.28;

      // Apply horizontal movement
      if (Math.abs(currentSpeedXRef.current) > 0.1) {
        if (currentSpeedXRef.current < 0 && container.scrollLeft > 0) {
          container.scrollLeft = Math.max(0, container.scrollLeft + currentSpeedXRef.current);
        } else if (currentSpeedXRef.current > 0) {
          const maxScroll = container.scrollWidth - container.clientWidth;
          if (container.scrollLeft < maxScroll) {
            container.scrollLeft = Math.min(maxScroll, container.scrollLeft + currentSpeedXRef.current);
          }
        }
      }

      // Apply vertical movement
      if (Math.abs(currentSpeedYRef.current) > 0.1) {
        if (currentSpeedYRef.current < 0 && container.scrollTop > 0) {
          container.scrollTop = Math.max(0, container.scrollTop + currentSpeedYRef.current);
        } else if (currentSpeedYRef.current > 0) {
          const maxScrollY = container.scrollHeight - container.clientHeight;
          if (container.scrollTop < maxScrollY) {
            container.scrollTop = Math.min(maxScrollY, container.scrollTop + currentSpeedYRef.current);
          }
        }
      }

      autoScrollRafRef.current = requestAnimationFrame(tick);
    };
    autoScrollRafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopAutoScroll = useCallback(() => {
    currentSpeedXRef.current = 0;
    currentSpeedYRef.current = 0;
    if (autoScrollRafRef.current) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  /**
   * Find which stage a lead currently lives in.
   * Returns the NUMERIC stage id (not stringified object key).
   */
  const findColumn = useCallback(
    (leadId) => {
      for (const col of Object.values(columns)) {
        if (col.leads.some((l) => l.id === leadId)) return col.stage.id;
      }
      return null;
    },
    [columns]
  );

  const handleLeadClick = useCallback((lead) => setSelectedLead(lead), []);

  // Edit lead: open edit modal (permission already checked at render time)
  const handleEditLead = useCallback((lead) => {
    setEditingLead(lead);
  }, []);

  // Delete lead: open delete confirmation modal
  const handleDeleteLead = useCallback((lead) => {
    setDeletingLead(lead);
  }, []);

  // Called by LeadEditModal on successful update
  const handleLeadUpdated = useCallback((updatedLead) => {
    updateLeadLocal(updatedLead.id, updatedLead);
    // If the detail drawer is open for this lead, refresh it too
    setSelectedLead((prev) => prev?.id === updatedLead.id ? { ...prev, ...updatedLead } : prev);
  }, [updateLeadLocal]);

  // Called by LeadDeleteModal on successful delete
  const handleLeadDeleted = useCallback((leadId) => {
    deleteLeadLocal(leadId);
    // Close detail drawer if it was showing the deleted lead
    setSelectedLead((prev) => prev?.id === leadId ? null : prev);
  }, [deleteLeadLocal]);

  // Real-time window pointer listener for auto-scrolling during drag
  const updatePointerPos = useCallback((e) => {
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? e.changedTouches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? e.changedTouches?.[0]?.clientY;
    if (clientX !== undefined && clientY !== undefined) {
      dragPositionRef.current = { x: clientX, y: clientY };
    }
  }, []);

  const handleDragStart = ({ active, activatorEvent }) => {
    // Attach global listeners for active pointer position tracking
    window.addEventListener('pointermove', updatePointerPos, { passive: true });
    window.addEventListener('touchmove', updatePointerPos, { passive: true });

    const initialX = activatorEvent?.clientX ?? activatorEvent?.nativeEvent?.clientX ?? activatorEvent?.touches?.[0]?.clientX ?? 0;
    const initialY = activatorEvent?.clientY ?? activatorEvent?.nativeEvent?.clientY ?? activatorEvent?.touches?.[0]?.clientY ?? 0;
    dragPositionRef.current = { x: initialX, y: initialY };

    // Read source stageId from DnD metadata attached in LeadCard's useSortable
    const data = active.data?.current;
    const rawId = active.id;
    const leadId = data?.leadId ?? Number(String(rawId).replace('card-', ''));
    const fromStageId = data?.stageId ?? findColumn(leadId);
    if (!fromStageId) return;

    setActiveFrom(fromStageId);
    let card = null;
    for (const col of Object.values(columns)) {
      const found = col.leads.find((l) => Number(l.id) === Number(leadId));
      if (found) {
        card = found;
        break;
      }
    }
    setActiveCard(card);
    startAutoScroll();
  };

  const handleDragMove = useCallback((event) => {
    const { activatorEvent, delta } = event;
    const startX = activatorEvent?.clientX ?? activatorEvent?.nativeEvent?.clientX ?? activatorEvent?.touches?.[0]?.clientX ?? 0;
    const startY = activatorEvent?.clientY ?? activatorEvent?.nativeEvent?.clientY ?? activatorEvent?.touches?.[0]?.clientY ?? 0;
    if (startX || startY) {
      dragPositionRef.current = { x: startX + (delta?.x ?? 0), y: startY + (delta?.y ?? 0) };
    }
  }, []);

  const handleDragEnd = async ({ active, over }) => {
    window.removeEventListener('pointermove', updatePointerPos);
    window.removeEventListener('touchmove', updatePointerPos);
    stopAutoScroll();
    const draggedCard = activeCard;
    const fromStage = activeFrom;
    setActiveCard(null);
    setActiveFrom(null);

    if (!over || !canManage || !fromStage || !draggedCard) return;

    // Resolve destination stageId robustly
    const overData = over.data?.current;
    let toStageId = overData?.stageId;

    if (!toStageId && over.id) {
      const strId = String(over.id);
      if (strId.startsWith('stage-')) {
        toStageId = Number(strId.replace('stage-', ''));
      } else if (strId.startsWith('card-')) {
        const targetLeadId = Number(strId.replace('card-', ''));
        toStageId = findColumn(targetLeadId);
      } else {
        const parsed = Number(strId);
        if (!isNaN(parsed)) toStageId = findColumn(parsed) || parsed;
      }
    }

    if (!toStageId) return;
    if (String(fromStage) === String(toStageId)) return;

    // ── Terminal lock: prevent dragging OUT of WON/CLOSURE stages ─────────
    const fromStageObj = Object.values(columns).find(
      (col) => String(col.stage.id) === String(fromStage)
    )?.stage;
    if (isTerminalStage(fromStageObj)) {
      toast.error(`Leads in "${fromStageObj?.name}" stage cannot be moved to another stage.`);
      return;
    }

    // ── LOST intercept: show reason modal before calling moveCard ─────────
    const toStageObj = Object.values(columns).find(
      (col) => String(col.stage.id) === String(toStageId)
    )?.stage;
    if (requiresReason(toStageObj)) {
      setLostReasonModal({
        leadId:          draggedCard.id,
        fromStageId:     fromStage,
        toStageId,
        leadName:        draggedCard.name || 'this lead',
        targetStageName: toStageObj?.name || 'Lost',
      });
      return; // do NOT call moveCard yet — modal will do it
    }

    await moveCard(draggedCard.id, fromStage, toStageId);
  };

  // ── Lost Reason Modal handlers (Sprint 4) ───────────────────────────
  const handleLostReasonConfirm = useCallback(async (reason) => {
    if (!lostReasonModal) return;
    const { leadId, fromStageId, toStageId } = lostReasonModal;
    setIsMovingLead(true);
    try {
      await moveCard(leadId, fromStageId, toStageId, reason);
      setLostReasonModal(null);
    } catch {
      // Rollback handled inside moveCard
    } finally {
      setIsMovingLead(false);
    }
  }, [lostReasonModal, moveCard]);

  const handleLostReasonCancel = useCallback(() => {
    setLostReasonModal(null);
  }, []);

  const stageForLead = useCallback(
    (lead) => {
      for (const col of Object.values(columns)) {
        if (col.leads.some((l) => l.id === lead?.id)) return col.stage?.name;
      }
      return null;
    },
    [columns]
  );

  const handleLeadCreated = (lead) => {
    if (!lead) { refetch(); return; }
    const prospectStage = orderedStages.find((s) => s.isDefault);
    if (prospectStage) addLeadToColumn(prospectStage.id, lead);
    else refetch();
  };

  useEffect(() => {
    if (!didHideInitialRouteLoaderRef.current && Object.keys(columns).length > 0) {
      forceHideLoader();
      didHideInitialRouteLoaderRef.current = true;
    }
  }, [columns, forceHideLoader]);

  const totalLeadsCount = useMemo(
    () => Object.values(columns).reduce((sum, col) => sum + (col.leads?.length || 0), 0),
    [columns]
  );

  const totalPipelineRevenue = useMemo(
    () =>
      Object.values(columns).reduce((sum, col) => {
        return sum + (col.leads?.reduce((cSum, lead) => cSum + (Number(lead.budget) || 0), 0) || 0);
      }, 0),
    [columns]
  );

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
        <div className="h-12 w-12 bg-red-50 rounded-2xl flex items-center justify-center">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <p className="text-[13px] font-medium text-zinc-600">{error}</p>
        <button
          onClick={handleRefetch}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-[12px] font-semibold hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const boardTitle = pipelineName || 'Pipeline Board';

  return (
    /*
     * Root: full height, horizontal flex.
     * [ KanbanFilterSidebar ] [ flex-col: header + board ]
     *
     * The sidebar is rendered first in DOM order (correct for LTR layout).
     * On mobile it becomes a fixed overlay — does not affect board layout.
     */
    <div className="flex h-full overflow-hidden bg-zinc-50">

      {/* ── Left: header + board ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Page header ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-zinc-200/70 bg-white/90 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.04)] gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Back */}
            <button
              onClick={() => navigate('/pipelines')}
              className="flex items-center justify-center p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-700 transition-all duration-150 shrink-0"
            >
              <ArrowLeft size={15} />
            </button>

            {/* Title */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-orange-50 shrink-0">
                <Kanban size={14} className="text-primary" />
              </div>
              <div className="min-w-0 flex items-center gap-2">
                <h1 className="text-[13px] sm:text-[15px] font-semibold font-heading text-zinc-900 truncate tracking-tight">
                  {boardTitle}
                </h1>
                {totalPipelineRevenue > 0 && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-700">
                    ₹{totalPipelineRevenue.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Mobile/Tablet filter toggle — hidden on lg+ where sidebar is always visible */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className={`lg:hidden flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border transition-all duration-150 shrink-0 text-[11px] sm:text-[12px] font-semibold ${hasActiveFilters
                  ? 'border-orange-200 bg-orange-50 text-orange-600'
                  : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300'
                }`}
              aria-label="Open filters"
            >
              <SlidersHorizontal size={13} />
              <span className="hidden xs:inline sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-primary text-white text-[9px] font-black leading-none">
                  ●
                </span>
              )}
            </button>
            <button
              onClick={handleRefetch}
              disabled={isRefetching}
              className="flex items-center justify-center w-8 h-8 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-150 disabled:opacity-50"
              title="Refresh board"
            >
              <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
            </button>
            {canCreate && (
              <>
                <button
                  onClick={() => setShowImport(true)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-600 text-[11px] sm:text-[12px] font-semibold hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-150"
                >
                  <Upload size={13} />
                  <span className="hidden sm:inline">Import</span>
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-primary text-white text-[11px] sm:text-[12px] font-bold shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all duration-150 active:scale-[0.97]"
                >
                  <Plus size={13} />
                  <span className="hidden sm:inline">Add Lead</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Kanban board ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={kanbanCollision}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="flex gap-3 sm:gap-4 md:gap-5 p-3 sm:p-4 md:p-6 h-full items-stretch min-w-max">
                {loading && Object.keys(columns).length === 0 ? (
                  // Initial skeleton
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="w-[76vw] xs:w-[72vw] sm:w-[272px] md:w-[288px] flex-shrink-0">
                      <div className="h-5 bg-zinc-300 rounded-lg animate-pulse mb-3 w-28" />
                      <div className="space-y-2.5">
                        {[...Array(2)].map((_, j) => (
                          <div key={j} className="h-24 bg-zinc-200 rounded-2xl animate-pulse" />
                        ))}
                      </div>
                    </div>
                  ))
                ) : totalLeadsCount === 0 && !loading && !isRefetching ? (
                  // Empty states
                  hasActiveFilters ? (
                    <div className="flex flex-col items-center justify-center w-full py-20 text-center animate-in fade-in duration-300 min-w-[60vw]">
                      <div className="h-14 w-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 mb-4 mx-auto shadow-sm border border-zinc-200/60">
                        <AlertCircle size={24} />
                      </div>
                      <h2 className="text-[14px] font-semibold text-zinc-800 mb-1 tracking-tight">No Matching Leads</h2>
                      <p className="text-[12px] text-zinc-500 max-w-xs mb-5 mx-auto leading-relaxed">
                        No leads match your active filters. Try resetting or clearing some constraints.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-[12px] font-semibold transition-all shadow-sm active:scale-95"
                      >
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full py-20 text-center animate-in fade-in duration-300 min-w-[60vw]">
                      <div className="h-14 w-14 bg-orange-50 rounded-2xl flex items-center justify-center text-primary mb-4 mx-auto shadow-sm border border-orange-100">
                        <Kanban size={24} />
                      </div>
                      <h2 className="text-[14px] font-semibold text-zinc-800 mb-1 tracking-tight">Your Pipeline is Empty</h2>
                      <p className="text-[12px] text-zinc-500 max-w-xs mb-5 mx-auto leading-relaxed">
                        Get started by adding your first lead, or import records from Excel.
                      </p>
                      {canCreate && (
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => setShowImport(true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 text-[12px] font-semibold hover:bg-zinc-50 bg-white transition-all shadow-sm"
                          >
                            <Upload size={13} /> Import Excel
                          </button>
                          <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-[12px] font-bold shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                          >
                            <Plus size={13} /> Add Lead
                          </button>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  // Board columns — stay mounted during refetch
                  orderedStages.map((stage) => (
                    <KanbanColumn
                      key={stage.id}
                      stage={stage}
                      leads={columns[stage.id]?.leads || []}
                      loading={loading && Object.keys(columns).length === 0}
                      isRefetching={isRefetching}
                      isFiltered={hasActiveFilters}
                      onLeadClick={handleLeadClick}
                      canManage={canManage}
                      onEditLead={handleEditLead}
                      onDeleteLead={handleDeleteLead}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {activeCard ? (
                <div className="w-[76vw] xs:w-[72vw] sm:w-[272px] md:w-[288px] rotate-1 sm:rotate-2 shadow-2xl opacity-90">
                  <LeadCard lead={activeCard} stageId={activeFrom} onClick={() => { }} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* ── Right filter sidebar ── */}
      <KanbanFilterSidebar
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        applyFilters={handleApplyFilters}
        resetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        hasDraftActiveFilters={hasDraftActiveFilters}
        isDirty={isDirty}
        dateRangeError={dateRangeError}
        isRefetching={isRefetching}
        assignableUsers={assignableUsers}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* ── Modals ── */}
      {showForm && (
        <LeadCreateModal
          isOpen={showForm}
          initialPipelineId={pipelineId}
          onClose={() => setShowForm(false)}
          onCreated={handleLeadCreated}
        />
      )}
      {showImport && (
        <LeadImportModal
          initialPipelineId={pipelineId}
          onClose={() => setShowImport(false)}
          onImported={refetch}
        />
      )}
      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          stageName={stageForLead(selectedLead)}
          onClose={() => setSelectedLead(null)}
        />
      )}
      {editingLead && canManage && (
        <LeadEditModal
          lead={editingLead}
          assignableUsers={assignableUsers}
          onClose={() => setEditingLead(null)}
          onUpdated={handleLeadUpdated}
        />
      )}
      {deletingLead && canManage && (
        <LeadDeleteModal
          lead={deletingLead}
          onClose={() => setDeletingLead(null)}
          onDeleted={handleLeadDeleted}
        />
      )}
      {/* Lost Reason Modal (Sprint 4) */}
      <LostReasonModal
        isOpen={!!lostReasonModal}
        isLoading={isMovingLead}
        leadName={lostReasonModal?.leadName}
        targetStage={lostReasonModal?.targetStageName}
        onConfirm={handleLostReasonConfirm}
        onCancel={handleLostReasonCancel}
      />
    </div>
  );
};


export default LeadsKanbanPage;
