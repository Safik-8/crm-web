import React from 'react';
import { Edit2, GitBranch, Users, Hash, UserPlus } from 'lucide-react';
import Skeleton from '../../../shared/components/elements/Skeleton';

/**
 * BranchTable Component
 * Displays branches with premium industry styling, matching Company module aesthetic.
 *
 * @param {Array} branches - Branch data array
 * @param {boolean} isLoading - Loading state for skeletons
 * @param {function} onEdit - Edit action callback
 * @param {function} onAssignUser - Assign user action callback
 * @param {boolean} canEdit - RBAC permission check
 */
const BranchTable = ({ branches = [], isLoading, onEdit, onAssignUser, canEdit }) => {

  const renderSkeletons = () => (
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
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
              renderSkeletons()
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
