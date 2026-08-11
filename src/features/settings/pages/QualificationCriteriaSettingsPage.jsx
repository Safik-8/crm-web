import React, { useState, useEffect } from 'react';
import {
  getQualificationCriteria,
  getQualificationSettings,
  saveCriteriaMatrix,
  createCriteria,
  updateCriteria,
  deleteCriteria,
  updateQualificationSettings,
  autoBalanceCriteria,
} from '../../leads/services/qualificationService';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Layers,
  CheckSquare,
  ListFilter,
  Hash,
  X,
  ShieldCheck,
  RefreshCcw,
  Lock
} from 'lucide-react';
import PageHeader from '../../../shared/components/modules/PageHeader';
import Button from '../../../shared/components/elements/Button';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import { DynamicFormModal } from '../../../shared/components/elements/DynamicFormModal';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import { useAuth } from '../../../app/providers/AuthProvider';
import { toast } from '../../../shared/utils/toast';

const PALETTE = [
  'bg-orange-500',
  'bg-amber-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-indigo-500',
  'bg-rose-500',
  'bg-teal-500',
];

const FIELD_TYPE_OPTIONS = [
  { value: 'boolean', label: 'Yes / No Checkbox' },
  { value: 'select', label: 'Dropdown Choice' },
  { value: 'number', label: 'Numeric Rating' },
];

