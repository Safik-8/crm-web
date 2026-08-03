// src/features/teams/components/TeamListTable.jsx

import React, { useState } from 'react';
import { Eye, Edit3, Trash2, Power, MoreVertical } from 'lucide-react';
import { Menu, MenuItem, IconButton } from '@mui/material';
import Table from '../../../shared/components/elements/Table';

const ActionMenu = ({ team, onViewDetails, onEdit, onToggleStatus, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = (event) => {
    if(event) event.stopPropagation();
    setAnchorEl(null);
  };

  const isActive = team.status === 'ACTIVE';

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
        <MenuItem onClick={(e) => { handleClose(e); onViewDetails(team); }} sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Eye size={16} className="text-slate-400" />
          View Details
        </MenuItem>
        {!team.isDeleted && (
          <>
            <MenuItem onClick={(e) => { handleClose(e); onEdit(team); }} sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Edit3 size={16} className="text-slate-400" />
              Edit Team
            </MenuItem>
            <MenuItem 
              onClick={(e) => { handleClose(e); onToggleStatus(team); }}
              sx={{ display: 'flex', alignItems: 'center', gap: '10px', color: isActive ? '#ef4444 !important' : '#10b981 !important' }}
            >
              <Power size={16} className={isActive ? 'text-red-400' : 'text-emerald-400'} />
              {isActive ? 'Deactivate' : 'Activate'}
            </MenuItem>
            <MenuItem onClick={(e) => { handleClose(e); onDelete(team); }} sx={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444 !important' }}>
              <Trash2 size={16} className="text-red-400" />
              Archive Team
            </MenuItem>
          </>
        )}
      </Menu>
    </div>
  );
};

const TeamListTable = ({
  teams = [],
  loadingState = 'success',
  errorMessage = '',
  onRetry,
  onViewDetails,
  onEdit,
  onToggleStatus,
  onDelete,
  hasActiveFilters = false,
  onClearFilters
}) => {
  const columns = [
    {
      header: 'Team Name',
      cell: (row) => (
        <span className="font-bold text-slate-800 text-[13px]">{row.name}</span>
      )
    },
    {
      header: 'Team Code',
      cell: (row) => (
        <code className="font-mono text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase border border-slate-200/50">
          {row.code}
        </code>
      )
    },
    {
      header: 'Branch',
      cell: (row) => (
        <span className="text-slate-600 text-xs font-semibold">{row.branch?.name || 'N/A'}</span>
      )
    },
    {
      header: 'Team Owner',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="text-slate-700 text-xs font-bold">{row.bde?.name || 'Unassigned'}</span>
          {row.bde?.email && (
            <span className="text-slate-400 text-[10px]">{row.bde.email}</span>
          )}
        </div>
      )
    },
    {
      header: 'Total Members',
      cell: (row) => (
        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100 min-w-[32px]">
          {row.members?.length || 0}
        </span>
      )
    },
    {
      header: 'Status',
      cell: (row) => {
        if (row.isDeleted) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-rose-50 text-rose-700 border-rose-100">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              ARCHIVED
            </span>
          );
        }
        const isActive = row.status === 'ACTIVE';
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-slate-50 text-slate-600 border-slate-100'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end">
          <ActionMenu
            team={row}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
          />
        </div>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      data={teams}
      loadingState={loadingState}
      errorMessage={errorMessage}
      onRetry={onRetry}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={onClearFilters}
      className=""
    />
  );
};

export default TeamListTable;
