// src/features/teams/pages/MyTeamPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users2,
  Target,
  RefreshCw,
  UserCheck,
  Inbox,
  Compass,
  Award,
  Eye,
  MoreVertical,
  ShieldAlert,
  Calendar,
  User,
  Users,
  HelpCircle,
} from 'lucide-react';
import { Menu, MenuItem, Checkbox } from '@mui/material';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import { useActiveTeamQuery, useTeamQuery } from '../hooks/useTeams';
import { useLeadsQuery } from '../../leads/hooks/useLeads';

// Shared UI Elements
import PageHeader from '../../../shared/components/modules/PageHeader';
import Table from '../../../shared/components/elements/Table';
import Pagination from '../../../shared/components/elements/Pagination';
import SearchInput from '../../../shared/components/elements/SearchInput';
import Button from '../../../shared/components/elements/Button';
import Alert from '../../../shared/components/elements/Alert';
import Skeleton from '../../../shared/components/elements/Skeleton';

// Drawers & Modals
import LeadDetailDrawer from '../../leads/components/LeadDetailDrawer';
import AssignToISEDrawer from '../components/AssignToISEDrawer';
import TeamLeadAssignModal from '../components/TeamLeadAssignModal';

const PAGE_SIZE = 10;

// ── Stat Card Component (Straight non-curved border matching exact user preference) ─────

