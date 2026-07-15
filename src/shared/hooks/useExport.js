import { useState, useCallback } from 'react';
import { toast } from '../utils/toast';

/**
 * Helper to safely extract nested values from an object using a dot-notation path.
 * E.g., getNestedValue({ company: { name: 'Acme' } }, 'company.name') -> 'Acme'
 */
const getNestedValue = (obj, path) => {
  if (!path) return '';
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : ''), obj);
};

/**
 * Reusable Custom Hook to export datasets to CSV and Excel (XLSX).
 *
 * @returns {object} Export states and trigger functions
 */
export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Export data as a CSV file.
   */
  const exportCSV = useCallback((data = [], columns = [], fileName = 'export') => {
    if (data.length === 0) {
      toast.error('No records available to export.');
      return;
    }

    setIsExporting(true);
    try {
      // 1. Build Headers Row
      const headers = columns
        .map((col) => `"${(col.header || '').replace(/"/g, '""')}"`)
        .join(',');

      // 2. Build Data Rows
      const rows = data.map((row) =>
        columns
          .map((col) => {
            const rawVal = getNestedValue(row, col.accessorKey);
            const valString = rawVal !== null && rawVal !== undefined ? String(rawVal) : '';
            return `"${valString.replace(/"/g, '""')}"`;
          })
          .join(',')
      );

      // 3. Combine and Download
      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], {
        type: 'text/csv;charset=utf-8;'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('CSV exported successfully.');
    } catch (err) {
      console.error('CSV Export Error:', err);
      toast.error('Failed to export CSV file.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  /**
   * Export data as a premium Excel (.xlsx) file.
   * Utilizes dynamic import of 'xlsx' library to preserve bundle performance.
   */
  const exportExcel = useCallback(async (data = [], columns = [], fileName = 'export') => {
    if (data.length === 0) {
      toast.error('No records available to export.');
      return;
    }

    setIsExporting(true);
    try {
      // 1. Map rows into formatted objects matching header labels
      const formattedRows = data.map((row) => {
        const item = {};
        columns.forEach((col) => {
          const rawVal = getNestedValue(row, col.accessorKey);
          item[col.header] = rawVal !== null && rawVal !== undefined ? rawVal : '';
        });
        return item;
      });

      // 2. Dynamically import xlsx package to keep main chunk lightweight
      const XLSX = await import('xlsx');

      // 3. Create worksheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(formattedRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data List');

      // 4. Trigger download
      XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel exported successfully.');
    } catch (err) {
      console.error('Excel Export Error:', err);
      toast.error('Failed to export Excel file.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    exportCSV,
    exportExcel,
    isExporting
  };
};

export default useExport;
