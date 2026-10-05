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
  ShieldAlert,
  Calendar,
  User,
  HelpCircle,
  X,
  MoreVertical,
} from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import { useActiveTeamQuery, useTeamQuery } from '../hooks/useTeams';
import { useLeadsQuery, useAssignLeadsMutation } from '../../leads/hooks/useLeads';
import { useFormatters } from '../../../shared/hooks/useFormatters';
import PageHeader from '../../../shared/components/modules/PageHeader';
import Table from '../../../shared/components/elements/Table';
import Pagination from '../../../shared/components/elements/Pagination';
import SearchInput from '../../../shared/components/elements/SearchInput';
import { DynamicFormSlideover } from '../../../shared/components/elements/DynamicFormSlideover';
import Button from '../../../shared/components/elements/Button';
import { toast } from '../../../shared/utils/toast';
import Alert from '../../../shared/components/elements/Alert';
import Skeleton from '../../../shared/components/elements/Skeleton';
import { Checkbox, Menu, MenuItem } from '@mui/material';
import TeamDetailModal from '../components/TeamDetailModal';
import MemberDetailDrawer from '../components/MemberDetailDrawer';
import LeadDetailDrawer from '../../leads/components/LeadDetailDrawer';

const PAGE_SIZE = 10;

const MemberRowActions = ({ row, onViewDetails, onAssignLeads, isTeamLeader }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
        title="Member actions"
      >
        <MoreVertical size={16} />
      </button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        elevation={0}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            className: "mt-1 shadow-lg border border-slate-200/80 rounded-xl bg-white min-w-[170px] py-1 text-slate-700 font-sans"
          }
        }}
      >
        <MenuItem
          onClick={() => { setAnchorEl(null); onViewDetails(row); }}
          className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800"
          sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <Eye size={14} className="text-slate-400" />
          <span>View Details</span>
        </MenuItem>
        {isTeamLeader && (
          <MenuItem
            onClick={() => { setAnchorEl(null); onAssignLeads(row); }}
            className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800 border-t border-slate-100/50"
            sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <UserCheck size={14} className="text-slate-400" />
            <span>Assign Leads</span>
          </MenuItem>
        )}
      </Menu>
    </div>
  );
};

const LeadRowActions = ({ row, onViewDetails, onAssign, canAssignLeads }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
        title="Lead actions"
      >
        <MoreVertical size={16} />
      </button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        elevation={0}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            className: "mt-1 shadow-lg border border-slate-200/80 rounded-xl bg-white min-w-[160px] py-1 text-slate-700 font-sans"
          }
        }}
      >
        <MenuItem
          onClick={() => { setAnchorEl(null); onViewDetails(row); }}
          className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800"
          sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <Eye size={14} className="text-slate-400" />
          <span>View Details</span>
        </MenuItem>
        {canAssignLeads && (
          <MenuItem
            onClick={() => { setAnchorEl(null); onAssign(row); }}
            className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800 border-t border-slate-100/50"
            sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <UserCheck size={14} className="text-slate-400" />
            <span>Reassign Lead</span>
          </MenuItem>
        )}
      </Menu>
    </div>
  );
};

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
  { id: 'unassigned',     label: 'Unassigned Leads' },
  { id: 'assigned-to-members', label: 'Assigned to Teammates' },
];

