import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInscripciones, useContadoresDia, useTurnoInscripcion, useSerologia, useTurnos } from '../../hooks/useHemodialisis';
import { useMaquinas } from '../../hooks/useDashboardRenal';
import { useSesiones, useAccesos } from '../../hooks/useHemodialisis';
import { SesionDialisisForm } from '../../components/hemodialisis/SesionDialisisForm';
import { SesionDialisisList } from '../../components/hemodialisis/SesionDialisisList';
import { AccesoVascularCard } from '../../components/hemodialisis/AccesoVascularCard';
import { InscripcionForm } from '../../components/hemodialisis/InscripcionForm';
import { ContadoresDia } from '../../components/hemodialisis/ContadoresDia';
import { SerologiaPanel } from '../../components/hemodialisis/SerologiaPanel';
import { EstadoBadge, RiesgoKDIGOBadge, KtVIndicator } from '../../components/shared/Badges';
import type { InscripcionPrograma, SesionHemodialisis, RiesgoKDIGO } from '../../types';
import { ESTADIO_ERC_LABELS, MODALIDAD_LABELS, ESQUEMA_LABELS, JORNADA_LABELS } from '../../types';

type Vista = 'lista' | 'sesiones' | 'nuevaSesion' | 'accesos' | 'serologia';

function edadDesde(fechaNac: string): number {
  return Math.floor(
    (Date.now() - new Date(fechaNac).getTime()) / (365.25 * 24 * 3600 * 1000)
  );
}

// ── Tarjeta de paciente HD ────────────────────────────────────

function TurnoBadge({ esquema, jornada }: { esquema: string; jornada: string }) {
  return (
    <span className="text-xs bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-full">
      {esquema} · {JORNADA_LABELS[jornada as keyof typeof JORNADA_LABELS] ?? jornada}
    </span>
  );
}

