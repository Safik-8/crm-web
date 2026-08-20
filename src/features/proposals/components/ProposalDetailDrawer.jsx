import React, { useState } from 'react';
import Drawer from '../../../shared/components/elements/Drawer';
import Button from '../../../shared/components/elements/Button';
import {
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Send,
  ShieldAlert,
  Award,
  FileSpreadsheet,
  Printer,
  UserCheck,
  Layers,
  Receipt,
  Edit3,
  Trash2
} from 'lucide-react';

export default function ProposalDetailDrawer({
  isOpen,
  onClose,
  proposal,
  onStatusChange,
  onEditRevision,
  onDelete,
  currentUserRoleRank = 0,
  currentUserId = null
}) {
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [statusAction, setStatusAction] = useState(null); // 'SENT' | 'ACCEPTED' | 'REJECTED'

  if (!proposal) return null;

  const handleStatusChangeClick = async (status) => {
    setIsStatusChanging(true);
    setStatusAction(status);
    try {
      await onStatusChange(proposal.id, status);
    } finally {
      setIsStatusChanging(false);
      setStatusAction(null);
    }
  };

  const isDraft = proposal.status === 'DRAFT';
  const isSent = proposal.status === 'SENT';
  const isAccepted = proposal.status === 'ACCEPTED';
  const isRejected = proposal.status === 'REJECTED';
  const isLocked = isAccepted || isRejected;

  const canDelete = (currentUserRoleRank >= 60 || proposal.createdById === currentUserId || proposal.opportunity?.ownerId === currentUserId) && !isAccepted;

  const handlePrint = () => {
    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Quotation - ${proposal.proposalNumber}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-size: 12pt; }
              .no-print { display: none; }
            }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; padding: 40px; max-width: 850px; margin: 0 auto; line-height: 1.5; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .header-left { width: 60%; text-align: left; vertical-align: top; }
            .header-right { width: 40%; text-align: right; vertical-align: top; }
            .company-name { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; text-transform: uppercase; margin-bottom: 5px; }
            .company-info { font-size: 13px; color: #64748b; line-height: 1.4; }
            .doc-title { font-size: 28px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 10px; letter-spacing: -0.025em; }
            .doc-meta { font-size: 13px; color: #475569; line-height: 1.5; }
            
            .client-section { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .client-box { width: 50%; vertical-align: top; }
            .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; width: 90%; }
            .client-name { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
            .client-info { font-size: 13px; color: #475569; line-height: 1.4; }

            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .items-table th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 16px; text-align: left; }
            .items-table td { border-bottom: 1px solid #e2e8f0; padding: 16px; font-size: 13px; color: #334155; vertical-align: top; }
            .item-name { font-weight: 700; color: #0f172a; font-size: 14px; }
            .item-desc { font-size: 12px; color: #64748b; margin-top: 4px; }

            .summary-table { float: right; width: 350px; border-collapse: collapse; margin-bottom: 40px; }
            .summary-table td { padding: 8px 16px; font-size: 13px; color: #475569; }
            .summary-table .label { text-align: left; }
            .summary-table .value { text-align: right; font-weight: 600; color: #1e293b; }
            .summary-table tr.total { border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; }
            .summary-table tr.total td { font-size: 15px; font-weight: 800; color: #0f172a; padding: 12px 16px; }

            .terms-section { clear: both; margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            .terms-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px; }
            .terms-content { font-size: 12px; color: #475569; line-height: 1.5; white-space: pre-line; }

            .footer-section { width: 100%; border-collapse: collapse; margin-top: 80px; }
            .footer-col { width: 50%; vertical-align: bottom; }
            .thanks-msg { font-size: 15px; font-weight: 700; color: #0f172a; font-style: italic; }
            .signature-line { width: 200px; border-bottom: 1.5px solid #0f172a; margin-bottom: 8px; }
            .signature-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
          </style>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            }
          </script>
        </head>
        <body>
          <!-- Header -->
          <table class="header-table">
            <tr>
              <td class="header-left">
                <div class="company-name">StackDot Company</div>
                <div class="company-info">
                  E-commerce & Web Development Excellence<br/>
                  info@stackdot.in · www.stackdot.in
                </div>
              </td>
              <td class="header-right">
                <div class="doc-title">QUOTATION</div>
                <div class="doc-meta">
                  <strong>Proposal No:</strong> ${proposal.proposalNumber}<br/>
                  <strong>Date:</strong> ${new Date(proposal.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}<br/>
                  <strong>Valid Till:</strong> ${new Date(proposal.validTill).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </td>
            </tr>
          </table>

          <!-- Client Info -->
          <table class="client-section">
            <tr>
              <td class="client-box">
                <div class="section-title">Prepared For</div>
                <div class="client-name">${proposal.opportunity?.lead?.name || 'Valued Client'}</div>
                <div class="client-info">
                  ${proposal.opportunity?.lead?.email ? `Email: ${proposal.opportunity.lead.email}<br/>` : ''}
                  ${proposal.opportunity?.lead?.mobile ? `Mobile: ${proposal.opportunity.lead.mobile}` : ''}
                </div>
              </td>
              <td class="client-box">
                <div class="section-title">Prepared By</div>
                <div class="client-name">${proposal.createdBy?.name || 'Sales Representative'}</div>
                <div class="client-info">
                  Role: Representative<br/>
                  StackDot Sales Department
                </div>
              </td>
            </tr>
          </table>

          <!-- Item Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 70%;">Product / Service Description</th>
                <th style="width: 30%; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="item-name">${proposal.product?.name || 'Full-Stack Web Development Services'}</div>
                  <div class="item-desc">Comprehensive project build, source control, deployments, and QA testing cycles matching StackDot standards.</div>
                </td>
                <td style="text-align: right; font-weight: 600;">
                  ₹${Number(proposal.basePrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Summary -->
          <table class="summary-table">
            <tr>
              <td class="label">Subtotal</td>
              <td class="value">₹${Number(proposal.basePrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td class="label" style="color: #ef4444;">Discount</td>
              <td class="value" style="color: #ef4444;">- ₹${Number(proposal.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total">
              <td class="label">Total Amount</td>
              <td class="value">₹${Number(proposal.finalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          </table>

          <!-- Terms -->
          ${proposal.terms ? `
            <div class="terms-section">
              <div class="terms-title">Terms & Conditions</div>
              <div class="terms-content">${proposal.terms}</div>
            </div>
          ` : ''}


        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
  };

  const getCustomFooter = () => {
    return (
      <div className="flex flex-wrap w-full items-center justify-end gap-2">
        <Button
          variant="text"
          onClick={onClose}
          sx={{ color: '#475569', fontWeight: 600, fontSize: '12px', mr: 'auto' }}
        >
          Close
        </Button>
        
        {canDelete && (
          <Button
            variant="outlined"
            danger
            onClick={() => onDelete(proposal.id)}
            disabled={isStatusChanging}
            sx={{ py: 1, px: 2.5, fontSize: '12px', height: '32px' }}
          >
            Delete
          </Button>
        )}

        <Button
          variant="outlined"
          color="primary"
          onClick={handlePrint}
          disabled={isStatusChanging}
          startIcon={<Printer size={13} />}
          sx={{ py: 1, px: 2.5, fontSize: '12px', height: '32px', borderColor: '#E2E8F0', color: '#475569', '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' } }}
        >
          Print
        </Button>

        {!isLocked && (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => onEditRevision(proposal)}
            disabled={isStatusChanging}
            sx={{ py: 1, px: 2.5, fontSize: '12px', height: '32px', borderColor: '#E2E8F0', color: '#475569', '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' } }}
          >
            Revise
          </Button>
        )}

        {!isLocked && isDraft && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleStatusChangeClick('SENT')}
            isLoading={isStatusChanging && statusAction === 'SENT'}
            disabled={isStatusChanging}
            startIcon={<Send size={13} />}
            sx={{ py: 1, px: 3, fontSize: '12px', height: '32px' }}
          >
            Send to Client
          </Button>
        )}

        {!isLocked && isSent && (
          <>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleStatusChangeClick('ACCEPTED')}
              isLoading={isStatusChanging && statusAction === 'ACCEPTED'}
              disabled={isStatusChanging}
              startIcon={<CheckCircle2 size={13} />}
              sx={{ py: 1, px: 3, fontSize: '12px', height: '32px', bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
            >
              Accept
            </Button>
            <Button
              variant="contained"
              danger
              onClick={() => handleStatusChangeClick('REJECTED')}
              isLoading={isStatusChanging && statusAction === 'REJECTED'}
              disabled={isStatusChanging}
              startIcon={<XCircle size={13} />}
              sx={{ py: 1, px: 3, fontSize: '12px', height: '32px' }}
            >
              Reject
            </Button>
          </>
        )}
      </div>
    );
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={proposal.proposalNumber}
      subtitle={`Linked to: ${proposal.opportunity?.opportunityName || '—'}`}
      icon={Receipt}
      showFooter={true}
      customFooter={getCustomFooter()}
      width={{ xs: '100%', sm: 480, md: 540 }}
    >
      <div className="space-y-6 text-sm pb-10">
        {/* Status & Key Figures Header */}
        <div className="border-b border-slate-100 pb-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
              isAccepted 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' 
                : isRejected 
                ? 'bg-rose-50 text-rose-700 border-rose-200/80' 
                : isSent 
                ? 'bg-blue-50 text-blue-700 border-blue-200/80' 
                : 'bg-slate-100 text-slate-700 border-slate-200/80'
            }`}>
              {isAccepted && <CheckCircle2 size={12} className="text-emerald-500" />}
              {isRejected && <XCircle size={12} className="text-rose-500" />}
              {isSent && <Send size={12} className="text-blue-500" />}
              {isDraft && <Edit3 size={12} className="text-slate-500" />}
              {proposal.status}
            </span>
            {proposal.isExpired && !isLocked && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                Expired
              </span>
            )}
          </div>
          
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Final Amount</span>
            <div className="text-3xl font-black text-slate-900 tracking-tight mt-0.5 font-display">
              ₹{Number(proposal.finalAmount).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4.5 space-y-3.5 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Base Price:</span>
            <span className="font-semibold text-slate-700">₹{Number(proposal.basePrice).toLocaleString('en-IN')}</span>
          </div>
          
          {Number(proposal.discount) > 0 && (
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Applied Discount:</span>
              <span className="font-semibold text-rose-600">- ₹{Number(proposal.discount).toLocaleString('en-IN')}</span>
            </div>
          )}
          
          <div className="border-t border-slate-200/80 my-2 pt-2.5 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-600 font-display">Total Proposal Value:</span>
            <span className="text-xl font-black text-slate-900 font-display">₹{Number(proposal.finalAmount).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Proposal Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-500" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Proposal Details</h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Product / Service */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 flex items-start gap-3">
              <Award className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Product / Course</span>
                <span className="font-semibold text-xs text-slate-700 leading-tight block mt-0.5">{proposal.product?.name || '—'}</span>
              </div>
            </div>
            
            {/* Created By */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Created By</span>
                <span className="font-semibold text-xs text-slate-700 leading-tight block mt-0.5">{proposal.createdBy?.name || '—'}</span>
              </div>
            </div>
            
            {/* Created Date */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Created Date</span>
                <span className="font-semibold text-xs text-slate-700 leading-tight block mt-0.5 font-display">
                  {new Date(proposal.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            
            {/* Valid Until */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Valid Until</span>
                <span className="font-semibold text-xs text-slate-700 leading-tight block mt-0.5 font-display">
                  {new Date(proposal.validTill).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          {proposal.terms && (
            <div className="bg-orange-50/20 border border-orange-100/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-orange-500/80" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Terms & Conditions</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium pl-6">
                {proposal.terms}
              </p>
            </div>
          )}
        </div>

        {/* Version History */}
        <div className="space-y-4 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-orange-500" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Version History</h4>
          </div>
          <div className="relative border-l border-slate-200 ml-3.5 space-y-5 pl-5 text-xs">
            {(proposal.versions || []).map((ver, idx) => {
              const isCurrent = idx === 0;
              return (
                <div key={ver.id} className="relative group">
                  {/* Timeline Node */}
                  <div className={`absolute left-[-25px] top-1.5 w-3 h-3 rounded-full border-2 border-white transition-all ${
                    isCurrent 
                      ? 'bg-orange-500 ring-4 ring-orange-100' 
                      : 'bg-slate-300 group-hover:bg-slate-400'
                  }`} />
                  
                  <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2.5 transition-all">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <span className={isCurrent ? 'text-orange-500 font-bold' : 'text-slate-500'}>
                        Version V{ver.versionNumber} {isCurrent && '(Active)'}
                      </span>
                      <span>
                        {new Date(ver.modifiedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    
                    <div className="font-extrabold text-sm text-slate-900 font-display">
                      ₹{Number(ver.finalAmount).toLocaleString('en-IN')}
                    </div>
                    
                    {ver.versionNotes && (
                      <p className="text-[11px] text-slate-600 bg-white/70 border border-slate-100/80 rounded-lg p-2 italic leading-relaxed">
                        "{ver.versionNotes}"
                      </p>
                    )}
                    
                    <div className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                      <span>Modified by:</span>
                      <span className="font-semibold text-slate-500">{ver.modifiedBy?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