const MyTeamPage = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const { forceHideLoader } = useLoader();
  const { formatDate } = useFormatters();

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
  const [selectedMemberForView, setSelectedMemberForView] = useState(null);
  const [selectedLeadForView, setSelectedLeadForView]     = useState(null);

  const leads          = leadsRes?.data?.leads || leadsRes?.leads || [];
  const isTeamLeader   = Boolean(activeTeamRes?.isTeamLeader || (teamDetails?.bdeId && Number(teamDetails.bdeId) === Number(currentUser?.id)));
  const canEditTeam    = hasPermission('TEAM', 'canEdit');
  const hasAssignmentPerm = hasPermission('LEAD_ASSIGNMENT', 'canEdit') || hasPermission('LEAD_ASSIGNMENT', 'canCreate');
  const canAssignLeads = isTeamLeader || ((canEditTeam || hasAssignmentPerm) && (hasPermission('LEAD', 'canEdit') || hasPermission('LEAD', 'canCreate') || hasAssignmentPerm));
  const canViewLeads   = hasPermission('LEAD', 'canView');

  const availableLeadTabs = useMemo(() => {
    if (isTeamLeader) return LEAD_TABS;
    return [{ id: 'assigned-to-me', label: 'My Leads' }];
  }, [isTeamLeader]);

  useEffect(() => {
    if (!isTeamLeader && activeTab !== 'members' && activeTab !== 'assigned-to-me') {
      setActiveTab('assigned-to-me');
    }
  }, [isTeamLeader, activeTab]);

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
      m.user?.userRoles?.[0]?.role?.name?.toLowerCase().includes(q) ||
      m.memberRole?.toLowerCase().includes(q)
    );
  }, [activeMembers, search]);

  // Search-filtered leads
  const filteredLeads = useMemo(() => {
    if (!search.trim()) return tabLeads;
    const q = search.trim().toLowerCase();
    return tabLeads.filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.leadNumber?.toLowerCase().includes(q) ||
      l.mobile?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
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
        <div
          className="cursor-pointer group"
          onClick={() => setSelectedMemberForView(row)}
        >
          <p className="font-semibold text-slate-800 text-[13px] group-hover:text-orange-600 transition-colors">
            {row.user?.name || '—'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{row.user?.employeeId || '—'}</p>
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
          {row.user?.userRoles?.[0]?.role?.name || row.memberRole}
        </span>
      ),
    },
    {
      header: 'Active Leads',
      cell: (row) => {
        const count = teamLeads.filter(l => Number(l.assignedToId) === Number(row.userId)).length;
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Target size={11} className="text-slate-400" />
            {count} lead{count !== 1 ? 's' : ''}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      align: 'right',
      isActionColumn: true,
      cell: (row) => (
        <MemberRowActions
          row={row}
          onViewDetails={setSelectedMemberForView}
          onAssignLeads={(m) => {
            setIsAssignDrawerOpen(true);
          }}
          isTeamLeader={isTeamLeader}
        />
      ),
    },
  ];

  const leadCols = [];
  if (canAssignLeads) {
    leadCols.push({
      id: 'selection',
      header: (
        <Checkbox
          size="small"
          checked={filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length}
          indeterminate={selectedLeads.length > 0 && selectedLeads.length < filteredLeads.length}
          onChange={(e) => setSelectedLeads(e.target.checked ? filteredLeads : [])}
          sx={{ p: 0.5 }}
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
          sx={{ p: 0.5 }}
        />
      ),
    });
  }
  leadCols.push(
    {
      header: '#',
      cell: (_, i) => (
        <span className="text-[11px] text-slate-400 font-semibold font-mono">
          {(page - 1) * PAGE_SIZE + i + 1}
        </span>
      ),
    },
    {
      header: 'Lead ID',
      cell: (row) => (
        <span
          onClick={() => setSelectedLeadForView(row)}
          className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-colors px-2 py-0.5 rounded border border-slate-200 select-all cursor-pointer whitespace-nowrap inline-block"
          title="Click to view lead details"
        >
          {row.leadNumber || `LEAD-${row.id}`}
        </span>
      ),
    },
    {
      header: 'Lead Name',
      cell: (row) => (
        <div className="min-w-0">
          <p
            className="text-[13px] font-bold text-slate-900 hover:text-orange-600 transition-colors cursor-pointer truncate max-w-[200px]"
            onClick={() => setSelectedLeadForView(row)}
            title={row.name}
          >
            {row.name}
          </p>
          {row.email && (
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium truncate max-w-[200px]">
              {row.email}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Mobile',
      cell: (row) => (
        <div className="text-[12px] font-semibold text-slate-700 whitespace-nowrap">
          <p>{row.mobile || '—'}</p>
          {row.alternateMobile && (
            <p className="text-[10px] text-slate-400 font-medium">Alt: {row.alternateMobile}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Source',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-200/50 whitespace-nowrap">
          <Compass size={11} className="text-slate-400" />
          {row.source?.name || '—'}
        </span>
      ),
    },
    {
      header: 'Service',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-200/50 whitespace-nowrap">
          <Award size={11} className="text-slate-400" />
          {row.course?.name || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => {
        if ((row.opportunities && row.opportunities.length > 0) || row.isConverted) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CONVERTED
            </span>
          );
        }
        if (!row.status) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
              New
            </span>
          );
        }
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap"
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
      header: 'Priority',
      cell: (row) => {
        const priorityColors = {
          HIGH: 'text-red-700 bg-red-50 border-red-200/50',
          MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200/50',
          LOW: 'text-green-700 bg-green-50 border-green-200/50',
        };
        const style = priorityColors[row.priority] || priorityColors.MEDIUM;
        return (
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${style} whitespace-nowrap`}>
            <ShieldAlert size={10} />
            {row.priority || 'MEDIUM'}
          </span>
        );
      },
    },
    {
      header: 'Assigned To',
      cell: (row) => {
        if (row.assignedTo) {
          const roleName = row.assignedTo.userRoles?.[0]?.role?.name || row.assignedTo.primaryRole || 'Member';
          return (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-700 whitespace-nowrap">
              <User size={12} className="text-slate-400" />
              <span>{row.assignedTo.name} ({roleName})</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-400 italic whitespace-nowrap">
            <HelpCircle size={12} className="text-slate-300" />
            <span>Unassigned</span>
          </span>
        );
      },
    },
    {
      header: 'Created',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-500 whitespace-nowrap">
          <Calendar size={11} className="text-slate-400" />
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      isActionColumn: true,
      cell: (row) => (
        <LeadRowActions
          row={row}
          onViewDetails={setSelectedLeadForView}
          onAssign={(l) => {
            setSelectedLeads([l]);
            setIsAssignDrawerOpen(true);
          }}
          canAssignLeads={canAssignLeads}
        />
      ),
    }
  );

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
            <span
              onClick={() => setIsDetailDrawerOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-orange-50 text-orange-700 border border-orange-200/80 shadow-2xs cursor-pointer hover:bg-orange-100 transition-colors"
              title="Click to view full team information"
            >
              <Users2 size={13} className="text-orange-500" />
              {teamDetails.name}
            </span>
            <Button
              variant="outlined"
              onClick={handleRefresh}
              disabled={isRefreshing}
              size="small"
              title="Refresh team data"
              sx={{
                borderColor: '#e2e8f0',
                color: '#475569',
                minWidth: '36px',
                px: 1,
                '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
              }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </Button>
          </div>
        }
      />

      {/* Stat cards */}
      <div className={`grid grid-cols-2 ${isTeamLeader ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-4`}>
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
        {isTeamLeader && (
          <>
            <StatCard
              label="Unassigned Leads"
              value={leadStats.unassigned}
              icon={Inbox}
              iconBg="bg-amber-50 text-amber-600"
              loading={loadingLeads}
              valueClass="text-amber-700"
            />
            <StatCard
              label="Assigned to Teammates"
              value={leadStats.memberLeads}
              icon={UserCheck}
              iconBg="bg-emerald-50 text-emerald-600"
              loading={loadingLeads}
              valueClass="text-emerald-700"
            />
          </>
        )}
      </div>

      {/* Single section — toggle Members / Leads */}
      <section>
        {/* Section header with search bar directly on the left and Assign button in top heading */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-none shadow-2xs">
          <div className="w-full max-w-sm">
            <SearchInput
              value={search}
              onChange={(val) => setSearch(val)}
              placeholder={
                activeTab === 'members'
                  ? 'Search by name, email, role…'
                  : 'Search by lead ID, name, mobile, assignee…'
              }
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Top Heading Assign Button when leads are selected */}
            {canAssignLeads && selectedLeads.length > 0 && activeTab !== 'members' && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-1 rounded-lg animate-in fade-in">
                <span className="text-xs font-bold text-orange-800">
                  {selectedLeads.length} selected
                </span>
                <Button
                  onClick={() => setIsAssignDrawerOpen(true)}
                  size="small"
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <Briefcase size={13} />
                    Assign Selected
                  </span>
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedLeads([])}
                  className="text-slate-400 hover:text-slate-600 p-0.5 transition-colors"
                  title="Clear selection"
                >
                  <X size={14} />
                </button>
              </div>
            )}

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
                Team Members
              </button>
              {availableLeadTabs.map((tab) => (
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

        {/* Pagination footer — Full Width */}
        {totalItems > 0 && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            isLoading={loadingTeamDetails || loadingLeads}
            entityName={activeTab === 'members' ? 'members' : 'leads'}
          />
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

      {/* Team Member detail drawer — opens from "View Member Details" in members table */}
      <MemberDetailDrawer
        isOpen={!!selectedMemberForView}
        onClose={() => setSelectedMemberForView(null)}
        member={selectedMemberForView}
        team={teamDetails}
        teamLeads={teamLeads}
        isTeamLeader={isTeamLeader}
        onAssignToMember={(member) => {
          setIsAssignDrawerOpen(true);
        }}
      />

      {/* Lead detail drawer — opens when clicking Lead ID, Name, or View Details */}
      {selectedLeadForView && (
        <LeadDetailDrawer
          lead={selectedLeadForView}
          onClose={() => setSelectedLeadForView(null)}
        />
      )}

      {/* Team detail modal — opens from team badge in PageHeader */}
      <TeamDetailModal
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        teamId={activeTeamId}
      />
    </div>
  );
};

export default MyTeamPage;
