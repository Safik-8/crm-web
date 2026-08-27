import { memo } from 'react';

const PRIORITY_STYLES = {
  URGENT: 'bg-rose-50 text-rose-700 border-rose-200/80',
  HIGH:   'bg-amber-50 text-amber-700 border-amber-200/80',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200/80',
  LOW:    'bg-slate-100 text-slate-600 border-slate-200/80',
};

const PriorityBadge = memo(({ priority = 'MEDIUM' }) => {
  const p = priority.toUpperCase();
  const style = PRIORITY_STYLES[p] || PRIORITY_STYLES.MEDIUM;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style}`}
    >
      {p}
    </span>
  );
});

PriorityBadge.displayName = 'PriorityBadge';

export default PriorityBadge;
