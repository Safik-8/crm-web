import React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Edit2, Key, Power, Eye, MoreVertical } from 'lucide-react';
import Table from '../../../shared/components/elements/Table';
import Button from '../../../shared/components/elements/Button';

const RowActionsMenu = ({
  row,
  canEdit,
  onViewDetails,
  onEdit,
  onResetPassword,
  onToggleStatus
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (callback) => {
    handleClose();
    callback(row);
  };

  const isActive = row.status === 'ACTIVE';

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
        title="Actions"
      >
        <MoreVertical size={16} />
      </button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        elevation={0}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          className: "mt-1 shadow-lg border border-slate-200/80 rounded-xl bg-white min-w-[150px] py-1 text-slate-700 font-sans"
        }}
      >
        <MenuItem
          onClick={() => handleAction(onViewDetails)}
          className="flex items-center gap-2 px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800"
        >
          <Eye size={14} className="text-slate-400" />
          <span>View Details</span>
        </MenuItem>

        {canEdit && (
          <>
            <MenuItem
              onClick={() => handleAction(onEdit)}
              className="flex items-center gap-2 px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800 border-t border-slate-100/50"
            >
              <Edit2 size={13} className="text-slate-400" />
              <span>Edit User</span>
            </MenuItem>

            <MenuItem
              onClick={() => handleAction(onResetPassword)}
              className="flex items-center gap-2 px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800"
            >
              <Key size={13} className="text-slate-400" />
              <span>Reset Password</span>
            </MenuItem>

            <MenuItem
              onClick={() => handleAction(onToggleStatus)}
              className={`flex items-center gap-2 px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors border-t border-slate-100/50 ${
                isActive
                  ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50/30'
                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/30'
              }`}
            >
              <Power size={13} className={isActive ? 'text-rose-400' : 'text-emerald-400'} />
              <span>{isActive ? 'Deactivate User' : 'Activate User'}</span>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

const UserListTable = ({
  users = [],
  loadingState = 'success',
  errorMessage = '',
  onRetry,
  onViewDetails,
  onEdit,
  onResetPassword,
  onToggleStatus,
  hasActiveFilters,
  onClearFilters,
  canEdit = false
}) => {

  const columns = [
    {
      header: 'Employee ID',
      accessorKey: 'employeeId',
      align: 'center',
      className: 'font-semibold text-slate-700 text-[13px] whitespace-nowrap',
      cell: (row) => row.employeeId || 'N/A'
    },
    {
      header: 'Name',
      align: 'center',
      className: 'min-w-[200px]',
      cell: (row) => (
        <div className="flex items-center justify-center gap-3 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 text-[13px] font-bold shadow-sm border border-orange-200/50 uppercase flex-shrink-0">
            {row.firstName?.charAt(0) || row.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-[13px] leading-tight truncate">
              {row.name || `${row.firstName} ${row.lastName}`}
            </p>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              {row.email}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      align: 'center',
      className: 'text-[13px] font-semibold text-slate-600',
      cell: (row) => {
        const primaryRole = row.userRoles?.find(ur => ur.isPrimary) || row.userRoles?.[0];
        return primaryRole?.role?.name || 'Member';
      }
    },
    {
      header: 'Branch',
      align: 'center',
      className: 'text-[13px] font-semibold text-slate-600',
      cell: (row) => row.branch?.name || 'Global / Company Wide'
    },
    {
      header: 'Reporting Manager',
      align: 'center',
      className: 'text-[13px] text-slate-600 font-medium',
      cell: (row) => row.reportingManager?.name || (
        <span className="text-slate-300 font-semibold">—</span>
      )
    },
    {
      header: 'Status',
      align: 'center',
      className: 'whitespace-nowrap',
      cell: (row) => {
        const isActive = row.status === 'ACTIVE';
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider
                        ${isActive
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/30'
                          : 'bg-rose-50 text-rose-600 border border-rose-200/30'
                        }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      align: 'center',
      className: 'w-[80px]',
      cell: (row) => (
        <RowActionsMenu
          row={row}
          canEdit={canEdit}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onResetPassword={onResetPassword}
          onToggleStatus={onToggleStatus}
        />
      )
    }
  ];

  return (
    <Table
      columns={columns}
      data={users}
      loadingState={loadingState}
      errorMessage={errorMessage}
      onRetry={onRetry}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={onClearFilters}
      emptyTitle="No users found"
      emptyDescription="Could not find any user accounts matching the filters or query."
    />
  );
};

export default UserListTable;
