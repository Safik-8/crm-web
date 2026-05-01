import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Building2, Users, Calendar, GitBranch, ChevronRight } from 'lucide-react';
import Skeleton from '../../../shared/components/elements/Skeleton';

/**
 * CompanyTable Component
 * Mobile-first responsive design with card layout for mobile and table for desktop
 */
const CompanyTable = ({ companies = [], isLoading, onEdit, canEdit }) => {
  const navigate = useNavigate();
  
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
            <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
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
        <div className="bg-white rounded-2xl p-8 border border-slate-200/60 text-center">
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
      <div className="space-y-2.5">
        {companies.map((company) => (
          <div 
            key={company.id} 
            className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
          >
            <div className="p-4">
              {/* Top row: icon + name/badges + edit */}
              <div className="flex items-start gap-3 mb-3">
                {/* Icon — smaller, softer */}
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <Building2 size={18} />
                </div>

                {/* Name + badges */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 font-heading text-[15px] leading-tight mb-1.5 line-clamp-2">
                    {company.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wider">
                      {company.code}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                      company.status === 'ACTIVE' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      <span className={`w-1 h-1 rounded-full mr-1 ${
                        company.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`} />
                      {company.status}
                    </span>
                  </div>
                </div>

                {/* Edit */}
                {canEdit && (
                  <button 
                    onClick={() => onEdit(company)}
                    className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all shrink-0"
                    title="Edit Company"
                  >
                    <Edit2 size={15} strokeWidth={2.5} />
                  </button>
                )}
              </div>

              {/* Stats row — horizontal, compact */}
              <div className="flex items-center gap-1.5 sm:gap-2 pt-3 border-t border-slate-100">
                {/* Branches */}
                <button
                  onClick={() => navigate(`/companies/${company.id}/branches`)}
                  className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 px-2 sm:px-3 py-2 bg-slate-50 hover:bg-primary/5 rounded-xl transition-all group/branch border border-transparent hover:border-primary/20"
                  title="View Branches"
                >
                  <div className="h-6 w-6 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover/branch:text-primary transition-colors shadow-sm shrink-0">
                    <GitBranch size={13} />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="font-black text-sm text-slate-900 group-hover/branch:text-primary transition-colors leading-none">
                      {company._count?.branches || 0}
                    </div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">Branches</div>
                  </div>
                  <ChevronRight size={12} className="text-slate-300 group-hover/branch:text-primary transition-colors ml-auto shrink-0" />
                </button>

                {/* Users */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 px-2 sm:px-3 py-2 bg-slate-50 rounded-xl border border-transparent">
                  <div className="h-6 w-6 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm shrink-0">
                    <Users size={13} />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="font-black text-sm text-slate-900 leading-none">
                      {company._count?.users || 0}
                    </div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">Users</div>
                  </div>
                </div>

                {/* Created date */}
                <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-2 shrink-0">
                  <Calendar size={12} className="text-slate-400 shrink-0" />
                  <div>
                    <div className="text-[11px] font-bold text-slate-700 leading-none whitespace-nowrap">
                      {new Date(company.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">Created</div>
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
