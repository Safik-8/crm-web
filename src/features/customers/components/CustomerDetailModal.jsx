// src/features/customers/components/CustomerDetailModal.jsx

import React from 'react';
import Drawer from '../../../shared/components/elements/Drawer';
import Button from '../../../shared/components/elements/Button';
import { formatCurrency, formatDate } from '../utils/customerUtils';
import { 
  User, Phone, Mail, Award, Calendar, Handshake, 
  ShoppingBag, TrendingUp, XCircle, Landmark, Briefcase, IndianRupee, Tag,
  Clock, Building2, Shield
} from 'lucide-react';

const CustomerDetailModal = ({ isOpen, onClose, customer }) => {
  if (!customer) return null;

  const revenueLogs = customer.revenueLogs || [];
  const latestRevenue = revenueLogs[0];

  // Helper to extract initials for avatar
  const getInitials = (name) => {
    if (!name) return 'CU';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const InfoCard = ({ title, icon: Icon, accentClass, children }) => (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-l-4 ${accentClass} transition-all duration-200 hover:shadow`}>
      <div className="px-4.5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
        {Icon && <Icon size={14} className="text-slate-500" />}
        <h4 className="text-[10px] font-black tracking-wider uppercase text-slate-700">{title}</h4>
      </div>
      <div className="p-4.5 space-y-1">
        {children}
      </div>
    </div>
  );

  const DetailRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100/60 last:border-b-0 hover:bg-slate-50/30 px-1 rounded transition-colors duration-150">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="p-1 bg-slate-100 rounded text-slate-400">
            <Icon size={12} />
          </div>
        )}
        <span className="text-[11px] font-bold text-slate-500">{label}</span>
      </div>
      <span className="text-xs font-bold text-slate-800 text-right truncate max-w-[240px]">
        {value || '—'}
      </span>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Profile"
      subtitle={customer.customerCode || 'Active Account'}
      width={{ xs: '100%', sm: 540, md: 600 }}
    >
      <div className="space-y-5 pb-24 bg-slate-50/30 p-1">
        
        {/* Profile Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Initials Avatar */}
            <div className="w-13 h-13 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 font-extrabold text-base flex items-center justify-center shadow-inner">
              {getInitials(customer.customerName)}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">{customer.customerName}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                  customer.status === 'ACTIVE' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <span className={`w-1 h-1 rounded-full ${customer.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {customer.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{customer.email || 'No email'}</p>
            </div>
          </div>

          {/* Quick Revenue Display */}
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">Total Revenue</span>
            <span className="text-base font-black text-emerald-600 tracking-tight block">
              {formatCurrency(customer.totalRevenue)}
            </span>
          </div>
        </div>

        {/* Section 1: Customer Info */}
        <InfoCard title="Customer Information" icon={User} accentClass="border-l-orange-500">
          <DetailRow label="Customer ID" value={customer.customerCode} icon={Tag} />
          <DetailRow label="Contact Number" value={customer.contactNumber} icon={Phone} />
          <DetailRow label="Email Address" value={customer.email} icon={Mail} />
          <DetailRow label="Registered Branch" value={customer.branch?.name} icon={Building2} />
          <DetailRow label="Owner Representative" value={customer.assignedOwner?.name} icon={Award} />
          <DetailRow label="Account Created" value={formatDate(customer.createdAt)} icon={Calendar} />
        </InfoCard>

        {/* Section 2: Pipeline & Product Details */}
        <InfoCard title="Sales Pipeline & Product" icon={ShoppingBag} accentClass="border-l-indigo-500">
          <DetailRow label="Course Registered" value={customer.purchasedProduct?.name} icon={ShoppingBag} />
          <DetailRow label="Course Code" value={customer.purchasedProduct?.code} icon={Tag} />
          <DetailRow label="Opportunity Tracker" value={customer.opportunity?.opportunityName} icon={Briefcase} />
          <DetailRow label="Estimated Value" value={formatCurrency(customer.opportunity?.expectedRevenue)} icon={IndianRupee} />
          <DetailRow label="Closing Stage" value={customer.opportunity?.stage?.name} icon={Tag} />
        </InfoCard>

        {/* Section 3: Closed Deal Details */}
        <InfoCard title="Deal Details" icon={Handshake} accentClass="border-l-sky-500">
          <DetailRow label="Deal Reference" value={customer.deal?.dealNumber} icon={Tag} />
          <DetailRow label="Outcome Status" value={customer.deal?.outcome} icon={Award} />
          <DetailRow label="Closed Deal Amount" value={formatCurrency(customer.deal?.finalAmount)} icon={IndianRupee} />
          <DetailRow label="Closing Date" value={formatDate(customer.deal?.closingDate)} icon={Calendar} />
          
          {customer.deal?.remarks && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Deal Remarks</span>
              <p className="text-xs text-slate-650 font-medium italic leading-relaxed">"{customer.deal.remarks}"</p>
            </div>
          )}
        </InfoCard>

        {/* Section 4: Transaction History */}
        <InfoCard title="Transaction Log" icon={Landmark} accentClass="border-l-emerald-500">
          {latestRevenue ? (
            <>
              <DetailRow label="Transacted Amount" value={formatCurrency(latestRevenue.revenueAmount)} icon={IndianRupee} />
              <DetailRow label="Transaction Date" value={formatDate(latestRevenue.revenueDate)} icon={Calendar} />
              <DetailRow label="Payment Status" value={latestRevenue.paymentStatus} icon={Award} />
              
              {latestRevenue.notes && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Notes</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{latestRevenue.notes}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              <XCircle size={18} className="text-slate-350 mx-auto mb-1" />
              <p className="text-xs text-slate-400 font-medium">No revenue log found for this account.</p>
            </div>
          )}
        </InfoCard>

        {/* Footer Action */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
          <Button onClick={onClose} variant="outlined" color="primary" className="w-full h-11 rounded-xl text-sm font-bold">
            Close Customer Profile
          </Button>
        </div>

      </div>
    </Drawer>
  );
};

export default CustomerDetailModal;
