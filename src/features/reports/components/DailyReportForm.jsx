import { useState } from 'react';
import {
  PhoneIncoming,
  UserCheck,
  MessageSquare,
  CalendarCheck,
  Building,
  CheckCircle,
  Banknote,
  Repeat,
  Clock,
  Users,
  Signature,
  Loader2,
  ClipboardCheck,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { useDailyReport } from '../../daily-reports/hooks/useDailyReport';

const DailyReportForm = () => {
  const { submitReport, loading } = useDailyReport();

  const [form, setForm] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    callsReceived: 0,
    qualifiedLeads: 0,
    counsellingDone: 0,
    counsellingBooked: 0,
    officeVisits: 0,
    closures: 0,
    revenue: 0,
    followupsDone: 0,
    pendingFollowups: 0,
    seminarTasks: 0,
    joiningFormalities: 0,
  });

  const handleChange = (field) => (e) => {
    let value = e.target.value;
    
    if (field === 'reportDate') {
      setForm(prev => ({ ...prev, [field]: value }));
      return;
    }

    // Allow empty string temporarily for easier editing, but convert to number on submit or blur
    // Or just treat empty as 0
    if (value === '') {
      setForm(prev => ({ ...prev, [field]: 0 }));
      return;
    }

    if (field === 'revenue') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        setForm(prev => ({ ...prev, [field]: parsed }));
      }
    } else {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) {
        setForm(prev => ({ ...prev, [field]: parsed }));
      }
    }
  };

  const validateForm = () => {
    const requiredFields = [
      'reportDate', 'callsReceived', 'qualifiedLeads', 'counsellingDone',
      'counsellingBooked', 'officeVisits', 'closures', 'revenue',
      'followupsDone', 'pendingFollowups', 'seminarTasks', 'joiningFormalities'
    ];

    for (const field of requiredFields) {
      if (form[field] === undefined || form[field] === null || form[field] === '') {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return; // Toast handled by hook or browser validation
    }

    const result = await submitReport(form);
    
    if (result.success) {
      // Reset form (keep the date or reset to today?)
      // The prompt says "On success... reset the form."
      setForm({
        reportDate: new Date().toISOString().split('T')[0],
        callsReceived: 0,
        qualifiedLeads: 0,
        counsellingDone: 0,
        counsellingBooked: 0,
        officeVisits: 0,
        closures: 0,
        revenue: 0,
        followupsDone: 0,
        pendingFollowups: 0,
        seminarTasks: 0,
        joiningFormalities: 0,
      });
    }
  };

  const fields = [
    { key: 'callsReceived', label: 'Calls Received', icon: PhoneIncoming },
    { key: 'qualifiedLeads', label: 'Qualified Leads', icon: UserCheck },
    { key: 'counsellingDone', label: 'Counselling Done', icon: MessageSquare },
    { key: 'counsellingBooked', label: 'Counselling Booked', icon: CalendarCheck },
    { key: 'officeVisits', label: 'Office Visits', icon: Building },
    { key: 'closures', label: 'Closures', icon: CheckCircle },
    { key: 'revenue', label: 'Revenue', icon: Banknote, step: '0.01' },
    { key: 'followupsDone', label: 'Follow-ups Done', icon: Repeat },
    { key: 'pendingFollowups', label: 'Pending Follow-ups', icon: Clock },
    { key: 'seminarTasks', label: 'Seminar Tasks', icon: Users },
    { key: 'joiningFormalities', label: 'Joining Formalities', icon: Signature },
  ];

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 ring-1 ring-slate-900/5 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-1000">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 md:p-8 border-b border-slate-100 relative overflow-hidden">
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6 relative z-10">
          <div className="h-11 w-11 sm:h-12 sm:w-12 md:h-16 md:w-16 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 shrink-0">
            <ClipboardCheck size={22} className="md:hidden" />
            <ClipboardCheck size={32} className="hidden md:block" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl md:text-3xl font-black text-slate-900 font-heading tracking-tight leading-tight">Daily Performance Report</h2>
            <p className="text-slate-500 text-[10px] sm:text-xs md:text-sm font-semibold mt-0.5 sm:mt-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
              Inside Sales Executive Tracking
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-5 md:p-8 space-y-5 sm:space-y-6 md:space-y-8">
        {/* Date Field Section */}
        <div className="w-full sm:max-w-xs">
          <div className="space-y-2 sm:space-y-3 group/field relative">
            <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5 group-focus-within/field:text-primary transition-all duration-300">
              Report Date
            </label>
            <label htmlFor="field-reportDate" className="relative isolate block cursor-text">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-0 bg-primary rounded-r-full group-focus-within/field:h-1/2 transition-all duration-500 z-30" />
              <div className="absolute inset-0 bg-slate-50/50 rounded-2xl border border-slate-400 -z-10 group-hover/field:bg-slate-50 group-focus-within/field:bg-white group-focus-within/field:border-primary/40 group-focus-within/field:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300" />
              <div className="flex items-center px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 gap-3">
                <div className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-white border border-slate-400 text-slate-900 group-focus-within/field:text-primary group-focus-within/field:scale-105 transition-all duration-500 shrink-0 shadow-sm pointer-events-none">
                  <Calendar size={16} />
                </div>
                <input
                  id="field-reportDate"
                  type="date"
                  required
                  value={form.reportDate}
                  onChange={handleChange('reportDate')}
                  className="w-full bg-transparent border-none p-0 text-sm sm:text-base md:text-lg font-black text-slate-900 focus:ring-0 outline-none transition-all"
                />
              </div>
            </label>
          </div>
        </div>

        {/* Fields Grid — 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {fields.map(({ key, label, icon: Icon, step }) => (
            <div key={key} className="space-y-1.5 sm:space-y-2 md:space-y-3 group/field relative">
              <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5 group-focus-within/field:text-primary transition-all duration-300">
                {label}
              </label>

              <label
                htmlFor={`field-${key}`}
                className="relative isolate block cursor-text"
              >
                {/* Dynamic Focus Accent */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-0 bg-primary rounded-r-full group-focus-within/field:h-1/2 transition-all duration-500 z-30" />

                {/* Background Layer */}
                <div className="absolute inset-0 bg-slate-50/50 rounded-2xl border border-slate-400 -z-10 group-hover/field:bg-slate-50 group-focus-within/field:bg-white group-focus-within/field:border-primary/40 group-focus-within/field:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300" />

                <div className="flex items-center px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 gap-3">
                  <div className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-white border border-slate-400 text-slate-900 group-focus-within/field:text-primary group-focus-within/field:scale-105 transition-all duration-500 shrink-0 shadow-sm pointer-events-none">
                    <Icon size={16} />
                  </div>

                  <input
                    id={`field-${key}`}
                    type="number"
                    min="0"
                    step={step || '1'}
                    required
                    value={form[key]}
                    onChange={handleChange(key)}
                    placeholder="0"
                    className="w-full bg-transparent border-none p-0 text-sm sm:text-base md:text-lg font-black text-slate-900 placeholder:text-slate-200 focus:ring-0 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </label>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 sm:pt-6 md:pt-10 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-4 md:gap-6">
          <button
            type="button"
            className="px-6 sm:px-8 py-3 sm:py-3.5 md:py-4 text-xs sm:text-sm font-bold text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-xl sm:rounded-2xl transition-all"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="relative group bg-slate-900 text-white px-8 sm:px-10 md:px-14 py-3 sm:py-3.5 md:py-4 rounded-[18px] sm:rounded-[20px] md:rounded-[22px] text-sm md:text-base font-black shadow-2xl shadow-slate-900/20 hover:bg-primary hover:shadow-primary/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 size={22} className="animate-spin mx-auto" />
            ) : (
              <span className="flex items-center justify-center gap-2 sm:gap-3">
                Submit Report
                <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-2 transition-transform hidden sm:block" />
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DailyReportForm;

