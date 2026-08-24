// crm-web/src/features/revenueReport/components/ProductRevenueTable.jsx

import React from 'react';
import { BookOpen } from 'lucide-react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(val) || 0);
};

export const ProductRevenueTable = ({ data = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white  border border-slate-200/80 shadow-sm p-6 animate-pulse">
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
      <div className="bg-white  border border-slate-200/80 shadow-sm p-8 text-center text-slate-500">
        No product/course revenue performance data found.
      </div>
    );
  }

  return (
    <div className="bg-white  border border-slate-200/80 shadow-sm overflow-hidden mb-6">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Revenue by Product / Course</h3>
          <p className="text-xs text-slate-500">Earnings breakdown, sales volume, ASP, and contribution percentage</p>
        </div>
        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold whitespace-nowrap">
          {data.length} Products
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <th className="py-3 px-4">Product / Course Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-center">Sales Count</th>
              <th className="py-3 px-4 text-right">Avg Selling Price (ASP)</th>
              <th className="py-3 px-4 text-right">Total Revenue</th>
              <th className="py-3 px-4 text-right">Contribution %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{row.productName}</div>
                      <div className="text-xs text-slate-400">Code: {row.productCode}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-600 font-medium">
                  <span className="px-2.5 py-1 bg-slate-100 rounded-full text-xs text-slate-700">
                    {row.category}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-block px-2.5 py-0.5 bg-slate-100 rounded-md font-semibold text-slate-800">
                    {row.salesCount}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right text-slate-700 font-medium">
                  {formatCurrency(row.averageSellingPrice)}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                  {formatCurrency(row.totalRevenue)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${Math.min(row.contributionPct, 100)}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {row.contributionPct}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
