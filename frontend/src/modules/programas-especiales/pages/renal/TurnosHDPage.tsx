// HD-02 – Gestión de Turnos de Hemodiálisis (datos dinámicos desde parametrización)
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTurnos, useInscripciones, useParametrizacion } from '../../hooks/useHemodialisis';
import { useMaquinas } from '../../hooks/useDashboardRenal';
import type { TurnoHD, EsquemaConfig, JornadaConfig, SillonHD } from '../../types';
import { DIAS_SEMANA } from '../../types';

// Colores cíclicos para jornadas dinámicas
const COLORES_JORNADA = [
  { bg: 'bg-amber-500/10',  text: 'text-amber-300',  accent: 'border-amber-500/30' },
  { bg: 'bg-orange-500/10', text: 'text-orange-300', accent: 'border-orange-500/30' },
  { bg: 'bg-violet-500/10', text: 'text-violet-300', accent: 'border-violet-500/30' },
  { bg: 'bg-indigo-500/10', text: 'text-indigo-300', accent: 'border-indigo-500/30' },
  { bg: 'bg-rose-500/10',   text: 'text-rose-300',   accent: 'border-rose-500/30' },
  { bg: 'bg-teal-500/10',   text: 'text-teal-300',   accent: 'border-teal-500/30' },
];

function edadDesde(fechaNac: string) {
  return Math.floor(
    (Date.now() - new Date(fechaNac).getTime()) / (365.25 * 24 * 3600 * 1000)
  );
}

// ── Formulario de asignación ──────────────────────────────────

interface AsignacionFormProps {
  inscripciones: any[];
  maquinas: any[];
  sillones: SillonHD[];
  esquemas: EsquemaConfig[];
  jornadas: JornadaConfig[];
  turnoEditando?: TurnoHD | null;
  onGuardar: (data: any) => Promise<void>;
  onCerrar: () => void;
}

