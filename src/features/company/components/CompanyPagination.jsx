import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * CompanyPagination
 * Smart pagination bar:
 *   - Prev / Next buttons
 *   - Page number buttons with ellipsis for large ranges
 *   - "Showing X–Y of Z" summary
 *   - Fully disabled during loading
 */

const PAGE_LIMIT = 10; // must match the limit used in the hook

/**
 * Build the visible page number array with ellipsis markers.
 * e.g. [1, '…', 4, 5, 6, '…', 12]
 */
function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [];
  const addPage = (p) => pages.push(p);
  const addEllipsis = () => {
    if (pages[pages.length - 1] !== '…') pages.push('…');
  };

  addPage(1);
  if (current > 3) addEllipsis();

  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) addPage(i);

  if (current < total - 2) addEllipsis();
  addPage(total);

  return pages;
}

const CompanyPagination = ({ pagination, onPageChange, isLoading }) => {
  const { page, pages, total, hasNext, hasPrev } = pagination;

  if (total === 0) return null;

  const from = (page - 1) * PAGE_LIMIT + 1;
  const to   = Math.min(page * PAGE_LIMIT, total);
  const pageRange = buildPageRange(page, pages);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm px-3 sm:px-5 py-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

        {/* ── Summary ──────────────────────────────────────────────────── */}
        <p className="text-[13px] font-medium text-slate-500 shrink-0 order-2 sm:order-1">
          Showing{' '}
          <span className="font-bold text-slate-700">{from}–{to}</span>
          {' '}of{' '}
          <span className="font-bold text-slate-700">{total}</span>
          {' '}companies
        </p>

        {/* ── Controls ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 order-1 sm:order-2">

          {/* Prev */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrev || isLoading}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500
                       hover:bg-slate-50 hover:text-primary hover:border-primary/30
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-500 disabled:hover:border-slate-200
                       transition-all"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {pageRange.map((p, idx) =>
              p === '…' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="h-8 w-8 flex items-center justify-center text-slate-400 text-sm select-none"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  disabled={isLoading}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-all
                    ${p === page
                      ? 'bg-primary text-white shadow-md shadow-primary/25 border border-primary'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            )}
          </div>

          {/* Next */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext || isLoading}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500
                       hover:bg-slate-50 hover:text-primary hover:border-primary/30
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-500 disabled:hover:border-slate-200
                       transition-all"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyPagination;
