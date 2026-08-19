import { useState, useCallback } from 'react';
import { toast } from '../utils/toast';
import { apiClient } from '../../lib/api/api';

/**
 * Helper to safely extract nested values from an object using a dot-notation path.
 * E.g., getNestedValue({ company: { name: 'Acme' } }, 'company.name') -> 'Acme'
 */
const getNestedValue = (obj, path) => {
  if (!path) return '';
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : ''), obj);
};

/**
 * Reusable Custom Hook to export datasets to CSV, Excel (.xlsx), and PDF (.pdf).
 * Supports automatic server-side export logging and audit trail generation.
 *
 * @returns {object} Export states and trigger functions
 */
export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Export data as a CSV file with optional export audit logging.
   */
  const exportCSV = useCallback(async (data = [], columns = [], fileName = 'export', logOptions = null) => {
    if (!data || data.length === 0) {
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

      const fullFileName = `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', fullFileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 4. Log Export Action to Server
      if (logOptions?.reportName) {
        try {
          await apiClient.post('/reports/revenue/export-log', {
            reportName: logOptions.reportName,
            exportType: 'CSV',
            fileName: fullFileName,
            filtersUsed: logOptions.filtersUsed || {}
          });
        } catch (auditErr) {
          console.warn('Export log recording failed:', auditErr);
        }
      }

      toast.success('CSV exported successfully.');
    } catch (err) {
      console.error('CSV Export Error:', err);
      toast.error('Failed to export CSV file.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  /**
   * Export data as a premium Excel (.xlsx) file with optional export audit logging.
   */
  const exportExcel = useCallback(async (data = [], columns = [], fileName = 'export', logOptions = null) => {
    if (!data || data.length === 0) {
      toast.error('No records available to export.');
      return;
    }

    setIsExporting(true);
    try {
      // 1. Map rows into formatted objects matching header labels
      const formattedRows = data.map((row) => {
        if (!columns || columns.length === 0) return row;
        const item = {};
        columns.forEach((col) => {
          const rawVal = getNestedValue(row, col.accessorKey);
          item[col.header] = rawVal !== null && rawVal !== undefined ? rawVal : '';
        });
        return item;
      });

      // 2. Dynamically import xlsx package
      const XLSX = await import('xlsx');

      // 3. Create worksheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(formattedRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data List');

      // 4. Trigger download
      const fullFileName = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fullFileName);

      // 5. Log Export Action to Server
      if (logOptions?.reportName) {
        try {
          await apiClient.post('/reports/revenue/export-log', {
            reportName: logOptions.reportName,
            exportType: 'EXCEL',
            fileName: fullFileName,
            filtersUsed: logOptions.filtersUsed || {}
          });
        } catch (auditErr) {
          console.warn('Export log recording failed:', auditErr);
        }
      }

      toast.success('Excel exported successfully.');
    } catch (err) {
      console.error('Excel Export Error:', err);
      toast.error('Failed to export Excel file.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  /**
   * Export DOM element or page component to PDF (.pdf) using html2pdf.js
   */
  const exportPDF = useCallback(async (elementOrId, fileName = 'export', logOptions = null) => {
    setIsExporting(true);
    try {
      const element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
      if (!element) {
        toast.error('Target printable element not found for PDF generation.');
        setIsExporting(false);
        return;
      }

      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const fullFileName = `${fileName}_${new Date().toISOString().slice(0, 10)}.pdf`;
      const opt = {
        margin: 8,
        filename: fullFileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      await html2pdf().set(opt).from(element).save();

      // Log Export Action to Server
      if (logOptions?.reportName) {
        try {
          await apiClient.post('/reports/revenue/export-log', {
            reportName: logOptions.reportName,
            exportType: 'PDF',
            fileName: fullFileName,
            filtersUsed: logOptions.filtersUsed || {}
          });
        } catch (auditErr) {
          console.warn('Export log recording failed:', auditErr);
        }
      }

      toast.success('PDF exported successfully.');
    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error('Failed to export PDF document.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    exportCSV,
    exportExcel,
    exportPDF,
    isExporting
  };
};

export default useExport;
