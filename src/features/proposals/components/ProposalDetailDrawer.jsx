import React from 'react';
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
  currentUserRoleRank = 0
}) {
  if (!proposal) return null;

  const isDraft = proposal.status === 'DRAFT';
  const isSent = proposal.status === 'SENT';
  const isAccepted = proposal.status === 'ACCEPTED';
  const isRejected = proposal.status === 'REJECTED';
  const isLocked = isAccepted || isRejected;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
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
            .client-info { font-size: 14px; color: #1e293b; line-height: 1.5; }
            
            .item-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .item-table th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; text-align: left; }
            .item-table td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; }
            .item-table td.amount { text-align: right; font-weight: 500; }
            .item-table th.amount { text-align: right; }
            
            .pricing-summary { width: 100%; margin-top: 20px; border-collapse: collapse; }
            .pricing-summary td { padding: 8px 12px; font-size: 14px; color: #475569; }
            .pricing-summary td.label { text-align: right; width: 75%; }
            .pricing-summary td.value { text-align: right; width: 25%; font-weight: 500; }
            .pricing-summary tr.total { border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; }
            .pricing-summary tr.total td { font-size: 18px; font-weight: 800; color: #0f172a; padding: 12px; }
            
            .terms-section { margin-top: 40px; }
            .terms-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
            .terms-content { font-size: 13px; color: #475569; line-height: 1.6; white-space: pre-wrap; }
            
            .footer-section { margin-top: 85px; width: 100%; border-collapse: collapse; }
            .footer-col { width: 50%; vertical-align: bottom; }
            .signature-line { width: 200px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 10px; height: 50px; }
            .signature-label { font-size: 12px; font-weight: 600; color: #64748b; }
            .thanks-msg { font-size: 14px; font-weight: 600; color: #475569; }
          </style>
        </head>
        <body>
          <!-- Company & Doc Header Info -->
          <table class="header-table">
            <tr>
              <td class="header-left">
                <div class="company-name">${proposal.company?.name || 'StackDot'}</div>
                <div class="company-info">
                  ${proposal.company?.address || 'Main Office, Headquarters'}<br/>
                  ${proposal.company?.website || 'www.stackdot.in'} · info@stackdot.in
                </div>
              </td>
              <td class="header-right">
                <div class="doc-title">QUOTATION</div>
                <div class="doc-meta">
                  <strong>Quote Number:</strong> ${proposal.proposalNumber}<br/>
                  <strong>Date:</strong> ${new Date(proposal.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}<br/>
                  <strong>Valid Until:</strong> ${new Date(proposal.validTill).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </td>
            </tr>
          </table>

          <!-- Client Info -->
          <table class="client-section">
            <tr>
              <td class="client-box">
                <div class="section-title">Prepared For</div>
                <div class="client-info">
                  <strong>To: ${proposal.opportunity?.lead?.name || 'Client Name'}</strong><br/>
                  ${proposal.opportunity?.lead?.companyName || 'Valued Customer'}
                </div>
              </td>
              <td class="client-box">
                <!-- Spacing balance -->
              </td>
            </tr>
          </table>

          <!-- Item Table -->
          <table class="item-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="amount">Unit Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${proposal.product?.name || 'Commercial Service Package'}</strong>
                  <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Comprehensive commercial proposal package matching terms.</div>
                </td>
                <td class="amount">₹${Number(proposal.basePrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <!-- Pricing Calculations -->
          <table class="pricing-summary">
            <tr>
              <td class="label">Subtotal</td>
              <td class="value">₹${Number(proposal.basePrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td class="label" style="color: #ef4444;">Discount</td>
              <td class="value" style="color: #ef4444;">- ₹${Number(proposal.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total">
              <td class="label">Total Proposal Value</td>
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

          <!-- Footer/Signatures -->
          <table class="footer-section">
            <tr>
              <td class="footer-col">
                <div class="thanks-msg">
                  Thank you for your business.
                </div>
              </td>
              <td class="footer-col" style="text-align: right;">
                <div style="display: inline-block; text-align: left;">
                  <div class="signature-line"></div>
                  <div class="signature-label">Authorized Signature</div>
                </div>
              </td>
            </tr>
          </table>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={proposal.proposalNumber}
      subtitle={`Rev. V${proposal.currentVersion} • Linked to "${proposal.opportunity?.opportunityName}"`}
    >
      <div className="space-y-6">
        {/* Status display / Alert banner */}
        {proposal.isExpired && !isLocked && (
          <div className="bg-amber-50 text-amber-700 p-4 rounded-xl border border-amber-200 flex items-center gap-3">
            <ShieldAlert size={20} className="flex-shrink-0" />
            <div>
              <div className="font-bold text-sm">Proposal is Expired</div>
              <div className="text-xs">The validity date (${new Date(proposal.validTill).toLocaleDateString()}) has passed.</div>
            </div>
          </div>
        )}

        {isAccepted && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 flex items-center gap-3">
            <Award size={20} className="flex-shrink-0" />
            <div>
              <div className="font-bold text-sm">Proposal Accepted & Locked</div>
              <div className="text-xs">Approved by client. This proposal can no longer be edited or status changed.</div>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3">
            <XCircle size={20} className="flex-shrink-0" />
            <div>
              <div className="font-bold text-sm">Proposal Rejected</div>
              <div className="text-xs">This proposal was marked as rejected by client and is locked.</div>
            </div>
          </div>
        )}

        {/* Pricing Summary */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Pricing Summary</h3>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Base price</span>
            <span>₹{Number(proposal.basePrice).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Discount applied</span>
            <span className="text-red-500">- ₹{Number(proposal.discount).toLocaleString()}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-lg">
            <span>Final amount</span>
            <span>₹{Number(proposal.finalAmount).toLocaleString()}</span>
          </div>
        </div>

        {/* Validity & Terms */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Validity & Conditions</h3>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar size={16} />
            <span>Valid Until: <strong>{new Date(proposal.validTill).toLocaleDateString()}</strong></span>
          </div>
          {proposal.terms && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
              {proposal.terms}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-3">
            {/* Mark as Sent (DRAFT only) */}
            {!isLocked && isDraft && (
              <Button
                variant="contained"
                color="primary"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => onStatusChange(proposal.id, 'SENT')}
              >
                <Send size={16} />
                Mark as Sent
              </Button>
            )}

            {/* Accept & Reject (SENT only) */}
            {!isLocked && isSent && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  className="w-full flex items-center justify-center gap-1.5"
                  onClick={() => onStatusChange(proposal.id, 'ACCEPTED')}
                >
                  <CheckCircle2 size={16} />
                  Accept
                </Button>
                <Button
                  variant="contained"
                  danger
                  className="w-full flex items-center justify-center gap-1.5"
                  onClick={() => onStatusChange(proposal.id, 'REJECTED')}
                >
                  <XCircle size={16} />
                  Reject
                </Button>
              </>
            )}

            {/* Create Revision (DRAFT / SENT only) */}
            {!isLocked && (
              <Button
                variant="outlined"
                color="primary"
                className="w-full flex items-center justify-center gap-1.5"
                onClick={() => onEditRevision(proposal)}
              >
                Create Revision
              </Button>
            )}

            {/* Print / PDF (Adaptive column span) */}
            <Button
              variant="outlined"
              color="primary"
              className={`w-full flex items-center justify-center gap-1.5 ${(isLocked || isDraft) ? 'col-span-2' : ''}`}
              onClick={handlePrint}
            >
              <Printer size={16} />
              Print / PDF
            </Button>

            {/* Delete Proposal (Admin/Manager only, non-accepted only) */}
            {currentUserRoleRank >= 60 && !isAccepted && (
              <Button
                variant="text"
                danger
                className="col-span-2 w-full flex items-center justify-center gap-1.5"
                onClick={() => onDelete(proposal.id)}
              >
                Delete Proposal
              </Button>
            )}
          </div>
        </div>

        {/* Version History */}
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Version History</h3>
          <div className="relative border-l border-slate-200 ml-3 space-y-4">
            {(proposal.versions || []).map((ver, idx) => (
              <div key={ver.id} className="relative pl-6">
                {/* Timeline dot */}
                <div className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-primary' : 'bg-slate-300'}`} />
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Version V{ver.versionNumber}</span>
                  <span>{new Date(ver.modifiedDate).toLocaleDateString()}</span>
                </div>
                <div className="text-sm font-semibold text-slate-800 mt-0.5">
                  ₹{Number(ver.finalAmount).toLocaleString()}
                </div>
                {ver.versionNotes && (
                  <p className="text-xs text-slate-600 mt-0.5 italic">"{ver.versionNotes}"</p>
                )}
                <p className="text-[10px] text-slate-400 mt-0.5">Modified by {ver.modifiedBy?.name || 'Unknown'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
