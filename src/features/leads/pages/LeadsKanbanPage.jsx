import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
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

const LeadsKanbanPage = () => {
  const { id: pipelineId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
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

  const canCreate = hasPermission(PERMISSIONS.CREATE_LEAD);
  const canEdit = hasPermission(PERMISSIONS.EDIT_LEAD);

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

  const findColumn = useCallback(
    (leadId) => {
      for (const [stageId, col] of Object.entries(columns)) {
        if (col.leads.some((l) => l.id === leadId)) return stageId;
      }
      return null;
    },
    [columns]
  );

  const handleLeadClick = useCallback((lead) => setSelectedLead(lead), []);

  const handleDragStart = ({ active }) => {
    const col = findColumn(active.id);
    if (!col) return;
    setActiveFrom(col);
    setActiveCard(columns[col]?.leads.find((l) => l.id === active.id));
    startAutoScroll();
  };

  const handleDragMove = useCallback(({ activatorEvent, delta }) => {
    const startX = activatorEvent?.clientX ?? activatorEvent?.touches?.[0]?.clientX ?? 0;
    const startY = activatorEvent?.clientY ?? activatorEvent?.touches?.[0]?.clientY ?? 0;
    dragPositionRef.current = { x: startX + (delta?.x ?? 0), y: startY + (delta?.y ?? 0) };
  }, []);

  const handleDragEnd = async ({ active, over }) => {
    stopAutoScroll();
    setActiveCard(null);
    setActiveFrom(null);
    if (!over || !canEdit) return;
    const toStageId = over.id in columns ? over.id : findColumn(over.id);
    if (!toStageId || String(activeFrom) === String(toStageId)) return;
    await moveCard(active.id, activeFrom, toStageId);
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
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
        <AlertCircle size={36} className="text-red-400" />
        <p className="font-medium">{error}</p>
        <button
          onClick={handleRefetch}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold"
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
    <div className="flex h-full overflow-hidden bg-slate-100">

      {/* ── Left filter sidebar ── */}
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

      {/* ── Right: header + board ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Page header ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            {/* Back */}
            <button
              onClick={() => navigate('/pipelines')}
              className="p-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-colors shrink-0"
            >
              <ArrowLeft size={15} />
            </button>

            {/* Mobile filter toggle — hidden on lg+ where sidebar is always visible */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className={`lg:hidden flex items-center gap-1.5 p-1.5 rounded-xl border transition-colors shrink-0 ${
                hasActiveFilters
                  ? 'border-primary/40 bg-primary/[0.02] text-primary'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
              aria-label="Open filters"
            >
              <SlidersHorizontal size={15} />
              {hasActiveFilters && (
                <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-primary text-white text-[9px] font-black leading-none">
                  {/* count */}
                </span>
              )}
            </button>

            {/* Title */}
            <div className="flex items-center gap-1.5 min-w-0">
              <Kanban size={17} className="text-primary shrink-0" />
              <h1 className="text-sm sm:text-base font-bold font-heading text-slate-900 truncate">
                {boardTitle}
              </h1>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleRefetch}
              disabled={isRefetching}
              className="p-1.5 rounded-xl border border-slate-300 text-slate-500 hover:bg-slate-100 hover:border-slate-400 transition-colors disabled:opacity-50"
              title="Refresh board"
            >
              <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
            </button>
            {canCreate && (
              <>
                <button
                  onClick={() => setShowImport(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 hover:border-slate-400 transition-colors"
                >
                  <Upload size={13} /> Import
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors"
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
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar"
            >
              <div className="flex gap-3 sm:gap-4 md:gap-5 p-3 sm:p-5 md:p-6 h-full items-stretch min-w-max">
                {loading && Object.keys(columns).length === 0 ? (
                  // Initial skeleton
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="w-[72vw] sm:w-[272px] md:w-72 flex-shrink-0">
                      <div className="h-5 bg-slate-300 rounded-lg animate-pulse mb-3 w-28" />
                      <div className="space-y-3">
                        {[...Array(2)].map((_, j) => (
                          <div key={j} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    </div>
                  ))
                ) : totalLeadsCount === 0 && !loading && !isRefetching ? (
                  // Empty states
                  hasActiveFilters ? (
                    <div className="flex flex-col items-center justify-center w-full py-20 text-center animate-in fade-in duration-300 min-w-[60vw]">
                      <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4 mx-auto shadow-sm border border-slate-200/50">
                        <AlertCircle size={24} />
                      </div>
                      <h2 className="text-sm font-bold text-slate-800 mb-1">No Matching Leads</h2>
                      <p className="text-xs text-slate-500 max-w-xs mb-5 mx-auto leading-relaxed">
                        No leads match your active filters. Try resetting or clearing some constraints.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md active:scale-95"
                      >
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full py-20 text-center animate-in fade-in duration-300 min-w-[60vw]">
                      <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 mx-auto shadow-sm">
                        <Kanban size={24} />
                      </div>
                      <h2 className="text-sm font-bold text-slate-800 mb-1">Your Pipeline is Empty</h2>
                      <p className="text-xs text-slate-500 max-w-xs mb-5 mx-auto leading-relaxed">
                        Get started by adding your first lead, or import records from Excel.
                      </p>
                      {canCreate && (
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => setShowImport(true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 bg-white transition-all shadow-sm"
                          >
                            <Upload size={13} /> Import Excel
                          </button>
                          <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary/90 transition-all active:scale-95"
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
                    />
                  ))
                )}
              </div>
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {activeCard ? (
                <div className="w-[72vw] sm:w-[272px] md:w-72 rotate-1 sm:rotate-2 shadow-2xl opacity-90">
                  <LeadCard lead={activeCard} onClick={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

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
    </div>
  );
};

export default LeadsKanbanPage;
