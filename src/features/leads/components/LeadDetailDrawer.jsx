// src/features/leads/components/LeadDetailDrawer.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useLeadQuery } from '../hooks/useLeads';
import {
  X, Phone, Calendar, Compass, Tag, User, Mail, DollarSign,
  MapPin, Award, ShieldAlert, History, MessageSquare,
  ClipboardList, UserCheck, GitBranch, CalendarClock
} from 'lucide-react';
import CommentThread from '../../activities/components/CommentThread';

// Extracted Sub-Tabs
import NotesTab from './drawer/NotesTab';
import TimelineTab from './drawer/TimelineTab';
import StageHistoryTab from './drawer/StageHistoryTab';
import FollowupsTab from './drawer/FollowupsTab';
import CommunicationsTab from './drawer/CommunicationsTab';

/**
 * LeadDetailDrawer — Premium dashboard-style two-column view displaying lead metadata,
 * assigned user/branch scope, notes, activities, timeline logs, and stage history.
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
  // Prevent body scroll and hide background footer while drawer is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const footerEl = document.querySelector('footer');
    if (footerEl) {
      footerEl.style.display = 'none';
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      if (footerEl) {
        footerEl.style.display = '';
      }
    };
  }, []);

  if (!lead) return null;

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
    { icon: MapPin,     label: 'Location',          value: locationStr },
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        <div
          className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh] md:h-[85vh] max-h-[92vh] md:max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
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
          <div className="px-6 py-4 border-b border-slate-100 shrink-0">
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
              {(lead.opportunities && lead.opportunities.length > 0) || lead.isConverted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/60 text-emerald-700 rounded-full text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  CONVERTED
                </span>
              ) : lead.status?.name ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200/60 text-rose-600 rounded-full text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {lead.status.name}
                </span>
              ) : null}
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

          {/* Modal Body (Two-Column Layout) */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden">
            
            {/* Left Column: Metadata Sidebar */}
            <div className="w-full md:w-[320px] bg-slate-50/40 border-b md:border-b-0 border-r-0 md:border-r border-slate-100 overflow-y-visible md:overflow-y-auto custom-scrollbar p-5 space-y-5 shrink-0 flex flex-col">
              
              {/* Contact Information */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-0.5">Contact Details</h3>
                <div className="space-y-1.5">
                  {contactDetails.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={idx} className="bg-white border border-slate-100 rounded-xl p-2.5 flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 shrink-0">
                          <IconComponent size={13} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">{item.label}</div>
                          <div className="text-xs font-bold text-slate-700 mt-0.5 truncate">{item.value}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interest details */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-0.5">Lead Interest Info</h3>
                <div className="space-y-1.5">
                  {interestDetails.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={idx} className="bg-white border border-slate-100 rounded-xl p-2.5 flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 shrink-0">
                          <IconComponent size={13} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">{item.label}</div>
                          <div className="text-xs font-bold text-slate-700 mt-0.5 truncate">{item.value}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assignment details */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-0.5">Assignment & Scope</h3>
                <div className="space-y-1.5">
                  {assignmentDetails.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={idx} className="bg-white border border-slate-100 rounded-xl p-2.5 flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 shrink-0">
                          <IconComponent size={13} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">{item.label}</div>
                          <div className="text-xs font-bold text-slate-700 mt-0.5 truncate">{item.value}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lead notes description summary */}
              {lead.notes && (
                <div className="space-y-2.5">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-0.5">Lead Description Summary</h3>
                  <div className="bg-white border border-slate-100 rounded-xl p-3 text-xs text-slate-600 leading-relaxed font-semibold">
                    {lead.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Tabbed Activity / Note / Timeline Section */}
            <div ref={tabSectionRef} className="px-6 py-5 flex flex-col min-h-[380px]">
              {/* Tab Header Selector */}
              <div className="flex border-b border-slate-100 gap-4 shrink-0 overflow-x-auto custom-scrollbar">
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
                  onClick={() => setActiveTab('communications')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-all border-b-2 uppercase tracking-wider whitespace-nowrap ${activeTab === 'communications' ? 'border-orange-500 text-orange-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <Phone size={13} />
                  Communications
                </button>
                <button
                  onClick={() => handleTabClick('timeline')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-all border-b-2 uppercase tracking-wider whitespace-nowrap ${activeTab === 'timeline' ? 'border-orange-500 text-orange-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
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

              {/* Tab Contents wrapper */}
              <div className="flex-1 min-h-[420px] md:min-h-0 overflow-y-auto md:overflow-hidden mt-5 flex flex-col">
                {activeTab === 'comments' && (
                  <div className="h-full flex-1 flex flex-col pr-1">
                    <CommentThread leadId={lead.id} />
                  </div>
                )}
                {activeTab === 'notes' && <NotesTab leadId={lead.id} />}
                {activeTab === 'communications' && <CommunicationsTab leadId={lead.id} />}
                {activeTab === 'timeline' && <TimelineTab leadId={lead.id} branchId={lead.branchId} />}
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
