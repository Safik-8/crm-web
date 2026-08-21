// crm-web/src/features/dashboard/components/QuickActionsBar.jsx
import { useState, useMemo } from 'react';
import { Plus, Calendar, Target, Users, X, Phone, Mail, BookOpen, ChevronRight, UserCheck, Search } from 'lucide-react';
import Button from '../../../shared/components/elements/Button';
import SearchInput from '../../../shared/components/elements/SearchInput';
import { LeadCreateModal } from '../../leads/components/LeadCreateModal';
import { CreateOpportunitySlideover } from '../../opportunities/components/CreateOpportunitySlideover';
import FollowupForm from '../../followups/components/FollowupForm';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { getOpportunityStages } from '../../opportunities/services/opportunityService';
import { courseService } from '../../courses/services/courseService';
import { getLeads } from '../../leads/services/leadService';
import { useCreateOpportunityMutation } from '../../opportunities/hooks/useOpportunities';

const QuickActionsBar = ({ actions = ['add_lead', 'followup', 'opportunity', 'customers'] }) => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

  const [showLeadModal, setShowLeadModal]           = useState(false);
  const [showOppSlideover, setShowOppSlideover]     = useState(false);
  const [showFollowupPicker, setShowFollowupPicker] = useState(false);
  const [showFollowupForm, setShowFollowupForm]     = useState(false);
  const [selectedLeadId, setSelectedLeadId]         = useState(null);
  const [selectedLead, setSelectedLead]             = useState(null);
  const [searchQuery, setSearchQuery]               = useState('');

  const canCreateLead = hasPermission('create:lead') || hasPermission('LEAD', 'canCreate');
  const canCreateFollowup = hasPermission('create:followup') || hasPermission('FOLLOWUP', 'canCreate');
  const canCreateOpportunity = hasPermission('create:opportunity') || hasPermission('OPPORTUNITY', 'canCreate');
  const canViewCustomers = hasPermission('view:customers') || hasPermission('CUSTOMER', 'canView');

  const createOppMutation = useCreateOpportunityMutation();

  const { data: stagesRes } = useQuery({
    queryKey: ['opportunityStages'],
    queryFn: () => getOpportunityStages(),
    staleTime: 5 * 60 * 1000,
    enabled: showOppSlideover && canCreateOpportunity,
  });

  const { data: coursesRes } = useQuery({
    queryKey: ['coursesOptions', user?.companyId],
    queryFn: () => courseService.getCourses({ companyId: user?.companyId }),
    staleTime: 5 * 60 * 1000,
    enabled: showOppSlideover && canCreateOpportunity && !!user?.companyId,
  });

  const { data: leadsRes } = useQuery({
    queryKey: ['leadsOptions', user?.id],
    queryFn: () => getLeads({ assignedToId: user?.id, limit: 100 }),
    staleTime: 2 * 60 * 1000,
    enabled: (showOppSlideover || showFollowupPicker) && !!user?.id,
  });

  const stages  = stagesRes?.data?.stages ?? stagesRes?.stages ?? [];
  const courses = coursesRes?.data?.data?.items ?? coursesRes?.data?.items ?? coursesRes?.items ?? [];
  const leads   = leadsRes?.data?.leads   ?? leadsRes?.leads   ?? [];

  // Filtered leads with instant type-ahead search
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.trim().toLowerCase();
    return leads.filter((l) => {
      const name = (l.name || '').toLowerCase();
      const mobile = (l.mobile || '').toLowerCase();
      const email = (l.email || '').toLowerCase();
      const course = (l.interestedFor || l.course?.name || '').toLowerCase();
      return name.includes(q) || mobile.includes(q) || email.includes(q) || course.includes(q);
    });
  }, [leads, searchQuery]);

  // Display top 10 when not searching, or all matching results when searching
  const displayedLeads = searchQuery.trim() ? filteredLeads : filteredLeads.slice(0, 10);

  const ACTION_CONFIG = [
    {
      key: 'add_lead',
      label: 'Add Lead',
      icon: Plus,
      allowed: canCreateLead,
      onClick: () => setShowLeadModal(true),
    },
    {
      key: 'followup',
      label: 'Schedule Follow-up',
      icon: Calendar,
      allowed: canCreateFollowup,
      onClick: () => {
        setSearchQuery('');
        setShowFollowupPicker(true);
      },
    },
    {
      key: 'opportunity',
      label: 'Create Opportunity',
      icon: Target,
      allowed: canCreateOpportunity,
      onClick: () => setShowOppSlideover(true),
    },
    {
      key: 'customers',
      label: 'View Customers',
      icon: Users,
      allowed: canViewCustomers,
      onClick: () => navigate('/customers'),
    },
  ];

  const visibleActions = ACTION_CONFIG.filter((a) => actions.includes(a.key) && a.allowed);

  if (visibleActions.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {visibleActions.map(({ key, label, icon: Icon, onClick }) => (
          <Button
            key={key}
            variant="outlined"
            size="small"
            onClick={onClick}
            startIcon={<Icon size={14} />}
            sx={{
              borderColor: '#E2E8F0',
              color: '#334155',
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '12px',
              padding: '6px 14px',
              '&:hover': {
                borderColor: '#CBD5E1',
                backgroundColor: '#F8FAFC',
                color: '#0F172A',
              },
              '& .MuiButton-startIcon': {
                color: '#F86F03',
                marginRight: '6px',
              },
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {showLeadModal && canCreateLead && (
        <LeadCreateModal
          isOpen={showLeadModal}
          onClose={() => setShowLeadModal(false)}
          onCreated={() => setShowLeadModal(false)}
        />
      )}

      {showOppSlideover && canCreateOpportunity && (
        <CreateOpportunitySlideover
          isOpen={showOppSlideover}
          onClose={() => setShowOppSlideover(false)}
          stages={stages}
          courses={courses}
          leads={leads}
          onSubmit={async (values) => {
            await createOppMutation.mutateAsync(values);
            setShowOppSlideover(false);
          }}
          isLoading={createOppMutation.isPending}
        />
      )}

      {/* Production-Grade Lead Selection Modal */}
      {showFollowupPicker && canCreateFollowup && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setShowFollowupPicker(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 shadow-xs">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display leading-tight">
                    Select Lead for Follow-up
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose a lead to schedule a call, demo, or follow-up activity.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFollowupPicker(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Bar Section */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by lead name, phone, course, or email..."
                className="w-full"
              />
              <div className="flex items-center justify-between mt-2.5 px-1 text-[11px] text-slate-400 font-medium">
                <span>
                  {searchQuery.trim()
                    ? `Found ${filteredLeads.length} matching lead${filteredLeads.length === 1 ? '' : 's'}`
                    : `Showing top ${Math.min(10, leads.length)} of ${leads.length} assigned leads`}
                </span>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-orange-600 hover:text-orange-700 font-semibold"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            {/* Leads List */}
            <div className="p-3 overflow-y-auto space-y-1.5 flex-1 divide-y divide-slate-50">
              {displayedLeads.map((lead) => {
                const initials = (lead.name || 'L')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();

                const courseTitle = lead.interestedFor || lead.course?.name;

                return (
                  <div
                    key={lead.id}
                    onClick={() => {
                      setSelectedLead(lead);
                      setSelectedLeadId(lead.id);
                      setShowFollowupPicker(false);
                      setShowFollowupForm(true);
                    }}
                    className="group flex items-center justify-between p-3 rounded-2xl hover:bg-orange-50/50 hover:border-orange-200/80 border border-transparent transition-all duration-150 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200/70 group-hover:bg-orange-100 group-hover:text-orange-700 group-hover:border-orange-200 transition-colors">
                        {initials}
                      </div>

                      {/* Lead Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-orange-950 truncate">
                            {lead.name}
                          </p>
                          {lead.isQualified && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-600 border border-emerald-100 shrink-0">
                              <UserCheck size={10} /> Qualified
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                          {lead.mobile && (
                            <span className="flex items-center gap-1 shrink-0">
                              <Phone size={11} className="text-slate-400" />
                              {lead.mobile}
                            </span>
                          )}
                          {courseTitle && (
                            <span className="hidden sm:inline-flex items-center gap-1 truncate text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md text-[10px] font-medium max-w-[200px]">
                              <BookOpen size={10} className="text-slate-400 shrink-0" />
                              <span className="truncate">{courseTitle}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Arrow */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 group-hover:text-orange-600 transition-colors pl-2 shrink-0">
                      <span className="hidden sm:inline text-[11px]">Select</span>
                      <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}

              {displayedLeads.length === 0 && (
                <div className="text-center py-10 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <Search size={22} />
                  </div>
                  <p className="text-sm font-bold text-slate-700">No leads found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {searchQuery ? `No leads matching "${searchQuery}"` : 'No assigned leads available.'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px]">Click a lead to configure date & time</span>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowFollowupPicker(false)}
                sx={{
                  borderColor: '#E2E8F0',
                  color: '#64748B',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '11px',
                  padding: '4px 12px',
                  '&:hover': {
                    backgroundColor: '#F1F5F9',
                    borderColor: '#CBD5E1',
                    color: '#334155',
                  },
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showFollowupForm && selectedLeadId && canCreateFollowup && (
        <FollowupForm
          leadId={selectedLeadId}
          lead={selectedLead}
          onClose={() => {
            setShowFollowupForm(false);
            setSelectedLeadId(null);
            setSelectedLead(null);
          }}
          onSuccess={() => {
            setShowFollowupForm(false);
            setSelectedLeadId(null);
            setSelectedLead(null);
          }}
        />
      )}
    </>
  );
};

export default QuickActionsBar;
