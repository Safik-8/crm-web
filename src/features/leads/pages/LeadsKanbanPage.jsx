import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Plus, ArrowLeft, RefreshCw, AlertCircle, Kanban } from 'lucide-react';
import { useKanban } from '../hooks/useKanban';
import { useAuth } from '../../../app/providers/AuthProvider';
import { PERMISSIONS } from '../../../lib/constants/permissions';
import KanbanColumn from '../components/KanbanColumn';
import LeadCard from '../components/LeadCard';
import LeadFormModal from '../components/LeadFormModal';
import LeadDetailDrawer from '../components/LeadDetailDrawer';

const LeadsKanbanPage = () => {
  const { id: pipelineId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { columns, orderedStages, loading, error, moveCard, addLeadToColumn, refetch } = useKanban(pipelineId);

  const [activeCard, setActiveCard] = useState(null);   // card being dragged (for DragOverlay)
  const [activeFrom, setActiveFrom]   = useState(null);  // source stage id
  const [showForm, setShowForm]       = useState(false);
  const [selectedLead, setSelectedLead] = useState(null); // for detail drawer

  const canCreate = hasPermission(PERMISSIONS.CREATE_LEAD);
  const canEdit   = hasPermission(PERMISSIONS.EDIT_LEAD);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Find which column a lead sits in
  const findColumn = (leadId) => {
    for (const [stageId, col] of Object.entries(columns)) {
      if (col.leads.some(l => l.id === leadId)) return stageId;
    }
    return null;
  };

  const handleDragStart = ({ active }) => {
    const col = findColumn(active.id);
    if (!col) return;
    setActiveFrom(col);
    setActiveCard(columns[col]?.leads.find(l => l.id === active.id));
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveCard(null);
    setActiveFrom(null);
    if (!over || !canEdit) return;
    const toStageId = over.id in columns ? over.id : findColumn(over.id);
    if (!toStageId || String(activeFrom) === String(toStageId)) return;
    await moveCard(active.id, activeFrom, toStageId);
  };

  // Find stage name for the drawer
  const stageForLead = (lead) => {
    for (const col of Object.values(columns)) {
      if (col.leads.some(l => l.id === lead?.id)) return col.stage?.name;
    }
    return null;
  };

  // Called when a new lead is created — place it in the Prospect column
  const handleLeadCreated = (lead) => {
    if (!lead) { refetch(); return; }
    const prospectStage = orderedStages.find(s => s.isDefault);
    if (prospectStage) addLeadToColumn(prospectStage.id, lead);
    else refetch();
  };

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
    <div className="flex flex-col h-full -m-6 md:-m-8">
      {/* Page header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 md:px-8 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pipelines')}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <Kanban size={20} className="text-primary" />
            <h1 className="text-lg font-bold font-heading text-slate-900">Pipeline Board</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors" title="Refresh">
            <RefreshCw size={15} />
          </button>
          {canCreate && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
              <Plus size={15} /> Add Lead
            </button>
          )}
        </div>
      </div>

      {/* Kanban board — horizontal scroll */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-5 p-6 md:p-8 h-full items-start">
            {loading
              ? [...Array(3)].map((_, i) => (
                  <div key={i} className="w-72 flex-shrink-0">
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
                    onLeadClick={setSelectedLead}
                  />
                ))
            }
          </div>

          {/* Drag overlay — card ghost while dragging */}
          <DragOverlay>
            {activeCard ? (
              <div className="w-72 rotate-2 shadow-2xl">
                <LeadCard lead={activeCard} onClick={() => {}} />
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
