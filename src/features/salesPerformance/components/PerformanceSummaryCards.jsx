// crm-web/src/features/salesPerformance/components/PerformanceSummaryCards.jsx

import React from 'react';
import { IndianRupee, Trophy, TrendingUp, Target, Crown } from 'lucide-react';

export default function PerformanceSummaryCards({ bdeData = [], teamData = [], branchData = [], topBDEs = [] }) {
  // Compute executive summary aggregates
  const totalRevenue = bdeData.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
  const totalDealsWon = bdeData.reduce((acc, curr) => acc + (curr.dealsWon || 0), 0);
  const totalLeadsAssigned = bdeData.reduce((acc, curr) => acc + (curr.leadsAssigned || 0), 0);
  const totalQualified = bdeData.reduce((acc, curr) => acc + (curr.qualifiedLeads || 0), 0);

  const avgConversion = totalLeadsAssigned > 0 
    ? ((totalDealsWon / totalLeadsAssigned) * 100).toFixed(1) 
    : '0.0';

  const topPerformer = topBDEs[0] || bdeData[0] || null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Revenue Won */}
      <div className="bg-white rounded-none p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-orange-200 transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Total Revenue Won</span>
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl border border-orange-100 group-hover:bg-orange-500 group-hover:text-white transition-colors">
            <IndianRupee size={18} />
          </div>
        </div>

        <div className="mt-4">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-baseline gap-1">
            <span className="text-orange-500">₹</span>
            <span>{totalRevenue.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-emerald-600">
            <TrendingUp size={14} />
            <span>Closed Won Revenue</span>
            <span className="text-slate-400 font-normal">({bdeData.length} BDEs)</span>
          </div>
        </div>
      </div>

      {/* 2. Total Deals Closed Won */}
      <div className="bg-white rounded-none p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Deals Closed Won</span>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Trophy size={18} />
          </div>
        </div>

        <div className="mt-4">
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {totalDealsWon} <span className="text-sm font-bold text-slate-400">Deals</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500">
            <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              {totalQualified} Qualified Leads
            </span>
          </div>
        </div>
      </div>

      {/* 3. Average Conversion Efficiency */}
      <div className="bg-white rounded-none p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Conversion Efficiency</span>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Target size={18} />
          </div>
        </div>

        <div className="mt-4">
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {avgConversion}<span className="text-lg font-bold text-blue-600">%</span>
          </div>
          
          {/* Mini Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(Number(avgConversion) * 3, 100)}%` }} 
            />
          </div>
        </div>
      </div>

      {/* 4. Top Performer Spotlight */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-orange-500/10 rounded-none p-5 border border-amber-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
            <Crown size={15} className="text-amber-500" />
            Top Executive Spotlight
          </span>
          <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-xs">
            #1 Leader
          </span>
        </div>

        {topPerformer ? (
          <div className="mt-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-black text-base flex items-center justify-center shadow-xs flex-shrink-0">
                {topPerformer.name?.charAt(0) || 'E'}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 text-sm truncate leading-tight">{topPerformer.name}</h4>
                <p className="text-xs text-slate-500 font-medium truncate">{topPerformer.branchName || 'HQ Branch'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-amber-200/60 text-xs">
              <span className="font-bold text-slate-700">₹{(topPerformer.totalRevenue || 0).toLocaleString('en-IN')}</span>
              <span className="font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                {topPerformer.performanceScore} Pts
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 mt-4">No top performer recorded for period.</p>
        )}
      </div>
    </div>
  );
}
