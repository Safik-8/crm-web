import React, { useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import useExport from '../../hooks/useExport';

/**
 * Reusable dropdown component to trigger CSV and Excel (XLSX) downloads.
 * Uses Material UI Menu system for rendering consistent context dropdown overlays.
 */
export const ExportMenu = ({
  data = [],
  columns = [],
  fileName = 'export',
  disabled = false
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { exportCSV, exportExcel, isExporting } = useExport();

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExportCSV = () => {
    handleClose();
    exportCSV(data, columns, fileName);
  };

  const handleExportExcel = () => {
    handleClose();
    exportExcel(data, columns, fileName);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled || isExporting || data.length === 0}
        className="flex items-center gap-1.5 h-[42px] px-5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-[10px] text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Download size={16} className={isExporting ? 'animate-bounce' : ''} />
        <span>Export Data</span>
      </button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: '16px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05)',
              border: '1px solid rgba(226,232,240,0.8)',
              p: 0.5,
              minWidth: '160px',
              '& .MuiMenuItem-root': {
                fontSize: '12px',
                fontWeight: 600,
                color: '#475569',
                borderRadius: '8px',
                mx: 0.5,
                my: 0.25,
                py: 1,
                px: 2,
                gap: 1.5,
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                  bgcolor: '#F8FAFC',
                  color: '#F86F03'
                }
              }
            }
          }
        }}
      >
        <MenuItem onClick={handleExportCSV}>
          <FileText size={14} className="text-slate-400" />
          <span>Export as CSV</span>
        </MenuItem>
        <MenuItem onClick={handleExportExcel}>
          <FileSpreadsheet size={14} className="text-emerald-500" />
          <span>Export as Excel</span>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportMenu;
