import React from 'react';
import { Edit2, GitBranch, Users, Hash, UserPlus, ChevronRight, Calendar } from 'lucide-react';
import Skeleton from '../../../shared/components/elements/Skeleton';

/**
 * BranchTable Component
 * Mobile-first responsive design with card layout for mobile and table for desktop.
 * Displays branches with premium industry styling, matching Company module aesthetic.
 *
 * @param {Array} branches - Branch data array
 * @param {boolean} isLoading - Loading state for skeletons
 * @param {function} onEdit - Edit action callback
 * @param {function} onAssignUser - Assign user action callback
 * @param {boolean} canEdit - RBAC permission check
 */
const BranchTable = ({ branches = [], isLoading, onEdit, onAssignUser, canEdit }) => {

  // Render loading skeletons for mobile cards
  const renderMobileSkeletons = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-4 border border-slate-200/60">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-12" />
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
          <td className="py-4 px-6"><Skeleton className="h-6 w-16 rounded-full" /></td>
          <td className="py-4 px-6"><Skeleton className="h-5 w-12" /></td>
          <td className="py-4 px-6"><Skeleton className="h-8 w-20 rounded-lg" /></td>
        </tr>
      ))}
    </>
  );

  // Mobile Card Layout
  const renderMobileCards = () => {
    if (branches.length === 0) {
      return (
        <div className="bg-white rounded-xl p-8 border border-slate-200/60 text-center">
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
          <div key={branch.id} className="bg-white rounded-xl border border-slate-200/60 overflow-hidden hover:shadow-md transition-all duration-200 group">
            {/* Card Header */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 flex-shrink-0">
                    <GitBranch size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 font-heading text-base truncate">{branch.name}</h3>
                    {branch.company && (
                      <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">{branch.company.name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
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
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {canEdit && (
                    <>
                      <button
                        onClick={() => onEdit(branch)}
                        className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200"
                        title="Edit Branch"
                      >
                        <Edit2 size={18} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => onAssignUser(branch)}
                        className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200"
                        title="Create & Assign User"
                      >
                        <UserPlus size={18} strokeWidth={2.5} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Card Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-600 py-2 px-3 -mx-3 rounded-lg">
                  <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                    <Users size={16} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm tracking-tight">{branch._count?.users || 0}</div>
                    <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Users</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-slate-500 py-2 px-3">
                  <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                    <Calendar size={16} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[11px] tracking-tight">
                      {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Created</div>
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
      <div className="block lg:hidden p-4">
        {isLoading ? renderMobileSkeletons() : renderMobileCards()}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200/60">
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider">Name</th>
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider">Unique Code</th>
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider">Operational Status</th>
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider">Enrolled Users</th>
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              renderDesktopSkeletons()
            ) : branches.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-16 text-center text-slate-500">
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
                    <div className="flex items-center gap-1">
                      {canEdit ? (
                        <>
                          <button
                            onClick={() => onEdit(branch)}
                            className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200"
                            title="Edit Branch"
                          >
                            <Edit2 size={18} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => onAssignUser(branch)}
                            className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200"
                            title="Create & Assign User"
                          >
                            <UserPlus size={18} strokeWidth={2.5} />
                          </button>
                        </>
                      ) : (
                        <span className="h-9 w-9 flex items-center justify-center text-slate-200 cursor-not-allowed">
                          <Edit2 size={18} strokeWidth={2} />
                        </span>
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
