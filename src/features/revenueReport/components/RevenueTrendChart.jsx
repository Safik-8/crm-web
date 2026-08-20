// crm-web/src/features/revenueReport/components/RevenueTrendChart.jsx

import React, { useState } from 'react';
import { BarChart3, LineChart as LineIcon } from 'lucide-react';
import { CrmLineChart, CrmBarChart } from '../../../shared/components/charts';
import { formatCurrencyShort } from '../../../shared/utils/chartDataTransformers';

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

  const areaLines = [
    {
      dataKey: 'revenue',
      name: `${year} Revenue`,
      stroke: '#F86F03',
      strokeWidth: 3,
      gradientId: 'currentRevGrad',
    },
    ...(viewMode === 'monthly'
      ? [
          {
            dataKey: 'previousYearRevenue',
            name: `${year - 1} YoY Revenue`,
            stroke: '#94a3b8',
            strokeWidth: 2,
            strokeDasharray: '4 4',
            gradientId: 'prevRevGrad',
          },
        ]
      : []),
  ];

  const barSeries = [
    {
      dataKey: 'revenue',
      name: `${year} Revenue`,
      fill: '#F86F03',
      radius: [6, 6, 0, 0],
    },
    ...(viewMode === 'monthly'
      ? [
          {
            dataKey: 'previousYearRevenue',
            name: `${year - 1} YoY Revenue`,
            fill: '#cbd5e1',
            radius: [6, 6, 0, 0],
          },
        ]
      : []),
  ];

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-md text-xs border border-slate-700 space-y-1">
          <p className="font-semibold text-slate-300">{payload[0].payload[xKey]}</p>
          {payload.map((item, idx) => (
            <p key={idx} style={{ color: item.color || item.fill }}>
              {item.name}: <span className="font-extrabold">₹{Number(item.value).toLocaleString('en-IN')}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
        {chartType === 'area' ? (
          <CrmLineChart
            data={data}
            xKey={xKey}
            lines={areaLines}
            chartType="area"
            height="100%"
            formatYAxis={formatCurrencyShort}
            customTooltip={customTooltip}
            showLegend={true}
            emptyMessage="No revenue trend records found for selected period."
          />
        ) : (
          <CrmBarChart
            data={data}
            xKey={xKey}
            bars={barSeries}
            layout="horizontal"
            height="100%"
            formatYAxis={formatCurrencyShort}
            customTooltip={customTooltip}
            showLegend={true}
            emptyMessage="No revenue trend records found for selected period."
          />
        )}
      </div>
    </div>
  );
};
