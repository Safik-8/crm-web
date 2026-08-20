// crm-web/src/shared/components/charts/ChartEmptyState.jsx
import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function ChartEmptyState({
  message = 'No visualization metrics available for period.',
  icon: Icon = BarChart3,
  height = '100%',
  className = '',
}) {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center gap-2.5 text-center p-6 bg-slate-50 border border-slate-100/80 rounded-xl ${className}`}
      style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
    >
      <div className="h-10 w-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 shadow-xs">
        <Icon size={18} />
      </div>
      <p className="text-xs font-semibold text-slate-500 max-w-xs">{message}</p>
    </div>
  );
}
