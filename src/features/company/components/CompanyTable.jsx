import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Building2, Users, Layers, Calendar, GitBranch, ChevronRight, MoreVertical } from 'lucide-react';
import Skeleton from '../../../shared/components/elements/Skeleton';

/**
 * CompanyTable Component
 * Mobile-first responsive design with card layout for mobile and table for desktop
 * 
 * @param {Array} companies - Data to display
 * @param {boolean} isLoading - Loading state for skeletons
 * @param {function} onEdit - Edit action callback
 * @param {boolean} canEdit - RBAC permission check
 */
const CompanyTable = ({ companies = [], isLoading, onEdit, canEdit }) => {
  const navigate = useNavigate();
  
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
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-16 rounded-full" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
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
          <td className="py-4 px-6"><Skeleton className="h-5 w-40" /></td>
          <td className="py-4 px-6"><Skeleton className="h-5 w-20" /></td>
          <td className="py-4 px-6"><Skeleton className="h-6 w-16 rounded-full" /></td>
          <td className="py-4 px-6"><Skeleton className="h-5 w-12" /></td>
          <td className="py-4 px-6"><Skeleton className="h-5 w-12" /></td>
          <td className="py-4 px-6"><Skeleton className="h-5 w-32" /></td>
          <td className="py-4 px-6"><Skeleton className="h-8 w-8 rounded-lg" /></td>
        </tr>
      ))}
    </>
  );

  // Mobile Card Layout
  const renderMobileCards = () => {
    if (companies.length === 0) {
      return (
        <div className="bg-white rounded-xl p-8 border border-slate-200/60 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <Building2 size={32} />
            </div>
            <div>
              <p className="font-semibold text-slate-800">No companies found</p>
              <p className="text-sm text-slate-400 mt-1">There are no company records to display at this time.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {companies.map((company) => (
          <div key={company.id} className="bg-white rounded-xl border border-slate-200/60 overflow-hidden hover:shadow-md transition-all duration-200 group">
            {/* Card Header */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 flex-shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 font-heading text-base truncate">{company.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                        {company.code}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                        company.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        <span className={`w-1 h-1 rounded-full mr-1 ${
                          company.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`} />
                        {company.status}
                      </span>
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <button 
                    onClick={() => onEdit(company)}
                    className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200 flex-shrink-0"
                    title="Edit Company"
                  >
                    <Edit2 size={18} strokeWidth={2.5} />
                  </button>
                )}
              </div>

              {/* Card Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => navigate(`/companies/${company.id}/branches`)}
                  className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors group/branch py-2 px-3 -mx-3 rounded-lg hover:bg-primary/5"
                  title="View Branches"
                >
                  <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover/branch:bg-primary/10 group-hover/branch:text-primary transition-all">
                    <GitBranch size={16} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm tracking-tight group-hover/branch:text-primary transition-colors">{company._count?.branches || 0}</div>
                    <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Branches</div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover/branch:text-primary transition-colors" />
                </button>
                
                <div className="flex items-center gap-2 text-slate-600 py-2 px-3">
                  <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                    <Users size={16} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm tracking-tight">{company._count?.users || 0}</div>
                    <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Users</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-500 py-2 px-3">
                  <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                    <Calendar size={16} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[11px] tracking-tight">
                      {new Date(company.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })}
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
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider">Company Name</th>
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider">Code</th>
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider">Status</th>
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider">Branches</th>
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider">Users</th>
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider">Created At</th>
              <th className="py-4 px-6 text-[13px] font-bold text-slate-500 font-heading uppercase tracking-wider whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              renderDesktopSkeletons()
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                      <Building2 size={32} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">No companies found</p>
                      <p className="text-sm text-slate-400 mt-1">There are no company records to display at this time.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="hover:bg-slate-50/50 transition-all duration-200 group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <Building2 size={20} />
                      </div>
                      <span className="font-bold text-slate-900 font-heading">{company.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-tighter">
                      {company.code}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
                      company.status === 'ACTIVE' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        company.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`} />
                      {company.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => navigate(`/companies/${company.id}/branches`)}
                      className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors group/branch"
                      title="View Branches"
                    >
                      <div className="h-7 w-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover/branch:bg-primary/10 group-hover/branch:text-primary transition-all">
                        <GitBranch size={14} />
                      </div>
                      <span className="font-bold text-sm tracking-tight group-hover/branch:text-primary transition-colors">{company._count?.branches || 0}</span>
                    </button>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="h-7 w-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                        <Users size={14} />
                      </div>
                      <span className="font-bold text-sm tracking-tight">{company._count?.users || 0}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-slate-500 text-[13px] font-medium whitespace-nowrap">
                      <Calendar size={14} className="opacity-70" />
                      {new Date(company.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    {canEdit ? (
                      <button 
                        onClick={() => onEdit(company)}
                        className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200"
                        title="Edit Company"
                      >
                        <Edit2 size={18} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <span className="h-9 w-9 flex items-center justify-center text-slate-200 cursor-not-allowed">
                         <Edit2 size={18} strokeWidth={2} />
                      </span>
                    )}
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

export default CompanyTable;
