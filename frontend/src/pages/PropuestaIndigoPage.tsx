/**
 * PropuestaIndigoPage.tsx
 * Propuesta Comercial SARAI – Clínica Médica Índigo
 * SARAI GROUP
 *
 * Acceso restringido: requiere credenciales para visualizar.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import {
  Shield, Zap, Smartphone, BarChart2, FileText,
  Brain, Mic, MessageSquare, CheckCircle, Mail,
  Phone, Building2, User, Send, Lock, Eye, EyeOff,
  ArrowRight, TrendingUp, HeartPulse, Stethoscope,
  Activity, FlaskConical, Scissors, DollarSign,
  Package, ShoppingCart, Receipt, Wallet, Award, Bot,
  Clock, Globe, ChevronRight, Menu, X, AlertCircle,
  Layers, Star, Cpu, Users, Database
} from 'lucide-react';
import saraiLogo from '../assets/logo1.png';

// ── Auth credentials ──────────────────────────────────────────────────────────
const VALID_EMAIL = 'gerencia@clinicamedicaindigo.com.co';
const VALID_PASS  = 'indigo2026*';

// ── Font injection ────────────────────────────────────────────────────────────
function useGoogleFonts() {
  useEffect(() => {
    const id = 'sarai-proposal-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id   = id;
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

// ── Scroll-triggered fade + rise ──────────────────────────────────────────────
function FadeIn({
  children, delay = 0, className = '', as = 'div'
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}) {
  const ref        = useRef<HTMLDivElement>(null);
  const inView     = useInView(ref, { once: true, margin: '-72px' });
  const reducedMot = useReducedMotion();

  const Tag = as as any;
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: reducedMot ? 1 : 0, y: reducedMot ? 0 : 26 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Neural canvas (absolute, used inside containers) ─────────────────────────
function NeuralBg({ opacity = 0.35 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const N = 75, MAX_D = 155, MAX_D2 = MAX_D * MAX_D;

    const resize = () => {
      canvas.width  = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    interface Pt { x: number; y: number; vx: number; vy: number; }
    const pts: Pt[] = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,  y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MAX_D2) {
            const a = ((1 - Math.sqrt(d2) / MAX_D) * 0.28).toFixed(3);
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(24,169,160,${a})`;
            ctx.lineWidth   = 0.75;
            ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(24,169,160,0.07)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(24,169,160,0.55)';
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity }}
    />
  );
}

// ── Dashboard mockup ──────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div className="relative">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(140deg,#1a2d48 0%,#0e1b30 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(24,169,160,0.08)',
        }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/5"
          style={{ background: 'rgba(0,0,0,0.3)' }}>
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
          <div className="flex-1 mx-3 h-4 rounded bg-white/5 flex items-center px-2">
            <span className="text-white/25 text-[9px] font-mono">sarai.clinicaindigo.co/dashboard</span>
          </div>
        </div>

        <div className="p-4">
          {/* Top row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="h-2.5 w-28 rounded-full bg-white/20 mb-1" />
              <div className="h-1.5 w-16 rounded-full bg-white/10" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-6 w-16 rounded-lg" style={{ background: 'linear-gradient(90deg,#18A9A0,#2E6CB5)', opacity: 0.85 }} />
              <div className="h-6 w-6 rounded-lg bg-white/8 border border-white/8" />
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Recaudo / mes', val: '$248M',   color: '#18A9A0' },
              { label: 'Pacientes hoy', val: '1 284',   color: '#2E6CB5' },
              { label: 'Glosas evit.',  val: '−42 %',   color: '#1E8E5A' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-2.5 border border-white/5"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="w-4 h-1 rounded mb-1.5" style={{ background: s.color, opacity: 0.6 }} />
                <div className="text-white font-bold text-xs leading-none mb-0.5">{s.val}</div>
                <div className="text-white/35 text-[8px]">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-xl p-3 mb-2.5 border border-white/5"
            style={{ background: 'rgba(255,255,255,0.025)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="h-2 w-20 rounded bg-white/20" />
              <div className="h-1.5 w-10 rounded bg-white/10" />
            </div>
            <svg viewBox="0 0 220 56" className="w-full" style={{ height: '52px' }}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#18A9A0" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#18A9A0" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,48 C18,44 28,20 48,22 C68,24 78,36 100,28 C122,20 130,8 155,11 C175,14 185,26 220,18 L220,56 L0,56 Z"
                fill="url(#cg)" />
              <path d="M0,48 C18,44 28,20 48,22 C68,24 78,36 100,28 C122,20 130,8 155,11 C175,14 185,26 220,18"
                fill="none" stroke="#18A9A0" strokeWidth="1.4" strokeLinecap="round" />
              {/* dots */}
              {[[48,22],[100,28],[155,11]].map(([x,y],i) => (
                <circle key={i} cx={x} cy={y} r="2.5" fill="#18A9A0" />
              ))}
            </svg>
          </div>

          {/* Patient list */}
          <div className="space-y-1.5">
            {[
              { name: 'Carlos M.', type: 'Urgencias',     status: 'En atención', color: '#18A9A0' },
              { name: 'Ana G.',    type: 'Consulta Ext.', status: 'Facturado',   color: '#1E8E5A' },
              { name: 'Luis P.',   type: 'Hospitalización',status: 'Egresado',   color: '#2E6CB5' },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 border border-white/5"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[8px] flex-shrink-0"
                  style={{ background: p.color + 'CC' }}>
                  {p.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white/75 text-[9px] font-medium truncate">{p.name}</div>
                  <div className="text-white/30 text-[8px]">{p.type}</div>
                </div>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: p.color + '22', color: p.color }}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Ambient glow */}
      <div className="absolute inset-[-20%] -z-10 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(24,169,160,0.14) 0%, transparent 65%)' }} />
    </div>
  );
}

