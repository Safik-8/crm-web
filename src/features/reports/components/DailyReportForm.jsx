import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
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
  ArrowRight,
  Calendar,
  Trophy,
  Bell,
  Sparkles,
  PartyPopper,
  Zap,
} from 'lucide-react';
import { useDailyReport } from '../../daily-reports/hooks/useDailyReport';

/* ─── Side-cannon confetti ─────────────────────────────────── */
const useSideCannons = () => {
  return useCallback(() => {
    const duration = 500;
    const end = Date.now() + duration;

    const colors = ['#f97316', '#fbbf24', '#fb923c', '#facc15', '#ef4444', '#a855f7', '#3b82f6'];

    // Left cannon
    const leftCannon = confetti.create(undefined, { resize: true, useWorker: true });
    // Right cannon
    const rightCannon = confetti.create(undefined, { resize: true, useWorker: true });

    const frame = () => {
      if (Date.now() > end) return;

      leftCannon({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors,
        startVelocity: 55,
        ticks: 200,
        gravity: 0.9,
        scalar: 1.1,
        drift: 0.1,
      });

      rightCannon({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors,
        startVelocity: 55,
        ticks: 200,
        gravity: 0.9,
        scalar: 1.1,
        drift: -0.1,
      });

      requestAnimationFrame(frame);
    };

    frame();
  }, []);
};

