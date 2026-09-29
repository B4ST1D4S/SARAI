// ============================================================
// Formulario de Inscripción al Programa de Hemodiálisis
// Busca pacientes SARAI existentes e inscribe al programa
// ============================================================
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../../../config';
import { inscribirPaciente } from '../../services/hemodialisisService';
import type { InscripcionPrograma } from '../../types';

// ── Tipos ────────────────────────────────────────────────────

interface PacienteSARAI {
  id: string;
  nombreCompleto: string;
  numeroDocumento: string;
  tipoDocumento: string;
  fechaNacimiento: string;
  genero: string;
  email?: string;
  telefonos?: string[];
}

interface Props {
  onExito: (inscripcion: InscripcionPrograma) => void;
  onCancelar: () => void;
}

// ── Constantes ───────────────────────────────────────────────

const ESTADIOS_ERC = [
  { v: 'G1', l: 'G1 — TFG ≥ 90 (normal/aumentada)' },
  { v: 'G2', l: 'G2 — TFG 60-89 (levemente disminuida)' },
  { v: 'G3A', l: 'G3a — TFG 45-59 (leve-moderada)' },
  { v: 'G3B', l: 'G3b — TFG 30-44 (moderada-grave)' },
  { v: 'G4', l: 'G4 — TFG 15-29 (gravemente disminuida)' },
  { v: 'G5', l: 'G5 — TFG < 15 (fallo renal)' },
  { v: 'G5D', l: 'G5D — En diálisis' },
];

const CATEGORIAS_ALBUMIN = [
  { v: 'A1', l: 'A1 — < 30 mg/g (normal/levemente aumentada)' },
  { v: 'A2', l: 'A2 — 30-300 mg/g (moderadamente aumentada)' },
  { v: 'A3', l: 'A3 — > 300 mg/g (gravemente aumentada)' },
];

const ETIOLOGIAS = [
  'Diabetes mellitus tipo 1',
  'Diabetes mellitus tipo 2',
  'Hipertensión arterial',
  'Glomerulopatía primaria',
  'Glomerulopatía secundaria',
  'Nefropatía lúpica',
  'Nefropatía obstructiva',
  'Enfermedad renal poliquística',
  'Nefropatía de reflujo',
  'Amiloidosis renal',
  'Mieloma múltiple',
  'Nefrotoxicidad por medicamentos',
  'Causa desconocida',
  'Otra',
];

function token() {
  return localStorage.getItem('accessToken') ?? '';
}

function edadDesde(fechaNac: string): number {
  return Math.floor(
    (Date.now() - new Date(fechaNac).getTime()) / (365.25 * 24 * 3600 * 1000)
  );
}

// ── Componente ───────────────────────────────────────────────

