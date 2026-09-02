// src/features/courses/components/CourseListTable.jsx

import React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Edit2, Power, Trash2, Eye, MoreVertical } from 'lucide-react';
import Table from '../../../shared/components/elements/Table';
import Skeleton from '../../../shared/components/elements/Skeleton';

/**
 * Renders actions dropdown menu for a specific row in the course table.
 * Enforces action accessibility checks based on user permissions.
 */
const RowActionsMenu = ({
  row,
  canEdit,
  canDelete,
  onViewDetails,
  onEdit,
  onToggleStatus,
  onDelete
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
          className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800"
          sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <Eye size={14} className="text-slate-400" />
          <span>View Details</span>
        </MenuItem>

        {canEdit && (
          <>
            <MenuItem
              onClick={() => handleAction(onEdit)}
              className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800 border-t border-slate-100/50"
              sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <Edit2 size={13} className="text-slate-400" />
              <span>Edit Course</span>
            </MenuItem>

            <MenuItem
              onClick={() => handleAction(onToggleStatus)}
              className={`px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors border-t border-slate-100/50 ${
                isActive
                  ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50/30'
                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/30'
              }`}
              sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <Power size={13} className={isActive ? 'text-rose-400' : 'text-emerald-400'} />
              <span>{isActive ? 'Deactivate' : 'Activate'}</span>
            </MenuItem>
          </>
        )}

        {canDelete && (
          <MenuItem
            onClick={() => handleAction(onDelete)}
            className="px-3.5 py-2 text-[12px] font-bold hover:bg-slate-50 transition-colors text-rose-600 hover:text-rose-700 hover:bg-rose-50/30 border-t border-slate-100/50"
            sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Trash2 size={13} className="text-rose-400" />
            <span>Delete Course</span>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

/**
 * Reusable table component for Courses master records.
 * Uses shared `<Table>` element and provides full responsive column layouts.
 */
export const CourseListTable = ({
  data = [],
  loading = false,
  canEdit = false,
  canDelete = false,
  onViewDetails,
  onEdit,
  onToggleStatus,
  onDelete,
  sortBy,
  sortOrder,
  onSort
}) => {
  const { formatCurrency } = useFormatters();

  const columns = [
    {
      header: 'Code',
      accessorKey: 'code',
      align: 'left',
      sortable: true,
      className: 'font-semibold text-slate-700 text-[13px] whitespace-nowrap',
      cell: (row) => (
        <div className="flex justify-start">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200 uppercase tracking-wider">
            {row.code}
          </span>
        </div>
      ),
      skeleton: () => (
        <div className="flex justify-start">
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
      )
    },
    {
      header: 'Course Name',
      accessorKey: 'name',
      align: 'left',
      sortable: true,
      className: 'min-w-[260px]',
      cell: (row) => (
        <div className="flex items-center gap-3 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 text-[13px] font-bold shadow-sm border border-orange-200/50 uppercase flex-shrink-0">
            {row.name?.charAt(0) || 'C'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-[13px] leading-tight truncate">
              {row.name}
            </p>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5 max-w-[250px]" title={row.description}>
              {row.description || 'No description provided'}
            </p>
          </div>
        </div>
      ),
      skeleton: () => (
        <div className="flex items-center gap-3 text-left">
          <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-3 w-48 rounded-md" />
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessorKey: 'category',
      align: 'left',
      sortable: true,
      className: 'text-[13px] font-semibold text-slate-600',
      cell: (row) => (
        <div className="text-left">
          <p className="font-semibold text-slate-700">{row.category}</p>
          {row.parentCategory && (
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{row.parentCategory}</p>
          )}
        </div>
      ),
      skeleton: () => (
        <div className="text-left space-y-1.5">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
      )
    },
    {
      header: 'Price',
      accessorKey: 'price',
      align: 'left',
      sortable: true,
      className: 'text-[13px] font-bold text-slate-800',
      cell: (row) => formatCurrency(row.price),
      skeleton: () => <Skeleton className="h-4 w-16 rounded-md" />
    },
    {
      header: 'Duration',
      accessorKey: 'duration',
      align: 'left',
      className: 'text-[13px] text-slate-600 font-medium',
      cell: (row) => {
        if (!row.duration) return 'N/A';
        const match = row.duration.match(/\d+/);
        return match ? `${match[0]} months` : row.duration;
      },
      skeleton: () => <Skeleton className="h-4 w-20 rounded-md" />
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'left',
      sortable: true,
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
      },
      skeleton: () => (
        <div className="flex justify-start">
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      className: 'w-[60px]',
      cell: (row) => (
        <div className="flex justify-end">
          <RowActionsMenu
            row={row}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
      ),
      skeleton: () => (
        <div className="flex justify-end">
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      data={courses}
      loadingState={loadingState}
      errorMessage={errorMessage}
      onRetry={onRetry}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={onClearFilters}
      emptyTitle="No courses found"
      emptyDescription="Could not find any course records matching the search term or status."
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
    />
  );
};

export default CourseListTable;
