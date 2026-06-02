import { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  PhoneIncoming,
  UserCheck,
  MessageSquare,
  CalendarCheck,
  Building,
  CheckCircle,
  Repeat,
  Clock,
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
    const leftCannon  = confetti.create(undefined, { resize: true, useWorker: true });
    const rightCannon = confetti.create(undefined, { resize: true, useWorker: true });
    const frame = () => {
      if (Date.now() > end) return;
      leftCannon({
        particleCount: 6, angle: 60, spread: 55,
        origin: { x: 0, y: 0.65 }, colors,
        startVelocity: 55, ticks: 200, gravity: 0.9, scalar: 1.1, drift: 0.1,
      });
      rightCannon({
        particleCount: 6, angle: 120, spread: 55,
        origin: { x: 1, y: 0.65 }, colors,
        startVelocity: 55, ticks: 200, gravity: 0.9, scalar: 1.1, drift: -0.1,
      });
      requestAnimationFrame(frame);
    };
    frame();
  }, []);
};

/* ─── Closure Notification Card ────────────────────────────── */
export const ClosureNotificationCard = () => {
  const fireCannons = useSideCannons();
  const [closureCount, setClosureCount] = useState('');
  const [firing, setFiring] = useState(false);

  const handleSend = () => {
    if (!closureCount || parseInt(closureCount) < 1 || firing) return;
    setFiring(true);
    fireCannons();
    setTimeout(() => { setClosureCount(''); setFiring(false); }, 3600);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-lg shadow-orange-500/15"
      style={{ background: 'linear-gradient(135deg, #ea580c 0%, #f97316 45%, #f59e0b 100%)' }}>
      {/* Decorative glows */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-4 left-1/3 w-28 h-16 bg-yellow-300/15 rounded-full blur-xl pointer-events-none" />
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative px-5 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        {/* Left */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-sm shrink-0">
            <Trophy size={20} className="text-white drop-shadow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Zap size={10} className="text-yellow-200 fill-yellow-200" />
              <span className="text-[9px] font-bold text-yellow-200 uppercase tracking-[0.18em]">Team Alert</span>
            </div>
            <p className="text-[14px] font-black text-white leading-tight tracking-tight">Closure Achievement</p>
            <p className="text-[11px] text-orange-100 font-medium mt-0.5 flex items-center gap-1">
              <PartyPopper size={10} />
              Notify the whole team about a win
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2.5 sm:ml-auto flex-wrap sm:flex-nowrap">
          <div className="group/cc relative w-32 shrink-0">
            <div className="absolute inset-0 bg-white/90 rounded-xl border border-white/50 group-focus-within/cc:bg-white group-focus-within/cc:shadow-[0_0_0_3px_rgba(255,255,255,0.25)] transition-all duration-200" />
            <div className="relative flex items-center px-3 py-2 gap-2">
              <CheckCircle size={13} className="text-orange-500 shrink-0" />
              <input
                type="number"
                min="1"
                value={closureCount}
                onChange={e => setClosureCount(e.target.value)}
                placeholder="# closures"
                className="w-full bg-transparent border-none p-0 text-[13px] font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-0 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!closureCount || parseInt(closureCount) < 1 || firing}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-[12px] font-bold rounded-xl shadow-lg shadow-zinc-900/30 hover:bg-zinc-800 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap shrink-0"
          >
            <Bell size={13} />
            Send Notification
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Form section wrapper ─────────────────────────────────── */
const FormSection = ({ title, description, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2.5">
      <div className="h-px flex-1 bg-zinc-100" />
      <div className="text-center">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.18em] whitespace-nowrap">{title}</p>
        {description && <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{description}</p>}
      </div>
      <div className="h-px flex-1 bg-zinc-100" />
    </div>
    {children}
  </div>
);

/* ─── Single numeric input field ───────────────────────────── */
const ReportField = ({ id, label, icon: Icon, value, onChange }) => (
  <div className="group/field space-y-1">
    <label
      htmlFor={id}
      className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.14em] group-focus-within/field:text-primary transition-colors duration-200 cursor-text"
    >
      {label}
    </label>
    <div className="relative">
      {/* Left accent bar */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-0 bg-primary rounded-r-full group-focus-within/field:h-1/2 transition-all duration-300 z-10" />
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60
        group-hover/field:border-zinc-300 group-hover/field:bg-zinc-50
        group-focus-within/field:border-primary/40 group-focus-within/field:bg-white
        group-focus-within/field:shadow-[0_0_0_3px_rgba(248,111,3,0.06)]
        transition-all duration-200">
        <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-white border border-zinc-200 text-zinc-400
          group-focus-within/field:text-primary group-focus-within/field:border-orange-200
          transition-all duration-200 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <Icon size={13} strokeWidth={1.8} />
        </div>
        <input
          id={id}
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={onChange}
          placeholder="0"
          className="w-full bg-transparent border-none p-0 text-[13px] font-semibold text-zinc-900 placeholder:text-zinc-300 focus:ring-0 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    </div>
  </div>
);

/* ─── Main Report Form ─────────────────────────────────────── */
const DailyReportForm = () => {
  const { submitReport, loading } = useDailyReport();

  const [form, setForm] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    callsReceived: '',
    qualifiedLeads: '',
    counsellingDone: '',
    counsellingBooked: '',
    officeVisits: '',
    closures: '',
    followupsDone: '',
    pendingFollowups: '',
  });

  const [validationError, setValidationError] = useState('');

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    if (field === 'reportDate') { setForm(prev => ({ ...prev, [field]: value })); return; }
    if (value === '') { setForm(prev => ({ ...prev, [field]: '' })); return; }
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      setForm(prev => ({ ...prev, [field]: Math.max(0, parsed) }));
      setValidationError('');
    }
  };

  const numericFields = [
    'callsReceived', 'qualifiedLeads', 'counsellingDone',
    'counsellingBooked', 'officeVisits', 'closures',
    'followupsDone', 'pendingFollowups',
  ];

  const validateForm = () => {
    const allEmpty = numericFields.every(f => form[f] === '' || form[f] === null || form[f] === undefined);
    if (allEmpty) {
      setValidationError('Please fill in at least one field before submitting the report.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const result = await submitReport(form);
    if (result.success) {
      setForm({
        reportDate: new Date().toISOString().split('T')[0],
        callsReceived: '', qualifiedLeads: '', counsellingDone: '',
        counsellingBooked: '', officeVisits: '', closures: '',
        followupsDone: '', pendingFollowups: '',
      });
      setValidationError('');
    }
  };

  // Field groups — each becomes its own section
  const groups = [
    {
      title: 'Communication Metrics',
      fields: [
        { key: 'callsReceived',  label: 'Calls Received',    icon: PhoneIncoming },
        { key: 'qualifiedLeads', label: 'Qualified Leads',   icon: UserCheck },
        { key: 'officeVisits',   label: 'Office Visits',     icon: Building },
      ],
    },
    {
      title: 'Counselling Metrics',
      fields: [
        { key: 'counsellingDone',   label: 'Counselling Done',   icon: MessageSquare },
        { key: 'counsellingBooked', label: 'Counselling Booked', icon: CalendarCheck },
      ],
    },
    {
      title: 'Conversion & Follow-ups',
      fields: [
        { key: 'closures',         label: 'Closures',           icon: CheckCircle },
        { key: 'followupsDone',    label: 'Follow-ups Done',    icon: Repeat },
        { key: 'pendingFollowups', label: 'Pending Follow-ups', icon: Clock },
      ],
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
      <form onSubmit={handleSubmit} noValidate>

        {/* ── Form header ── */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-orange-50 border border-orange-100">
              <Sparkles size={14} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-zinc-900 tracking-tight font-heading">Daily Performance Report</h2>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Fill in your metrics for today</p>
            </div>
          </div>

          {/* Report date — read-only */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <Calendar size={12} className="text-zinc-400 shrink-0" />
            <span className="text-[12px] font-semibold text-zinc-500">
              {new Date(form.reportDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* ── Form body ── */}
        <div className="px-5 sm:px-6 py-5 space-y-6">

          {/* Mobile date */}
          <div className="sm:hidden flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 w-fit">
            <Calendar size={12} className="text-zinc-400 shrink-0" />
            <span className="text-[12px] font-semibold text-zinc-500">
              {new Date(form.reportDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* Grouped field sections */}
          {groups.map((group) => (
            <FormSection key={group.title} title={group.title}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.fields.map(({ key, label, icon }) => (
                  <ReportField
                    key={key}
                    id={`field-${key}`}
                    label={label}
                    icon={icon}
                    value={form[key]}
                    onChange={handleChange(key)}
                  />
                ))}
              </div>
            </FormSection>
          ))}

          {/* Validation error */}
          {validationError && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <p className="text-[12px] font-semibold text-red-600 leading-relaxed">{validationError}</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 sm:px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            className="px-5 py-2 text-[12px] font-semibold text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-all duration-150"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="group relative flex items-center justify-center gap-2 bg-zinc-900 text-white px-8 py-2.5 rounded-xl text-[13px] font-bold shadow-sm shadow-zinc-900/10 hover:bg-primary hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Submit Report
                <ArrowRight size={14} className="translate-x-0 group-hover:translate-x-1 transition-transform hidden sm:block" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DailyReportForm;
