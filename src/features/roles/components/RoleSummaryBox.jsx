import React from 'react';
import { Layers, PlusCircle, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import { resolveBracketFromRank } from './RoleScopePreview';

const SCOPE_NAMES = {
  COMPANY_ADMIN_TO_BRANCH_MANAGER: {
    label: 'Company-Wide Scope',
    desc: 'All branches, teams & company records',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  BRANCH_MANAGER_TO_BDE: {
    label: 'Branch-Level Scope',
    desc: 'Assigned branch records & team pods',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  BDE_TO_ISE: {
    label: 'Team Pod Scope',
    desc: 'Assigned team members & own records',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  BELOW_ISE: {
    label: 'Personal Scope Only',
    desc: 'Strictly own assigned records only',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
  }
};

const RoleSummaryBox = ({
  roleName,
  hierarchyBracket,
  rank,
  permissions = {},
  totalModulesCount = 28,
  stepNumber = 3
}) => {
  const bracket = hierarchyBracket || resolveBracketFromRank(rank);
  const scopeInfo = SCOPE_NAMES[bracket] || SCOPE_NAMES.COMPANY_ADMIN_TO_BRANCH_MANAGER;

  // Compute active counts
  let viewCount = 0;
  let createCount = 0;
  let editCount = 0;
  let deleteCount = 0;

  Object.values(permissions).forEach(p => {
    if (p?.canView) viewCount++;
    if (p?.canCreate) createCount++;
    if (p?.canEdit) editCount++;
    if (p?.canDelete) deleteCount++;
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[11px] font-bold">
            {stepNumber}
          </span>
          <div>
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Configuration Summary & Review
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Live summary of assigned data visibility scope and activated module permissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] text-slate-500 font-medium">Data Scope:</span>
          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${scopeInfo.badgeClass}`}>
            {scopeInfo.label}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Modules enabled */}
        <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/70">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
            <Layers size={13} className="text-indigo-500" />
            <span>Active Modules</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-bold text-slate-800">{viewCount}</span>
            <span className="text-[11px] text-slate-400">/ {totalModulesCount}</span>
          </div>
        </div>

        {/* Create Privileges */}
        <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/70">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
            <PlusCircle size={13} className="text-emerald-500" />
            <span>Create Actions</span>
          </div>
          <div className="mt-1">
            <span className="text-base font-bold text-emerald-700">{createCount}</span>
            <span className="text-[11px] text-slate-400 ml-1">modules</span>
          </div>
        </div>

        {/* Edit Privileges */}
        <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/70">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
            <Edit3 size={13} className="text-blue-500" />
            <span>Edit Actions</span>
          </div>
          <div className="mt-1">
            <span className="text-base font-bold text-blue-700">{editCount}</span>
            <span className="text-[11px] text-slate-400 ml-1">modules</span>
          </div>
        </div>

        {/* Delete Privileges */}
        <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/70">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
            <Trash2 size={13} className="text-rose-500" />
            <span>Delete Actions</span>
          </div>
          <div className="mt-1">
            <span className="text-base font-bold text-rose-700">{deleteCount}</span>
            <span className="text-[11px] text-slate-400 ml-1">modules</span>
          </div>
        </div>
      </div>

      {/* Dynamic explanation message */}
      <div className="mt-3 flex items-start gap-2 text-xs text-slate-600 bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-100/80">
        <CheckCircle2 size={15} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-800">
            {roleName ? `Role "${roleName}"` : 'This role'}
          </span>{' '}
          is configured with <strong className="text-indigo-600 font-bold">{viewCount} feature modules</strong> under{' '}
          <strong className="text-slate-800">{scopeInfo.label}</strong> ({scopeInfo.desc}).
        </div>
      </div>
    </div>
  );
};

export default RoleSummaryBox;
