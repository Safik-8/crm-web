import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Premium Slide-over Drawer Component
 */
const Drawer = ({ isOpen, onClose, title, subtitle, children }) => {
  const [mounted, setMounted] = useState(false);
  const [animateOpen, setAnimateOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
      // Allow a brief frame delay so the browser registers the initial translate-x-full state before animating in
      const timer = setTimeout(() => {
        setAnimateOpen(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setAnimateOpen(false);
      const timer = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out",
          animateOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-2 sm:pl-6 lg:pl-10">
        <div 
          className={cn(
            "w-screen max-w-full sm:max-w-md lg:max-w-lg transform bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col h-full",
            animateOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-5 sm:py-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading tracking-tight leading-tight">
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-2 text-sm sm:text-base text-slate-500 font-medium leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 flex-shrink-0 active:scale-95"
                title="Close"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-hide">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Drawer;
