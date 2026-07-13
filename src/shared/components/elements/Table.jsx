import React from 'react';
import { AlertCircle, RefreshCcw, SearchX, Inbox } from 'lucide-react';
import Skeleton from './Skeleton';

/**
 * Reusable premium Table component.
 */
const Table = ({
  columns = [],
  data = [],
  loadingState = 'success', // 'loading' | 'error' | 'empty' | 'success'
  errorMessage = '',
  onRetry,
  hasActiveFilters = false,
  onClearFilters,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  skeletonRows = 5,
  className = '',
  rowClassName = '',
}) => {
  const isLoading = loadingState === 'loading';
  const isError = loadingState === 'error';
  const isEmpty = loadingState === 'empty' || (!isLoading && !isError && data.length === 0);

  // ── Desktop Skeletons ──────────────────────────────────────────────────────
  const DesktopSkeletons = () => (
    <>
      {[...Array(skeletonRows)].map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-slate-100 last:border-0">
          {columns.map((col, colIndex) => {
            const alignmentClass =
              col.align === 'center'
                ? 'text-center'
                : col.align === 'right'
                ? 'text-right'
                : 'text-left';

            return (
              <td
                key={colIndex}
                className={`py-4 px-6 ${alignmentClass} ${col.className || ''}`}
              >
                {col.skeleton ? (
                  col.skeleton(rowIndex)
                ) : (
                  <Skeleton className="h-5 w-24 rounded-lg" />
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );

  // ── Error State ────────────────────────────────────────────────────────────
  const ErrorState = () => (
    <tr>
      <td colSpan={columns.length} className="py-14 px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-400 shadow-sm mx-auto">
            <AlertCircle size={30} strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-base">Failed to load data</p>
            <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
              {errorMessage || 'Something went wrong. Please try again.'}
            </p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold
                         hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-95 mx-auto"
            >
              <RefreshCcw size={15} />
              Retry
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  // ── Empty State ────────────────────────────────────────────────────────────
  const EmptyState = () => {
    const Icon = emptyIcon || (hasActiveFilters ? SearchX : Inbox);
    const title = emptyTitle || (hasActiveFilters ? 'No results found' : 'No data available');
    const description =
      emptyDescription ||
      (hasActiveFilters
        ? "Try adjusting your search or filters to find what you're looking for."
        : 'There is no information to display at this time.');

    return (
      <tr>
        <td colSpan={columns.length} className="py-14 px-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 shadow-sm mx-auto">
              {typeof Icon === 'function' || typeof Icon === 'object' ? (
                <Icon size={30} strokeWidth={1.5} />
              ) : (
                Icon
              )}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-base">{title}</p>
              <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">{description}</p>
            </div>
            {hasActiveFilters && onClearFilters && (
              <button
                onClick={onClearFilters}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold
                           hover:bg-slate-200 transition-all active:scale-95 mx-auto"
              >
                <SearchX size={15} />
                Clear Filters
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className={`bg-white  border border-slate-200/60 overflow-hidden ${className}`}>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200/60">
              {columns.map((col, index) => {
                const alignmentClass =
                  col.align === 'center'
                    ? 'text-center'
                    : col.align === 'right'
                    ? 'text-right'
                    : 'text-left';

                return (
                  <th
                    key={index}
                    className={`py-3.5 px-6 text-[12px] font-bold text-slate-500 font-heading uppercase tracking-wider whitespace-nowrap ${alignmentClass} ${col.headerClassName || ''}`}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <DesktopSkeletons />}
            {!isLoading && isError && <ErrorState />}
            {!isLoading && !isError && isEmpty && <EmptyState />}
            {!isLoading && !isError && !isEmpty && data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className={`hover:bg-slate-50/60 transition-all duration-150 group ${rowClassName}`}
              >
                {columns.map((col, colIndex) => {
                  const alignmentClass =
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left';

                  const cellValue = col.accessorKey ? row[col.accessorKey] : undefined;

                  return (
                    <td
                      key={colIndex}
                      className={`py-4 px-6 ${alignmentClass} ${col.className || ''}`}
                    >
                      {col.cell ? col.cell(row, rowIndex) : cellValue ?? ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
