// src/features/teams/components/MemberDetailDrawer.jsx

import React from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Calendar,
  Briefcase,
  Users2,
  CheckCircle2,
  AlertCircle,
  Target,
  Award,
  Sparkles,
  MapPin
} from 'lucide-react';
import { DynamicFormSlideover } from '../../../shared/components/elements/DynamicFormSlideover';
import Button from '../../../shared/components/elements/Button';

/**
 * MemberDetailDrawer
 * Displays comprehensive details of a team member in a sliding right drawer:
 * - Profile & Contact info
 * - Team role & joined date
 * - Assigned leads count & workload stats in the active team
 */
const MemberDetailDrawer = ({
  isOpen,
  onClose,
  member = null,
  team = null,
  teamLeads = [],
  isTeamLeader = false,
  onAssignToMember = null,
}) => {
  if (!member) return null;

  const user = member.user || {};
  const primaryRole = user.userRoles?.find(ur => ur.isPrimary) || user.userRoles?.[0];
  const roleName = primaryRole?.role?.name || member.memberRole || 'Team Member';

  // Leads statistics for this member in this team
  const memberLeads = teamLeads.filter(l => Number(l.assignedToId) === Number(member.userId));
  const highPriorityCount = memberLeads.filter(l => l.priority === 'HIGH').length;
  const convertedCount = memberLeads.filter(l => (l.opportunities && l.opportunities.length > 0) || l.isConverted).length;

  const DetailItem = ({ icon: Icon, label, value, className = '' }) => (
    <div className={`flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0 ${className}`}>
      {Icon && <Icon size={15} className="text-slate-400 mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none">
          {label}
        </p>
        <p className="text-[13px] font-semibold text-slate-700 leading-tight mt-1.5 break-words">
          {value || <span className="text-slate-300 font-semibold">—</span>}
        </p>
      </div>
    </div>
  );

  return (
    <DynamicFormSlideover
      isOpen={isOpen}
      onClose={onClose}
      title="Team Member Profile"
      subtitle={`Comprehensive details for ${user.name || 'Team Member'}`}
      icon={User}
      showFooter={true}
      cancelText="Close Details"
      width={{ xs: '100%', sm: 480, md: 540 }}
      customFooter={
        <div className="flex items-center justify-between w-full">
          <Button variant="outlined" size="small" onClick={onClose}>
            Close
          </Button>
          {isTeamLeader && onAssignToMember && (
            <Button
              size="small"
              onClick={() => {
                onClose();
                onAssignToMember(member);
              }}
            >
              <span className="flex items-center gap-1.5">
                <Briefcase size={14} />
                Assign Leads to {user.name?.split(' ')[0] || 'Member'}
              </span>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6 pb-6">
        {/* Banner Card */}
        <div className="p-4 bg-gradient-to-br from-slate-50 to-orange-50/40 border border-slate-200 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center bg-orange-600 text-white text-xl font-black shadow-sm uppercase overflow-hidden shrink-0 rounded-none">
            {user.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              user.firstName?.charAt(0) || user.name?.charAt(0) || 'M'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-slate-800 text-[16px] leading-tight truncate">
              {user.name || `${user.firstName || ''} ${user.lastName || ''}`}
            </h4>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 uppercase tracking-wider">
                {member.memberRole || roleName}
              </span>
              <span className="text-[11px] text-slate-400 font-mono font-bold">
                {user.employeeId || 'ID: —'}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 text-emerald-700 bg-emerald-50 border border-emerald-200">
                <CheckCircle2 size={10} /> Active
              </span>
            </div>
          </div>
        </div>

        {/* Workload Stats Card */}
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-orange-600 border-b border-orange-100 pb-1.5 mb-3 flex items-center gap-1.5">
            <Target size={13} className="text-orange-500" />
            Current Team Workload
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 border border-slate-200">
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
                Assigned
              </span>
              <span className="text-lg font-extrabold text-blue-700 block mt-0.5">
                {memberLeads.length}
              </span>
              <span className="text-[10px] text-slate-400">Total leads</span>
            </div>
            <div className="bg-slate-50 p-3 border border-slate-200">
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
                High Priority
              </span>
              <span className="text-lg font-extrabold text-rose-700 block mt-0.5">
                {highPriorityCount}
              </span>
              <span className="text-[10px] text-slate-400">Urgent leads</span>
            </div>
            <div className="bg-slate-50 p-3 border border-slate-200">
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
                Converted
              </span>
              <span className="text-lg font-extrabold text-emerald-700 block mt-0.5">
                {convertedCount}
              </span>
              <span className="text-[10px] text-slate-400">Opportunities</span>
            </div>
          </div>
        </div>

        {/* Section: Team Details */}
        <div className="space-y-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-orange-600 border-b border-orange-100 pb-1.5 mb-2 flex items-center gap-1.5">
            <Users2 size={13} className="text-orange-500" />
            Team Assignment
          </h3>
          <DetailItem
            icon={Users2}
            label="Assigned Team"
            value={team ? `${team.name} (${team.code || '—'})` : 'Active Team'}
          />
          <DetailItem
            icon={Shield}
            label="Team Function"
            value={member.memberRole ? `${member.memberRole} (Individual Sales Executive)` : 'Member'}
          />
          <DetailItem
            icon={Calendar}
            label="Joined Team On"
            value={member.joinedAt ? new Date(member.joinedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'Active Member'}
          />
        </div>

        {/* Section: Employment Details */}
        <div className="space-y-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-orange-600 border-b border-orange-100 pb-1.5 mb-2 flex items-center gap-1.5">
            <Briefcase size={13} className="text-orange-500" />
            Employment & Branch
          </h3>
          <DetailItem
            icon={Shield}
            label="System Role"
            value={roleName}
          />
          <DetailItem
            icon={Building2}
            label="Branch"
            value={user.branch?.name || team?.branch?.name || 'Company Wide'}
          />
          <DetailItem
            icon={User}
            label="Reporting Manager"
            value={user.reportingManager?.name ? `${user.reportingManager.name} (${user.reportingManager.email})` : 'Branch Manager / BDE'}
          />
          <DetailItem
            icon={Calendar}
            label="Joining Date"
            value={user.joiningDate ? new Date(user.joiningDate).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Not Specified'}
          />
        </div>

        {/* Section: Contact Details */}
        <div className="space-y-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-orange-600 border-b border-orange-100 pb-1.5 mb-2 flex items-center gap-1.5">
            <Mail size={13} className="text-orange-500" />
            Contact Information
          </h3>
          <DetailItem
            icon={Mail}
            label="Email Address"
            value={user.email}
          />
          <DetailItem
            icon={Phone}
            label="Mobile Number"
            value={user.mobileNumber || user.mobile}
          />
          {user.profile?.emergencyContact && (
            <DetailItem
              icon={Phone}
              label="Emergency Contact"
              value={user.profile.emergencyContact}
            />
          )}
          {user.profile?.city && (
            <DetailItem
              icon={MapPin}
              label="Location"
              value={`${user.profile.city}${user.profile.state ? `, ${user.profile.state}` : ''}`}
            />
          )}
        </div>
      </div>
    </DynamicFormSlideover>
  );
};

export default MemberDetailDrawer;
