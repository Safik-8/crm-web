import React from 'react';
import Drawer from '../../../shared/components/elements/Drawer';
import Button from '../../../shared/components/elements/Button';
import { formatCurrency, formatDate } from '../utils/customerUtils';
import { 
  User, Phone, Mail, Award, Calendar, Handshake, 
  ShoppingBag, TrendingUp, XCircle, Landmark, Briefcase, IndianRupee, Tag
} from 'lucide-react';

const CustomerDetailModal = ({ isOpen, onClose, customer }) => {
  if (!customer) return null;

  const revenueLogs = customer.revenueLogs || [];
  const latestRevenue = revenueLogs[0];

  const StatBadge = ({ label, value, icon: Icon, color = 'blue' }) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-100 text-blue-800 icon:text-blue-500',
      emerald: 'bg-emerald-50 border-emerald-100 text-emerald-800 icon:text-emerald-500',
      orange: 'bg-orange-50 border-orange-100 text-orange-800 icon:text-orange-500',
      amber: 'bg-amber-50 border-amber-100 text-amber-800 icon:text-amber-500',
      rose: 'bg-rose-50 border-rose-100 text-rose-800 icon:text-rose-500',
      slate: 'bg-slate-50 border-slate-100 text-slate-800 icon:text-slate-500',
    };

    return (
      <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${colors[color] || colors.blue}`}>
        {Icon && (
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100/40 flex-shrink-0 text-slate-500">
            <Icon size={16} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">{label}</span>
          <span className="text-sm font-black block mt-0.5 truncate">{value || '—'}</span>
        </div>
      </div>
    );
  };

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-center gap-2.5 py-1.5 px-1 hover:bg-slate-50/50 rounded-lg transition-colors">
      {Icon && <Icon size={14} className="text-slate-400 flex-shrink-0" />}
      <span className="text-xs text-slate-500 min-w-[120px]">{label}</span>
      <span className="text-xs font-bold text-slate-800 truncate flex-1 text-right">{value || '—'}</span>
    </div>
  );

  const CardSection = ({ title, icon: Icon, children, accentColor = 'border-t-slate-200' }) => (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden border-t-2 ${accentColor}`}>
      <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
        {Icon && <Icon size={14} className="text-slate-400" />}
        <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{title}</h4>
      </div>
      <div className="p-4 space-y-2">
        {children}
      </div>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Profile"
      subtitle={customer.customerCode || 'Active Account'}
    >
      {/* Container */}
      <div className="space-y-6 pb-20">
        
        {/* Top Header Card */}
        <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-tr from-orange-400 to-amber-500 text-white rounded-2xl shadow-md flex-shrink-0">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">{customer.customerName}</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{customer.email || 'No email associated'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${
              customer.status === 'ACTIVE' 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              {customer.status}
            </span>
          </div>
        </div>

        {/* Core Stats Badges */}
        <div className="grid grid-cols-1 gap-4">
          <StatBadge label="Total Revenue" value={formatCurrency(customer.totalRevenue)} icon={IndianRupee} color="emerald" />
          <StatBadge label="Product" value={customer.purchasedProduct?.name} icon={ShoppingBag} color="blue" />
          <StatBadge label="Assigned Owner" value={customer.assignedOwner?.name} icon={Award} color="orange" />
        </div>

        {/* Detailed Info */}
        <div className="space-y-4">
          {/* Customer Metadata Card */}
          <CardSection title="Customer Account Details" icon={User} accentColor="border-t-orange-400">
            <InfoRow label="Customer Code" value={customer.customerCode} icon={Tag} />
            <InfoRow label="Contact Number" value={customer.contactNumber} icon={Phone} />
            <InfoRow label="Email Address" value={customer.email} icon={Mail} />
            <InfoRow label="Registration Date" value={formatDate(customer.createdAt)} icon={Calendar} />
          </CardSection>

          {/* Opportunity Lifecycle Card */}
          <CardSection title="Pipeline Lifecycle" icon={Briefcase} accentColor="border-t-indigo-400">
            <InfoRow label="Opportunity Name" value={customer.opportunity?.opportunityName} icon={Briefcase} />
            <InfoRow label="Expected Revenue" value={formatCurrency(customer.opportunity?.expectedRevenue)} icon={IndianRupee} />
            <InfoRow label="Probability Rate" value={customer.opportunity?.probabilityPercentage ? `${customer.opportunity.probabilityPercentage}%` : null} icon={TrendingUp} />
            <InfoRow label="Pipeline Stage" value={customer.opportunity?.stage?.name} icon={Tag} />
          </CardSection>

          {/* Closed Deal Card */}
          <CardSection title="Closed Deal Details" icon={Handshake} accentColor="border-t-emerald-400">
            <InfoRow label="Deal Reference" value={customer.deal?.dealNumber} icon={Tag} />
            <InfoRow label="Outcome" value={customer.deal?.outcome} icon={Award} />
            <InfoRow label="Final Amount" value={formatCurrency(customer.deal?.finalAmount)} icon={IndianRupee} />
            <InfoRow label="Closed Date" value={formatDate(customer.deal?.closingDate)} icon={Calendar} />
            {customer.deal?.remarks && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Deal Remarks</span>
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">{customer.deal.remarks}</p>
              </div>
            )}
          </CardSection>

          {/* Revenue & Payment Log Card */}
          <CardSection title="Financial Transaction Log" icon={Landmark} accentColor="border-t-amber-400">
            {latestRevenue ? (
              <>
                <InfoRow label="Transacted Amount" value={formatCurrency(latestRevenue.revenueAmount)} icon={IndianRupee} />
                <InfoRow label="Transaction Date" value={formatDate(latestRevenue.revenueDate)} icon={Calendar} />
                <InfoRow label="Payment Status" value={latestRevenue.paymentStatus} icon={Award} />
                {latestRevenue.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Transaction Notes</span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">{latestRevenue.notes}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <XCircle size={24} className="text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-slate-400 font-medium">No transaction log available for this account.</p>
              </div>
            )}
          </CardSection>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <Button onClick={onClose} variant="outlined" color="primary" className="w-full">
            Close Profile
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default CustomerDetailModal;