function AsignacionForm({
  inscripciones,
  maquinas,
  sillones,
  esquemas,
  jornadas,
  turnoEditando,
  onGuardar,
  onCerrar,
}: AsignacionFormProps) {
  const [form, setForm] = useState({
    inscripcionId: turnoEditando?.inscripcionId ?? '',
    esquema: turnoEditando?.esquema ?? (esquemas[0]?.codigo ?? ''),
    jornada: turnoEditando?.jornada ?? (jornadas[0]?.codigo ?? ''),
    sillaNumero: turnoEditando?.sillaNumero ?? '',
    maquinaId: turnoEditando?.maquinaId ?? '',
    observaciones: turnoEditando?.observaciones ?? '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inscripcionesSinTurno = inscripciones.filter((i) => i.estado === 'ACTIVO');
  const sillonesActivos = sillones.filter((s) => s.estado === 'ACTIVO');
  const jornadasActivas = [...jornadas].filter((j) => j.activo).sort((a, b) => a.orden - b.orden);
  const esquemasActivos = esquemas.filter((e) => e.activo);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.inscripcionId) { setError('Selecciona un paciente'); return; }
    setGuardando(true);
    setError(null);
    try {
      await onGuardar({
        ...form,
        maquinaId: form.maquinaId || undefined,
        sillaNumero: form.sillaNumero || undefined,
        observaciones: form.observaciones || undefined,
      });
      onCerrar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Paciente */}
      <div>
        <label className="block text-xs text-white/50 mb-1.5">Paciente *</label>
        <select
          value={form.inscripcionId}
          onChange={(e) => setForm((f) => ({ ...f, inscripcionId: e.target.value }))}
          disabled={!!turnoEditando}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm disabled:opacity-50"
        >
          <option value="">Seleccionar paciente…</option>
          {inscripcionesSinTurno.map((i) => (
            <option key={i.id} value={i.id}>
              {i.paciente?.nombreCompleto} — {i.paciente?.tipoDocumento}{' '}
              {i.paciente?.numeroDocumento}
            </option>
          ))}
        </select>
      </div>

      {/* Esquema */}
      <div>
        <label className="block text-xs text-white/50 mb-1.5">Esquema de turno *</label>
        <div className="grid grid-cols-2 gap-2">
          {esquemasActivos.map((esq) => (
            <button
              key={esq.codigo}
              type="button"
              onClick={() => setForm((f) => ({ ...f, esquema: esq.codigo }))}
              className={`py-3 rounded-xl border transition-all text-sm font-medium ${
                form.esquema === esq.codigo
                  ? 'bg-[#00B4D8]/15 border-[#00B4D8]/40 text-[#00B4D8]'
                  : 'bg-white/3 border-white/8 text-white/50 hover:bg-white/6'
              }`}
            >
              <p className="font-bold">{esq.codigo}</p>
              <p className="text-xs font-normal opacity-70">
                {esq.dias.map((d) => DIAS_SEMANA[d]?.substring(0, 2) ?? '').join(' · ')}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Jornada */}
      <div>
        <label className="block text-xs text-white/50 mb-1.5">Jornada *</label>
        <div className="grid grid-cols-2 gap-2">
          {jornadasActivas.map((jor, idx) => {
            const c = COLORES_JORNADA[idx % COLORES_JORNADA.length];
            const activa = form.jornada === jor.codigo;
            return (
              <button
                key={jor.codigo}
                type="button"
                onClick={() => setForm((f) => ({ ...f, jornada: jor.codigo }))}
                className={`py-2.5 px-3 rounded-xl border transition-all text-left ${
                  activa ? `${c.bg} ${c.accent} ${c.text}` : 'bg-white/3 border-white/8 text-white/50 hover:bg-white/6'
                }`}
              >
                <p className="text-sm font-medium">{jor.nombre}</p>
                <p className="text-xs opacity-60">{jor.horaInicio} – {jor.horaFin}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sillón y Máquina */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/50 mb-1">Sillón</label>
          {sillonesActivos.length > 0 ? (
            <select
              value={form.sillaNumero}
              onChange={(e) => setForm((f) => ({ ...f, sillaNumero: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Sin asignar</option>
              {sillonesActivos.map((s) => (
                <option key={s.id} value={s.numero}>
                  {s.numero}{s.descripcion ? ` – ${s.descripcion}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={form.sillaNumero}
              onChange={(e) => setForm((f) => ({ ...f, sillaNumero: e.target.value }))}
              placeholder="ej: A1, 5"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            />
          )}
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">Máquina</label>
          <select
            value={form.maquinaId}
            onChange={(e) => setForm((f) => ({ ...f, maquinaId: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="">Sin asignar</option>
            {maquinas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.codigo} – {m.marca}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-xs text-white/50 mb-1">Observaciones</label>
        <input
          type="text"
          value={form.observaciones}
          onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
          placeholder="Opcional"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCerrar}
          className="flex-1 py-2 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="flex-1 py-2 rounded-xl bg-[#00B4D8] text-white text-sm font-medium hover:bg-[#00B4D8]/80 disabled:opacity-50 transition-colors"
        >
          {guardando ? 'Guardando…' : turnoEditando ? 'Actualizar' : 'Asignar turno'}
        </button>
      </div>
    </form>
  );
}

// ── Tarjeta de paciente en turno ──────────────────────────────

function TurnoCard({
  turno,
  onEditar,
  onInactivar,
}: {
  turno: TurnoHD;
  onEditar: (t: TurnoHD) => void;
  onInactivar: (t: TurnoHD) => void;
}) {
  const p = turno.inscripcion?.paciente;
  if (!p) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-3 rounded-xl border border-white/8 bg-white/3 group hover:border-white/15 hover:bg-white/5 transition-all"
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-lg bg-[#00B4D8]/20 flex items-center justify-center text-[#00B4D8] text-xs font-bold shrink-0">
          {p.nombreCompleto.split(' ').slice(0, 2).map((n) => n[0]).join('')}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{p.nombreCompleto}</p>
          <p className="text-white/40 text-xs">
            {p.tipoDocumento} {p.numeroDocumento}
            {p.fechaNacimiento ? ` · ${edadDesde(p.fechaNacimiento)} años` : ''}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {turno.sillaNumero && (
              <span className="text-xs text-white/50 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
                Sillón {turno.sillaNumero}
              </span>
            )}
            {turno.maquina && (
              <span className="text-xs text-white/50 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
                {turno.maquina.codigo}
              </span>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEditar(turno)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
            title="Editar turno"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onInactivar(turno)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
            title="Retirar turno"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Columna de jornada ────────────────────────────────────────

function JornadaColumna({
  jornada,
  colorIndex,
  esquemaCodigo,
  turnos,
  onEditar,
  onInactivar,
}: {
  jornada: JornadaConfig;
  colorIndex: number;
  esquemaCodigo: string;
  turnos: TurnoHD[];
  onEditar: (t: TurnoHD) => void;
  onInactivar: (t: TurnoHD) => void;
}) {
  const c = COLORES_JORNADA[colorIndex % COLORES_JORNADA.length];
  const turnosFiltrados = turnos.filter(
    (t) => t.esquema === esquemaCodigo && t.jornada === jornada.codigo
  );

  return (
    <div className={`rounded-xl border ${c.accent} ${c.bg} p-3`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className={`text-sm font-semibold ${c.text}`}>{jornada.nombre}</p>
          <p className="text-white/30 text-xs">{jornada.horaInicio} – {jornada.horaFin}</p>
        </div>
        <span className={`text-lg font-bold ${c.text}`}>{turnosFiltrados.length}</span>
      </div>

      <div className="space-y-1.5">
        {turnosFiltrados.length === 0 ? (
          <p className="text-white/20 text-xs text-center py-3">Sin pacientes</p>
        ) : (
          turnosFiltrados.map((t) => (
            <TurnoCard key={t.id} turno={t} onEditar={onEditar} onInactivar={onInactivar} />
          ))
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────

export function TurnosHDPage() {
  const { turnos, loading, asignarTurno, inactivarTurno } = useTurnos();
  const { inscripciones } = useInscripciones({ estado: 'ACTIVO' });
  const { maquinas } = useMaquinas();
  const { param, loading: paramLoading } = useParametrizacion();

  // Esquemas y jornadas activos desde parametrización (con fallback vacío)
  const esquemasActivos = useMemo(
    () => (param?.esquemas ?? []).filter((e) => e.activo),
    [param]
  );
  const jornadasActivas = useMemo(
    () => [...(param?.jornadas ?? [])].filter((j) => j.activo).sort((a, b) => a.orden - b.orden),
    [param]
  );
  const sillonesActivos = useMemo(
    () => (param?.sillones ?? []).filter((s) => s.estado === 'ACTIVO'),
    [param]
  );

  const [esquemaCodigo, setEsquemaCodigo] = useState<string>('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [turnoEditando, setTurnoEditando] = useState<TurnoHD | null>(null);

  // Auto-seleccionar primer esquema cuando carga
  const esquemaSeleccionado = esquemaCodigo || esquemasActivos[0]?.codigo || '';

  async function handleInactivar(turno: TurnoHD) {
    const nombre = turno.inscripcion?.paciente?.nombreCompleto ?? 'este paciente';
    if (confirm(`¿Retirar turno de ${nombre}?`)) {
      await inactivarTurno(turno.inscripcionId);
    }
  }

  const turnosEsquema = turnos.filter((t) => t.esquema === esquemaSeleccionado);
  const hoy = new Date().getDay();

  const cargando = loading || paramLoading;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-white text-lg font-semibold">Gestión de Turnos HD</h2>
          <p className="text-white/40 text-sm mt-0.5">
            Asignación de pacientes por esquema y jornada
          </p>
        </div>
        <button
          onClick={() => { setTurnoEditando(null); setMostrarForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00B4D8] text-white text-sm font-medium hover:bg-[#00B4D8]/80 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Asignar turno
        </button>
      </div>

      {/* Selector de esquema dinámico */}
      {cargando ? (
        <div className="flex gap-3">
          {[1, 2].map((i) => <div key={i} className="h-14 w-40 rounded-xl bg-white/4 animate-pulse" />)}
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          {esquemasActivos.map((esq) => {
            const tieneHoy = esq.dias.includes(hoy === 0 ? 6 : hoy - 1); // JS: 0=Dom
            return (
              <button
                key={esq.codigo}
                onClick={() => setEsquemaCodigo(esq.codigo)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${
                  esquemaSeleccionado === esq.codigo
                    ? 'bg-[#00B4D8]/15 border-[#00B4D8]/40 text-white'
                    : 'bg-white/3 border-white/8 text-white/50 hover:bg-white/6'
                }`}
              >
                <div>
                  <p className="text-sm font-bold">{esq.codigo}</p>
                  <p className="text-xs opacity-60">{esq.nombre}</p>
                </div>
                <div className="flex gap-1">
                  {esq.dias.map((d) => (
                    <span key={d} className="w-6 h-6 rounded-md bg-white/10 text-xs flex items-center justify-center">
                      {DIAS_SEMANA[d]?.substring(0, 2) ?? '?'}
                    </span>
                  ))}
                </div>
                {tieneHoy && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Hoy
                  </span>
                )}
                <span className="text-white/30 text-xs ml-1">
                  {turnos.filter((t) => t.esquema === esq.codigo).length} pac.
                </span>
              </button>
            );
          })}
          {esquemasActivos.length === 0 && (
            <p className="text-white/30 text-sm py-2">
              Sin esquemas configurados — ve a{' '}
              <span className="text-[#00B4D8]">⚙️ Parametrización HD</span> para crear esquemas
            </p>
          )}
        </div>
      )}

      {/* Grid de jornadas dinámico */}
      {cargando ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-white/4 animate-pulse" />
          ))}
        </div>
      ) : jornadasActivas.length > 0 ? (
        <div className={`grid gap-3 ${jornadasActivas.length <= 2 ? 'grid-cols-2' : jornadasActivas.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {jornadasActivas.map((jor, idx) => (
            <JornadaColumna
              key={jor.codigo}
              jornada={jor}
              colorIndex={idx}
              esquemaCodigo={esquemaSeleccionado}
              turnos={turnosEsquema}
              onEditar={(t) => { setTurnoEditando(t); setMostrarForm(true); }}
              onInactivar={handleInactivar}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-white/30">
          <p className="text-4xl mb-2">⚙️</p>
          <p className="text-sm">No hay jornadas configuradas</p>
          <p className="text-xs mt-1">Ve a <span className="text-[#00B4D8]">Parametrización HD</span> para crear jornadas</p>
        </div>
      )}

      {turnosEsquema.length === 0 && !cargando && jornadasActivas.length > 0 && (
        <div className="text-center py-6 text-white/30">
          <p className="text-4xl mb-2">📅</p>
          <p className="text-sm">No hay pacientes en el esquema {esquemaSeleccionado}</p>
          <p className="text-xs mt-1">Asigna pacientes con el botón "Asignar turno"</p>
        </div>
      )}

      {/* Modal de asignación */}
      <AnimatePresence>
        {mostrarForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={(e) => e.target === e.currentTarget && setMostrarForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-2xl border border-white/10 p-6"
              style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #0d1117 100%)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold">
                  {turnoEditando ? 'Editar turno' : 'Asignar turno'}
                </h3>
                <button
                  onClick={() => setMostrarForm(false)}
                  className="text-white/30 hover:text-white/70 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <AsignacionForm
                inscripciones={inscripciones}
                maquinas={maquinas}
                sillones={sillonesActivos}
                esquemas={esquemasActivos}
                jornadas={jornadasActivas}
                turnoEditando={turnoEditando}
                onGuardar={asignarTurno}
                onCerrar={() => setMostrarForm(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
