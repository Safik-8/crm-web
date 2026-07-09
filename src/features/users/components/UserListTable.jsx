// src/features/users/components/UserListTable.jsx

import React from 'react';
import { Edit2, Key, Power, Eye } from 'lucide-react';
import Table from '../../../shared/components/elements/Table';
import Button from '../../../shared/components/elements/Button';

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
      className: 'font-semibold text-slate-700 text-[13px] whitespace-nowrap',
      cell: (row) => row.employeeId || 'N/A'
    },
    {
      header: 'Name',
      className: 'min-w-[200px]',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 text-[13px] font-bold shadow-sm border border-orange-200/50 uppercase">
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
      className: 'text-[13px] font-semibold text-slate-600',
      cell: (row) => {
        const primaryRole = row.userRoles?.find(ur => ur.isPrimary) || row.userRoles?.[0];
        return primaryRole?.role?.name || 'Member';
      }
    },
    {
      header: 'Branch',
      className: 'text-[13px] font-semibold text-slate-600',
      cell: (row) => row.branch?.name || 'Global / Company Wide'
    },
    {
      header: 'Reporting Manager',
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
      align: 'right',
      className: 'w-[140px]',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onViewDetails(row)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            title="View Details"
          >
            <Eye size={15} />
          </button>
          
          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => onEdit(row)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                title="Edit User"
              >
                <Edit2 size={15} />
              </button>

              <button
                type="button"
                onClick={() => onResetPassword(row)}
                className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                title="Reset Password"
              >
                <Key size={15} />
              </button>

              <button
                type="button"
                onClick={() => onToggleStatus(row)}
                className={`p-1.5 rounded-lg transition-all ${
                  row.status === 'ACTIVE'
                    ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                    : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'
                }`}
                title={row.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
              >
                <Power size={15} />
              </button>
            </>
          )}
        </div>
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
