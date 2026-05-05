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
import { Plus, ArrowLeft, RefreshCw, AlertCircle, Kanban } from 'lucide-react';
import { useKanban } from '../hooks/useKanban';
import { useAuth } from '../../../app/providers/AuthProvider';
import { PERMISSIONS } from '../../../lib/constants/permissions';
import { useLoader } from '../../../shared/context/LoaderContext';
import KanbanColumn from '../components/KanbanColumn';
import LeadCard from '../components/LeadCard';
import LeadFormModal from '../components/LeadFormModal';
import LeadDetailDrawer from '../components/LeadDetailDrawer';

const LeadsKanbanPage = () => {
  const { id: pipelineId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { forceHideLoader } = useLoader();
  const { columns, orderedStages, loading, error, moveCard, addLeadToColumn, refetch } = useKanban(pipelineId);
  const didHideInitialRouteLoaderRef = useRef(false);

  const [activeCard, setActiveCard] = useState(null);   // card being dragged (for DragOverlay)
  const [activeFrom, setActiveFrom] = useState(null);  // source stage id
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null); // for detail drawer

  const canCreate = hasPermission(PERMISSIONS.CREATE_LEAD);
  const canEdit = hasPermission(PERMISSIONS.EDIT_LEAD);

  const scrollContainerRef = useRef(null);
  // Track live pointer/touch position for auto-scroll during drag
  const dragPositionRef = useRef({ x: 0, y: 0 });
  const autoScrollRafRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  );

  // Continuous auto-scroll loop — runs via rAF while a drag is active
  const startAutoScroll = useCallback(() => {
    const tick = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const { x, y } = dragPositionRef.current;
      const edgeH = 80; // horizontal edge threshold (px)
      const edgeV = 60; // vertical edge threshold (px)
      const speedH = 12;
      const speedV = 10;

      // Horizontal scroll
      const relX = x - rect.left;
      if (relX < edgeH && container.scrollLeft > 0) {
        container.scrollLeft -= speedH;
      } else if (relX > rect.width - edgeH) {
        container.scrollLeft += speedH;
      }

      // Vertical scroll (for the window, since the board is full-height)
      const relY = y - rect.top;
      if (relY < edgeV && container.scrollTop > 0) {
        container.scrollTop -= speedV;
      } else if (relY > rect.height - edgeV) {
        container.scrollTop += speedV;
      }

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

  // Find which column a lead sits in — memoised to avoid re-creation every render
  const findColumn = useCallback((leadId) => {
    for (const [stageId, col] of Object.entries(columns)) {
      if (col.leads.some(l => l.id === leadId)) return stageId;
    }
    return null;
  }, [columns]);

  // Stable set-lead callback so KanbanColumn doesn't re-render on unrelated state changes
  const handleLeadClick = useCallback((lead) => setSelectedLead(lead), []);

  const handleDragStart = ({ active }) => {
    const col = findColumn(active.id);
    if (!col) return;
    setActiveFrom(col);
    setActiveCard(columns[col]?.leads.find(l => l.id === active.id));
    startAutoScroll();
  };

  // Track live pointer/touch position for auto-scroll
  const handleDragMove = useCallback(({ activatorEvent, delta }) => {
    // activatorEvent is the original start event; add delta to get current position
    const startX = activatorEvent?.clientX ?? activatorEvent?.touches?.[0]?.clientX ?? 0;
    const startY = activatorEvent?.clientY ?? activatorEvent?.touches?.[0]?.clientY ?? 0;
    dragPositionRef.current = {
      x: startX + (delta?.x ?? 0),
      y: startY + (delta?.y ?? 0),
    };
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

  // Find stage name for the drawer — memoised
  const stageForLead = useCallback((lead) => {
    for (const col of Object.values(columns)) {
      if (col.leads.some(l => l.id === lead?.id)) return col.stage?.name;
    }
    return null;
  }, [columns]);

  // Called when a new lead is created — place it in the Prospect column
  const handleLeadCreated = (lead) => {
    if (!lead) { refetch(); return; }
    const prospectStage = orderedStages.find(s => s.isDefault);
    if (prospectStage) addLeadToColumn(prospectStage.id, lead);
    else refetch();
  };

  // End route-level global loader once initial board data resolves.
  useEffect(() => {
    if (
      !didHideInitialRouteLoaderRef.current &&
      Object.keys(columns).length > 0
    ) {
      forceHideLoader();
      didHideInitialRouteLoaderRef.current = true;
    }
  }, [columns, forceHideLoader]);

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
      <AlertCircle size={36} className="text-red-400" />
      <p className="font-medium">{error}</p>
      <button onClick={refetch} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold">
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );

  const pipelineName = orderedStages[0] ? undefined : undefined; // derived from backend for now

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button onClick={() => navigate('/pipelines')}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors shrink-0">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Kanban size={18} className="text-primary shrink-0" />
            <h1 className="text-base sm:text-lg font-bold font-heading text-slate-900 truncate">Pipeline Board</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button onClick={refetch} className="p-1.5 sm:p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors" title="Refresh">
            <RefreshCw size={15} />
          </button>
          {canCreate && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
              <Plus size={15} /> <span className="hidden sm:inline">Add Lead</span><span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Kanban board — horizontal scroll */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          <div ref={scrollContainerRef} className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
            <div className="flex gap-3 sm:gap-4 md:gap-5 p-3 sm:p-6 md:p-8 h-full items-stretch min-w-max">
              {loading
                ? [...Array(3)].map((_, i) => (
                  <div key={i} className="w-[72vw] sm:w-[272px] md:w-72 flex-shrink-0">
                    <div className="h-6 bg-slate-100 rounded-lg animate-pulse mb-3 w-32" />
                    <div className="space-y-3">
                      {[...Array(2)].map((_, j) => (
                        <div key={j} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))
                : orderedStages.map(stage => (
                  <KanbanColumn
                    key={stage.id}
                    stage={stage}
                    leads={columns[stage.id]?.leads || []}
                    loading={loading}
                    onLeadClick={handleLeadClick}
                  />
                ))
              }
            </div>
          </div>
          {/* Drag overlay — card ghost while dragging */}
          <DragOverlay>
            {activeCard ? (
              <div className="w-[72vw] sm:w-[272px] md:w-72 rotate-1 sm:rotate-2 shadow-2xl opacity-90">
                <LeadCard lead={activeCard} onClick={() => { }} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Lead Create Modal */}
      {showForm && (
        <LeadFormModal
          pipelineId={Number(pipelineId)}
          onClose={() => setShowForm(false)}
          onCreated={handleLeadCreated}
        />
      )}

      {/* Lead Detail Drawer */}
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
