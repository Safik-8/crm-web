import React, { useState } from 'react';
import Drawer from '../../../shared/components/elements/Drawer';
import Button from '../../../shared/components/elements/Button';
import { Calendar, FileText, CheckCircle2, XCircle, Send, ShieldAlert, Award, FileSpreadsheet, Printer } from 'lucide-react';

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

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={proposal.proposalNumber}
      subtitle={`Linked to: ${proposal.opportunity?.opportunityName || '—'}`}
    >
      <div className="space-y-6 text-sm">
        {/* Status & Key Figures Header */}
        <div className="border-b border-slate-100 pb-5">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isAccepted 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : isRejected 
                ? 'bg-rose-50 text-rose-700 border-rose-200' 
                : isSent 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {proposal.status}
            </span>
            {proposal.isExpired && !isLocked && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Expired
              </span>
            )}
          </div>
          
          <div className="mt-4">
            <span className="text-xs text-slate-500 font-medium">Final Amount</span>
            <div className="text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
              ₹{Number(proposal.finalAmount).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5">
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            <span>Base Price</span>
            <span>₹{Number(proposal.basePrice).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            <span>Discount Applied</span>
            <span className="text-rose-600">- ₹{Number(proposal.discount).toLocaleString('en-IN')}</span>
          </div>
          <div className="border-t border-slate-200 pt-2.5 flex justify-between text-xs font-bold text-slate-900">
            <span>Total Proposal Value</span>
            <span>₹{Number(proposal.finalAmount).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Proposal Details */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Details</h4>
          <div className="grid grid-cols-2 gap-4 border border-slate-100 rounded-xl p-4 bg-white shadow-2xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Product / Service</span>
              <span className="font-semibold text-slate-800">{proposal.product?.name || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Created By</span>
              <span className="font-semibold text-slate-800">{proposal.createdBy?.name || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Created Date</span>
              <span className="font-semibold text-slate-700">{new Date(proposal.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Valid Until</span>
              <span className="font-semibold text-slate-700">{new Date(proposal.validTill).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {proposal.terms && (
            <div className="border border-slate-100 rounded-xl p-4 bg-white space-y-1.5 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Terms & Conditions</span>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">{proposal.terms}</p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-3">
            {/* Mark as Sent */}
            {!isLocked && isDraft && (
              <Button
                variant="contained"
                color="primary"
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg shadow-sm"
                onClick={() => handleStatusChangeClick('SENT')}
                isLoading={isStatusChanging && statusAction === 'SENT'}
                disabled={isStatusChanging}
              >
                <Send size={14} />
                Send to Client
              </Button>
            )}

            {/* Accept / Reject */}
            {!isLocked && isSent && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg shadow-sm"
                  onClick={() => handleStatusChangeClick('ACCEPTED')}
                  isLoading={isStatusChanging && statusAction === 'ACCEPTED'}
                  disabled={isStatusChanging}
                >
                  <CheckCircle2 size={14} />
                  Accept
                </Button>
                <Button
                  variant="contained"
                  danger
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg shadow-sm"
                  onClick={() => handleStatusChangeClick('REJECTED')}
                  isLoading={isStatusChanging && statusAction === 'REJECTED'}
                  disabled={isStatusChanging}
                >
                  <XCircle size={14} />
                  Reject
                </Button>
              </>
            )}

            {/* Create Revision */}
            {!isLocked && (
              <Button
                variant="outlined"
                color="primary"
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => onEditRevision(proposal)}
                disabled={isStatusChanging}
              >
                Create Revision
              </Button>
            )}

            {/* Print / PDF */}
            <Button
              variant="outlined"
              color="primary"
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={handlePrint}
              disabled={isStatusChanging}
            >
              <Printer size={14} />
              Print / PDF
            </Button>

            {/* Delete Proposal */}
            {(currentUserRoleRank >= 60 || proposal.createdById === currentUserId || proposal.opportunity?.ownerId === currentUserId) && !isAccepted && (
              <Button
                variant="outlined"
                danger
                className={`w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
                  isSent ? 'col-span-2' : ''
                }`}
                onClick={() => onDelete(proposal.id)}
                disabled={isStatusChanging}
              >
                Delete Proposal
              </Button>
            )}
          </div>
        </div>

        {/* Version History */}
        <div className="space-y-4 border-t border-slate-100 pt-5">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Version History</h4>
          <div className="relative border-l border-slate-200 ml-2.5 space-y-4 pl-4 text-xs">
            {(proposal.versions || []).map((ver, idx) => (
              <div key={ver.id} className="relative">
                <div className={`absolute left-[-21px] top-1.5 w-2 h-2 rounded-full border border-white ${
                  idx === 0 ? 'bg-primary ring-2 ring-orange-50' : 'bg-slate-300'
                }`} />
                <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                  <span className={idx === 0 ? 'text-primary' : ''}>V{ver.versionNumber}</span>
                  <span>{new Date(ver.modifiedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                </div>
                <div className="font-bold text-slate-900 mt-0.5">
                  ₹{Number(ver.finalAmount).toLocaleString('en-IN')}
                </div>
                {ver.versionNotes && (
                  <p className="text-slate-600 mt-1 italic leading-relaxed">"{ver.versionNotes}"</p>
                )}
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">By {ver.modifiedBy?.name || 'Unknown'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
