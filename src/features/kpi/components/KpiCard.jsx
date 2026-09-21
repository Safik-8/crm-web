// FrontEnd/src/features/kpi/components/KpiCard.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  User,
  Users,
  Edit2,
  Trash2,
  MoreVertical,
  Calendar,
} from 'lucide-react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useAuth } from '../../../app/providers/AuthProvider';
import { getRoleHierarchy } from '../../../lib/utils/roleHierarchy';
import { useDeleteKpiTarget } from '../hooks/useKpi';
import KpiEditDrawer from './KpiEditDrawer';
import ConfirmModal from '../../../shared/components/elements/ConfirmModal';
import { toast } from '../../../shared/utils/toast';

export default function KpiCard({ target, canDrill = true }) {
  const { user } = useAuth();
  const deleteMutation = useDeleteKpiTarget();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  if (!target) return null;

  const { isSuperAdmin, isCompanyWide, isBranchLevel } = getRoleHierarchy(user);
  const isCompanyAdmin = isCompanyWide && !isSuperAdmin;
  const isBranchManager = isBranchLevel;

  // Strict manager scope: Only Branch Managers/Admins can edit/delete targets within their own branch
  const targetBranchId = target.branchId || target.employee?.branchId || target.team?.branchId;
  const isTargetInMyBranch = targetBranchId ? targetBranchId === user?.branchId : false;

  const canEditTarget =
    isSuperAdmin ||
    (isCompanyAdmin && user?.companyId === target.companyId) ||
    (isBranchManager && isTargetInMyBranch);

  const {
    id,
    kpiType = 'LEAD',
    targetValue = 0,
    achievedValue = 0,
    remainingValue = 0,
    achievementPercentage = 0,
    statusColor = 'RED',
    duration = 'MONTHLY',
    endDate,
    employee,
    team,
    branch,
  } = target;

  const isRevenue = kpiType === 'REVENUE' || kpiType === 'SALES';
  const isConversion = kpiType === 'CONVERSION';

  const formattedTarget = isRevenue
    ? `₹${Number(targetValue).toLocaleString('en-IN')}`
    : isConversion
    ? `${targetValue}%`
    : Number(targetValue).toLocaleString('en-IN');

  const formattedAchieved = isRevenue
    ? `₹${Number(achievedValue).toLocaleString('en-IN')}`
    : isConversion
    ? `${achievedValue}%`
    : Number(achievedValue).toLocaleString('en-IN');

  const formattedRemaining = isRevenue
    ? `₹${Number(remainingValue).toLocaleString('en-IN')}`
    : isConversion
    ? `${remainingValue}%`
    : Number(remainingValue).toLocaleString('en-IN');

  // Status Styling Configuration (Sharp Enterprise Theme)
  const statusConfig = {
    GREEN: {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      dot: 'bg-emerald-600',
      bar: 'bg-emerald-600',
      icon: <CheckCircle2 size={12} className="text-emerald-700 shrink-0" />,
      label: 'Completed',
    },
    YELLOW: {
      badge: 'bg-amber-50 text-amber-800 border-amber-300',
      dot: 'bg-amber-600',
      bar: 'bg-amber-500',
      icon: <Clock size={12} className="text-amber-700 shrink-0" />,
      label: 'In Progress',
    },
    RED: {
      badge: 'bg-rose-50 text-rose-800 border-rose-300',
      dot: 'bg-rose-600',
      bar: 'bg-rose-600',
      icon: <AlertTriangle size={12} className="text-rose-700 shrink-0" />,
      label: 'Below Target',
    },
  };

  const currentStatus = statusConfig[statusColor] || statusConfig.RED;
  const progressPct = Math.min(100, Math.max(0, Number(achievementPercentage || 0)));

  const isTeam = target.scopeType === 'TEAM' || Boolean((target.teamId || target.team) && !target.employeeId);
  const entityName = isTeam
    ? target.team?.name || 'Sales Team'
    : target.employee?.name || target.branch?.name || 'Assigned Employee';

  // KPI Type Badge Color
  const getKpiBadgeStyle = (type) => {
    switch (type) {
      case 'REVENUE':
      case 'SALES':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'LEAD':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'OPPORTUNITY':
        return 'bg-orange-50 text-orange-800 border-orange-300';
      case 'CUSTOMER':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'CONVERSION':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const durationFormatted = duration ? duration.charAt(0) + duration.slice(1).toLowerCase() : 'Monthly';

  const handleMenuOpen = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteConfirm = async () => {
    const toastId = toast.loading('Deleting target...');
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Target deleted successfully', { id: toastId });
      setIsDeleteOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete target', { id: toastId });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-none p-4 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-3.5 group">
      {/* ── Top Header: Title & Status ───────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          {/* KPI Type Badge + Title */}
          <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded-none shrink-0 ${getKpiBadgeStyle(kpiType)}`}>
              {kpiType}
            </span>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight truncate">
              {kpiType.charAt(0) + kpiType.slice(1).toLowerCase()} Target
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              • {durationFormatted}
            </span>
          </div>

          {/* Status Badge + Action Menu */}
          <div className="flex items-center gap-1 shrink-0">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 border rounded-none ${currentStatus.badge}`}>
              {currentStatus.icon}
              <span>{currentStatus.label}</span>
            </span>

            {canEditTarget && (
              <>
                <button
                  type="button"
                  onClick={handleMenuOpen}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-none transition-colors cursor-pointer"
                  title="Target Actions"
                >
                  <MoreVertical size={15} />
                </button>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  elevation={0}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{
                    className:
                      'mt-1 shadow-lg border border-slate-200 rounded-none bg-white min-w-[140px] py-1 text-slate-700 font-sans',
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      setIsEditOpen(true);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700 flex items-center gap-2 rounded-none"
                  >
                    <Edit2 size={13} className="text-slate-400" />
                    <span>Edit Target</span>
                  </MenuItem>

                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      setIsDeleteOpen(true);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold hover:bg-rose-50 text-rose-600 flex items-center gap-2 border-t border-slate-100 rounded-none"
                  >
                    <Trash2 size={13} className="text-rose-500" />
                    <span>Delete Target</span>
                  </MenuItem>
                </Menu>
              </>
            )}
          </div>
        </div>

        {/* Scope & Assignee Row */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 flex-wrap">
          {isTeam ? (
            <>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-800 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-none shrink-0">
                <Users size={11} className="text-orange-600" />
                <span>Team Target</span>
              </span>
              {target.team?.name && (
                <span className="font-bold text-slate-800 truncate max-w-[200px]">
                  {target.team.name}
                </span>
              )}
            </>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-none shrink-0">
              <User size={11} className="text-slate-500" />
              <span>Individual Target</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Middle: Metrics Stats Bar ─────────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-none grid grid-cols-3 divide-x divide-slate-200">
        <div className="p-2.5 text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
            Target
          </span>
          <span className="text-sm font-bold text-slate-900 truncate block" title={formattedTarget}>
            {formattedTarget}
          </span>
        </div>
        <div className="p-2.5 text-center bg-white">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
            Achieved
          </span>
          <span
            className={`text-sm font-black truncate block ${
              achievementPercentage >= 100 ? 'text-emerald-700' : 'text-orange-600'
            }`}
            title={formattedAchieved}
          >
            {formattedAchieved}
          </span>
        </div>
        <div className="p-2.5 text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
            Remaining
          </span>
          <span className="text-sm font-bold text-slate-600 truncate block" title={formattedRemaining}>
            {formattedRemaining}
          </span>
        </div>
      </div>

      {/* ── Progress Section ─────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
            <TrendingUp size={11} className="text-slate-400" />
            <span>{isTeam ? 'Team Progress' : 'Individual Progress'}</span>
          </span>
          <span className="font-bold text-slate-900 text-[11px] font-mono">
            {achievementPercentage}%
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-none border border-slate-200 overflow-hidden">
          <div
            className={`h-full rounded-none transition-all duration-500 ${currentStatus.bar}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium flex items-center gap-1 text-[11px]">
          <Calendar size={12} className="text-slate-400" />
          <span>Ends: {endDate ? new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
        </span>
        {canDrill && (
          <Link
            to={`/kpi/${id}`}
            className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 hover:underline transition-colors text-xs"
          >
            <span>View Details</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* Edit Target Drawer */}
      {canEditTarget && (
        <KpiEditDrawer
          target={target}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
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

