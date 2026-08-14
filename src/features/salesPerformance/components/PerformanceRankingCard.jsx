// crm-web/src/features/salesPerformance/components/PerformanceRankingCard.jsx

import React from 'react';
import { Trophy, Award, Crown, IndianRupee, Sparkles } from 'lucide-react';

export default function PerformanceRankingCard({ title, subtitle, items = [], type = 'bde' }) {
  const getBadgeStyle = (index) => {
    if (index === 0) return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs border border-amber-400/30'; // Gold
    if (index === 1) return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-xs border border-slate-300/30'; // Silver
    if (index === 2) return 'bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-xs border border-amber-700/30'; // Bronze
    return 'bg-slate-100 text-slate-600 font-bold';
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown size={14} />;
    if (index === 1) return <Trophy size={13} />;
    if (index === 2) return <Award size={13} />;
    return <span className="text-xs font-bold">{index + 1}</span>;
  };

  return (
    <div className="bg-white rounded-none border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>{title}</span>
            </h3>
            {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
          </div>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80 flex items-center gap-1">
            <Sparkles size={12} />
            <span>Leaderboard</span>
          </span>
        </div>

        {items.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            No performance rankings recorded for this period.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.employeeId || item.teamId || idx}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/80 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${getBadgeStyle(idx)}`}>
                    {getRankIcon(idx)}
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                    {(item.name || item.teamName)?.charAt(0) || 'P'}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate group-hover:text-orange-600 transition-colors">
                      {item.name || item.teamName}
                    </p>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {item.branchName || item.bdeName || 'HQ Branch'}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-black text-slate-900 text-sm flex items-center justify-end">
                    <IndianRupee size={12} className="text-slate-400 mr-0.5" />
                    {(item.totalRevenue || 0).toLocaleString('en-IN')}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className="text-[11px] text-slate-500 font-bold">
                      {item.conversionRate}% conv
                    </span>
                    <span className="text-[10px] font-black text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-200">
                      {item.performanceScore} pts
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
