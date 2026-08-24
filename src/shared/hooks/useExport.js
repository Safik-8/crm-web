import { useState, useCallback } from 'react';
import html2pdfLib from 'html2pdf.js';
import { toast } from '../utils/toast';
import { apiClient } from '../../lib/api/api';
import logoOfficial from '../../assets/logos/logo-official.png';

const getHtml2PdfInstance = async () => {
  let mod = html2pdfLib;
  if (!mod || (typeof mod !== 'function' && typeof mod?.default !== 'function')) {
    try {
      mod = await import('html2pdf.js');
    } catch (e) {
      console.warn('Dynamic html2pdf import fallback:', e);
    }
  }
  if (typeof mod === 'function') return mod;
  if (typeof mod?.default === 'function') return mod.default;
  if (mod?.default && typeof mod.default.default === 'function') return mod.default.default;
  if (typeof window !== 'undefined' && typeof window.html2pdf === 'function') return window.html2pdf;
  return mod;
};

/**
 * Helper to safely extract nested values from an object using a dot-notation path.
 * E.g., getNestedValue({ company: { name: 'Acme' } }, 'company.name') -> 'Acme'
 */
const getNestedValue = (obj, path) => {
  if (!path) return '';
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : ''), obj);
};

/**
 * Helper to determine final filename cleanly
 */
