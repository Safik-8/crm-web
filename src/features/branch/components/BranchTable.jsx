// src/features/branch/components/BranchTable.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, GitBranch, Users, Hash, UserPlus, Calendar, Power, MoreVertical } from 'lucide-react';
import { Menu, MenuItem, IconButton } from '@mui/material';
import Skeleton from '../../../shared/components/elements/Skeleton';
import Table from '../../../shared/components/elements/Table';

const ActionMenu = ({ branch, canEdit, onEdit, onToggleStatus, onAssignUser }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };

  if (!canEdit) {
    return (
      <IconButton disabled size="small" className="text-slate-300">
        <MoreVertical size={18} />
      </IconButton>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <IconButton
        onClick={handleClick}
        size="small"
        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
      >
        <MoreVertical size={18} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.08))',
            mt: 0.5,
            borderRadius: '12px',
            minWidth: 160,
            border: '1px solid #f1f5f9',
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              fontSize: '13px',
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 600,
              color: '#475569',
              gap: '10px',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: '#f8fafc',
              }
            }
          }
        }}
      >
        <MenuItem onClick={(e) => { handleClose(e); onEdit(branch); }} sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Edit2 size={16} className="text-slate-400" />
          Edit Details
        </MenuItem>
        <MenuItem onClick={(e) => { handleClose(e); onAssignUser(branch); }} sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserPlus size={16} className="text-slate-400" />
          Assign User
        </MenuItem>
        <MenuItem onClick={(e) => { handleClose(e); navigate(`/teams`, { state: { openCreate: true, branchId: branch.id, companyId: branch.companyId } }); }} sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GitBranch size={16} className="text-slate-400" />
          Create Team
        </MenuItem>
        <MenuItem
          onClick={(e) => { handleClose(e); onToggleStatus(branch); }}
          sx={{ display: 'flex', alignItems: 'center', gap: '10px', color: branch.status === 'ACTIVE' ? '#ef4444 !important' : '#10b981 !important' }}
        >
          <Power size={16} className={branch.status === 'ACTIVE' ? 'text-red-400' : 'text-emerald-400'} />
          {branch.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        </MenuItem>
      </Menu>
    </div>
  );
};

