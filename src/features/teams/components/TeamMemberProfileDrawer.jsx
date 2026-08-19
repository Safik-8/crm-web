// src/features/teams/components/TeamMemberProfileDrawer.jsx

import React from 'react';
import { X, User, Mail, Shield, CheckCircle2, XCircle, ClipboardList, Calendar } from 'lucide-react';

/**
 * TeamMemberProfileDrawer
 * 
 * Read-only right-side drawer displaying a team member's profile, role, status,
 * and lead metrics without any edit/delete administrative controls.
 */
const TeamMemberProfileDrawer = ({ isOpen, onClose, member, leadCount = 0 }) => {
  if (!isOpen || !member) return null;

  const user = member.user || {};
  const active = user.status === 'ACTIVE';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
              <User size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 leading-tight">Member Profile</h2>
              <p className="text-[11px] text-slate-400 font-medium">Team Member Details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* User Hero Badge */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center text-lg font-black shrink-0 shadow-sm">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-slate-900 truncate">{user.name || 'Unnamed Member'}</h3>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{user.email || 'No email'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  {member.memberRole || 'Member'}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border
                  ${active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  {active ? <CheckCircle2 size={11} className="text-emerald-500" /> : <XCircle size={11} className="text-slate-400" />}
                  {active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Metrics Card */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Active Leads</span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-slate-800">{leadCount}</span>
                <ClipboardList size={18} className="text-orange-500" />
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Role Type</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 truncate">{member.memberRole || 'ISE'}</span>
                <Shield size={18} className="text-blue-500" />
              </div>
            </div>
          </div>

          {/* Detailed Information List */}
          <div className="space-y-4 pt-2">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Member Details
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                  <User size={14} className="text-slate-400" />
                  <span>Employee ID</span>
                </div>
                <span className="text-xs font-bold text-slate-800 font-mono">
                  {user.employeeId || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                  <Mail size={14} className="text-slate-400" />
                  <span>Email Address</span>
                </div>
                <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                  {user.email || '—'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                  <Shield size={14} className="text-slate-400" />
                  <span>Member Role</span>
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {member.memberRole || 'ISE Member'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                  <Calendar size={14} className="text-slate-400" />
                  <span>Team Joined Date</span>
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {member.createdAt ? new Date(member.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }) : 'Active Member'}
                </span>
              </div>
            </div>
          </div>

          {/* Read-only Notice */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-medium leading-relaxed">
            💡 This profile view is read-only. Member roster management (add/remove) is handled in the system Admin module.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </>
  );
};

export default TeamMemberProfileDrawer;
