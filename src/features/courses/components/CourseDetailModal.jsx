// src/features/courses/components/CourseDetailModal.jsx

import React from 'react';
import { BookOpen, Calendar, Shield, Building2, Tag, DollarSign, Activity } from 'lucide-react';
import DynamicFormSlideover from '../../../shared/components/elements/DynamicFormSlideover';

/**
 * Slide-out detail sheet to display comprehensive, read-only information about a Course.
 * Reuses the shared `<DynamicFormSlideover>` overlay wrapper.
 */
const CourseDetailModal = ({ isOpen, onClose, course = null }) => {
  if (!course) return null;

  const formatCurrency = (value) => {
    const num = Number(value);
    if (isNaN(num)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num);
  };

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
      title="Course Catalog Sheet"
      subtitle={`Detailed specifications for course code: ${course.code}`}
      icon={BookOpen}
      showFooter={true}
      cancelText="Close Details"
    >
      <div className="space-y-6 pb-6">
        
        {/* Banner Card */}
        <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white text-lg font-black shadow-md uppercase">
            {course.name?.charAt(0) || 'C'}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-slate-800 text-[15px] leading-tight truncate">
              {course.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-600 uppercase tracking-wider">
                {course.code}
              </span>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                {course.category}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Course Specifications */}
        <div className="space-y-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5 mb-2">
            Catalog details
          </h3>
          <DetailItem
            icon={Tag}
            label="Course Code"
            value={course.code}
          />
          <DetailItem
            icon={BookOpen}
            label="Primary Category"
            value={course.category}
          />
          <DetailItem
            icon={Tag}
            label="Sub/Parent Category"
            value={course.parentCategory}
          />
           <DetailItem
            icon={Calendar}
            label="Duration"
            value={course.duration ? (course.duration.match(/\d+/) ? `${course.duration.match(/\d+/)[0]} months` : course.duration) : 'N/A'}
          />
          <DetailItem
            icon={DollarSign}
            label="Standard Price"
            value={formatCurrency(course.price)}
          />
          <DetailItem
            icon={Activity}
            label="Catalog Status"
            value={
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                course.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/30' : 'bg-rose-50 text-rose-700 border border-rose-200/30'
              }`}>
                {course.status === 'ACTIVE' ? 'Active & Available' : 'Inactive / Archived'}
              </span>
            }
          />
        </div>

        {/* Section 2: Detailed Description */}
        <div className="space-y-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5 mb-2">
            Course Description
          </h3>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mt-2">
            <p className="text-[13px] text-slate-600 leading-relaxed font-medium whitespace-pre-wrap break-words">
              {course.description || 'No description has been configured for this course yet.'}
            </p>
          </div>
        </div>

        {/* Section 3: Audit Information */}
        <div className="space-y-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-orange-500 border-b border-orange-100 pb-1.5 mb-2">
            Tenant & Audit Details
          </h3>
          <DetailItem
            icon={Building2}
            label="Owning Company"
            value={course.company?.name || `Company ID: ${course.companyId}`}
          />
          <DetailItem
            icon={Shield}
            label="Created By"
            value={course.createdBy?.name ? `${course.createdBy.name} (${course.createdBy.email})` : 'System'}
          />
          <DetailItem
            icon={Calendar}
            label="Created At"
            value={course.createdAt ? new Date(course.createdAt).toLocaleString() : 'N/A'}
          />
          {course.updatedBy && (
            <>
              <DetailItem
                icon={Shield}
                label="Last Updated By"
                value={`${course.updatedBy.name} (${course.updatedBy.email})`}
              />
              <DetailItem
                icon={Calendar}
                label="Last Updated At"
                value={course.updatedAt ? new Date(course.updatedAt).toLocaleString() : 'N/A'}
              />
            </>
          )}
        </div>

      </div>
    </DynamicFormSlideover>
  );
};

export default CourseDetailModal;
