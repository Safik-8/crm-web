// src/features/users/components/UserDetailModal.jsx

import React from 'react';
import { Calendar, Mail, Phone, Shield, Building2, MapPin, AlertTriangle, User } from 'lucide-react';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';

const UserDetailModal = ({ isOpen, onClose, user = null }) => {
  if (!user) return null;

  const primaryRole = user.userRoles?.find(ur => ur.isPrimary) || user.userRoles?.[0];
  const roleName = primaryRole?.role?.name || 'Member';
  
  const DetailItem = ({ icon: Icon, label, value, className = '' }) => (
    <div className={`flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 ${className}`}>
      {Icon && <Icon size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none">
          {label}
        </p>
        <p className="text-[13px] font-semibold text-slate-700 leading-tight mt-1.5 break-words">
          {value || <span className="text-slate-300 font-semibold">—</span>}
        </p>
      </div>
    </div>
  );

  return (
    <DynamicFormSlideover
      isOpen={isOpen}
      onClose={onClose}
      title="Employee Profile Sheet"
      subtitle={`Comprehensive read-only details of employee ${user.name}`}
      icon={User}
      showFooter={true}
      cancelText="Close Sheet"
    >
      <div className="space-y-6 pb-6">
        
        {/* Banner Card */}
        <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white text-lg font-black shadow-md uppercase overflow-hidden shrink-0">
            {user.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              user.firstName?.charAt(0) || user.name?.charAt(0) || 'U'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-slate-800 text-[15px] leading-tight truncate">
              {user.name || `${user.firstName} ${user.lastName}`}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-600 uppercase tracking-wider">
                {roleName}
              </span>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                {user.employeeId || 'No ID'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Employment Details */}
        <div className="space-y-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5 mb-2">
            Employment details
          </h3>
          <DetailItem
            icon={Shield}
            label="Designation / Role"
            value={roleName}
          />
          <DetailItem
            icon={Building2}
            label="Assigned Branch"
            value={user.branch?.name || 'Global / Company Wide'}
          />
          <DetailItem
            icon={User}
            label="Reporting Manager"
            value={user.reportingManager?.name ? `${user.reportingManager.name} (${user.reportingManager.email})` : 'None / Direct Report'}
          />
          <DetailItem
            icon={Calendar}
            label="Joining Date"
            value={user.joiningDate ? new Date(user.joiningDate).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Not Specified'}
          />
          <DetailItem
            icon={AlertTriangle}
            label="Security Checks"
            value={user.mustChangePassword ? '⚠️ Forced password change pending' : '✅ Active & Verified Credentials'}
          />
        </div>

        {/* Section 2: Contact Information */}
        <div className="space-y-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5 mb-2">
            Contact Information
          </h3>
          <DetailItem
            icon={Mail}
            label="Email Address"
            value={user.email}
          />
          <DetailItem
            icon={Phone}
            label="Mobile Number"
            value={user.mobileNumber}
          />
          <DetailItem
            icon={Phone}
            label="Emergency Contact"
            value={user.profile?.emergencyContact}
          />
        </div>

        {/* Section 3: Profile & Address Details */}
        <div className="space-y-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5 mb-2">
            Home Address details
          </h3>
          <DetailItem
            icon={MapPin}
            label="Street Address"
            value={user.profile?.address}
          />
          <DetailItem
            icon={MapPin}
            label="City"
            value={user.profile?.city}
          />
          <DetailItem
            icon={MapPin}
            label="State / Province"
            value={user.profile?.state}
          />
          <DetailItem
            icon={MapPin}
            label="Pincode / ZIP"
            value={user.profile?.pincode}
          />
          <DetailItem
            icon={MapPin}
            label="Country"
            value={user.profile?.country}
          />
        </div>

      </div>
    </DynamicFormSlideover>
  );
};

export default UserDetailModal;
