import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { getPipelineById, assignPipelineStages } from '../services/pipelineService';
import { getAllStages, createStage } from '../services/stageService';
import { toast } from 'sonner';
import SortableStageRow from '../components/SortableStageRow';
import { ArrowLeft, Check, Plus, Loader2, AlertCircle, ListChecks } from 'lucide-react';

const PipelineStageBuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pipeline, setPipeline] = useState(null);
  const [masterStages, setMasterStages] = useState([]);  // all global stages from backend
  const [selectedStages, setSelectedStages] = useState([]); // ordered selected stages
  const [newStageName, setNewStageName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [pRes, sRes] = await Promise.all([
          getPipelineById(id),
          getAllStages(),
        ]);
        const p = pRes?.data?.pipeline;
        // Defensive parse — backend may return data as array OR { stages: [] }
        const rawStages = sRes?.data;
        const all = Array.isArray(rawStages)
          ? rawStages
          : Array.isArray(rawStages?.stages)
          ? rawStages.stages
          : [];
        setPipeline(p);
        setMasterStages(all);

        // Pre-populate with already-assigned stages (ordered) or just Prospect
        const alreadyAssigned = p?.stages?.length > 0
          ? p.stages.slice().sort((a, b) => (a.orderNo ?? a.order_no ?? 0) - (b.orderNo ?? b.order_no ?? 0))
          : all.filter(s => s.isDefault); // just Prospect
        setSelectedStages(alreadyAssigned);
      } catch (err) {
        toast.error('Failed to load pipeline');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setSelectedStages(prev => {
      const oldIndex = prev.findIndex(s => s.id === active.id);
      const newIndex = prev.findIndex(s => s.id === over.id);
      // Prevent moving Prospect away from index 0
      if (newIndex === 0 && !prev[oldIndex].isDefault) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const toggleStage = (stage) => {
    if (stage.isDefault) return; // Prospect is always selected
    const isSelected = selectedStages.some(s => s.id === stage.id);
    if (isSelected) {
      setSelectedStages(prev => prev.filter(s => s.id !== stage.id));
    } else {
      setSelectedStages(prev => [...prev, stage]);
    }
  };

  const handleAddNewStage = async () => {
    const name = newStageName.trim();
    if (!name) return;
    if (selectedStages.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error('A stage with this name already exists in your selection');
      return;
    }

    try {
      const res = await createStage({ name });
      const newStage = res?.data?.stage || res?.data; 
      if (!newStage || !newStage.id) throw new Error('Invalid stage data returned');

      setMasterStages(prev => [...prev, newStage]);
      setSelectedStages(prev => [...prev, newStage]);
      setNewStageName('');
      toast.success(`Stage "${name}" created and added`);
    } catch (err) {
      toast.error(err?.message || 'Failed to create stage');
    }
  };

  const handleSave = async () => {
    if (selectedStages.length === 0) {
      toast.error('Please select at least one stage');
      return;
    }
    setSaving(true);
    try {
      const stageIds = selectedStages.map(s => s.id);
      
      // Submit the full list of IDs and their current order
      await assignPipelineStages(id, {
        stageIds,
        newStages: [], // No longer needed as we create them immediately
        orderedStageIds: stageIds,
      });

      toast.success('Stages saved! Opening board...');
      setTimeout(() => navigate(`/pipelines/${id}/board`), 800);
    } catch (err) {
      toast.error(err?.message || 'Failed to save stages');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}
    </div>
  );

  if (!pipeline) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
      <AlertCircle size={36} className="text-red-400" />
      <p>Pipeline not found</p>
    </div>
  );

  const selectedIds = new Set(selectedStages.map(s => s.id));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/pipelines')}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <ListChecks size={20} className="text-primary" />
            Configure Stages
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            <span className="font-semibold text-slate-700">{pipeline.name}</span> &mdash; select and order stages
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: Master stage selector */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Available Stages</h3>
          <div className="space-y-2">
            {masterStages.map(stage => {
              const checked = selectedIds.has(stage.id);
              return (
                <button key={stage.id} type="button" onClick={() => toggleStage(stage)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    checked
                      ? stage.isDefault
                        ? 'bg-primary/5 border-primary/30 text-primary'
                        : 'bg-slate-900 border-slate-900 text-white'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className={`h-4 w-4 rounded flex items-center justify-center border flex-shrink-0 ${
                    checked ? (stage.isDefault ? 'border-primary bg-primary' : 'border-slate-900 bg-slate-900') : 'border-slate-300 bg-white'
                  }`}>
                    {checked && <Check size={10} className="text-white" strokeWidth={3} />}
                  </span>
                  {stage.name}
                  {stage.isDefault && <span className="ml-auto text-[10px] font-bold text-primary">Required</span>}
                </button>
              );
            })}
          </div>

          {/* Create new stage */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2">+ Create new stage</p>
            <div className="flex gap-2">
              <input
                value={newStageName}
                onChange={e => setNewStageName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNewStage()}
                placeholder="Stage name..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <button type="button" onClick={handleAddNewStage}
                className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-700 transition-colors">
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Ordered selected stages (DND) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Stage Order</h3>
          <p className="text-xs text-slate-400">Drag to reorder. Prospect is always first.</p>

          {selectedStages.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No stages selected yet</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={selectedStages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {selectedStages.map(stage => (
                    <SortableStageRow
                      key={stage.id}
                      stage={stage}
                      onRemove={(stageId) => setSelectedStages(prev => prev.filter(s => s.id !== stageId))}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3">
        <button onClick={() => navigate('/pipelines')}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving || selectedStages.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Save & Open Board
        </button>
      </div>
    </div>
  );
};

export default PipelineStageBuilderPage;
