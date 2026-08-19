// crm-web/src/features/revenueReport/components/BranchRevenueTable.jsx

import React from 'react';
import { GitBranch } from 'lucide-react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(val) || 0);
};

export const BranchRevenueTable = ({ data = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center text-slate-500">
        No branch revenue comparison data found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Cross-Branch Financial Comparison</h3>
          <p className="text-xs text-slate-500">Company branch revenue, closed deal volume, and customer acquisitions</p>
        </div>
        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
          {data.length} Branches
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <th className="py-3 px-4">Branch Name</th>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4 text-center">Deals Won</th>
              <th className="py-3 px-4 text-center">Customers</th>
              <th className="py-3 px-4 text-right">Total Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{row.branchName}</div>
                      <div className="text-xs text-slate-400">Code: {row.branchCode}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-700 font-medium">
                  {row.companyName}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-block px-2.5 py-0.5 bg-slate-100 rounded-md font-semibold text-slate-800">
                    {row.dealsWon}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-block px-2.5 py-0.5 bg-slate-100 rounded-md font-semibold text-slate-800">
                    {row.customerCount}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                  {formatCurrency(row.totalRevenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
