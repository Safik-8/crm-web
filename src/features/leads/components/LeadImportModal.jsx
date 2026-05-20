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
 * LeadImportModal Component
 * Production-grade modal for bulk importing leads from Excel files.
 * Handles pipeline selection, file validation, and detailed result reporting.
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
          // Auto-select initial or first pipeline
          if (!pipelineId && list.length > 0) {
            setPipelineId(list[0].id);
          }
        }
      } catch (err) {
        toast.error('Failed to load pipelines');
      } finally {
        setLoadingPipelines(false);
      }
    };
    fetchPipelines();
  }, []);

  // ── Drag & Drop Handlers ───────────────────────────────────────────────────
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
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

  // ── Action Handlers ────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!file) {
      setError('Please select an Excel file');
      return;
    }
    if (!pipelineId) {
      setError('Please select a pipeline');
      return;
    }

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
      // Handle the "all-or-none" validation failure response
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
    // Note: In production, this should point to a static asset or a backend-generated template
    // For now, we simulate the behavior.
    const link = document.createElement('a');
    link.href = '/templates/leads_import_template.xlsx';
    link.download = 'leads_import_template.xlsx';
    // link.click(); // Uncomment when the file is available
  };

  // ── Render Results View ────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
            <h2 className={cn("text-2xl font-bold font-heading", result.created > 0 ? "text-slate-900" : "text-red-600")}>
              {result.created > 0 ? "Import Result" : "Import Failed"}
            </h2>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition-colors border border-transparent hover:border-slate-200">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {/* All-or-none Failure Alert */}
            {result.created === 0 && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm shrink-0">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-700">Transaction Cancelled</h3>
                  <p className="text-sm font-semibold text-red-600/80 mt-1 leading-relaxed">
                    The import was halted because some rows failed validation. No data has been saved to the database. Please resolve all issues listed below and re-upload the file.
                  </p>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <CheckCircle2 size={24} className="text-emerald-600 mb-2" />
                <span className="text-2xl font-black text-emerald-700">{result.created}</span>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Imported</span>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <AlertTriangle size={24} className="text-orange-600 mb-2" />
                <span className="text-2xl font-black text-orange-700">{result.skipped}</span>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Skipped</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <FileText size={24} className="text-slate-600 mb-2" />
                <span className="text-2xl font-black text-slate-700">{result.total}</span>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Rows</span>
              </div>
            </div>

            {/* Failed Rows Table */}
            {result.failed?.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle size={18} className="text-red-500" />
                    Failed Rows
                  </h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    {result.failed.length} Errors Found
                  </span>
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
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
                <p className="text-xs text-slate-500 font-medium italic">
                  * Only valid leads were created. Please fix the above rows in your Excel file and re-upload them.
                </p>
              </div>
            )}
          </div>

          <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <button
              onClick={onClose}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-900/10"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render Upload View ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-900">Import Leads</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tight mt-0.5">Bulk Creation from Excel</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition-colors border border-transparent hover:border-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Pipeline Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Pipeline</label>
            <div className="relative">
              <select
                value={pipelineId}
                onChange={(e) => setPipelineId(e.target.value)}
                disabled={loadingPipelines || loading}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none transition-all disabled:opacity-50"
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
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload File</label>
            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300",
                  dragActive 
                    ? "border-primary bg-primary/5 scale-[0.99]" 
                    : "border-slate-200 bg-slate-50 hover:border-primary/50 hover:bg-slate-100/50"
                )}
              >
                <div className={cn(
                  "h-16 w-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300",
                  dragActive ? "bg-primary text-white" : "bg-white text-slate-400 shadow-sm"
                )}>
                  <Upload size={28} className={dragActive ? "animate-bounce" : ""} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Click or drag Excel file</h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">Accepts .xlsx, .xls (Max 5MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between group animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-primary">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  disabled={loading}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Template Download */}
          <button
            onClick={handleDownloadTemplate}
            type="button"
            className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors mx-auto"
          >
            <Download size={14} />
            Download Sample Template
          </button>

          {/* Global Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300 relative group">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-red-600 leading-relaxed pr-6">{error}</p>
              </div>
              <button 
                type="button"
                onClick={() => setError(null)}
                className="absolute right-2 top-2 p-1 rounded-lg text-red-400 hover:bg-red-100 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-all active:scale-[0.98] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !file}
            className="flex-2 flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl bg-primary text-white text-sm font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-primary/20"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Upload size={18} />
            )}
            {loading ? 'Importing...' : 'Start Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadImportModal;
