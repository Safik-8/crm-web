import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  useDroppable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { OpportunityCard } from './OpportunityCard';
import { Layers } from 'lucide-react';

const DEFAULT_STAGES = [
  { id: 1, name: 'Qualification', colorCode: '#6366f1', stageType: 'QUALIFICATION', code: 'QUALIFICATION' },
  { id: 2, name: 'Needs Analysis', colorCode: '#3b82f6', stageType: 'REGULAR', code: 'NEEDS_ANALYSIS' },
  { id: 3, name: 'Proposal', colorCode: '#8b5cf6', stageType: 'REGULAR', code: 'PROPOSAL' },
  { id: 4, name: 'Negotiation', colorCode: '#f59e0b', stageType: 'REGULAR', code: 'NEGOTIATION' },
  { id: 5, name: 'Final Review', colorCode: '#10b981', stageType: 'REGULAR', code: 'FINAL_REVIEW' },
  { id: 6, name: 'Won', colorCode: '#10b981', stageType: 'WON', code: 'WON' },
  { id: 7, name: 'Lost', colorCode: '#ef4444', stageType: 'LOST', code: 'LOST' },
  { id: 8, name: 'Cancelled', colorCode: '#6b7280', stageType: 'CANCELLED', code: 'CANCELLED' },
];

/**
 * Droppable Column Component
 */
