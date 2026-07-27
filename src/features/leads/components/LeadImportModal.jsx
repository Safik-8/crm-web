import React, { useState } from 'react';
import {
  Drawer,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Dialog
} from '@mui/material';
import {
  X,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  Maximize2
} from 'lucide-react';
import {
  useImportPreviewMutation,
  useImportCommitMutation
} from '../hooks/useLeads';
import UploadArea from '../../../shared/components/elements/UploadArea';
import Button from '../../../shared/components/elements/Button';
import { toast } from '../../../shared/utils/toast';
import { apiClient } from '../../../lib/api/api';
import { downloadLeadsTemplate } from '../utils/templateDownloader';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '../../company/services/companyService';
import { branchService } from '../../branch/services/branchService';
import SelectField from '../../../shared/components/elements/SelectField';
import { useAuth } from '../../../app/providers/AuthProvider';

export const LeadImportModal = ({ isOpen, onClose, onImported, initialPipelineId }) => {
  const [step, setStep] = useState('upload'); // 'upload' | 'preview' | 'importing' | 'result'
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);

  const { user } = useAuth();
  const role = user?.primaryRole;
  const canSelectCompany = role === 'SUPER_ADMIN';
  const canSelectBranch = role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN';

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Fetch Companies (for Super Admin)
  const { data: companiesRes } = useQuery({
    queryKey: ['companies-import-options'],
    queryFn: () => companyService.getCompaniesRaw(),
    enabled: canSelectCompany && isOpen
  });
  const companyOptions = (companiesRes?.data || []).map(c => ({
    value: c.id,
    label: `${c.name} (${c.code})`
  }));

  // Target company ID for branch query
  const targetCompanyId = canSelectCompany ? selectedCompanyId : user?.companyId;

  // Fetch Branches
  const { data: branchesRes } = useQuery({
    queryKey: ['branches-import-options', targetCompanyId],
    queryFn: () => branchService.getBranchesRaw(targetCompanyId),
    enabled: !!targetCompanyId && canSelectBranch && isOpen
  });
  const branchOptions = (Array.isArray(branchesRes?.data) ? branchesRes.data : (branchesRes?.data?.branches || [])).map(b => ({
    value: b.id,
    label: `${b.name} (${b.code})`
  }));

  const previewMutation = useImportPreviewMutation();
  const commitMutation = useImportCommitMutation();

  const handleDownloadTemplate = () => {
    downloadLeadsTemplate(role);
  };

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    if (selectedFile) {
      handleUploadPreview(selectedFile);
    }
  };

  const handleUploadPreview = (selectedFile) => {
    // Validate that required selections are present before uploading
    if (canSelectCompany && !selectedCompanyId) {
      toast.error("Please select a target Company first.");
      setFile(null);
      return;
    }
    if (canSelectBranch && !selectedBranchId) {
      toast.error("Please select a target Branch first.");
      setFile(null);
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (initialPipelineId) {
      formData.append('pipelineId', initialPipelineId);
    }
    if (selectedCompanyId) {
      formData.append('companyId', selectedCompanyId);
    } else if (user?.companyId) {
      formData.append('companyId', user.companyId);
    }
    if (selectedBranchId) {
      formData.append('branchId', selectedBranchId);
    } else if (user?.branchId) {
      formData.append('branchId', user.branchId);
    }

    previewMutation.mutate(formData, {
      onSuccess: (res) => {
        setPreviewData(res.data);
        setStep('preview');
      },
      onError: (err) => {
        toast.error(err?.message || "Failed to parse file. Make sure columns match required schema.");
        setFile(null);
      }
    });
  };

  const handleConfirmImport = () => {
    if (!file) return;
    setStep('importing');

    const formData = new FormData();
    formData.append('file', file);
    if (initialPipelineId) {
      formData.append('pipelineId', initialPipelineId);
    }
    if (selectedCompanyId) {
      formData.append('companyId', selectedCompanyId);
    } else if (user?.companyId) {
      formData.append('companyId', user.companyId);
    }
    if (selectedBranchId) {
      formData.append('branchId', selectedBranchId);
    } else if (user?.branchId) {
      formData.append('branchId', user.branchId);
    }

    commitMutation.mutate(formData, {
      onSuccess: (res) => {
        setImportResult(res.data);
        setStep('result');
        toast.success(res.message || "Leads imported successfully.");
        if (onImported) onImported();
      },
      onError: (err) => {
        setStep('preview');
        toast.error(err?.message || "Import failed during processing.");
      }
    });
  };

  const handleDownloadErrorReport = async () => {
    if (!importResult?.id) return;
    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
      // Fetch error CSV using our credentials
      const res = await fetch(`${BASE_URL}/leads/import-logs/${importResult.id}/errors`, {
        headers: {
          'Accept': 'text/csv'
        }
      });
      if (!res.ok) throw new Error("Failed to download file");
      const csvText = await res.text();

      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvText], {
        type: 'text/csv;charset=utf-8;'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `import_errors_log_${importResult.id}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      toast.error("Failed to download error report.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    setStep('upload');
    setSelectedCompanyId('');
    setSelectedBranchId('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <>
      <Drawer
        anchor="right"
      open={isOpen}
      onClose={handleClose}
      ModalProps={{
        slotProps: {
          backdrop: {
            sx: {
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(15, 23, 42, 0.18)',
            }
          }
        }
      }}
      sx={{
        zIndex: 1300,
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 540, md: 620 },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          borderRadius: '0px !important',
          boxShadow: '-8px 0 24px rgba(15, 23, 42, 0.06)',
          borderLeft: '1px solid #E2E8F0'
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#FFFFFF' }}>
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: '1px solid #F1F5F9', display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileSpreadsheet className="text-orange-500 w-5 h-5" />
              <span>Bulk Import Leads</span>
            </Typography>
            <Typography variant="caption" className="text-slate-400 font-medium">
              Upload spreadsheets to populate contacts dynamically.
            </Typography>
          </div>
          <IconButton onClick={handleClose} size="small" className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Scope Selection */}
              {(canSelectCompany || canSelectBranch) && (
                <div className="space-y-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Select Target Scope
                  </h3>

                  {canSelectCompany && (
                    <SelectField
                      id="importCompanySelect"
                      label="Company"
                      value={selectedCompanyId}
                      onChange={(val) => {
                        setSelectedCompanyId(val);
                        setSelectedBranchId('');
                      }}
                      options={companyOptions}
                      placeholder="Select Company..."
                      required
                    />
                  )}

                  {canSelectBranch && (
                    <SelectField
                      id="importBranchSelect"
                      label="Branch"
                      value={selectedBranchId}
                      onChange={(val) => setSelectedBranchId(val)}
                      options={branchOptions}
                      placeholder="Select Branch..."
                      disabled={canSelectCompany && !selectedCompanyId}
                      required
                    />
                  )}
                </div>
              )}

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-start gap-3">
                <Download className="text-orange-500 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Need the template format?</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Download our standardized spreadsheet template to ensure field mappings match correctly.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="mt-2 text-xs font-extrabold text-orange-500 hover:text-orange-600 flex items-center gap-1 focus:outline-none cursor-pointer"
                  >
                    Download Template (.xlsx)
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Upload Document</h3>
                {((canSelectCompany && !selectedCompanyId) || (canSelectBranch && !selectedBranchId)) ? (
                  <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
                    <p className="text-sm font-semibold text-slate-400">
                      Please select the target {canSelectCompany ? "Company & Branch" : "Branch"} scope above to enable lead spreadsheet upload.
                    </p>
                  </div>
                ) : (
                  <UploadArea
                    onFileSelect={handleFileSelect}
                    isLoading={previewMutation.isPending}
                    maxSizeMB={10}
                  />
                )}
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700">Column Headers Requirements:</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Required</span>
                    <span className="text-xs font-semibold text-slate-600 mt-1 block">Lead Name, Mobile Number, Lead Source, Interested Course/Product</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Optional</span>
                    <span className="text-xs font-semibold text-slate-600 mt-1 block">Email, Alternate Contact, Budget, City, State, Country, Notes</span>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-xs font-semibold">
                  ⚠️ Import Limit: Maximum of 1,000 rows per spreadsheet import run.
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && previewData && (
            <div className="space-y-6 animate-fadeIn">
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                  <span className="text-lg font-extrabold text-emerald-600 block">{previewData.successCount}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 block">Valid Rows</span>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-2xl text-center">
                  <span className="text-lg font-extrabold text-yellow-600 block">{previewData.duplicateCount}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 block">Duplicates</span>
                </div>
                <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-center">
                  <span className="text-lg font-extrabold text-red-600 block">{previewData.failureCount}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 block">Errors</span>
                </div>
              </div>

              {/* Rows Preview */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">First 10 Rows Sample Preview</h3>
                  <button
                    type="button"
                    onClick={() => setIsFullScreenOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold rounded-lg border border-orange-200/50 shadow-sm transition-all duration-150 cursor-pointer focus:outline-none"
                  >
                    <Maximize2 size={13} className="text-orange-500" />
                    <span>Maximize Preview</span>
                  </button>
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Row</th>
                          <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Name</th>
                          <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Mobile</th>
                          <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Source</th>
                          <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Course</th>
                          <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Email</th>
                          <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Alt Contact</th>
                          <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Budget</th>
                          <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">City</th>
                          <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">State</th>
                          <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Country</th>
                          <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Notes</th>
                          <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Assignee</th>
                          <th className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {previewData.previewRows.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 text-xs text-slate-500 font-semibold">{r.rowNum}</td>
                            <td className="px-3 py-2 text-xs font-semibold text-slate-700 truncate max-w-[120px]">{r.name || '-'}</td>
                            <td className="px-3 py-2 text-xs text-slate-600 font-medium">{r.mobile || '-'}</td>
                            <td className="px-3 py-2 text-xs text-slate-500">{r.source || '-'}</td>
                            <td className="px-3 py-2 text-xs text-slate-500">{r.course || '-'}</td>
                            <td className="px-3 py-2 text-xs text-slate-500">{r.email || '-'}</td>
                            <td className="px-3 py-2 text-xs text-slate-500">{r.alternateMobile || '-'}</td>
                            <td className="px-3 py-2 text-xs text-slate-500">{r.budget || '-'}</td>
                            <td className="px-3 py-2 text-xs text-slate-500">{r.city || '-'}</td>
                            <td className="px-3 py-2 text-xs text-slate-500">{r.state || '-'}</td>
                            <td className="px-3 py-2 text-xs text-slate-500">{r.country || '-'}</td>
                            <td className="px-3 py-2 text-xs text-slate-500 truncate max-w-[120px]">{r.notes || '-'}</td>
                            <td className="px-3 py-2 text-xs text-slate-500">{r.assignedTo || '-'}</td>
                            <td className="px-3 py-2 text-xs">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'VALID' ? 'bg-emerald-50 text-emerald-700' :
                                r.status === 'DUPLICATE' ? 'bg-yellow-50 text-yellow-700' :
                                  'bg-red-50 text-red-700'
                                }`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Validation Warnings list */}
              {previewData.errorReport && previewData.errorReport.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="text-yellow-500 w-4 h-4" />
                    <span>Parsed Error Log Samples ({previewData.errorReport.length})</span>
                  </h3>
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 max-h-[200px] overflow-y-auto space-y-2.5">
                    {previewData.errorReport.map((err, idx) => (
                      <div key={idx} className="text-xs flex items-start gap-2 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                        <span className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-600 font-bold">R{err.row}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-700">{err.name || 'Unknown'} ({err.mobile || 'No Mobile'})</p>
                          <p className="text-red-500 font-medium mt-0.5">{err.reason}</p>
                          {err.suggestions && (
                            <p className="text-slate-500 mt-0.5">
                              Suggestion: {Object.entries(err.suggestions).map(([k, v]) => `${k} -> "${v}"`).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-12 animate-fadeIn">
              <CircularProgress size={48} className="text-orange-500" />
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-700">Writing contacts database...</h3>
                <p className="text-xs text-slate-500 mt-1">This may take a moment depending on the file size.</p>
              </div>
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col items-center justify-center text-center space-y-2 py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                <h3 className="text-base font-extrabold text-slate-800">Bulk Import Execution Log</h3>
                <p className="text-xs text-slate-500 max-w-[320px]">{importResult.message}</p>
              </div>

              {/* Stats Block */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <span className="text-lg font-extrabold text-slate-700 block">{importResult.totalRows}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Rows</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-center">
                  <span className="text-lg font-extrabold text-emerald-600 block">{importResult.successCount}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Created</span>
                </div>
                <div className="p-3 bg-yellow-50 rounded-xl text-center">
                  <span className="text-lg font-extrabold text-yellow-600 block">{importResult.duplicateCount}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Duplicates</span>
                </div>
                <div className="p-3 bg-red-50 rounded-xl text-center">
                  <span className="text-lg font-extrabold text-red-600 block">{importResult.failureCount}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Errors</span>
                </div>
              </div>

              {/* Error Actions */}
              {(importResult.failureCount > 0 || importResult.duplicateCount > 0) && (
                <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
                  <div className="text-red-600 p-2 bg-red-100 rounded-xl">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Detailed error logs are available</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-[340px]">
                      Download the error report to view the exact original row numbers, validation failures, duplicate fields, and corrections.
                    </p>
                  </div>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDownloadErrorReport}
                    startIcon={<FileText size={14} />}
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                  >
                    Download Error CSV Report
                  </Button>
                </div>
              )}
            </div>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 3, borderTop: '1px solid #F1F5F9', display: 'flex', justifyItems: 'center', justifyContent: 'flex-end', gap: 2, bgcolor: '#F8FAFC' }}>
          {step === 'upload' && (
            <Button variant="outlined" onClick={handleClose} sx={{ color: '#475569', borderColor: '#E2E8F0' }}>
              Cancel
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outlined" onClick={handleReset} sx={{ color: '#475569', borderColor: '#E2E8F0' }}>
                Reset File
              </Button>
              <Button
                variant="contained"
                onClick={handleConfirmImport}
                disabled={previewData?.successCount === 0 || previewData?.failureCount > 0 || previewData?.duplicateCount > 0}
                startIcon={<Play size={14} />}
              >
                Confirm Import
              </Button>
            </>
          )}

          {step === 'result' && (
            <Button variant="contained" onClick={handleClose}>
              Done
            </Button>
          )}
        </Box>
      </Box>
    </Drawer>

    <Dialog
      open={isFullScreenOpen}
      onClose={() => setIsFullScreenOpen(false)}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: '#F8FAFC',
          maxHeight: '85vh',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        }
      }}
      sx={{
        zIndex: 1400,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Dialog Header */}
        <Box sx={{ p: 3, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#FFFFFF' }}>
          <div>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileSpreadsheet className="text-orange-500 w-5 h-5" />
              <span>Spreadsheet Preview: {file?.name || 'leads_import.xlsx'}</span>
            </Typography>
            <Typography variant="caption" className="text-slate-400 font-medium">
              Showing rows preview of parsed spreadsheet data
            </Typography>
          </div>
          <IconButton onClick={() => setIsFullScreenOpen(false)} size="small" className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </IconButton>
        </Box>

        {/* Dialog Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Stats Block */}
            {previewData && (
              <div className="grid grid-cols-3 gap-4 max-w-md">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-center shadow-sm">
                  <span className="text-lg font-extrabold text-emerald-600 block">{previewData.successCount}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 block">Valid Rows</span>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-2xl text-center shadow-sm">
                  <span className="text-lg font-extrabold text-yellow-600 block">{previewData.duplicateCount}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 block">Duplicates</span>
                </div>
                <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-center shadow-sm">
                  <span className="text-lg font-extrabold text-red-600 block">{previewData.failureCount}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 block">Errors</span>
                </div>
              </div>
            )}

            {/* Table Container */}
            {previewData && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-md bg-white">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50">Row</th>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50">Name</th>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50">Mobile</th>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50">Source</th>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50">Course</th>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50">Email</th>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50">Alt Contact</th>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50">Budget</th>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50">City</th>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50">State</th>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50">Country</th>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50">Notes</th>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50">Assignee</th>
                        <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {previewData.previewRows.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-xs text-slate-500 font-semibold">{r.rowNum}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">{r.name || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-600 font-medium">{r.mobile || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{r.source || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{r.course || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{r.email || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{r.alternateMobile || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{r.budget || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{r.city || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{r.state || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{r.country || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[200px]">{r.notes || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{r.assignedTo || '-'}</td>
                          <td className="px-4 py-3 text-xs">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'VALID' ? 'bg-emerald-50 text-emerald-700' :
                                r.status === 'DUPLICATE' ? 'bg-yellow-50 text-yellow-700' :
                                  'bg-red-50 text-red-700'
                              }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Box>

        {/* Dialog Footer */}
        <Box sx={{ p: 3, borderTop: '1px solid #E2E8F0', display: 'flex', justifyItems: 'center', justifyContent: 'flex-end', bgcolor: '#FFFFFF' }}>
          <Button variant="outlined" onClick={() => setIsFullScreenOpen(false)} sx={{ color: '#475569', borderColor: '#E2E8F0' }}>
            Close Preview
          </Button>
        </Box>
      </Box>
    </Dialog>
    </>
  );
};

export default LeadImportModal;
