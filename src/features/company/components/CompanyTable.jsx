// src/features/company/components/CompanyTable.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit2, Building2, Users, Calendar, GitBranch,
  ChevronRight, AlertCircle, RefreshCcw, SearchX,
  Power
} from 'lucide-react';
import Skeleton from '../../../shared/components/elements/Skeleton';
import Table from '../../../shared/components/elements/Table';

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
              className="h-10 w-10 rounded-xl object-cover shrink-0 border border-slate-200"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            style={{ display: company.logo ? 'none' : 'flex' }}
            className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300"
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
        <span className="font-bold text-slate-900 font-heading text-[15px]">{company.name}</span>
      ),
      skeleton: () => <Skeleton className="h-5 w-40" />,
    },
    {
      header: 'Company Code',
      cell: (company) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-tighter">
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
          className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors group/branch"
          title="View Branches"
        >
          <div className="h-7 w-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover/branch:bg-primary/10 group-hover/branch:text-primary transition-all">
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
        <div className="flex items-center gap-2 text-slate-600">
          <div className="h-7 w-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
            <Users size={14} />
          </div>
          <span className="font-bold text-sm">
            {company._count?.users ?? 0}
          </span>
        </div>
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
      cell: (company) => (
        <div className="flex items-center gap-1.5">
          {canEdit ? (
            <>
              <button
                onClick={() => onToggleStatus(company)}
                className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-200 ${
                  company.status === 'ACTIVE'
                    ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title={company.status === 'ACTIVE' ? 'Deactivate Company' : 'Activate Company'}
              >
                <Power size={17} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => onEdit(company)}
                className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200"
                title="Edit Company"
              >
                <Edit2 size={17} strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <div className="flex gap-1.5">
              <span className="h-9 w-9 flex items-center justify-center text-slate-200 cursor-not-allowed">
                <Power size={17} strokeWidth={2} />
              </span>
              <span className="h-9 w-9 flex items-center justify-center text-slate-200 cursor-not-allowed">
                <Edit2 size={17} strokeWidth={2} />
              </span>
            </div>
          )}
        </div>
      ),
      skeleton: () => <Skeleton className="h-8 w-16 rounded-xl" />,
    }
  ];

  // ── Status badge ──────────────────────────────────────────────────────────
  const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
      status === 'ACTIVE'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : 'bg-slate-50 text-slate-500 border-slate-100'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
      }`} />
      {status}
    </span>
  );

  // ── Skeleton rows (desktop) ───────────────────────────────────────────────
  const DesktopSkeletons = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="border-b border-slate-100 last:border-0">
          <td className="py-4 px-6"><Skeleton className="h-10 w-10 rounded-xl" /></td>
          <td className="py-4 px-6"><Skeleton className="h-5 w-40" /></td>
          <td className="py-4 px-6"><Skeleton className="h-6 w-16 rounded-lg" /></td>
          <td className="py-4 px-6"><Skeleton className="h-5 w-24" /></td>
          <td className="py-4 px-6"><Skeleton className="h-6 w-20 rounded-full" /></td>
          <td className="py-4 px-6"><Skeleton className="h-5 w-10" /></td>
          <td className="py-4 px-6"><Skeleton className="h-5 w-10" /></td>
          <td className="py-4 px-6"><Skeleton className="h-5 w-32" /></td>
          <td className="py-4 px-6"><Skeleton className="h-8 w-16 rounded-xl" /></td>
        </tr>
      ))}
    </>
  );

  // ── Skeleton cards (mobile) ───────────────────────────────────────────────
  const MobileSkeletons = () => (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-5 w-36 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-14 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-8 w-16 rounded-lg shrink-0" />
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
      : <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">{inner}</div>;
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  const EmptyState = ({ colSpan }) => {
    const inner = (
      <div className="flex flex-col items-center gap-4 py-14 px-6 text-center">
        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 shadow-sm">
          {hasActiveFilters ? <SearchX size={30} strokeWidth={1.5} /> : <Building2 size={30} strokeWidth={1.5} />}
        </div>
        <div>
          <p className="font-bold text-slate-800 text-base">
            {hasActiveFilters ? 'No results found' : 'No companies yet'}
          </p>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">
            {hasActiveFilters
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Get started by adding your first company.'}
          </p>
        </div>
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold
                       hover:bg-slate-200 transition-all active:scale-95"
          >
            <SearchX size={15} />
            Clear Filters
          </button>
        )}
      </div>
    );
    return colSpan
      ? <tr><td colSpan={colSpan}>{inner}</td></tr>
      : <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">{inner}</div>;
  };

  // ── Mobile card ───────────────────────────────────────────────────────────
  const MobileCard = ({ company }) => (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start gap-3 mb-3">
          {/* Logo with Image fallbacks */}
          {company.logo ? (
            <img
              src={company.logo}
              alt={`${company.name} logo`}
              className="h-11 w-11 rounded-xl object-cover shrink-0 border border-slate-200"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            style={{ display: company.logo ? 'none' : 'flex' }}
            className="h-11 w-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300"
          >
            <Building2 size={19} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 font-heading text-[15px] leading-tight line-clamp-2">
              {company.name}
            </h3>
            {company.industry && (
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">{company.industry}</span>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wider">
                {company.code}
              </span>
              <StatusBadge status={company.status} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1 shrink-0">
            {canEdit && (
              <>
                <button
                  onClick={() => onToggleStatus(company)}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${
                    company.status === 'ACTIVE'
                      ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                  title={company.status === 'ACTIVE' ? 'Deactivate Company' : 'Activate Company'}
                >
                  <Power size={14} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => onEdit(company)}
                  className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                  title="Edit Company"
                >
                  <Edit2 size={14} strokeWidth={2.5} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
          {/* Branches */}
          <button
            onClick={() => navigate(`/companies/${company.id}/branches`)}
            className="flex items-center gap-1.5 flex-1 min-w-0 px-2.5 py-2 bg-slate-50 hover:bg-primary/5 rounded-xl transition-all group/branch border border-transparent hover:border-primary/20"
            title="View Branches"
          >
            <div className="h-6 w-6 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover/branch:text-primary transition-colors shadow-sm shrink-0">
              <GitBranch size={13} />
            </div>
            <div className="text-left min-w-0">
              <div className="font-black text-sm text-slate-900 group-hover/branch:text-primary transition-colors leading-none">
                {company._count?.branches ?? 0}
              </div>
              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">Branches</div>
            </div>
            <ChevronRight size={12} className="text-slate-300 group-hover/branch:text-primary transition-colors ml-auto shrink-0" />
          </button>

          {/* Users */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 px-2.5 py-2 bg-slate-50 rounded-xl border border-transparent">
            <div className="h-6 w-6 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm shrink-0">
              <Users size={13} />
            </div>
            <div className="text-left min-w-0">
              <div className="font-black text-sm text-slate-900 leading-none">
                {company._count?.users ?? 0}
              </div>
              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">Users</div>
            </div>
          </div>

          {/* Created date */}
          <div className="flex items-center gap-1.5 px-2 py-2 shrink-0">
            <Calendar size={12} className="text-slate-400 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-slate-700 leading-none whitespace-nowrap">
                {new Date(company.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">Created</div>
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
          <div className="space-y-2.5">
            {companies.map((company) => (
              <MobileCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop table layout ───────────────────────────────────────────── */}
      <div className="hidden lg:block">
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
