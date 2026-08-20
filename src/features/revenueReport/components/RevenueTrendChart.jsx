// crm-web/src/features/revenueReport/components/RevenueTrendChart.jsx

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { BarChart3, LineChart as LineIcon } from 'lucide-react';

const formatCurrencyShort = (val) => {
  const num = Number(val) || 0;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(0)}k`;
  return `₹${num}`;
};

export const RevenueTrendChart = ({ trendData = {}, isLoading = false }) => {
  const [chartType, setChartType] = useState('area'); // 'area' | 'bar'
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'quarterly'

  if (isLoading) {
    return (
      <div className="bg-white p-6 border border-slate-200/80 shadow-sm mb-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-slate-100 rounded"></div>
      </div>
    );
  }

  const { monthlyTrend = [], quarterlyTrend = [], year = new Date().getFullYear() } = trendData;
  const data = viewMode === 'monthly' ? monthlyTrend : quarterlyTrend;
  const xKey = viewMode === 'monthly' ? 'monthName' : 'quarter';

  return (
    <div className="bg-white p-6 border border-slate-200/80 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Revenue Trend Analysis</h2>
          <p className="text-xs text-slate-500">
            {viewMode === 'monthly'
              ? `Month-by-month financial performance & YoY comparison for ${year}`
              : `Quarterly revenue breakdown for ${year}`}
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode('quarterly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'quarterly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quarterly
            </button>
          </div>

          {/* Chart Type Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-lg transition-colors ${
                chartType === 'area' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Area Chart"
            >
              <LineIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg transition-colors ${
                chartType === 'bar' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Bar Chart"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="currentRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F86F03" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F86F03" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="prevRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCurrencyShort}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                itemStyle={{ color: '#38bdf8' }}
              />
              <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
              <Area
                type="monotone"
                dataKey="revenue"
                name={`${year} Revenue`}
                stroke="#F86F03"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#currentRevGrad)"
              />
              {viewMode === 'monthly' && (
                <Area
                  type="monotone"
                  dataKey="previousYearRevenue"
                  name={`${year - 1} YoY Revenue`}
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#prevRevGrad)"
                />
              )}
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCurrencyShort}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
              />
              <Legend verticalAlign="top" align="right" height={36} iconType="square" />
              <Bar dataKey="revenue" name={`${year} Revenue`} fill="#DE5D02" radius={[6, 6, 0, 0]} />
              {viewMode === 'monthly' && (
                <Bar dataKey="previousYearRevenue" name={`${year - 1} YoY Revenue`} fill="#cbd5e1" radius={[6, 6, 0, 0]} />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