// ── Status badge ──────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => (
  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${status === 'ACTIVE'
      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
      : 'bg-slate-500/10 text-slate-500 border-slate-500/20 '
    }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-slate-400'
      }`} />
    {status}
  </div>
);

/**
 * BranchTable Component
 * Integrated with professional UI styling and ActionMenu.
 */
const BranchTable = ({ branches = [], isLoading, onEdit, onToggleStatus, onAssignUser, canEdit }) => {
  const navigate = useNavigate();
  const columns = [
    {
      header: 'Branch Name',
      cell: (branch) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center text-primary border border-primary/10 group-hover:from-primary group-hover:to-orange-600 group-hover:text-white transition-all duration-300">
            <GitBranch size={20} />
          </div>
          <div>
            <span className="font-bold text-slate-900 font-heading text-[15px] hover:text-primary transition-colors cursor-pointer">{branch.name}</span>
            {branch.company && (
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{branch.company.name}</p>
            )}
          </div>
        </div>
      ),
      skeleton: () => <Skeleton className="h-5 w-44" />,
    },
    {
      header: 'Branch Code',
      cell: (branch) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-slate-50 text-slate-600 border border-slate-200 uppercase tracking-tighter ">
          {branch.code}
        </span>
      ),
      skeleton: () => <Skeleton className="h-5 w-20" />,
    },
    {
      header: 'Location',
      cell: (branch) => branch.location || <span className="text-slate-400 font-normal italic">None</span>,
      skeleton: () => <Skeleton className="h-5 w-32" />,
    },
    {
      header: 'Status',
      cell: (branch) => <StatusBadge status={branch.status} />,
      skeleton: () => <Skeleton className="h-6 w-20 rounded-full" />,
    },
    {
      header: 'User Count',
      cell: (branch) => (
        <div
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/users`, { state: { filterBranchId: branch.id, filterCompanyId: branch.companyId } });
          }}
          className="flex items-center gap-2 text-slate-600 cursor-pointer hover:text-primary transition-colors group"
        >
          <div className="h-7 w-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100  group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Users size={14} />
          </div>
          <span className="font-bold text-sm tracking-tight">{branch._count?.users || 0}</span>
        </div>
      ),
      skeleton: () => <Skeleton className="h-5 w-12" />,
    },
    {
      header: 'Team Count',
      cell: (branch) => (
        <div
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/teams`, { state: { filterBranchId: branch.id, filterCompanyId: branch.companyId } });
          }}
          className="flex items-center gap-2 text-slate-600 cursor-pointer hover:text-primary transition-colors group"
        >
          <div className="h-7 w-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100  group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <GitBranch size={14} />
          </div>
          <span className="font-bold text-sm tracking-tight">{branch._count?.teams || 0}</span>
        </div>
      ),
      skeleton: () => <Skeleton className="h-5 w-12" />,
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (branch) => (
        <div className="flex items-center justify-end">
          <ActionMenu
            branch={branch}
            canEdit={canEdit}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            onAssignUser={onAssignUser}
          />
        </div>
      ),
      skeleton: () => <Skeleton className="h-8 w-8 rounded-full ml-auto" />,
    }
  ];

  // Render loading skeletons for mobile cards
  const renderMobileSkeletons = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white p-4 border border-slate-200 ">
          <div className="flex items-start gap-3 mb-4">
            <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-5 w-32 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );

  // Mobile Card Layout
  const renderMobileCards = () => {
    if (branches.length === 0) {
      return (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <GitBranch size={32} />
            </div>
            <div>
              <p className="font-semibold text-slate-800">No branches found</p>
              <p className="text-sm text-slate-400 mt-1">There are no branch records registered.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="bg-white  shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 overflow-hidden group relative border border-slate-100"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-11 w-11 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center text-primary border border-primary/10 group-hover:from-primary group-hover:to-orange-600 group-hover:text-white transition-all duration-300 shrink-0 ">
                    <GitBranch size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 font-heading text-[16px] leading-tight line-clamp-2 hover:text-primary transition-colors text-left focus:outline-none w-full">
                      {branch.name}
                    </h3>
                    {branch.location && (
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{branch.location}</p>
                    )}
                    {branch.company && (
                      <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{branch.company.name}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-widest shadow-inner">
                        {branch.code}
                      </span>
                      <StatusBadge status={branch.status} />
                    </div>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  <ActionMenu
                    branch={branch}
                    canEdit={canEdit}
                    onEdit={onEdit}
                    onToggleStatus={onToggleStatus}
                    onAssignUser={onAssignUser}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                <div
                  onClick={() => navigate(`/users`, { state: { filterBranchId: branch.id, filterCompanyId: branch.companyId } })}
                  className="flex flex-col items-center justify-center py-2 bg-slate-50 rounded-xl border border-transparent cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="font-black text-sm text-slate-800 leading-none mb-1">
                    {branch._count?.users ?? 0}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase tracking-wide">
                    <Users size={10} />
                    Users
                  </div>
                </div>

                <div
                  onClick={() => navigate(`/teams`, { state: { filterBranchId: branch.id, filterCompanyId: branch.companyId } })}
                  className="flex flex-col items-center justify-center py-2 bg-slate-50 rounded-xl border border-transparent cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="font-black text-sm text-slate-800 leading-none mb-1">
                    {branch._count?.teams ?? 0}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase tracking-wide">
                    <GitBranch size={10} />
                    Teams
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-2 bg-slate-50 rounded-xl border border-transparent">
                  <div className="font-bold text-[11px] text-slate-700 leading-none mb-1 whitespace-nowrap">
                    {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                    <Calendar size={10} />
                    Created
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className=" overflow-hidden">
      {/* Mobile Layout */}
      <div className="block lg:hidden p-3 sm:p-4">
        {isLoading ? renderMobileSkeletons() : renderMobileCards()}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
        <Table
          columns={columns}
          data={branches}
          loadingState={isLoading ? 'loading' : branches.length === 0 ? 'empty' : 'success'}
          emptyTitle="No branches found"
          emptyDescription="There are no branch records registered for this company."
          emptyIcon={GitBranch}
          skeletonRows={5}
        />
      </div>
    </div>
  );
};

export default BranchTable;
