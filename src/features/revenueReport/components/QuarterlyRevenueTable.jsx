// crm-web/src/features/revenueReport/components/QuarterlyRevenueTable.jsx

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(val) || 0);
};

export const QuarterlyRevenueTable = ({ data = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white  border border-slate-200/80 shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white  border border-slate-200/80 shadow-sm p-8 text-center text-slate-500">
        No quarterly financial breakdown available for the selected filters.
      </div>
    );
  }

  return (
    <div className="bg-white  border border-slate-200/80 shadow-sm overflow-hidden mb-6">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Quarterly Revenue Breakdown</h3>
          <p className="text-xs text-slate-500">Quarter-by-quarter financial trend and QoQ growth rate</p>
        </div>
        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
          {data.length} Quarters
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <th className="py-3 px-4">Quarter / Year</th>
              <th className="py-3 px-4 text-right">Total Revenue</th>
              <th className="py-3 px-4 text-center">Deals Closed</th>
              <th className="py-3 px-4 text-center">Customers Added</th>
              <th className="py-3 px-4 text-right">QoQ Growth %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => {
              const isPositive = row.growthPct >= 0;
              return (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    Q{row.quarter} {row.year}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(row.totalRevenue)}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-700">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 rounded-md font-medium">
                      {row.dealsClosed}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-700">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 rounded-md font-medium">
                      {row.customersAdded}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isPositive
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3 mr-1 text-orange-600" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1 text-rose-600" />
                      )}
                      {isPositive ? `+${row.growthPct}%` : `${row.growthPct}%`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
