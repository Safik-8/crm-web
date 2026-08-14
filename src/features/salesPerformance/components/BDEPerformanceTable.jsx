// crm-web/src/features/salesPerformance/components/BDEPerformanceTable.jsx

import React from 'react';
import { UserCheck, Crown, Trophy, Award } from 'lucide-react';

export default function BDEPerformanceTable({ data = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-none border border-slate-200/80 shadow-xs p-12 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-orange-500 mb-3" />
        <p className="text-sm font-semibold text-slate-700">Calculating BDE performance metrics...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-none border border-slate-200/80 shadow-xs p-12 text-center text-slate-500">
        <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-base font-bold text-slate-800">No BDE Performance Data</p>
        <p className="text-xs text-slate-400 mt-1">Adjust filters or date range to view executive metrics.</p>
      </div>
    );
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return { bg: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs border border-amber-400/30', icon: <Crown size={12} /> };
    if (rank === 2) return { bg: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-xs border border-slate-300/30', icon: <Trophy size={12} /> };
    if (rank === 3) return { bg: 'bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-xs border border-amber-700/30', icon: <Award size={12} /> };
    return { bg: 'bg-slate-100 text-slate-600 font-bold', icon: null };
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'from-emerald-500 to-teal-600 text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 40) return 'from-amber-500 to-orange-500 text-amber-700 bg-amber-50 border-amber-200';
    return 'from-slate-400 to-slate-500 text-slate-700 bg-slate-100 border-slate-200';
  };

  return (
    <div className="bg-white rounded-none border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
            <UserCheck size={18} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-slate-900 text-base">
              Business Development Executive (BDE) Performance
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual lead management, opportunity pipeline, revenue generation, and conversion efficiency.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          {data.length} Executives
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-extrabold text-slate-500">
              <th className="py-3.5 px-4 text-center">Rank</th>
              <th className="py-3.5 px-4">Executive</th>
              <th className="py-3.5 px-4">Branch</th>
              <th className="py-3.5 px-4 text-center">Assigned</th>
              <th className="py-3.5 px-4 text-center">Qualified</th>
              <th className="py-3.5 px-4 text-center">Opportunities</th>
              <th className="py-3.5 px-4 text-center">Deals Won</th>
              <th className="py-3.5 px-4 text-right">Revenue Won</th>
              <th className="py-3.5 px-4 text-center">Conversion %</th>
              <th className="py-3.5 px-4 text-center">Performance Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {data.map((row) => {
              const badge = getRankBadge(row.rank);
              const scoreStyle = getScoreColor(row.performanceScore);

              return (
                <tr key={row.employeeId} className="hover:bg-slate-50/80 transition-colors group">
                  {/* Rank */}
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${badge.bg}`}>
                      {badge.icon}
                      <span>#{row.rank}</span>
                    </span>
                  </td>

                  {/* Executive Name & Code */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {row.name?.charAt(0) || 'E'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight group-hover:text-orange-600 transition-colors">{row.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{row.employeeCode}</p>
                      </div>
                    </div>
                  </td>

                  {/* Branch */}
                  <td className="py-3.5 px-4 text-slate-600 font-medium text-xs">
                    {row.branchName}
                  </td>

                  {/* Assigned Leads */}
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {row.leadsAssigned}
                  </td>

                  {/* Qualified Leads */}
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                    {row.qualifiedLeads}
                  </td>

                  {/* Opportunities */}
                  <td className="py-3.5 px-4 text-center font-bold text-indigo-600">
                    {row.opportunitiesCreated}
                  </td>

                  {/* Deals Won */}
                  <td className="py-3.5 px-4 text-center font-extrabold text-emerald-700">
                    {row.dealsWon}
                  </td>

                  {/* Total Revenue */}
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 text-base">
                    ₹{row.totalRevenue.toLocaleString('en-IN')}
                  </td>

                  {/* Conversion % */}
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                      row.conversionRate >= 20 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      row.conversionRate >= 10 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {row.conversionRate}%
                    </span>
                  </td>

                  {/* Performance Score Progress Bar */}
                  <td className="py-3.5 px-4 text-center min-w-[130px]">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-black text-slate-900 mb-1">
                        {row.performanceScore} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                      </span>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${scoreStyle.split(' ')[0]} ${scoreStyle.split(' ')[1]}`}
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
