// crm-web/src/features/salesPerformance/components/BranchPerformanceTable.jsx

import React from 'react';
import { Building2, Crown, Trophy, Award, MapPin } from 'lucide-react';
import Skeleton from '../../../shared/components/elements/Skeleton';

export default function BranchPerformanceTable({ data = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-none border border-slate-200/80 shadow-xs p-6 space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Skeleton variant="rounded" width={36} height={36} className="rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton variant="text" width={220} height={20} />
              <Skeleton variant="text" width={320} height={14} />
            </div>
          </div>
          <Skeleton variant="rounded" width={100} height={28} className="rounded-full" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 px-4 border border-slate-100 rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton variant="rounded" width={24} height={24} className="rounded-md" />
                <Skeleton variant="text" width={160} height={18} />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton variant="rounded" width={80} height={24} className="rounded-md" />
                <Skeleton variant="rounded" width={100} height={24} className="rounded-md" />
                <Skeleton variant="rounded" width={60} height={24} className="rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-none border border-slate-200/80 shadow-xs p-12 text-center text-slate-500">
        <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-base font-bold text-slate-800">No Branch Performance Data</p>
        <p className="text-xs text-slate-400 mt-1">Adjust filters or date range to view records.</p>
      </div>
    );
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return { bg: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs border border-amber-400/30', icon: <Crown size={12} /> };
    if (rank === 2) return { bg: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-xs border border-slate-300/30', icon: <Trophy size={12} /> };
    if (rank === 3) return { bg: 'bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-xs border border-amber-700/30', icon: <Award size={12} /> };
    return { bg: 'bg-slate-100 text-slate-600 font-bold', icon: null };
  };

  return (
    <div className="bg-white rounded-none border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Building2 size={18} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-slate-900 text-base">
              Branch Performance & Revenue Aggregations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cross-branch comparisons of leads generated, qualification output, closed deals, and total revenue.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          {data.length} Branches
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-extrabold text-slate-500">
              <th className="py-3.5 px-4 text-center">Rank</th>
              <th className="py-3.5 px-4">Branch Name</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4 text-center">Total Leads</th>
              <th className="py-3.5 px-4 text-center">Qualified Leads</th>
              <th className="py-3.5 px-4 text-center">Opportunities</th>
              <th className="py-3.5 px-4 text-center">Deals Won</th>
              <th className="py-3.5 px-4 text-center">New Customers</th>
              <th className="py-3.5 px-4 text-right">Total Revenue</th>
              <th className="py-3.5 px-4 text-center">Conversion %</th>
              <th className="py-3.5 px-4 text-center">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {data.map((row) => {
              const badge = getRankBadge(row.rank);

              return (
                <tr key={row.branchId} className="hover:bg-slate-50/80 transition-colors group">
                  {/* Rank */}
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${badge.bg}`}>
                      {badge.icon}
                      <span>#{row.rank}</span>
                    </span>
                  </td>

                  {/* Branch Name & Code */}
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{row.branchName}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{row.branchCode}</p>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-4 text-slate-600 font-medium text-xs">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" />
                      <span>{row.location}</span>
                    </span>
                  </td>

                  {/* Total Leads */}
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {row.totalLeads}
                  </td>

                  {/* Qualified Leads */}
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                    {row.qualifiedLeads}
                  </td>

                  {/* Opportunities */}
                  <td className="py-3.5 px-4 text-center font-bold text-indigo-600">
                    {row.opportunitiesCount}
                  </td>

                  {/* Deals Won */}
                  <td className="py-3.5 px-4 text-center font-extrabold text-emerald-700">
                    {row.dealsWon}
                  </td>

                  {/* New Customers */}
                  <td className="py-3.5 px-4 text-center font-bold text-blue-600">
                    {row.newCustomers}
                  </td>

                  {/* Total Revenue */}
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 text-base">
                    ₹{row.totalRevenue.toLocaleString('en-IN')}
                  </td>

                  {/* Conversion % */}
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                      row.conversionRate >= 15 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {row.conversionRate}%
                    </span>
                  </td>

                  {/* Performance Score */}
                  <td className="py-3.5 px-4 text-center min-w-[120px]">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-black text-slate-900 mb-1">
                        {row.performanceScore} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                      </span>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600"
                          style={{ width: `${Math.min(row.performanceScore, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
