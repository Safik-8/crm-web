import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit2, Building2, Users, Calendar, GitBranch,
  ChevronRight, AlertCircle, RefreshCcw, SearchX,
} from 'lucide-react';
import Skeleton from '../../../shared/components/elements/Skeleton';

/**
 * CompanyTable
 * Handles all four render states: loading | success | error | empty
 *
 * Props:
 *   companies    {Array}    - current page of companies
 *   loadingState {string}   - 'loading' | 'success' | 'error' | 'empty'
 *   errorMessage {string}   - message shown in error state
 *   onEdit       {Function}
 *   canEdit      {boolean}
 *   onRetry      {Function} - called when user clicks "Retry" in error state
 *   hasActiveFilters {boolean} - used to tailor the empty-state message
 *   onClearFilters   {Function}
 */
const CompanyTable = ({
  companies = [],
  loadingState = 'loading',
  errorMessage = '',
  onEdit,
  canEdit,
  onRetry,
  hasActiveFilters = false,
  onClearFilters,
}) => {
  const navigate = useNavigate();
  const isLoading = loadingState === 'loading';

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
          <td className="py-4 px-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
              <Skeleton className="h-5 w-40" />
            </div>
          </td>
          <td className="py-4 px-6"><Skeleton className="h-6 w-16 rounded-lg" /></td>
          <td className="py-4 px-6"><Skeleton className="h-6 w-20 rounded-full" /></td>
          <td className="py-4 px-6"><Skeleton className="h-5 w-10" /></td>
          <td className="py-4 px-6"><Skeleton className="h-5 w-32" /></td>
          <td className="py-4 px-6"><Skeleton className="h-8 w-8 rounded-xl" /></td>
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
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
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
          <div className="h-11 w-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300">
            <Building2 size={19} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 font-heading text-[15px] leading-tight mb-1.5 line-clamp-2">
              {company.name}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wider">
                {company.code}
              </span>
              <StatusBadge status={company.status} />
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => onEdit(company)}
              className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all shrink-0"
              title="Edit Company"
            >
              <Edit2 size={15} strokeWidth={2.5} />
            </button>
          )}
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
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/60">
                <th className="py-3.5 px-6 text-[12px] font-bold text-slate-500 font-heading uppercase tracking-wider whitespace-nowrap">Company Name</th>
                <th className="py-3.5 px-6 text-[12px] font-bold text-slate-500 font-heading uppercase tracking-wider">Code</th>
                <th className="py-3.5 px-6 text-[12px] font-bold text-slate-500 font-heading uppercase tracking-wider">Status</th>
                <th className="py-3.5 px-6 text-[12px] font-bold text-slate-500 font-heading uppercase tracking-wider">Branches</th>
                <th className="py-3.5 px-6 text-[12px] font-bold text-slate-500 font-heading uppercase tracking-wider whitespace-nowrap">Created At</th>
                <th className="py-3.5 px-6 text-[12px] font-bold text-slate-500 font-heading uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && <DesktopSkeletons />}

              {!isLoading && loadingState === 'error' && <ErrorState colSpan={6} />}

              {!isLoading && loadingState === 'empty' && <EmptyState colSpan={6} />}

              {!isLoading && loadingState === 'success' && companies.map((company) => (
                <tr
                  key={company.id}
                  className="hover:bg-slate-50/60 transition-all duration-150 group"
                >
                  {/* Company Name */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <Building2 size={19} />
                      </div>
                      <span className="font-bold text-slate-900 font-heading text-[15px]">{company.name}</span>
                    </div>
                  </td>

                  {/* Code */}
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-tighter">
                      {company.code}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6">
                    <StatusBadge status={company.status} />
                  </td>

                  {/* Branches */}
                  <td className="py-4 px-6">
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
                  </td>

                  {/* Created At */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-slate-500 text-[13px] font-medium whitespace-nowrap">
                      <Calendar size={14} className="opacity-60 shrink-0" />
                      {new Date(company.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6">
                    {canEdit ? (
                      <button
                        onClick={() => onEdit(company)}
                        className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200"
                        title="Edit Company"
                      >
                        <Edit2 size={17} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <span className="h-9 w-9 flex items-center justify-center text-slate-200 cursor-not-allowed">
                        <Edit2 size={17} strokeWidth={2} />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default CompanyTable;
