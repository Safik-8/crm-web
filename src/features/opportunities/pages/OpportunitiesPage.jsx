// src/features/opportunities/pages/OpportunitiesPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Search,
  IndianRupee,
  TrendingUp,
  Building2,
  GitBranch,
  Filter,
} from 'lucide-react';
import Button from '../../../shared/components/elements/Button';
import TextField from '../../../shared/components/elements/TextField';
import SelectField from '../../../shared/components/elements/SelectField';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import Skeleton from '../../../shared/components/elements/Skeleton';

import { useQuery } from '@tanstack/react-query';
import { companyService } from '../../company/services/companyService';
import { branchService } from '../../branch/services/branchService';
import { getOpportunityStages } from '../services/opportunityService';

import {
  useOpportunitiesQuery,
  useCreateOpportunityMutation,
  useUpdateOpportunityMutation,
  useCloseOpportunityMutation,
  useMoveOpportunityStageMutation,
} from '../hooks/useOpportunities';

import { OpportunityKanban } from '../components/OpportunityKanban';
import { OpportunitySpreadsheet } from '../components/OpportunitySpreadsheet';
import { CreateOpportunitySlideover } from '../components/CreateOpportunitySlideover';
import { OpportunityDetailDrawer } from '../components/OpportunityDetailDrawer';
import { useLeadsQuery } from '../../leads/hooks/useLeads';
import { useCoursesQuery } from '../../courses/hooks/useCourses';

import { useAuth } from '../../../app/providers/AuthProvider';
import { PERMISSIONS } from '../../../lib/constants/permissions';

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

// ── Metric Card Skeleton ────────────────────────────────────────────────────
const MetricCardSkeleton = () => (
  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
    <div className="space-y-2">
      <Skeleton className="h-3 w-28 rounded-md" />
      <Skeleton className="h-6 w-20 rounded-md" />
    </div>
    <Skeleton className="w-10 h-10 rounded-md" />
  </div>
);

// ── Filter Bar Skeleton ─────────────────────────────────────────────────────
const FilterBarSkeleton = () => (
  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
    <Skeleton className="h-9 w-72 rounded-lg" />
    <Skeleton className="h-9 w-40 rounded-lg" />
    <Skeleton className="h-9 w-40 rounded-lg" />
    <Skeleton className="h-9 w-40 rounded-lg" />
  </div>
);