function PacienteHDCard({
  inscripcion,
  turno,
  seleccionado,
  onClick,
}: {
  inscripcion: InscripcionPrograma;
  turno?: { esquema: string; jornada: string } | null;
  seleccionado: boolean;
  onClick: () => void;
}) {
  const p = inscripcion.paciente!;
  const hr = inscripcion.historiaRenal;

  return (
    <motion.button
      layout
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        seleccionado
          ? 'border-[#00B4D8]/60 bg-[#00B4D8]/8 ring-1 ring-[#00B4D8]/20'
          : 'border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/15'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-[#00B4D8]/20 flex items-center justify-center text-[#00B4D8] font-bold text-sm shrink-0">
          {p.nombreCompleto.split(' ').slice(0, 2).map((n) => n[0]).join('')}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{p.nombreCompleto}</p>
          <p className="text-white/50 text-xs">
            {p.tipoDocumento} {p.numeroDocumento} · {edadDesde(p.fechaNacimiento)} años
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <EstadoBadge estado={inscripcion.estado} />
            {turno && <TurnoBadge esquema={turno.esquema} jornada={turno.jornada} />}
            {hr?.estadioERC && (
              <span className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full">
                {hr.estadioERC}
              </span>
            )}
            {hr?.riesgoKDIGO && (
              <RiesgoKDIGOBadge riesgo={hr.riesgoKDIGO as RiesgoKDIGO} size="sm" />
            )}
          </div>
          {hr?.modalidadActual && (
            <p className="text-white/30 text-xs mt-1">
              {MODALIDAD_LABELS[hr.modalidadActual] ?? hr.modalidadActual}
            </p>
          )}
        </div>

        {hr?.tfgBasal && (
          <div className="text-right shrink-0">
            <p className="text-white/40 text-xs">TFG</p>
            <p className="text-white font-bold text-sm">{hr.tfgBasal}</p>
            <p className="text-white/30 text-xs">mL/min</p>
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ── Panel de detalle del paciente HD ─────────────────────────

function PacienteHDDetalle({
  inscripcion,
  onCerrar,
  vistaActiva,
  setVista,
}: {
  inscripcion: InscripcionPrograma;
  onCerrar: () => void;
  vistaActiva: Vista;
  setVista: (v: Vista) => void;
}) {
  const { maquinas } = useMaquinas();
  const { sesiones, total, loading: loadSesiones, crearSesion, actualizarSesion } = useSesiones(inscripcion.id);
  const { accesos, loading: loadAccesos } = useAccesos(inscripcion.id);
  const { data: serologiaData, loading: loadSerologia, guardando: guardandoSerologia, guardar: guardarSerologia } = useSerologia(inscripcion.id);
  const { turno } = useTurnoInscripcion(inscripcion.id);
  const [sesionEditar, setSesionEditar] = useState<SesionHemodialisis | null>(null);

  const p = inscripcion.paciente!;
  const hr = inscripcion.historiaRenal;

  const handleGuardarSesion = async (data: Partial<SesionHemodialisis>) => {
    if (sesionEditar) {
      await actualizarSesion(sesionEditar.id, data);
    } else {
      await crearSesion(data);
    }
    setSesionEditar(null);
    setVista('sesiones');
  };

  // Reactivos en serología (alerta rápida)
  const reactivosSerologia = serologiaData?.registros.filter((r) => r.resultado === 'REACTIVO') ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header paciente */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-[#00B4D8]/20 flex items-center justify-center text-[#00B4D8] font-black text-lg">
            {p.nombreCompleto.split(' ').slice(0, 2).map((n) => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base truncate">{p.nombreCompleto}</p>
            <p className="text-white/50 text-xs">
              {p.tipoDocumento} {p.numeroDocumento} · {p.genero} · {edadDesde(p.fechaNacimiento)} años
            </p>
            {/* P4: Badge de turno */}
            {turno && (
              <span className="inline-block mt-1 text-xs bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-full">
                📅 {turno.esquema} · {JORNADA_LABELS[turno.jornada as keyof typeof JORNADA_LABELS]}
                {turno.sillaNumero ? ` — Sillón ${turno.sillaNumero}` : ''}
              </span>
            )}
            {/* Alerta serología reactiva */}
            {reactivosSerologia.length > 0 && (
              <span className="inline-block mt-1 ml-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                ⚠️ Serología: {reactivosSerologia.map((r) => r.marcador).join(', ')}
              </span>
            )}
          </div>
          <button onClick={onCerrar} className="text-white/30 hover:text-white/60 transition-colors">
            ✕
          </button>
        </div>

        {/* Datos clínicos clave */}
        {hr && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2 bg-white/5 rounded-lg">
              <p className="text-white/40 text-xs">Estadio ERC</p>
              <p className="text-white font-bold text-sm">{hr.estadioERC ?? '—'}</p>
            </div>
            <div className="p-2 bg-white/5 rounded-lg">
              <p className="text-white/40 text-xs">TFG Basal</p>
              <p className="text-white font-bold text-sm">{hr.tfgBasal ?? '—'} <span className="text-white/30 text-xs font-normal">mL/min</span></p>
            </div>
            <div className="p-2 bg-white/5 rounded-lg">
              <p className="text-white/40 text-xs">Modalidad</p>
              <p className="text-white font-bold text-xs">{MODALIDAD_LABELS[hr.modalidadActual ?? ''] ?? '—'}</p>
            </div>
            <div className="p-2 bg-white/5 rounded-lg">
              <p className="text-white/40 text-xs">Riesgo KDIGO</p>
              {hr.riesgoKDIGO ? (
                <RiesgoKDIGOBadge riesgo={hr.riesgoKDIGO as RiesgoKDIGO} size="sm" />
              ) : (
                <p className="text-white/40 text-sm">—</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-white/3 overflow-x-auto">
        {[
          { id: 'sesiones' as Vista, label: '💧 Sesiones HD', badge: total },
          { id: 'nuevaSesion' as Vista, label: '+ Nueva Sesión' },
          { id: 'accesos' as Vista, label: '🔗 Accesos', badge: accesos.length },
          {
            id: 'serologia' as Vista,
            label: '🧪 Serología',
            badge: reactivosSerologia.length || undefined,
            badgeColor: reactivosSerologia.length ? 'bg-red-500/20 text-red-400' : undefined,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setVista(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap ${
              vistaActiva === tab.id
                ? 'border-[#00B4D8] text-[#00B4D8]'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className={`text-xs px-1.5 rounded-full ${tab.badgeColor ?? 'bg-[#00B4D8]/20 text-[#00B4D8]'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {vistaActiva === 'sesiones' && (
            <motion.div key="sesiones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SesionDialisisList
                sesiones={sesiones}
                total={total}
                loading={loadSesiones}
                onNueva={() => setVista('nuevaSesion')}
                onEditar={(s) => {
                  setSesionEditar(s);
                  setVista('nuevaSesion');
                }}
              />
            </motion.div>
          )}

          {vistaActiva === 'nuevaSesion' && (
            <motion.div key="nueva" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SesionDialisisForm
                inscripcionId={inscripcion.id}
                accesos={accesos}
                maquinas={maquinas}
                sesionEditar={sesionEditar ?? undefined}
                onGuardar={handleGuardarSesion}
                onCancelar={() => {
                  setSesionEditar(null);
                  setVista('sesiones');
                }}
              />
            </motion.div>
          )}

          {vistaActiva === 'accesos' && (
            <motion.div key="accesos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AccesoVascularCard accesos={accesos} loading={loadAccesos} />
            </motion.div>
          )}

          {vistaActiva === 'serologia' && (
            <motion.div key="serologia" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-3">
                <p className="text-white text-sm font-semibold">Estado Serológico</p>
                <p className="text-white/40 text-xs mt-0.5">
                  Perfil de marcadores virales — actualizar al menos una vez al año (Res. 3241/2008)
                </p>
              </div>
              <SerologiaPanel
                data={serologiaData}
                loading={loadSerologia}
                guardando={guardandoSerologia}
                onGuardar={guardarSerologia}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Página principal Hemodiálisis ─────────────────────────────

export function HemodialisisPage() {
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('ACTIVO');
  const [inscripcionSeleccionada, setInscripcionSeleccionada] = useState<InscripcionPrograma | null>(null);
  const [vistaDetalle, setVistaDetalle] = useState<Vista>('sesiones');
  const [mostrarFormInscripcion, setMostrarFormInscripcion] = useState(false);

  const { inscripciones, total, loading, error, refetch } = useInscripciones({
    estado: estadoFiltro || undefined,
    search: search || undefined,
  });

  const { contadores, loading: loadContadores, refetch: refetchContadores } = useContadoresDia();
  const { turnos: todosTurnos } = useTurnos();

  // Mapa inscripcionId → turno para mostrar badge P4
  const turnoMap = Object.fromEntries(todosTurnos.map((t) => [t.inscripcionId, t]));

  // Filtrar solo los que tienen modalidad HD
  const hdPacientes = inscripciones.filter(
    (i) => !i.historiaRenal || i.historiaRenal.modalidadActual === 'HEMODIALISIS' || !i.historiaRenal.modalidadActual
  );

  const handleInscripcionExitosa = (inscripcion: InscripcionPrograma) => {
    setMostrarFormInscripcion(false);
    refetch();
    setInscripcionSeleccionada(inscripcion);
    setVistaDetalle('sesiones');
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Modal de inscripción */}
      <AnimatePresence>
        {mostrarFormInscripcion && (
          <InscripcionForm
            onExito={handleInscripcionExitosa}
            onCancelar={() => setMostrarFormInscripcion(false)}
          />
        )}
      </AnimatePresence>

      {/* Panel izquierdo: lista de pacientes */}
      <div
        className={`flex flex-col border-r border-white/5 bg-[#0d0f14] transition-all duration-300 ${
          inscripcionSeleccionada ? 'w-0 lg:w-80 overflow-hidden lg:overflow-visible' : 'w-full lg:w-96'
        }`}
      >
        {/* Header lista */}
        <div className="p-4 border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-white font-bold text-base">💧 Hemodiálisis</h2>
              <p className="text-white/40 text-xs">{total} pacientes</p>
            </div>
            <button
              onClick={() => setMostrarFormInscripcion(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00B4D8]/15 text-[#00B4D8] border border-[#00B4D8]/30
                rounded-lg text-xs font-semibold hover:bg-[#00B4D8]/25 transition-colors"
            >
              + Inscribir
            </button>
          </div>

          {/* P6: Contadores del día */}
          <div className="mb-3">
            <ContadoresDia
              contadores={contadores}
              loading={loadContadores}
              onRefresh={refetchContadores}
            />
          </div>

          {/* Búsqueda */}
          <div className="relative mb-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o documento…"
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-white
                placeholder-white/30 focus:outline-none focus:border-[#00B4D8]/40 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro estado */}
          <div className="flex gap-1 overflow-x-auto">
            {[
              { v: 'ACTIVO', l: 'Activos' },
              { v: '',       l: 'Todos' },
              { v: 'RETIRADO', l: 'Retirados' },
            ].map((f) => (
              <button
                key={f.v}
                onClick={() => setEstadoFiltro(f.v)}
                className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                  estadoFiltro === f.v
                    ? 'bg-[#00B4D8]/20 text-[#00B4D8] border border-[#00B4D8]/30'
                    : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'
                }`}
              >
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white/3 border border-white/5 animate-pulse" />
            ))
          ) : error ? (
            <p className="text-red-400 text-sm p-3">{error}</p>
          ) : hdPacientes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">💧</p>
              <p className="text-white/40 text-sm">No hay pacientes en hemodiálisis</p>
            </div>
          ) : (
            hdPacientes.map((ins) => (
              <PacienteHDCard
                key={ins.id}
                inscripcion={ins}
                turno={turnoMap[ins.id] ?? null}
                seleccionado={inscripcionSeleccionada?.id === ins.id}
                onClick={() => {
                  setInscripcionSeleccionada(ins);
                  setVistaDetalle('sesiones');
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Panel derecho: detalle */}
      {inscripcionSeleccionada ? (
        <div className="flex-1 overflow-hidden">
          <PacienteHDDetalle
            inscripcion={inscripcionSeleccionada}
            onCerrar={() => setInscripcionSeleccionada(null)}
            vistaActiva={vistaDetalle}
            setVista={setVistaDetalle}
          />
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">💧</div>
            <p className="text-white/30 text-lg font-medium">Selecciona un paciente</p>
            <p className="text-white/20 text-sm mt-1">para ver sus sesiones de hemodiálisis</p>
          </div>
        </div>
      )}
    </div>
  );
}
