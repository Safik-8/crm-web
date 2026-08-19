// src/features/teams/components/TeamMemberProfileDrawer.jsx

import React from 'react';
import { User, Mail, Shield, CheckCircle2, XCircle, ClipboardList, Calendar } from 'lucide-react';
import Drawer from '../../../shared/components/elements/Drawer';

/**
 * TeamMemberProfileDrawer
 * 
 * Read-only right-side drawer reusing shared Drawer component to display
 * a team member's profile, role, status, and lead metrics without administrative controls.
 */
const TeamMemberProfileDrawer = ({ isOpen, onClose, member, leadCount = 0 }) => {
  if (!member) return null;

  const user = member.user || {};
  const active = user.status === 'ACTIVE';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Member Profile"
      subtitle="Team Member Details"
    >
      <div className="space-y-6">

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

        {/* Footer Action */}
        <div className="pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </Drawer>
  );
};

export default TeamMemberProfileDrawer;
