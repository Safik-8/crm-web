// crm-web/src/shared/components/charts/CrmBarChart.jsx
import React, { useRef } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { Download } from 'lucide-react';
import ChartEmptyState from './ChartEmptyState';

export default function CrmBarChart({
  data = [],
  xKey = 'name',
  bars = [],
  layout = 'horizontal', // 'horizontal' | 'vertical'
  height = '100%',
  barSize,
  maxBarSize,
  yAxisWidth = 110,
  formatXAxis,
  formatYAxis,
  customTooltip,
  customYTick,
  customValueLabel,
  showGrid = true,
  showLegend = false,
  showDownload = false,
  onBarClick,
  legendAlign = 'right',
  emptyMessage = 'No chart metrics available.',
  className = '',
  cellColors = null,
  margin = { top: 10, right: 20, left: 10, bottom: 5 },
}) {
  const chartContainerRef = useRef(null);

  if (!Array.isArray(data) || data.length === 0 || data.every((d) => !d)) {
    return <ChartEmptyState message={emptyMessage} height={height} className={className} />;
  }

  const isVertical = layout === 'vertical';

  const handleDownloadSVG = () => {
    if (!chartContainerRef.current) return;
    const svgElement = chartContainerRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bar_chart_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const defaultTooltipFormatter = (value, name) => [
    typeof value === 'number' ? value.toLocaleString('en-IN') : value,
    name || 'Value',
  ];

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
          <BarChart
            data={data}
            layout={layout}
            margin={margin}
            barCategoryGap={isVertical ? '32%' : undefined}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={isVertical}
                horizontal={!isVertical}
                stroke="#f1f5f9"
              />
            )}

            {isVertical ? (
              <>
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={formatXAxis}
                />
                <YAxis
                  type="category"
                  dataKey={xKey}
                  tickLine={false}
                  axisLine={false}
                  tick={customYTick || { fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  width={yAxisWidth}
                  tickFormatter={formatYAxis}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey={xKey}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  tickFormatter={formatXAxis}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={formatYAxis}
                />
              </>
            )}

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
                iconType="square"
                wrapperStyle={{ fontSize: '12px' }}
              />
            )}

            {bars.map((b, bIdx) => (
              <Bar
                key={b.dataKey || bIdx}
                dataKey={b.dataKey}
                name={b.name || b.dataKey}
                fill={b.fill || '#3b82f6'}
                radius={b.radius || (isVertical ? [0, 6, 6, 0] : [6, 6, 0, 0])}
                barSize={barSize || b.barSize}
                maxBarSize={maxBarSize || b.maxBarSize}
                label={customValueLabel || b.label}
              >
                {(cellColors || data.some((d) => d.color)) &&
                  data.map((entry, index) => {
                    const fillColor =
                      (cellColors && cellColors[index % cellColors.length]) ||
                      entry.color ||
                      b.fill ||
                      '#3b82f6';
                    const opacity = entry.count === 0 ? 0.2 : 1;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={fillColor}
                        fillOpacity={opacity}
                        className={onBarClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                        onClick={() => onBarClick && onBarClick(entry, index)}
                      />
                    );
                  })}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
