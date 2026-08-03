// src/features/company/components/CompanyTable.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit2, Building2, Users, Calendar, GitBranch,
  ChevronRight, AlertCircle, RefreshCcw, SearchX,
  Power, MoreVertical
} from 'lucide-react';
import { Menu, MenuItem, IconButton } from '@mui/material';
import Skeleton from '../../../shared/components/elements/Skeleton';
import Table from '../../../shared/components/elements/Table';

const ActionMenu = ({ company, canEdit, onEdit, onToggleStatus }) => {
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
        <MenuItem onClick={(e) => { handleClose(e); onEdit(company); }} sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Edit2 size={16} className="text-slate-400" />
          Edit Details
        </MenuItem>
        <MenuItem
          onClick={(e) => { handleClose(e); onToggleStatus(company); }}
          sx={{ display: 'flex', alignItems: 'center', gap: '10px', color: company.status === 'ACTIVE' ? '#ef4444 !important' : '#10b981 !important' }}
        >
          <Power size={16} className={company.status === 'ACTIVE' ? 'text-red-400' : 'text-emerald-400'} />
          {company.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        </MenuItem>
      </Menu>
    </div>
  );
};

/**
 * CompanyTable
 * Renders the lists of organization entities using Material Design aesthetics.
 */
const CompanyTable = ({
  companies = [],
  loadingState = 'loading',
  errorMessage = '',
  onEdit,
  onToggleStatus,
  canEdit,
  onRetry,
  hasActiveFilters = false,
  onClearFilters,
}) => {
  const navigate = useNavigate();
  const isLoading = loadingState === 'loading';

  const columns = [
    {
      header: 'Logo',
      cell: (company) => (
        <div className="relative flex items-center">
          {company.logo ? (
            <img
              src={company.logo}
              alt={`${company.name} logo`}
              className="h-10 w-10 rounded-xl object-cover shrink-0 border border-slate-200 shadow-sm"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            style={{ display: company.logo ? 'none' : 'flex' }}
            className="h-10 w-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:from-primary group-hover:to-orange-600 group-hover:text-white transition-all duration-300 shadow-sm"
          >
            <Building2 size={18} />
          </div>
        </div>
      ),
      skeleton: () => <Skeleton className="h-10 w-10 rounded-xl" />,
    },
    {
      header: 'Company Name',
      headerClassName: 'whitespace-nowrap',
      cell: (company) => (
        <button
          onClick={() => navigate(`/settings/organization?companyId=${company.id}`)}
          className="font-bold text-slate-800 font-heading text-[15px] hover:text-primary transition-colors text-left focus:outline-none"
        >
          {company.name}
        </button>
      ),
      skeleton: () => <Skeleton className="h-5 w-40" />,
    },
    {
      header: 'Company Code',
      cell: (company) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black bg-slate-50 text-slate-600 border border-slate-200 uppercase tracking-tighter shadow-sm">
          {company.code}
        </span>
      ),
      skeleton: () => <Skeleton className="h-6 w-16 rounded-lg" />,
    },
    {
      header: 'Industry',
      cell: (company) => company.industry || <span className="text-slate-400 font-normal italic">None</span>,
      skeleton: () => <Skeleton className="h-5 w-24" />,
    },
    {
      header: 'Status',
      cell: (company) => <StatusBadge status={company.status} />,
      skeleton: () => <Skeleton className="h-6 w-20 rounded-full" />,
    },
    {
      header: 'Branch Count',
      cell: (company) => (
        <button
          onClick={() => navigate(`/companies/${company.id}/branches`)}
          className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors group/branch focus:outline-none"
          title="View Branches"
        >
          <div className="h-7 w-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover/branch:bg-primary/10 group-hover/branch:text-primary transition-all border border-slate-100 group-hover/branch:border-primary/20 shadow-sm">
            <GitBranch size={14} />
          </div>
          <span className="font-bold text-sm group-hover/branch:text-primary transition-colors">
            {company._count?.branches ?? 0}
          </span>
        </button>
      ),
      skeleton: () => <Skeleton className="h-5 w-10" />,
    },
    {
      header: 'User Count',
      cell: (company) => (
        <button
          onClick={() => navigate(`/users`, { state: { filterCompanyId: company.id } })}
          className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors group/user focus:outline-none"
          title="View Users"
        >
          <div className="h-7 w-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover/user:bg-primary/10 group-hover/user:text-primary transition-all border border-slate-100 group-hover/user:border-primary/20 shadow-sm">
            <Users size={14} />
          </div>
          <span className="font-bold text-sm group-hover/user:text-primary transition-colors">
            {company._count?.users ?? 0}
          </span>
        </button>
      ),
      skeleton: () => <Skeleton className="h-5 w-10" />,
    },
    {
      header: 'Created Date',
      headerClassName: 'whitespace-nowrap',
      cell: (company) => (
        <div className="flex items-center gap-2 text-slate-500 text-[13px] font-medium whitespace-nowrap">
          <Calendar size={14} className="opacity-60 shrink-0" />
          {new Date(company.createdAt).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
          })}
        </div>
      ),
      skeleton: () => <Skeleton className="h-5 w-32" />,
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (company) => (
        <div className="flex items-center justify-end">
          <ActionMenu
            company={company}
            canEdit={canEdit}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
          />
        </div>
      ),
      skeleton: () => <Skeleton className="h-8 w-8 rounded-full ml-auto" />,
    }
  ];

  // ── Status badge ──────────────────────────────────────────────────────────
  const StatusBadge = ({ status }) => (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${status === 'ACTIVE'
        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
        : 'bg-slate-500/10 text-slate-500 border-slate-500/20 shadow-sm'
      }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-slate-400'
        }`} />
      {status}
    </div>
  );

  // ── Skeleton cards (mobile) ───────────────────────────────────────────────
  const MobileSkeletons = () => (
    <div className="space-y-3 mt-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-5 w-36 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-14 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );

  // ── Error state ───────────────────────────────────────────────────────────
  const ErrorState = ({ colSpan }) => {
    const inner = (
      <div className="flex flex-col items-center gap-4 py-14 px-6 text-center">
        <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-400 shadow-sm">
          <AlertCircle size={30} strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-base">Failed to load companies</p>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">
            {errorMessage || 'Something went wrong. Please try again.'}
          </p>
        </div>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold
                     hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-95"
        >
          <RefreshCcw size={15} />
          Retry
        </button>
      </div>
    );
    return colSpan
      ? <tr><td colSpan={colSpan}>{inner}</td></tr>
      : <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mt-2">{inner}</div>;
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  const EmptyState = ({ colSpan }) => {
    const inner = (
      <div className="flex flex-col items-center gap-4 py-14 px-6 text-center">
        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
          {hasActiveFilters ? <SearchX size={30} strokeWidth={1.5} /> : <Building2 size={30} strokeWidth={1.5} />}
        </div>
        <div>
          <p className="font-bold text-slate-800 text-base">
            {hasActiveFilters ? 'No results found' : 'No companies yet'}
          </p>
          <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            {hasActiveFilters
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Get started by adding your first company.'}
          </p>
        </div>
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold
                       hover:bg-slate-200 transition-all active:scale-95 shadow-sm mt-2"
          >
            <SearchX size={15} />
            Clear Filters
          </button>
        )}
      </div>
    );
    return colSpan
      ? <tr><td colSpan={colSpan}>{inner}</td></tr>
      : <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mt-2">{inner}</div>;
  };

  // ── Mobile card ───────────────────────────────────────────────────────────
  const MobileCard = ({ company }) => (
    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 overflow-hidden group relative border border-slate-100">
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 min-w-0">
            {/* Logo */}
            {company.logo ? (
              <img
                src={company.logo}
                alt={`${company.name} logo`}
                className="h-11 w-11 rounded-xl object-cover shrink-0 border border-slate-200 shadow-sm"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              style={{ display: company.logo ? 'none' : 'flex' }}
              className="h-11 w-11 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:from-primary group-hover:to-orange-600 group-hover:text-white transition-all duration-300 shadow-sm"
            >
              <Building2 size={19} />
            </div>

            <div className="flex-1 min-w-0">
              <button
                onClick={() => navigate(`/settings/organization?companyId=${company.id}`)}
                className="font-black text-slate-900 font-heading text-[16px] leading-tight line-clamp-2 hover:text-primary transition-colors text-left focus:outline-none w-full"
              >
                {company.name}
              </button>
              {company.industry && (
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">{company.industry}</span>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-widest shadow-inner">
                  {company.code}
                </span>
                <StatusBadge status={company.status} />
              </div>
            </div>
          </div>

          {/* Actions - using Three Dot Menu */}
          <div className="shrink-0 ml-2">
            <ActionMenu
              company={company}
              canEdit={canEdit}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
            />
          </div>
        </div>

        {/* Stats row - Modernized for professional look */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
          {/* Branches */}
          <button
            onClick={() => navigate(`/companies/${company.id}/branches`)}
            className="flex flex-col items-center justify-center py-2 bg-slate-50 hover:bg-primary/5 rounded-xl transition-all group/branch border border-transparent hover:border-primary/20 focus:outline-none"
            title="View Branches"
          >
            <div className="font-black text-sm text-slate-800 group-hover/branch:text-primary transition-colors leading-none mb-1">
              {company._count?.branches ?? 0}
            </div>
            <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase tracking-wide">
              <GitBranch size={10} className="group-hover/branch:text-primary" />
              Branches
            </div>
          </button>

          {/* Users */}
          <button
            onClick={() => navigate(`/users`, { state: { filterCompanyId: company.id } })}
            className="flex flex-col items-center justify-center py-2 bg-slate-50 hover:bg-primary/5 rounded-xl transition-all group/user border border-transparent hover:border-primary/20 focus:outline-none"
            title="View Users"
          >
            <div className="font-black text-sm text-slate-800 group-hover/user:text-primary transition-colors leading-none mb-1">
              {company._count?.users ?? 0}
            </div>
            <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase tracking-wide">
              <Users size={10} className="group-hover/user:text-primary" />
              Users
            </div>
          </button>

          {/* Created date */}
          <div className="flex flex-col items-center justify-center py-2 bg-slate-50 rounded-xl border border-transparent">
            <div className="font-bold text-[11px] text-slate-700 leading-none mb-1 whitespace-nowrap">
              {new Date(company.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-wide">
              <Calendar size={10} />
              Created
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Mobile layout ─────────────────────────────────────────────────── */}
      <div className="block lg:hidden">
        {isLoading && <MobileSkeletons />}
        {!isLoading && loadingState === 'error' && <ErrorState />}
        {!isLoading && loadingState === 'empty' && <EmptyState />}
        {!isLoading && loadingState === 'success' && (
          <div className="space-y-3 mt-2">
            {companies.map((company) => (
              <MobileCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop table layout ───────────────────────────────────────────── */}
      <div className="hidden lg:block mt-4">
        <Table
          columns={columns}
          data={companies}
          loadingState={loadingState}
          errorMessage={errorMessage}
          onRetry={onRetry}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={onClearFilters}
          emptyTitle="No companies yet"
          emptyDescription="Get started by adding your first company."
          emptyIcon={Building2}
          skeletonRows={5}
        />
      </div>
    </>
  );
};

export default CompanyTable;
