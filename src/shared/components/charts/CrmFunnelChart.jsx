// crm-web/src/shared/components/charts/CrmFunnelChart.jsx
import React, { useRef } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Download } from 'lucide-react';
import ChartEmptyState from './ChartEmptyState';

const DEFAULT_FUNNEL_COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#10b981', '#06b6d4'];

export default function CrmFunnelChart({
  data = [],
  stageKey = 'stage',
  countKey = 'count',
  height = 260,
  barSize = 26,
  showConversionBadge = true,
  showDownload = false,
  onStageClick,
  customTooltip,
  emptyMessage = 'No pipeline funnel data available.',
  className = '',
}) {
  const chartContainerRef = useRef(null);

  if (!Array.isArray(data) || data.length === 0 || data.every((d) => !d || d[countKey] === 0)) {
    return <ChartEmptyState message={emptyMessage} height={height} className={className} />;
  }

  const firstStageCount = Number(data[0]?.[countKey]) || 0;
  const lastStageCount = Number(data[data.length - 1]?.[countKey]) || 0;
  const overallConversionPct =
    firstStageCount > 0 ? ((lastStageCount / firstStageCount) * 100).toFixed(1) : '0';

  const enrichedData = data.map((item, index, arr) => {
    const currentCount = Number(item[countKey]) || 0;
    const prevCount = index > 0 ? Number(arr[index - 1][countKey]) || 0 : currentCount;
    const dropCount = prevCount > currentCount ? prevCount - currentCount : 0;
    const dropPct = prevCount > 0 ? ((dropCount / prevCount) * 100).toFixed(1) : '0';

    return {
      ...item,
      stage: item[stageKey] || 'Stage',
      count: currentCount,
      dropCount,
      dropPct,
      color: item.color || DEFAULT_FUNNEL_COLORS[index % DEFAULT_FUNNEL_COLORS.length],
    };
  });

  const handleDownloadSVG = () => {
    if (!chartContainerRef.current) return;
    const svgElement = chartContainerRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `funnel_chart_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const defaultTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white text-slate-900 p-3 rounded-xl shadow-md text-xs border border-slate-200">
          <p className="font-bold text-slate-800 mb-1">{d.stage}</p>
          <p className="font-extrabold text-indigo-600 text-sm">{d.count.toLocaleString('en-IN')} count</p>
          {d.dropPct > 0 && (
            <p className="text-[10px] text-rose-500 font-semibold mt-1">
              ↓ {d.dropCount} drop ({d.dropPct}% loss from previous stage)
            </p>
          )}
          {onStageClick && (
            <p className="text-[9px] text-indigo-500 font-bold mt-1.5 pt-1 border-t border-slate-100">
              Click stage bar to inspect records →
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full ${className}`} ref={chartContainerRef}>
      <div className="flex items-center justify-between mb-2">
        {showDownload ? (
          <button
            onClick={handleDownloadSVG}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-all"
            title="Download Chart SVG"
          >
            <Download size={12} />
            <span>SVG</span>
          </button>
        ) : <div />}

        {showConversionBadge && (
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            {overallConversionPct}% Total Conv
          </span>
        )}
      </div>

      <div style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={enrichedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              type="category"
              dataKey="stage"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
              width={110}
            />
            <Tooltip content={customTooltip || defaultTooltip} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={barSize}>
              {enrichedData.map((entry, index) => (
                <Cell
                  key={`funnel-cell-${index}`}
                  fill={entry.color}
                  className={onStageClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                  onClick={() => onStageClick && onStageClick(entry)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
