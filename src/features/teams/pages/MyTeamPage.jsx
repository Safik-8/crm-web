import React, { useState, useEffect, useMemo } from 'react';
import {
  Users2,
  Target,
  Briefcase,
  RefreshCw,
  UserCheck,
  Inbox,
  Compass,
  Award,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import { useActiveTeamQuery, useTeamQuery } from '../hooks/useTeams';
import { useLeadsQuery, useAssignLeadsMutation } from '../../leads/hooks/useLeads';
import PageHeader from '../../../shared/components/modules/PageHeader';
import Table from '../../../shared/components/elements/Table';
import Pagination from '../../../shared/components/elements/Pagination';
import SearchInput from '../../../shared/components/elements/SearchInput';
import { DynamicFormSlideover } from '../../../shared/components/elements/DynamicFormSlideover';
import Button from '../../../shared/components/elements/Button';
import { toast } from '../../../shared/utils/toast';
import Alert from '../../../shared/components/elements/Alert';
import Skeleton from '../../../shared/components/elements/Skeleton';
import { Checkbox } from '@mui/material';
import TeamDetailModal from '../components/TeamDetailModal';

const PAGE_SIZE = 10;

const StatCard = ({ label, value, icon: Icon, iconBg, valueClass = 'text-slate-900', loading }) => (
  <div className="bg-white p-4 rounded-none border border-slate-200 shadow-2xs flex items-center justify-between">
    <div>
      <span className="text-xs text-slate-500 font-medium block mb-1">{label}</span>
      {loading
        ? <Skeleton className="h-7 w-16 rounded-none" />
        : <span className={`text-xl font-bold block ${valueClass}`}>{value}</span>}
    </div>
    <div className={`w-10 h-10 rounded-none flex items-center justify-center ${iconBg}`}>
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

const LEAD_TABS = [
  { id: 'assigned-to-me', label: 'My Leads' },
  { id: 'unassigned',     label: 'Team Pool' },
  { id: 'assigned-to-members', label: 'Member Leads' },
];

const MyTeamPage = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const { forceHideLoader } = useLoader();

  const {
    data: activeTeamRes,
    isLoading: loadingActiveTeam,
    isError: activeTeamError,
    refetch: refetchActiveTeam,
  } = useActiveTeamQuery();
  const activeTeamId = activeTeamRes?.id;

  const {
    data: teamDetails,
    isLoading: loadingTeamDetails,
    isError: teamError,
    refetch: refetchTeam,
  } = useTeamQuery(activeTeamId);

  const { data: leadsRes, isLoading: loadingLeads, refetch: refetchLeads } = useLeadsQuery(
    { teamId: activeTeamId, viewMode: 'TEAM', limit: 1000 },
    { enabled: !!activeTeamId }
  );
  const assignLeadsMutation = useAssignLeadsMutation();

  const [activeTab, setActiveTab]                   = useState('members');
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [selectedLeads, setSelectedLeads]           = useState([]);
  const [search, setSearch]                         = useState('');
  const [page, setPage]                             = useState(1);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const leads          = leadsRes?.data?.leads || leadsRes?.leads || [];
  const canEditTeam    = hasPermission('TEAM', 'canEdit');
  const canAssignLeads = canEditTeam && (hasPermission('LEAD', 'canEdit') || hasPermission('LEAD', 'canCreate'));
  const canViewLeads   = hasPermission('LEAD', 'canView');

  const activeMembers = useMemo(
    () => (teamDetails?.members || []).filter(m => !m.removedAt && m.user?.status !== 'INACTIVE'),
    [teamDetails?.members]
  );

  const teamLeads = useMemo(
    () => leads.filter(l => Number(l.teamId) === Number(activeTeamId)),
    [leads, activeTeamId]
  );

  const leadStats = useMemo(() => ({
    myLeads:     teamLeads.filter(l => Number(l.assignedToId) === Number(currentUser?.id)).length,
    unassigned:  teamLeads.filter(l => !l.assignedToId).length,
    memberLeads: teamLeads.filter(l => l.assignedToId && Number(l.assignedToId) !== Number(currentUser?.id)).length,
  }), [teamLeads, currentUser?.id]);

  // Tab-scoped leads
  const tabLeads = useMemo(() => {
    if (activeTab === 'assigned-to-me')
      return teamLeads.filter(l => Number(l.assignedToId) === Number(currentUser?.id));
    if (activeTab === 'unassigned')
      return teamLeads.filter(l => !l.assignedToId);
    if (activeTab === 'assigned-to-members')
      return teamLeads.filter(l => l.assignedToId && Number(l.assignedToId) !== Number(currentUser?.id));
    return [];
  }, [teamLeads, activeTab, currentUser?.id]);

  // Search-filtered members
  const filteredMembers = useMemo(() => {
    if (!search.trim()) return activeMembers;
    const q = search.trim().toLowerCase();
    return activeMembers.filter(m =>
      m.user?.name?.toLowerCase().includes(q) ||
      m.user?.email?.toLowerCase().includes(q) ||
      m.user?.employeeId?.toLowerCase().includes(q) ||
      m.memberRole?.toLowerCase().includes(q)
    );
  }, [activeMembers, search]);

  // Search-filtered leads
  const filteredLeads = useMemo(() => {
    if (!search.trim()) return tabLeads;
    const q = search.trim().toLowerCase();
    return tabLeads.filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.mobile?.toLowerCase().includes(q) ||
      l.assignedTo?.name?.toLowerCase().includes(q) ||
      l.course?.name?.toLowerCase().includes(q) ||
      l.source?.name?.toLowerCase().includes(q)
    );
  }, [tabLeads, search]);

  // Reset page + search on tab change
  useEffect(() => { setPage(1); setSearch(''); setSelectedLeads([]); }, [activeTab]);
  useEffect(() => { setPage(1); }, [search]);

  // Client-side pagination
  const paginatedData = useMemo(() => {
    const data = activeTab === 'members' ? filteredMembers : filteredLeads;
    const start = (page - 1) * PAGE_SIZE;
    return data.slice(start, start + PAGE_SIZE);
  }, [activeTab, filteredMembers, filteredLeads, page]);

  const totalItems = activeTab === 'members' ? filteredMembers.length : filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const pagination = { page, totalPages, total: totalItems, limit: PAGE_SIZE };

  useEffect(() => {
    const timer = setTimeout(() => { forceHideLoader(); }, 100);
    return () => clearTimeout(timer);
  }, [forceHideLoader]);

  const handleRefresh = () => {
    refetchActiveTeam();
    if (activeTeamId) { refetchTeam(); refetchLeads(); }
  };
  const isRefreshing = loadingActiveTeam || loadingTeamDetails || loadingLeads;

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loadingActiveTeam || (activeTeamId && loadingTeamDetails)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[88px] rounded-none" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[88px] rounded-none" />)}
        </div>
        <Skeleton className="h-[300px] rounded-none" />
      </div>
    );
  }

  if (activeTeamError || (activeTeamId && teamError)) {
    return (
      <div className="space-y-4">
        <PageHeader title="My Team" description="Manage your team's leads and active members." icon={Users2} />
        <Alert variant="error" title="Error" message="Unable to load team data" />
      </div>
    );
  }

  if (!activeTeamId || !teamDetails) {
    return (
      <div className="space-y-4">
        <PageHeader title="My Team" description="Manage your team's leads and active members." icon={Users2} />
        <Alert variant="warning" title="No Team Assigned" message="You are not assigned to any team" />
      </div>
    );
  }

  // ── Columns ───────────────────────────────────────────────────────────────
  const memberColumns = [
    {
      header: '#',
      cell: (_, i) => (
        <span className="text-[11px] text-slate-400 font-semibold font-mono">
          {(page - 1) * PAGE_SIZE + i + 1}
        </span>
      ),
    },
    {
      header: 'Name',
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-800 text-[13px]">{row.user?.name || '—'}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{row.user?.employeeId || '—'}</p>
        </div>
      ),
    },
    {
      header: 'Email',
      cell: (row) => <span className="text-slate-500 font-medium text-[13px]">{row.user?.email || '—'}</span>,
    },
    {
      header: 'Role',
      cell: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
          {row.memberRole}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      isActionColumn: true,
      cell: () => (
        <button
          type="button"
          onClick={() => setIsDetailDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg border border-slate-200 hover:border-orange-200 transition-all"
          title="View team details"
        >
          <Eye size={13} />
          View Team
        </button>
      ),
    },
  ];

  const leadCols = [];
  leadCols.push({
    header: '#',
    cell: (_, i) => (
      <span className="text-[11px] text-slate-400 font-semibold font-mono">
        {(page - 1) * PAGE_SIZE + i + 1}
      </span>
    ),
  });
  if (canAssignLeads) {
    leadCols.push({
      id: 'selection',
      header: (
        <Checkbox
          size="small"
          checked={filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length}
          indeterminate={selectedLeads.length > 0 && selectedLeads.length < filteredLeads.length}
          onChange={(e) => setSelectedLeads(e.target.checked ? filteredLeads : [])}
        />
      ),
      cell: (row) => (
        <Checkbox
          size="small"
          checked={selectedLeads.some(l => l.id === row.id)}
          onChange={(e) => {
            if (e.target.checked) setSelectedLeads(prev => [...prev, row]);
            else setSelectedLeads(prev => prev.filter(l => l.id !== row.id));
          }}
        />
      ),
    });
  }
  leadCols.push(
    {
      header: 'Lead Name',
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-slate-900">{row.name}</p>
          {row.mobile && <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{row.mobile}</p>}
        </div>
      ),
    },
    {
      header: 'Course',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-200/50">
          <Award size={11} className="text-slate-400" />
          {row.course?.name || '—'}
        </span>
      ),
    },
    {
      header: 'Source',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-200/50">
          <Compass size={11} className="text-slate-400" />
          {row.source?.name || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => {
        if (!row.status) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              New
            </span>
          );
        }
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
            style={{
              backgroundColor: `${row.status.displayColor}16`,
              color: row.status.displayColor,
              borderColor: `${row.status.displayColor}30`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.status.displayColor }} />
            {row.status.name}
          </span>
        );
      },
    },
    {
      header: 'Assigned To',
      cell: (row) => (
        <span className="text-[12px] font-semibold text-slate-600">
          {row.assignedTo?.name || 'Unassigned'}
        </span>
      ),
    }
  );
  if (canAssignLeads) {
    leadCols.push({
      header: 'Actions',
      align: 'right',
      isActionColumn: true,
      cell: (row) => (
        <div className="flex items-center justify-end">
          <Button
            variant="outlined"
            size="small"
            onClick={() => { setSelectedLeads([row]); setIsAssignDrawerOpen(true); }}
          >
            <span className="flex items-center gap-1.5">
              <UserCheck size={14} />
              Reassign
            </span>
          </Button>
        </div>
      ),
    });
  }

  // ── Assign drawer fields ──────────────────────────────────────────────────
  const drawerFields = [
    {
      key: 'assignedToId',
      label: 'Assign To Member',
      type: 'select',
      required: true,
      options: activeMembers.map(m => ({ value: m.userId, label: m.user?.name || 'Member' })),
      placeholder: 'Select a team member...',
    },
  ];

  const handleAssignSubmit = async (values) => {
    try {
      await assignLeadsMutation.mutateAsync({
        leadIds: selectedLeads.map(l => l.id),
        assignedToId: Number(values.assignedToId),
        teamId: activeTeamId,
      });
      toast.success('Leads assigned successfully!');
      setIsAssignDrawerOpen(false);
      setSelectedLeads([]);
    } catch {
      // Error handled by mutation hook globally
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
      <PageHeader
        title={`My Team — ${teamDetails.name}`}
        description={`Code: ${teamDetails.code} · Branch: ${teamDetails.branch?.name || 'No branch'} · ${activeMembers.length} Active Member(s)`}
        icon={Users2}
        actions={
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-orange-50 text-orange-700 border border-orange-200/80 shadow-2xs">
              <Users2 size={13} className="text-orange-500" />
              {teamDetails.name}
            </span>
            {/* Bulk Assign — only when on a leads tab with rows selected AND canAssignLeads */}
            {activeTab !== 'members' && canAssignLeads && selectedLeads.length > 0 && (
              <Button
                onClick={() => setIsAssignDrawerOpen(true)}
                size="small"
              >
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} />
                  Assign ({selectedLeads.length})
                </span>
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={handleRefresh}
              disabled={isRefreshing}
              size="small"
              sx={{ borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' } }}
            >
              <span className="flex items-center gap-1.5">
                <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                Sync
              </span>
            </Button>
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Members"
          value={activeMembers.length}
          icon={Users2}
          iconBg="bg-orange-50 text-orange-600"
          loading={loadingTeamDetails}
        />
        <StatCard
          label="My Leads"
          value={leadStats.myLeads}
          icon={Target}
          iconBg="bg-blue-50 text-blue-600"
          loading={loadingLeads}
          valueClass="text-blue-700"
        />
        <StatCard
          label="Team Pool"
          value={leadStats.unassigned}
          icon={Inbox}
          iconBg="bg-amber-50 text-amber-600"
          loading={loadingLeads}
          valueClass="text-amber-700"
        />
        <StatCard
          label="Member Leads"
          value={leadStats.memberLeads}
          icon={UserCheck}
          iconBg="bg-emerald-50 text-emerald-600"
          loading={loadingLeads}
          valueClass="text-emerald-700"
        />
      </div>

      {/* Single section — toggle Members / Leads */}
      <section>
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-none shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>{teamDetails.name}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">
                {activeTab === 'members' ? 'Active Team Members' : 'Team Leads Pipeline'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'members'
                ? `Members assigned to ${teamDetails.name}`
                : `View and assign leads across ${teamDetails.name}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Badge — member count */}
            {activeTab === 'members' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-100">
                {activeMembers.length} member{activeMembers.length !== 1 ? 's' : ''}
              </span>
            )}

            {/* Tab toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('members')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'members'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Members
              </button>
              {LEAD_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toolbar — search */}
        <div className="bg-white border-x border-slate-200/60 px-4 py-3 border-t border-slate-100">
          <SearchInput
            value={search}
            onChange={(val) => setSearch(val)}
            placeholder={
              activeTab === 'members'
                ? 'Search by name, email, role…'
                : 'Search by lead name, mobile, assignee…'
            }
            className="w-full max-w-sm"
          />
        </div>

        {/* Table */}
        {activeTab === 'members' ? (
          <Table
            columns={memberColumns}
            data={paginatedData}
            loadingState={loadingTeamDetails ? 'loading' : 'success'}
            emptyTitle="No Active Members"
            emptyDescription="There are no active members in this team."
          />
        ) : canViewLeads ? (
          <Table
            columns={leadCols}
            data={paginatedData}
            loadingState={loadingLeads ? 'loading' : 'success'}
            emptyTitle={`No ${LEAD_TABS.find(t => t.id === activeTab)?.label || 'Leads'}`}
            emptyDescription="No leads found in this category."
          />
        ) : (
          <div className="bg-white border border-slate-200 p-6">
            <Alert variant="warning" title="No Permission" message="You do not have permission to view leads." />
          </div>
        )}

        {/* Pagination footer — matches LeadsPage pattern */}
        {totalItems > 0 && (
          <div className="flex justify-end mt-4">
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              isLoading={loadingTeamDetails || loadingLeads}
              entityName={activeTab === 'members' ? 'members' : 'leads'}
            />
          </div>
        )}
      </section>

      {/* Assign drawer */}
      <DynamicFormSlideover
        isOpen={isAssignDrawerOpen}
        onClose={() => { setIsAssignDrawerOpen(false); setSelectedLeads([]); }}
        title="Assign Lead to Team Member"
        subtitle={`Assigning ${selectedLeads.length} lead(s) to a team member.`}
        icon={Briefcase}
        fields={drawerFields}
        initialValues={{ assignedToId: '' }}
        onSubmit={handleAssignSubmit}
        submitText="Assign Lead"
      />

      {/* Team detail drawer — opens from the Actions button in the members table */}
      <TeamDetailModal
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        teamId={activeTeamId}
      />
    </div>
  );
};

export default MyTeamPage;