const KanbanColumn = ({ stage, opportunities, onCardClick }) => {
  const droppableId = `stage-${stage.id}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { type: 'column', stageId: stage.id },
  });

  const cardSortableIds = useMemo(
    () => opportunities.map((opp) => `card-${opp.id}`),
    [opportunities]
  );

  const totalRevenue = useMemo(
    () => opportunities.reduce((sum, opp) => sum + Number(opp.expectedRevenue || 0), 0),
    [opportunities]
  );

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-[288px] rounded-lg bg-slate-50 border p-3.5 transition-all flex flex-col snap-start ${
        isOver ? 'border-orange-400 bg-orange-50/30 ring-1 ring-orange-200' : 'border-slate-200'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: stage.colorCode || '#6366f1' }}
          />
          <h3 className="font-semibold text-slate-800 text-sm">{stage.name}</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700">
            {opportunities.length}
          </span>
        </div>
      </div>

      {/* Column Total Value */}
      <div className="text-xs text-slate-500 mb-3 flex items-center justify-between">
        <span>Total Value:</span>
        <span className="font-semibold text-slate-900">
          ₹{totalRevenue.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Sortable Cards Context */}
      <SortableContext items={cardSortableIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 min-h-[350px] max-h-[calc(100vh-280px)] overflow-y-auto pr-1 space-y-2.5">
          {opportunities.length === 0 ? (
            <div className="h-32 border border-dashed border-slate-200 rounded-lg bg-white/50 flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
              <Layers className="w-5 h-5 text-slate-300" />
              <span>No opportunities</span>
            </div>
          ) : (
            opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} onClick={onCardClick} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

/**
 * Main OpportunityKanban component using @dnd-kit/core
 */
export const OpportunityKanban = ({
  opportunities = [],
  stages = DEFAULT_STAGES,
  onCardClick,
  onStageChange,
}) => {
  const [activeOpportunity, setActiveOpportunity] = useState(null);

  const scrollContainerRef = useRef(null);
  const dragPositionRef = useRef({ x: 0, y: 0 });
  const autoScrollRafRef = useRef(null);
  const currentSpeedXRef = useRef(0);
  const currentSpeedYRef = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const activeStages = stages.length > 0 ? stages : DEFAULT_STAGES;

  const startAutoScroll = useCallback(() => {
    const tick = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const { x, y } = dragPositionRef.current;

      const thresholdX = Math.min(65, Math.max(30, rect.width * 0.08));
      const thresholdY = Math.min(50, Math.max(25, rect.height * 0.10));

      const distLeft = x - rect.left;
      const distRight = rect.right - x;
      const distTop = y - rect.top;
      const distBottom = rect.bottom - y;

      let targetSpeedX = 0;
      let targetSpeedY = 0;

      // Horizontal speed calculation (gentle, controlled max 7px/frame)
      if (distLeft < thresholdX && container.scrollLeft > 0) {
        const intensity = Math.min(1, Math.max(0.1, (thresholdX - distLeft) / thresholdX));
        targetSpeedX = -Math.round(intensity * 7);
      } else if (distRight < thresholdX) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (container.scrollLeft < maxScroll) {
          const intensity = Math.min(1, Math.max(0.1, (thresholdX - distRight) / thresholdX));
          targetSpeedX = Math.round(intensity * 7);
        }
      }

      // Vertical speed calculation
      if (distTop < thresholdY && container.scrollTop > 0) {
        const intensity = Math.min(1, Math.max(0.1, (thresholdY - distTop) / thresholdY));
        targetSpeedY = -Math.round(intensity * 5);
      } else if (distBottom < thresholdY) {
        const maxScrollY = container.scrollHeight - container.clientHeight;
        if (container.scrollTop < maxScrollY) {
          const intensity = Math.min(1, Math.max(0.1, (thresholdY - distBottom) / thresholdY));
          targetSpeedY = Math.round(intensity * 5);
        }
      }

      // Physics LERP with higher damping (0.85 momentum retention) for gentle acceleration
      currentSpeedXRef.current = currentSpeedXRef.current * 0.85 + targetSpeedX * 0.15;
      currentSpeedYRef.current = currentSpeedYRef.current * 0.85 + targetSpeedY * 0.15;
      currentSpeedYRef.current = currentSpeedYRef.current * 0.72 + targetSpeedY * 0.28;

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

  const updatePointerPos = useCallback((e) => {
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? e.changedTouches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? e.changedTouches?.[0]?.clientY;
    if (clientX !== undefined && clientY !== undefined) {
      dragPositionRef.current = { x: clientX, y: clientY };
    }
  }, []);

  const collisionDetectionStrategy = (args) => {
    const pointerHits = pointerWithin(args);
    if (pointerHits.length > 0) return pointerHits;
    return closestCenter(args);
  };

  const handleDragStart = (event) => {
    window.addEventListener('pointermove', updatePointerPos, { passive: true });
    window.addEventListener('touchmove', updatePointerPos, { passive: true });

    const { active, activatorEvent } = event;
    const initialX = activatorEvent?.clientX ?? activatorEvent?.nativeEvent?.clientX ?? activatorEvent?.touches?.[0]?.clientX ?? 0;
    const initialY = activatorEvent?.clientY ?? activatorEvent?.nativeEvent?.clientY ?? activatorEvent?.touches?.[0]?.clientY ?? 0;
    dragPositionRef.current = { x: initialX, y: initialY };

    const activeData = active.data.current;
    if (activeData?.type === 'card' && activeData?.opportunity) {
      setActiveOpportunity(activeData.opportunity);
    }
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

  const handleDragEnd = (event) => {
    window.removeEventListener('pointermove', updatePointerPos);
    window.removeEventListener('touchmove', updatePointerPos);
    stopAutoScroll();

    const { active, over } = event;
    const draggedOpp = activeOpportunity || active?.data?.current?.opportunity;
    setActiveOpportunity(null);

    if (!over || !draggedOpp) return;

    // Resolve target stageId robustly (matching LeadsKanbanPage pattern)
    const overData = over.data?.current;
    let targetStageId = overData?.stageId;

    if (!targetStageId && over.id) {
      const strId = String(over.id);
      if (strId.startsWith('stage-')) {
        targetStageId = Number(strId.replace('stage-', ''));
      } else if (strId.startsWith('card-')) {
        const cardId = Number(strId.replace('card-', ''));
        const targetOpp = opportunities.find((o) => Number(o.id) === cardId);
        targetStageId = targetOpp?.stageId || targetOpp?.stage?.id;
      } else {
        const parsed = Number(strId);
        if (!isNaN(parsed)) targetStageId = parsed;
      }
    }

    if (!targetStageId) return;

    if (Number(draggedOpp.stageId) !== Number(targetStageId)) {
      onStageChange && onStageChange(draggedOpp.id, targetStageId);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x">
        {activeStages.map((stage) => {
          const stageOpportunities = opportunities.filter((opp) => {
            // 1. Primary match: numeric stageId
            if (Number(opp.stageId) === Number(stage.id) || Number(opp.stage?.id) === Number(stage.id)) {
              return true;
            }

            // 2. For terminal stages (WON / LOST / CANCELLED), also match by opp.status
            //    This catches cases where stageId hasn't been resolved yet (e.g. button-triggered close)
            const stageTypeUpper = (stage.stageType || stage.code || '').toUpperCase();
            const stageName = (stage.name || '').toLowerCase().trim();
            if (
              (stageTypeUpper === 'WON' || stageName === 'won') &&
              opp.status === 'WON'
            ) return true;
            if (
              (stageTypeUpper === 'LOST' || stageName === 'lost') &&
              opp.status === 'LOST'
            ) return true;
            if (
              (stageTypeUpper === 'CANCELLED' || stageName === 'cancelled') &&
              opp.status === 'CANCELLED'
            ) return true;

            // 3. Name / code exact match
            const oppName = (opp.stage?.name || opp.stageName || '').toLowerCase().trim();
            const colName = stageName;
            const oppCode = (opp.stage?.code || '').toLowerCase().trim();
            const colCode = (stage.code || '').toLowerCase().trim();

            if (oppName === colName || (oppCode && colCode && oppCode === colCode)) {
              return true;
            }

            return false;
          });

          return (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              opportunities={stageOpportunities}
              onCardClick={onCardClick}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeOpportunity ? (
          <OpportunityCard opportunity={activeOpportunity} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
