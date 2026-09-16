import React from 'react';
import { CheckCircle2, XCircle, Building, MapPin, Users, User, ShieldAlert, Sparkles } from 'lucide-react';

export const SCOPE_CONFIGS = {
  COMPANY_ADMIN_TO_BRANCH_MANAGER: {
    key: 'company',
    scopeName: 'Company-Wide Scope',
    badgeText: 'All Branches & Teams',
    icon: Building,
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    headerBg: 'bg-gradient-to-r from-indigo-50/90 via-indigo-50/40 to-slate-50 border-indigo-100',
    accentColor: 'text-indigo-600',
    summaryText: 'Users assigned to this role have full visibility across all company branches, team pods, and employee directories.',
    allows: [
      'All company branches, physical locations & regional hubs',
      'All users, leads, opportunities, deals & customer records',
      'Company-wide KPI analytics, revenue metrics & financial targets'
    ],
    restricts: []
  },
  BRANCH_MANAGER_TO_BDE: {
    key: 'branch',
    scopeName: 'Branch-Level Scope',
    badgeText: 'Assigned Branch Only',
    icon: MapPin,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    headerBg: 'bg-gradient-to-r from-blue-50/90 via-blue-50/40 to-slate-50 border-blue-100',
    accentColor: 'text-blue-600',
    summaryText: 'Data access is strictly scoped to the user\'s assigned branch location. They can manage all branch teams and records.',
    allows: [
      'Records within their designated branch location',
      'All team pods, sales reps, leads & deals in their branch',
      'Branch-level KPI targets and conversion performance'
    ],
    restricts: [
      'Cannot view or modify data from other company branch locations'
    ]
  },
  BDE_TO_ISE: {
    key: 'team',
    scopeName: 'Team Pod Scope',
    badgeText: 'Assigned Team Members & Self',
    icon: Users,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    headerBg: 'bg-gradient-to-r from-emerald-50/90 via-emerald-50/40 to-slate-50 border-emerald-100',
    accentColor: 'text-emerald-600',
    summaryText: 'Data access is limited to the user and all members within their active team pod (e.g. Team Lead / Senior Consultant).',
    allows: [
      'Records assigned to self and assigned team pod members',
      'Team lead pipeline oversight and member follow-up tracking',
      'Team pod conversion scores and quota achievements'
    ],
    restricts: [
      'Cannot view other team pods or branch-wide sales data'
    ]
  },
  BELOW_ISE: {
    key: 'own',
    scopeName: 'Personal Scope Only',
    badgeText: 'Own Assigned Records Only',
    icon: User,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    headerBg: 'bg-gradient-to-r from-amber-50/90 via-amber-50/40 to-slate-50 border-amber-100',
    accentColor: 'text-amber-600',
    summaryText: 'Data access is strictly restricted to records directly owned by or assigned to this individual user account.',
    allows: [
      'Strictly own assigned leads, deals, opportunities & follow-ups',
      'Personal call logs, notes & individual activity history',
      'Personal target achievements and conversion scorecards'
    ],
    restricts: [
      'Cannot view team pod records or branch-wide data'
    ]
  }
};

/**
 * Helper to resolve bracket from rank if bracket is not directly supplied.
 */
export const resolveBracketFromRank = (rank) => {
  const r = Number(rank || 0);
  if (r >= 61) return 'COMPANY_ADMIN_TO_BRANCH_MANAGER';
  if (r >= 41) return 'BRANCH_MANAGER_TO_BDE';
  if (r >= 21) return 'BDE_TO_ISE';
  return 'BELOW_ISE';
};

const RoleScopePreview = ({ hierarchyBracket, rank }) => {
  const bracket = hierarchyBracket || resolveBracketFromRank(rank);
  const config = SCOPE_CONFIGS[bracket] || SCOPE_CONFIGS.COMPANY_ADMIN_TO_BRANCH_MANAGER;
  const IconComponent = config.icon;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
      {/* Top Banner */}
      <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${config.headerBg}`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={`p-2 rounded-xl bg-white shadow-2xs border border-slate-200/80 shrink-0 ${config.accentColor}`}>
            <IconComponent size={18} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                {config.scopeName}
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${config.badgeClass}`}>
                {config.badgeText}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">
              {config.summaryText}
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Allowed vs Restrictions Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/50">
        {/* Included Data Scope */}
        <div className="bg-white rounded-lg p-3.5 border border-slate-200/80 shadow-2xs space-y-2">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 pb-1 border-b border-slate-100">
            <CheckCircle2 size={14} className="text-emerald-500" />
            Allowed Data Access
          </span>
          <div className="space-y-2 pt-0.5">
            {config.allows.map((item, idx) => (
              <div key={`allow-${idx}`} className="flex items-start gap-2 text-xs text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span className="font-medium leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Restrictions & Boundaries */}
        <div className="bg-white rounded-lg p-3.5 border border-slate-200/80 shadow-2xs space-y-2">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 pb-1 border-b border-slate-100">
            <ShieldAlert size={14} className={config.restricts.length > 0 ? 'text-amber-500' : 'text-slate-400'} />
            Boundary & Restrictions
          </span>
          <div className="space-y-2 pt-0.5">
            {config.restricts.length > 0 ? (
              config.restricts.map((item, idx) => (
                <div key={`restrict-${idx}`} className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50/60 p-2 rounded border border-rose-100">
                  <XCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{item}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2 bg-slate-50 rounded border border-slate-100">
                <Sparkles size={14} className="text-indigo-400 shrink-0" />
                <span>No organizational data restrictions (Company-wide unrestricted visibility).</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleScopePreview;
