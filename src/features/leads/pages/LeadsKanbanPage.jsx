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
import LeadFormModal from '../components/LeadFormModal';
import LeadImportModal from '../components/LeadImportModal';
import LeadDetailDrawer from '../components/LeadDetailDrawer';
import LeadEditModal from '../components/LeadEditModal';
import LeadDeleteModal from '../components/LeadDeleteModal';
import { toast } from '../../../shared/utils/toast';

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

  const handleToggleCollapse = useCallback(() => {
    setIsSidebarCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem('kanban-sidebar-collapsed', String(next)); } catch {}
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

  // canManage gates both Edit and Delete actions per backend permission spec:
  // LEAD.canCreate === true is required for both edit and delete.
  const canManage = !!(user?.permissions?.LEAD?.canCreate);

  const scrollContainerRef = useRef(null);
  const dragPositionRef = useRef({ x: 0, y: 0 });
  const autoScrollRafRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const startAutoScroll = useCallback(() => {
    const tick = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const { x, y } = dragPositionRef.current;
      const relX = x - rect.left;
      const relY = y - rect.top;
      if (relX < 80 && container.scrollLeft > 0) container.scrollLeft -= 12;
      else if (relX > rect.width - 80) container.scrollLeft += 12;
      if (relY < 60 && container.scrollTop > 0) container.scrollTop -= 10;
      else if (relY > rect.height - 60) container.scrollTop += 10;
      autoScrollRafRef.current = requestAnimationFrame(tick);
    };
    autoScrollRafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopAutoScroll = useCallback(() => {
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

  const handleDragStart = ({ active }) => {
    // Read source stageId from DnD metadata attached in LeadCard's useSortable
    const data = active.data?.current;
    const leadId = data?.leadId ?? active.id;
    const fromStageId = data?.stageId ?? findColumn(leadId);
    if (!fromStageId) return;

    setActiveFrom(fromStageId);
    const col = columns[fromStageId];
    setActiveCard(col?.leads.find((l) => l.id === leadId) ?? null);
    startAutoScroll();
  };

  const handleDragMove = useCallback(({ activatorEvent, delta }) => {
    const startX = activatorEvent?.clientX ?? activatorEvent?.touches?.[0]?.clientX ?? 0;
    const startY = activatorEvent?.clientY ?? activatorEvent?.touches?.[0]?.clientY ?? 0;
    dragPositionRef.current = { x: startX + (delta?.x ?? 0), y: startY + (delta?.y ?? 0) };
  }, []);

  const handleDragEnd = async ({ active, over }) => {
    stopAutoScroll();
    const draggedCard = activeCard;
    const fromStage = activeFrom;
    setActiveCard(null);
    setActiveFrom(null);

    if (!over || !canEdit || !fromStage || !draggedCard) return;

    // Resolve the destination stageId from the over element's DnD metadata
    const overData = over.data?.current;
    let toStageId;
    if (overData?.type === 'column') {
      toStageId = overData.stageId;
    } else if (overData?.type === 'card') {
      toStageId = overData.stageId;
    } else {
      // Fallback: try to extract from findColumn if metadata is missing
      toStageId = findColumn(overData?.leadId ?? over.id);
    }

    if (!toStageId) return;
    if (String(fromStage) === String(toStageId)) return;

    // ── Closure lock: prevent dragging out of the closure stage ──────────
    const fromStageObj = Object.values(columns).find(
      (col) => String(col.stage.id) === String(fromStage)
    )?.stage;
    if (fromStageObj?.name?.toLowerCase() === 'closure') {
      toast.error('Leads in Closure cannot be moved to another stage.');
      return;
    }

    await moveCard(draggedCard.id, fromStage, toStageId);
  };

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
              <div className="min-w-0">
                <h1 className="text-[13px] sm:text-[15px] font-semibold font-heading text-zinc-900 truncate tracking-tight">
                  {boardTitle}
                </h1>
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Mobile/Tablet filter toggle — hidden on lg+ where sidebar is always visible */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className={`lg:hidden flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border transition-all duration-150 shrink-0 text-[11px] sm:text-[12px] font-semibold ${
                hasActiveFilters
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
                  <LeadCard lead={activeCard} stageId={activeFrom} onClick={() => {}} />
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
        <LeadFormModal
          pipelineId={Number(pipelineId)}
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
    </div>
  );
};

export default LeadsKanbanPage;
