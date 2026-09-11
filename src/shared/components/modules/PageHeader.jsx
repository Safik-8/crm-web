import React from 'react';

const PageHeader = ({
  icon: Icon,
  iconClassName,
  title,
  description,
  actions,
  className = ''
}) => {
  return (
    <div className={`flex flex-col bg-white p-4 border border-slate-200 shadow-sm sm:flex-row sm:items-center justify-between gap-3.5 ${className}`}>
      <div className="flex items-center gap-3.5 min-w-0">
        {Icon && (
          <div className={`p-2.5 shrink-0 ${iconClassName || 'bg-orange-50 text-orange-600'}`}>
            <Icon size={22} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
          {description && (
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0 justify-end">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
