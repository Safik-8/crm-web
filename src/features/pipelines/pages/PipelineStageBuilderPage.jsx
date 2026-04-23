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
import { ArrowLeft, Check, Plus, Loader2, AlertCircle, ListChecks, Search } from 'lucide-react';

const PipelineStageBuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pipeline, setPipeline] = useState(null);
  const [masterStages, setMasterStages] = useState([]);  // all global stages from backend
  const [selectedStages, setSelectedStages] = useState([]); // ordered selected stages
  const [newStageName, setNewStageName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleAddNewStage = async (overrideName) => {
    const name = (overrideName || newStageName || (searchTerm.length > 0 ? searchTerm : '')).trim();
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
    toast.info('Saving stage configuration...');
    
    try {
      const stageIds = selectedStages.map(s => s.id);
      
      console.log('Saving stages for pipeline:', id, 'IDs:', stageIds);

      // Submit the full list of IDs and their current order
      await assignPipelineStages(id, {
        stageIds,
        newStages: [], 
        orderedStageIds: stageIds,
      });

      toast.success('Stages saved successfully!');
      setTimeout(() => navigate(`/pipelines/${id}/board`), 800);
    } catch (err) {
      console.error('Failed to save stages:', err);
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

  // Filter and sort: Default first, then selected, then alphabetical
  const allFiltered = masterStages
    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      const aSelected = selectedIds.has(a.id);
      const bSelected = selectedIds.has(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return a.name.localeCompare(b.name);
    });

  // truncation logic: show all selected + limited unselected if no search
  const isTruncated = !searchTerm && allFiltered.length > 25;
  const displayStages = isTruncated
    ? [
      ...allFiltered.filter(s => selectedIds.has(s.id)),
      ...allFiltered.filter(s => !selectedIds.has(s.id)).slice(0, 15)
    ]
    : allFiltered;

  const totalUnselected = masterStages.length - selectedIds.size;

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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden h-[480px]">
          {/* List Header */}
          <div className="p-5 border-b border-slate-50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Available Stages</h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-lg">
                  {selectedIds.size - 1} Selected
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-50 text-slate-400 rounded-lg">
                  {masterStages.length} Total
                </span>
              </div>
            </div>

            {/* Premium Input Section */}
            <div className="space-y-2">
              <div className="flex gap-2 group">
                <div className="flex-1 relative">
                  <Plus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <input
                    value={newStageName}
                    onChange={e => setNewStageName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddNewStage()}
                    placeholder="Quick add stage..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50/50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                  />
                </div>
                <button type="button" onClick={handleAddNewStage}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-black transition-all shadow-md active:scale-95 font-bold text-xs uppercase tracking-wider">
                  Add
                </button>
              </div>

              <div className="relative group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filter by name..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-100 rounded-xl outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all text-slate-600 font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 hover:text-primary uppercase tracking-widest"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {displayStages.length > 0 ? (
              displayStages.map(stage => {
                const checked = selectedIds.has(stage.id);
                return (
                  <button key={stage.id} type="button" onClick={() => toggleStage(stage)}
                    className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border ${checked
                        ? 'bg-white border-slate-100 border-l-[4px] border-l-primary shadow-sm shadow-primary/5'
                        : 'border-slate-50 bg-white text-slate-400 hover:border-slate-200 hover:shadow-md'
                      }`}
                  >
                    <div className={`h-4 w-4 rounded-md flex items-center justify-center border-2 transition-all flex-shrink-0 ${checked
                        ? 'border-primary bg-primary'
                        : 'border-slate-100 bg-slate-50/50'
                      }`}>
                      {checked && <Check size={11} className="text-white" strokeWidth={5} />}
                    </div>
                    <span className={`truncate font-bold tracking-tight ${checked ? "text-primary" : "text-slate-600 group-hover:text-slate-900"}`}>{stage.name}</span>
                    {stage.isDefault && <span className="ml-auto text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md">Required</span>}
                    {!checked && <Plus size={14} className="ml-auto opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />}
                  </button>
                );
              })
            ) : (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm text-slate-400">No stages found</p>
                {searchTerm && (
                  <button onClick={() => handleAddNewStage()} className="text-xs font-bold text-primary hover:underline">
                    Create "{searchTerm}" as a new stage?
                  </button>
                )}
              </div>
            )}

            {isTruncated && displayStages.length < allFiltered.length && (
              <div className="py-4 text-center">
                <p className="text-[11px] font-medium text-slate-400 italic">
                  Showing top {displayStages.length} of {allFiltered.length} stages.
                  <br />Search to find more.
                </p>
              </div>
            )}
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
