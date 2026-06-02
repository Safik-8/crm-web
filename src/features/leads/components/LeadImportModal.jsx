import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';
import { getPipelines } from '../../pipelines/services/pipelineService';
import { importLeads } from '../services/leadService';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * LeadImportModal — Bulk import leads from Excel.
 * Fully responsive: mobile-first sheet-style on small screens,
 * centered modal on md+. Desktop layout is unchanged.
 */
const LeadImportModal = ({ onClose, onImported, initialPipelineId }) => {
  const [pipelines, setPipelines] = useState([]);
  const [pipelineId, setPipelineId] = useState(initialPipelineId || '');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchPipelines = async () => {
      setLoadingPipelines(true);
      try {
        const res = await getPipelines();
        if (res?.success) {
          const list = res.data.pipelines || [];
          setPipelines(list);
          if (!pipelineId && list.length > 0) {
            setPipelineId(list[0].id);
          }
        }
      } catch {
        toast.error('Failed to load pipelines');
      } finally {
        setLoadingPipelines(false);
      }
    };
    fetchPipelines();
  }, []);

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      toast.error('Only .xlsx or .xls files are allowed');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5 MB');
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!file) { setError('Please select an Excel file'); return; }
    if (!pipelineId) { setError('Please select a pipeline'); return; }

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pipelineId', String(pipelineId));

    try {
      const res = await importLeads(formData);
      if (res?.success) {
        setResult(res.data);
        toast.success(res.message || 'Import completed successfully!');
        onImported?.();
      }
    } catch (err) {
      if (err?.data?.failed) {
        setResult(err.data);
        setError(err.message || 'Validation failed. No leads were imported.');
      } else {
        const msg = err?.message || 'Import failed. Please check your file format.';
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    toast.info('Starting template download...');
    const link = document.createElement('a');
    link.href = '/templates/leads_import_template.xlsx';
    link.download = 'leads_import_template.xlsx';
    // link.click();
  };

  // ── Results View ───────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[92vh] sm:max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="px-5 sm:px-8 py-4 sm:py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
            {/* Mobile drag handle */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-200 sm:hidden" />
            <h2 className={cn('text-lg sm:text-2xl font-bold font-heading', result.created > 0 ? 'text-slate-900' : 'text-red-600')}>
              {result.created > 0 ? 'Import Result' : 'Import Failed'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition-colors border border-transparent hover:border-slate-200"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5 sm:space-y-8 custom-scrollbar">

            {/* All-or-none failure alert */}
            {result.created === 0 && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 sm:p-6 flex items-start gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="h-9 w-9 sm:h-12 sm:w-12 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm shrink-0">
                  <AlertCircle size={20} className="sm:hidden" />
                  <AlertCircle size={28} className="hidden sm:block" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-lg font-bold text-red-700">Transaction Cancelled</h3>
                  <p className="text-xs sm:text-sm font-semibold text-red-600/80 mt-1 leading-relaxed">
                    The import was halted because some rows failed validation. No data has been saved. Please fix all issues below and re-upload.
                  </p>
                </div>
              </div>
            )}

            {/* Summary cards — 3-col on sm+, single row on mobile */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col items-center justify-center text-center">
                <CheckCircle2 size={18} className="text-emerald-600 mb-1 sm:mb-2 sm:hidden" />
                <CheckCircle2 size={24} className="text-emerald-600 mb-2 hidden sm:block" />
                <span className="text-xl sm:text-2xl font-black text-emerald-700">{result.created}</span>
                <span className="text-[9px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider">Imported</span>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col items-center justify-center text-center">
                <AlertTriangle size={18} className="text-orange-600 mb-1 sm:mb-2 sm:hidden" />
                <AlertTriangle size={24} className="text-orange-600 mb-2 hidden sm:block" />
                <span className="text-xl sm:text-2xl font-black text-orange-700">{result.skipped}</span>
                <span className="text-[9px] sm:text-xs font-bold text-orange-600 uppercase tracking-wider">Skipped</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col items-center justify-center text-center">
                <FileText size={18} className="text-slate-600 mb-1 sm:mb-2 sm:hidden" />
                <FileText size={24} className="text-slate-600 mb-2 hidden sm:block" />
                <span className="text-xl sm:text-2xl font-black text-slate-700">{result.total}</span>
                <span className="text-[9px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Total</span>
              </div>
            </div>

            {/* Failed rows */}
            {result.failed?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500" />
                    Failed Rows
                  </h3>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    {result.failed.length} Errors
                  </span>
                </div>

                {/* Mobile: card list. Desktop: table */}
                <div className="sm:hidden space-y-2">
                  {result.failed.map((f, idx) => (
                    <div key={idx} className="border border-red-100 bg-red-50/40 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-400">Row #{f.row}</span>
                        <span className="text-[11px] font-bold text-slate-700">{f.data?.name || <span className="italic text-slate-300">No name</span>}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{f.data?.mobile || f.data?.['Phone Number'] || '—'}</p>
                      <div className="space-y-0.5">
                        {f.errors.map((e, i) => (
                          <div key={i} className="text-[11px] font-bold text-red-500 flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-red-500 shrink-0" />
                            {e}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden sm:block border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Row</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Name</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Mobile</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.failed.map((f, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 text-sm font-bold text-slate-400">#{f.row}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{f.data?.name || <span className="text-slate-300 italic">Empty</span>}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{f.data?.mobile || f.data?.['Phone Number'] || <span className="text-slate-300 italic">Empty</span>}</td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                {f.errors.map((e, i) => (
                                  <div key={i} className="text-[11px] font-bold text-red-500 flex items-center gap-1.5">
                                    <span className="h-1 w-1 rounded-full bg-red-500" />
                                    {e}
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="text-[10px] sm:text-xs text-slate-500 font-medium italic">
                  * Only valid leads were created. Fix the above rows and re-upload.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-8 py-4 sm:py-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <button
              onClick={onClose}
              className="w-full py-3 sm:py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-900/10"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Upload View ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[92vh] sm:max-h-none flex flex-col">

        {/* Header */}
        <div className="relative px-5 sm:px-8 py-4 sm:py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          {/* Mobile drag handle */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-200 sm:hidden" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <Upload size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold font-heading text-slate-900">Import Leads</h2>
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight mt-0.5">Bulk Creation from Excel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition-colors border border-transparent hover:border-slate-200 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5 sm:space-y-6 custom-scrollbar">

          {/* Pipeline Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Select Pipeline
            </label>
            <div className="relative">
              <select
                value={pipelineId}
                onChange={(e) => setPipelineId(e.target.value)}
                disabled={loadingPipelines || loading}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 py-3 sm:py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none transition-all disabled:opacity-50"
              >
                {loadingPipelines ? (
                  <option>Loading pipelines...</option>
                ) : (
                  pipelines.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                )}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Upload File
            </label>
            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300',
                  dragActive
                    ? 'border-primary bg-primary/5 scale-[0.99]'
                    : 'border-slate-200 bg-slate-50 hover:border-primary/50 hover:bg-slate-100/50'
                )}
              >
                <div className={cn(
                  'h-12 w-12 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300',
                  dragActive ? 'bg-primary text-white' : 'bg-white text-slate-400 shadow-sm'
                )}>
                  <Upload size={22} className={cn('sm:hidden', dragActive ? 'animate-bounce' : '')} />
                  <Upload size={28} className={cn('hidden sm:block', dragActive ? 'animate-bounce' : '')} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {dragActive ? 'Drop it here!' : 'Tap to select or drag file'}
                </h3>
                <p className="text-[11px] sm:text-xs font-semibold text-slate-400 mt-1">
                  Accepts .xlsx, .xls · Max 5 MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-slate-900 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center justify-between group animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 bg-white/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate max-w-[160px] sm:max-w-[220px]">{file.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  disabled={loading}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Template download */}
          <button
            onClick={handleDownloadTemplate}
            type="button"
            className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors mx-auto"
          >
            <Download size={13} />
            Download Sample Template
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300 relative group">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-red-600 leading-relaxed pr-6">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="absolute right-2 top-2 p-1 rounded-lg text-red-400 hover:bg-red-100 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-8 py-4 sm:py-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-all active:scale-[0.98] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !file}
            className="flex-[2] flex items-center justify-center gap-2 py-3 sm:py-3.5 px-6 sm:px-8 rounded-xl sm:rounded-2xl bg-primary text-white text-sm font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-primary/20"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {loading ? 'Importing…' : 'Start Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadImportModal;
