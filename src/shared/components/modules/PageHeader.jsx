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
    <div className={`flex flex-col bg-white p-4 border border-slate-200 md:flex-row md:items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={`p-2.5 rounded-lg shrink-0 ${iconClassName || 'bg-gradient-to-br from-primary/10 to-primary/5 text-primary '}`}>
            <Icon size={24} />
          </div>
        )}
        <div>
          <h1 className="text-lg font-medium text-slate-900 tracking-tight">{title}</h1>
          {description && (
            <p className="text-xs text-slate-500 font-medium mt-1">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-start md:justify-end w-full md:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