/* ─── Closure Notification Card (standalone) ───────────────── */
export const ClosureNotificationCard = () => {
  const fireCannons = useSideCannons();
  const [closureCount, setClosureCount] = useState('');
  const [firing, setFiring] = useState(false);

  const handleSend = () => {
    if (!closureCount || parseInt(closureCount) < 1 || firing) return;
    setFiring(true);
    fireCannons();
    setTimeout(() => {
      setClosureCount('');
      setFiring(false);
    }, 3600);
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 shadow-xl shadow-orange-500/25">
        {/* Decorative glows */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-4 left-1/3 w-32 h-20 bg-yellow-300/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative px-5 sm:px-7 py-5 sm:py-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {/* Left — icon + text */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg shrink-0">
              <Trophy size={26} className="text-white drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Zap size={11} className="text-yellow-200 fill-yellow-200" />
                <span className="text-[10px] font-bold text-yellow-200 uppercase tracking-widest">Team Alert</span>
              </div>
              <p className="text-base font-black text-white leading-tight tracking-tight">Closure Achievement</p>
              <p className="text-xs text-orange-100 font-medium mt-0.5 flex items-center gap-1">
                <PartyPopper size={11} />
                Notify the whole team about a win
              </p>
            </div>
          </div>

          {/* Right — count input + button */}
          <div className="flex items-center gap-2.5 sm:ml-auto flex-wrap sm:flex-nowrap">
            {/* # Closures */}
            <div className="group/cc relative w-32 shrink-0">
              <div className="absolute inset-0 bg-white/90 rounded-xl border border-white/50 group-focus-within/cc:bg-white group-focus-within/cc:border-white group-focus-within/cc:shadow-[0_0_0_3px_rgba(255,255,255,0.3)] transition-all duration-200" />
              <div className="relative flex items-center px-3 py-2.5 gap-2">
                <CheckCircle size={14} className="text-orange-500 shrink-0" />
                <input
                  type="number"
                  min="1"
                  value={closureCount}
                  onChange={e => setClosureCount(e.target.value)}
                  placeholder="# closures"
                  className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-0 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!closureCount || parseInt(closureCount) < 1 || firing}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/40 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap shrink-0"
            >
              <Bell size={14} />
              Send Notification
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/* ─── Main Report Form ─────────────────────────────────────── */
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
    if (field === 'reportDate') { setForm(prev => ({ ...prev, [field]: value })); return; }
    if (value === '') { setForm(prev => ({ ...prev, [field]: 0 })); return; }
    if (field === 'revenue') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) setForm(prev => ({ ...prev, [field]: parsed }));
    } else {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) setForm(prev => ({ ...prev, [field]: parsed }));
    }
  };

  const validateForm = () => {
    const requiredFields = [
      'reportDate', 'callsReceived', 'qualifiedLeads', 'counsellingDone',
      'counsellingBooked', 'officeVisits', 'closures', 'revenue',
      'followupsDone', 'pendingFollowups', 'seminarTasks', 'joiningFormalities',
    ];
    for (const field of requiredFields) {
      if (form[field] === undefined || form[field] === null || form[field] === '') return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const result = await submitReport(form);
    if (result.success) {
      setForm({
        reportDate: new Date().toISOString().split('T')[0],
        callsReceived: 0, qualifiedLeads: 0, counsellingDone: 0,
        counsellingBooked: 0, officeVisits: 0, closures: 0, revenue: 0,
        followupsDone: 0, pendingFollowups: 0, seminarTasks: 0, joiningFormalities: 0,
      });
    }
  };

  const fields = [
    { key: 'callsReceived',     label: 'Calls Received',      icon: PhoneIncoming },
    { key: 'qualifiedLeads',    label: 'Qualified Leads',      icon: UserCheck },
    { key: 'counsellingDone',   label: 'Counselling Done',     icon: MessageSquare },
    { key: 'counsellingBooked', label: 'Counselling Booked',   icon: CalendarCheck },
    { key: 'officeVisits',      label: 'Office Visits',        icon: Building },
    { key: 'closures',          label: 'Closures',             icon: CheckCircle },
    { key: 'revenue',           label: 'Revenue',              icon: Banknote, step: '0.01' },
    { key: 'followupsDone',     label: 'Follow-ups Done',      icon: Repeat },
    { key: 'pendingFollowups',  label: 'Pending Follow-ups',   icon: Clock },
    { key: 'seminarTasks',      label: 'Seminar Tasks',        icon: Users },
    { key: 'joiningFormalities',label: 'Joining Formalities',  icon: Signature },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.08)] border border-slate-100 ring-1 ring-slate-900/5 overflow-hidden">
      <form onSubmit={handleSubmit} className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
        {/* Date Field — locked to today */}
        <div className="w-full sm:max-w-xs">
          <div className="space-y-1 relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-1.5">
              Report Date
              <span className="text-[9px] font-bold text-slate-300 normal-case tracking-normal">(auto)</span>
            </label>
            <div className="relative isolate">
              <div className="absolute inset-0 bg-slate-50 rounded-xl border border-slate-200 -z-10" />
              <div className="flex items-center px-3 py-1.5 sm:py-2 gap-2.5">
                <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-white border border-slate-200 text-slate-400 shrink-0 shadow-sm">
                  <Calendar size={14} />
                </div>
                <input
                  id="field-reportDate"
                  type="date"
                  readOnly
                  value={form.reportDate}
                  className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-400 focus:ring-0 outline-none cursor-not-allowed select-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {fields.map(({ key, label, icon: Icon, step }) => (
            <div key={key} className="space-y-1 group/field relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4 leading-tight group-focus-within/field:text-primary transition-all duration-300 block">
                {label}
              </label>
              <label htmlFor={`field-${key}`} className="relative isolate block cursor-text">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary rounded-r-full group-focus-within/field:h-1/2 transition-all duration-500 z-30" />
                <div className="absolute inset-0 bg-slate-50/50 rounded-xl border border-slate-200 -z-10 group-hover/field:bg-slate-50 group-focus-within/field:bg-white group-focus-within/field:border-primary/40 group-focus-within/field:shadow-[0_4px_16px_rgb(0,0,0,0.04)] transition-all duration-300" />
                <div className="flex items-center px-3 py-1.5 sm:py-2 gap-2.5">
                  <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-white border border-slate-200 text-slate-500 group-focus-within/field:text-primary group-focus-within/field:scale-105 transition-all duration-500 shrink-0 shadow-sm pointer-events-none">
                    <Icon size={14} />
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
                    className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:ring-0 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </label>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 sm:pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            className="px-5 sm:px-6 py-2 sm:py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="relative group bg-slate-900 text-white px-7 sm:px-10 py-2 sm:py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-900/15 hover:bg-primary hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin mx-auto" />
            ) : (
              <span className="flex items-center justify-center gap-2 sm:gap-3">
                Submit Report
                <ArrowRight size={16} className="translate-x-0 group-hover:translate-x-1.5 transition-transform hidden sm:block" />
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DailyReportForm;