// ── Kanban Skeleton ─────────────────────────────────────────────────────────
const KanbanSkeleton = ({ stageCount = 5 }) => (
  <div className="flex gap-4 overflow-x-auto pb-4">
    {[...Array(stageCount)].map((_, i) => (
      <div
        key={i}
        className="flex-shrink-0 w-[288px] rounded-lg bg-slate-50 border border-slate-200 p-3.5"
      >
        {/* Column header */}
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Skeleton className="w-2.5 h-2.5 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-5 w-6 rounded-md" />
          </div>
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        {/* Cards */}
        <div className="space-y-2.5">
          {[...Array(Math.max(1, 3 - i % 2))].map((_, j) => (
            <div key={j} className="bg-white rounded-md border border-slate-200 p-3 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-5 w-14 rounded-md" />
              </div>
              <Skeleton className="h-3 w-24 rounded-md" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                <Skeleton className="h-3 w-16 rounded-md" />
                <Skeleton className="h-3 w-14 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const OpportunitiesPage = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const isSuperAdmin = user?.primaryRoleRank >= 100 || user?.primaryRole === 'SUPER_ADMIN';
  const isCompanyAdmin = !isSuperAdmin && user?.primaryRoleRank >= 80;
  const canFilterByCompany = isSuperAdmin;
  const canFilterByBranch = isSuperAdmin || isCompanyAdmin;
  const canCreateOpportunity = hasPermission('LEAD', 'canCreate') || (user?.rank && user.rank >= 40) || (user?.primaryRoleRank && user.primaryRoleRank >= 40);

  const [viewMode, setViewMode] = useState('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  // stageFilter: { type: 'status'|'stageId', value: string } | null
  const [stageFilter, setStageFilter] = useState(null);
  const [stageFilterOpen, setStageFilterOpen] = useState(false);
  const stageFilterRef = useRef(null);
  const [companyFilter, setCompanyFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  // ── Filter Data Sources ────────────────────────────────────────────────────
  const companiesQuery = useQuery({
    queryKey: ['companies-raw'],
    queryFn: async () => {
      const res = await companyService.getCompaniesRaw();
      const raw = res?.data || res;
      return Array.isArray(raw) ? raw : [];
    },
    enabled: canFilterByCompany,
    staleTime: 60000,
  });

  const branchesQuery = useQuery({
    queryKey: ['branches-raw', companyFilter || user?.companyId],
    queryFn: async () => {
      const scopeId = companyFilter || user?.companyId || null;
      const res = await branchService.getBranchesRaw(scopeId);
      const raw = res?.data || res;
      return Array.isArray(raw) ? raw : (Array.isArray(raw?.branches) ? raw.branches : []);
    },
    enabled: canFilterByBranch,
    staleTime: 30000,
  });

  const companies = companiesQuery.data || [];
  const branches = branchesQuery.data || [];

  // When company filter changes, clear branch filter
  useEffect(() => {
    setBranchFilter('');
  }, [companyFilter]);

  // Close stage filter dropdown on outside click
  useEffect(() => {
    if (!stageFilterOpen) return;
    const handler = (e) => {
      if (stageFilterRef.current && !stageFilterRef.current.contains(e.target)) {
        setStageFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [stageFilterOpen]);

  // ── Stages ─────────────────────────────────────────────────────────────────
  const oppStagesQuery = useQuery({
    queryKey: ['opportunity-stages', companyFilter || user?.companyId],
    queryFn: async () => {
      const scopeId = companyFilter || user?.companyId || null;
      const res = await getOpportunityStages(scopeId ? { companyId: scopeId } : {});
      const raw = res?.data || res;
      return Array.isArray(raw) && raw.length > 0 ? raw : DEFAULT_STAGES;
    },
    placeholderData: DEFAULT_STAGES,
    staleTime: 30000,
  });
  const stages = oppStagesQuery.data || DEFAULT_STAGES;

  // ── Form Data ──────────────────────────────────────────────────────────────
  const leadsQuery = useLeadsQuery({ limit: 100 });
  const leads =
    leadsQuery.data?.data?.leads ||
    leadsQuery.data?.leads ||
    (Array.isArray(leadsQuery.data?.data) ? leadsQuery.data.data : []) ||
    (Array.isArray(leadsQuery.data) ? leadsQuery.data : []);

  const coursesQuery = useCoursesQuery();
  const courses =
    coursesQuery.data?.data?.courses ||
    coursesQuery.data?.courses ||
    (Array.isArray(coursesQuery.data?.data) ? coursesQuery.data.data : []) ||
    (Array.isArray(coursesQuery.data) ? coursesQuery.data : []);

  // ── Modals & Drawers ───────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);
  const [closingOpportunity, setClosingOpportunity] = useState(null);
  // pendingStageId stores the target stage when drag triggers the closure modal
  const [pendingStageId, setPendingStageId] = useState(null);
  const [closeOutcome, setCloseOutcome] = useState('WON');
  const [closeRemarks, setCloseRemarks] = useState('');

  // ── Main Data Query ────────────────────────────────────────────────────────
  const queryParams = {
    search: searchTerm,
    ...(stageFilter?.type === 'status' && { status: stageFilter.value }),
    ...(stageFilter?.type === 'stageId' && { stageId: stageFilter.value }),
    ...(companyFilter && { companyId: companyFilter }),
    ...(branchFilter && { branchId: branchFilter }),
  };
  const { data, isLoading, isError, error, isFetching } = useOpportunitiesQuery(queryParams);

  const createMutation = useCreateOpportunityMutation();
  const updateMutation = useUpdateOpportunityMutation();
  const closeMutation = useCloseOpportunityMutation();
  const moveStageMutation = useMoveOpportunityStageMutation();

  const [localOpportunities, setLocalOpportunities] = useState([]);
  const snapshotRef = useRef(null);
  const inFlightCountRef = useRef(0);

  useEffect(() => {
    if (data?.items && inFlightCountRef.current === 0) {
      setLocalOpportunities(data.items);
    }
  }, [data?.items]);

  const opportunities = localOpportunities;

  const handleStageChange = (opportunityId, newStageId) => {
    const targetStageId = Number(newStageId);
    const targetStageObj = stages.find((s) => Number(s.id) === targetStageId);
    console.log('[DEBUG] handleStageChange:', { opportunityId, newStageId, targetStageId, targetStageObj, stages });

    const isWon = targetStageObj?.stageType === 'WON' || targetStageObj?.code === 'WON' || targetStageObj?.name?.toLowerCase() === 'won';
    const isLost = targetStageObj?.stageType === 'LOST' || targetStageObj?.code === 'LOST' || targetStageObj?.name?.toLowerCase() === 'lost';
    const isCancelled = targetStageObj?.stageType === 'CANCELLED' || targetStageObj?.code === 'CANCELLED' || targetStageObj?.name?.toLowerCase() === 'cancelled';

    // Intercept drag and drop to system closure stages and trigger closure modal
    if (isWon || isLost || isCancelled) {
      const outcome = isWon ? 'WON' : isLost ? 'LOST' : 'CANCELLED';
      const oppObj = opportunities.find((o) => Number(o.id) === Number(opportunityId));
      setCloseOutcome(outcome);
      setClosingOpportunity(oppObj);
      setPendingStageId(targetStageId);
      return;
    }

    snapshotRef.current = [...localOpportunities];
    inFlightCountRef.current += 1;
    setLocalOpportunities((prev) =>
      prev.map((opp) =>
        Number(opp.id) === Number(opportunityId)
          ? { ...opp, stageId: targetStageId, stage: targetStageObj || opp.stage }
          : opp
      )
    );
    moveStageMutation.mutate(
      { id: opportunityId, data: { newStageId: targetStageId } },
      {
        onSuccess: () => {
          inFlightCountRef.current = Math.max(0, inFlightCountRef.current - 1);
        },
        onError: () => {
          inFlightCountRef.current = Math.max(0, inFlightCountRef.current - 1);
          if (snapshotRef.current) setLocalOpportunities(snapshotRef.current);
        },
      }
    );
  };

  const handleCreateSubmit = async (formData) => {
    await createMutation.mutateAsync(formData);
    setIsCreateOpen(false);
  };

  const handleConfirmClose = async () => {
    if (!closingOpportunity) return;

    // Resolve the target stage by stageType (WON / LOST / CANCELLED) from the stages list.
    // This works whether the close was triggered by drag (pendingStageId set) or by a button click.
    const targetStageObj = stages.find(
      (s) =>
        s.stageType === closeOutcome ||
        s.code === closeOutcome ||
        s.name?.toUpperCase() === closeOutcome
    ) || (pendingStageId ? stages.find((s) => Number(s.id) === Number(pendingStageId)) : null);

    const targetStageId = targetStageObj?.id ?? pendingStageId ?? closingOpportunity.stageId;

    // Optimistically move the card to the correct column immediately
    setLocalOpportunities((prev) =>
      prev.map((opp) =>
        Number(opp.id) === Number(closingOpportunity.id)
          ? {
              ...opp,
              status: closeOutcome,
              stageId: targetStageId,
              stage: targetStageObj || opp.stage,
            }
          : opp
      )
    );

    // Capture before clearing state (state will be null after setClosingOpportunity(null))
    const oppId = closingOpportunity.id;
    const outcome = closeOutcome;
    const remarks = closeRemarks;
    const originalOpp = closingOpportunity;

    // Dismiss modal so the user sees the card move instantly
    setClosingOpportunity(null);
    setPendingStageId(null);
    setCloseRemarks('');

    try {
      await closeMutation.mutateAsync({
        id: oppId,
        data: { outcome, remarks },
      });
    } catch {
      // Roll back on error
      setLocalOpportunities((prev) =>
        prev.map((opp) =>
          Number(opp.id) === Number(oppId)
            ? { ...opp, status: originalOpp.status, stageId: originalOpp.stageId, stage: originalOpp.stage }
            : opp
        )
      );
    }
  };

  // ── Metrics ────────────────────────────────────────────────────────────────
  const totalPipelineRevenue = opportunities.reduce((acc, opp) => acc + Number(opp.expectedRevenue || 0), 0);
  const totalWonRevenue = opportunities.filter((opp) => opp.status === 'WON').reduce((acc, opp) => acc + Number(opp.expectedRevenue || 0), 0);

  const hasActiveFilters = !!(searchTerm || stageFilter || companyFilter || branchFilter);

  const tableLoadingState = isLoading ? 'loading' : isError ? 'error' : opportunities.length === 0 ? 'empty' : 'success';

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">

      {/* ── Top Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          {/* Header Title */}
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-orange-50 text-orange-600 rounded-md border border-orange-100">
              <Target className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Opportunities Engine</h1>
          </div>
          <p className="text-slate-500 text-xs">
            Manage sales pipeline deals, track revenue forecasting, and close opportunities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200 h-[36px]">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all h-[28px] cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('spreadsheet')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all h-[28px] cursor-pointer ${
                viewMode === 'spreadsheet' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Table
            </button>
          </div>

          {hasPermission(PERMISSIONS.MANAGE_STAGES) && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<GitBranch className="w-4 h-4" />}
              onClick={() => navigate('/opportunities/stages')}
              sx={{
                height: '36px',
                borderRadius: '6px',
                borderColor: '#cbd5e1',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#f8fafc', borderColor: '#94a3b8' },
              }}
            >
              Manage Stages
            </Button>
          )}

          {canCreateOpportunity && (
            <Button
              size="small"
              variant="contained"
              startIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
              sx={{
                height: '36px',
                borderRadius: '6px',
                backgroundColor: '#F86F03',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#DE5D02' },
              }}
            >
              New Opportunity
            </Button>
          )}
        </div>
      </div>

      {/* ── Metrics Row ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block mb-1">Total Pipeline Value</span>
              <span className="text-xl font-bold text-slate-900">
                ₹{totalPipelineRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-md bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block mb-1">Closed Won Revenue</span>
              <span className="text-xl font-bold text-emerald-600">
                ₹{totalWonRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block mb-1">Active Opportunities</span>
              <span className="text-xl font-bold text-slate-900">{opportunities.length} Deals</span>
            </div>
            <div className="w-10 h-10 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Target className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* ── Filters Bar ─────────────────────────────────────────────── */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px] max-w-xs">
            <TextField
              placeholder="Search opportunities or leads..."
              value={searchTerm}
              onChange={(val) => setSearchTerm(val)}
              startIcon={Search}
            />
          </div>

          {/* Stage Filter — status dropdown */}
          <div className="relative w-44" ref={stageFilterRef}>
            <button
              type="button"
              onClick={() => setStageFilterOpen((v) => !v)}
              className={`w-full h-9 flex items-center justify-between gap-2 px-3 text-xs font-medium rounded-lg border transition-all
                ${stageFilter
                  ? 'bg-orange-50 border-orange-300 text-orange-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
            >
              <span className="truncate">
                {stageFilter ? stageFilter.label : 'All Statuses'}
              </span>
              <svg className={`w-3.5 h-3.5 shrink-0 transition-transform ${stageFilterOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {stageFilterOpen && (
              <div className="absolute left-0 top-full mt-1 z-50 w-44 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setStageFilter(null); setStageFilterOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition-colors
                    ${!stageFilter ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  All Statuses
                </button>
                <div className="h-px bg-slate-100 mx-2 my-1" />
                {[
                  { label: 'Open', type: 'status', value: 'OPEN' },
                  { label: 'Won', type: 'status', value: 'WON' },
                  { label: 'Lost', type: 'status', value: 'LOST' },
                  { label: 'Cancelled', type: 'status', value: 'CANCELLED' },
                ].map((opt) => {
                  const isActive = stageFilter?.type === opt.type && stageFilter?.value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setStageFilter({ ...opt }); setStageFilterOpen(false); }}
                      className={`w-full text-left px-3.5 py-2 text-xs transition-colors
                        ${isActive ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Company Filter — Super Admin only */}
          {canFilterByCompany && (
            <div className="w-52">
              <SelectField
                placeholder="All Companies"
                value={companyFilter}
                onChange={(val) => setCompanyFilter(val === undefined ? '' : val)}
                allowEmptyOption
                searchable={true}
                isLoading={companiesQuery.isLoading}
                options={companies.map((c) => ({ value: String(c.id), label: c.name }))}
              />
            </div>
          )}

          {/* Branch Filter — SA and Company Admin */}
          {canFilterByBranch && (
            <div className="w-52">
              <SelectField
                placeholder={canFilterByCompany && !companyFilter ? 'Select company first' : 'All Branches'}
                value={branchFilter}
                onChange={(val) => setBranchFilter(val === undefined ? '' : val)}
                allowEmptyOption
                searchable={true}
                isLoading={branchesQuery.isLoading}
                disabled={canFilterByCompany && branches.length === 0 && !branchesQuery.isLoading}
                options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
              />
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStageFilter(null);
                setCompanyFilter('');
                setBranchFilter('');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md border border-slate-200 hover:border-red-200 transition-all whitespace-nowrap"
            >
              <Filter className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}

          {/* Refetch Loading Indicator */}
          {isFetching && !isLoading && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-md">
              <svg className="animate-spin h-3.5 w-3.5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs font-medium text-indigo-600">Filtering...</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main View ────────────────────────────────────────────────── */}
      {isLoading ? (
        viewMode === 'kanban' ? (
          <KanbanSkeleton stageCount={stages.length || 5} />
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <OpportunitySpreadsheet opportunities={[]} loadingState="loading" />
          </div>
        )
      ) : isError ? (
        <div className="bg-white rounded-lg border border-rose-200 shadow-sm p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-xl bg-rose-50 flex items-center justify-center text-rose-400">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-base">Failed to load opportunities</p>
            <p className="text-sm text-slate-500 mt-1">{error?.message || 'Something went wrong. Please try again.'}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        isSuperAdmin && !companyFilter ? (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-12 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-base">Select a Company</p>
              <p className="text-sm text-slate-500 mt-1">Opportunity pipelines and custom stages are managed per company. Select a company from the filters above to view the Kanban board.</p>
            </div>
          </div>
        ) : (
          <OpportunityKanban
            opportunities={opportunities}
            stages={stages}
            onCardClick={(opp) =>
              navigate(`/opportunities/${opp.id}`, {
                state: { leadName: opp.lead?.name || opp.opportunityName, opportunityName: opp.opportunityName },
              })
            }
            onStageChange={handleStageChange}
          />
        )
      ) : (
        <OpportunitySpreadsheet
          opportunities={opportunities}
          loadingState={tableLoadingState}
          onRowClick={(opp) =>
            navigate(`/opportunities/${opp.id}`, {
              state: { leadName: opp.lead?.name || opp.opportunityName, opportunityName: opp.opportunityName },
            })
          }
          onCloseClick={(opp) => setClosingOpportunity(opp)}
        />
      )}

      {/* ── Create Opportunity Slideover ──────────────────────────── */}
      <CreateOpportunitySlideover
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
        stages={stages}
        courses={courses}
        leads={leads}
      />

      {/* ── Opportunity Detail Drawer ─────────────────────────────── */}
      <OpportunityDetailDrawer
        opportunityId={selectedOpportunityId}
        isOpen={!!selectedOpportunityId}
        onClose={() => setSelectedOpportunityId(null)}
        onCloseOpportunityClick={(opp) => {
          setSelectedOpportunityId(null);
          setClosingOpportunity(opp);
        }}
      />

      {/* ── Close Opportunity Confirm Modal ──────────────────────── */}
      <ConfirmModal
        isOpen={!!closingOpportunity}
        onClose={() => {
          setClosingOpportunity(null);
          setPendingStageId(null);
          setCloseRemarks('');
        }}
        onConfirm={handleConfirmClose}
        title={`Close Opportunity: ${closingOpportunity?.opportunityName}`}
        description="Select the outcome status to close this sales opportunity."
        isLoading={closeMutation.isPending}
        confirmText="Confirm Outcome"
      >
        <div className="py-3 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Outcome Selection</label>
            <div className="grid grid-cols-3 gap-2">
              {['WON', 'LOST', 'CANCELLED'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setCloseOutcome(status)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    closeOutcome === status
                      ? status === 'WON'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : status === 'LOST'
                        ? 'bg-rose-50 border-rose-500 text-rose-700'
                        : 'bg-slate-100 border-slate-400 text-slate-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Closing Remarks / Notes</label>
            <textarea
              value={closeRemarks}
              onChange={(e) => setCloseRemarks(e.target.value)}
              placeholder="Enter closure details (e.g. Contract signed for ₹25,000 package or competitor selected)..."
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 min-h-[80px]"
            />
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
};

export default OpportunitiesPage;
