// src/features/users/components/UserListTable.jsx

import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Key, Power, Eye, MoreVertical } from 'lucide-react';
import Table from '../../../shared/components/elements/Table';
import Button from '../../../shared/components/elements/Button';

const ActionMenu = ({ row, onViewDetails, onEdit, onResetPassword, onToggleStatus, canEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
        title="Actions"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
          <div className="py-1">
            <button
              onClick={() => { setIsOpen(false); onViewDetails(row); }}
              className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-primary flex items-center gap-2.5 transition-colors"
            >
              <Eye size={15} className="text-slate-400" /> View Details
            </button>
            {canEdit && (
              <>
                <button
                  onClick={() => { setIsOpen(false); onEdit(row); }}
                  className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-primary flex items-center gap-2.5 transition-colors"
                >
                  <Edit2 size={15} className="text-slate-400" /> Edit User
                </button>
                <button
                  onClick={() => { setIsOpen(false); onResetPassword(row); }}
                  className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2.5 transition-colors"
                >
                  <Key size={15} className="text-slate-400" /> Reset Password
                </button>
                <div className="h-px bg-slate-100 my-1"></div>
                <button
                  onClick={() => { setIsOpen(false); onToggleStatus(row); }}
                  className={`w-full text-left px-4 py-2.5 text-[13px] font-medium flex items-center gap-2.5 transition-colors ${
                    row.status === 'ACTIVE' 
                      ? 'text-rose-600 hover:bg-rose-50' 
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <Power size={15} className={row.status === 'ACTIVE' ? 'text-rose-500' : 'text-emerald-500'} />
                  {row.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
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
      align: 'center',
      className: 'whitespace-nowrap',
      cell: (row) => {
        const primaryRole = row.userRoles?.find(ur => ur.isPrimary) || row.userRoles?.[0];
        const roleName = primaryRole?.role?.name || 'MEMBER';
        
        let badgeColor = 'bg-slate-50 text-slate-600 border-slate-200/50';
        if (roleName === 'SUPER_ADMIN') badgeColor = 'bg-purple-50 text-purple-600 border-purple-200/50';
        else if (roleName === 'COMPANY_ADMIN') badgeColor = 'bg-blue-50 text-blue-600 border-blue-200/50';
        else if (roleName === 'BRANCH_MANAGER') badgeColor = 'bg-indigo-50 text-indigo-600 border-indigo-200/50';
        else if (roleName === 'BDE') badgeColor = 'bg-sky-50 text-sky-600 border-sky-200/50';
        else if (roleName === 'ISE') badgeColor = 'bg-amber-50 text-amber-600 border-amber-200/50';

        return (
          <div className="flex justify-center">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
              {roleName.replace('_', ' ')}
            </span>
          </div>
        );
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
      className: 'w-[60px]',
      cell: (row) => (
        <div className="flex justify-end">
          <ActionMenu
            row={row}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onResetPassword={onResetPassword}
            onToggleStatus={onToggleStatus}
            canEdit={canEdit}
          />
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
