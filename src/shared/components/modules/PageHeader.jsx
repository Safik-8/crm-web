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
    <div className={`flex flex-col bg-white p-3.5 sm:p-4.5 border border-slate-200 shadow-sm xl:flex-row xl:items-center justify-between gap-3.5 sm:gap-4 ${className}`}>
      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
        {Icon && (
          <div className={`p-2.5 shrink-0 rounded-lg ${iconClassName || 'bg-orange-50 text-orange-600'}`}>
            <Icon size={22} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">{title}</h1>
          {description && (
            <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full xl:w-auto justify-start xl:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
