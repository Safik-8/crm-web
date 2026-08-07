// src/features/leads/components/LeadDetailDrawer.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useLeadQuery } from '../hooks/useLeads';
import {
  X, Phone, Calendar, Compass, Tag, User, Mail, DollarSign,
  MapPin, Award, ShieldAlert, History, MessageSquare,
  ClipboardList, UserCheck, GitBranch, CalendarClock, ArrowLeft, Target
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import CommentThread from '../../activities/components/CommentThread';

// Extracted Sub-Tabs
import NotesTab from './drawer/NotesTab';
import TimelineTab from './drawer/TimelineTab';
import StageHistoryTab from './drawer/StageHistoryTab';
import FollowupsTab from './drawer/FollowupsTab';
import CommunicationsTab from './drawer/CommunicationsTab';
import QualificationHistoryTab from './drawer/QualificationHistoryTab';
import QualifyLeadModal from './QualifyLeadModal';
import Button from '../../../shared/components/elements/Button';

import { CreateOpportunitySlideover } from '../../opportunities/components/CreateOpportunitySlideover';
import { useCreateOpportunityMutation } from '../../opportunities/hooks/useOpportunities';
import { useCoursesQuery } from '../../courses/hooks/useCourses';
import { getOpportunityStages } from '../../opportunities/services/opportunityService';
import { useAuth } from '../../../app/providers/AuthProvider';

/**
 * LeadDetailDrawer — Premium dashboard-style two-column view displaying lead metadata,
 * assigned user/branch scope, notes, activities, timeline logs, and stage history.
 */
const LeadDetailDrawer = ({ lead: initialLead, stageName, onClose }) => {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('comments');
  const [isQualifyModalOpen, setIsQualifyModalOpen] = useState(false);
  const [isCreateOppOpen, setIsCreateOppOpen] = useState(false);
  const tabSectionRef = useRef(null);
  const { data: leadRes } = useLeadQuery(initialLead?.id);
  const lead = leadRes?.data?.lead || leadRes?.lead || initialLead;

  const createOppMutation = useCreateOpportunityMutation();
  const coursesQuery = useCoursesQuery();
  const courses =
    coursesQuery.data?.data?.courses ||
    coursesQuery.data?.courses ||
    (Array.isArray(coursesQuery.data?.data) ? coursesQuery.data.data : []) ||
    (Array.isArray(coursesQuery.data) ? coursesQuery.data : []);

  const canCreateOpp = hasPermission('create:opportunity') || hasPermission('OPPORTUNITY', 'canCreate');
  const canQualifyLead = hasPermission('edit:qualification') || hasPermission('QUALIFICATION', 'canEdit');

  const oppStagesQuery = useQuery({
    queryKey: ['opportunity-stages'],
    queryFn: async () => {
      const res = await getOpportunityStages();
      const raw = res?.data || res;
      return Array.isArray(raw) ? raw : [];
    },
    staleTime: 60000,
  });
  const stages = oppStagesQuery.data || [];

  const isQualified = lead?.qualification?.status === 'QUALIFIED';

  const isConverted =
    (Array.isArray(lead?.opportunities) && lead.opportunities.length > 0) ||
    lead?.isConverted ||
    lead?.status?.code === 'CONVERTED' ||
    lead?.status?.name === 'CONVERTED';

  const handleCreateOppSubmit = async (formData) => {
    await createOppMutation.mutateAsync(formData);
    setIsCreateOppOpen(false);
  };

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    setTimeout(() => {
      tabSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 30);
  };

  if (!lead) return null;

  // Prevent main page scroll and hide background footer while drawer is open
  useEffect(() => {
    const mainEl = document.querySelector('main');
    let prevMainOverflow = '';

    if (mainEl) {
      prevMainOverflow = mainEl.style.overflow;
      mainEl.style.overflow = 'hidden';
    }

    const footerEl = document.querySelector('footer');
    if (footerEl) {
      footerEl.style.display = 'none';
    }

    return () => {
      if (mainEl) {
        mainEl.style.overflow = prevMainOverflow;
      }
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
    { icon: Phone, label: 'Mobile', value: lead.mobile || '—' },
    { icon: Phone, label: 'Alt Contact', value: lead.alternateMobile || '—' },
    { icon: Mail, label: 'Email', value: lead.email || '—' },
    { icon: Calendar, label: 'Created Date', value: date },
    { icon: MapPin, label: 'Location', value: locationStr },
  ];

  const interestDetails = [
    { icon: Compass, label: 'Source', value: lead.source?.name || '—' },
    { icon: Award, label: 'Interested Course', value: lead.course?.name || lead.interestedFor || lead.interested_for || '—' },
    { icon: DollarSign, label: 'Budget', value: lead.budget !== null && lead.budget !== undefined ? `₹${lead.budget.toLocaleString('en-IN')}` : '—' },
    { icon: ShieldAlert, label: 'Priority', value: lead.priority || 'MEDIUM' },
  ];

  const assignmentDetails = [
    { icon: User, label: 'Assigned User', value: lead.assignedTo?.name || 'Unassigned' },
    { icon: UserCheck, label: 'Reporting Manager', value: lead.reportingManager?.name || '—' },
    { icon: Tag, label: 'Assigned Team', value: lead.assignedTeam?.name || '—' },
    { icon: MapPin, label: 'Branch', value: lead.branch?.name || '—' },
  ];

  const effectiveStageName = stageName || lead.stage?.name || '—';

  return (
    <>
      {/* Absolute Full Page Overlay mimicking BaseLayout main content */}
      <div className="absolute inset-0 z-50 bg-zinc-50 p-4 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
        <div
          className="max-w-7xl mx-auto w-full h-full flex flex-col space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Page-like Header */}
          <div className="bg-white p-4 border border-slate-200 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={onClose}
                className="p-1.5 -ml-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center mr-1"
                title="Go Back"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-medium text-slate-900 tracking-tight">
                {lead.name}
              </h2>
              {/* Stage Pill */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200/60 text-orange-600 rounded-full text-xs font-medium">
                <Tag size={13} />
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
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200/60 rounded-full text-xs font-medium">
                  <ShieldAlert size={13} />
                  {lead.priority}
                </span>
              )}
              {/* Owner / Creator Info */}
              {lead.assignedTo?.name && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/60 text-slate-600 rounded-full text-xs font-medium">
                  <User size={13} /> Owner: {lead.assignedTo.name}
                </span>
              )}
              {lead.createdBy?.name && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/60 text-slate-600 rounded-full text-xs font-medium">
                  <User size={13} /> Creator: {lead.createdBy.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isQualified && !isConverted && canCreateOpp && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Target size={15} />}
                  onClick={() => setIsCreateOppOpen(true)}
                  sx={{
                    backgroundColor: '#F86F03',
                    fontSize: '12px',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: '#DE5D02' },
                  }}
                >
                  Create Opportunity
                </Button>
              )}
              {!isConverted && canQualifyLead && (
                <Button
                  variant={isQualified ? 'outlined' : 'contained'}
                  size="small"
                  onClick={() => setIsQualifyModalOpen(true)}
                >
                  {isQualified ? 'Re-evaluate Qualification' : 'Qualify Lead'}
                </Button>
              )}
            </div>
          </div>

          {/* Modal Body (Two-Column Layout) inside a Card */}
          <div className="flex-1 bg-white border border-slate-200 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden">

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
            <div ref={tabSectionRef} className="flex-1 flex flex-col min-w-0 p-0 md:p-5 overflow-hidden bg-white">
              {/* Premium Tab Navigation */}
              <div className="flex items-center gap-1 px-5 md:px-0 pt-4 md:pt-0 pb-3 overflow-x-auto custom-scrollbar shrink-0 border-b border-slate-200/70 select-none">
                <button
                  onClick={() => handleTabClick('comments')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none cursor-pointer ${activeTab === 'comments'
                    ? 'bg-orange-50 text-orange-600 border border-orange-200/50 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent'
                    }`}
                >
                  <MessageSquare size={14} className={activeTab === 'comments' ? 'text-orange-500' : 'text-slate-400'} />
                  Comments
                </button>

                <button
                  onClick={() => handleTabClick('notes')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none cursor-pointer ${activeTab === 'notes'
                    ? 'bg-orange-50 text-orange-600 border border-orange-200/50 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent'
                    }`}
                >
                  <ClipboardList size={14} className={activeTab === 'notes' ? 'text-orange-500' : 'text-slate-400'} />
                  Notes History
                </button>

                <button
                  onClick={() => handleTabClick('qualification')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none cursor-pointer ${activeTab === 'qualification'
                    ? 'bg-orange-50 text-orange-600 border border-orange-200/50 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent'
                    }`}
                >
                  <Award size={14} className={activeTab === 'qualification' ? 'text-orange-500' : 'text-slate-400'} />
                  Qualification
                </button>

                <button
                  onClick={() => setActiveTab('communications')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none cursor-pointer ${activeTab === 'communications'
                    ? 'bg-orange-50 text-orange-600 border border-orange-200/50 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent'
                    }`}
                >
                  <Phone size={14} className={activeTab === 'communications' ? 'text-orange-500' : 'text-slate-400'} />
                  Communications
                </button>

                <button
                  onClick={() => handleTabClick('timeline')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none cursor-pointer ${activeTab === 'timeline'
                    ? 'bg-orange-50 text-orange-600 border border-orange-200/50 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent'
                    }`}
                >
                  <History size={14} className={activeTab === 'timeline' ? 'text-orange-500' : 'text-slate-400'} />
                  Timeline Log
                </button>

                <button
                  onClick={() => handleTabClick('stage-history')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none cursor-pointer ${activeTab === 'stage-history'
                    ? 'bg-orange-50 text-orange-600 border border-orange-200/50 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent'
                    }`}
                >
                  <GitBranch size={14} className={activeTab === 'stage-history' ? 'text-orange-500' : 'text-slate-400'} />
                  Stage History
                </button>

                <button
                  onClick={() => handleTabClick('followups')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none cursor-pointer ${activeTab === 'followups'
                    ? 'bg-orange-50 text-orange-600 border border-orange-200/50 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent'
                    }`}
                >
                  <CalendarClock size={14} className={activeTab === 'followups' ? 'text-orange-500' : 'text-slate-400'} />
                  Follow-ups
                </button>
              </div>

              {/* Tab Contents wrapper */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 md:px-0 pt-4 flex flex-col relative">
                {activeTab === 'comments' && (
                  <div className="h-full flex-1 flex flex-col pr-1 fade-in">
                    <CommentThread leadId={lead.id} />
                  </div>
                )}
                {activeTab === 'qualification' && (
                  <div className="fade-in">
                    <QualificationHistoryTab leadId={lead.id} onOpenQualifyModal={() => setIsQualifyModalOpen(true)} />
                  </div>
                )}
                {activeTab === 'notes' && <div className="fade-in"><NotesTab leadId={lead.id} /></div>}
                {activeTab === 'communications' && <div className="fade-in"><CommunicationsTab leadId={lead.id} /></div>}
                {activeTab === 'timeline' && <div className="fade-in"><TimelineTab leadId={lead.id} branchId={lead.branchId} /></div>}
                {activeTab === 'stage-history' && <div className="fade-in"><StageHistoryTab leadId={lead.id} /></div>}
                {activeTab === 'followups' && <div className="fade-in"><FollowupsTab leadId={lead.id} /></div>}
              </div>
            </div>

          </div>
        </div>
      </div>

      <QualifyLeadModal
        isOpen={isQualifyModalOpen}
        onClose={() => setIsQualifyModalOpen(false)}
        lead={lead}
      />

      <CreateOpportunitySlideover
        isOpen={isCreateOppOpen}
        onClose={() => setIsCreateOppOpen(false)}
        initialValues={{
          leadId: lead?.id,
          opportunityName: lead?.name ? `${lead.name} Deal` : undefined,
          expectedRevenue: lead?.budget !== undefined && lead?.budget !== null ? Number(lead.budget) : undefined,
          productId: lead?.courseId ? Number(lead.courseId) : (lead?.course?.id ? Number(lead.course.id) : undefined),
        }}
        onSubmit={handleCreateOppSubmit}
        isLoading={createOppMutation.isPending}
        stages={stages}
        courses={courses}
        leads={lead ? [lead] : []}
      />
    </>
  );
};

export default LeadDetailDrawer;