// ── Glassmorphism card ────────────────────────────────────────────────────────
function GlassCard({ children, className = '', hover = true }: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${hover ? 'hover:-translate-y-1 hover:shadow-2xl' : ''} ${className}`}
      style={{
        background: 'rgba(28,46,74,0.45)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}
      onMouseEnter={e => hover && (e.currentTarget.style.borderColor = 'rgba(24,169,160,0.3)')}
      onMouseLeave={e => hover && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
    >
      {children}
    </div>
  );
}

// ── Light card (for light-bg sections) ───────────────────────────────────────
function LightCard({ children, className = '' }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl transition-all duration-300 hover:-translate-y-1 ${className}`}
      style={{
        background: '#ffffff',
        border: '1px solid rgba(28,46,74,0.08)',
        boxShadow: '0 4px 24px rgba(28,46,74,0.07)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(24,169,160,0.12)';
        e.currentTarget.style.borderColor = 'rgba(24,169,160,0.25)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(28,46,74,0.07)';
        e.currentTarget.style.borderColor = 'rgba(28,46,74,0.08)';
      }}
    >
      {children}
    </div>
  );
}

// ── Section title ─────────────────────────────────────────────────────────────
function SectionTitle({ kicker, title, subtitle, light = false, center = true }: {
  kicker: string;
  title: string;
  subtitle?: string;
  light?: boolean;
  center?: boolean;
}) {
  return (
    <FadeIn className={`mb-12 md:mb-16 ${center ? 'text-center' : ''}`}>
      <span className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
        style={{ background: 'rgba(24,169,160,0.12)', color: '#18A9A0', border: '1px solid rgba(24,169,160,0.25)' }}>
        {kicker}
      </span>
      <h2
        className={`font-black text-3xl md:text-4xl xl:text-5xl tracking-tight leading-tight mb-4 ${light ? 'text-white' : 'text-[#0E1B30]'}`}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`text-base md:text-lg ${center ? 'max-w-2xl mx-auto' : 'max-w-2xl'} ${light ? 'text-white/60' : 'text-[#1C2E4A]/55'}`}>
          {subtitle}
        </p>
      )}
    </FadeIn>
  );
}

