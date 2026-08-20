// crm-web/src/shared/components/charts/CrmLineChart.jsx
import React, { useRef, useId } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
} from 'recharts';
import { Download } from 'lucide-react';
import ChartEmptyState from './ChartEmptyState';

export default function CrmLineChart({
  data = [],
  xKey = 'name',
  lines = [], // Array of { dataKey, name, stroke, fill, strokeDasharray, strokeWidth, type, gradientId }
  chartType = 'area', // 'area' | 'line'
  height = '100%',
  formatXAxis,
  formatYAxis,
  customTooltip,
  showGrid = true,
  showLegend = true,
  showDownload = false,
  legendAlign = 'right',
  showBrush = false,
  emptyMessage = 'No trend analytics available.',
  className = '',
  margin = { top: 10, right: 10, left: -20, bottom: 0 },
}) {
  const chartContainerRef = useRef(null);
  const rawId = useId();
  const instanceId = rawId.replace(/:/g, '_');

  if (!Array.isArray(data) || data.length === 0 || data.every((d) => !d)) {
    return <ChartEmptyState message={emptyMessage} height={height} className={className} />;
  }

  const isArea = chartType === 'area';
  const ChartContainer = isArea ? AreaChart : LineChart;

  const handleDownloadSVG = () => {
    if (!chartContainerRef.current) return;
    const svgElement = chartContainerRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trend_chart_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const defaultTooltipFormatter = (value, name) => [
    typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value,
    name || 'Value',
  ];

  const currentGradId = `currentRevGrad_${instanceId}`;
  const prevGradId = `prevRevGrad_${instanceId}`;

  return (
    <div className={`w-full flex flex-col ${className}`} ref={chartContainerRef} style={{ height: typeof height === 'number' ? `${height}px` : height }}>
      {showDownload && (
        <div className="flex justify-end mb-2 shrink-0">
          <button
            onClick={handleDownloadSVG}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-all"
            title="Download Chart SVG"
          >
            <Download size={12} />
            <span>SVG</span>
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ChartContainer data={data} margin={margin}>
            {isArea && (
              <defs>
                <linearGradient id={currentGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F86F03" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F86F03" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id={prevGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                </linearGradient>
                {lines.map(
                  (l, idx) =>
                    l.gradientId && (
                      <linearGradient key={l.gradientId || idx} id={`${l.gradientId}_${instanceId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={l.stroke || '#F86F03'} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={l.stroke || '#F86F03'} stopOpacity={0.0} />
                      </linearGradient>
                    )
                )}
              </defs>
            )}

            {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />}

            <XAxis
              dataKey={xKey}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={formatXAxis}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={formatYAxis}
            />

            <Tooltip
              content={customTooltip}
              formatter={defaultTooltipFormatter}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
              }}
            />

            {showLegend && (
              <Legend
                verticalAlign="top"
                align={legendAlign}
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
            )}

            {isArea
              ? lines.map((l, idx) => {
                  const fillRef = l.gradientId
                    ? `url(#${l.gradientId}_${instanceId})`
                    : idx === 1
                    ? `url(#${prevGradId})`
                    : `url(#${currentGradId})`;

                  return (
                    <Area
                      key={l.dataKey || idx}
                      type={l.type || 'monotone'}
                      dataKey={l.dataKey}
                      name={l.name || l.dataKey}
                      stroke={l.stroke || '#F86F03'}
                      strokeWidth={l.strokeWidth || 3}
                      strokeDasharray={l.strokeDasharray}
                      fillOpacity={1}
                      fill={l.fill || fillRef}
                    />
                  );
                })
              : lines.map((l, idx) => (
                  <Line
                    key={l.dataKey || idx}
                    type={l.type || 'monotone'}
                    dataKey={l.dataKey}
                    name={l.name || l.dataKey}
                    stroke={l.stroke || '#4F46E5'}
                    strokeWidth={l.strokeWidth || 3}
                    strokeDasharray={l.strokeDasharray}
                    dot={l.dot || { r: 3 }}
                    activeDot={l.activeDot || { r: 6 }}
                  />
                ))}

            {showBrush && (
              <Brush
                dataKey={xKey}
                height={24}
                stroke="#64748b"
                fill="#f8fafc"
                startIndex={0}
                endIndex={data.length - 1}
              />
            )}
          </ChartContainer>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
