import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
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
import { companyApi } from '../../company/api/companyApi';
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
  Lock,
  Building,
  MoreVertical,
  Eye
} from 'lucide-react';
import PageHeader from '../../../shared/components/modules/PageHeader';
import Button from '../../../shared/components/elements/Button';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import Checkbox from '../../../shared/components/elements/Checkbox';
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

const FactorActionMenu = ({ item, canEdit, canDelete, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (!canEdit && !canDelete) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
        title="Actions"
      >
        <MoreVertical size={16} />
      </button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        elevation={0}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          className: "mt-1 shadow-lg border border-slate-200/80 rounded-xl bg-white min-w-[150px] py-1 text-slate-700 font-sans"
        }}
      >
        {canEdit && (
          <MenuItem
            onClick={() => {
              handleClose();
              onEdit(item);
            }}
            className="px-3.5 py-2 text-[12px] font-semibold hover:bg-slate-50 transition-colors text-slate-700 hover:text-orange-600"
            sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Edit2 size={14} className="text-orange-500" />
            <span>Edit Factor</span>
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem
            onClick={() => {
              handleClose();
              onDelete(item);
            }}
            className="px-3.5 py-2 text-[12px] font-semibold hover:bg-rose-50 transition-colors text-slate-700 hover:text-rose-600"
            sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Trash2 size={14} className="text-rose-500" />
            <span>Deactivate</span>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

const QualificationCriteriaSettingsPage = () => {
  const { hasPermission, user } = useAuth();
  const actorRank = user?.primaryRoleRank ?? 0;
  const isSuperAdmin = userRole.toUpperCase() === "SUPER_ADMIN" || actorRank >= 100;

  // Dynamic RBAC Permission Checks
  const canEdit =
    hasPermission('QUALIFICATION', 'canEdit') ||
    hasPermission('QUALIFICATION', 'canCreate') ||
    hasPermission('SYSTEM_SETTINGS', 'canEdit') ||
    user?.primaryRole === 'SUPER_ADMIN' ||
    user?.primaryRole === 'COMPANY_ADMIN' ||
    actorRank >= 80;

  const canDelete =
    hasPermission('QUALIFICATION', 'canDelete') ||
    hasPermission('SYSTEM_SETTINGS', 'canDelete') ||
    hasPermission('SYSTEM_SETTINGS', 'canEdit') ||
    user?.primaryRole === 'SUPER_ADMIN' ||
    user?.primaryRole === 'COMPANY_ADMIN' ||
    actorRank >= 80;

  // Super Admin Multi-Company Selector State
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    isSuperAdmin ? null : (user?.companyId || null)
  );

  const { data: companiesRes, isLoading: loadingCompanies } = useQuery({
    queryKey: ["companies-all-options"],
    queryFn: () => companyApi.getCompanies(),
    enabled: isSuperAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const rawCompanies = Array.isArray(companiesRes?.data)
    ? companiesRes.data
    : companiesRes?.data?.companies || (Array.isArray(companiesRes) ? companiesRes : []);

  const companiesList = Array.isArray(rawCompanies) ? rawCompanies : [];

  const companyOptions = companiesList.map((comp) => ({
    value: String(comp.id),
    label: comp.name ? `${comp.name}${comp.code ? ` (${comp.code})` : ''}` : `Company #${comp.id}`,
  }));

  // Automatically select first company if Super Admin has not chosen yet
  useEffect(() => {
    if (isSuperAdmin && !selectedCompanyId && companiesList.length > 0) {
      setSelectedCompanyId(companiesList[0].id);
    }
  }, [isSuperAdmin, selectedCompanyId, companiesList]);

  const effectiveCompanyId = isSuperAdmin ? selectedCompanyId : user?.companyId;

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

  const fetchMatrix = async (targetCompanyId = effectiveCompanyId) => {
    if (isSuperAdmin && !targetCompanyId) return;
    try {
      setLoading(true);
      const [fetchedCriteria, fetchedSettings] = await Promise.all([
        getQualificationCriteria(targetCompanyId),
        getQualificationSettings(targetCompanyId),
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
    if (effectiveCompanyId || !isSuperAdmin) {
      fetchMatrix(effectiveCompanyId);
    }
  }, [effectiveCompanyId]);

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
      const updated = await autoBalanceCriteria(effectiveCompanyId);
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
      await saveCriteriaMatrix(criteria, effectiveCompanyId);
      await updateQualificationSettings(settings, effectiveCompanyId);
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
        }, effectiveCompanyId);
        toast.success('Criterion field updated!');
      } else {
        await createCriteria({
          ...formData,
          key,
        }, effectiveCompanyId);
        toast.success('Criterion field created!');
      }
      setModalOpen(false);
      fetchMatrix(effectiveCompanyId);
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
      await deleteCriteria(itemToDelete.id, effectiveCompanyId);
      toast.success(`Criterion "${itemToDelete.label}" deactivated.`);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      fetchMatrix(effectiveCompanyId);
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
    <div className="max-w-7xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* ── Level 1: Page Header ── */}
      <PageHeader
        title="Lead Qualification Criteria"
        description="Configure dynamic qualification factors, point weights, and score thresholds for your sales pipeline"
        icon={Target}
        actions={
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={fetchMatrix}
              className="p-2.5 text-slate-400 hover:text-orange-500 hover:bg-slate-100 transition-all focus:outline-none cursor-pointer border border-slate-200/80 bg-slate-50 rounded-xl"
              title="Refresh Data"
            >
              <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
            </button>

            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-[40px] px-4 bg-white hover:bg-orange-50/50 text-orange-600 hover:text-orange-700 border border-orange-200 hover:border-orange-300 text-xs font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus size={15} />
                  <span>Add Factor</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveMatrix}
                  disabled={isSaving || !isValidMatrix}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-[40px] px-5 bg-[#F97316] hover:bg-[#EA580C] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all duration-150 active:scale-[0.98] cursor-pointer whitespace-nowrap"
                >
                  {isSaving ? (
                    <RefreshCcw size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  <span>Save Matrix</span>
                </button>
              </>
            )}

            {!canEdit && (
              <span className="inline-flex items-center gap-1.5 h-[40px] px-3.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl">
                <Lock size={13} /> Read-Only View
              </span>
            )}
          </div>
        }
      />

      {/* ── Level 1.5: Company Scope & Weight Health Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3.5">
        {/* Left: Scope Selection / Badge */}
        <div className="flex flex-wrap items-center gap-3">
          {isSuperAdmin ? (
            <div className="w-full sm:w-64">
              <SelectField
                id="superadmin-qualification-company-select"
                label=""
                value={selectedCompanyId ? String(selectedCompanyId) : ""}
                onChange={(val) => setSelectedCompanyId(val ? Number(val) : null)}
                options={companyOptions}
                placeholder="Select company scope..."
                isLoading={loadingCompanies}
                className="!mb-0"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl">
              <Building size={14} className="text-orange-500" />
              <span>{currentUser?.companyName || 'Company Scope'}</span>
            </div>
          )}

          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80 rounded-lg">
            <Target size={13} className="text-slate-500" />
            {criteria.length} Active Factors
          </span>
        </div>

        {/* Right: Allocation Health & Auto-Balance */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <span
            className={`inline-flex items-center gap-1.5 h-[40px] px-3.5 text-xs font-bold border rounded-xl transition-all ${isValidMatrix
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                : 'bg-amber-50 text-amber-800 border-amber-200/80'
              }`}
          >
            {isValidMatrix ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>100 / 100 PTS • Balanced</span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                <span>{totalPoints} / 100 PTS • Unbalanced</span>
              </>
            )}
          </span>

          {canEdit && !isValidMatrix && (
            <button
              type="button"
              onClick={handleAutoBalance}
              disabled={isAutoBalancing}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-[40px] px-4 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap"
              title="Automatically distribute remaining weight across active factors to equal 100 points"
            >
              <Sparkles size={14} className={isAutoBalancing ? 'animate-spin text-amber-600' : 'text-amber-600'} />
              <span>Auto-Balance</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Level 2: Allocation & Pass Threshold Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Total Weight Allocation Card (Span 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-slate-400" />
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Total Weight Allocation
                </h2>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${isValidMatrix
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
                    className={`h-full transition-all duration-200 cursor-pointer rounded-xs ${colorClass} ${isHovered ? 'opacity-100 brightness-110 scale-y-110' : 'opacity-90 hover:opacity-100'
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
                    className={`flex items-center gap-1.5 text-xs transition-all cursor-pointer ${isHovered ? 'text-slate-900 font-bold' : 'text-slate-600 font-medium'
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
        <div className="lg:col-span-5 bg-white border border-slate-200 p-5 flex flex-col justify-between space-y-4">
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

          <div className="bg-slate-50/70 border border-slate-200/80 p-4 flex items-center gap-4">
            {/* Circular Progress Visual */}
            <div className="relative shrink-0 w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 flex flex-col items-center justify-center bg-orange-50/30">
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
                      className="w-full px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-md text-center focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
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
      <div className="bg-white border border-slate-200 overflow-hidden">
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
                className={`px-6 py-4 grid grid-cols-12 items-center gap-4 transition-colors ${isHovered ? 'bg-slate-50/90' : 'hover:bg-slate-50/50'
                  }`}
              >
                {/* Factor Details (Left) */}
                <div className="col-span-12 md:col-span-6 lg:col-span-7 flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-slate-100/80 border border-slate-200/80 text-slate-700 shrink-0 mt-0.5">
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
                  <Checkbox
                    id={`required-${item.id}`}
                    label="Required"
                    checked={Boolean(item.isRequired)}
                    onChange={() => canEdit && handleRequiredToggle(item.id)}
                    disabled={!canEdit}
                    sx={{ width: 'auto' }}
                  />
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
                      className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg text-center focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-100 transition-all"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-4 md:col-span-2 lg:col-span-1 flex items-center justify-end">
                  <FactorActionMenu
                    item={item}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={openEditModal}
                    onDelete={promptDelete}
                  />
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
          subtitle="Configure scoring rules, point weights, and mandatory gate status."
          icon={Target}
          onSubmit={handleModalSave}
          submitText={editingItem ? 'Save Changes' : 'Save Factor'}
          cancelText="Cancel"
          size="md"
        >
          <div className="space-y-5">
            {/* Quick Inspiration Presets (Add Mode) */}
            {!editingItem && (
              <div className="bg-slate-50 border border-slate-200/80 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-orange-500" />
                    Quick Factor Templates
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Click to auto-fill</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '💰 Budget Confirmed', type: 'boolean', pts: 15, desc: 'Lead has an approved budget for this purchase.' },
                    { label: '👔 Decision Maker Fit', type: 'select', pts: 20, desc: 'Authority level of primary contact.' },
                    { label: '⏱️ Buying Timeline', type: 'select', pts: 15, desc: 'Expected implementation or purchase timeframe.' },
                    { label: '🎯 Clear Pain Point', type: 'boolean', pts: 20, desc: 'Lead explicitly articulated a real operational problem.' },
                    { label: '🏢 Company Size Fit', type: 'select', pts: 15, desc: 'Employee headcount and business revenue tier fit.' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          label: preset.label.replace(/^[\p{Emoji}\s]+/u, '').trim(),
                          fieldType: preset.type,
                          maxPoints: preset.pts,
                          description: preset.desc,
                        }));
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 hover:text-orange-700 text-slate-700 transition-all cursor-pointer shadow-2xs"
                    >
                      {preset.label} <span className="text-slate-400 font-normal">({preset.pts} pts)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Factor Label Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                Factor Label <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Target size={15} />
                </div>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g. Budget Available (₹), Decision Maker Access..."
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 outline-none hover:border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Input Type Selection: 3 Interactive Cards */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Evaluation Input Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    type: 'boolean',
                    title: 'Yes / No Checkbox',
                    desc: 'Full points if checked',
                    icon: CheckSquare,
                  },
                  {
                    type: 'select',
                    title: 'Dropdown Choice',
                    desc: 'Tiered option breakdown',
                    icon: ListFilter,
                  },
                  {
                    type: 'number',
                    title: 'Numeric Score',
                    desc: 'Manual points rating',
                    icon: Hash,
                  },
                ].map((card) => {
                  const IconComp = card.icon;
                  const isSelected = formData.fieldType === card.type;
                  return (
                    <button
                      key={card.type}
                      type="button"
                      onClick={() => setFormData({ ...formData, fieldType: card.type })}
                      className={`p-3 border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${isSelected
                          ? 'bg-orange-50/70 border-orange-500 text-orange-950 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-6 h-6 flex items-center justify-center ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <IconComp size={13} />
                        </div>
                        {isSelected && <span className="w-2 h-2 bg-orange-500" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{card.title}</div>
                        <div className="text-[10px] text-slate-500">{card.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Max Weight Points Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                    Max Weight (Pts) <span className="text-red-500 font-bold">*</span>
                  </label>
                  <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 border border-orange-200/60">
                    {formData.maxPoints} pts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={formData.maxPoints}
                    onChange={(e) => setFormData({ ...formData, maxPoints: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 text-sm font-semibold bg-white border border-slate-200 outline-none hover:border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>
                {/* Quick Point Pills */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  {[5, 10, 15, 20, 25].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setFormData({ ...formData, maxPoints: pts })}
                      className={`px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer border ${formData.maxPoints === pts
                          ? 'bg-slate-800 border-slate-800 text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      {pts}p
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Rep Guidance / Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Help text or question shown to sales reps during qualification..."
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 outline-none hover:border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all resize-none"
                />
              </div>
            </div>

            {/* Mandatory Qualification Gate Card */}
            <div
              onClick={() => setFormData({ ...formData, isRequired: !formData.isRequired })}
              className={`p-3.5 border flex items-center justify-between gap-4 transition-all cursor-pointer ${formData.isRequired
                  ? 'bg-red-50/60 border-red-300 ring-1 ring-red-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${formData.isRequired ? 'bg-red-100 text-red-700' : 'bg-slate-200/80 text-slate-500'}`}>
                  <Lock size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">Mandatory Qualification Gate</span>
                    {formData.isRequired && (
                      <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-red-600 text-white uppercase tracking-wider">
                        Hard Gate
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    If enabled, leads failing this factor cannot be qualified, regardless of overall total score.
                  </p>
                </div>
              </div>

              <div
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer border transition-colors duration-200 ease-in-out ${formData.isRequired ? 'bg-red-500 border-red-600' : 'bg-slate-300 border-slate-400'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform bg-white shadow transition duration-200 ease-in-out ${formData.isRequired ? 'translate-x-4' : 'translate-x-0'
                    }`}
                />
              </div>
            </div>

            {/* Options Builder (for Select Type) */}
            {formData.fieldType === 'select' && (
              <div className="space-y-2.5 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Tiered Dropdown Options
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Each option awards specific points (Max: {formData.maxPoints} pts)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        options: [...formData.options, { value: `OPTION_${formData.options.length + 1}`, label: 'New Option', points: Math.min(5, formData.maxPoints) }],
                      });
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 border border-orange-200 transition-all cursor-pointer"
                  >
                    <Plus size={12} /> Add Tier Option
                  </button>
                </div>

                <div className="space-y-2 bg-slate-50/70 border border-slate-200/80 p-3">
                  {formData.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 border border-slate-200/80 shadow-2xs">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newOpts = [...formData.options];
                            newOpts[idx].label = val;
                            newOpts[idx].value = val.toUpperCase().replace(/\s+/g, '_');
                            setFormData({ ...formData, options: newOpts });
                          }}
                          placeholder="Option Label (e.g. Enterprise Tier)"
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50/50 border border-slate-200 outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                        />
                      </div>
                      <div className="w-24 flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max={formData.maxPoints}
                          value={opt.points}
                          onChange={(e) => {
                            const newOpts = [...formData.options];
                            newOpts[idx].points = Number(e.target.value) || 0;
                            setFormData({ ...formData, options: newOpts });
                          }}
                          className="w-full px-2 py-1.5 text-xs font-bold bg-slate-50/50 border border-slate-200 outline-none focus:border-orange-500 focus:bg-white text-center transition-all"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">pts</span>
                      </div>
                      {formData.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = formData.options.filter((_, i) => i !== idx);
                            setFormData({ ...formData, options: newOpts });
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Evaluation Preview Card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Eye size={13} className="text-slate-400" />
                  Rep Evaluation Preview
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Lead Drawer Card
                </span>
              </div>

              <div className="bg-white p-3 border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {formData.label.trim() || 'Untitled Factor'}
                    </span>
                    {formData.isRequired && (
                      <span className="text-red-500 text-xs font-bold" title="Mandatory">*</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[260px]">
                    {formData.description.trim() || 'No description provided'}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                    +{formData.maxPoints} pts
                  </span>
                </div>
              </div>
            </div>
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