// ── Check item ────────────────────────────────────────────────────────────────
function Ci({ text, light = true }: { text: string; light?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#1E8E5A' }} />
      <span className={`text-sm leading-relaxed ${light ? 'text-white/70' : 'text-[#1C2E4A]/70'}`}>{text}</span>
    </li>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PASSWORD GATE
// ══════════════════════════════════════════════════════════════════════════════
function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [show,     setShow]     = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = useCallback(() => {
    if (loading) return;
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (
        email.trim().toLowerCase() === VALID_EMAIL &&
        password === VALID_PASS
      ) {
        onSuccess();
      } else {
        setError('Credenciales incorrectas. Verifique el correo y la contraseña.');
      }
      setLoading(false);
    }, 700);
  }, [email, password, loading, onSuccess]);

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleLogin(); };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  const focusStyle  = () => ({ borderColor: 'rgba(24,169,160,0.55)', boxShadow: '0 0 0 3px rgba(24,169,160,0.1)' });
  const blurStyle   = () => inputStyle;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg,#091220 0%,#0e1b30 55%,#0a1f3c 100%)' }}>

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(24,169,160,0.12) 0%, transparent 65%)', filter: 'blur(60px)' }} />
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <NeuralBg opacity={0.45} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="rounded-3xl p-8 md:p-10"
          style={{
            background: 'rgba(14,27,48,0.7)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(24,169,160,0.07), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: 'linear-gradient(135deg,#18A9A0 0%,#2E6CB5 100%)', boxShadow: '0 8px 32px rgba(24,169,160,0.35)' }}>
              <img src={saraiLogo} alt="SARAI" className="w-10 h-10 object-contain rounded-lg" />
            </div>
            <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              SAR<span style={{ color: '#18A9A0' }}>AI</span>
            </h1>
            <p className="text-white/35 text-[11px] tracking-widest uppercase mb-4">Sistema Asistencial Inteligente</p>
            <div className="border-t border-white/8 pt-4">
              <p className="text-white/55 text-sm font-medium">Propuesta Comercial Confidencial</p>
              <p className="text-white/30 text-xs mt-0.5">Clínica Médica Índigo · 2026</p>
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-white/45 text-[10px] font-semibold tracking-widest uppercase mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="gerencia@clinica.com.co"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm outline-none"
                  style={inputStyle}
                  onFocus={e => Object.assign(e.currentTarget.style, focusStyle())}
                  onBlur={e => Object.assign(e.currentTarget.style, blurStyle())}
                />
              </div>
            </div>

            <div>
              <label className="block text-white/45 text-[10px] font-semibold tracking-widest uppercase mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-white text-sm outline-none"
                  style={inputStyle}
                  onFocus={e => Object.assign(e.currentTarget.style, focusStyle())}
                  onBlur={e => Object.assign(e.currentTarget.style, blurStyle())}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShow(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1"
                  aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-red-400 text-xs px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
                  role="alert"
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18A9A0] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg,#18A9A0 0%,#2E6CB5 100%)',
                boxShadow: '0 8px 28px rgba(24,169,160,0.28)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              {loading
                ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                : <><Shield className="w-4 h-4" />Acceder a la propuesta</>
              }
            </button>
          </div>

          <p className="text-center text-white/20 text-[10px] mt-6 leading-relaxed">
            Documento confidencial · Uso exclusivo de Gerencia<br />
            SARAI GROUP
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NAVBAR
// ══════════════════════════════════════════════════════════════════════════════
function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Solución',     href: '#solucion' },
    { label: 'Beneficios',   href: '#beneficios' },
    { label: 'Servicios',    href: '#servicios' },
    { label: 'Modelo',       href: '#modelo' },
    { label: 'Cumplimiento', href: '#cumplimiento' },
    { label: 'Contacto',     href: '#contacto' },
  ];

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(9,18,32,0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.25)' : 'none',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden" style={{ background: 'rgba(24,169,160,0.15)', border: '1px solid rgba(24,169,160,0.25)' }}>
              <img src={saraiLogo} alt="SARAI" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                SAR<span style={{ color: '#18A9A0' }}>AI</span>
              </span>
              <span className="hidden sm:block text-[9px] text-white/35 tracking-widest uppercase leading-none -mt-0.5 ml-0.5">
                Sistema Asistencial
              </span>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map(l => (
              <button key={l.label} onClick={() => scrollTo(l.href)}
                className="px-3.5 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18A9A0]">
                {l.label}
              </button>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => scrollTo('#contacto')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18A9A0]"
              style={{ background: 'linear-gradient(135deg,#18A9A0 0%,#2E6CB5 100%)', boxShadow: '0 4px 16px rgba(24,169,160,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
            >
              Solicitar demo
            </button>
          </div>

          {/* Mobile burger */}
          <button className="lg:hidden text-white/70 hover:text-white p-2 -mr-2 transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Menú">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 lg:hidden p-4"
            style={{
              background: 'rgba(9,18,32,0.96)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <nav className="flex flex-col gap-1 mb-4">
              {links.map(l => (
                <button key={l.label} onClick={() => scrollTo(l.href)}
                  className="text-left px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm font-medium">
                  {l.label}
                </button>
              ))}
            </nav>
            <button
              onClick={() => scrollTo('#contacto')}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#18A9A0 0%,#2E6CB5 100%)' }}
            >
              Solicitar demo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HERO
// ══════════════════════════════════════════════════════════════════════════════
function HeroSection() {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="solucion" className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(150deg,#091220 0%,#0e1b30 50%,#0a2040 100%)' }}>

      {/* Neural bg */}
      <NeuralBg opacity={0.4} />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(24,169,160,0.1) 0%, transparent 60%)', filter: 'blur(40px)' }} />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(46,108,181,0.09) 0%, transparent 60%)', filter: 'blur(40px)' }} />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-5 md:px-8 pt-28 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
          {/* Left: copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full mb-6"
                style={{ background: 'rgba(24,169,160,0.12)', color: '#18A9A0', border: '1px solid rgba(24,169,160,0.3)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#18A9A0' }} />
                Sistema Asistencial Inteligente · Hospital
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-4xl sm:text-5xl xl:text-6xl font-black text-white leading-[1.08] tracking-tight mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Maximiza tu{' '}
              <span style={{ background: 'linear-gradient(90deg,#18A9A0,#2E6CB5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                recaudo
              </span>{' '}
              y optimiza el tiempo de tus procesos
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-white/55 text-lg leading-relaxed mb-8 max-w-xl"
            >
              Sistema asistencial clínico 100% responsive con facturación electrónica,
              RIPS JSON, gestión de glosas e inteligencia artificial para hospitales
              y clínicas en Colombia.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap gap-3"
            >
              <button
                onClick={() => scrollTo('#contacto')}
                className="px-6 py-3.5 rounded-xl font-semibold text-white text-sm flex items-center gap-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18A9A0]"
                style={{ background: 'linear-gradient(135deg,#18A9A0 0%,#2E6CB5 100%)', boxShadow: '0 8px 28px rgba(24,169,160,0.35)' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
              >
                Solicitar demo <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollTo('#servicios')}
                className="px-6 py-3.5 rounded-xl font-semibold text-white/80 text-sm flex items-center gap-2 transition-all duration-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                Ver servicios <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Mini stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-wrap gap-6 mt-10 pt-8"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              {[
                { val: '100%', label: 'Normativa DIAN/RIPS' },
                { val: 'IA',   label: 'Clínica por voz y texto' },
                { val: '24/7', label: 'Soporte prioritario' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-2xl font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    dangerouslySetInnerHTML={{ __html: s.val.replace('IA', `<span style="color:#18A9A0">IA</span>`) }} />
                  <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative lg:block"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TRUST BAR
// ══════════════════════════════════════════════════════════════════════════════
function TrustBar() {
  const items = [
    { icon: <FileText className="w-3.5 h-3.5" />, label: 'Res. 948 de 2026' },
    { icon: <Receipt className="w-3.5 h-3.5" />, label: 'FEV · RIPS JSON' },
    { icon: <Building2 className="w-3.5 h-3.5" />, label: 'DIAN' },
    { icon: <Shield className="w-3.5 h-3.5" />, label: 'Habeas Data · Ley 1581/2012' },
    { icon: <Award className="w-3.5 h-3.5" />, label: 'ISO 27001 en preparación' },
  ];
  return (
    <div style={{ background: 'rgba(9,18,32,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-4">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-white/40 text-xs font-medium">
              <span style={{ color: '#18A9A0' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VALUE SECTION (4 cards)
// ══════════════════════════════════════════════════════════════════════════════
function ValueSection() {
  const cards = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Maximización del recaudo',
      desc: 'Facturación electrónica, radicación RIPS y gestión de glosas integradas para reducir pérdidas y asegurar el cobro completo.',
      color: '#18A9A0',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Optimización de procesos',
      desc: 'Flujos clínicos y administrativos integrados que reducen reprocesos, tiempos de espera y cargas manuales en cada área.',
      color: '#2E6CB5',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: '100 % Responsive',
      desc: 'Acceso desde cualquier dispositivo: PC, tablet o celular. Mismo rendimiento y experiencia en cada punto de la clínica.',
      color: '#18A9A0',
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      title: 'Informes gerenciales con IA',
      desc: 'Tableros de control tipo Power BI con indicadores en tiempo real. Decisiones basadas en datos, no en suposiciones.',
      color: '#2E6CB5',
    },
  ];

  return (
    <section id="beneficios" className="py-24 md:py-32"
      style={{ background: '#F5F8FC' }}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-8">
        <SectionTitle
          kicker="Por qué SARAI"
          title="Valor que se refleja en cada proceso"
          subtitle="Cuatro pilares que transforman la operación de su institución, desde la atención hasta el cierre financiero."
        />
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {cards.map((c, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <LightCard className="p-7 h-full flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${c.color}14`, border: `1px solid ${c.color}28` }}>
                  <span style={{ color: c.color }}>{c.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#0E1B30] text-base mb-2 leading-snug"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {c.title}
                  </h3>
                  <p className="text-[#1C2E4A]/55 text-sm leading-relaxed">{c.desc}</p>
                </div>
              </LightCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RECAUDO SECTION
// ══════════════════════════════════════════════════════════════════════════════
function RecaudoSection() {
  const items = [
    {
      icon: <Receipt className="w-5 h-5" />,
      title: 'Facturación Electrónica (FEV)',
      features: ['Individual y masiva', 'Integración directa DIAN', 'Notas crédito/débito JSON', 'Validación en tiempo real'],
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: 'Radicación RIPS JSON',
      features: ['Individual y masiva', 'Validación previa automática', 'Trazabilidad por radicado', 'Reenvío automático en error'],
    },
    {
      icon: <AlertCircle className="w-5 h-5" />,
      title: 'Gestión de Glosas',
      features: ['Registro y clasificación', 'Respuesta masiva', 'Histórico por asegurador', 'Alertas de vencimiento'],
    },
    {
      icon: <Wallet className="w-5 h-5" />,
      title: 'Recuperación de Cartera',
      features: ['Seguimiento por factura', 'Estados de cuenta', 'Aging report', 'Integración contable'],
    },
  ];

  return (
    <section style={{ background: 'linear-gradient(160deg,#0e1b30 0%,#091220 100%)' }}
      className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(24,169,160,0.08) 0%, transparent 65%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-5 md:px-8">
        <SectionTitle
          kicker="Recaudo y facturación"
          title="Menos glosas. Más recaudo. Cero reprocesos."
          subtitle="Módulos especializados que cubren todo el ciclo de facturación y recuperación financiera en un solo sistema."
          light
        />

        {/* Metric strip */}
        <FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
            {[
              { val: '−42%', label: 'Glosas evitadas' },
              { val: '+28%', label: 'Recaudo efectivo' },
              { val: '−65%', label: 'Tiempo de radicación' },
              { val: '100%', label: 'Trazabilidad DIAN' },
            ].map((m, i) => (
              <div key={i} className="text-center rounded-2xl py-5 px-4"
                style={{ background: 'rgba(24,169,160,0.08)', border: '1px solid rgba(24,169,160,0.15)' }}>
                <div className="text-3xl font-black mb-1" style={{ color: '#18A9A0', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {m.val}
                </div>
                <div className="text-white/45 text-xs">{m.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {items.map((item, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <GlassCard className="p-6 h-full flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(24,169,160,0.12)', border: '1px solid rgba(24,169,160,0.2)' }}>
                    <span style={{ color: '#18A9A0' }}>{item.icon}</span>
                  </div>
                  <h3 className="font-bold text-white text-sm leading-snug"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {item.title}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {item.features.map((f, j) => <Ci key={j} text={f} />)}
                </ul>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// IA CLÍNICA
// ══════════════════════════════════════════════════════════════════════════════
function IASection() {
  return (
    <section style={{ background: '#F5F8FC' }} className="py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left copy */}
          <div>
            <SectionTitle
              kicker="Inteligencia Artificial Clínica"
              title="La IA que documenta mientras tú atiendes"
              subtitle="SARAI escucha, transcribe y estructura automáticamente la historia clínica con asistencia por voz y texto, dejando al profesional enfocado en el paciente."
              center={false}
            />
            <FadeIn delay={0.15}>
              <ul className="space-y-3 mb-8">
                {[
                  'Asistente por voz y texto en tiempo real',
                  'Transcripción automática y estructuración de la historia clínica',
                  'Sugerencias de diagnóstico y plan de manejo basadas en IA',
                  'Informes gerenciales con lenguaje natural (tipo Power BI)',
                  'Alertas clínicas predictivas por perfil de paciente',
                  'Compatibilidad con dictado médico y reconocimiento de voz',
                ].map((item, i) => <Ci key={i} text={item} light={false} />)}
              </ul>
            </FadeIn>
          </div>

          {/* Right: IA mockup */}
          <FadeIn delay={0.2}>
            <div className="rounded-3xl p-6 relative overflow-hidden"
              style={{ background: 'linear-gradient(140deg,#1C2E4A 0%,#0e1b30 100%)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 32px 64px rgba(0,0,0,0.3)' }}>

              {/* Chat-style UI */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/8">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#18A9A0,#2E6CB5)' }}>
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>SARAI IA Clínica</div>
                  <div className="text-white/35 text-[10px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    En línea
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Doctor voice */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-md text-white/80 text-xs leading-relaxed"
                    style={{ background: 'rgba(46,108,181,0.35)', border: '1px solid rgba(46,108,181,0.2)' }}>
                    <div className="flex items-center gap-1.5 mb-1 text-white/40 text-[9px]">
                      <Mic className="w-3 h-3" /> Voz del médico
                    </div>
                    "Paciente masculino, 58 años, refiere dolor torácico opresivo de 4 horas de evolución, irradiado a brazo izquierdo..."
                  </div>
                </div>

                {/* IA response */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tl-md text-white/75 text-xs leading-relaxed"
                    style={{ background: 'rgba(24,169,160,0.12)', border: '1px solid rgba(24,169,160,0.18)' }}>
                    <div className="flex items-center gap-1.5 mb-1.5 text-[9px]" style={{ color: '#18A9A0' }}>
                      <Brain className="w-3 h-3" /> SARAI IA · Análisis clínico
                    </div>
                    <p className="mb-2">Historia estructurada generada. <span className="text-white/50">CIE-10 sugerido:</span> <span style={{ color: '#18A9A0' }}>I21.9</span> — Infarto agudo de miocardio.</p>
                    <div className="text-[9px] text-white/40 flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" /> Solicitar ECG y troponinas según protocolo IAMEST.
                    </div>
                  </div>
                </div>

                {/* Power BI card */}
                <div className="rounded-xl p-3 mt-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 className="w-3.5 h-3.5" style={{ color: '#18A9A0' }} />
                    <span className="text-white/60 text-[10px] font-semibold">Informe gerencial generado</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Urgencias', 'Hospitaliz.', 'Recaudo'].map((l, i) => (
                      <div key={i} className="rounded-lg p-1.5 text-center" style={{ background: 'rgba(24,169,160,0.08)' }}>
                        <div className="text-white/70 font-bold text-xs" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {['84%', '92%', '$2.8M'][i]}
                        </div>
                        <div className="text-white/30 text-[8px]">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SERVICES SECTION
// ══════════════════════════════════════════════════════════════════════════════
function ServicesSection() {
  const categories = [
    {
      icon: <Stethoscope className="w-5 h-5" />,
      title: 'Atención Asistencial',
      color: '#18A9A0',
      items: [
        'Urgencias y triage',
        'Hospitalización / UCI / Home Care',
        'Cirugías y salas quirúrgicas',
        'Consulta externa',
        'Apoyos diagnósticos',
        'Laboratorio clínico',
        'Odontología',
        'Programas crónicos (Nefrología / VIH)',
      ],
    },
    {
      icon: <Receipt className="w-5 h-5" />,
      title: 'Facturación y Recaudo',
      color: '#2E6CB5',
      items: [
        'Facturación electrónica (FEV)',
        'Radicación RIPS JSON',
        'Glosas y respuesta masiva',
        'Notas crédito/débito JSON',
        'Recuperación de rubros y cartera',
        'Tarifarios y gestión de contratos',
      ],
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: 'Administrativo y Financiero',
      color: '#18A9A0',
      items: [
        'Inventarios y activos',
        'Compras y proveedores',
        'Interfaz contable',
        'Cuentas por cobrar / pagar',
        'Tesorería y flujo de caja',
        'Honorarios médicos',
      ],
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: 'Inteligencia y Experiencia',
      color: '#2E6CB5',
      items: [
        'Informes con IA (Power BI)',
        'IA clínica por voz y texto',
        'App responsive multiplataforma',
        'Bot de WhatsApp / Smart Access',
      ],
    },
  ];

  return (
    <section id="servicios" style={{ background: 'linear-gradient(160deg,#0e1b30 0%,#0a1628 100%)' }}
      className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(46,108,181,0.07) 0%, transparent 65%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-5 md:px-8">
        <SectionTitle
          kicker="Alcance funcional — Hospital"
          title="Todo lo que necesita su institución"
          subtitle="Cobertura completa desde la admisión del paciente hasta el cierre financiero y los informes de dirección."
          light
        />
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {categories.map((cat, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <GlassCard className="p-6 h-full flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}25` }}>
                    <span style={{ color: cat.color }}>{cat.icon}</span>
                  </div>
                  <h3 className="font-bold text-white text-sm leading-snug"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {cat.title}
                  </h3>
                </div>
                <ul className="space-y-2 flex-1">
                  {cat.items.map((item, j) => <Ci key={j} text={item} />)}
                </ul>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PARTNER SECTION (Cliente Preferencial)
// ══════════════════════════════════════════════════════════════════════════════
function PartnerSection() {
  const benefits = [
    { icon: <DollarSign className="w-5 h-5" />, title: 'Bajo costo de implementación', desc: 'Inversión inicial reducida y escalonada, con retorno de valor desde las primeras semanas.' },
    { icon: <Users className="w-5 h-5" />, title: 'Dos desarrolladores dedicados', desc: 'Equipo exclusivo asignado al proyecto durante toda la implementación y estabilización.' },
    { icon: <Zap className="w-5 h-5" />, title: 'Desarrollos menores sin costo adicional', desc: 'Ajustes y personalizaciones propias del flujo de la institución incluidos en el acuerdo.' },
    { icon: <Award className="w-5 h-5" />, title: 'Tarifas competitivas en el mercado', desc: 'Modelo de negocio transparente, sin costos ocultos ni licencias por módulo.' },
    { icon: <Layers className="w-5 h-5" />, title: 'Integración total', desc: 'Conexión nativa con software contable, de laboratorio y plataformas externas.' },
    { icon: <HeartPulse className="w-5 h-5" />, title: 'Soporte prioritario 24/7', desc: 'Línea directa con el equipo técnico. Tiempo de respuesta garantizado en acuerdo SLA.' },
  ];

  return (
    <section style={{ background: '#EAF1F8' }} className="py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
          {/* Left */}
          <FadeIn>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
              style={{ background: 'rgba(24,169,160,0.1)', color: '#18A9A0', border: '1px solid rgba(24,169,160,0.22)' }}>
              Cliente preferencial · Aliado estratégico
            </span>
            <h2 className="font-black text-3xl md:text-4xl xl:text-5xl tracking-tight text-[#0E1B30] mb-5"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              No es una venta de software.<br />
              <span style={{ color: '#18A9A0' }}>Es una alianza.</span>
            </h2>
            <p className="text-[#1C2E4A]/55 text-base leading-relaxed mb-6 max-w-md">
              Clínica Médica Índigo recibirá el trato de cliente preferencial: acceso
              directo al equipo de desarrollo, beneficios exclusivos y una tarifa
              construida para una relación de largo plazo.
            </p>
            <button
              onClick={() => { const el = document.querySelector('#contacto'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200"
              style={{ background: 'linear-gradient(135deg,#18A9A0,#2E6CB5)', boxShadow: '0 6px 20px rgba(24,169,160,0.25)' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
            >
              Conversemos <ArrowRight className="w-4 h-4" />
            </button>
          </FadeIn>

          {/* Right: benefit cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <LightCard className="p-5 flex flex-col gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(24,169,160,0.1)', border: '1px solid rgba(24,169,160,0.18)' }}>
                    <span style={{ color: '#18A9A0' }}>{b.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0E1B30] text-sm mb-1"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{b.title}</h4>
                    <p className="text-[#1C2E4A]/50 text-xs leading-relaxed">{b.desc}</p>
                  </div>
                </LightCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODEL SECTION
// ══════════════════════════════════════════════════════════════════════════════
function ModelSection() {
  const modalities = [
    {
      tag: 'Modalidad A',
      title: 'Por usuario activo',
      desc: 'Tarifa mensual calculada sobre el número de usuarios habilitados en el sistema. Ideal para instituciones que quieren pagar exactamente por lo que usan.',
      features: [
        'Escala según el crecimiento del equipo',
        'Activación y desactivación de usuarios en tiempo real',
        'Sin costo por módulos no utilizados',
        'Implementación y capacitación incluidas',
      ],
      badge: '',
    },
    {
      tag: 'Modalidad B',
      title: 'Tarifa plana · Usuarios ilimitados',
      desc: 'Cuota mensual fija independientemente del número de usuarios activos. La opción preferida para instituciones en crecimiento.',
      features: [
        'Usuarios ilimitados sin costo adicional',
        'Módulos sin restricción de acceso',
        'Presupuesto fijo y predecible cada mes',
        'Migración y puesta en marcha incluidas',
      ],
      badge: 'Recomendado',
    },
  ];

  return (
    <section id="modelo" style={{ background: 'linear-gradient(160deg,#0e1b30 0%,#091220 100%)' }}
      className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(24,169,160,0.07) 0%, transparent 65%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-5 md:px-8">
        <SectionTitle
          kicker="Modelo de implementación"
          title="Flexible. Predecible. Sin sorpresas."
          subtitle="Dos modalidades pensadas para adaptarse al tamaño y la etapa de su institución, con un costo de implementación inicial único."
          light
        />
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {modalities.map((m, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <div
                className="rounded-2xl p-7 h-full flex flex-col relative overflow-hidden transition-all duration-300"
                style={{
                  background: m.badge ? 'linear-gradient(145deg,rgba(24,169,160,0.12) 0%,rgba(46,108,181,0.08) 100%)' : 'rgba(28,46,74,0.45)',
                  border: m.badge ? '1px solid rgba(24,169,160,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {m.badge && (
                  <span className="absolute top-5 right-5 text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: '#18A9A0', color: 'white' }}>
                    {m.badge}
                  </span>
                )}
                <span className="text-[10px] font-semibold tracking-widest uppercase mb-3 block" style={{ color: '#18A9A0' }}>
                  {m.tag}
                </span>
                <h3 className="text-xl font-black text-white mb-3 leading-tight"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {m.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed mb-5">{m.desc}</p>
                <ul className="space-y-2.5 flex-1">
                  {m.features.map((f, j) => <Ci key={j} text={f} />)}
                </ul>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.3} className="text-center mt-10">
          <button
            onClick={() => { const el = document.querySelector('#contacto'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white text-sm transition-all duration-200"
            style={{ border: '1px solid rgba(24,169,160,0.4)', background: 'rgba(24,169,160,0.1)', color: '#18A9A0' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(24,169,160,0.18)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(24,169,160,0.1)'; e.currentTarget.style.transform = 'none'; }}
          >
            Solicitar cotización personalizada <ArrowRight className="w-4 h-4" />
          </button>
        </FadeIn>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE SECTION (Timeline)
// ══════════════════════════════════════════════════════════════════════════════
function ComplianceSection() {
  const phases = [
    {
      phase: 'Fase 1 · Activo',
      color: '#18A9A0',
      status: 'En producción',
      items: [
        'Facturación electrónica (FEV) — DIAN',
        'Radicación RIPS JSON individual y masiva',
        'Gestión de glosas y notas de ajuste',
        'Habeas Data (Ley 1581 de 2012)',
        'Módulos clínicos y administrativos base',
      ],
    },
    {
      phase: 'Fase 2 · En desarrollo',
      color: '#2E6CB5',
      status: 'Implementación activa',
      items: [
        'Res. 948 de 2026 — nuevas disposiciones',
        'CUCON / SIIFA — facturación electrónica salud',
        'SOAT — registro SIRAS · campo U12',
        'Interoperabilidad IHCE / HL7 FHIR',
        'Código Vida — identificación de pacientes',
      ],
    },
    {
      phase: 'Fase 3 · Roadmap',
      color: '#1C2E4A',
      status: 'Próxima versión',
      items: [
        'ISO 27001 — Certificación en preparación',
        'Historia Clínica Electrónica Interoperable (HCEI)',
        'Integración con plataformas MIPRES y SIVIGILA',
        'Portal del paciente y teleconsulta integrada',
      ],
    },
  ];

  return (
    <section id="cumplimiento" style={{ background: '#F5F8FC' }} className="py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-5 md:px-8">
        <SectionTitle
          kicker="Cumplimiento e interoperabilidad"
          title="Normativa vigente y hoja de ruta"
          subtitle="Compromiso de actualización permanente con la normatividad colombiana e interoperabilidad con los sistemas del sector salud."
        />

        <div className="relative">
          {/* Vertical line */}
          <div className="hidden md:block absolute left-[calc(50%-1px)] top-0 bottom-0 w-px"
            style={{ background: 'linear-gradient(to bottom, #18A9A0, #2E6CB5, rgba(28,46,74,0.3))' }} />

          <div className="space-y-8 md:space-y-0">
            {phases.map((p, i) => (
              <FadeIn key={i} delay={i * 0.18}>
                <div className={`md:grid md:grid-cols-2 md:gap-16 items-start ${i % 2 === 1 ? '' : ''}`}>
                  {/* Content */}
                  <div className={`${i % 2 === 1 ? 'md:col-start-2 md:row-start-1' : ''} mb-8 md:mb-16`}>
                    <LightCard className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: p.color, boxShadow: `0 0 12px ${p.color}60` }} />
                        <div>
                          <span className="text-xs font-bold tracking-wide" style={{ color: p.color }}>{p.phase}</span>
                          <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: `${p.color}14`, color: p.color }}>{p.status}</span>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {p.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2.5 text-[#1C2E4A]/65 text-sm">
                            <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: p.color }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </LightCard>
                  </div>

                  {/* Timeline dot (desktop) */}
                  <div className={`hidden md:flex items-start justify-center ${i % 2 === 1 ? 'md:col-start-1 md:row-start-1' : 'md:col-start-2'}`}>
                    <div className="w-5 h-5 rounded-full border-4 mt-6 flex-shrink-0"
                      style={{ borderColor: p.color, background: '#F5F8FC', boxShadow: `0 0 16px ${p.color}40` }} />
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CTA FINAL
// ══════════════════════════════════════════════════════════════════════════════
function CTAFinal() {
  return (
    <section className="relative py-24 overflow-hidden"
      style={{ background: 'linear-gradient(160deg,#091220 0%,#0e1b30 100%)' }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(24,169,160,0.14) 0%, transparent 60%)', filter: 'blur(50px)' }} />
      </div>
      <div className="relative z-10 max-w-[800px] mx-auto px-5 md:px-8 text-center">
        <FadeIn>
          <span className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-6"
            style={{ background: 'rgba(24,169,160,0.12)', color: '#18A9A0', border: '1px solid rgba(24,169,160,0.25)' }}>
            El siguiente paso
          </span>
          <h2 className="text-4xl md:text-5xl xl:text-6xl font-black text-white leading-tight mb-5"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Lleva tu operación<br />
            <span style={{ background: 'linear-gradient(90deg,#18A9A0,#2E6CB5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              al siguiente nivel
            </span>
          </h2>
          <p className="text-white/50 text-lg mb-8 max-w-lg mx-auto">
            Agendemos una sesión de demostración personalizada con el equipo técnico y resolvamos todas sus preguntas.
          </p>
          <button
            onClick={() => { const el = document.querySelector('#contacto'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-white text-base transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18A9A0]"
            style={{ background: 'linear-gradient(135deg,#18A9A0 0%,#2E6CB5 100%)', boxShadow: '0 12px 40px rgba(24,169,160,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(24,169,160,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(24,169,160,0.35)'; }}
          >
            Solicitar demo <ArrowRight className="w-5 h-5" />
          </button>
        </FadeIn>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONTACT FORM
// ══════════════════════════════════════════════════════════════════════════════
function ContactForm() {
  const [form, setForm] = useState({ nombre: '', institucion: '', cargo: '', correo: '', telefono: '', mensaje: '' });
  const [sent, setSent]     = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const err: Record<string, string> = {};
    if (!form.nombre.trim())      err.nombre = 'Requerido';
    if (!form.institucion.trim()) err.institucion = 'Requerido';
    if (!form.correo.trim())      err.correo = 'Requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) err.correo = 'Correo inválido';
    if (!form.telefono.trim())    err.telefono = 'Requerido';
    return err;
  };

  const handleSend = () => {
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }
    setSent(true);
  };

  const fieldStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid rgba(28,46,74,0.12)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const Field = ({ k, label, type = 'text', placeholder = '', half = false }: {
    k: keyof typeof form; label: string; type?: string; placeholder?: string; half?: boolean;
  }) => (
    <div className={half ? 'sm:col-span-1' : 'sm:col-span-2'}>
      <label className="block text-[#1C2E4A]/60 text-xs font-semibold tracking-wide uppercase mb-1.5">{label}</label>
      <input
        type={type}
        value={form[k]}
        onChange={set(k)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-[#0E1B30] text-sm outline-none"
        style={fieldStyle}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(24,169,160,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24,169,160,0.08)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = errors[k] ? 'rgba(239,68,68,0.5)' : 'rgba(28,46,74,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
      />
      {errors[k] && <p className="text-red-500 text-xs mt-1">{errors[k]}</p>}
    </div>
  );

  return (
    <section id="contacto" style={{ background: '#EAF1F8' }} className="py-24 md:py-32">
      <div className="max-w-[720px] mx-auto px-5 md:px-8">
        <SectionTitle
          kicker="Solicitar demo"
          title="Cuéntenos sobre su institución"
          subtitle="Complete el formulario y un consultor se comunicará en menos de 24 horas."
        />

        <FadeIn delay={0.1}>
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl p-12 text-center"
                style={{ background: '#fff', border: '1px solid rgba(30,142,90,0.2)', boxShadow: '0 8px 32px rgba(30,142,90,0.1)' }}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(30,142,90,0.1)' }}>
                  <CheckCircle className="w-8 h-8" style={{ color: '#1E8E5A' }} />
                </div>
                <h3 className="text-2xl font-black text-[#0E1B30] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  ¡Solicitud enviada!
                </h3>
                <p className="text-[#1C2E4A]/55 text-sm">
                  Gracias, {form.nombre}. Un consultor de SARAI GROUP se comunicará<br />
                  con usted en las próximas 24 horas.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                className="rounded-3xl p-8 md:p-10"
                style={{ background: '#fff', border: '1px solid rgba(28,46,74,0.08)', boxShadow: '0 8px 40px rgba(28,46,74,0.08)' }}
              >
                <div className="grid sm:grid-cols-2 gap-5 mb-5">
                  <Field k="nombre"      label="Nombre completo"  half placeholder="Dr. Juan García" />
                  <Field k="institucion" label="Institución"       half placeholder="Clínica Médica Índigo" />
                  <Field k="cargo"       label="Cargo"             half placeholder="Gerente General" />
                  <Field k="correo"      label="Correo electrónico" half type="email" placeholder="gerencia@clinica.com.co" />
                  <Field k="telefono"    label="Teléfono / WhatsApp" half placeholder="+57 300 000 0000" />
                </div>
                <div className="mb-6">
                  <label className="block text-[#1C2E4A]/60 text-xs font-semibold tracking-wide uppercase mb-1.5">
                    Mensaje (opcional)
                  </label>
                  <textarea
                    value={form.mensaje}
                    onChange={set('mensaje')}
                    rows={4}
                    placeholder="Cuéntenos los principales retos que enfrenta actualmente..."
                    className="w-full px-4 py-3 rounded-xl text-[#0E1B30] text-sm outline-none resize-none"
                    style={fieldStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(24,169,160,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24,169,160,0.08)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(28,46,74,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSend}
                  className="w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18A9A0]"
                  style={{ background: 'linear-gradient(135deg,#18A9A0 0%,#2E6CB5 100%)', boxShadow: '0 8px 24px rgba(24,169,160,0.25)' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(24,169,160,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(24,169,160,0.25)'; }}
                >
                  <Send className="w-4 h-4" /> Enviar solicitud de demo
                </button>
                <p className="text-[#1C2E4A]/35 text-[10px] text-center mt-3">
                  Sus datos son tratados conforme a la Ley 1581 de 2012 (Habeas Data). Nunca los compartiremos con terceros.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </FadeIn>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════════════════════════════════════
function Footer() {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer style={{ background: '#091220', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-14">
        <div className="grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden" style={{ background: 'rgba(24,169,160,0.15)', border: '1px solid rgba(24,169,160,0.25)' }}>
                <img src={saraiLogo} alt="SARAI" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                SAR<span style={{ color: '#18A9A0' }}>AI</span>
              </span>
            </div>
            <p className="text-white/35 text-xs leading-relaxed mb-4">
              Sistema Ágil de Registro y Asistencia Inteligente.<br />
              Solución asistencial clínica para hospitales y<br />clínicas en Colombia.
            </p>
            <p className="text-white/25 text-[11px] font-semibold uppercase tracking-widest">
              SARAI GROUP
            </p>
          </div>

          {/* Nav */}
          <div>
            <h5 className="text-white/60 text-[10px] font-semibold tracking-widest uppercase mb-4">Solución</h5>
            <ul className="space-y-2.5">
              {[['#solucion','Plataforma'],['#beneficios','Beneficios'],['#servicios','Servicios'],['#modelo','Modelo'],['#cumplimiento','Cumplimiento']].map(([href,label]) => (
                <li key={href}>
                  <button onClick={() => scrollTo(href)}
                    className="text-white/40 hover:text-white/70 text-xs transition-colors text-left">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h5 className="text-white/60 text-[10px] font-semibold tracking-widest uppercase mb-4">Legal</h5>
            <ul className="space-y-2.5">
              {['Habeas Data · Ley 1581/2012','Política de privacidad','Términos de uso','Aviso de confidencialidad'].map((l) => (
                <li key={l}><span className="text-white/40 text-xs">{l}</span></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="text-white/60 text-[10px] font-semibold tracking-widest uppercase mb-4">Contacto</h5>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#18A9A0' }} />
                <span className="text-white/40 text-xs">info@clicksoluciones.com.co</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#18A9A0' }} />
                <span className="text-white/40 text-xs">+57 300 000 0000</span>
              </li>
              <li className="flex items-start gap-2">
                <Globe className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#18A9A0' }} />
                <span className="text-white/40 text-xs">clicksoluciones.com.co</span>
              </li>
              <li className="flex items-start gap-2">
                <Building2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#18A9A0' }} />
                <span className="text-white/40 text-xs">Colombia</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-white/20 text-[11px]">
            © 2026 SARAI GROUP. Todos los derechos reservados.
          </p>
          <p className="text-white/15 text-[10px] text-center sm:text-right">
            Propuesta confidencial — Uso exclusivo de Clínica Médica Índigo.<br />
            Prohibida su reproducción o distribución sin autorización expresa.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LANDING CONTENT (assembles all sections)
// ══════════════════════════════════════════════════════════════════════════════
function LandingContent() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <main>
        <HeroSection />
        <TrustBar />
        <ValueSection />
        <RecaudoSection />
        <IASection />
        <ServicesSection />
        <PartnerSection />
        <ModelSection />
        <ComplianceSection />
        <CTAFinal />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════════
export default function PropuestaIndigoPage() {
  useGoogleFonts();
  const [auth, setAuth] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {auth ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LandingContent />
        </motion.div>
      ) : (
        <motion.div
          key="gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PasswordGate onSuccess={() => setAuth(true)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
