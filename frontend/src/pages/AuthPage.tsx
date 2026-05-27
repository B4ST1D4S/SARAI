import { useState } from 'react';
import { motion } from 'framer-motion';
import { login } from '../services/api';
import NeuralCanvas from '../components/NeuralCanvas';

/* ??? Cruz médica SVG con glow ???????????????????????????????? */
function MedicalCross() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
      <defs>
        <radialGradient id="crossGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#00B4D8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#00B4D8" stopOpacity="0"    />
        </radialGradient>
        <filter id="blur8">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="blur3">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* halo exterior */}
      <circle cx="100" cy="100" r="90" stroke="#00B4D8" strokeWidth="0.5" strokeOpacity="0.25" />
      <circle cx="100" cy="100" r="72" stroke="#00B4D8" strokeWidth="0.4" strokeOpacity="0.18" />
      {/* glow blob */}
      <ellipse cx="100" cy="100" rx="70" ry="70" fill="url(#crossGlow)" filter="url(#blur8)" />
      {/* cruz sombra */}
      <rect x="82" y="42" width="36" height="116" rx="8" fill="#00B4D8" opacity="0.12" filter="url(#blur3)" />
      <rect x="42" y="82" width="116" height="36" rx="8" fill="#00B4D8" opacity="0.12" filter="url(#blur3)" />
      {/* cruz principal */}
      <rect x="84" y="44" width="32" height="112" rx="7" fill="#00B4D8" opacity="0.55" />
      <rect x="44" y="84" width="112" height="32" rx="7" fill="#00B4D8" opacity="0.55" />
      {/* pulso central */}
      <polyline
        points="72,100 82,100 88,82 96,118 104,90 110,100 128,100"
        stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"
      />
      {/* nodos en las esquinas de la cruz */}
      {[[100,44],[156,100],[100,156],[44,100]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill="#00E5FF" opacity="0.9" />
      ))}
    </svg>
  );
}

/* ??? Logo nodos SARAI ???????????????????????????????????????? */
function SaraiNodeLogo() {
  const nodes = [
    [30,8],[52,18],[14,26],[44,36],[26,48],[50,52],[12,56],
  ];
  const edges = [[0,1],[0,2],[1,3],[2,3],[2,4],[3,4],[3,5],[4,6],[5,6]];
  return (
    <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none">
      <defs>
        <linearGradient id="ng" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#7B2FBE" />
          <stop offset="100%" stopColor="#00B4D8" />
        </linearGradient>
      </defs>
      {edges.map(([a,b],i) => (
        <line key={i}
          x1={nodes[a][0]} y1={nodes[a][1]}
          x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="url(#ng)" strokeWidth="1.4" opacity="0.8"
        />
      ))}
      {nodes.map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r={i === 0 || i === 6 ? 4 : 3}
          fill="url(#ng)" opacity="0.95" />
      ))}
    </svg>
  );
}

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await login({
        username: formData.username.trim(),
        password: formData.password,
      });
      if (response.error) {
        setError(response.error);
        return;
      }
      localStorage.setItem('accessToken', response.data?.accessToken || '');
      localStorage.setItem('user', JSON.stringify(response.data?.user));
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #060D1B 0%, #0A1628 50%, #080E1E 100%)' }}>

      {/* ?? Red neuronal ?? */}
      <NeuralCanvas />

      {/* ?? Blobs de gradiente ?? */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle, #7B2FBE 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[5%] w-[600px] h-[600px] rounded-full opacity-15"
             style={{ background: 'radial-gradient(circle, #00B4D8 0%, transparent 70%)' }} />
        <div className="absolute top-[30%] right-[8%] w-[380px] h-[380px] rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #1E40AF 0%, transparent 70%)' }} />
      </div>

      {/* ?? Cruz médica decorativa (derecha) ?? */}
      <div className="absolute right-[4%] top-1/2 -translate-y-1/2 w-[320px] h-[320px] opacity-40 pointer-events-none hidden lg:block">
        <MedicalCross />
      </div>

      {/* ?? Tarjeta de login ?? */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative w-full max-w-sm mx-4 z-10"
      >
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <SaraiNodeLogo />
          </div>
          <h1 className="text-4xl font-extrabold tracking-widest"
              style={{ color: '#FFFFFF', letterSpacing: '0.2em' }}>
            SARAI
          </h1>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mt-1"
             style={{ color: '#00B4D8' }}>
            Asistente Clínico Inteligente
          </p>
          {/* Línea EKG */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-12 opacity-40" style={{ background: '#00B4D8' }} />
            <svg viewBox="0 0 80 20" className="w-20 h-4" fill="none">
              <polyline
                points="0,10 14,10 20,3 26,17 32,5 38,10 80,10"
                stroke="#00B4D8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"
              />
            </svg>
            <div className="h-px w-12 opacity-40" style={{ background: '#00B4D8' }} />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 shadow-2xl"
             style={{
               background: 'rgba(10,22,40,0.75)',
               backdropFilter: 'blur(20px)',
               border: '1px solid rgba(0,180,216,0.18)',
               boxShadow: '0 0 40px rgba(0,180,216,0.08), 0 20px 60px rgba(0,0,0,0.5)',
             }}>
          <h2 className="text-lg font-semibold text-white mb-1">Bienvenido</h2>
          <p className="text-sm mb-7" style={{ color: 'rgba(148,163,184,0.8)' }}>
            Ingresa tus credenciales para continuar
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-5 px-4 py-3 rounded-lg text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                     style={{ color: 'rgba(148,163,184,0.7)' }}>
                Usuario
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(100,180,210,0.5)' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text" name="username" placeholder="Nombre de usuario"
                  value={formData.username} onChange={handleChange}
                  required autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none transition"
                  style={{
                    background: 'rgba(6,13,27,0.7)',
                    border: '1px solid rgba(0,180,216,0.15)',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,180,216,0.55)')}
                  onBlur={e  => (e.target.style.borderColor = 'rgba(0,180,216,0.15)')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                     style={{ color: 'rgba(148,163,184,0.7)' }}>
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(100,180,210,0.5)' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password" placeholder="••••••••"
                  value={formData.password} onChange={handleChange}
                  required autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none transition"
                  style={{
                    background: 'rgba(6,13,27,0.7)',
                    border: '1px solid rgba(0,180,216,0.15)',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,180,216,0.55)')}
                  onBlur={e  => (e.target.style.borderColor = 'rgba(0,180,216,0.15)')}
                />
                <button
                  type="button" tabIndex={-1}
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition"
                  style={{ color: 'rgba(100,180,210,0.5)' }}
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 mt-2 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(90deg, #0077B6 0%, #00B4D8 100%)',
                boxShadow: '0 4px 24px rgba(0,180,216,0.3)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Verificando...
                </span>
              ) : 'Iniciar Sesión'}
            </button>
          </form>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs" style={{ color: 'rgba(100,116,139,0.8)' }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#00B4D8', opacity: 0.6 }} />
          Demo: usuario <span className="font-mono mx-1" style={{ color: 'rgba(148,163,184,0.7)' }}>demo</span>
          clave <span className="font-mono mx-1" style={{ color: 'rgba(148,163,184,0.7)' }}>123456</span>
        </div>
      </motion.div>
    </div>
  );
}
