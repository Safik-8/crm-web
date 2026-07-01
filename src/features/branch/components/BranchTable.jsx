// src/features/branch/components/BranchTable.jsx

import React from 'react';
import { Edit2, GitBranch, Users, Hash, UserPlus, Calendar, Power } from 'lucide-react';
import Skeleton from '../../../shared/components/elements/Skeleton';

/**
 * BranchTable Component
 * Mobile-first responsive design with card layout for mobile and table for desktop.
 * Integrated with status toggling and Location details.
 */
const BranchTable = ({ branches = [], isLoading, onEdit, onToggleStatus, onAssignUser, canEdit }) => {

  // Render loading skeletons for mobile cards
  const renderMobileSkeletons = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-5 w-32 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
              <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );

  // Render loading skeletons for desktop table
  const renderDesktopSkeletons = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="border-b border-slate-100 last:border-0">
          <td className="py-4 px-6"><Skeleton className="h-5 w-44" /></td>
          <td className="py-4 px-6"><Skeleton className="h-5 w-20" /></td>
          <td className="py-4 px-6"><Skeleton className="h-5 w-32" /></td>
          <td className="py-4 px-6"><Skeleton className="h-6 w-16 rounded-full" /></td>
          <td className="py-4 px-6"><Skeleton className="h-5 w-12" /></td>
          <td className="py-4 px-6"><Skeleton className="h-8 w-24 rounded-lg" /></td>
        </tr>
      ))}
    </>
  );

  // Mobile Card Layout
  const renderMobileCards = () => {
    if (branches.length === 0) {
      return (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/60 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <GitBranch size={32} />
            </div>
            <div>
              <p className="font-semibold text-slate-800">No branches found</p>
              <p className="text-sm text-slate-400 mt-1">There are no branch records registered for this company.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {branches.map((branch) => (
          <div 
            key={branch.id} 
            className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
          >
            <div className="p-4">
              {/* Top Row: Icon + Name + Actions */}
              <div className="flex items-start gap-3 mb-3">
                <div className="h-11 w-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0">
                  <GitBranch size={20} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 font-heading text-base leading-tight">
                    {branch.name}
                  </h3>
                  {branch.location && (
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{branch.location}</p>
                  )}
                  {branch.company && (
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{branch.company.name}</p>
                  )}
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onToggleStatus(branch)}
                      className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${
                        branch.status === 'ACTIVE'
                          ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                      title={branch.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    >
                      <Power size={14} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => onEdit(branch)}
                      className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Edit2 size={14} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => onAssignUser(branch)}
                      className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Assign User"
                    >
                      <UserPlus size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>

              {/* Badges Row */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                  <Hash size={8} className="opacity-50" />
                  {branch.code}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                  branch.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-slate-50 text-slate-600 border-slate-100'
                }`}>
                  <span className={`w-1 h-1 rounded-full mr-1 ${
                    branch.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`} />
                  {branch.status}
                </span>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                    <Users size={15} />
                  </div>
                  <div>
                    <div className="font-black text-base text-slate-900 leading-none">{branch._count?.users || 0}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">Users</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar size={14} className="opacity-70" />
                  <div className="text-right">
                    <div className="font-bold text-xs text-slate-700 leading-none">
                      {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: '2-digit'
                      }) : 'N/A'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">Created</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      {/* Mobile Layout */}
      <div className="block lg:hidden p-3 sm:p-4">
        {isLoading ? renderMobileSkeletons() : renderMobileCards()}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200/60">
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider">Branch Name</th>
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider">Branch Code</th>
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider">Location</th>
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider">Status</th>
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider">Users</th>
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              renderDesktopSkeletons()
            ) : branches.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                      <GitBranch size={32} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">No branches found</p>
                      <p className="text-sm text-slate-400 mt-1">There are no branch records registered for this company.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              branches.map((branch) => (
                <tr key={branch.id} className="hover:bg-slate-50/50 transition-all duration-200 group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <GitBranch size={20} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 font-heading">{branch.name}</span>
                        {branch.company && (
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{branch.company.name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-tighter">
                      <Hash size={10} className="opacity-50" />
                      {branch.code}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 font-semibold">
                    {branch.location || <span className="text-slate-400 font-normal italic">None</span>}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
                      branch.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        branch.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`} />
                      {branch.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="h-7 w-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                        <Users size={14} />
                      </div>
                      <span className="font-bold text-sm tracking-tight">{branch._count?.users || 0}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {canEdit ? (
                        <>
                          <button
                            onClick={() => onToggleStatus(branch)}
                            className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-200 ${
                              branch.status === 'ACTIVE'
                                ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title={branch.status === 'ACTIVE' ? 'Deactivate Branch' : 'Activate Branch'}
                          >
                            <Power size={17} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => onEdit(branch)}
                            className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200"
                            title="Edit Branch"
                          >
                            <Edit2 size={17} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => onAssignUser(branch)}
                            className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200"
                            title="Create & Assign User"
                          >
                            <UserPlus size={17} strokeWidth={2.5} />
                          </button>
                        </>
                      ) : (
                        <div className="flex gap-1.5">
                          <span className="h-9 w-9 flex items-center justify-center text-slate-200 cursor-not-allowed">
                            <Power size={17} strokeWidth={2} />
                          </span>
                          <span className="h-9 w-9 flex items-center justify-center text-slate-200 cursor-not-allowed">
                            <Edit2 size={17} strokeWidth={2} />
                          </span>
                          <span className="h-9 w-9 flex items-center justify-center text-slate-200 cursor-not-allowed">
                            <UserPlus size={17} strokeWidth={2} />
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BranchTable;
