// src/features/leads/components/LeadDetailDrawer.jsx

import React, { useEffect, useState, useRef } from 'react';
import {
  X, Phone, Calendar, Compass, Tag, User, Mail, DollarSign,
  MapPin, Award, ShieldAlert, History, MessageSquare,
  ClipboardList, UserCheck, GitBranch, CalendarClock
} from 'lucide-react';
import CommentThread from '../../activities/components/CommentThread';
import { useLeadQuery } from '../hooks/useLeads';

// Extracted Sub-Tabs (Sprint 4 Refactoring)
import NotesTab from './drawer/NotesTab';
import TimelineTab from './drawer/TimelineTab';
import StageHistoryTab from './drawer/StageHistoryTab';
import FollowupsTab from './drawer/FollowupsTab';

/**
 * LeadDetailDrawer — Slide-over drawer component displaying comprehensive lead metadata,
 * assigned user/branch scope, notes, activities, timeline logs, and stage history.
 *
 * @param {Object} props
 * @param {Object} props.lead - Initial lead data object
 * @param {string} [props.stageName] - Optional display name of the current stage
 * @param {Function} props.onClose - Callback invoked when drawer is closed
 */
const LeadDetailDrawer = ({ lead: initialLead, stageName, onClose }) => {
  const [activeTab, setActiveTab] = useState('comments');
  const tabSectionRef = useRef(null);
  const { data: leadRes } = useLeadQuery(initialLead?.id);
  const lead = leadRes?.data?.lead || leadRes?.lead || initialLead;

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    setTimeout(() => {
      tabSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 30);
  };

  if (!lead) return null;

  // Prevent body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const date = lead.createdAt
    ? new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : lead.date
    ? new Date(lead.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const locationStr = [lead.city, lead.state, lead.country].filter(Boolean).join(', ') || '—';

  const contactDetails = [
    { icon: Phone,      label: 'Mobile',            value: lead.mobile || '—' },
    { icon: Phone,      label: 'Alt Contact',       value: lead.alternateMobile || '—' },
    { icon: Mail,       label: 'Email',            value: lead.email || '—' },
    { icon: Calendar,   label: 'Created Date',      value: date },
    { icon: MapPin,     label: 'Location',          value: locationStr, colSpan: 'sm:col-span-2 md:col-span-2 lg:col-span-2' },
  ];

  const interestDetails = [
    { icon: Compass,    label: 'Source',            value: lead.source?.name || '—' },
    { icon: Award,      label: 'Interested Course', value: lead.course?.name || lead.interestedFor || lead.interested_for || '—' },
    { icon: DollarSign, label: 'Budget',            value: lead.budget !== null && lead.budget !== undefined ? `₹${lead.budget.toLocaleString('en-IN')}` : '—' },
    { icon: ShieldAlert,label: 'Priority',          value: lead.priority || 'MEDIUM' },
  ];

  const assignmentDetails = [
    { icon: User,       label: 'Assigned User',     value: lead.assignedTo?.name || 'Unassigned' },
    { icon: UserCheck,  label: 'Reporting Manager',  value: lead.reportingManager?.name || '—' },
    { icon: Tag,        label: 'Assigned Team',     value: lead.assignedTeam?.name || '—' },
    { icon: MapPin,     label: 'Branch',            value: lead.branch?.name || '—' },
  ];

  const effectiveStageName = stageName || lead.stage?.name || '—';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Centered Modal Content Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>

          {/* Modal Header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3 flex-wrap pr-8">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {lead.name}
              </h2>
              {/* Stage Pill */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200/60 text-orange-600 rounded-full text-xs font-bold">
                <Tag size={12} />
                {effectiveStageName}
              </span>
              {/* Status Pill */}
              {lead.status?.name && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200/60 text-rose-600 rounded-full text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {lead.status.name}
                </span>
              )}
              {/* Priority Pill */}
              {lead.priority && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200/60 rounded-lg text-[11px] font-bold">
                  <ShieldAlert size={11} />
                  {lead.priority}
                </span>
              )}
              {/* Owner / Creator Info */}
              {lead.assignedTo?.name && (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <User size={11} /> Owner: {lead.assignedTo.name}
                </span>
              )}
              {lead.createdBy?.name && (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <User size={11} /> Creator: {lead.createdBy.name}
                </span>
              )}
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Lead Primary Details Section */}
            <div className="px-6 py-5 border-b border-slate-100 space-y-6">
              {/* Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {contactDetails.map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={idx} className={`bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col gap-1 ${item.colSpan || ''}`}>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <IconComponent size={13} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate">{item.value}</span>
                    </div>
                  );
                })}
              </div>

              {/* Course & Budget Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {interestDetails.map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <IconComponent size={13} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate">{item.value}</span>
                    </div>
                  );
                })}
              </div>

              {/* Assignment & Scope Details */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-400 mb-2.5">
                  <User size={13} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assignment & Scope</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {assignmentDetails.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <IconComponent size={12} />
                          <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 truncate">{item.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes Summary */}
              {lead.notes && (
                <div>
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                    <ClipboardList size={13} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lead Summary / Notes</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs text-slate-600 leading-relaxed font-medium">
                    {lead.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Tabbed Activity / Note / Timeline Section */}
            <div ref={tabSectionRef} className="px-6 py-5 flex flex-col min-h-[380px]">
              {/* Tab Header Selector */}
              <div className="flex border-b border-slate-100 mb-4 gap-4">
                <button
                  onClick={() => handleTabClick('comments')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-all border-b-2 uppercase tracking-wider focus:outline-none ${activeTab === 'comments' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <MessageSquare size={13} />
                  Comments
                </button>
                <button
                  onClick={() => handleTabClick('notes')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-all border-b-2 uppercase tracking-wider focus:outline-none ${activeTab === 'notes' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <ClipboardList size={13} />
                  Notes History
                </button>
                <button
                  onClick={() => handleTabClick('timeline')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-all border-b-2 uppercase tracking-wider focus:outline-none ${activeTab === 'timeline' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <History size={13} />
                  Timeline Log
                </button>
                <button
                  onClick={() => handleTabClick('stage-history')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-all border-b-2 uppercase tracking-wider focus:outline-none ${activeTab === 'stage-history' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <GitBranch size={13} />
                  Stage History
                </button>
                <button
                  onClick={() => handleTabClick('followups')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-all border-b-2 uppercase tracking-wider focus:outline-none ${activeTab === 'followups' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <CalendarClock size={13} />
                  Follow-ups
                </button>
              </div>

              <div className="flex-1 min-h-[300px] flex flex-col">
                {activeTab === 'comments' && (
                  <div className="h-full flex-1 flex flex-col pr-1">
                    <CommentThread leadId={lead.id} />
                  </div>
                )}
                {activeTab === 'notes' && <NotesTab leadId={lead.id} />}
                {activeTab === 'timeline' && <TimelineTab leadId={lead.id} />}
                {activeTab === 'stage-history' && <StageHistoryTab leadId={lead.id} />}
                {activeTab === 'followups' && <FollowupsTab leadId={lead.id} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadDetailDrawer;
