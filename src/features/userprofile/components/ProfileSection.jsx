// src/features/userprofile/components/ProfileSection.jsx

import React from 'react';

/**
 * ProfileSection Component
 * Reusable layout row for side-by-side descriptive sections.
 */
export const ProfileSection = ({ title, description, icon: Icon, children }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="space-y-1 py-1">
        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          {Icon && <Icon size={15} className="text-orange-500 shrink-0" />}
          {title}
        </h3>
        <p className="text-xs text-zinc-400 font-medium">{description}</p>
      </div>
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 bg-zinc-50/40 p-5 sm:p-6 rounded-2xl border border-zinc-200/50 hover:bg-zinc-50/70 transition-colors duration-200">
        {children}
      </div>
    </div>
  );
};

export default ProfileSection;
