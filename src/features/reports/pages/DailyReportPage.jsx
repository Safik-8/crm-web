import { useEffect, useRef, useState, useMemo } from 'react';
import DailyReportForm, { ClosureNotificationCard } from '../components/DailyReportForm';
import { TrendingUp, Target, Zap } from 'lucide-react';
import { useLoader } from '../../../shared/context/LoaderContext';

const DailyReportPage = () => {
  const { forceHideLoader } = useLoader();
  const didHideInitialRouteLoaderRef = useRef(false);
  const headerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Seed star positions once — never re-randomize
  const stars = useMemo(() => ({
    far: Array.from({ length: 22 }, (_, i) => ({
      id: i,
      top: (((i * 47 + 13) % 97) / 97) * 100,
      left: (((i * 83 + 29) % 89) / 89) * 100,
      size: ((i * 31) % 10) / 10 * 1.5 + 1,
    })),
    mid: Array.from({ length: 14 }, (_, i) => ({
      id: i,
      top: (((i * 61 + 7) % 91) / 91) * 100,
      left: (((i * 73 + 41) % 97) / 97) * 100,
      size: ((i * 43) % 10) / 10 * 2 + 1.5,
    })),
    near: Array.from({ length: 8 }, (_, i) => ({
      id: i,
      top: (((i * 53 + 19) % 83) / 83) * 100,
      left: (((i * 67 + 37) % 79) / 79) * 100,
      size: ((i * 37) % 10) / 10 * 2.5 + 2,
    })),
  }), []);

  useEffect(() => {
    if (!didHideInitialRouteLoaderRef.current) {
      forceHideLoader();
      didHideInitialRouteLoaderRef.current = true;
    }
  }, [forceHideLoader]);

  // Mouse parallax tracking — only inside the header
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const handleMouseMove = (e) => {
      const rect = header.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      setMousePos({ x, y });
    };
    const handleMouseLeave = () => setMousePos({ x: 0, y: 0 });
    header.addEventListener('mousemove', handleMouseMove);
    header.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      header.removeEventListener('mousemove', handleMouseMove);
      header.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="container mx-auto px-3 sm:px-6 pb-20 max-w-7xl">
      {/* ── Premium Page Header ─────────────────────────────── */}
      <div ref={headerRef} className="relative mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl" style={{ minHeight: '180px' }}>

        {/* ── Base — pure black ── */}
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_110%_-10%,_rgba(249,115,22,0.08)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_-5%_110%,_rgba(249,115,22,0.05)_0%,_transparent_55%)]" />

        {/* ── Parallax star field layers ── */}
        {/* Layer 1 — far stars (slow) */}
        <div
          className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out"
          style={{ transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)` }}
        >
          {stars.far.map((star) => (
            <div
              key={`far-${star.id}`}
              className="absolute rounded-full bg-white/25"
              style={{
                width: star.size + 'px',
                height: star.size + 'px',
                top: star.top + '%',
                left: star.left + '%',
                boxShadow: '0 0 3px rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>

        {/* Layer 2 — mid stars (medium) */}
        <div
          className="absolute inset-0 pointer-events-none transition-transform duration-500 ease-out"
          style={{ transform: `translate(${mousePos.x * 18}px, ${mousePos.y * 18}px)` }}
        >
          {stars.mid.map((star) => (
            <div
              key={`mid-${star.id}`}
              className="absolute rounded-full bg-orange-300/35"
              style={{
                width: star.size + 'px',
                height: star.size + 'px',
                top: star.top + '%',
                left: star.left + '%',
                boxShadow: '0 0 5px rgba(251,191,36,0.5)',
              }}
            />
          ))}
        </div>

        {/* Layer 3 — near stars (fast) */}
        <div
          className="absolute inset-0 pointer-events-none transition-transform duration-300 ease-out"
          style={{ transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)` }}
        >
          {stars.near.map((star) => (
            <div
              key={`near-${star.id}`}
              className="absolute rounded-full bg-amber-200/45"
              style={{
                width: star.size + 'px',
                height: star.size + 'px',
                top: star.top + '%',
                left: star.left + '%',
                boxShadow: '0 0 7px rgba(252,211,77,0.6)',
              }}
            />
          ))}
        </div>

        {/* ── Gradient mesh overlay ── */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_110%_-10%,_rgba(249,115,22,0.18)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_-10%_110%,_rgba(249,115,22,0.10)_0%,_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_50%_120%,_rgba(251,191,36,0.06)_0%,_transparent_60%)]" />

        {/* ── Animated floating orbs ── */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 320, height: 320,
            top: '-80px', right: '-60px',
            background: 'radial-gradient(circle, rgba(249,115,22,0.22) 0%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'floatOrb1 9s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 220, height: 220,
            bottom: '-60px', left: '15%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.14) 0%, transparent 70%)',
            filter: 'blur(35px)',
            animation: 'floatOrb2 12s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 160, height: 160,
            top: '20%', left: '45%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
            filter: 'blur(30px)',
            animation: 'floatOrb3 15s ease-in-out infinite',
          }}
        />

        {/* ── Subtle dot-grid pattern ── */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* ── Top edge highlight line ── */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
        {/* ── Bottom edge subtle glow ── */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        {/* ── Noise/grain texture overlay ── */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />

        {/* ── Content ── */}
        <div className="relative z-10 px-5 sm:px-8 py-7 sm:py-9 flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
          {/* Left — title block */}
          <div className="space-y-3">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-500/25 bg-orange-500/10 backdrop-blur-sm">
              <Zap size={10} className="text-orange-400 fill-orange-400" />
              <span className="text-[10px] font-bold text-orange-300 uppercase tracking-widest">ISE Daily Report</span>
            </div>

            {/* Heading */}
            <div>
              <h1 className="text-2xl sm:text-[2rem] font-black text-white tracking-tight leading-tight font-heading">
                Log Today's{' '}
                <span
                  className="relative inline-block"
                  style={{
                    background: 'linear-gradient(95deg, #fb923c 0%, #f97316 40%, #fbbf24 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Performance
                </span>
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-sm leading-relaxed mt-1.5">
                Track calls, closures, Leads &amp; follow-ups — keep the team aligned with goals.
              </p>
            </div>
          </div>

          {/* Right — glassmorphism stat pills */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            {/* Live session */}
            <div
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}
            >
              <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.2)' }}>
                <Target size={13} className="text-orange-400" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold leading-none">Session</p>
                <p className="text-xs text-white font-bold mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Live &amp; Active
                </p>
              </div>
            </div>

            {/* Tracking */}
            <div
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}
            >
              <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.18)' }}>
                <TrendingUp size={13} className="text-amber-400" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold leading-none">Tracking</p>
                <p className="text-xs text-white font-bold mt-0.5">Performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Closure Notification — standalone card, visually separate */}
      <div className="mb-4 sm:mb-5">
        <ClosureNotificationCard />
      </div>

      {/* Report Form */}
      <div className="relative">
        <div className="absolute -top-24 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-orange-500/5 rounded-full blur-[100px] -z-10" />
        <DailyReportForm />
      </div>
    </div>
  );
};

export default DailyReportPage;