const formatFileName = (fileName, ext, rawFileName = false) => {
  if (fileName.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) {
    return fileName;
  }
  if (rawFileName) {
    return `${fileName}.${ext}`;
  }
  return `${fileName}.${ext}`;
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
            let valString = '';
            if (col.formatter && typeof col.formatter === 'function') {
              valString = col.formatter(rawVal, row);
            } else if (rawVal !== null && rawVal !== undefined) {
              valString = String(rawVal);
            }
            return `"${valString.replace(/"/g, '""')}"`;
          })
          .join(',')
      );

      // 3. Combine and Download with UTF-8 BOM
      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], {
        type: 'text/csv;charset=utf-8;'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const fullFileName = formatFileName(fileName, 'csv', logOptions?.rawFileName);
      link.setAttribute('href', url);
      link.setAttribute('download', fullFileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 4. Log Export Action to Server
      if (logOptions?.onSuccess) {
        await logOptions.onSuccess('CSV', fullFileName, data.length);
      } else if (logOptions?.reportName) {
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
          let valString = '';
          if (col.formatter && typeof col.formatter === 'function') {
            valString = col.formatter(rawVal, row);
          } else if (rawVal !== null && rawVal !== undefined) {
            valString = rawVal;
          }
          item[col.header] = valString;
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
      const fullFileName = formatFileName(fileName, 'xlsx', logOptions?.rawFileName);
      XLSX.writeFile(workbook, fullFileName);

      // 5. Log Export Action to Server
      if (logOptions?.onSuccess) {
        await logOptions.onSuccess('XLSX', fullFileName, data.length);
      } else if (logOptions?.reportName) {
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
   * Export DOM element to PDF (.pdf) using html2pdf.js
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

      const html2pdf = await getHtml2PdfInstance();
      if (!html2pdf || typeof html2pdf !== 'function') {
        throw new Error('html2pdf library is not loaded properly.');
      }


      const fullFileName = formatFileName(fileName, 'pdf', logOptions?.rawFileName);
      const opt = {
        margin: 8,
        filename: fullFileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      await html2pdf().set(opt).from(element).save();

      // Log Export Action to Server
      if (logOptions?.onSuccess) {
        await logOptions.onSuccess('PDF', fullFileName, 1);
      } else if (logOptions?.reportName) {
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

  /**
   * Export dataset to formatted PDF (.pdf) using html2pdf.js with full company branding.
   * Export dataset directly to PDF (.pdf) using html2pdf.js with top-left company logo, report title, active filters, summary cards, data table & footer
   */
  const exportPDFFromData = useCallback(async (data = [], columns = [], title = 'Report', fileName = 'export', pdfOptions = {}, logOptions = null) => {
    if (!data || data.length === 0) {
      toast.error('No records available to export.');
      return;
    }

    setIsExporting(true);
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const container = document.createElement('div');
      container.style.padding = '24px';
      container.style.fontFamily = 'Inter, Helvetica, Arial, sans-serif';
      container.style.color = '#0f172a';
      container.style.backgroundColor = '#ffffff';

      const companyName = pdfOptions.companyName || 'StackCode CRM';
      const companySubtitle = pdfOptions.companySubtitle || `${companyName} • Enterprise Analytics & Reporting`;
      const userName = pdfOptions.userName || 'Authorized User';
      const nowStr = new Date().toLocaleString();

      // 2. Logo HTML - Use custom logo image if available, or generate dynamic Company Initials Badge
      const companyInitials = companyName
        .split(' ')
        .map(n => (n ? n[0] : ''))
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'CD';

      const logoUrlToUse = pdfOptions.logoUrl || logoOfficial;
      const logoHtml = logoUrlToUse
        ? `<img src="${logoUrlToUse}" alt="Logo" style="height: 38px; width: auto; max-width: 160px; object-fit: contain;" />`
        : `<div style="width: 38px; height: 38px; background: linear-gradient(135deg, #f86f03 0%, #ea580c 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 800; font-size: 15px; box-shadow: 0 2px 4px rgba(248,111,3,0.25); border: 1px solid rgba(255,255,255,0.2);">${companyInitials}</div>`;

      const filterBadgesHtml = pdfOptions.filtersSummary
        ? Object.entries(pdfOptions.filtersSummary)
          .filter(([_, val]) => Boolean(val))
          .map(([key, val]) => `<span style="background: #f1f5f9; color: #334155; padding: 4px 10px; border-radius: 6px; font-size: 10.5px; font-weight: 500; border: 1px solid #e2e8f0;"><strong>${key}:</strong> ${val}</span>`)
          .join('')
        : '';

      // 4. Format Summary KPI Cards
      const summaryCardsHtml = Array.isArray(pdfOptions.summaryCards) && pdfOptions.summaryCards.length > 0
        ? pdfOptions.summaryCards.map(card => `
            <div style="flex: 1; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; border-left: 3.5px solid #f86f03;">
              <div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">${card.label}</div>
              <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">${card.value}</div>
            </div>
          `).join('')
        : '';

      // 5. Build Table Headers & Rows with Alignment and Formatter Support
      const tableHeadersHtml = columns.map(c => {
        const align = c.align || 'left';
        return `<th style="border: 1px solid #cbd5e1; padding: 8px 10px; background: #f8fafc; color: #1e293b; font-size: 10.5px; font-weight: 700; text-align: ${align};">${c.header}</th>`;
      }).join('');

      const tableRowsHtml = data.map((row, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        const cellsHtml = columns.map(col => {
          const rawVal = getNestedValue(row, col.accessorKey);
          let strVal = '';
          if (col.formatter && typeof col.formatter === 'function') {
            strVal = col.formatter(rawVal, row);
          } else if (rawVal !== null && rawVal !== undefined) {
            strVal = String(rawVal);
          }
          const align = col.align || 'left';
          return `<td style="border: 1px solid #e2e8f0; padding: 7.5px 10px; font-size: 10.5px; color: #334155; text-align: ${align};">${strVal}</td>`;
        }).join('');
        return `<tr style="background-color: ${bg};">${cellsHtml}</tr>`;
      }).join('');

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #f86f03; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${logoHtml}
            <div>
              <div style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">${companyName}</div>
              <div style="font-size: 10.5px; color: #64748b; font-weight: 500;">${companySubtitle}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <h1 style="margin: 0; font-size: 17px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">${title}</h1>
            <div style="font-size: 10.5px; color: #f86f03; font-weight: 600; margin-top: 2px;">Official Performance Export</div>
          </div>
        </div>

        ${filterBadgesHtml ? `<div style="margin-bottom: 14px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
          <span style="font-size: 10.5px; font-weight: 700; color: #475569; margin-right: 2px;">Active Scope Filters:</span>
          ${filterBadgesHtml}
        </div>` : ''}

        ${summaryCardsHtml ? `<div style="display: flex; gap: 12px; margin-bottom: 16px;">
          ${summaryCardsHtml}
        </div>` : ''}

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-family: inherit;">
          <thead>
            <tr>${tableHeadersHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
          <div>Generated by: <strong>${userName}</strong></div>
          <div>Generated on: <strong>${nowStr}</strong> &nbsp;|&nbsp; ${companyName} Confidential</div>
        </div>
      `;

      const fullFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}_${new Date().toISOString().slice(0, 10)}.pdf`;
      const opt = {
        margin: [8, 8, 8, 8],
        filename: fullFileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1.5, useCORS: true, allowTaint: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      document.body.appendChild(container);
      try {
        await html2pdf().from(container).set(opt).save();

        if (logOptions?.onSuccess) {
          await logOptions.onSuccess('PDF', fullFileName, data.length);
        }

        toast.success('PDF exported successfully.');
      } finally {
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      }
    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error('Failed to export PDF document: ' + err.message);

    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    exportCSV,
    exportExcel,
    exportPDF,
    exportPDFFromData,
    isExporting
  };
};

export default useExport;