export function InscripcionForm({ onExito, onCancelar }: Props) {
  const [step, setStep] = useState<1 | 2>(1);

  // Búsqueda paciente
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<PacienteSARAI[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteSARAI | null>(null);

  // Datos clínicos
  const [diagnostico, setDiagnostico] = useState('Enfermedad Renal Crónica en Hemodiálisis');
  const [cie10, setCie10] = useState('N18.6');
  const [etiologia, setEtiologia] = useState('');
  const [etiologiaOtra, setEtiologiaOtra] = useState('');
  const [estadioERC, setEstadioERC] = useState('G5D');
  const [catAlbumina, setCatAlbumina] = useState('A3');
  const [tfg, setTfg] = useState('');
  const [creatinina, setCreatinina] = useState('');
  const [entidadRemitente, setEntidadRemitente] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Búsqueda con debounce
  const buscarPacientes = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim() || q.length < 2) {
      setResultados([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      setErrorBusqueda('');
      try {
        const res = await fetch(
          `${API_BASE_URL}/pacientes/search?q=${encodeURIComponent(q)}`,
          { headers: { Authorization: `Bearer ${token()}` } }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Error buscando pacientes');
        setResultados(Array.isArray(data) ? data : data.pacientes ?? []);
      } catch (e: any) {
        setErrorBusqueda(e.message);
        setResultados([]);
      } finally {
        setBuscando(false);
      }
    }, 400);
  }, []);

  useEffect(() => {
    buscarPacientes(query);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, buscarPacientes]);

  const seleccionarPaciente = (p: PacienteSARAI) => {
    setPacienteSeleccionado(p);
    setResultados([]);
    setQuery('');
    setStep(2);
  };

  const handleGuardar = async () => {
    if (!pacienteSeleccionado) return;
    setGuardando(true);
    setError('');
    try {
      const payload = {
        pacienteId: pacienteSeleccionado.id,
        fechaIngreso: new Date(fechaIngreso).toISOString(),
        entidadRemitente: entidadRemitente || undefined,
        observaciones: observaciones || undefined,
        historiaRenal: {
          diagnosticoPrincipal: diagnostico,
          codigoCIE10: cie10 || undefined,
          etiologia: etiologia === 'Otra' ? etiologiaOtra : (etiologia || undefined),
          estadioERC: estadioERC || undefined,
          categoriaAlbuminuria: catAlbumina || undefined,
          tfgBasal: tfg ? parseFloat(tfg) : undefined,
          creatininaBasal: creatinina ? parseFloat(creatinina) : undefined,
          modalidadActual: 'HEMODIALISIS',
        },
      };
      const inscripcion = await inscribirPaciente(payload);
      onExito(inscripcion);
    } catch (e: any) {
      setError(e.message ?? 'Error al inscribir paciente');
    } finally {
      setGuardando(false);
    }
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/8 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">💧 Inscribir Paciente — Hemodiálisis</h2>
            <p className="text-white/40 text-xs mt-0.5">
              Programa Renal · Res. 3241/2008 · Cuenta de Alto Costo
            </p>
          </div>
          <button onClick={onCancelar} className="text-white/30 hover:text-white/70 text-xl transition-colors">
            ✕
          </button>
        </div>

        {/* Pasos */}
        <div className="flex border-b border-white/8 shrink-0">
          {[
            { n: 1 as const, l: 'Buscar Paciente' },
            { n: 2 as const, l: 'Datos Clínicos' },
          ].map((s) => (
            <button
              key={s.n}
              onClick={() => pacienteSeleccionado && setStep(s.n)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                step === s.n
                  ? 'border-[#00B4D8] text-[#00B4D8]'
                  : 'border-transparent text-white/30 hover:text-white/50'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                  step === s.n ? 'bg-[#00B4D8] text-black' : 'bg-white/10 text-white/40'
                }`}
              >
                {s.n}
              </span>
              {s.l}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {/* ── PASO 1: Buscar Paciente ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                {pacienteSeleccionado ? (
                  // Paciente ya seleccionado
                  <div className="p-4 rounded-xl border border-[#00B4D8]/30 bg-[#00B4D8]/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#00B4D8]/20 flex items-center justify-center text-[#00B4D8] font-black text-lg">
                      {pacienteSeleccionado.nombreCompleto.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold">{pacienteSeleccionado.nombreCompleto}</p>
                      <p className="text-white/50 text-sm">
                        {pacienteSeleccionado.tipoDocumento} {pacienteSeleccionado.numeroDocumento}
                        {' · '}{edadDesde(pacienteSeleccionado.fechaNacimiento)} años
                        {' · '}{pacienteSeleccionado.genero}
                      </p>
                    </div>
                    <button
                      onClick={() => { setPacienteSeleccionado(null); setStep(1); }}
                      className="text-white/30 hover:text-red-400 text-sm transition-colors"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  // Búsqueda
                  <div>
                    <label className="block text-white/60 text-sm mb-2">
                      Buscar por nombre o número de documento
                    </label>
                    <div className="relative">
                      <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ej: 12345678 o Juan Pérez…"
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white
                          placeholder-white/25 focus:outline-none focus:border-[#00B4D8]/50 transition-colors text-sm"
                      />
                      {buscando && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-[#00B4D8]/40 border-t-[#00B4D8] rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    {errorBusqueda && (
                      <p className="text-red-400 text-xs mt-2">{errorBusqueda}</p>
                    )}

                    {/* Resultados */}
                    <AnimatePresence>
                      {resultados.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-2 space-y-1.5"
                        >
                          {resultados.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => seleccionarPaciente(p)}
                              className="w-full text-left p-3 rounded-xl border border-white/8 bg-white/3
                                hover:bg-[#00B4D8]/8 hover:border-[#00B4D8]/30 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/60 font-bold text-xs">
                                  {p.nombreCompleto.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="text-white font-semibold text-sm">{p.nombreCompleto}</p>
                                  <p className="text-white/40 text-xs">
                                    {p.tipoDocumento} {p.numeroDocumento}
                                    {p.fechaNacimiento ? ` · ${edadDesde(p.fechaNacimiento)} años` : ''}
                                  </p>
                                </div>
                                <span className="ml-auto text-[#00B4D8] text-xs font-medium">Seleccionar →</span>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {query.length >= 2 && !buscando && resultados.length === 0 && !errorBusqueda && (
                      <p className="text-white/30 text-sm mt-3 text-center">
                        No se encontraron pacientes con <strong className="text-white/50">{query}</strong>
                        <br />
                        <span className="text-xs">Verifique que el paciente esté registrado en SARAI</span>
                      </p>
                    )}

                    {query.length < 2 && (
                      <p className="text-white/20 text-xs mt-3">
                        Ingrese mínimo 2 caracteres para buscar
                      </p>
                    )}
                  </div>
                )}

                {pacienteSeleccionado && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 bg-[#00B4D8] text-black font-semibold rounded-xl text-sm hover:bg-[#00B4D8]/90 transition-colors"
                    >
                      Continuar → Datos Clínicos
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── PASO 2: Datos Clínicos ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                {/* Paciente seleccionado (resumen) */}
                {pacienteSeleccionado && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#00B4D8]/8 border border-[#00B4D8]/20 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-[#00B4D8]/20 flex items-center justify-center text-[#00B4D8] font-black text-sm">
                      {pacienteSeleccionado.nombreCompleto.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{pacienteSeleccionado.nombreCompleto}</p>
                      <p className="text-[#00B4D8]/70 text-xs">
                        {pacienteSeleccionado.tipoDocumento} {pacienteSeleccionado.numeroDocumento}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Diagnóstico y CIE-10 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-white/60 text-xs mb-1.5">Diagnóstico Principal *</label>
                      <input
                        value={diagnostico}
                        onChange={(e) => setDiagnostico(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                          placeholder-white/25 focus:outline-none focus:border-[#00B4D8]/40 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-xs mb-1.5">Código CIE-10</label>
                      <input
                        value={cie10}
                        onChange={(e) => setCie10(e.target.value)}
                        placeholder="N18.6"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                          placeholder-white/25 focus:outline-none focus:border-[#00B4D8]/40 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Etiología */}
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Etiología / Causa de la ERC</label>
                    <select
                      value={etiologia}
                      onChange={(e) => setEtiologia(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                        focus:outline-none focus:border-[#00B4D8]/40 transition-colors"
                    >
                      <option value="">— Seleccionar —</option>
                      {ETIOLOGIAS.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                    {etiologia === 'Otra' && (
                      <input
                        value={etiologiaOtra}
                        onChange={(e) => setEtiologiaOtra(e.target.value)}
                        placeholder="Especifique la etiología…"
                        className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                          placeholder-white/25 focus:outline-none focus:border-[#00B4D8]/40 transition-colors"
                      />
                    )}
                  </div>

                  {/* Clasificación KDIGO */}
                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                    <p className="text-blue-300/70 text-xs font-semibold mb-2 uppercase tracking-wide">
                      Clasificación KDIGO — Se calcula automáticamente
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-white/50 text-xs mb-1">Estadio ERC (TFG)</label>
                        <select
                          value={estadioERC}
                          onChange={(e) => setEstadioERC(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs
                            focus:outline-none focus:border-[#00B4D8]/40 transition-colors"
                        >
                          {ESTADIOS_ERC.map((e) => (
                            <option key={e.v} value={e.v}>{e.l}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-white/50 text-xs mb-1">Categoría Albuminuria</label>
                        <select
                          value={catAlbumina}
                          onChange={(e) => setCatAlbumina(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs
                            focus:outline-none focus:border-[#00B4D8]/40 transition-colors"
                        >
                          {CATEGORIAS_ALBUMIN.map((a) => (
                            <option key={a.v} value={a.v}>{a.l}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Valores de laboratorio basal */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/60 text-xs mb-1.5">TFG Basal (mL/min/1.73m²)</label>
                      <input
                        type="number"
                        value={tfg}
                        onChange={(e) => setTfg(e.target.value)}
                        placeholder="Ej: 8.5"
                        min="0"
                        max="200"
                        step="0.1"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                          placeholder-white/25 focus:outline-none focus:border-[#00B4D8]/40 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-xs mb-1.5">Creatinina Basal (mg/dL)</label>
                      <input
                        type="number"
                        value={creatinina}
                        onChange={(e) => setCreatinina(e.target.value)}
                        placeholder="Ej: 8.2"
                        min="0"
                        max="50"
                        step="0.1"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                          placeholder-white/25 focus:outline-none focus:border-[#00B4D8]/40 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Datos administrativos */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/60 text-xs mb-1.5">Fecha de Ingreso al Programa</label>
                      <input
                        type="date"
                        value={fechaIngreso}
                        onChange={(e) => setFechaIngreso(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                          focus:outline-none focus:border-[#00B4D8]/40 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-xs mb-1.5">Entidad Remitente</label>
                      <input
                        value={entidadRemitente}
                        onChange={(e) => setEntidadRemitente(e.target.value)}
                        placeholder="EPS / IPS remitente…"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                          placeholder-white/25 focus:outline-none focus:border-[#00B4D8]/40 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Observaciones de Ingreso</label>
                    <textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      rows={3}
                      placeholder="Antecedentes relevantes al ingreso…"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                        placeholder-white/25 focus:outline-none focus:border-[#00B4D8]/40 transition-colors resize-none"
                    />
                  </div>

                  {/* Nota normativa */}
                  <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/15 text-yellow-300/60 text-xs">
                    📋 Al inscribir se crearán automáticamente los tamizajes requeridos por Res. 3241/2008:
                    Hepatitis B/C, VIH, VDRL, vacunación (Influenza, HepB, Neumococo), ecocardiograma y fondo de ojo.
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      ⚠️ {error}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/8 flex items-center justify-between shrink-0">
          <button
            onClick={step === 1 ? onCancelar : () => setStep(1)}
            className="px-4 py-2 text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            {step === 1 ? 'Cancelar' : '← Volver'}
          </button>

          {step === 2 && (
            <button
              onClick={handleGuardar}
              disabled={guardando || !diagnostico}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#00B4D8] text-black font-bold rounded-xl text-sm
                hover:bg-[#00B4D8]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {guardando ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Inscribiendo…
                </>
              ) : (
                '✅ Inscribir al Programa'
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
