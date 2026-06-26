import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Kanban, Settings2, Trash2, Pencil, GitBranch, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { usePipelines } from '../hooks/usePipelines';
import { useAuth } from '../../../app/providers/AuthProvider';
import { PERMISSIONS } from '../../../lib/constants/permissions';
import { useLoader } from '../../../shared/context/LoaderContext';
import { companyApi } from '../../company/api/companyApi';
import { branchApi } from '../../branch/api/branchApi';
import { SearchableSelect } from '../../../shared/components/elements/SearchableSelect';
import { FormControl, FormHelperText, Typography } from '@mui/material';
import DynamicFormModal from '../../../shared/components/elements/DynamicFormModal';

// ----- Create / Edit Modal -----
const PipelineModal = ({ onClose, onSubmit, initial }) => {
  const { user } = useAuth();
  
  const inherentCompanyId = user?.company?.id || user?.companyId;
  const inherentBranchId = user?.branch?.id || user?.branchId;

  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(inherentCompanyId || '');

  // Fetch companies for super admins
  useEffect(() => {
    if (!initial && !inherentCompanyId) {
      companyApi.getCompanies().then(res => {
        const data = res?.data?.companies || res?.data || [];
        setCompanies(Array.isArray(data) ? data : []);
      }).catch(console.error);
    }
  }, [initial, inherentCompanyId]);

  // Fetch branches once we have a companyId to fetch for
  useEffect(() => {
    if (!initial && !inherentBranchId && selectedCompanyId) {
      branchApi.getBranches(selectedCompanyId).then(res => {
        const data = res?.data?.branches || res?.data || [];
        setBranches(Array.isArray(data) ? data : []);
      }).catch(console.error);
    } else if (!selectedCompanyId) {
      setBranches([]);
    }
  }, [initial, inherentBranchId, selectedCompanyId]);

  const handleSubmit = async (values) => {
    if (!initial) {
      if (!inherentCompanyId && !values.companyId) { toast.error('Please select a company'); return; }
      if (!inherentBranchId && !values.branchId) { toast.error('Please select a branch'); return; }
    }
    await onSubmit({
      name: values.name.trim(),
      companyId: values.companyId || inherentCompanyId,
      branchId: values.branchId || inherentBranchId
    });
  };

  const fields = [
    { key: 'name', label: 'Pipeline Name', type: 'text', placeholder: 'e.g. Admissions 2026', required: true }
  ];

  if (!initial && !inherentCompanyId) {
    fields.push({
      key: 'companyId',
      label: 'Target Company',
      required: true,
      render: (value, onChange, formValues, errorText) => (
        <FormControl fullWidth error={!!errorText} size="small" variant="outlined" sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ mb: 1, fontWeight: 700, display: 'block', color: 'text.secondary', textTransform: 'uppercase' }}>
            Target Company *
          </Typography>
          <SearchableSelect
            options={companies}
            value={value}
            onChange={(id) => {
              onChange('companyId', id);
              onChange('branchId', '');
              setSelectedCompanyId(id);
            }}
            placeholder="Select Company..."
          />
          {errorText && <FormHelperText>{errorText}</FormHelperText>}
        </FormControl>
      )
    });
  }

  if (!initial && !inherentBranchId) {
    fields.push({
      key: 'branchId',
      label: 'Target Branch',
      required: true,
      render: (value, onChange, formValues, errorText) => (
        <FormControl fullWidth error={!!errorText} size="small" variant="outlined" sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ mb: 1, fontWeight: 700, display: 'block', color: 'text.secondary', textTransform: 'uppercase' }}>
            Target Branch *
          </Typography>
          <SearchableSelect
            options={branches}
            value={value}
            onChange={(id) => onChange('branchId', id)}
            placeholder="Select Branch..."
            disabled={!formValues.companyId}
          />
          {errorText && <FormHelperText>{errorText}</FormHelperText>}
        </FormControl>
      )
    });
  }

  return (
    <DynamicFormModal
      isOpen={true}
      onClose={onClose}
      title={initial ? 'Rename Pipeline' : 'New Pipeline'}
      fields={fields}
      initialValues={{
        name: initial?.name || '',
        companyId: inherentCompanyId || '',
        branchId: inherentBranchId || ''
      }}
      onSubmit={handleSubmit}
      submitText={initial ? 'Save Changes' : 'Create Pipeline'}
    />
  );
};

// ----- Main Page -----
const PipelinesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { forceHideLoader } = useLoader();
  const { pipelines, loading, error, addPipeline, editPipeline, removePipeline } = usePipelines();
  const didHideInitialRouteLoaderRef = useRef(false);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const canCreate = hasPermission(PERMISSIONS.CREATE_PIPELINE);
  const canEdit = hasPermission(PERMISSIONS.MANAGE_PIPELINES);
  const canDelete = hasPermission(PERMISSIONS.DELETE_PIPELINE);
  const canManageStages = hasPermission(PERMISSIONS.MANAGE_STAGES);

  useEffect(() => {
    const hasRenderableData = pipelines.length > 0;
    const hasRenderableEmptyOrErrorState = !loading && (pipelines.length === 0 || Boolean(error));
    if (
      !didHideInitialRouteLoaderRef.current &&
      (hasRenderableData || hasRenderableEmptyOrErrorState)
    ) {
      forceHideLoader();
      didHideInitialRouteLoaderRef.current = true;
    }
  }, [pipelines, loading, error, forceHideLoader]);

  const handleCreate = async (data) => {
    const res = await addPipeline(data);
    if (res.success) {
      setShowModal(false);
      // Go directly to stage builder for the new pipeline
      if (res.pipeline?.id) navigate(`/pipelines/${res.pipeline.id}/stages`);
    }
  };

  const handleEdit = async (data) => {
    await editPipeline(editTarget.id, { name: data.name });
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
        {canCreate && (
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
          {canCreate && (
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
              {(canCreate || canDelete) && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canCreate && (
                    <button onClick={() => setEditTarget(pipeline)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors">
                      <Pencil size={15} />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(pipeline.id)} disabled={deletingId === pipeline.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      {deletingId === pipeline.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Card actions */}
            <div className="flex gap-2 pt-1 border-t border-slate-50">
              <button onClick={() => navigate(`/pipelines/${pipeline.id}/board`)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow shadow-primary/20">
                <Kanban size={14} /> Open Board
              </button>
              {canManageStages && (
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
