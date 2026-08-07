import React from 'react';
import Modal from '../../../shared/components/elements/Modal';
import Button from '../../../shared/components/elements/Button';
import { formatCurrency, formatDate, formatText } from '../utils/customerUtils';

const Section = ({ title, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
    {children}
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-2 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="text-right font-medium text-slate-800">{value || '—'}</span>
  </div>
);

const CustomerDetailModal = ({ isOpen, onClose, customer }) => {
  if (!customer) return null;

  const revenueLogs = customer.revenueLogs || [];
  const latestRevenue = revenueLogs[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Details"
      subtitle={customer.customerName}
      maxWidth="lg"
      actions={
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outlined">Close</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Section title="Customer info">
          <div className="grid gap-4 md:grid-cols-2">
            <Row label="Customer name" value={customer.customerName} />
            <Row label="Contact number" value={customer.contactNumber} />
            <Row label="Email" value={customer.email || 'Not provided'} />
            <Row label="Status" value={customer.status} />
            <Row label="Product" value={customer.purchasedProduct?.name || 'Not provided'} />
            <Row label="Revenue" value={formatCurrency(customer.totalRevenue)} />
            <Row label="Owner" value={customer.assignedOwner?.name || 'Unassigned'} />
            <Row label="Created" value={formatDate(customer.createdAt)} />
          </div>
        </Section>

        <div className="grid gap-4 md:grid-cols-2">
          <Section title="Lead info">
            <Row label="Lead" value={customer.lead?.name || '—'} />
            <Row label="Phone" value={customer.lead?.mobile || '—'} />
            <Row label="Email" value={customer.lead?.email || '—'} />
            <Row label="Source" value={customer.lead?.source?.name || '—'} />
          </Section>

          <Section title="Opportunity info">
            <Row label="Opportunity" value={customer.opportunity?.opportunityName || '—'} />
            <Row label="Expected revenue" value={formatCurrency(customer.opportunity?.expectedRevenue)} />
            <Row label="Probability" value={customer.opportunity?.probabilityPercentage ? `${customer.opportunity.probabilityPercentage}%` : '—'} />
            <Row label="Stage" value={customer.opportunity?.stage?.name || '—'} />
          </Section>
        </div>

        <Section title="Deal info">
          <div className="grid gap-4 md:grid-cols-2">
            <Row label="Deal number" value={customer.deal?.dealNumber || '—'} />
            <Row label="Outcome" value={formatText(customer.deal?.outcome)} />
            <Row label="Amount" value={formatCurrency(customer.deal?.finalAmount)} />
            <Row label="Closed on" value={formatDate(customer.deal?.closingDate)} />
          </div>
          {customer.deal?.remarks && <p className="mt-3 text-sm text-slate-600">{customer.deal.remarks}</p>}
        </Section>

        <Section title="Revenue info">
          {latestRevenue ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Row label="Revenue amount" value={formatCurrency(latestRevenue.revenueAmount)} />
              <Row label="Revenue date" value={formatDate(latestRevenue.revenueDate)} />
              <Row label="Payment status" value={latestRevenue.paymentStatus} />
              <Row label="Notes" value={latestRevenue.notes || '—'} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">No revenue log available.</p>
          )}
        </Section>
      </div>
    </Modal>
  );
};

export default CustomerDetailModal;
