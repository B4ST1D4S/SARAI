/**
 * PropuestaIndigoPage.tsx
 * Propuesta Comercial SARAI – Clínica Médica Índigo
 * SARAI GROUP · 2026
 *
 * Diseño: idéntico al sistema SARAI (dark navy + cyan #00B4D8 + purple #7B2FBE)
 * Acceso: correo + contraseña confidenciales
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import emailjs from '@emailjs/browser';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import {
  TrendingUp, Zap, Smartphone, BarChart2, FileText,
  Brain, Mic, CheckCircle, Mail, Building2,
  Send, Lock, Eye, EyeOff, ArrowRight, HeartPulse,
  Stethoscope, Receipt, DollarSign,
  Wallet, Award, Globe, ChevronRight,
  Menu, X, AlertCircle, Layers, Users, Database,
  Shield, LogOut
} from 'lucide-react';
import NeuralCanvas from '../components/NeuralCanvas';
import saraiLogo from '../assets/logo1.png';

/* ─── Auth ─────────────────────────────────────────────────────────────────── */
const VALID_EMAIL = 'gerencia@clinicamedicaindigo.com.co';
const VALID_PASS  = 'indigo2026*';

/* ─── Google Fonts ─────────────────────────────────────────────────────────── */
function useGoogleFonts() {
  useEffect(() => {
    const id = 'sarai-prop-fonts';
    if (document.getElementById(id)) return;
    const l = document.createElement('link');
    l.id = id; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(l);
  }, []);
}

/* ─── SARAI logos (copied from AuthPage) ───────────────────────────────────── */
function MedicalCross() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
      <defs>
        <radialGradient id="pcCrossGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#00B4D8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#00B4D8" stopOpacity="0"    />
        </radialGradient>
        <filter id="pcBlur8"><feGaussianBlur stdDeviation="8" /></filter>
        <filter id="pcBlur3"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <circle cx="100" cy="100" r="90" stroke="#00B4D8" strokeWidth="0.5" strokeOpacity="0.25" />
      <circle cx="100" cy="100" r="72" stroke="#00B4D8" strokeWidth="0.4" strokeOpacity="0.18" />
      <ellipse cx="100" cy="100" rx="70" ry="70" fill="url(#pcCrossGlow)" filter="url(#pcBlur8)" />
      <rect x="82" y="42" width="36" height="116" rx="8" fill="#00B4D8" opacity="0.12" filter="url(#pcBlur3)" />
      <rect x="42" y="82" width="116" height="36" rx="8" fill="#00B4D8" opacity="0.12" filter="url(#pcBlur3)" />
      <rect x="84" y="44" width="32" height="112" rx="7" fill="#00B4D8" opacity="0.55" />
      <rect x="44" y="84" width="112" height="32" rx="7" fill="#00B4D8" opacity="0.55" />
      <polyline points="72,100 82,100 88,82 96,118 104,90 110,100 128,100"
        stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      {[[100,44],[156,100],[100,156],[44,100]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill="#00E5FF" opacity="0.9" />
      ))}
    </svg>
  );
}

function SaraiNodeLogo() {
  const nodes: [number,number][] = [[30,8],[52,18],[14,26],[44,36],[26,48],[50,52],[12,56]];
  const edges = [[0,1],[0,2],[1,3],[2,3],[2,4],[3,4],[3,5],[4,6],[5,6]];
  return (
    <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none">
      <defs>
        <linearGradient id="pcNg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#7B2FBE" />
          <stop offset="100%" stopColor="#00B4D8" />
        </linearGradient>
      </defs>
      {edges.map(([a,b],i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="url(#pcNg)" strokeWidth="1.4" opacity="0.8" />
      ))}
      {nodes.map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r={i===0||i===6?4:3} fill="url(#pcNg)" opacity="0.95" />
      ))}
    </svg>
  );
}

