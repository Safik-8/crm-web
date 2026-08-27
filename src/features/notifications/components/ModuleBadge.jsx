import { memo } from 'react';

const MODULE_STYLES = {
  LEAD:        'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  FOLLOWUP:    'bg-violet-50 text-violet-700 border-violet-200/80',
  OPPORTUNITY: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  KPI:         'bg-purple-50 text-purple-700 border-purple-200/80',
  REVENUE:     'bg-teal-50 text-teal-700 border-teal-200/80',
  SYSTEM:      'bg-zinc-100 text-zinc-700 border-zinc-200/80',
};

const ModuleBadge = memo(({ moduleName = 'SYSTEM' }) => {
  const m = moduleName.toUpperCase();
  const style = MODULE_STYLES[m] || MODULE_STYLES.SYSTEM;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${style}`}
    >
      {m}
    </span>
  );
});

ModuleBadge.displayName = 'ModuleBadge';

export default ModuleBadge;