const QualificationCriteriaSettingsPage = () => {
  const { hasPermission, user } = useAuth();

  // Dynamic RBAC Permission Checks
  const canEdit =
    hasPermission('QUALIFICATION', 'canEdit') ||
    hasPermission('QUALIFICATION', 'canCreate') ||
    hasPermission('SYSTEM_SETTINGS', 'canEdit') ||
    user?.primaryRole === 'SUPER_ADMIN' ||
    user?.primaryRole === 'COMPANY_ADMIN';

  const canDelete =
    hasPermission('QUALIFICATION', 'canDelete') ||
    hasPermission('SYSTEM_SETTINGS', 'canDelete') ||
    hasPermission('SYSTEM_SETTINGS', 'canEdit') ||
    user?.primaryRole === 'SUPER_ADMIN' ||
    user?.primaryRole === 'COMPANY_ADMIN';

  const [criteria, setCriteria] = useState([]);
  const [settings, setSettings] = useState({ passThreshold: 60, holdThreshold: 40 });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoBalancing, setIsAutoBalancing] = useState(false);
  const [hoveredFactorId, setHoveredFactorId] = useState(null);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    key: '',
    fieldType: 'boolean',
    maxPoints: 15,
    description: '',
    isRequired: false,
    options: [
      { value: 'HIGH', label: 'High', points: 15 },
      { value: 'MEDIUM', label: 'Medium', points: 10 },
      { value: 'LOW', label: 'Low', points: 5 },
    ],
  });

  // Delete Confirm Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      const [fetchedCriteria, fetchedSettings] = await Promise.all([
        getQualificationCriteria(),
        getQualificationSettings(),
      ]);
      setCriteria(fetchedCriteria || []);
      if (fetchedSettings) setSettings(fetchedSettings);
    } catch (err) {
      console.error('Failed to load qualification settings:', err);
      toast.error(err?.message || 'Failed to load qualification criteria settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const totalPoints = criteria.reduce((sum, item) => sum + (Number(item.maxPoints) || 0), 0);
  const isValidMatrix = totalPoints === 100;

  const handlePointChange = (id, newPoints) => {
    if (!canEdit) return;
    const pointsNum = Math.max(0, parseInt(newPoints) || 0);
    setCriteria((prev) =>
      prev.map((item) => (item.id === id ? { ...item, maxPoints: pointsNum } : item))
    );
  };

  const handleRequiredToggle = (id) => {
    if (!canEdit) return;
    setCriteria((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRequired: !item.isRequired } : item))
    );
  };

  const handleAutoBalance = async () => {
    if (!canEdit) {
      toast.error("Access Denied: You do not have permission to modify qualification settings");
      return;
    }
    try {
      setIsAutoBalancing(true);
      const updated = await autoBalanceCriteria();
      setCriteria(updated || []);
      toast.success('Criteria weights auto-balanced to exactly 100 points!');
    } catch (err) {
      console.error('Auto-balance failed:', err);
      toast.error(err?.message || 'Failed to auto-balance criteria');
    } finally {
      setIsAutoBalancing(false);
    }
  };

  const handleSaveMatrix = async () => {
    if (!canEdit) {
      toast.error("Access Denied: You do not have permission to save qualification matrix");
      return;
    }
    if (!isValidMatrix) {
      toast.error(`Total weight must equal 100 points (Current sum: ${totalPoints}). Use Auto-Balance or adjust points.`);
      return;
    }

    try {
      setIsSaving(true);
      await saveCriteriaMatrix(criteria);
      await updateQualificationSettings(settings);
      toast.success('Qualification criteria matrix saved successfully!');
    } catch (err) {
      console.error('Failed to save matrix:', err);
      toast.error(err?.message || 'Failed to save criteria configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    if (!canEdit) {
      toast.error("Access Denied: You do not have permission to add qualification criteria");
      return;
    }
    setEditingItem(null);
    setFormData({
      label: '',
      key: '',
      fieldType: 'boolean',
      maxPoints: 15,
      description: '',
      isRequired: false,
      options: [
        { value: 'HIGH', label: 'High', points: 15 },
        { value: 'MEDIUM', label: 'Medium', points: 10 },
        { value: 'LOW', label: 'Low', points: 5 },
      ],
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    if (!canEdit) {
      toast.error("Access Denied: You do not have permission to edit qualification criteria");
      return;
    }
    setEditingItem(item);
    const sanitizedOptions = Array.isArray(item.options)
      ? item.options.map((opt) => ({
          ...opt,
          label: (opt.label || '').replace(/\s*\(\+\d+\s*(pts)?\)$/i, '').trim(),
        }))
      : [
          { value: 'HIGH', label: 'High', points: 15 },
          { value: 'MEDIUM', label: 'Medium', points: 10 },
          { value: 'LOW', label: 'Low', points: 5 },
        ];
    setFormData({
      label: item.label || '',
      key: item.key || '',
      fieldType: item.fieldType || 'boolean',
      maxPoints: item.maxPoints || 0,
      description: item.description || '',
      isRequired: Boolean(item.isRequired),
      options: sanitizedOptions,
    });
    setModalOpen(true);
  };

  const handleModalSave = async () => {
    if (!canEdit) {
      toast.error("Access Denied: You do not have permission to save criteria");
      return;
    }

    if (!formData.label?.trim()) {
      toast.error('Criterion label is required');
      return;
    }

    const key =
      formData.key?.trim() ||
      formData.label
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    if (formData.fieldType === 'select' && Array.isArray(formData.options)) {
      for (const opt of formData.options) {
        if (Number(opt.points) > Number(formData.maxPoints)) {
          toast.error(`Option "${opt.label}" points (${opt.points}) cannot exceed field max points (${formData.maxPoints})`);
          return;
        }
      }
    }

    try {
      if (editingItem) {
        await updateCriteria(editingItem.id, {
          ...formData,
          key,
        });
        toast.success('Criterion field updated!');
      } else {
        await createCriteria({
          ...formData,
          key,
        });
        toast.success('Criterion field created!');
      }
      setModalOpen(false);
      fetchMatrix();
    } catch (err) {
      console.error('Failed to save criterion:', err);
      toast.error(err?.message || 'Failed to save criterion');
    }
  };

  const promptDelete = (item) => {
    if (!canDelete) {
      toast.error("Access Denied: You do not have permission to delete qualification criteria");
      return;
    }

    if (criteria.length <= 1) {
      toast.error('You must keep at least one qualification criterion field.');
      return;
    }

    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      await deleteCriteria(itemToDelete.id);
      toast.success(`Criterion "${itemToDelete.label}" deactivated.`);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      fetchMatrix();
    } catch (err) {
      console.error('Failed to delete criterion:', err);
      toast.error(err?.message || 'Failed to deactivate criterion');
    } finally {
      setIsDeleting(false);
    }
  };

  const getFieldIcon = (fieldType) => {
    switch (fieldType) {
      case 'boolean':
        return <CheckSquare size={15} className="text-blue-500" />;
      case 'select':
        return <ListFilter size={15} className="text-purple-500" />;
      default:
        return <Hash size={15} className="text-emerald-500" />;
    }
  };

  const getFieldBadge = (fieldType) => {
    switch (fieldType) {
      case 'boolean':
        return <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-100 uppercase tracking-wider">Checkbox</span>;
      case 'select':
        return <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 border border-purple-100 uppercase tracking-wider">Dropdown</span>;
      default:
        return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-100 uppercase tracking-wider">Numeric</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Loading Qualification Rules...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Level 1: Page Header ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0 shadow-2xs">
            <Target size={24} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
              Lead Qualification Criteria Rules
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-normal mt-0.5">
              Configure dynamic qualification factors, point weights, and score thresholds for your sales pipeline.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={fetchMatrix}
            className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors focus:outline-none"
            title="Refresh Data"
          >
            <RefreshCcw size={16} />
          </button>

          {canEdit && (
            <>
              {!isValidMatrix && (
                <Button
                  onClick={handleAutoBalance}
                  isLoading={isAutoBalancing}
                  variant="outlined"
                  color="warning"
                  size="medium"
                  startIcon={<Sparkles size={16} />}
                >
                  Auto-Balance Weights
                </Button>
              )}

              <Button
                onClick={openAddModal}
                variant="outlined"
                size="medium"
                startIcon={<Plus size={16} />}
                sx={{
                  borderColor: '#F86F03',
                  color: '#F86F03',
                  '&:hover': {
                    borderColor: '#E06202',
                    backgroundColor: 'rgba(248, 111, 3, 0.06)',
                  },
                }}
              >
                Add Factor
              </Button>

              <Button
                onClick={handleSaveMatrix}
                disabled={isSaving || !isValidMatrix}
                isLoading={isSaving}
                variant="contained"
                size="medium"
                startIcon={<Save size={16} />}
                sx={{
                  backgroundColor: '#F86F03',
                  '&:hover': {
                    backgroundColor: '#E06202',
                  },
                }}
              >
                Save Matrix
              </Button>
            </>
          )}

          {!canEdit && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg">
              <Lock size={12} /> Read-Only View
            </span>
          )}
        </div>
      </div>

      {/* ── Level 2: Allocation & Pass Threshold Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Total Weight Allocation Card (Span 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-slate-400" />
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Total Weight Allocation
                </h2>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                  isValidMatrix
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {isValidMatrix ? (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    100 / 100 PTS (VALID)
                  </>
                ) : (
                  <>
                    <AlertTriangle size={13} className="text-amber-600" />
                    {totalPoints} / 100 PTS (INVALID)
                  </>
                )}
              </span>
            </div>

            {/* Segmented Allocation Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200/60">
              {criteria.map((item, idx) => {
                const pct = totalPoints > 0 ? (Number(item.maxPoints) / (isValidMatrix ? 100 : totalPoints)) * 100 : 0;
                const colorClass = PALETTE[idx % PALETTE.length];
                const isHovered = hoveredFactorId === item.id;
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredFactorId(item.id)}
                    onMouseLeave={() => setHoveredFactorId(null)}
                    style={{ width: `${Math.max(pct, 1)}%` }}
                    title={`${item.label}: ${item.maxPoints} pts (${Math.round(item.maxPoints)}%)`}
                    className={`h-full transition-all duration-200 cursor-pointer rounded-xs ${colorClass} ${
                      isHovered ? 'opacity-100 brightness-110 scale-y-110' : 'opacity-90 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>

            {/* Legend Items */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
              {criteria.map((item, idx) => {
                const colorClass = PALETTE[idx % PALETTE.length];
                const isHovered = hoveredFactorId === item.id;
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredFactorId(item.id)}
                    onMouseLeave={() => setHoveredFactorId(null)}
                    className={`flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
                      isHovered ? 'text-slate-900 font-bold' : 'text-slate-600 font-medium'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorClass}`} />
                    <span>{item.label}</span>
                    <span className="text-slate-900 font-semibold">
                      {item.maxPoints} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {!isValidMatrix && (
            <div className="text-xs text-amber-800 bg-amber-50/80 p-3 rounded-lg border border-amber-200/80 flex items-center justify-between gap-3 mt-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                <span>
                  Total criteria weights must equal <strong>100 points</strong> before saving (Current: <strong>{totalPoints} pts</strong>).
                </span>
              </div>
              {canEdit && (
                <button
                  onClick={handleAutoBalance}
                  disabled={isAutoBalancing}
                  className="text-xs font-bold text-amber-700 hover:text-amber-900 underline shrink-0 cursor-pointer"
                >
                  Auto-Balance
                </button>
              )}
            </div>
          )}
        </div>

        {/* Qualification Pass Threshold Card (Span 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-orange-500" />
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Qualification Pass Threshold
                </h2>
              </div>
              <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase bg-slate-100 px-2 py-0.5 rounded">
                Company Rule
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Minimum points required for a lead to automatically pass qualification.
            </p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex items-center gap-4">
            {/* Circular Progress Visual */}
            <div className="relative shrink-0 w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 flex flex-col items-center justify-center bg-orange-50/30 shadow-2xs">
              <span className="text-lg font-black text-slate-900 leading-none">
                {settings.passThreshold}
              </span>
              <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
                Points
              </span>
            </div>

            <div className="flex-1 space-y-2">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Leads scoring <strong className="text-slate-900 font-bold">{settings.passThreshold} / 100 PTS</strong> or higher automatically qualify.
              </p>

              {canEdit && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500">Threshold Pts:</span>
                  <div className="w-20">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.passThreshold}
                      onChange={(e) => canEdit && setSettings({ ...settings, passThreshold: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                      className="w-full px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-md text-center focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-2xs"
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">PTS</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Level 3: Active Qualification Factors Table ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5">
            <Layers size={16} className="text-slate-400" />
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Active Qualification Factors
            </h3>
            <span className="px-2.5 py-0.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-full border border-slate-200/80">
              {criteria.length} Active
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            All factor scores in ₹ INR
          </span>
        </div>

        {/* Table Column Headers */}
        <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-200 grid grid-cols-12 items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">
          <div className="col-span-12 md:col-span-6 lg:col-span-7">FACTOR</div>
          <div className="col-span-4 md:col-span-2 lg:col-span-2 text-right md:text-center">REQUIRED</div>
          <div className="col-span-4 md:col-span-2 lg:col-span-2 text-center md:text-right">WEIGHT (POINTS)</div>
          <div className="col-span-4 md:col-span-2 lg:col-span-1 text-right">ACTIONS</div>
        </div>

        {/* Factors List */}
        <div className="divide-y divide-slate-100">
          {criteria.map((item) => {
            const isHovered = hoveredFactorId === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredFactorId(item.id)}
                onMouseLeave={() => setHoveredFactorId(null)}
                className={`px-6 py-4 grid grid-cols-12 items-center gap-4 transition-colors ${
                  isHovered ? 'bg-slate-50/90' : 'hover:bg-slate-50/50'
                }`}
              >
                {/* Factor Details (Left) */}
                <div className="col-span-12 md:col-span-6 lg:col-span-7 flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-slate-100/80 border border-slate-200/80 text-slate-700 shrink-0 mt-0.5 shadow-2xs">
                    {getFieldIcon(item.fieldType)}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{item.label}</span>
                      {getFieldBadge(item.fieldType)}
                      {item.isRequired && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 uppercase tracking-wider">
                          Required
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-500 font-normal leading-relaxed">{item.description}</p>
                    )}

                    {/* Dropdown Options Pills */}
                    {item.fieldType === 'select' && Array.isArray(item.options) && item.options.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {item.options.map((opt) => {
                          const cleanLabel = (opt.label || '').replace(/\s*\(\+\d+\s*(pts)?\)$/i, '').trim();
                          return (
                            <span
                              key={opt.value}
                              className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200/80"
                            >
                              {cleanLabel} <strong className="text-slate-900 font-semibold">(+{opt.points})</strong>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Required Switch */}
                <div className="col-span-4 md:col-span-2 lg:col-span-2 flex items-center justify-end md:justify-center">
                  <label className={`inline-flex items-center gap-2 select-none ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}>
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={Boolean(item.isRequired)}
                      onChange={() => canEdit && handleRequiredToggle(item.id)}
                      className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-xs font-semibold text-slate-700">Required</span>
                  </label>
                </div>

                {/* Weight Input */}
                <div className="col-span-4 md:col-span-2 lg:col-span-2 flex items-center justify-center md:justify-end">
                  <div className="w-20">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      disabled={!canEdit}
                      value={item.maxPoints}
                      onChange={(e) => canEdit && handlePointChange(item.id, e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg text-center focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-100 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-4 md:col-span-2 lg:col-span-1 flex items-center justify-end gap-1">
                  {canEdit && (
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors cursor-pointer"
                      title="Edit Factor"
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => promptDelete(item)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Deactivate Factor"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Add / Edit Factor Modal ── */}
      {canEdit && (
        <DynamicFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? 'EDIT QUALIFICATION FACTOR' : 'ADD NEW QUALIFICATION FACTOR'}
          subtitle="Configure factor rules, input type, points weight, and mandatory flags."
          icon={Target}
          onSubmit={handleModalSave}
          submitText="Save Factor"
          cancelText="Cancel"
          size="sm"
        >
          <div className="space-y-4">
            <TextField
              id="factor-label"
              label="Factor Label"
              required
              value={formData.label}
              onChange={(val) => setFormData({ ...formData, label: val })}
              placeholder="e.g. Budget Available (₹)"
            />

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                id="factor-type"
                label="Input Type"
                value={formData.fieldType}
                onChange={(val) => setFormData({ ...formData, fieldType: val })}
                options={FIELD_TYPE_OPTIONS}
              />

              <TextField
                id="factor-maxpoints"
                label="Max Weight (Pts)"
                required
                type="number"
                value={formData.maxPoints}
                onChange={(val) => setFormData({ ...formData, maxPoints: Number(val) || 0 })}
              />
            </div>

            <TextField
              id="factor-description"
              label="Description"
              value={formData.description}
              onChange={(val) => setFormData({ ...formData, description: val })}
              placeholder="Help text for sales reps..."
            />

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formData.isRequired}
                onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700">Mandatory field for qualification</span>
            </label>

            {/* Options Builder */}
            {formData.fieldType === 'select' && (
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  Dropdown Options & Points (Max {formData.maxPoints} pts)
                </label>
                <div className="space-y-2">
                  {formData.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1">
                        <TextField
                          id={`opt-label-${idx}`}
                          value={opt.label}
                          onChange={(val) => {
                            const newOpts = [...formData.options];
                            newOpts[idx].label = val;
                            newOpts[idx].value = val.toUpperCase().replace(/\s+/g, '_');
                            setFormData({ ...formData, options: newOpts });
                          }}
                          placeholder="Option Label (e.g. High)"
                        />
                      </div>
                      <div className="w-24">
                        <TextField
                          id={`opt-pts-${idx}`}
                          type="number"
                          value={opt.points}
                          onChange={(val) => {
                            const newOpts = [...formData.options];
                            newOpts[idx].points = Number(val) || 0;
                            setFormData({ ...formData, options: newOpts });
                          }}
                          placeholder="Pts"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newOpts = formData.options.filter((_, i) => i !== idx);
                          setFormData({ ...formData, options: newOpts });
                        }}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        options: [...formData.options, { value: 'NEW_OPTION', label: 'New Option', points: 5 }],
                      });
                    }}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <Plus size={12} /> Add Option
                  </button>
                </div>
              </div>
            )}
          </div>
        </DynamicFormModal>
      )}

      {/* ── Custom Shared Confirm Modal for Delete Action ── */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        title="Deactivate Qualification Factor"
        message={`Are you sure you want to deactivate factor "${itemToDelete?.label}"?`}
        warningMessage="This factor will be hidden from future lead qualification forms, but past historical evaluations remain 100% frozen for audit compliance."
        onConfirm={handleConfirmDelete}
        confirmText="Yes, Deactivate"
        cancelText="Cancel"
        type="error"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default QualificationCriteriaSettingsPage;
