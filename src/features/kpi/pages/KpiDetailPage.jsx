// FrontEnd/src/features/kpi/pages/KpiDetailPage.jsx

import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Target, ArrowLeft, Calendar, User, Users, Building2, TrendingUp, AlertCircle, CheckCircle2, Clock, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { getRoleHierarchy } from '../../../lib/utils/roleHierarchy';
import { useKpiDetail, useDeleteKpiTarget } from '../hooks/useKpi';
import GlobalLoader from '../../../shared/components/elements/GlobalLoader';
import Skeleton from '../../../shared/components/elements/Skeleton';
import Button from '../../../shared/components/elements/Button';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import KpiEditDrawer from '../components/KpiEditDrawer';
import { CrmBarChart, CrmLineChart } from '../../../shared/components/charts';
import { toast } from '../../../shared/utils/toast';

export default function KpiDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const deleteMutation = useDeleteKpiTarget();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { isSuperAdmin, isCompanyWide, isBranchLevel, isPersonal } = getRoleHierarchy(user);
  const isIse = isPersonal;
  // Use tier-aware flags: isCompanyWide includes Super Admin + Company Admin, isBranchLevel is ONLY Branch Manager tier
  const isCompanyAdmin = isCompanyWide && !isSuperAdmin;
  const isBranchManager = isBranchLevel;

  const { data: detailResponse, isLoading, isError, error, refetch } = useKpiDetail(id, {
    enabled: Boolean(id) && !isIse,
  });

  const target = detailResponse?.data || detailResponse || {};

  // Strict manager scope: Only Branch Managers/Admins can edit/delete targets within their own branch
  const targetBranchId = target.branchId || target.employee?.branchId || target.team?.branchId;
  // Branch Managers must have a matching branchId. If target has no branchId, only Company Admin/Super Admin can manage it.
  const isTargetInMyBranch = targetBranchId ? targetBranchId === user?.branchId : false;

  const canEditTarget =
    isSuperAdmin ||
    (isCompanyAdmin && user?.companyId === target.companyId) ||
    (isBranchManager && isTargetInMyBranch);

  const handleDeleteConfirm = async () => {
    const toastId = toast.loading('Deleting target...');
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Target deleted successfully', { id: toastId });
      setIsDeleteOpen(false);
      navigate('/kpi-analytics');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete target', { id: toastId });
    }
  };

  if (isIse) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-8 rounded-none text-center max-w-lg mx-auto my-12 space-y-3">
        <AlertCircle size={36} className="mx-auto text-rose-600" />
        <h3 className="text-lg font-bold">Access Restricted</h3>
        <p className="text-xs text-rose-600">
          ISE role users are restricted from inspecting detailed target breakdowns.
        </p>
        <Link to="/my-performance" className="inline-block pt-2 text-xs font-bold text-rose-700 underline">
          Back to My Performance
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <div className="bg-white border border-slate-200/80 p-6 rounded-none shadow-2xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 bg-slate-50 border border-slate-100 space-y-2">
                <Skeleton className="h-3 w-20 mx-auto" />
                <Skeleton className="h-7 w-24 mx-auto" />
              </div>
            ))}
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !target) {
    const isForbidden = error?.response?.status === 403 || error?.message?.includes('Forbidden') || error?.message?.includes('restricted');
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-8 rounded-none text-center max-w-lg mx-auto my-12 space-y-3 shadow-2xs">
        <AlertCircle size={36} className="mx-auto text-rose-600" />
        <h3 className="text-lg font-bold">{isForbidden ? 'Access Restricted (403)' : 'Target Detail Error'}</h3>
        <p className="text-xs text-rose-600">
          {error?.response?.data?.message || error?.message || 'You do not have permission to inspect this KPI target.'}
        </p>
        <Link to="/kpi-analytics" className="inline-block pt-2 text-xs font-bold text-rose-700 underline">
          Back to KPI Analytics
        </Link>
      </div>
    );
  }

  const {
    kpiType,
    targetValue,
    achievedValue,
    remainingValue,
    achievementPercentage,
    statusColor,
    duration,
    startDate,
    endDate,
    employee,
    team,
    branch,
    createdBy,
  } = target;

  const formattedTarget = kpiType === 'REVENUE' || kpiType === 'SALES'
    ? `₹${Number(targetValue).toLocaleString('en-IN')}`
    : kpiType === 'CONVERSION'
    ? `${targetValue}%`
    : Number(targetValue).toLocaleString('en-IN');

  const formattedAchieved = kpiType === 'REVENUE' || kpiType === 'SALES'
    ? `₹${Number(achievedValue).toLocaleString('en-IN')}`
    : kpiType === 'CONVERSION'
    ? `${achievedValue}%`
    : Number(achievedValue).toLocaleString('en-IN');

  const formattedRemaining = kpiType === 'REVENUE' || kpiType === 'SALES'
    ? `₹${Number(remainingValue).toLocaleString('en-IN')}`
    : kpiType === 'CONVERSION'
    ? `${remainingValue}%`
    : Number(remainingValue).toLocaleString('en-IN');

  const statusMap = {
    GREEN: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500' },
    YELLOW: { label: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'bg-amber-500' },
    RED: { label: 'Below Target', color: 'bg-rose-50 text-rose-700 border-rose-200', bar: 'bg-rose-500' },
  };
  const currentStatus = statusMap[statusColor] || statusMap.RED;

  const progressPct = Math.min(100, Math.max(0, achievementPercentage));

  const barChartData = [
    {
      name: 'Target Goal',
      Value: targetValue,
      formatted: formattedTarget,
    },
    {
      name: 'Live Achieved',
      Value: achievedValue,
      formatted: formattedAchieved,
    },
    {
      name: 'Remaining Gap',
      Value: remainingValue,
      formatted: formattedRemaining,
    },
  ];

  const barSeries = [
    {
      dataKey: 'Value',
      fill: '#f97316',
      radius: [6, 6, 0, 0],
    },
  ];

  const cellColors = [
    '#6366f1', // Indigo for Target Goal
    statusColor === 'GREEN' ? '#10b981' : '#f97316', // Emerald or Orange for Achieved
    '#94a3b8', // Slate for Remaining Gap
  ];

  const isTeam = target.scopeType === 'TEAM' || Boolean((target.teamId || target.team) && !target.employeeId);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {isTeam ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-none">
                <Users size={13} className="text-orange-600" />
                <span>Sales Team Target</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 rounded-none">
                <User size={13} className="text-slate-500" />
                <span>Individual Rep Target</span>
              </span>
            )}
            <span className="text-[11px] font-semibold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-none">
              {duration}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Target className="text-orange-500" size={24} />
            <span>{kpiType} Target Detail</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Detailed breakdown, target metrics, timeline & live achievement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-none text-xs font-bold border ${currentStatus.color}`}>
            {currentStatus.label}
          </div>

          {canEditTarget && (
            <div className="flex items-center gap-2">
              <Button
                variant="outlined"
                size="small"
                startIcon={<Edit2 size={14} />}
                onClick={() => setIsEditOpen(true)}
              >
                Edit Target
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<Trash2 size={14} className="text-rose-500" />}
                onClick={() => setIsDeleteOpen(true)}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Target Progress Overview Card */}
      <div className="bg-white border border-slate-200/80 rounded-none p-6 shadow-2xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-none">
            <span className="text-xs font-bold text-slate-500 uppercase block">Metric Type</span>
            <span className="text-lg font-bold text-slate-900 mt-1 block">{kpiType}</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-none">
            <span className="text-xs font-bold text-slate-500 uppercase block">Target Value</span>
            <span className="text-lg font-bold text-slate-900 mt-1 block">{formattedTarget}</span>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-100 rounded-none">
            <span className="text-xs font-bold text-orange-700 uppercase block">Achieved Value</span>
            <span className="text-lg font-extrabold text-orange-600 mt-1 block">{formattedAchieved}</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-none">
            <span className="text-xs font-bold text-slate-500 uppercase block">Remaining</span>
            <span className="text-lg font-bold text-slate-700 mt-1 block">{formattedRemaining}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Achievement Completion Rate</span>
            <span className="font-extrabold text-orange-600 text-sm">{achievementPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${currentStatus.bar}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Target Metadata & Assignment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-none p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
            Assignment Details
          </h3>
          <div className="space-y-3 text-xs">
            {isTeam ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Assigned Team:</span>
                  <span className="font-semibold text-slate-800">{team?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Team Code:</span>
                  <span className="font-semibold text-slate-800">{team?.code || 'N/A'}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Assigned Employee:</span>
                  <span className="font-semibold text-slate-800">{employee?.name || 'N/A (General Target)'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Employee Code:</span>
                  <span className="font-semibold text-slate-800">{employee?.employeeId || 'N/A'}</span>
                </div>
                {team?.name && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Team:</span>
                    <span className="font-semibold text-slate-800">{team.name}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Branch:</span>
              <span className="font-semibold text-slate-800">{branch?.name || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-none p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
            Timeline & Period
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Duration:</span>
              <span className="font-semibold text-slate-800 uppercase">{duration}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Start Date:</span>
              <span className="font-semibold text-slate-800">{new Date(startDate).toLocaleDateString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">End Date:</span>
              <span className="font-semibold text-slate-800">{new Date(endDate).toLocaleDateString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Defined By:</span>
              <span className="font-semibold text-slate-800">{createdBy?.name || 'System Admin'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target vs Achievement Comparative Breakdown Bar Chart */}
      <div className="bg-white border border-slate-200/80 rounded-none p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Target Performance Breakdown (Goal vs Achieved vs Gap)
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Direct comparison of assigned goal, live achievement, and remaining gap.
            </p>
          </div>
          <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200/60 px-2.5 py-1">
            {achievementPercentage}% Achieved
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <CrmBarChart
            data={barChartData}
            xKey="name"
            bars={barSeries}
            cellColors={cellColors}
            height="100%"
            barSize={48}
            formatYAxis={(val) =>
              kpiType === 'REVENUE' || kpiType === 'SALES'
                ? `₹${Number(val) >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                : val
            }
          />
        </div>
      </div>

      {/* Edit Target Drawer — only mount when user has edit permission */}
      {canEditTarget && (
        <KpiEditDrawer
          target={target}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={() => refetch()}
        />
      )}

      {/* Delete Confirmation Modal — only mount when user has edit permission */}
      {canEditTarget && (
        <ConfirmModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Target"
          message={`Are you sure you want to delete this ${target.kpiType} target? This action will cancel active tracking.`}
          confirmText="Delete Target"
          type="error"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
