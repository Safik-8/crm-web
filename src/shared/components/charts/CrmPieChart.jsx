// crm-web/src/shared/components/charts/CrmPieChart.jsx
import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import ChartEmptyState from './ChartEmptyState';

const DEFAULT_PALETTE = [
  '#4F46E5',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#F97316',
  '#3B82F6',
  '#A855F7',
  '#0EA5E9',
];

export default function CrmPieChart({
  data = [],
  nameKey = 'name',
  valueKey = 'value',
  colors = DEFAULT_PALETTE,
  innerRadius = 42,
  outerRadius = 76,
  paddingAngle = 4,
  height = 200,
  showLegend = true,
  showPercentage = true,
  customTooltip,
  emptyMessage = 'No distribution data available.',
  className = '',
}) {
  if (!Array.isArray(data) || data.length === 0 || data.every((d) => !d || d[valueKey] === 0)) {
    return <ChartEmptyState message={emptyMessage} height={height} className={className} />;
  }

  const totalSum = data.reduce((acc, curr) => acc + (Number(curr[valueKey]) || 0), 0);

  const enrichedData = data.map((item, idx) => {
    const val = Number(item[valueKey]) || 0;
    const pct = totalSum > 0 ? Number(((val / totalSum) * 100).toFixed(1)) : 0;
    return {
      ...item,
      name: item[nameKey] || 'Other',
      value: val,
      pct,
      color: item.color || colors[idx % colors.length] || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
    };
  });

  const defaultTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-xs border border-slate-700">
          <p className="font-bold mb-0.5">{entry.name}</p>
          <p className="font-extrabold text-sky-400">
            {entry.value.toLocaleString('en-IN')}{' '}
            {showPercentage && <span className="text-slate-300 font-normal">({entry.payload.pct}%)</span>}
          </p>
        </div>
      );
    }
    return null;
  };

  const pieData = enrichedData.filter((item) => item.value > 0);
  const activePaddingAngle = pieData.length > 1 ? paddingAngle : 0;

  return (
    <div className={`w-full ${className}`}>
      <div style={{ height: typeof height === 'number' ? `${height}px` : height, minHeight: '200px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={activePaddingAngle}
              dataKey="value"
              strokeWidth={0}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={customTooltip || defaultTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {showLegend && (
        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar-thin">
          {enrichedData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-slate-800">{item.value.toLocaleString('en-IN')}</span>
                {showPercentage && (
                  <span className="text-[10px] font-semibold text-slate-400 w-9 text-right tabular-nums">
                    {item.pct}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
