import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Table from '../../../shared/components/elements/Table';
import { MoreVertical, Eye, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Portal-based 3-dot dropdown — escapes sticky/overflow stacking context
 */
const RowActionsMenu = ({ row, onView, onClose }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 164, // align right edge of menu to button
      });
    }
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = () => setOpen(false);
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const menu = open
    ? ReactDOM.createPortal(
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{ position: 'absolute', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
          className="bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-300/40 py-1 w-40 text-sm"
        >
          <button
            type="button"
            onClick={() => { setOpen(false); onView && onView(row); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            View Details
          </button>

          {row.status === 'OPEN' && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onClose && onClose(row); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-indigo-700 hover:bg-indigo-50 text-xs font-medium transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
              Close Deal
            </button>
          )}

          {(row.status === 'WON' || row.status === 'LOST') && (
            <div className="px-3.5 py-2 flex items-center gap-2 text-xs text-slate-400 italic">
              <XCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Closed as {row.status}</span>
            </div>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div className="flex justify-end">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
        title="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {menu}
    </div>
  );
};


import { useFormatters } from '../../../shared/hooks/useFormatters';

export const OpportunitySpreadsheet = ({
  opportunities = [],
  loadingState = 'success',
  onRowClick,
  onCloseClick,
}) => {
  const { formatCurrency, formatDate } = useFormatters();

  const columns = [
    {
      header: 'Opportunity',
      accessorKey: 'opportunityName',
      className: 'min-w-[200px] max-w-[220px]',
      cell: (row) => (
        <button
          type="button"
          onClick={() => onRowClick && onRowClick(row)}
          className="text-left group w-full"
        >
          <span
            className="font-semibold text-slate-900 group-hover:text-indigo-600 block transition-colors text-[13px] truncate max-w-[200px]"
            title={row.opportunityName}
          >
            {row.opportunityName}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">#{row.id}</span>
        </button>
      ),
    },
    {
      header: 'Lead',
      accessorKey: 'lead',
      className: 'min-w-[130px] max-w-[150px]',
      cell: (row) => (
        <div className="max-w-[140px]">
          <span
            className="font-medium text-slate-800 block text-[13px] truncate"
            title={row.lead?.name}
          >
            {row.lead?.name || '—'}
          </span>
          {row.lead?.mobile && (
            <span className="text-[11px] text-slate-400 font-mono block">
              {row.lead.mobile}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Stage',
      accessorKey: 'stage',
      className: 'min-w-[130px]',
      cell: (row) => (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap"
          style={{
            backgroundColor: `${row.stage?.colorCode || '#6366f1'}18`,
            color: row.stage?.colorCode || '#6366f1',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: row.stage?.colorCode || '#6366f1' }}
          />
          {row.stage?.name || 'Qualification'}
        </span>
      ),
    },
    {
      header: 'Revenue',
      accessorKey: 'expectedRevenue',
      align: 'right',
      className: 'min-w-[100px]',
      cell: (row) => (
        <span className="font-bold text-slate-900 text-[13px] whitespace-nowrap tabular-nums">
          {formatCurrency(row.expectedRevenue)}
        </span>
      ),
    },
    {
      header: 'Win %',
      accessorKey: 'probabilityPercentage',
      align: 'center',
      className: 'min-w-[70px]',
      cell: (row) => (
        <span className="text-slate-700 font-semibold text-[13px] tabular-nums">
          {row.probabilityPercentage || 10}%
        </span>
      ),
    },
    {
      header: 'Close Date',
      accessorKey: 'closingDate',
      className: 'min-w-[100px]',
      cell: (row) => (
        <span className="text-slate-600 text-[13px] whitespace-nowrap">
          {formatDate(row.closingDate)}
        </span>
      ),
    },
    {
      header: 'Owner',
      accessorKey: 'owner',
      className: 'min-w-[100px] max-w-[120px]',
      cell: (row) => (
        <span
          className="text-slate-700 font-medium text-[13px] block truncate max-w-[110px]"
          title={row.owner?.name}
        >
          {row.owner?.name || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      className: 'min-w-[80px]',
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${
            row.status === 'WON'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : row.status === 'LOST'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : row.status === 'CANCELLED'
              ? 'bg-slate-100 text-slate-500 border border-slate-200'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: '',
      isActionColumn: true,
      align: 'right',
      className: 'w-12',
      cell: (row) => (
        <RowActionsMenu
          row={row}
          onView={onRowClick}
          onClose={onCloseClick}
        />
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <Table
        columns={columns}
        data={opportunities}
        loadingState={loadingState}
        emptyTitle="No opportunities found"
        emptyDescription="Create a new opportunity or adjust your search filters."
      />
    </div>
  );
};