const StatCard = ({ label, value, icon: Icon, iconBg, valueClass = 'text-slate-900', loading }) => (
  <div className="bg-white p-4 border border-slate-200 shadow-xs flex items-center justify-between">
    <div>
      <span className="text-xs text-slate-500 font-medium block mb-1">{label}</span>
      {loading ? (
        <Skeleton className="h-7 w-16 rounded-md" />
      ) : (
        <span className={`text-xl font-bold block ${valueClass}`}>{value}</span>
      )}
    </div>
    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${iconBg}`}>
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

// ── Row Actions Menu for Leads ─────────────────────────────────────────────────

const LeadRowActions = ({ row, onViewDetails, onAssign, canEdit }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClose = () => setAnchorEl(null);
  const handleAction = (cb) => {
    handleClose();
    cb(row);
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
        title="Actions"
      >
        <MoreVertical size={16} />
      </button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        elevation={0}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          className: 'mt-1 shadow-lg border border-slate-200/80 rounded-xl bg-white min-w-[160px] py-1 text-slate-700 font-sans',
        }}
      >
        <MenuItem
          onClick={() => handleAction(onViewDetails)}
          sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          className="px-3.5 py-2 text-[12px] font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50"
        >
          <Eye size={14} className="text-slate-400" />
          <span>View Details</span>
        </MenuItem>

        {canEdit && (
          <MenuItem
            onClick={() => handleAction(onAssign)}
            sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            className="px-3.5 py-2 text-[12px] font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50/40 border-t border-slate-100/50"
          >
            <UserCheck size={14} className="text-orange-400" />
            <span>Assign to ISE</span>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

// ── Clear Tab Definitions ─────────────────────────────────────────────────────

const TABS = [
  { id: 'team-pool',    label: 'Unassigned Leads', desc: 'Unassigned leads waiting in the team pool' },
  { id: 'member-leads', label: 'Assigned Leads',   desc: 'Leads assigned to team members' },
  { id: 'my-leads',     label: 'My Work',          desc: 'Leads assigned directly to you' },
  { id: 'members',      label: 'Team Members',     desc: 'Active members on your team' },
];

// ── Main MyTeamPage Component ─────────────────────────────────────────────────

const MyTeamPage = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const { forceHideLoader } = useLoader();

  // ── Data Fetching ───────────────────────────────────────────────────────────
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

  // Fetch leads with viewMode: 'TEAM' to query full team lead scope
  const {
    data: leadsRes,
    isLoading: loadingLeads,
    isFetching: isFetchingLeads,
    refetch: refetchLeads,
  } = useLeadsQuery(
    { teamId: activeTeamId, viewMode: 'TEAM', limit: 1000 },
    { enabled: !!activeTeamId }
  );

  // ── Local State ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]                   = useState('team-pool');
  const [search, setSearch]                         = useState('');
  const [page, setPage]                             = useState(1);

  // Drawers & Modals
  const [selectedLeadForView, setSelectedLeadForView]     = useState(null); // LeadDetailDrawer
  const [isAssignDrawerOpen, setIsAssignDrawerOpen]       = useState(false);  // AssignToISEDrawer
  const [isAssignModalOpen, setIsAssignModalOpen]         = useState(false);  // Fallback Modal
  const [leadsToAssign, setLeadsToAssign]                 = useState([]);
  const [selectedLeads, setSelectedLeads]                 = useState([]);     // Bulk selection

  // ── RBAC Checks ─────────────────────────────────────────────────────────────
  const canViewTeam = hasPermission('TEAM', 'canView') || hasPermission('VIEW_TEAMS');
  const canEditTeam =
    hasPermission('TEAM', 'canEdit') ||
    hasPermission('EDIT_TEAMS') ||
    hasPermission('LEAD_ASSIGNMENT', 'canEdit') ||
    hasPermission('LEAD_ASSIGNMENT', 'canCreate');

  // ── Derived Data ─────────────────────────────────────────────────────────────
  const leads = leadsRes?.data?.leads || leadsRes?.leads || [];

  const activeMembers = useMemo(
    () => (teamDetails?.members || []).filter((m) => !m.removedAt && m.user?.status !== 'INACTIVE'),
    [teamDetails?.members]
  );

  const activeMemberUserIds = useMemo(
    () => new Set(activeMembers.map((m) => Number(m.user?.id)).filter(Boolean)),
    [activeMembers]
  );

  const teamLeads = useMemo(
    () =>
      leads.filter((l) => {
        const isTeamPool = Number(l.teamId) === Number(activeTeamId);
        const isMemberLead = l.assignedToId && activeMemberUserIds.has(Number(l.assignedToId));
        return isTeamPool || isMemberLead;
      }),
    [leads, activeTeamId, activeMemberUserIds]
  );

  const leadStats = useMemo(
    () => ({
      activeMembers: activeMembers.length,
      myLeads: teamLeads.filter((l) => Number(l.assignedToId) === Number(currentUser?.id)).length,
      teamPool: teamLeads.filter((l) => !l.assignedToId).length,
      memberLeads: teamLeads.filter(
        (l) => l.assignedToId && Number(l.assignedToId) !== Number(currentUser?.id)
      ).length,
    }),
    [teamLeads, activeMembers.length, currentUser?.id]
  );

  // Tab Filtering logic: Unassigned leads land in team-pool; once assigned to ISE, move to member-leads / my-leads
  const tabLeads = useMemo(() => {
    if (activeTab === 'team-pool') {
      return teamLeads.filter((l) => !l.assignedToId);
    }
    if (activeTab === 'member-leads') {
      return teamLeads.filter(
        (l) => l.assignedToId && Number(l.assignedToId) !== Number(currentUser?.id)
      );
    }
    if (activeTab === 'my-leads') {
      return teamLeads.filter((l) => Number(l.assignedToId) === Number(currentUser?.id));
    }
    return [];
  }, [teamLeads, activeTab, currentUser?.id]);

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return activeMembers;
    const q = search.trim().toLowerCase();
    return activeMembers.filter(
      (m) =>
        m.user?.name?.toLowerCase().includes(q) ||
        m.user?.email?.toLowerCase().includes(q) ||
        m.memberRole?.toLowerCase().includes(q)
    );
  }, [activeMembers, search]);

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return tabLeads;
    const q = search.trim().toLowerCase();
    return tabLeads.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.mobile?.toLowerCase().includes(q) ||
        l.assignedTo?.name?.toLowerCase().includes(q) ||
        l.course?.name?.toLowerCase().includes(q) ||
        l.source?.name?.toLowerCase().includes(q)
    );
  }, [tabLeads, search]);

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setPage(1);
    setSearch('');
    setSelectedLeads([]);
  }, [activeTab]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => forceHideLoader(), 100);
    return () => clearTimeout(t);
  }, [forceHideLoader]);

  // ── Pagination Math ──────────────────────────────────────────────────────────
  const paginatedData = useMemo(() => {
    const data = activeTab === 'members' ? filteredMembers : filteredLeads;
    const start = (page - 1) * PAGE_SIZE;
    return data.slice(start, start + PAGE_SIZE);
  }, [activeTab, filteredMembers, filteredLeads, page]);

  const totalItems = activeTab === 'members' ? filteredMembers.length : filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const pagination = { page, totalPages, total: totalItems, limit: PAGE_SIZE };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleRefresh = () => {
    refetchActiveTeam();
    if (activeTeamId) {
      refetchTeam();
      refetchLeads();
    }
  };
  const isRefreshing = loadingActiveTeam || loadingTeamDetails || loadingLeads || isFetchingLeads;

  const openAssignDrawer = (leadsArr) => {
    setLeadsToAssign(leadsArr);
    setIsAssignDrawerOpen(true);
  };

  // ── Early Return Guards ──────────────────────────────────────────────────────
  if (loadingActiveTeam || (activeTeamId && loadingTeamDetails)) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-[88px] rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  if (activeTeamError || (activeTeamId && teamError)) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader title="My Team" description="View team members and manage team leads." icon={Users2} />
        <Alert variant="error" title="Error" message="Unable to load team data. Please try refreshing." />
      </div>
    );
  }

  if (!activeTeamId || !teamDetails) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader title="My Team" description="View team members and manage team leads." icon={Users2} />
        <Alert variant="warning" title="No Active Team" message="You are not currently assigned to an active team." />
      </div>
    );
  }

  // ── Column Definitions ───────────────────────────────────────────────────────

  // Members Tab Columns (Clean read-only roster)
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
          <p className="font-bold text-slate-800 text-[13px]">
            {row.user?.name || '—'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{row.user?.employeeId || '—'}</p>
        </div>
      ),
    },
    {
      header: 'Email',
      cell: (row) => (
        <span className="text-slate-500 text-[12px] font-medium">{row.user?.email || '—'}</span>
      ),
    },
    {
      header: 'Role',
      cell: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
          {row.memberRole || 'Member'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => {
        const active = row.user?.status === 'ACTIVE';
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border
            ${active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {active ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
  ];

  // Lead Columns (Dynamic logic per tab: Team Pool hides "Assigned To"; Member Leads & My Leads display assignee)
  const buildLeadColumns = () => {
    const cols = [];

    // Row Index
    cols.push({
      header: '#',
      cell: (_, i) => (
        <span className="text-[11px] text-slate-400 font-semibold font-mono">
          {(page - 1) * PAGE_SIZE + i + 1}
        </span>
      ),
    });

    // Lead Name (Clickable to open LeadDetailDrawer)
    cols.push({
      header: 'Lead Name',
      sortable: true,
      accessorKey: 'name',
      cell: (row) => (
        <div className="min-w-0">
          <p
            className="text-[13px] font-bold text-slate-900 hover:text-orange-600 transition-colors cursor-pointer"
            onClick={() => setSelectedLeadForView(row)}
            title="Click to view detailed lead timeline & metadata"
          >
            {row.name}
          </p>
          {row.email ? (
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium truncate max-w-[200px]">
              {row.email}
            </p>
          ) : null}
        </div>
      ),
    });

    // Mobile Column
    cols.push({
      header: 'Mobile',
      cell: (row) => (
        <div className="text-[12px] font-semibold text-slate-700">
          <p>{row.mobile || '—'}</p>
          {row.alternateMobile ? (
            <p className="text-[10px] text-slate-400 font-medium">Alt: {row.alternateMobile}</p>
          ) : null}
        </div>
      ),
    });

    // Source Column
    cols.push({
      header: 'Source',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-200/50">
          <Compass size={11} className="text-slate-400" />
          {row.source?.name || '—'}
        </span>
      ),
    });

    // Course / Product Column
    cols.push({
      header: 'Course/Product',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-200/50">
          <Award size={11} className="text-slate-400" />
          {row.course?.name || '—'}
        </span>
      ),
    });

    // Status Column
    cols.push({
      header: 'Status',
      cell: (row) => {
        if ((row.opportunities && row.opportunities.length > 0) || row.isConverted) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CONVERTED
            </span>
          );
        }
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
    });

    // Priority Column
    cols.push({
      header: 'Priority',
      cell: (row) => {
        const priorityColors = {
          HIGH: 'text-red-700 bg-red-50 border-red-200/50',
          MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200/50',
          LOW: 'text-green-700 bg-green-50 border-green-200/50',
        };
        const style = priorityColors[row.priority] || priorityColors.MEDIUM;
        return (
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${style}`}>
            <ShieldAlert size={10} />
            {row.priority || 'MEDIUM'}
          </span>
        );
      },
    });

    // Assigned To Column — Omit completely in Team Pool tab (since all are unassigned)
    if (activeTab !== 'team-pool') {
      cols.push({
        header: 'Assigned To',
        cell: (row) => {
          if (activeTab === 'my-leads' || Number(row.assignedToId) === Number(currentUser?.id)) {
            return (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                <User size={12} className="text-blue-500" />
                <span>You</span>
              </span>
            );
          }
          if (row.assignedTo) {
            const roleName = row.assignedTo.userRoles?.[0]?.role?.name || row.assignedTo.primaryRole || 'ISE';
            return (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-700">
                <User size={12} className="text-slate-400" />
                <span>{row.assignedTo.name} ({roleName})</span>
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-400 italic">
              <HelpCircle size={12} className="text-slate-300" />
              <span>Unassigned</span>
            </span>
          );
        },
      });
    }

    // Created Date Column
    cols.push({
      header: 'Created',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-500">
          <Calendar size={11} className="text-slate-400" />
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }) : '—'}
        </span>
      ),
    });

    // Checkbox column — rendered if TEAM.canEdit is true
    if (canEditTeam && activeTab !== 'members') {
      cols.push({
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
            checked={selectedLeads.some((l) => l.id === row.id)}
            onChange={(e) => {
              if (e.target.checked) setSelectedLeads((prev) => [...prev, row]);
              else setSelectedLeads((prev) => prev.filter((l) => l.id !== row.id));
            }}
          />
        ),
      });
    }

    // Actions Column
    cols.push({
      header: 'Actions',
      align: 'right',
      isActionColumn: true,
      cell: (row) => (
        <div className="flex items-center justify-end">
          <LeadRowActions
            row={row}
            onViewDetails={setSelectedLeadForView}
            onAssign={(r) => openAssignDrawer([r])}
            canEdit={canEditTeam}
          />
        </div>
      ),
    });

    return cols;
  };

  const leadCols = buildLeadColumns();
  const currentTabInfo = TABS.find((t) => t.id === activeTab);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <PageHeader
        title="My Team"
        description={`${teamDetails.name} · Code: ${teamDetails.code} · Branch: ${teamDetails.branch?.name || 'Main Branch'}`}
        icon={Users2}
        actions={
          <div className="flex items-center gap-2">
            {/* Bulk Assign Button (Only visible if canEditTeam and leads selected) */}
            {canEditTeam && activeTab !== 'members' && selectedLeads.length > 0 && (
              <Button
                variant="contained"
                size="small"
                onClick={() => openAssignDrawer(selectedLeads)}
                sx={{ backgroundColor: '#F86F03', '&:hover': { backgroundColor: '#DE5D02' } }}
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <UserCheck size={14} />
                  Assign to ISE ({selectedLeads.length})
                </span>
              </Button>
            )}

            {/* Sync / Refresh Button */}
            <Button
              variant="outlined"
              onClick={handleRefresh}
              disabled={isRefreshing}
              size="small"
              sx={{ borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' } }}
            >
              <span className="flex items-center gap-1.5 font-bold">
                <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                Sync
              </span>
            </Button>
          </div>
        }
      />

      {/* Stat Cards (Straight non-curved border matching exact preference) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Team Members"
          value={leadStats.activeMembers}
          icon={Users2}
          iconBg="bg-orange-50 text-orange-600"
          loading={loadingTeamDetails}
        />
        <StatCard
          label="My Work"
          value={leadStats.myLeads}
          icon={Target}
          iconBg="bg-blue-50 text-blue-600"
          loading={loadingLeads}
          valueClass="text-blue-700"
        />
        <StatCard
          label="Unassigned Leads"
          value={leadStats.teamPool}
          icon={Inbox}
          iconBg="bg-amber-50 text-amber-600"
          loading={loadingLeads}
          valueClass="text-amber-700"
        />
        <StatCard
          label="Assigned Leads"
          value={leadStats.memberLeads}
          icon={UserCheck}
          iconBg="bg-emerald-50 text-emerald-600"
          loading={loadingLeads}
          valueClass="text-emerald-700"
        />
      </div>

      {/* Main Content Section */}
      <section className="">
        
        {/* Toolbar Header Panel above Table */}
        <div className="bg-white border-x border-t border-slate-200/60 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <SearchInput
              value={search}
              onChange={(val) => setSearch(val)}
              placeholder={
                activeTab === 'members'
                  ? 'Search team members by name, email, or role…'
                  : 'Search leads by name, email, mobile, assignee, or course…'
              }
              className="flex-1 min-w-[280px]"
            />

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap relative
                    ${activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {tab.label}
                  {tab.id === 'team-pool' && leadStats.teamPool > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-black">
                      {leadStats.teamPool}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Rendering */}
        {activeTab === 'members' ? (
          <Table
            columns={memberColumns}
            data={paginatedData}
            loadingState={loadingTeamDetails ? 'loading' : 'success'}
            emptyTitle="No Active Members"
            emptyDescription="There are no active members found in this team."
            className=" shadow-[0_4px_16px_rgba(0,0,0,0.02)]"
          />
        ) : (
          <Table
            columns={leadCols}
            data={paginatedData}
            loadingState={loadingLeads ? 'loading' : 'success'}
            emptyTitle={`No ${currentTabInfo?.label || 'Leads'}`}
            emptyDescription="No leads found matching your filters and search."
            className=" shadow-[0_4px_16px_rgba(0,0,0,0.02)]"
          />
        )}

        {/* Pagination Footer */}
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

      {/* Lead Detail Drawer (Opened when clicking Lead Name or View Details) */}
      {selectedLeadForView && (
        <LeadDetailDrawer
          lead={selectedLeadForView}
          onClose={() => setSelectedLeadForView(null)}
        />
      )}

      {/* Assign to ISE Drawer */}
      <AssignToISEDrawer
        isOpen={isAssignDrawerOpen}
        onClose={() => {
          setIsAssignDrawerOpen(false);
          setLeadsToAssign([]);
          setSelectedLeads([]);
        }}
        teamId={activeTeamId}
        leads={leadsToAssign}
        onSuccess={() => {
          setSelectedLeads([]);
          refetchLeads();
        }}
      />

      {/* Fallback Team Lead Assign Modal */}
      <TeamLeadAssignModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setLeadsToAssign([]);
          setSelectedLeads([]);
        }}
        teamId={activeTeamId}
        teamMembers={teamDetails?.members || []}
        leads={leadsToAssign}
        onSuccess={() => {
          setSelectedLeads([]);
          refetchLeads();
        }}
      />
    </div>
  );
};

export default MyTeamPage;