/* ─── Scroll fade-in ────────────────────────────────────────────────────────── */
function FadeIn({ children, delay=0, className='' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-64px' });
  const reduced = useReducedMotion();
  return (
    <motion.div ref={ref}
      initial={{ opacity: reduced?1:0, y: reduced?0:24 }}
      animate={inView ? { opacity:1, y:0 } : {}}
      transition={{ duration:0.6, delay, ease:[0.22,1,0.36,1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

/* ─── Section title ─────────────────────────────────────────────────────────── */
function SectionTitle({ kicker, title, subtitle, light=false, center=true }: {
  kicker:string; title:string; subtitle?:string; light?:boolean; center?:boolean;
}) {
  return (
    <FadeIn className={`mb-12 md:mb-16 ${center?'text-center':''}`}>
      <span className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
        style={{ background:'rgba(0,180,216,0.1)', color:'#00B4D8', border:'1px solid rgba(0,180,216,0.25)' }}>
        {kicker}
      </span>
      <h2 className={`font-black text-3xl md:text-4xl xl:text-5xl tracking-tight leading-tight mb-4 ${light?'text-white':'text-[#0A1628]'}`}
        style={{ fontFamily:"'Space Grotesk',sans-serif" }}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-base md:text-lg ${center?'max-w-2xl mx-auto':'max-w-2xl'} ${light?'text-white/60':'text-[#0A1628]/55'}`}>
          {subtitle}
        </p>
      )}
    </FadeIn>
  );
}

/* ─── Check item ─────────────────────────────────────────────────────────────── */
function Ci({ text, light=true, checked=true }: { text:string; light?:boolean; checked?:boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      {checked ? (
        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color:'#1E8E5A' }} />
      ) : (
        <span className="w-4 h-4 mt-0.5 flex-shrink-0 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full border flex-shrink-0"
            style={{ borderColor: light ? 'rgba(255,255,255,0.2)' : 'rgba(10,22,40,0.2)' }} />
        </span>
      )}
      <span className={`text-sm leading-relaxed ${checked ? '' : 'opacity-45'} ${light?'text-white/70':'text-[#0A1628]/70'}`}>
        {text}
      </span>
    </li>
  );
}

/* ─── Glass card ─────────────────────────────────────────────────────────────── */
function GlassCard({ children, className='' }: { children:React.ReactNode; className?:string }) {
  return (
    <div className={`rounded-2xl transition-all duration-300 hover:-translate-y-1 ${className}`}
      style={{
        background:'rgba(10,22,40,0.65)',
        backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
        border:'1px solid rgba(0,180,216,0.14)',
        boxShadow:'0 8px 32px rgba(0,0,0,0.28)',
      }}
      onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(0,180,216,0.4)')}
      onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(0,180,216,0.14)')}>
      {children}
    </div>
  );
}

/* ─── Light card ─────────────────────────────────────────────────────────────── */
function LightCard({ children, className='' }: { children:React.ReactNode; className?:string }) {
  return (
    <div className={`rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1 ${className}`}
      style={{ border:'1px solid rgba(10,22,40,0.08)', boxShadow:'0 4px 24px rgba(10,22,40,0.07)' }}
      onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 16px 40px rgba(0,180,216,0.12)'; e.currentTarget.style.borderColor='rgba(0,180,216,0.28)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.boxShadow='0 4px 24px rgba(10,22,40,0.07)'; e.currentTarget.style.borderColor='rgba(10,22,40,0.08)'; }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PASSWORD GATE — diseño idéntico al login SARAI
═══════════════════════════════════════════════════════════════════════════════ */
function PasswordGate({ onSuccess }: { onSuccess:()=>void }) {
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
      if (email.trim().toLowerCase() === VALID_EMAIL && password === VALID_PASS) {
        onSuccess();
      } else {
        setError('Usuario o contraseña incorrectos');
      }
      setLoading(false);
    }, 700);
  }, [email, password, loading, onSuccess]);

  const onKey = (e: React.KeyboardEvent) => { if (e.key==='Enter') handleLogin(); };

  const inputBase: React.CSSProperties = {
    background:'rgba(6,13,27,0.7)',
    border:'1px solid rgba(0,180,216,0.15)',
    transition:'border-color 0.2s',
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background:'linear-gradient(135deg,#060D1B 0%,#0A1628 50%,#080E1E 100%)' }}>

      {/* Red neuronal fija */}
      <NeuralCanvas />

      {/* Blobs de gradiente */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background:'radial-gradient(circle,#7B2FBE 0%,transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[5%] w-[600px] h-[600px] rounded-full opacity-15"
          style={{ background:'radial-gradient(circle,#00B4D8 0%,transparent 70%)' }} />
        <div className="absolute top-[30%] right-[8%] w-[380px] h-[380px] rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#1E40AF 0%,transparent 70%)' }} />
      </div>

      {/* Cruz médica decorativa (derecha) */}
      <div className="absolute right-[4%] top-1/2 -translate-y-1/2 w-[320px] h-[320px] opacity-40 pointer-events-none hidden lg:block">
        <MedicalCross />
      </div>

      {/* Tarjeta */}
      <motion.div
        initial={{ opacity:0, y:28 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.55, ease:'easeOut' }}
        className="relative w-full max-w-sm mx-4 z-10"
      >
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <SaraiNodeLogo />
          </div>
          <h1 className="text-4xl font-extrabold tracking-widest text-white" style={{ letterSpacing:'0.2em' }}>
            SARAI
          </h1>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mt-1" style={{ color:'#00B4D8' }}>
            Asistente Clínico Inteligente
          </p>
          {/* EKG */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-12 opacity-40" style={{ background:'#00B4D8' }} />
            <svg viewBox="0 0 80 20" className="w-20 h-4" fill="none">
              <polyline points="0,10 14,10 20,3 26,17 32,5 38,10 80,10"
                stroke="#00B4D8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
            </svg>
            <div className="h-px w-12 opacity-40" style={{ background:'#00B4D8' }} />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 shadow-2xl"
          style={{
            background:'rgba(10,22,40,0.75)',
            backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
            border:'1px solid rgba(0,180,216,0.18)',
            boxShadow:'0 0 40px rgba(0,180,216,0.08),0 20px 60px rgba(0,0,0,0.5)',
          }}>
          <h2 className="text-lg font-semibold text-white mb-1">Bienvenido</h2>
          <p className="text-sm mb-6" style={{ color:'rgba(148,163,184,0.8)' }}>
            Propuesta comercial confidencial — acceso exclusivo
          </p>

          <AnimatePresence>
            {error && (
              <motion.div key="err"
                initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="flex items-center gap-2 mb-5 px-4 py-3 rounded-lg text-sm"
                style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#F87171' }}
                role="alert">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {/* Correo */}
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                style={{ color:'rgba(148,163,184,0.7)' }}>Correo electrónico</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color:'rgba(100,180,210,0.5)' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={onKey}
                  placeholder="gerencia@clinica.com.co" autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none transition"
                  style={inputBase}
                  onFocus={e=>(e.target.style.borderColor='rgba(0,180,216,0.55)')}
                  onBlur={e=>(e.target.style.borderColor='rgba(0,180,216,0.15)')} />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                style={{ color:'rgba(148,163,184,0.7)' }}>Contraseña</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color:'rgba(100,180,210,0.5)' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input type={show?'text':'password'} value={password}
                  onChange={e=>setPassword(e.target.value)} onKeyDown={onKey}
                  placeholder="••••••••••" autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none transition"
                  style={inputBase}
                  onFocus={e=>(e.target.style.borderColor='rgba(0,180,216,0.55)')}
                  onBlur={e=>(e.target.style.borderColor='rgba(0,180,216,0.15)')} />
                <button type="button" tabIndex={-1} onClick={()=>setShow(v=>!v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition"
                  style={{ color:'rgba(100,180,210,0.5)' }}
                  aria-label={show?'Ocultar':'Mostrar'}>
                  {show
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>

            <button type="button" onClick={handleLogin} disabled={loading||!email||!password}
              className="w-full py-3 mt-2 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              style={{ background:'linear-gradient(90deg,#0077B6 0%,#00B4D8 100%)', boxShadow:'0 4px 24px rgba(0,180,216,0.3)' }}
              onMouseEnter={e=>{ if(!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform='none'; }}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Verificando...
                  </span>
                : 'Iniciar Sesion'
              }
            </button>
          </div>
        </div>

        <p className="text-center mt-5 text-xs" style={{ color:'rgba(100,116,139,0.7)' }}>
          Documento confidencial · Solo para uso de Gerencia
        </p>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════════════════════════════ */
function Navbar({ onLogout }: { onLogout: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive:true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const go = (href:string) => { setMobileOpen(false); document.querySelector(href)?.scrollIntoView({ behavior:'smooth' }); };

  const links = [
    { l:'Solución', h:'#solucion' },{ l:'Beneficios', h:'#beneficios' },
    { l:'Servicios', h:'#servicios' },{ l:'Modelo', h:'#modelo' },
    { l:'Cumplimiento', h:'#cumplimiento' },{ l:'Contacto', h:'#contacto' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(6,13,27,0.9)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0,180,216,0.1)' : '1px solid transparent',
          boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
        }}>
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0"
              style={{ background:'rgba(0,180,216,0.12)', border:'1px solid rgba(0,180,216,0.25)' }}>
              <img src={saraiLogo} alt="SARAI" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-widest text-white"
                style={{ fontFamily:"'Space Grotesk',sans-serif", letterSpacing:'0.15em' }}>
                SARAI
              </span>
              <span className="hidden sm:block text-[9px] tracking-widest uppercase leading-none ml-0.5"
                style={{ color:'#00B4D8' }}>
                Sistema Asistencial
              </span>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map(l => (
              <button key={l.l} onClick={() => go(l.h)}
                className="px-3.5 py-2 text-sm transition-all duration-150 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                style={{ color:'rgba(148,163,184,0.7)' }}
                onMouseEnter={e=>{ e.currentTarget.style.color='#fff'; e.currentTarget.style.background='rgba(0,180,216,0.07)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.color='rgba(148,163,184,0.7)'; e.currentTarget.style.background='transparent'; }}>
                {l.l}
              </button>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <button onClick={() => go('#contacto')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200"
              style={{ background:'linear-gradient(90deg,#0077B6 0%,#00B4D8 100%)', boxShadow:'0 4px 16px rgba(0,180,216,0.3)' }}
              onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-1px)')}
              onMouseLeave={e=>(e.currentTarget.style.transform='none')}>
              Solicitar demo
            </button>
            <button onClick={onLogout} title="Cerrar sesión" aria-label="Cerrar sesión"
              className="p-2 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              style={{ color:'rgba(148,163,184,0.7)', border:'1px solid rgba(0,180,216,0.15)' }}
              onMouseEnter={e=>{ e.currentTarget.style.color='#fff'; e.currentTarget.style.background='rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.3)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.color='rgba(148,163,184,0.7)'; e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(0,180,216,0.15)'; }}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button className="lg:hidden p-2 -mr-2 transition-colors text-white/70 hover:text-white"
            onClick={() => setMobileOpen(v=>!v)} aria-label="Menú">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div key="mob" initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }}
            exit={{ opacity:0,y:-10 }} transition={{ duration:0.2 }}
            className="fixed top-16 left-0 right-0 z-40 lg:hidden p-4"
            style={{ background:'rgba(6,13,27,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(0,180,216,0.1)' }}>
            <nav className="flex flex-col gap-1 mb-4">
              {links.map(l => (
                <button key={l.l} onClick={() => go(l.h)}
                  className="text-left px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{ color:'rgba(148,163,184,0.7)' }}
                  onMouseEnter={e=>(e.currentTarget.style.color='#fff')}
                  onMouseLeave={e=>(e.currentTarget.style.color='rgba(148,163,184,0.7)')}>
                  {l.l}
                </button>
              ))}
            </nav>
            <button onClick={() => go('#contacto')} className="w-full py-3 rounded-xl text-sm font-semibold text-white mb-2"
              style={{ background:'linear-gradient(90deg,#0077B6 0%,#00B4D8 100%)' }}>
              Solicitar demo
            </button>
            <button onClick={onLogout}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ color:'rgba(248,113,113,0.9)', border:'1px solid rgba(239,68,68,0.25)', background:'rgba(239,68,68,0.06)' }}>
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════════════════════════════ */
function HeroSection() {
  const go = (h:string) => document.querySelector(h)?.scrollIntoView({ behavior:'smooth' });

  return (
    <section id="solucion" className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background:'linear-gradient(135deg,#060D1B 0%,#0A1628 50%,#080E1E 100%)' }}>

      <NeuralCanvas opacity={0.35} nodeCount={110} />

      {/* Blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background:'radial-gradient(circle,#7B2FBE 0%,transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[5%] w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#00B4D8 0%,transparent 70%)' }} />
      </div>

      {/* Cruz médica fondo derecha */}
      <div className="absolute right-[2%] top-1/2 -translate-y-1/2 w-[280px] h-[280px] opacity-20 pointer-events-none hidden xl:block">
        <MedicalCross />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-5 md:px-8 pt-28 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
          {/* Left */}
          <div>
            <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
              transition={{ duration:0.6, delay:0.1 }}>
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full mb-6"
                style={{ background:'rgba(0,180,216,0.1)', color:'#00B4D8', border:'1px solid rgba(0,180,216,0.28)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:'#00B4D8' }} />
                Sistema Asistencial Inteligente · Hospital
              </span>
            </motion.div>

            <motion.h1 initial={{ opacity:0,y:24 }} animate={{ opacity:1,y:0 }}
              transition={{ duration:0.7, delay:0.2 }}
              className="text-4xl sm:text-5xl xl:text-6xl font-black text-white leading-[1.08] tracking-tight mb-6"
              style={{ fontFamily:"'Space Grotesk',sans-serif" }}>
              Maximiza tu{' '}
              <span style={{ background:'linear-gradient(90deg,#00B4D8,#7B2FBE)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                recaudo
              </span>{' '}
              y optimiza el tiempo de tus procesos
            </motion.h1>

            <motion.p initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
              transition={{ duration:0.6, delay:0.35 }}
              className="text-lg leading-relaxed mb-8 max-w-xl" style={{ color:'rgba(148,163,184,0.75)' }}>
              Sistema asistencial clínico 100% responsive con facturación electrónica,
              RIPS JSON, gestión de glosas e inteligencia artificial para hospitales y
              clínicas en Colombia.
            </motion.p>

            <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }}
              transition={{ duration:0.5, delay:0.5 }} className="flex flex-wrap gap-3">
              <button onClick={() => go('#contacto')}
                className="px-6 py-3.5 rounded-xl font-semibold text-white text-sm flex items-center gap-2 transition-all duration-200"
                style={{ background:'linear-gradient(90deg,#0077B6 0%,#00B4D8 100%)', boxShadow:'0 8px 28px rgba(0,180,216,0.32)' }}
                onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-2px)')}
                onMouseLeave={e=>(e.currentTarget.style.transform='none')}>
                Solicitar demo <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => go('#servicios')}
                className="px-6 py-3.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all duration-200"
                style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(0,180,216,0.2)', color:'rgba(148,163,184,0.8)' }}
                onMouseEnter={e=>{ e.currentTarget.style.background='rgba(0,180,216,0.08)'; e.currentTarget.style.color='#fff'; }}
                onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='rgba(148,163,184,0.8)'; }}>
                Ver servicios <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ duration:0.6, delay:0.7 }}
              className="flex flex-wrap gap-6 mt-10 pt-8"
              style={{ borderTop:'1px solid rgba(0,180,216,0.12)' }}>
              {[
                { val:'100%', label:'Normativa DIAN / RIPS' },
                { val:'IA',   label:'Clínica por voz y texto' },
              ].map((s,i) => (
                <div key={i}>
                  <div className="text-2xl font-black text-white" style={{ fontFamily:"'Space Grotesk',sans-serif", color: s.val==='IA'?'#00B4D8':'white' }}>
                    {s.val}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color:'rgba(148,163,184,0.5)' }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: dashboard mockup */}
          <motion.div initial={{ opacity:0, x:30, scale:0.97 }} animate={{ opacity:1, x:0, scale:1 }}
            transition={{ duration:0.8, delay:0.4 }}>
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Dashboard mockup ───────────────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="relative">
      <div className="relative rounded-2xl overflow-hidden"
        style={{
          background:'linear-gradient(140deg,#0D1F35 0%,#060D1B 100%)',
          border:'1px solid rgba(0,180,216,0.15)',
          boxShadow:'0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,180,216,0.07)',
        }}>
        {/* Chrome */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/5"
          style={{ background:'rgba(0,0,0,0.3)' }}>
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
          <div className="flex-1 mx-3 h-4 rounded bg-white/5 flex items-center px-2">
            <span className="text-[9px] font-mono" style={{ color:'rgba(0,180,216,0.3)' }}>
              sarai.clinicaindigo.co/dashboard
            </span>
          </div>
        </div>
        <div className="p-4">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { l:'Recaudo/mes', v:'$248M',  c:'#00B4D8' },
              { l:'Pacientes',  v:'1 284',   c:'#0077B6' },
              { l:'Glosas evit', v:'−42%',   c:'#1E8E5A' },
            ].map((s,i) => (
              <div key={i} className="rounded-xl p-2.5 border border-white/5"
                style={{ background:'rgba(255,255,255,0.03)' }}>
                <div className="w-4 h-1 rounded mb-1.5" style={{ background:s.c, opacity:0.6 }} />
                <div className="text-white font-bold text-xs">{s.v}</div>
                <div className="text-white/35 text-[8px]">{s.l}</div>
              </div>
            ))}
          </div>
          {/* Chart */}
          <div className="rounded-xl p-3 mb-2.5 border border-white/5"
            style={{ background:'rgba(255,255,255,0.02)' }}>
            <svg viewBox="0 0 220 56" className="w-full" style={{ height:'52px' }}>
              <defs>
                <linearGradient id="dcg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#00B4D8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#00B4D8" stopOpacity="0"    />
                </linearGradient>
              </defs>
              <path d="M0,48 C18,44 28,20 48,22 C68,24 78,36 100,28 C122,20 130,8 155,11 C175,14 185,26 220,18 L220,56 L0,56 Z"
                fill="url(#dcg)" />
              <path d="M0,48 C18,44 28,20 48,22 C68,24 78,36 100,28 C122,20 130,8 155,11 C175,14 185,26 220,18"
                fill="none" stroke="#00B4D8" strokeWidth="1.4" strokeLinecap="round" />
              {[[48,22],[100,28],[155,11]].map(([x,y],i)=>(
                <circle key={i} cx={x} cy={y} r="2.5" fill="#00B4D8" />
              ))}
            </svg>
          </div>
          {/* Patients */}
          <div className="space-y-1.5">
            {[
              { n:'Carlos M.', t:'Urgencias',      s:'En atención', c:'#00B4D8' },
              { n:'Ana G.',    t:'Consulta Ext.',   s:'Facturado',   c:'#1E8E5A' },
              { n:'Luis P.',   t:'Hospitalización', s:'Egresado',    c:'#0077B6' },
            ].map((p,i)=>(
              <div key={i} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 border border-white/5"
                style={{ background:'rgba(255,255,255,0.025)' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[8px] flex-shrink-0"
                  style={{ background:p.c+'CC' }}>{p.n[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white/75 text-[9px] font-medium truncate">{p.n}</div>
                  <div className="text-white/30 text-[8px]">{p.t}</div>
                </div>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background:p.c+'22', color:p.c }}>{p.s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute inset-[-20%] -z-10 rounded-full blur-3xl pointer-events-none"
        style={{ background:'radial-gradient(circle,rgba(0,180,216,0.1) 0%,transparent 65%)' }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TRUST BAR
═══════════════════════════════════════════════════════════════════════════════ */
function TrustBar() {
  return (
    <div style={{ background:'rgba(6,13,27,0.95)', borderTop:'1px solid rgba(0,180,216,0.1)', borderBottom:'1px solid rgba(0,180,216,0.1)' }}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-4">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {[
            { i:<FileText className="w-3.5 h-3.5"/>, l:'Res. 948 de 2026' },
            { i:<Receipt className="w-3.5 h-3.5"/>,  l:'FEV · RIPS JSON' },
            { i:<Building2 className="w-3.5 h-3.5"/>,l:'DIAN' },
            { i:<Shield className="w-3.5 h-3.5"/>,   l:'Habeas Data · Ley 1581/2012' },
            { i:<Award className="w-3.5 h-3.5"/>,    l:'ISO 27001 en preparación' },
          ].map((item,i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-medium" style={{ color:'rgba(148,163,184,0.45)' }}>
              <span style={{ color:'#00B4D8' }}>{item.i}</span>{item.l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   VALUE (4 cards)
═══════════════════════════════════════════════════════════════════════════════ */
function ValueSection() {
  const cards = [
    { icon:<TrendingUp className="w-6 h-6"/>, title:'Maximización del recaudo',       desc:'Facturación electrónica, RIPS y gestión de glosas integradas para reducir pérdidas y asegurar el cobro completo.', c:'#00B4D8' },
    { icon:<Zap className="w-6 h-6"/>,        title:'Optimización de procesos',        desc:'Flujos clínicos y administrativos integrados que eliminan reprocesos, tiempos muertos y cargas manuales.', c:'#0077B6' },
    { icon:<Smartphone className="w-6 h-6"/>, title:'100 % Responsive',               desc:'Acceso pleno desde computador, tablet o celular. Mismo rendimiento en cada punto de la institución.', c:'#00B4D8' },
    { icon:<BarChart2 className="w-6 h-6"/>,  title:'Informes gerenciales con IA',     desc:'Tableros tipo Power BI en tiempo real. Decisiones basadas en datos, no en suposiciones.', c:'#0077B6' },
  ];
  return (
    <section id="beneficios" className="py-24 md:py-32" style={{ background:'#F0F6FA' }}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-8">
        <SectionTitle kicker="Por qué SARAI" title="Valor que se refleja en cada proceso"
          subtitle="Cuatro pilares que transforman la operación de su institución, desde la atención hasta el cierre financiero." />
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {cards.map((c,i) => (
            <FadeIn key={i} delay={i*0.1}>
              <LightCard className="p-7 h-full flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background:`${c.c}12`, border:`1px solid ${c.c}28` }}>
                  <span style={{ color:c.c }}>{c.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#060D1B] text-base mb-2 leading-snug"
                    style={{ fontFamily:"'Space Grotesk',sans-serif" }}>{c.title}</h3>
                  <p className="text-[#0A1628]/55 text-sm leading-relaxed">{c.desc}</p>
                </div>
              </LightCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   RECAUDO
═══════════════════════════════════════════════════════════════════════════════ */
function RecaudoSection() {
  const items = [
    { icon:<Receipt className="w-5 h-5"/>,   title:'Facturación Electrónica (FEV)',    features:['Individual y masiva','Integración directa DIAN','Notas crédito/débito JSON','Validación en tiempo real'] },
    { icon:<Database className="w-5 h-5"/>,  title:'Radicación RIPS JSON',             features:['Individual y masiva','Validación previa automática','Trazabilidad por radicado','Reenvío automático en error'] },
    { icon:<AlertCircle className="w-5 h-5"/>,title:'Gestión de Glosas',              features:['Registro y clasificación','Respuesta masiva','Histórico por asegurador','Alertas de vencimiento'] },
    { icon:<Wallet className="w-5 h-5"/>,    title:'Recuperación de Cartera',          features:['Seguimiento por factura','Estados de cuenta','Aging report','Integración contable'] },
  ];
  return (
    <section style={{ background:'linear-gradient(160deg,#0A1628 0%,#060D1B 100%)' }} className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background:'radial-gradient(circle,rgba(0,180,216,0.07) 0%,transparent 65%)', filter:'blur(60px)' }} />
      <div className="relative z-10 max-w-[1200px] mx-auto px-5 md:px-8">
        <SectionTitle kicker="Recaudo y facturación" title="Menos glosas. Más recaudo. Cero reprocesos."
          subtitle="Módulos especializados que cubren todo el ciclo de facturación y recuperación financiera." light />
        <FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
            {[{v:'−42%',l:'Glosas evitadas'},{v:'+28%',l:'Recaudo efectivo'},{v:'−65%',l:'Tiempo radicación'},{v:'100%',l:'Trazabilidad DIAN'}].map((m,i)=>(
              <div key={i} className="text-center rounded-2xl py-5 px-4"
                style={{ background:'rgba(0,180,216,0.07)', border:'1px solid rgba(0,180,216,0.15)' }}>
                <div className="text-3xl font-black mb-1" style={{ color:'#00B4D8', fontFamily:"'Space Grotesk',sans-serif" }}>{m.v}</div>
                <div className="text-xs" style={{ color:'rgba(148,163,184,0.5)' }}>{m.l}</div>
              </div>
            ))}
          </div>
        </FadeIn>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {items.map((item,i)=>(
            <FadeIn key={i} delay={i*0.1}>
              <GlassCard className="p-6 h-full flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background:'rgba(0,180,216,0.1)', border:'1px solid rgba(0,180,216,0.2)' }}>
                    <span style={{ color:'#00B4D8' }}>{item.icon}</span>
                  </div>
                  <h3 className="font-bold text-white text-sm leading-snug"
                    style={{ fontFamily:"'Space Grotesk',sans-serif" }}>{item.title}</h3>
                </div>
                <ul className="space-y-2">{item.features.map((f,j)=><Ci key={j} text={f}/>)}</ul>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   IA CLÍNICA
═══════════════════════════════════════════════════════════════════════════════ */
function IASection() {
  return (
    <section style={{ background:'#F0F6FA' }} className="py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionTitle kicker="Inteligencia Artificial Clínica" title="La IA que documenta mientras tú atiendes"
              subtitle="SARAI transcribe y estructura automáticamente la historia clínica con asistencia por voz y texto." center={false} />
            <FadeIn delay={0.15}>
              <ul className="space-y-3 mb-8">
                {['Asistente por voz y texto en tiempo real','Transcripción automática y estructuración de HC','Sugerencias de diagnóstico basadas en IA',
                  'Informes gerenciales con lenguaje natural (tipo Power BI)','Alertas clínicas predictivas por perfil de paciente',
                  'Compatible con dictado médico y reconocimiento de voz'].map((t,i)=><Ci key={i} text={t} light={false}/>)}
              </ul>
            </FadeIn>
          </div>
          <FadeIn delay={0.2}>
            <div className="rounded-3xl p-6 relative overflow-hidden"
              style={{ background:'linear-gradient(140deg,#0D1F35 0%,#060D1B 100%)', border:'1px solid rgba(0,180,216,0.15)', boxShadow:'0 32px 64px rgba(0,0,0,0.35)' }}>
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/8">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background:'linear-gradient(135deg,#0077B6,#00B4D8)' }}>
                  <Brain className="w-4 h-4 text-white"/>
                </div>
                <div>
                  <div className="text-white text-sm font-bold" style={{ fontFamily:"'Space Grotesk',sans-serif" }}>SARAI IA Clínica</div>
                  <div className="text-[10px] flex items-center gap-1" style={{ color:'rgba(148,163,184,0.5)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>En línea
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-md text-xs leading-relaxed"
                    style={{ background:'rgba(0,119,182,0.3)', border:'1px solid rgba(0,119,182,0.2)', color:'rgba(255,255,255,0.75)' }}>
                    <div className="flex items-center gap-1.5 mb-1 text-[9px]" style={{ color:'rgba(148,163,184,0.5)' }}>
                      <Mic className="w-3 h-3"/> Voz del médico
                    </div>
                    "Paciente masculino, 58 años, refiere dolor torácico opresivo de 4 horas, irradiado a brazo izquierdo..."
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tl-md text-xs leading-relaxed"
                    style={{ background:'rgba(0,180,216,0.1)', border:'1px solid rgba(0,180,216,0.18)', color:'rgba(255,255,255,0.7)' }}>
                    <div className="flex items-center gap-1.5 mb-1.5 text-[9px]" style={{ color:'#00B4D8' }}>
                      <Brain className="w-3 h-3"/> SARAI IA · Análisis clínico
                    </div>
                    <p className="mb-1.5">HC estructurada. <span style={{ color:'rgba(148,163,184,0.5)' }}>CIE-10:</span>{' '}
                      <span style={{ color:'#00B4D8' }}>I21.9</span> — IAM sin especificar.</p>
                    <div className="text-[9px] flex items-center gap-1" style={{ color:'rgba(148,163,184,0.4)' }}>
                      <AlertCircle className="w-2.5 h-2.5"/> Solicitar ECG y troponinas — protocolo IAMEST.
                    </div>
                  </div>
                </div>
                <div className="rounded-xl p-3 mt-2" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 className="w-3.5 h-3.5" style={{ color:'#00B4D8' }}/>
                    <span className="text-[10px] font-semibold" style={{ color:'rgba(148,163,184,0.55)' }}>Informe gerencial generado</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Urgencias','Hospitaliz.','Recaudo'].map((l,i)=>(
                      <div key={i} className="rounded-lg p-1.5 text-center" style={{ background:'rgba(0,180,216,0.07)' }}>
                        <div className="text-white/70 font-bold text-xs" style={{ fontFamily:"'Space Grotesk',sans-serif" }}>
                          {['84%','92%','$2.8M'][i]}
                        </div>
                        <div className="text-[8px]" style={{ color:'rgba(148,163,184,0.4)' }}>{l}</div>
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

/* ══════════════════════════════════════════════════════════════════════════════
   SERVICES
═══════════════════════════════════════════════════════════════════════════════ */
function ServicesSection() {
  const cats: { icon:React.ReactNode; title:string; c:string; items:{t:string; ok:boolean}[] }[] = [
    { icon:<Stethoscope className="w-5 h-5"/>, title:'Atención Asistencial', c:'#00B4D8',
      items:[
        { t:'Urgencias',                             ok:false },
        { t:'Hospitalización',                       ok:true  },
        { t:'UCI / Home Care',                       ok:false },
        { t:'Cirugías y salas quirúrgicas',          ok:true  },
        { t:'Consulta externa',                      ok:true  },
        { t:'Apoyos diagnósticos',                   ok:true  },
        { t:'Laboratorio clínico',                   ok:true  },
        { t:'Odontología',                           ok:true  },
        { t:'Programas crónicos (Nefrología / VIH)', ok:false },
      ],
    },
    { icon:<Receipt className="w-5 h-5"/>, title:'Facturación y Recaudo', c:'#0077B6',
      items:[
        { t:'Facturación electrónica (FEV)',                    ok:true  },
        { t:'Radicación RIPS JSON (individual y masiva)',        ok:true  },
        { t:'Glosas: registro y respuesta (masiva)',             ok:true  },
        { t:'Notas crédito / débito y de ajuste (JSON)',         ok:true  },
        { t:'Recuperación de rubros y cartera',                  ok:false },
        { t:'Tarifarios y gestión de contratos',                 ok:true  },
      ],
    },
    { icon:<DollarSign className="w-5 h-5"/>, title:'Administrativo y Financiero', c:'#00B4D8',
      items:[
        { t:'Inventarios y control de existencias', ok:true },
        { t:'Compras y proveedores',                ok:true },
        { t:'Interfaz contable',                    ok:true },
        { t:'Cuentas por cobrar / pagar',           ok:true },
        { t:'Tesorería y flujo de caja',            ok:true },
        { t:'Honorarios médicos',                   ok:true },
      ],
    },
    { icon:<Brain className="w-5 h-5"/>, title:'Inteligencia y Experiencia', c:'#0077B6',
      items:[
        { t:'Informes gerenciales con IA (tipo Power BI)', ok:true  },
        { t:'IA clínica por voz y texto',                  ok:true  },
        { t:'App responsive (cualquier dispositivo móvil)',ok:true  },
        { t:'Bot de WhatsApp / Smart Access',              ok:false },
      ],
    },
  ];
  return (
    <section id="servicios" style={{ background:'linear-gradient(160deg,#0A1628 0%,#060D1B 100%)' }}
      className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background:'radial-gradient(circle,rgba(123,47,190,0.06) 0%,transparent 65%)', filter:'blur(60px)' }} />
      <div className="relative z-10 max-w-[1200px] mx-auto px-5 md:px-8">
        <SectionTitle kicker="Alcance funcional — Hospital" title="Todo lo que necesita su institución"
          subtitle="Cobertura completa desde la admisión hasta el cierre financiero e informes de dirección." light />
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {cats.map((cat,i)=>(
            <FadeIn key={i} delay={i*0.1}>
              <GlassCard className="p-6 h-full flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background:`${cat.c}12`, border:`1px solid ${cat.c}22` }}>
                    <span style={{ color:cat.c }}>{cat.icon}</span>
                  </div>
                  <h3 className="font-bold text-white text-sm leading-snug"
                    style={{ fontFamily:"'Space Grotesk',sans-serif" }}>{cat.title}</h3>
                </div>
                <ul className="space-y-2 flex-1">
                  {cat.items.map((item,j)=><Ci key={j} text={item.t} checked={item.ok}/>)}
                </ul>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PARTNER (Cliente Preferencial)
═══════════════════════════════════════════════════════════════════════════════ */
function PartnerSection() {
  const benefits = [
    { icon:<DollarSign className="w-5 h-5"/>, title:'Bajo costo de implementación',       desc:'Diferida en 4 cuotas mensuales. Retorno de valor desde las primeras semanas de operación.' },
    { icon:<Users className="w-5 h-5"/>,      title:'Dos desarrolladores dedicados',       desc:'Equipo de 2 desarrolladores full-time asignados exclusivamente durante los 4 meses de implementación.' },
    { icon:<Zap className="w-5 h-5"/>,        title:'Desarrollos menores sin costo',       desc:'Ajustes acotados propios del flujo de la institución incluidos, sujetos a evaluación técnica.' },
    { icon:<Award className="w-5 h-5"/>,      title:'Tarifas preferenciales y negociables',desc:'Precios por debajo del mercado, negociables por volumen y permanencia, sin costos ocultos.' },
    { icon:<Layers className="w-5 h-5"/>,     title:'Integración total',                   desc:'Conexión con software contable y de laboratorio según disponibilidad de API del proveedor.' },
    { icon:<HeartPulse className="w-5 h-5"/>, title:'Soporte prioritario 24/7',            desc:'Línea directa con el equipo técnico. Tiempo de respuesta garantizado en acuerdo SLA.' },
  ];
  return (
    <section style={{ background:'#E8F2F8' }} className="py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
          <FadeIn>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
              style={{ background:'rgba(0,180,216,0.1)', color:'#00B4D8', border:'1px solid rgba(0,180,216,0.22)' }}>
              Cliente preferencial · Aliado estratégico
            </span>
            <h2 className="font-black text-3xl md:text-4xl xl:text-5xl tracking-tight text-[#060D1B] mb-5"
              style={{ fontFamily:"'Space Grotesk',sans-serif" }}>
              No es una venta de software.<br />
              <span style={{ color:'#00B4D8' }}>Es una alianza.</span>
            </h2>
            <p className="text-[#0A1628]/55 text-base leading-relaxed mb-6 max-w-md">
              Clínica Médica Índigo recibe el trato de cliente preferencial: acceso directo al equipo de desarrollo,
              condiciones económicas por debajo del valor comercial de mercado y beneficios de acompañamiento
              diseñados para una relación de largo plazo.
            </p>
            <button onClick={()=>document.querySelector('#contacto')?.scrollIntoView({behavior:'smooth'})}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200"
              style={{ background:'linear-gradient(90deg,#0077B6,#00B4D8)', boxShadow:'0 6px 20px rgba(0,180,216,0.25)' }}
              onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-1px)')}
              onMouseLeave={e=>(e.currentTarget.style.transform='none')}>
              Conversemos <ArrowRight className="w-4 h-4"/>
            </button>
          </FadeIn>
          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((b,i)=>(
              <FadeIn key={i} delay={i*0.08}>
                <LightCard className="p-5 flex flex-col gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background:'rgba(0,180,216,0.09)', border:'1px solid rgba(0,180,216,0.18)' }}>
                    <span style={{ color:'#00B4D8' }}>{b.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#060D1B] text-sm mb-1"
                      style={{ fontFamily:"'Space Grotesk',sans-serif" }}>{b.title}</h4>
                    <p className="text-[#0A1628]/50 text-xs leading-relaxed">{b.desc}</p>
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

/* ══════════════════════════════════════════════════════════════════════════════
   MODELO ECONÓMICO (con precios reales)
═══════════════════════════════════════════════════════════════════════════════ */
function ModelSection() {
  const go = () => document.querySelector('#contacto')?.scrollIntoView({ behavior:'smooth' });

  return (
    <section id="modelo" style={{ background:'linear-gradient(160deg,#0A1628 0%,#060D1B 100%)' }}
      className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full pointer-events-none"
        style={{ background:'radial-gradient(circle,rgba(0,180,216,0.06) 0%,transparent 65%)', filter:'blur(60px)' }} />
      <div className="relative z-10 max-w-[1200px] mx-auto px-5 md:px-8">
        <SectionTitle kicker="Modelo económico" title="Inversión clara, retorno desde la primera radicación."
          subtitle="Un precio de implementación único diferido y un alquiler mensual según su modalidad. Sin sorpresas." light />

        {/* Implementación */}
        <FadeIn className="mb-10">
          <div className="max-w-3xl mx-auto rounded-2xl p-7 mb-2"
            style={{ background:'rgba(0,180,216,0.07)', border:'1px solid rgba(0,180,216,0.2)', backdropFilter:'blur(12px)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color:'#00B4D8' }}>
                  Precio de implementación
                </span>
                <div className="text-3xl font-black text-white mt-1" style={{ fontFamily:"'Space Grotesk',sans-serif" }}>
                  $30.000.000 <span className="text-base font-semibold text-white/50">COP · IVA incluido</span>
                </div>
              </div>
              <div className="rounded-xl px-5 py-3 text-center flex-shrink-0"
                style={{ background:'rgba(0,180,216,0.1)', border:'1px solid rgba(0,180,216,0.2)' }}>
                <div className="text-white font-black text-lg" style={{ fontFamily:"'Space Grotesk',sans-serif" }}>
                  4 cuotas
                </div>
                <div className="text-xs" style={{ color:'rgba(148,163,184,0.6)' }}>de $7.500.000/mes</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              {['2 desarrolladores full-time','4 meses de implementación','Capacitación incluida','Puesta en marcha incluida'].map((f,i)=>(
                <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
                  style={{ background:'rgba(30,142,90,0.1)', color:'#1E8E5A', border:'1px solid rgba(30,142,90,0.2)' }}>
                  <CheckCircle className="w-3 h-3"/> {f}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Modalidades */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
          {/* Modalidad A */}
          <FadeIn delay={0.1}>
            <div className="rounded-2xl p-7 h-full flex flex-col"
              style={{ background:'rgba(10,22,40,0.65)', backdropFilter:'blur(16px)', border:'1px solid rgba(0,180,216,0.14)' }}>
              <span className="text-[10px] font-bold tracking-widest uppercase mb-3 block" style={{ color:'#00B4D8' }}>
                Modalidad A
              </span>
              <h3 className="text-xl font-black text-white mb-1 leading-tight" style={{ fontFamily:"'Space Grotesk',sans-serif" }}>
                Por usuario concurrente
              </h3>
              {/* Precio destacado */}
              <div className="flex items-baseline gap-1.5 my-4">
                <span className="text-4xl font-black text-white" style={{ fontFamily:"'Space Grotesk',sans-serif", color:'#00B4D8' }}>
                  $130.000
                </span>
                <span className="text-sm" style={{ color:'rgba(148,163,184,0.5)' }}>/usuario/mes</span>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color:'rgba(148,163,184,0.6)' }}>
                Tarifa por cada usuario concurrente activo en el sistema. Recomendada para hospitales de mediana y alta complejidad. Sin IVA adicional.
              </p>
              <ul className="space-y-2 flex-1">
                {['Escala según el equipo activo','Activación/desactivación en tiempo real','Solo paga usuarios que usa','Módulos incluidos'].map((f,i)=><Ci key={i} text={f}/>)}
              </ul>
            </div>
          </FadeIn>

          {/* Modalidad B */}
          <FadeIn delay={0.2}>
            <div className="rounded-2xl p-7 h-full flex flex-col relative overflow-hidden"
              style={{ background:'linear-gradient(145deg,rgba(0,180,216,0.1) 0%,rgba(0,119,182,0.07) 100%)', backdropFilter:'blur(16px)', border:'1px solid rgba(0,180,216,0.35)' }}>
              <span className="absolute top-5 right-5 text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background:'#00B4D8', color:'white' }}>Recomendado</span>
              <span className="text-[10px] font-bold tracking-widest uppercase mb-3 block" style={{ color:'#00B4D8' }}>
                Modalidad B
              </span>
              <h3 className="text-xl font-black text-white mb-1 leading-tight" style={{ fontFamily:"'Space Grotesk',sans-serif" }}>
                Tarifa plana · Usuarios ilimitados
              </h3>
              <div className="flex items-baseline gap-1.5 my-4">
                <span className="text-4xl font-black" style={{ fontFamily:"'Space Grotesk',sans-serif", color:'#00B4D8' }}>
                  $5.000.000
                </span>
                <span className="text-sm" style={{ color:'rgba(148,163,184,0.5)' }}>/mes · todo incluido</span>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color:'rgba(148,163,184,0.6)' }}>
                Cuota fija mensual con usuarios ilimitados. El mejor valor para un hospital en plena operación: costo predecible sin importar cuántos usuarios estén activos.
              </p>
              <ul className="space-y-2 flex-1">
                {['Usuarios ilimitados incluidos','Todos los módulos sin restricción','Presupuesto fijo y predecible','Migración y puesta en marcha incluidas'].map((f,i)=><Ci key={i} text={f}/>)}
              </ul>
            </div>
          </FadeIn>
        </div>

        {/* Documentos electrónicos */}
        <FadeIn delay={0.25} className="max-w-3xl mx-auto mb-8">
          <div className="rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <FileText className="w-5 h-5 flex-shrink-0" style={{ color:'#00B4D8' }}/>
            <div>
              <span className="text-white/70 text-sm font-semibold">Documentos electrónicos (FEV + RIPS JSON):</span>
              <span className="text-white/50 text-sm ml-2">≈ $350 por documento, cobro por consumo real.</span>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.3} className="text-center">
          <button onClick={go}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{ border:'1px solid rgba(0,180,216,0.4)', background:'rgba(0,180,216,0.08)', color:'#00B4D8' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='rgba(0,180,216,0.16)'; e.currentTarget.style.transform='translateY(-1px)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='rgba(0,180,216,0.08)'; e.currentTarget.style.transform='none'; }}>
            Solicitar cotización personalizada <ArrowRight className="w-4 h-4"/>
          </button>
          <p className="text-xs mt-3" style={{ color:'rgba(148,163,184,0.35)' }}>
            Vigencia de la propuesta: 15 días calendario · Cualquier ajuste al alcance puede modificar el valor.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   COMPLIANCE / ROADMAP
═══════════════════════════════════════════════════════════════════════════════ */
function ComplianceSection() {
  const phases = [
    {
      phase:'Fase 1 · Activo', color:'#00B4D8', status:'En producción',
      items:['Facturación electrónica (FEV) — DIAN','Radicación RIPS JSON individual y masiva','Gestión de glosas y notas de ajuste JSON','Habeas Data (Ley 1581 de 2012)','Módulos clínicos y administrativos completos'],
    },
    {
      phase:'Fase 2 · En desarrollo', color:'#0077B6', status:'Implementación acelerada',
      items:['Res. 948 de 2026 — nuevas disposiciones normativas','CUCON / SIIFA — registro de contratos','SOAT — registro SIRAS · campo U12 · tarifario y radicación','Interoperabilidad IHCE / HL7 FHIR · Código Vida','Nuevas resoluciones y normas posteriores'],
    },
    {
      phase:'Fase 3 · Certificación', color:'#7B2FBE', status:'En preparación',
      items:['ISO 27001 — Certificación en seguridad de la información'],
    },
  ];

  return (
    <section id="cumplimiento" style={{ background:'#F0F6FA' }} className="py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-5 md:px-8">
        <SectionTitle kicker="Cumplimiento e interoperabilidad" title="Normativa vigente y hoja de ruta"
          subtitle="Compromiso de actualización permanente con la normatividad colombiana y los estándares de interoperabilidad del sector salud." />
        <div className="relative max-w-2xl mx-auto">
          <div className="hidden md:block absolute left-5 top-6 bottom-6 w-px"
            style={{ background:'linear-gradient(to bottom,#00B4D8,#0077B6,#7B2FBE)' }} />
          <div className="space-y-6">
            {phases.map((p,i)=>(
              <FadeIn key={i} delay={i*0.15}>
                <div className="flex gap-6 items-start">
                  {/* Dot */}
                  <div className="hidden md:flex flex-col items-center flex-shrink-0 pt-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center z-10"
                      style={{ background:p.color+'1A', border:`2px solid ${p.color}`, boxShadow:`0 0 16px ${p.color}40` }}>
                      <div className="w-3 h-3 rounded-full" style={{ background:p.color }}/>
                    </div>
                  </div>
                  {/* Card */}
                  <LightCard className="p-6 flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 md:hidden"
                        style={{ background:p.color, boxShadow:`0 0 8px ${p.color}60` }}/>
                      <div>
                        <span className="text-xs font-bold tracking-wide" style={{ color:p.color }}>{p.phase}</span>
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background:`${p.color}14`, color:p.color }}>{p.status}</span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {p.items.map((item,j)=>(
                        <li key={j} className="flex items-start gap-2.5 text-sm" style={{ color:'rgba(10,22,40,0.65)' }}>
                          <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color:p.color }}/>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </LightCard>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   CTA FINAL
═══════════════════════════════════════════════════════════════════════════════ */
function CTAFinal() {
  return (
    <section className="relative py-24 overflow-hidden"
      style={{ background:'linear-gradient(135deg,#060D1B 0%,#0A1628 100%)' }}>
      <NeuralCanvas opacity={0.2} nodeCount={60} />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full"
          style={{ background:'radial-gradient(ellipse,rgba(0,180,216,0.12) 0%,transparent 60%)', filter:'blur(50px)' }}/>
      </div>
      <div className="relative z-10 max-w-[800px] mx-auto px-5 md:px-8 text-center">
        <FadeIn>
          <span className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-6"
            style={{ background:'rgba(0,180,216,0.1)', color:'#00B4D8', border:'1px solid rgba(0,180,216,0.25)' }}>
            El siguiente paso
          </span>
          <h2 className="text-4xl md:text-5xl xl:text-6xl font-black text-white leading-tight mb-5"
            style={{ fontFamily:"'Space Grotesk',sans-serif" }}>
            Lleva tu operación<br />
            <span style={{ background:'linear-gradient(90deg,#00B4D8,#7B2FBE)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              al siguiente nivel
            </span>
          </h2>
          <p className="text-lg mb-8 max-w-lg mx-auto" style={{ color:'rgba(148,163,184,0.55)' }}>
            Agendemos una sesión de demostración personalizada con el equipo técnico y resolvamos todas sus preguntas.
          </p>
          <button onClick={()=>document.querySelector('#contacto')?.scrollIntoView({behavior:'smooth'})}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-white text-base transition-all duration-200"
            style={{ background:'linear-gradient(90deg,#0077B6 0%,#00B4D8 100%)', boxShadow:'0 12px 40px rgba(0,180,216,0.32)' }}
            onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 20px 50px rgba(0,180,216,0.42)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 12px 40px rgba(0,180,216,0.32)'; }}>
            Solicitar demo <ArrowRight className="w-5 h-5"/>
          </button>
        </FadeIn>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   CONTACT FORM
═══════════════════════════════════════════════════════════════════════════════ */
function ContactForm() {
  const [form, setForm] = useState({ nombre:'', institucion:'', cargo:'', correo:'', telefono:'', mensaje:'' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
    setForm(f=>({...f,[k]:e.target.value}));

  const validate = () => {
    const err: Record<string,string> = {};
    if (!form.nombre.trim())      err.nombre='Requerido';
    if (!form.institucion.trim()) err.institucion='Requerido';
    if (!form.correo.trim())      err.correo='Requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) err.correo='Correo inválido';
    if (!form.telefono.trim())    err.telefono='Requerido';
    return err;
  };

  const handleSend = async () => {
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }
    setSending(true);
    setErrors({});
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID  || '',
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
        {
          from_name:   form.nombre,
          institucion: form.institucion,
          cargo:       form.cargo || '—',
          reply_to:    form.correo,
          telefono:    form.telefono,
          message:     form.mensaje || '(sin mensaje adicional)',
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
      );
      setSent(true);
    } catch {
      setErrors({ global: 'Error al enviar. Por favor escríbanos directamente a sarai@sara-ai.co' });
    } finally {
      setSending(false);
    }
  };

  const inputBase: React.CSSProperties = {
    background:'rgba(6,13,27,0.6)',
    border:'1px solid rgba(0,180,216,0.15)',
    transition:'border-color 0.2s, box-shadow 0.2s',
  };

  return (
    <section id="contacto" style={{ background:'#E8F2F8' }} className="py-24 md:py-32">
      <div className="max-w-[720px] mx-auto px-5 md:px-8">
        <SectionTitle kicker="Solicitar demo" title="Cuéntenos sobre su institución"
          subtitle="Complete el formulario y un consultor se comunicará en menos de 24 horas." />
        <FadeIn delay={0.1}>
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="ok" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                className="rounded-3xl p-12 text-center bg-white"
                style={{ border:'1px solid rgba(30,142,90,0.2)', boxShadow:'0 8px 32px rgba(30,142,90,0.1)' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background:'rgba(30,142,90,0.1)' }}>
                  <CheckCircle className="w-8 h-8" style={{ color:'#1E8E5A' }}/>
                </div>
                <h3 className="text-2xl font-black text-[#060D1B] mb-2" style={{ fontFamily:"'Space Grotesk',sans-serif" }}>
                  ¡Solicitud enviada!
                </h3>
                <p className="text-[#0A1628]/55 text-sm">
                  Gracias, {form.nombre}. Un consultor de SARAI GROUP se comunicará<br />con usted en las próximas 24 horas.
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" className="rounded-3xl p-8 md:p-10 bg-white"
                style={{ border:'1px solid rgba(10,22,40,0.08)', boxShadow:'0 8px 40px rgba(10,22,40,0.08)' }}>
                <div className="grid sm:grid-cols-2 gap-5 mb-5">
                  {([
                    { k:'nombre',      l:'Nombre completo',    half:true,  p:'Dr. Juan García' },
                    { k:'institucion', l:'Institución',        half:true,  p:'Clínica Médica Índigo' },
                    { k:'cargo',       l:'Cargo',              half:true,  p:'Gerente General' },
                    { k:'correo',      l:'Correo electrónico', half:true,  p:'gerencia@clinica.com.co', t:'email' },
                    { k:'telefono',    l:'Teléfono / WhatsApp',half:true,  p:'+57 300 000 0000' },
                  ] as any[]).map(({ k, l, half, p, t='text' }) => (
                    <div key={k} className={half?'sm:col-span-1':'sm:col-span-2'}>
                      <label className="block text-[10px] font-semibold tracking-widest uppercase mb-1.5"
                        style={{ color:'rgba(10,22,40,0.5)' }}>{l}</label>
                      <input type={t} value={(form as any)[k]}
                        onChange={set(k as keyof typeof form)} placeholder={p}
                        className="w-full px-4 py-3 rounded-xl text-[#060D1B] text-sm outline-none"
                        style={{ ...inputBase, color:'#060D1B', borderColor: errors[k]?'rgba(239,68,68,0.5)':'rgba(0,180,216,0.15)' }}
                        onFocus={e=>{ e.currentTarget.style.borderColor='rgba(0,180,216,0.5)'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(0,180,216,0.08)'; }}
                        onBlur={e=>{ e.currentTarget.style.borderColor=errors[k]?'rgba(239,68,68,0.5)':'rgba(0,180,216,0.15)'; e.currentTarget.style.boxShadow='none'; }} />
                      {errors[k] && <p className="text-red-500 text-xs mt-1">{errors[k]}</p>}
                    </div>
                  ))}
                </div>
                <div className="mb-6">
                  <label className="block text-[10px] font-semibold tracking-widest uppercase mb-1.5"
                    style={{ color:'rgba(10,22,40,0.5)' }}>Mensaje (opcional)</label>
                  <textarea value={form.mensaje} onChange={set('mensaje')} rows={4}
                    placeholder="Cuéntenos los principales retos que enfrenta actualmente..."
                    className="w-full px-4 py-3 rounded-xl text-[#060D1B] text-sm outline-none resize-none"
                    style={inputBase}
                    onFocus={e=>{ e.currentTarget.style.borderColor='rgba(0,180,216,0.5)'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(0,180,216,0.08)'; }}
                    onBlur={e=>{ e.currentTarget.style.borderColor='rgba(0,180,216,0.15)'; e.currentTarget.style.boxShadow='none'; }} />
                </div>
                <button type="button" onClick={handleSend} disabled={sending}
                  className="w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200"
                  style={{ background: sending ? 'rgba(0,119,182,0.5)' : 'linear-gradient(90deg,#0077B6 0%,#00B4D8 100%)', boxShadow:'0 8px 24px rgba(0,180,216,0.25)', cursor: sending ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={e=>{ if (!sending) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(0,180,216,0.35)'; } }}
                  onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,180,216,0.25)'; }}>
                  {sending ? (
                    <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg> Enviando...</>
                  ) : (
                    <><Send className="w-4 h-4"/> Enviar solicitud de demo</>
                  )}
                </button>
                {errors.global && (
                  <p className="text-red-500 text-xs mt-2 text-center">{errors.global}</p>
                )}
                <p className="text-center text-[10px] mt-3" style={{ color:'rgba(10,22,40,0.3)' }}>
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

/* ══════════════════════════════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════════════════════════════ */
function Footer() {
  const go = (h:string) => document.querySelector(h)?.scrollIntoView({ behavior:'smooth' });
  return (
    <footer style={{ background:'#060D1B', borderTop:'1px solid rgba(0,180,216,0.08)' }}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-14">
        <div className="grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0"
                style={{ background:'rgba(0,180,216,0.12)', border:'1px solid rgba(0,180,216,0.25)' }}>
                <img src={saraiLogo} alt="SARAI" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-widest text-white"
                  style={{ fontFamily:"'Space Grotesk',sans-serif", letterSpacing:'0.15em' }}>SARAI</span>
                <p className="text-[10px] tracking-widest uppercase" style={{ color:'#00B4D8' }}>SARAI GROUP</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed mb-3" style={{ color:'rgba(148,163,184,0.35)' }}>
              Sistema Ágil de Registro y Asistencia Inteligente.<br />
              Solución asistencial clínica para hospitales y clínicas en Colombia.
            </p>
          </div>
          <div>
            <h5 className="text-[10px] font-semibold tracking-widest uppercase mb-4" style={{ color:'rgba(148,163,184,0.5)' }}>Solución</h5>
            <ul className="space-y-2.5">
              {[['#solucion','Plataforma'],['#beneficios','Beneficios'],['#servicios','Servicios'],['#modelo','Modelo'],['#cumplimiento','Cumplimiento']].map(([h,l])=>(
                <li key={h}><button onClick={()=>go(h)} className="text-xs transition-colors" style={{ color:'rgba(148,163,184,0.4)' }}
                  onMouseEnter={e=>(e.currentTarget.style.color='rgba(0,180,216,0.8)')}
                  onMouseLeave={e=>(e.currentTarget.style.color='rgba(148,163,184,0.4)')}>{l}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-semibold tracking-widest uppercase mb-4" style={{ color:'rgba(148,163,184,0.5)' }}>Legal</h5>
            <ul className="space-y-2.5">
              {['Habeas Data · Ley 1581/2012','Política de privacidad','Términos de uso','Aviso de confidencialidad'].map(l=>(
                <li key={l}><span className="text-xs" style={{ color:'rgba(148,163,184,0.35)' }}>{l}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-semibold tracking-widest uppercase mb-4" style={{ color:'rgba(148,163,184,0.5)' }}>Contacto</h5>
            <ul className="space-y-3">
              {[
                { i:<Mail className="w-3.5 h-3.5"/>,  t:'sarai@sara-ai.co',              href:'mailto:sarai@sara-ai.co' },
                { i:<Globe className="w-3.5 h-3.5"/>, t:'www.sara-ai.co/propuesta-indigo', href:'https://www.sara-ai.co/propuesta-indigo' },
                { i:<Building2 className="w-3.5 h-3.5"/>, t:'Colombia',                  href: null },
              ].map((c,i)=>(
                <li key={i} className="flex items-start gap-2">
                  <span style={{ color:'#00B4D8' }}>{c.i}</span>
                  {c.href ? (
                    <a href={c.href} target="_blank" rel="noopener noreferrer"
                      className="text-xs transition-colors"
                      style={{ color:'rgba(148,163,184,0.4)' }}
                      onMouseEnter={e=>(e.currentTarget.style.color='rgba(0,180,216,0.8)')}
                      onMouseLeave={e=>(e.currentTarget.style.color='rgba(148,163,184,0.4)')}>
                      {c.t}
                    </a>
                  ) : (
                    <span className="text-xs" style={{ color:'rgba(148,163,184,0.4)' }}>{c.t}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6"
          style={{ borderTop:'1px solid rgba(0,180,216,0.06)' }}>
          <p className="text-[11px]" style={{ color:'rgba(148,163,184,0.2)' }}>
            © 2026 SARAI GROUP. Todos los derechos reservados.
          </p>
          <p className="text-[10px] text-center sm:text-right" style={{ color:'rgba(148,163,184,0.15)' }}>
            Propuesta confidencial — Uso exclusivo de Clínica Médica Índigo.<br />
            Prohibida su reproducción sin autorización expresa.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   LANDING ASSEMBLY
═══════════════════════════════════════════════════════════════════════════════ */
function LandingContent({ onLogout }: { onLogout: () => void }) {
  return (
    <div style={{ fontFamily:"'Inter',sans-serif" }}>
      <Navbar onLogout={onLogout} />
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

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════════════════════ */
export default function PropuestaIndigoPage() {
  useGoogleFonts();
  const [auth, setAuth] = useState(false);
  const handleLogout = useCallback(() => {
    setAuth(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);
  return (
    <AnimatePresence mode="wait">
      {auth ? (
        <motion.div key="landing" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.5 }}>
          <LandingContent onLogout={handleLogout} />
        </motion.div>
      ) : (
        <motion.div key="gate" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
          <PasswordGate onSuccess={()=>setAuth(true)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
