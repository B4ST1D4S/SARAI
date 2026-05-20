import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, User, AlertCircle, CheckCircle,
  AlertTriangle, ChevronRight, UserPlus, X, FileSearch,
} from 'lucide-react';

interface BuscadorPacienteProps {
  onPacienteEncontrado: (paciente: any) => void;
  onNuevoPaciente: (datos?: { tipoDocumento: string; numeroDocumento: string }) => void;
  onConfirmarYAgendar: (paciente: any) => void;
  onClose: () => void;
}

export function BuscadorPaciente({
  onPacienteEncontrado,
  onNuevoPaciente,
  onConfirmarYAgendar,
  onClose,
}: BuscadorPacienteProps) {
  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [pacienteEncontrado, setPacienteEncontrado] = useState<any>(null);
  const [error, setError] = useState('');
  const [duplicadosDoc, setDuplicadosDoc] = useState<any[]>([]);
  const [buscadoSinResultado, setBuscadoSinResultado] = useState(false);

  const getToken = () => localStorage.getItem('accessToken') || '';

  const handleBuscar = async () => {
    if (!numeroDocumento.trim()) {
      setError('Ingresa el numero de documento');
      return;
    }

    setBuscando(true);
    setError('');
    setPacienteEncontrado(null);
    setDuplicadosDoc([]);
    setBuscadoSinResultado(false);

    try {
      const [searchRes, dupRes] = await Promise.all([
        fetch(`/api/pacientes/search?documento=${encodeURIComponent(numeroDocumento)}&tipo=${tipoDocumento}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        }),
        fetch(`/api/pacientes/verificar-duplicados?numero=${encodeURIComponent(numeroDocumento)}&tipo=${tipoDocumento}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        }),
      ]);

      const dupData = dupRes.ok ? await dupRes.json() : null;
      const docDups: any[] = dupData?.mismoNumeroOtroTipo ?? [];
      setDuplicadosDoc(docDups);

      if (searchRes.ok) {
        const data = await searchRes.json();
        setPacienteEncontrado(data);
      } else {
        setBuscadoSinResultado(true);
        if (docDups.length === 0) {
          setError('Paciente no encontrado. Abriendo formulario de registro...');
          setTimeout(() => onNuevoPaciente({ tipoDocumento, numeroDocumento }), 1200);
        }
      }
    } catch {
      setError('Error de conexion al buscar paciente');
    } finally {
      setBuscando(false);
    }
  };

  const resetear = () => {
    setPacienteEncontrado(null);
    setNumeroDocumento('');
    setError('');
    setDuplicadosDoc([]);
    setBuscadoSinResultado(false);
  };

  const hayResultados = !!pacienteEncontrado || duplicadosDoc.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] border border-white/[0.07] w-full max-w-[520px] max-h-[88vh] flex flex-col overflow-hidden"
      >
        {/* Linea decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent" />

        {/* Boton cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-10"
        >
          <X size={15} />
        </button>

        {/* ── HEADER ── */}
        <div className="px-7 pt-7 pb-5 flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border border-yellow-500/25 flex items-center justify-center flex-shrink-0">
              <FileSearch size={18} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent leading-tight">
                Busqueda de Paciente
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">Busca por tipo y numero de documento</p>
            </div>
          </div>
        </div>

        {/* Divisor */}
        <div className="mx-7 h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent flex-shrink-0" />

        {/* ── CUERPO SCROLLABLE ── */}
        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">

          {/* Buscador por documento */}
          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Documento de identidad
            </label>
            <div className="flex gap-2">
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                className="w-28 px-3 py-3 bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/20 transition-all cursor-pointer"
              >
                <option value="CC">CC</option>
                <option value="TI">TI</option>
                <option value="CE">CE</option>
                <option value="PA">Pasaporte</option>
                <option value="RC">RC</option>
                <option value="NIT">NIT</option>
              </select>
              <input
                type="text"
                value={numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                placeholder="Numero de documento"
                autoFocus
                className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/20 transition-all"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleBuscar}
                disabled={buscando}
                className="px-5 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 text-sm shadow-lg shadow-amber-900/30 flex-shrink-0"
              >
                {buscando ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                  />
                ) : (
                  <Search size={15} />
                )}
                {buscando ? 'Buscando' : 'Buscar'}
              </motion.button>
            </div>
          </div>

          {/* Mensaje de error / info */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-sm overflow-hidden ${
                  error.includes('no encontrado')
                    ? 'bg-amber-500/8 border-amber-500/25 text-amber-300'
                    : 'bg-red-500/10 border-red-500/25 text-red-400'
                }`}
              >
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── DUPLICADOS POR DOCUMENTO ── */}
          <AnimatePresence>
            {duplicadosDoc.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-900/15 to-amber-900/5 overflow-hidden"
              >
                {/* Header warning */}
                <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-900/20 border-b border-amber-500/20">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={13} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-amber-300 text-xs font-bold uppercase tracking-wide">
                      Mismo numero — tipo diferente
                    </p>
                    <p className="text-amber-400/60 text-xs">
                      {duplicadosDoc.length} registro{duplicadosDoc.length > 1 ? 's' : ''} encontrado{duplicadosDoc.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 space-y-2">
                  <p className="text-slate-400 text-xs leading-relaxed">
                    El numero <span className="text-white font-bold">{numeroDocumento}</span> ya existe con otro tipo de documento.
                    ¿Es alguno de estos pacientes?
                  </p>

                  {duplicadosDoc.map((p: any) => (
                    <motion.div
                      key={p.id}
                      whileHover={{ x: 3 }}
                      className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/40 hover:border-amber-500/30 rounded-xl px-3 py-2.5 transition-all"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-700/40 to-amber-900/40 border border-amber-600/30 flex items-center justify-center flex-shrink-0 text-amber-300 font-bold text-sm">
                        {p.nombreCompleto?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{p.nombreCompleto}</p>
                        <p className="text-amber-400/80 text-xs mt-0.5">
                          {p.tipoDocumento} · {p.numeroDocumento}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPacienteEncontrado(p);
                          setDuplicadosDoc([]);
                          setError('');
                          setBuscadoSinResultado(false);
                        }}
                        className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white bg-amber-900/30 hover:bg-amber-700/50 px-3 py-2 rounded-lg border border-amber-600/30 hover:border-amber-500 transition-all"
                      >
                        Usar este
                        <ChevronRight size={12} />
                      </button>
                    </motion.div>
                  ))}

                  {buscadoSinResultado && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      onClick={() => onNuevoPaciente({ tipoDocumento, numeroDocumento })}
                      className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-600/60 hover:border-slate-500 text-slate-300 hover:text-white text-sm font-semibold transition-all"
                    >
                      <UserPlus size={14} />
                      No es ninguno — registrar como nuevo paciente
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── PACIENTE ENCONTRADO ── */}
          <AnimatePresence>
            {pacienteEncontrado && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              >
                {/* Card paciente */}
                <div className="p-4 bg-gradient-to-br from-emerald-900/25 to-teal-950/40 border border-emerald-500/30 rounded-2xl mb-3 relative overflow-hidden">
                  {/* Glow de fondo */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />

                  <div className="relative flex items-center gap-3.5 mb-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-900/50">
                        {pacienteEncontrado.nombreCompleto?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                        <CheckCircle size={11} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
                        Paciente encontrado
                      </p>
                      <p className="text-white font-bold text-lg leading-tight truncate">
                        {pacienteEncontrado.nombreCompleto}
                      </p>
                    </div>
                  </div>

                  <div className="relative grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-black/20 border border-white/5 rounded-xl px-3 py-2.5">
                      <p className="text-slate-500 mb-1 uppercase tracking-wide" style={{ fontSize: '10px' }}>Documento</p>
                      <p className="text-white font-bold">
                        {pacienteEncontrado.tipoDocumento} {pacienteEncontrado.numeroDocumento}
                      </p>
                    </div>
                    <div className="bg-black/20 border border-white/5 rounded-xl px-3 py-2.5">
                      <p className="text-slate-500 mb-1 uppercase tracking-wide" style={{ fontSize: '10px' }}>Telefono</p>
                      <p className="text-white font-bold">{pacienteEncontrado.telefonos?.[0] ?? '—'}</p>
                    </div>
                    <div className="bg-black/20 border border-white/5 rounded-xl px-3 py-2.5 col-span-2">
                      <p className="text-slate-500 mb-1 uppercase tracking-wide" style={{ fontSize: '10px' }}>Correo electronico</p>
                      <p className="text-white font-bold truncate">{pacienteEncontrado.email ?? '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onConfirmarYAgendar(pacienteEncontrado)}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle size={16} />
                    Confirmar y Agendar Cita
                    <ChevronRight size={15} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onPacienteEncontrado(pacienteEncontrado)}
                    className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold rounded-xl border border-slate-700/60 hover:border-slate-600 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <User size={15} />
                    Ver / Editar datos del paciente
                  </motion.button>

                  <button
                    onClick={resetear}
                    className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    &#8592; Nueva busqueda
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* ── FOOTER (solo cuando no hay resultados) ── */}
        <AnimatePresence>
          {!hayResultados && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-shrink-0 px-7 py-4 border-t border-white/5 flex items-center justify-between"
            >
              <p className="text-slate-600 text-xs">Presiona Enter para buscar</p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold rounded-xl border border-slate-700/60 transition-all text-sm"
              >
                Cancelar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Linea decorativa inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />
      </motion.div>
    </motion.div>
  );
}
