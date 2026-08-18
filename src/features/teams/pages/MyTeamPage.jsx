import React, { useState, useEffect, useMemo } from 'react';
import { Users2, Target, Mail, Hash, User, ShieldAlert, GitBranch, Briefcase } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useLoader } from '../../../shared/context/LoaderContext';
import { useActiveTeamQuery, useTeamQuery } from '../hooks/useTeams';
import { useLeadsQuery, useAssignLeadsMutation } from '../../leads/hooks/useLeads';
import PageHeader from '../../../shared/components/modules/PageHeader';
import Table from '../../../shared/components/elements/Table';
import { DynamicFormSlideover } from '../../../shared/components/elements/DynamicFormSlideover';
import Button from '../../../shared/components/elements/Button';
import { toast } from '../../../shared/utils/toast';
import Alert from '../../../shared/components/elements/Alert';
import Skeleton from '../../../shared/components/elements/Skeleton';
import ExportMenu from '../../../shared/components/elements/ExportMenu';
import { Checkbox } from '@mui/material';

const MyTeamPage = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const { forceHideLoader } = useLoader();

  // ─── ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURN ─────────────────────

  // Queries
  const { data: activeTeamRes, isLoading: loadingActiveTeam } = useActiveTeamQuery();
  const activeTeamId = activeTeamRes?.id;

  const { data: teamDetails, isLoading: loadingTeamDetails } = useTeamQuery(activeTeamId);
  const { data: leadsRes, isLoading: loadingLeads } = useLeadsQuery({ teamId: activeTeamId, limit: 1000 });
  const assignLeadsMutation = useAssignLeadsMutation();

  // Local State
  const [activeTab, setActiveTab] = useState('assigned-to-me');
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);

  // Derived values (safe to compute even when data is null)
  const leads = leadsRes?.leads || [];
  const isTeamOwner = teamDetails?.bdeId === currentUser?.id;
  const canAssignLeads = (hasPermission('LEAD', 'canEdit') || hasPermission('LEAD', 'canCreate')) && isTeamOwner;
  const canViewLeads = hasPermission('LEAD', 'canView');
  const activeMembers = useMemo(
    () => (teamDetails?.members || []).filter(m => !m.removedAt && m.memberRole === 'ISE'),
    [teamDetails?.members]
  );

  // Hide loader
  useEffect(() => {
    const timer = setTimeout(() => { forceHideLoader(); }, 100);
    return () => clearTimeout(timer);
  }, [forceHideLoader]);

  // Derived Leads Data
  const filteredLeads = useMemo(() => {
    // Strict scoping: Must belong to current active team
    const validLeads = leads.filter(l => l.teamId === activeTeamId);

    if (activeTab === 'assigned-to-me') {
      return validLeads.filter(l => l.assignedToId === currentUser?.id);
    } else if (activeTab === 'unassigned') {
      return validLeads.filter(l => !l.assignedToId);
    } else if (activeTab === 'assigned-to-members') {
      return validLeads.filter(l => l.assignedToId && l.assignedToId !== currentUser?.id);
    }
    return [];
  }, [leads, activeTab, currentUser?.id, activeTeamId]);

  // Export payload — strictly mirrors the visible table
  const exportData = useMemo(() => filteredLeads.map(lead => ({
    'Lead Name': lead.name,
    'Mobile': lead.mobile,
    'Course': lead.course?.name || '-',
    'Source': lead.source?.name || '-',
    'Status': lead.status?.name || 'New',
    'Assigned To': lead.assignedTo?.name || 'Unassigned',
    'Created At': new Date(lead.createdAt).toLocaleDateString()
  })), [filteredLeads]);

  // Columns for Leads Table (must be a hook — called every render in the same order)
  const leadColumns = useMemo(() => {
    const cols = [];

    if (canAssignLeads) {
      cols.push({
        id: 'selection',
        header: (
          <Checkbox
            size="small"
            checked={filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedLeads(filteredLeads);
              } else {
                setSelectedLeads([]);
              }
            }}
          />
        ),
        cell: (info) => (
          <Checkbox
            size="small"
            checked={selectedLeads.some(l => l.id === info.row.original.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedLeads(prev => [...prev, info.row.original]);
              } else {
                setSelectedLeads(prev => prev.filter(l => l.id !== info.row.original.id));
              }
            }}
          />
        ),
      });
    }

    cols.push(
      { header: 'Lead Name', accessorKey: 'name' },
      { header: 'Course', accessorKey: 'course.name', cell: (info) => info.getValue() || '-' },
      { header: 'Source', accessorKey: 'source.name', cell: (info) => info.getValue() || '-' },
      {
        header: 'Status',
        cell: (info) => (
          <span className="px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded-lg">
            {info.row.original.status?.name || 'New'}
          </span>
        )
      },
      { header: 'Assigned To', accessorKey: 'assignedTo.name', cell: (info) => info.getValue() || 'Unassigned' }
    );

    if (canAssignLeads) {
      cols.push({
        header: 'Actions',
        cell: (info) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedLeads([info.row.original]);
              setIsAssignDrawerOpen(true);
            }}
          >
            Reassign
          </Button>
        )
      });
    }
    return cols;
  }, [canAssignLeads, filteredLeads, selectedLeads]);

  // ─── ALL HOOKS ABOVE — EARLY RETURNS BELOW ───────────────────────────────

  // Loading state
  if (loadingActiveTeam || loadingTeamDetails) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton height="100px" />
        <Skeleton height="300px" />
      </div>
    );
  }

  // No team
  if (!activeTeamId || !teamDetails) {
    return (
      <div className="p-6">
        <Alert variant="warning" title="No Team Assigned" message="You are not currently assigned to an active team." />
      </div>
    );
  }

  // Not the team owner
  if (!isTeamOwner) {
    return (
      <div className="p-6">
        <Alert variant="error" title="Access Denied" message="You must be the Team Owner to access this dashboard." />
      </div>
    );
  }

  // Columns for Members Table (static — no hook needed)
  const memberColumns = [
    { header: 'Name', accessorKey: 'user.name' },
    { header: 'Email', accessorKey: 'user.email' },
    { header: 'Employee ID', accessorKey: 'user.employeeId' },
    {
      header: 'Role',
      cell: (info) => (
        <span className="px-2 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
          {info.row.original.memberRole}
        </span>
      )
    },
  ];

  const drawerFields = [
    {
      key: 'assignedToId',
      label: 'Assign To Member',
      type: 'select',
      required: true,
      options: activeMembers.map(m => ({ value: m.userId, label: m.user.name })),
      placeholder: 'Select a team member...'
    }
  ];

  const handleAssignSubmit = async (values) => {
    try {
      await assignLeadsMutation.mutateAsync({
        leadIds: selectedLeads.map(l => l.id),
        assignedToId: Number(values.assignedToId),
        teamId: activeTeamId
      });
      toast.success('Leads assigned successfully!');
      setIsAssignDrawerOpen(false);
      setSelectedLeads([]);
    } catch (error) {
      // Error handled by mutation hook globally
    }
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
      <PageHeader
        title="My Team"
        description="Manage your team's leads, view performance, and assign prospects."
        icon={Users2}
      />

      <div className="px-4 lg:px-8 space-y-6 pb-20">

        {/* TEAM SUMMARY CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
            <ShieldAlert size={32} />
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Team Name</p>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                {teamDetails.name}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Team Code</p>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Hash size={14} className="text-slate-400" /> {teamDetails.code}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Branch</p>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <GitBranch size={14} className="text-slate-400" /> {teamDetails.branch?.name}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Owner</p>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <User size={14} className="text-slate-400" /> {teamDetails.bde?.name}
              </p>
            </div>
          </div>
        </div>

        {/* TEAM MEMBERS SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200/60 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-200/60 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users2 size={16} className="text-orange-500" />
              Active Team Members (ISE)
            </h3>
          </div>
          <div className="p-0">
            <Table
              columns={memberColumns}
              data={activeMembers}
              loadingState="success"
              emptyTitle="No Active Members"
              emptyDescription="There are no active ISE members in this team."
            />
          </div>
        </div>

        {/* TEAM LEADS SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200/60 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Target size={16} className="text-orange-500" />
              Team Leads Pipeline
            </h3>

            {/* Tabs & Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 self-stretch sm:self-auto">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
                <button
                  onClick={() => { setActiveTab('assigned-to-me'); setSelectedLeads([]); }}
                  className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'assigned-to-me' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  My Leads
                </button>
                <button
                  onClick={() => { setActiveTab('unassigned'); setSelectedLeads([]); }}
                  className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'unassigned' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Team Pool
                </button>
                <button
                  onClick={() => { setActiveTab('assigned-to-members'); setSelectedLeads([]); }}
                  className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'assigned-to-members' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Member Leads
                </button>
              </div>

              {/* Bulk Actions */}
              {canAssignLeads && selectedLeads.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Briefcase}
                  onClick={() => setIsAssignDrawerOpen(true)}
                >
                  Assign ({selectedLeads.length})
                </Button>
              )}

              <ExportMenu
                data={exportData}
                filename={`Team_Leads_${activeTab}`}
                disabled={exportData.length === 0}
              />
            </div>
          </div>
          <div className="p-0">
            {canViewLeads ? (
              <Table
                columns={leadColumns}
                data={filteredLeads}
                loadingState={loadingLeads ? 'loading' : 'success'}
                emptyTitle="No Leads"
                emptyDescription={`No leads found in the "${activeTab.replace(/-/g, ' ')}" category.`}
              />
            ) : (
              <div className="p-6">
                <Alert variant="warning" title="No Permission" message="You do not have permission to view leads." />
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Assignment Drawer */}
      <DynamicFormSlideover
        isOpen={isAssignDrawerOpen}
        onClose={() => {
          setIsAssignDrawerOpen(false);
          setSelectedLeads([]);
        }}
        title="Assign Lead to Team Member"
        subtitle={`Assigning ${selectedLeads.length} lead(s) to a team member.`}
        icon={Briefcase}
        fields={drawerFields}
        initialValues={{ assignedToId: '' }}
        onSubmit={handleAssignSubmit}
        submitText="Assign Lead"
      />

    </div>
  );
};

export default MyTeamPage;
