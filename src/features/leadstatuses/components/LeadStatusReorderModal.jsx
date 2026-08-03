// src/features/leadstatuses/components/LeadStatusReorderModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { X, GripVertical, Lock, Check, Tags } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button from '../../../shared/components/elements/Button';
import { useReorderLeadStatusesMutation } from '../hooks/useLeadStatuses';

// ── SORTABLE ROW COMPONENT ──────────────────────────────────────────────────
const SortableStatusRow = ({ status, isSuperAdmin }) => {
  const isGlobal = status.companyId === null;
  const isDragDisabled = isGlobal && !isSuperAdmin;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id, disabled: isDragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl mb-2
                  ${isDragging ? 'shadow-lg border-primary/30' : 'hover:border-slate-300'}`}
    >
      {isDragDisabled ? (
        <div className="p-1 text-slate-300 opacity-60" title="System statuses have fixed positions">
          <Lock size={14} className="stroke-[2.5px]" />
        </div>
      ) : (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 rounded"
        >
          <GripVertical size={16} />
        </div>
      )}

      <div
        className="h-5 w-5 rounded-full border border-slate-200 shadow-sm flex-shrink-0"
        style={{ background: status.displayColor }}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{status.name}</p>
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{status.code}</p>
      </div>

      <div className="flex items-center gap-2">
        {status.isSystem && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Lock size={10} />
            System
          </span>
        )}
        {status.isDefault && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Check size={10} />
            Default
          </span>
        )}
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${status.isActive
              ? 'bg-blue-50 text-blue-700 border border-blue-100'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
        >
          {status.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
};

// ── MAIN MODAL COMPONENT ────────────────────────────────────────────────────
export const LeadStatusReorderModal = ({ isOpen, onClose, statuses = [], isSuperAdmin = false }) => {
  const reorderMutation = useReorderLeadStatusesMutation();
  const [localOrder, setLocalOrder] = useState([]);

  // Initialize local order when modal opens or statuses change
  useEffect(() => {
    if (isOpen && statuses.length > 0) {
      const sorted = [...statuses].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
      setLocalOrder(sorted);
    }
  }, [isOpen, statuses]);

  // Configure sensors for smooth drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalOrder((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);

      // Re-assign sequenceOrder values sequentially (1-indexed)
      return reordered.map((item, index) => ({
        ...item,
        sequenceOrder: index + 1,
      }));
    });
  };

  const handleSave = async () => {
    try {
      const payload = localOrder.map(({ id, sequenceOrder }) => ({
        id,
        sequenceOrder,
      }));
      await reorderMutation.mutateAsync(payload);
      onClose();
    } catch (error) {
      // toast is triggered inside the hook
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: '24px',
          padding: '8px',
        },
      }}
    >
      <DialogTitle className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Tags className="text-primary" size={20} />
          <div>
            <h2 className="text-base font-bold text-slate-800 font-heading">Reorder Lead Statuses</h2>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">Drag rows to adjust lead pipeline sequence</p>
          </div>
        </div>
        <IconButton onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-all">
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent className="py-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localOrder.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="max-h-[360px] overflow-y-auto pr-1">
              {localOrder.map((status) => (
                <SortableStatusRow key={status.id} status={status} isSuperAdmin={isSuperAdmin} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </DialogContent>

      <DialogActions className="border-t border-slate-100 pt-4 px-4 flex items-center justify-end gap-2">
        <Button
          onClick={onClose}
          variant="outlined"
          color="secondary"
          className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-500 border-slate-200 hover:bg-slate-50"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          isLoading={reorderMutation.isPending}
          className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
        >
          Save Order
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadStatusReorderModal;
