import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Kanban, Settings2, Trash2, Pencil, GitBranch, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { usePipelines } from '../hooks/usePipelines';
import { useAuth } from '../../../app/providers/AuthProvider';
import { PERMISSIONS } from '../../../lib/constants/permissions';

// ----- Create / Edit Modal -----
const PipelineModal = ({ onClose, onSubmit, initial }) => {
  const [name, setName] = useState(initial?.name || '');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Pipeline name is required'); return; }
    setBusy(true);
    await onSubmit(name.trim());
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-300">
        <h2 className="text-xl font-bold font-heading text-slate-900 mb-6">
          {initial ? 'Rename Pipeline' : 'New Pipeline'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pipeline Name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Admissions 2026"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20">
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              {initial ? 'Save Changes' : 'Create Pipeline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----- Main Page -----
const PipelinesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { pipelines, loading, error, addPipeline, editPipeline, removePipeline } = usePipelines();

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const canManage = hasPermission(PERMISSIONS.MANAGE_PIPELINES);

  const handleCreate = async (name) => {
    const res = await addPipeline({ name });
    if (res.success) {
      setShowModal(false);
      // Go directly to stage builder for the new pipeline
      if (res.pipeline?.id) navigate(`/pipelines/${res.pipeline.id}/stages`);
    }
  };

  const handleEdit = async (name) => {
    await editPipeline(editTarget.id, { name });
    setEditTarget(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this pipeline? This cannot be undone.')) return;
    setDeletingId(id);
    await removePipeline(id);
    setDeletingId(null);
  };

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
      <AlertCircle size={36} className="text-red-400" />
      <p className="font-medium">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <GitBranch className="text-primary" size={24} />
            Pipelines
          </h1>
          <p className="text-sm text-slate-500 mt-1">Build your sales flow. Track every lead.</p>
        </div>
        {canManage && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
            <Plus size={18} /> New Pipeline
          </button>
        )}
      </div>

      {/* Empty state */}
      {pipelines.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
          <Kanban size={48} className="text-slate-300" />
          <p className="font-semibold text-slate-500 text-lg">No pipelines yet</p>
          {canManage && (
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90">
              <Plus size={16} /> Create your first pipeline
            </button>
          )}
        </div>
      )}

      {/* Pipeline cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {pipelines.map(pipeline => (
          <div key={pipeline.id}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group p-5 flex flex-col gap-4">
            {/* Card top */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GitBranch size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold font-heading text-slate-900 leading-tight">{pipeline.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {pipeline.stages.length ?? pipeline._count?.stages ?? '–'} stages &middot; {pipeline.leadCount ?? pipeline._count?.leads ?? '0'} leads
                  </p>
                </div>
              </div>
              {/* Actions */}
              {canManage && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditTarget(pipeline)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(pipeline.id)} disabled={deletingId === pipeline.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    {deletingId === pipeline.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              )}
            </div>

            {/* Card actions */}
            <div className="flex gap-2 pt-1 border-t border-slate-50">
              <button onClick={() => navigate(`/pipelines/${pipeline.id}/board`)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow shadow-primary/20">
                <Kanban size={14} /> Open Board
              </button>
              {canManage && (
                <button onClick={() => navigate(`/pipelines/${pipeline.id}/stages`)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition-colors">
                  <Settings2 size={14} /> Stages
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showModal && <PipelineModal onClose={() => setShowModal(false)} onSubmit={handleCreate} />}
      {editTarget && <PipelineModal initial={editTarget} onClose={() => setEditTarget(null)} onSubmit={handleEdit} />}
    </div>
  );
};

export default PipelinesPage;
