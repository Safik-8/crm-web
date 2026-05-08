import React, { useEffect, useRef } from 'react';
import DailyReportForm from '../components/DailyReportForm';
import { ClipboardCheck, Sparkles } from 'lucide-react';
import { useLoader } from '../../../shared/context/LoaderContext';

const DailyReportPage = () => {
  const { forceHideLoader } = useLoader();
  const didHideInitialRouteLoaderRef = useRef(false);

  useEffect(() => {
    if (!didHideInitialRouteLoaderRef.current) {
      forceHideLoader();
      didHideInitialRouteLoaderRef.current = true;
    }
  }, [forceHideLoader]);

  return (
    <div className="container mx-auto px-3 sm:px-6 py-5 sm:py-8 pb-20 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-10 gap-3 sm:gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm tracking-widest uppercase mb-1 drop-shadow-sm">
            <Sparkles size={13} className="animate-pulse" />
            Performance Tracking
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-heading">
            Daily <span className="text-primary italic">ISE</span> Report
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl text-sm sm:text-lg">
            Record your daily activities, conversions, and revenue impact to keep the team aligned with goals.
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-2xl border border-primary/10">
          <div className="h-2 w-2 bg-primary rounded-full animate-ping" />
          <span className="text-xs font-bold text-primary uppercase tracking-tighter">Live Session Tracking Active</span>
        </div>
      </div>

      {/* Form Section */}
      <DailyReportPageContent />
    </div>
  );
};

const DailyReportPageContent = () => {
  return (
    <div className="relative">
      {/* Decorative background elements */}
      <div className="absolute -top-24 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10" />
      <div className="absolute top-1/2 -left-32 w-80 h-80 bg-orange-500/5 rounded-full blur-[100px] -z-10" />
      
      <DailyReportForm />
    </div>
  );
};

export default DailyReportPage;
