/**
 * CU-01: Configuración de Agenda del Profesional — v4 (his-core)
 * + Calendario integrado Mes / Semana / Día (estilo AgendaPage)
 * + Filtro profesional dinámico: nombre, especialidad, cédula/documento
 *
 * Migrado del modelo viejo de "Disponibilidad" (horario semanal recurrente + bloqueos,
 * ambos abstractos y sin sede/consultorio reales) al modelo nuevo de his-core: los
 * "turnos" son aperturas de agenda reales y fechadas, ligadas a Sede → Departamento →
 * Consultorio → Profesional → Especialidad. "Nueva Franja" ahora genera turnos reales
 * en lote (POST /agenda-organizacional/turnos/masivos) sobre un rango de fechas concreto;
 * "Bloqueo" y "Eliminar" cancelan turnos existentes (no hay concepto de bloqueo aparte).
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL, authFetch } from '../../services/api';
import {
  Settings, Plus, Trash2, Clock,
  AlertCircle, Check, X, User, ChevronDown, Search,
  Zap, Sun, Sunset, CalendarX2, CalendarCheck2,
  RefreshCw, MapPin, Stethoscope,
  ChevronLeft, ChevronRight, LayoutGrid, CalendarDays, CalendarRange,
} from 'lucide-react';

// ─── Constantes ───────────────────────────────────────────────────────────────
const DIAS_CORTO  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_LARGO  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const INTERVALOS  = [10, 15, 20, 30, 45, 60, 90, 120];
const DIAS_LABORALES = [1, 2, 3, 4, 5, 6];
const MODALIDADES: { value: 'PRESENCIAL' | 'TELEMEDICINA' | 'HIBRIDA'; label: string }[] = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'TELEMEDICINA', label: 'Telemedicina' },
  { value: 'HIBRIDA', label: 'Híbrida' },
];

const PLANTILLAS = [
  { label: 'Mañana',  icon: Sun,    horaInicio: '07:00', horaFin: '12:00' },
  { label: 'Tarde',   icon: Sunset, horaInicio: '13:00', horaFin: '18:00' },
  { label: 'Jornada', icon: Zap,    horaInicio: '07:00', horaFin: '17:00' },
  { label: 'Completa',icon: Check,  horaInicio: '07:00', horaFin: '18:00' },
];

// ─── Interfaces (contrato real de his-core) ───────────────────────────────────
interface Profesional {
  id: string; nombreCompleto: string;
  especialidadPrincipal: string | null; registroMedico: string | null;
}
interface Sede { id: string; codigo: string; nombre: string; activo: boolean; ciudad?: string | null }
interface Departamento { id: string; codigo: string; nombre: string; activo: boolean }
interface Consultorio { id: string; codigo: string; nombre: string; activo: boolean }
interface Especialidad { id: string; codigo: string; nombre: string; estado: boolean }
interface TipoConsultaItem { id: string; especialidadId: string; codigo: string; nombre: string; estado: boolean }
interface Turno {
  id: string;
  sede: { id: string; nombre: string };
  departamento: { id: string; nombre: string };
  consultorio: { id: string; nombre: string };
  profesional: { id: string; nombreCompleto: string };
  especialidadId: string;
  fecha: string; horaInicio: string; horaFin: string;
  intervaloMinutos: number; sobrecuposMax: number; modalidad: string; estado: string;
  motivoBloqueo?: string | null;
  citasActivas: number;
}
type Vista = 'mes' | 'semana' | 'dia';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10);
const calcTurnos = (hI: string, hF: string, slot: number) => {
  const [hi, mi] = hI.split(':').map(Number);
  const [hf, mf] = hF.split(':').map(Number);
  const diff = (hf * 60 + mf) - (hi * 60 + mi);
  return diff > 0 && slot > 0 ? Math.floor(diff / slot) : 0;
};
const fmtFecha = (iso: string) =>
  iso ? new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const startOfWeek = (d: Date) => {
  const c = new Date(d);
  const dow = c.getDay(); // 0=Dom
  const diff = dow === 0 ? -6 : 1 - dow; // lunes
  c.setDate(c.getDate() + diff);
  c.setHours(0, 0, 0, 0);
  return c;
};

// ─── Cliente HTTP hacia his-core (con rotación automática de token vía authFetch) ─
const AGENDA_API = `${API_URL}/agenda-organizacional`;
const agenda = <T,>(path: string, options?: RequestInit) => authFetch<T>(`${AGENDA_API}${path}`, options);
const nucleo = <T,>(path: string, options?: RequestInit) => authFetch<T>(`${API_URL}${path}`, options);

// ─── Sub-componente: Barra mini horario ───────────────────────────────────────
function HoraBarra({ inicio, fin }: { inicio: string; fin: string }) {
  const pct = (h: string) => {
    const [hh, mm] = h.split(':').map(Number);
    return Math.max(0, Math.min(100, ((hh * 60 + mm - 420) / 660) * 100));
  };
  return (
    <div className="relative h-1 bg-white/10 rounded-full w-full">
      <div
        className="absolute top-0 h-full bg-yellow-400 rounded-full"
        style={{ left: `${pct(inicio)}%`, width: `${Math.max(4, pct(fin) - pct(inicio))}%` }}
      />
    </div>
  );
}

// ─── Sub-componente: Calendario Mes ──────────────────────────────────────────
function CalMes({
  fecha, setFecha, setVista, turnosPorFecha, onClickDia, diaActivo, onClickMes,
}: {
  fecha: Date; setFecha: (d: Date) => void; setVista: (v: Vista) => void;
  turnosPorFecha: Record<string, Turno[]>;
  onClickDia: (d: Date) => void; diaActivo: Date | null;
  onClickMes?: (mes: number, año: number) => void;
}) {
  const [subVista, setSubVista] = useState<'cal' | 'meses' | 'años'>('cal');
  const [añoNav,   setAñoNav]   = useState(fecha.getFullYear());
  const hoyMes = new Date().getMonth(); // 0-based
  const hoyAño = new Date().getFullYear();

  const year  = fecha.getFullYear();
  const month = fecha.getMonth();
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const primerDow = new Date(year, month, 1).getDay();
  const hoy       = new Date(); hoy.setHours(0,0,0,0);
  const celdas: (number | null)[] = [
    ...Array(primerDow).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const decadaInicio = Math.floor(añoNav / 10) * 10;
  const tituloNav =
    subVista === 'cal'  ? `${['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][month]} ${year}` :
    subVista === 'meses'? `${añoNav}` :
    `${decadaInicio} – ${decadaInicio + 9}`;

  const navPrev = () => {
    if (subVista === 'cal')   setFecha(new Date(year, month - 1, 1));
    if (subVista === 'meses' && añoNav > hoyAño) setAñoNav(a => a - 1);
    if (subVista === 'años')  setAñoNav(a => a - 10);
  };
  const navNext = () => {
    if (subVista === 'cal')   setFecha(new Date(year, month + 1, 1));
    if (subVista === 'meses') setAñoNav(a => a + 1);
    if (subVista === 'años')  setAñoNav(a => a + 10);
  };

  return (
    <div className="max-w-[480px] mx-auto w-full">
      {/* Cabecera navegación */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={navPrev}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400 transition-all">
          <ChevronLeft size={14}/>
        </button>
        <button
          onClick={() => setSubVista(v => v === 'cal' ? 'meses' : 'cal')}
          className="flex items-center gap-1 text-white font-black text-sm hover:text-yellow-400 transition-colors">
          {tituloNav}
          <ChevronDown size={11} className={`text-yellow-400/60 transition-transform ${subVista !== 'cal' ? 'rotate-180' : ''}`}/>
        </button>
        <button onClick={navNext}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400 transition-all">
          <ChevronRight size={14}/>
        </button>
      </div>

      {/* Vista: Años */}
      {subVista === 'años' && (
        <div className="grid grid-cols-4 gap-1.5 pb-2">
          {Array.from({ length: 12 }, (_, i) => decadaInicio - 1 + i).map(a => (
            <button key={a}
              onClick={() => { setAñoNav(a); setSubVista('meses'); }}
              className={`py-2.5 rounded-lg text-xs font-bold transition-all
                ${a === year ? 'bg-yellow-500 text-slate-900 shadow-md' :
                  a < decadaInicio || a > decadaInicio + 9 ? 'text-gray-700 bg-white/[0.02] border border-white/[0.03]' :
                  'bg-white/[0.04] text-gray-300 hover:bg-yellow-500/15 hover:text-yellow-300 border border-white/[0.06]'}`}>
              {a}
            </button>
          ))}
        </div>
      )}

      {/* Vista: Meses */}
      {subVista === 'meses' && (
        <div className="pb-2">
          <div className="grid grid-cols-4 gap-1.5">
            {MESES_CORTO.map((m, i) => {
              const isPast = añoNav === hoyAño && i < hoyMes;
              const isSel  = i === fecha.getMonth() && añoNav === fecha.getFullYear();
              return (
                <button key={i}
                  disabled={isPast}
                  onClick={() => {
                    setFecha(new Date(añoNav, i, 1));
                    if (onClickMes) onClickMes(i + 1, añoNav); // mes 1-based
                  }}
                  className={`py-2.5 rounded-lg text-xs font-bold transition-all
                    ${isPast ? 'opacity-20 cursor-not-allowed text-gray-600 bg-white/[0.02]' :
                      isSel  ? 'bg-yellow-500 text-slate-900 shadow-md ring-2 ring-yellow-400/40' :
                      'bg-white/[0.04] text-gray-400 hover:bg-yellow-500/15 hover:text-yellow-300 border border-white/[0.06]'}`}>
                  {m}
                </button>
              );
            })}
          </div>
          <p className="text-center text-[9px] text-gray-700 mt-2">Clic en el título para ver los días</p>
        </div>
      )}

      {/* Vista: Días del mes */}
      {subVista === 'cal' && (
        <>
          {/* Cabecera días semana */}
          <div className="grid grid-cols-7 mb-1">
            {DIAS_CORTO.map(d => (
              <div key={d} className="text-center text-[9px] font-black text-yellow-400/70 uppercase tracking-wider py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Celdas */}
          <div className="grid grid-cols-7 gap-1">
            {celdas.map((dia, i) => {
              if (!dia) return <div key={i} className="h-10" />;
              const fecha_ = new Date(year, month, dia);
              fecha_.setHours(0,0,0,0);
              const dow         = fecha_.getDay();
              const turnosDia   = turnosPorFecha[isoDate(fecha_)] || [];
              const esHoy       = isoDate(fecha_) === isoDate(hoy);
              const esActivo    = diaActivo ? isoDate(fecha_) === isoDate(diaActivo) : false;
              const tieneTurnos = turnosDia.length > 0;
              const esDom       = dow === 0;
              return (
                <button key={i}
                  onClick={() => !esDom && onClickDia(fecha_)}
                  disabled={esDom}
                  className={`
                    relative h-10 flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all
                    ${esDom ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}
                    ${esActivo ? 'bg-yellow-500 text-slate-900 shadow-md shadow-yellow-500/25' :
                      tieneTurnos && !esDom ? 'bg-yellow-500/10 border border-yellow-500/20 text-white hover:bg-yellow-500/20' :
                      'bg-white/[0.02] border border-white/[0.04] text-gray-500 hover:bg-white/[0.06] hover:text-gray-300'}
                    ${esHoy && !esActivo ? 'ring-1 ring-yellow-400/60' : ''}
                  `}>
                  <span>{dia}</span>
                  {tieneTurnos && !esActivo && !esDom && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-yellow-400"/>
                  )}
                </button>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[9px] text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/70"/> Turnos abiertos
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-componente: Calendario Semana ───────────────────────────────────────
function CalSemana({
  fecha, setFecha, turnosPorFecha, onClickDia, diaActivo, eliminarDisp, setPanelActivo, setFranja,
}: {
  fecha: Date; setFecha: (d: Date) => void;
  turnosPorFecha: Record<string, Turno[]>;
  onClickDia: (d: Date) => void; diaActivo: Date | null;
  eliminarDisp: (id: string) => void;
  setPanelActivo: (p: 'franja' | 'bloqueo' | 'eliminar' | null) => void;
  setFranja: (fn: (p: any) => any) => void;
}) {
  const lunes = startOfWeek(fecha);
  const dias7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes); d.setDate(lunes.getDate() + i); return d;
  });
  const hoy = new Date(); hoy.setHours(0,0,0,0);

  return (
    <div className="flex flex-col h-full">
      {/* Nav semana */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <button onClick={() => { const d = new Date(lunes); d.setDate(d.getDate() - 7); setFecha(d); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400 transition-all">
          <ChevronLeft size={14}/>
        </button>
        <span className="text-white font-bold text-xs">
          {fmtFecha(isoDate(lunes))} – {fmtFecha(isoDate(dias7[6]))}
        </span>
        <button onClick={() => { const d = new Date(lunes); d.setDate(d.getDate() + 7); setFecha(d); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400 transition-all">
          <ChevronRight size={14}/>
        </button>
      </div>

      {/* Columnas */}
      <div className="grid grid-cols-7 gap-2 flex-1 overflow-y-auto">
        {dias7.map((d, i) => {
          const dow       = d.getDay();
          const turnosDia = [...(turnosPorFecha[isoDate(d)] || [])].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
          const esHoy     = isoDate(d) === isoDate(hoy);
          const esDom     = dow === 0;
          const esActivo  = diaActivo ? isoDate(d) === isoDate(diaActivo) : false;
          const totalCitas = turnosDia.reduce((acc, t) => acc + t.citasActivas, 0);

          return (
            <div key={i}
              className={`rounded-xl border flex flex-col transition-all overflow-hidden
                ${esDom ? 'opacity-25' : ''}
                ${esHoy ? 'border-yellow-400/40 bg-yellow-500/[0.06] shadow-lg shadow-yellow-500/5'
                  : turnosDia.length > 0 ? 'border-white/[0.08] bg-white/[0.02]' : 'border-white/[0.05] bg-white/[0.015]'}
                ${esActivo ? 'ring-1 ring-yellow-400/50' : ''}
              `}>

              {/* Cabecera día */}
              <div className={`flex items-center justify-between px-2.5 pt-2.5 pb-2 border-b flex-shrink-0
                ${esHoy ? 'border-yellow-500/20' : turnosDia.length > 0 ? 'border-white/[0.06]' : 'border-white/[0.04]'}`}>
                <div className="flex items-baseline gap-1.5">
                  <p className={`text-[9px] font-black tracking-wide uppercase
                    ${esHoy ? 'text-yellow-400' : 'text-gray-600'}`}>
                    {DIAS_CORTO[dow]}
                  </p>
                  <p className={`text-base font-black leading-none ${esHoy ? 'text-white' : 'text-gray-400'}`}>
                    {d.getDate()}
                  </p>
                </div>
                {turnosDia.length > 0 && (
                  <div className="flex items-center gap-1">
                    {totalCitas > 0 && (
                      <span title={`${totalCitas} cita(s) agendada(s)`} className="text-[8px] font-bold bg-emerald-500/15 text-emerald-400 rounded-full px-1.5 py-0.5">
                        {totalCitas}
                      </span>
                    )}
                    <span className="text-[8px] font-bold bg-yellow-500/15 text-yellow-400 rounded-full px-1.5 py-0.5">
                      {turnosDia.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Turnos del día */}
              <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
                {turnosDia.length === 0 && !esDom ? (
                  <button
                    onClick={() => { setFranja((p: any) => ({ ...p, diasSeleccionados: [dow] })); setPanelActivo('franja'); }}
                    className="w-full h-full min-h-[64px] flex flex-col items-center justify-center gap-1 text-gray-700 hover:text-yellow-500 border border-dashed border-white/[0.06] hover:border-yellow-500/30 hover:bg-yellow-500/[0.04] rounded-lg transition-all group">
                    <Plus size={13} className="transition-colors"/>
                    <span className="text-[9px] font-semibold">Agregar</span>
                  </button>
                ) : (
                  turnosDia.map(t => (
                    <div key={t.id}
                      className="relative group/f bg-white/[0.03] hover:bg-yellow-500/[0.07] border border-white/[0.06] hover:border-yellow-500/25 border-l-2 border-l-yellow-400/60 rounded-lg pl-2 pr-1.5 py-1.5 transition-all">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[10px] font-bold text-yellow-300/95 font-mono leading-tight">{t.horaInicio}–{t.horaFin}</p>
                        {!esDom && (
                          <button onClick={() => eliminarDisp(t.id)}
                            className="opacity-0 group-hover/f:opacity-100 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded p-0.5 -mr-0.5 transition-all flex-shrink-0">
                            <X size={10}/>
                          </button>
                        )}
                      </div>
                      <p className="text-[9px] text-gray-400 truncate mt-0.5">{t.consultorio.nombre}</p>
                      <div className="flex items-center justify-between mt-1 gap-1">
                        <span className="text-[8px] text-gray-600">{t.intervaloMinutos}min</span>
                        {t.citasActivas > 0 && (
                          <span className="text-[8px] font-semibold text-emerald-400 bg-emerald-500/10 rounded-full px-1.5 leading-relaxed">
                            {t.citasActivas} cita{t.citasActivas !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5"><HoraBarra inicio={t.horaInicio} fin={t.horaFin}/></div>
                    </div>
                  ))
                )}
              </div>

              {turnosDia.length > 0 && !esDom && (
                <button
                  onClick={() => { setFranja((p: any) => ({ ...p, diasSeleccionados: [dow] })); setPanelActivo('franja'); }}
                  className="w-full py-1 text-[9px] font-semibold text-gray-600 hover:text-yellow-500 hover:bg-yellow-500/5 transition-all border-t border-white/[0.04] flex-shrink-0 flex items-center justify-center gap-1">
                  <Plus size={9}/> turno
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sub-componente: Calendario Día ──────────────────────────────────────────
function CalDia({
  fecha, setFecha, turnosPorFecha, eliminarDisp, setPanelActivo, setFranja,
}: {
  fecha: Date; setFecha: (d: Date) => void;
  turnosPorFecha: Record<string, Turno[]>;
  eliminarDisp: (id: string) => void;
  setPanelActivo: (p: 'franja' | 'bloqueo' | 'eliminar' | null) => void;
  setFranja: (fn: (p: any) => any) => void;
}) {
  const dow       = fecha.getDay();
  const turnosDia = turnosPorFecha[isoDate(fecha)] || [];
  const hoy       = new Date(); hoy.setHours(0,0,0,0);
  const esHoy     = isoDate(fecha) === isoDate(hoy);
  const prevDia   = () => { const d = new Date(fecha); d.setDate(d.getDate() - 1); setFecha(d); };
  const nextDia   = () => { const d = new Date(fecha); d.setDate(d.getDate() + 1); setFecha(d); };

  return (
    <div className="flex flex-col h-full">
      {/* Nav día */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <button onClick={prevDia}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400 transition-all">
          <ChevronLeft size={16}/>
        </button>
        <div className="text-center">
          <p className={`text-2xl font-black ${esHoy ? 'text-yellow-400' : 'text-white'}`}>
            {DIAS_LARGO[dow]}
          </p>
          <p className="text-gray-500 text-xs">{fmtFecha(isoDate(fecha))}</p>
        </div>
        <button onClick={nextDia}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400 transition-all">
          <ChevronRight size={16}/>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {/* Turnos del día */}
        {turnosDia.length > 0 ? (
          <div>
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">
              Turnos abiertos — {fmtFecha(isoDate(fecha))}
            </p>
            <div className="space-y-2">
              {turnosDia.map(t => {
                const nTurnos = calcTurnos(t.horaInicio, t.horaFin, t.intervaloMinutos);
                return (
                  <div key={t.id}
                    className="group/f flex items-center gap-3 bg-yellow-500/[0.06] border border-yellow-500/20 rounded-xl px-4 py-3">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-yellow-400"/>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{t.horaInicio} – {t.horaFin}</p>
                      <p className="text-gray-500 text-xs">{t.intervaloMinutos}min por turno · {nTurnos} cupos</p>
                      <p className="text-gray-600 text-[10px] mt-0.5 flex items-center gap-1"><MapPin size={9}/>{t.sede.nombre} · {t.consultorio.nombre}</p>
                      {t.citasActivas > 0 && (
                        <p className="text-emerald-400/80 text-[10px] mt-0.5">{t.citasActivas} cita{t.citasActivas !== 1 ? 's' : ''} agendada{t.citasActivas !== 1 ? 's' : ''}</p>
                      )}
                      <HoraBarra inicio={t.horaInicio} fin={t.horaFin}/>
                    </div>
                    <button onClick={() => eliminarDisp(t.id)}
                      title={t.citasActivas > 0 ? 'Tiene citas activas, no se puede cancelar' : 'Cancelar turno'}
                      disabled={t.citasActivas > 0}
                      className="opacity-0 group-hover/f:opacity-100 text-gray-600 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed p-2 rounded-lg transition-all">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-600 border border-dashed border-white/[0.06] rounded-xl">
            <Clock size={32} className="opacity-20 mb-2"/>
            <p className="text-sm">Sin turnos para el {DIAS_LARGO[dow]}</p>
            <button
              onClick={() => { setPanelActivo('franja'); setFranja((p: any) => ({ ...p, diasSeleccionados: [dow] })); }}
              className="mt-3 flex items-center gap-1.5 text-xs text-yellow-500 hover:text-yellow-300 transition-colors">
              <Plus size={12}/> Agregar turnos para este día
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sección con encabezado dentro del modal "Nueva Franja" ───────────────────
function FranjaSeccion({ icon, titulo, children }: { icon: React.ReactNode; titulo: string; children: React.ReactNode }) {
  return (
    <section className="h-full bg-white/[0.02] border border-white/[0.06] rounded-xl p-2.5">
      <div className="flex items-center gap-2 text-yellow-500/80 text-[11px] font-bold uppercase tracking-widest mb-1.5">
        {icon} {titulo}
      </div>
      {children}
    </section>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ConfigAgendaPage() {
  // ── Datos ──────────────────────────────────────────────────────────────────
  const [profesionales,    setProfesionales]    = useState<Profesional[]>([]);
  const [profesionalSel,   setProfesionalSel]   = useState<Profesional | null>(null);
  const [sedes,            setSedes]            = useState<Sede[]>([]);
  const [especialidades,   setEspecialidades]   = useState<Especialidad[]>([]);
  const [turnos,           setTurnos]           = useState<Turno[]>([]);

  // Catálogos en cascada dentro del formulario de "Nueva Franja"
  const [franjaDeptos,        setFranjaDeptos]        = useState<Departamento[]>([]);
  const [franjaConsultorios,  setFranjaConsultorios]  = useState<Consultorio[]>([]);
  const [franjaTiposConsulta, setFranjaTiposConsulta] = useState<TipoConsultaItem[]>([]);

  // ── UI ─────────────────────────────────────────────────────────────────────
  const [busqueda,       setBusqueda]       = useState('');
  const [loadingMedicos, setLoadingMedicos] = useState(true);
  const [loadingDatos,   setLoadingDatos]   = useState(false);
  const [guardando,      setGuardando]      = useState(false);
  const [success,        setSuccess]        = useState('');
  const [error,          setError]          = useState('');

  // ── Calendario ─────────────────────────────────────────────────────────────
  const [vista,     setVista]     = useState<Vista>('semana');
  const [calFecha,  setCalFecha]  = useState<Date>(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
  const [diaActivo, setDiaActivo] = useState<Date | null>(null);

  // ── Panel lateral ──────────────────────────────────────────────────────────
  const [panelActivo,  setPanelActivo]  = useState<'franja' | 'bloqueo' | 'eliminar' | null>(null);

  // ── Estado panel Eliminar (cancelar en lote) ───────────────────────────────
  const [elimFiltroDias,    setElimFiltroDias]    = useState<number[]>([]);
  const [elimFiltroMeses,   setElimFiltroMeses]   = useState<number[]>([]);
  const [elimFiltroAño,     setElimFiltroAño]     = useState(() => new Date().getFullYear());
  const [elimFranjas,       setElimFranjas]       = useState<Turno[]>([]);
  const [elimSel,           setElimSel]           = useState<string[]>([]);
  const [elimCargando,      setElimCargando]      = useState(false);
  const [elimEliminando,    setElimEliminando]    = useState(false);
  const [elimCargado,       setElimCargado]       = useState(false);

  const emptyFranja = {
    sedeId: '', departamentoId: '', consultorioId: '', especialidadId: '', tipoConsultaId: '',
    diasSeleccionados: [1, 2, 3, 4, 5] as number[],
    horaInicio: '08:00', horaFin: '16:00',
    duracionSlot: 30,
    plantillasActivas: [] as string[],
    mesesSeleccionados: [] as number[],
    añoVigencia: new Date().getFullYear(),
    sobrecuposMax: 0,
    modalidad: 'PRESENCIAL' as 'PRESENCIAL' | 'TELEMEDICINA' | 'HIBRIDA',
  };
  const [franja,      setFranja]      = useState({ ...emptyFranja });
  const emptyBloqueo = { fechaInicio: todayStr(), fechaFin: todayStr(), motivo: '' };
  const [bloqueoForm, setBloqueoForm] = useState({ ...emptyBloqueo });

  const getUser = () => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } };

  // ── Cargar profesionales + catálogos base ──────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingMedicos(true);
      try {
        const [profs, sedesList, espList] = await Promise.all([
          agenda<Profesional[]>('/profesionales'),
          agenda<Sede[]>('/sedes?soloActivos=true'),
          nucleo<Especialidad[]>('/especialidades'),
        ]);
        setProfesionales(profs);
        setSedes(sedesList);
        setEspecialidades(espList.filter(e => e.estado));
        const u = getUser();
        if (u.rol === 'MEDICO' && profs.length > 0) {
          const propio = profs.find(p => p.id === (u.id || u.userId));
          if (propio) await cargarDatosProfesional(propio);
        }
      } catch { setError('Error cargando profesionales'); }
      finally { setLoadingMedicos(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cascada Sede → Departamento → Consultorio dentro del panel "Nueva Franja"
  useEffect(() => {
    if (!franja.sedeId) { setFranjaDeptos([]); return; }
    agenda<Departamento[]>(`/sedes/${franja.sedeId}/departamentos`)
      .then(d => setFranjaDeptos(d.filter(x => x.activo))).catch(() => setFranjaDeptos([]));
  }, [franja.sedeId]);

  useEffect(() => {
    if (!franja.departamentoId) { setFranjaConsultorios([]); return; }
    agenda<Consultorio[]>(`/departamentos/${franja.departamentoId}/consultorios`)
      .then(c => setFranjaConsultorios(c.filter(x => x.activo))).catch(() => setFranjaConsultorios([]));
  }, [franja.departamentoId]);

  useEffect(() => {
    if (!franja.especialidadId) { setFranjaTiposConsulta([]); return; }
    nucleo<TipoConsultaItem[]>(`/tipos-consulta?especialidadId=${franja.especialidadId}`)
      .then(t => setFranjaTiposConsulta(t.filter(x => x.estado))).catch(() => setFranjaTiposConsulta([]));
  }, [franja.especialidadId]);

  // ── Cargar turnos del profesional (ventana de -1 a +6 meses desde hoy) ─────
  const cargarTurnos = async (prof: Profesional) => {
    setLoadingDatos(true);
    try {
      const hoy = new Date();
      const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 7, 0);
      const data = await agenda<Turno[]>(
        `/turnos?profesionalId=${prof.id}&fechaInicio=${isoDate(desde)}&fechaFin=${isoDate(hasta)}`,
      );
      setTurnos(data);
    } catch { setError('Error cargando la agenda del profesional'); }
    finally { setLoadingDatos(false); }
  };

  const cargarDatosProfesional = async (p: Profesional) => {
    setProfesionalSel(p);
    setTurnos([]);
    setPanelActivo(null);
    await cargarTurnos(p);
  };

  const recargar = useCallback(async () => {
    if (!profesionalSel) return;
    await cargarTurnos(profesionalSel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profesionalSel]);

  // ── Crear turnos en lote ("Nueva Franja") ──────────────────────────────────
  const guardarFranja = async () => {
    if (!profesionalSel) return;
    if (!franja.sedeId || !franja.departamentoId || !franja.consultorioId || !franja.especialidadId) {
      setError('Selecciona sede, departamento, consultorio y especialidad'); return;
    }
    if (!franja.diasSeleccionados.length) { setError('Selecciona al menos un día'); return; }
    if (!franja.mesesSeleccionados.length) { setError('Selecciona al menos un mes de vigencia'); return; }

    const jornadas: { horaInicio: string; horaFin: string }[] =
      franja.plantillasActivas.length > 0
        ? franja.plantillasActivas.map(lbl => {
            const pl = PLANTILLAS.find(p => p.label === lbl)!;
            return { horaInicio: pl.horaInicio, horaFin: pl.horaFin };
          })
        : [{ horaInicio: franja.horaInicio, horaFin: franja.horaFin }];

    for (const j of jornadas) {
      if (calcTurnos(j.horaInicio, j.horaFin, franja.duracionSlot) <= 0) {
        setError(`Horario inválido: ${j.horaInicio}–${j.horaFin}`); return;
      }
    }

    // his-core espera días ISO 1(lunes)–7(domingo); la UI usa 0(domingo)–6(sábado)
    const diasSemanaIso = franja.diasSeleccionados.map(d => (d === 0 ? 7 : d));

    setGuardando(true); setError('');
    try {
      let totalCreados = 0; let totalOmitidos = 0;
      const errores: string[] = [];
      for (const mes of franja.mesesSeleccionados) {
        const mm = String(mes).padStart(2, '0');
        const fechaDesde = `${franja.añoVigencia}-${mm}-01`;
        const fechaHasta = new Date(franja.añoVigencia, mes, 0).toISOString().split('T')[0];
        try {
          const res = await agenda<{ totalGenerados: number; totalOmitidos: number }>('/turnos/masivos', {
            method: 'POST',
            body: JSON.stringify({
              sedeId: franja.sedeId,
              departamentoId: franja.departamentoId,
              consultorioId: franja.consultorioId,
              profesionalId: profesionalSel.id,
              especialidadId: franja.especialidadId,
              tipoConsultaId: franja.tipoConsultaId || undefined,
              fechaDesde, fechaHasta,
              diasSemana: diasSemanaIso,
              jornadas,
              intervaloMinutos: franja.duracionSlot,
              sobrecuposMax: franja.sobrecuposMax,
              modalidad: franja.modalidad,
            }),
          });
          totalCreados += res.totalGenerados || 0;
          totalOmitidos += res.totalOmitidos || 0;
        } catch (e: any) { errores.push(`${MESES_CORTO[mes - 1]}: ${e.message}`); }
      }
      setSuccess(`${totalCreados} turno${totalCreados !== 1 ? 's' : ''} creado${totalCreados !== 1 ? 's' : ''}${totalOmitidos ? ` · ${totalOmitidos} omitidos por conflicto de horario` : ''}`);
      if (errores.length) setError(errores.join(' | '));
      setFranja({ ...emptyFranja });
      setPanelActivo(null);
      await recargar();
      setTimeout(() => setSuccess(''), 5000);
    } catch (e: any) { setError(e.message); }
    finally { setGuardando(false); }
  };

  // ── "Bloqueo": cancela los turnos existentes en el rango de fechas ─────────
  const guardarBloqueo = async () => {
    if (!profesionalSel) return;
    if (!bloqueoForm.fechaInicio || !bloqueoForm.fechaFin) { setError('Completa las fechas del bloqueo'); return; }
    setGuardando(true); setError('');
    try {
      const enRango = turnos.filter(t =>
        t.estado === 'HABILITADO' && t.fecha >= bloqueoForm.fechaInicio && t.fecha <= bloqueoForm.fechaFin,
      );
      if (enRango.length === 0) { setError('No hay turnos habilitados en ese rango'); setGuardando(false); return; }
      let ok = 0; let fail = 0;
      for (const t of enRango) {
        try {
          await agenda(`/turnos/${t.id}/cancelar`, {
            method: 'PUT',
            body: JSON.stringify({ motivo: bloqueoForm.motivo || 'Bloqueo de agenda' }),
          });
          ok++;
        } catch { fail++; }
      }
      setSuccess(`${ok} turno${ok !== 1 ? 's' : ''} cancelado${ok !== 1 ? 's' : ''}${fail ? ` · ${fail} no se pudieron cancelar (tienen citas activas)` : ''}`);
      setBloqueoForm({ ...emptyBloqueo });
      setPanelActivo(null);
      await recargar();
      setTimeout(() => setSuccess(''), 5000);
    } catch (e: any) { setError(e.message); }
    finally { setGuardando(false); }
  };

  const eliminarDisp = async (id: string) => {
    try {
      await agenda(`/turnos/${id}/cancelar`, {
        method: 'PUT',
        body: JSON.stringify({ motivo: 'Cancelado desde el calendario' }),
      });
      await recargar();
    } catch (e: any) { setError(e.message || 'No se pudo cancelar el turno (puede tener citas activas)'); }
  };

  // ── Cancelar turnos en lote ("Eliminar") ───────────────────────────────────
  const cargarEliminar = async () => {
    if (!profesionalSel) return;
    setElimCargando(true); setElimCargado(false);
    try {
      let lista = turnos.filter(t => t.estado === 'HABILITADO');
      if (elimFiltroDias.length > 0) {
        lista = lista.filter(t => elimFiltroDias.includes(new Date(t.fecha + 'T12:00:00').getDay()));
      }
      if (elimFiltroMeses.length > 0) {
        lista = lista.filter(t => {
          const d = new Date(t.fecha + 'T12:00:00');
          return d.getFullYear() === elimFiltroAño && elimFiltroMeses.includes(d.getMonth() + 1);
        });
      }
      setElimFranjas(lista);
      setElimSel(lista.filter(t => t.citasActivas === 0).map(t => t.id));
      setElimCargado(true);
    } catch (e: any) { setError(e.message); }
    finally { setElimCargando(false); }
  };

  const ejecutarEliminar = async () => {
    if (!elimSel.length) return;
    setElimEliminando(true);
    let ok = 0; let fail = 0;
    for (const id of elimSel) {
      try {
        await agenda(`/turnos/${id}/cancelar`, {
          method: 'PUT',
          body: JSON.stringify({ motivo: 'Cancelación en lote' }),
        });
        ok++;
      } catch { fail++; }
    }
    setElimFranjas([]); setElimSel([]); setElimCargado(false);
    await recargar();
    setSuccess(`${ok} turno${ok !== 1 ? 's' : ''} cancelado${ok !== 1 ? 's' : ''}`);
    if (fail) setError(`${fail} no pudieron cancelarse (tienen citas activas)`);
    setPanelActivo(null);
    setElimEliminando(false);
    setTimeout(() => setSuccess(''), 4000);
  };

  // ── Helpers UI ─────────────────────────────────────────────────────────────
  const toggleDia = (dia: number) => {
    setFranja(p => ({
      ...p,
      diasSeleccionados: p.diasSeleccionados.includes(dia)
        ? p.diasSeleccionados.filter(d => d !== dia)
        : [...p.diasSeleccionados, dia].sort(),
    }));
  };

  const onClickDiaCalendario = (d: Date) => {
    setDiaActivo(d);
    if (vista === 'mes' || vista === 'semana') { setVista('dia'); setCalFecha(d); }
    const dow = d.getDay(); // 0=Dom … 6=Sáb
    const mes = d.getMonth() + 1; // 1-12
    const año = d.getFullYear();
    setFranja(prev => ({
      ...prev,
      diasSeleccionados: dow === 0 ? [1] : [dow],
      mesesSeleccionados: [mes],
      añoVigencia: año,
    }));
    setPanelActivo('franja');
  };

  const turnosPreview = useMemo(() => {
    if (franja.plantillasActivas.length > 0) {
      return franja.plantillasActivas.reduce((sum, lbl) => {
        const pl = PLANTILLAS.find(p => p.label === lbl);
        return sum + (pl ? calcTurnos(pl.horaInicio, pl.horaFin, franja.duracionSlot) : 0);
      }, 0);
    }
    return calcTurnos(franja.horaInicio, franja.horaFin, franja.duracionSlot);
  }, [franja.horaInicio, franja.horaFin, franja.duracionSlot, franja.plantillasActivas]);

  // Filtro dinámico: nombre + especialidad + registro médico
  const medicosFiltrados = useMemo(() =>
    profesionales.filter(m => {
      const q = busqueda.toLowerCase().trim();
      if (!q) return true;
      return (
        m.nombreCompleto.toLowerCase().includes(q) ||
        (m.especialidadPrincipal || '').toLowerCase().includes(q) ||
        (m.registroMedico || '').toLowerCase().includes(q)
      );
    }),
  [profesionales, busqueda]);

  const turnosPorFecha = useMemo(() => {
    const mapa: Record<string, Turno[]> = {};
    for (const t of turnos) {
      if (t.estado !== 'HABILITADO') continue;
      if (!mapa[t.fecha]) mapa[t.fecha] = [];
      mapa[t.fecha].push(t);
    }
    return mapa;
  }, [turnos]);

  const nombreCorto = (nombreCompleto: string) => {
    const partes = nombreCompleto.trim().split(' ');
    return `${partes[0]?.[0] || ''}${partes[1]?.[0] || ''}`.toUpperCase();
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-[#080a0f] overflow-hidden">

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-3 border-b border-white/[0.06] bg-white/[0.015]">
        <div className="flex items-center gap-3">
          <Settings size={18} className="text-yellow-400"/>
          <h1 className="text-lg font-black text-white tracking-tight">
            Config <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Agenda</span>
          </h1>
          {profesionalSel && (
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-500 border border-white/10 rounded-full px-2 py-0.5">
              <User size={9}/> {profesionalSel.nombreCompleto}
            </span>
          )}
        </div>

        {/* Tabs vista */}
        {profesionalSel && (
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
            {([['mes', LayoutGrid, 'Mes'], ['semana', CalendarRange, 'Semana'], ['dia', CalendarDays, 'Día']] as const).map(([v, Icon, lbl]) => (
              <button key={v} onClick={() => setVista(v)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all
                  ${vista === v ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'text-gray-500 hover:text-gray-300'}`}>
                <Icon size={11}/> {lbl}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 text-xs font-medium">
                <Check size={12}/> {success}
              </motion.div>
            )}
          </AnimatePresence>
          {profesionalSel && (
            <>
              <button onClick={() => setPanelActivo(panelActivo === 'bloqueo' ? null : 'bloqueo')}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all
                  ${panelActivo === 'bloqueo' ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-white/[0.04] border-white/10 text-gray-400 hover:text-orange-400 hover:border-orange-500/30'}`}>
                <CalendarX2 size={13}/> Bloqueo
              </button>
              <button onClick={() => { setElimFranjas([]); setElimSel([]); setElimCargado(false); setElimFiltroDias([]); setElimFiltroMeses([]); setPanelActivo(panelActivo === 'eliminar' ? null : 'eliminar'); }}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all
                  ${panelActivo === 'eliminar' ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-white/[0.04] border-white/10 text-gray-400 hover:text-rose-400 hover:border-rose-500/30'}`}>
                <Trash2 size={13}/> Eliminar
              </button>
              <button onClick={() => { setFranja({ ...emptyFranja }); setPanelActivo(panelActivo === 'franja' ? null : 'franja'); }}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all
                  ${panelActivo === 'franja' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30'}`}>
                <Plus size={13}/> Nueva Franja
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs">
            <AlertCircle size={13}/> {error}
            <button onClick={() => setError('')} className="ml-auto"><X size={13}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LAYOUT ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ━━ Columna izquierda: profesionales (oculta en móvil) ━━ */}
        <div className="hidden md:flex w-64 flex-shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0c13]">
          {/* Buscador dinámico: nombre + especialidad + registro médico */}
          <div className="px-3 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2">
              <Search size={12} className="text-gray-500 flex-shrink-0"/>
              <input
                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Nombre, especialidad o registro…"
                className="bg-transparent text-white text-xs placeholder-gray-600 flex-1 focus:outline-none"
              />
              {busqueda && (
                <button onClick={() => setBusqueda('')} className="text-gray-600 hover:text-gray-400"><X size={11}/></button>
              )}
            </div>
            <p className="text-[9px] text-gray-700 mt-1 pl-1">
              {medicosFiltrados.length} de {profesionales.length} profesional{profesionales.length !== 1 ? 'es' : ''}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingMedicos ? (
              <div className="p-5 text-center text-gray-600 text-xs">Cargando...</div>
            ) : medicosFiltrados.length === 0 ? (
              <div className="p-5 text-center text-gray-600 text-xs">
                {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay profesionales'}
              </div>
            ) : (
              medicosFiltrados.map(m => {
                const activo = profesionalSel?.id === m.id;
                return (
                  <button key={m.id} onClick={() => cargarDatosProfesional(m)}
                    className={`w-full text-left px-3 py-3 flex items-center gap-2.5 transition-all group border-l-2
                      ${activo ? 'bg-yellow-500/10 border-yellow-400' : 'border-transparent hover:bg-white/[0.03] hover:border-white/10'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0
                      ${activo ? 'bg-yellow-500 text-slate-900' : 'bg-white/[0.06] text-gray-400 group-hover:bg-white/10'}`}>
                      {nombreCorto(m.nombreCompleto)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold truncate ${activo ? 'text-white' : 'text-gray-300'}`}>
                        {m.nombreCompleto}
                      </p>
                      <p className="text-[10px] text-gray-600 truncate">{m.especialidadPrincipal || 'Sin especialidad'}</p>
                      {m.registroMedico && (
                        <p className="text-[9px] text-gray-700 truncate font-mono">RM {m.registroMedico}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ━━ Columna central: calendario ━━ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!profesionalSel ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-600">
              <Settings size={48} className="opacity-10"/>
              <p className="text-sm font-medium">Selecciona un profesional</p>
              <p className="text-xs">para visualizar y configurar su agenda</p>
            </div>
          ) : loadingDatos ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-gray-600 text-sm">
              <RefreshCw size={16} className="animate-spin"/> Cargando agenda...
            </div>
          ) : (
            <>
              {/* Sub-header profesional */}
              <div className="flex-shrink-0 px-5 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">{profesionalSel.nombreCompleto}</p>
                  <p className="text-gray-600 text-[10px]">
                    {profesionalSel.especialidadPrincipal || 'Sin especialidad'}
                    {profesionalSel.registroMedico && <> · RM {profesionalSel.registroMedico}</>}
                    {' · '}{turnos.filter(t => t.estado === 'HABILITADO').length} turnos abiertos
                  </p>
                </div>
                <button onClick={recargar} title="Actualizar"
                  className="p-1.5 text-gray-600 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all">
                  <RefreshCw size={14}/>
                </button>
              </div>

              {/* Zona calendario */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {vista === 'mes' && (
                  <CalMes
                    fecha={calFecha} setFecha={setCalFecha} setVista={setVista}
                    turnosPorFecha={turnosPorFecha}
                    onClickDia={onClickDiaCalendario} diaActivo={diaActivo}
                    onClickMes={(mes, año) => {
                      setFranja({ ...emptyFranja, mesesSeleccionados: [mes], añoVigencia: año });
                      setPanelActivo('franja');
                    }}
                  />
                )}
                {vista === 'semana' && (
                  <CalSemana
                    fecha={calFecha} setFecha={setCalFecha}
                    turnosPorFecha={turnosPorFecha}
                    onClickDia={onClickDiaCalendario} diaActivo={diaActivo}
                    eliminarDisp={eliminarDisp}
                    setPanelActivo={setPanelActivo}
                    setFranja={setFranja}
                  />
                )}
                {vista === 'dia' && (
                  <CalDia
                    fecha={calFecha} setFecha={d => { setCalFecha(d); setDiaActivo(d); }}
                    turnosPorFecha={turnosPorFecha}
                    eliminarDisp={eliminarDisp}
                    setPanelActivo={setPanelActivo}
                    setFranja={setFranja}
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* ━━ Modal: Nueva Franja ━━ */}
        <AnimatePresence>
          {panelActivo === 'franja' && profesionalSel && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPanelActivo(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-3xl lg:max-w-6xl max-h-[96vh] flex flex-col bg-gradient-to-b from-[#13110a] to-[#0b0a06] border border-yellow-500/25 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-2.5 border-b border-yellow-500/15 bg-yellow-500/[0.04] flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 flex-shrink-0">
                      <CalendarCheck2 size={18}/>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-bold text-base">Nueva Franja de Agenda</p>
                      <p className="text-gray-500 text-xs truncate">{profesionalSel.nombreCompleto} · {profesionalSel.especialidadPrincipal}</p>
                    </div>
                  </div>
                  <button onClick={() => setPanelActivo(null)} className="text-gray-500 hover:text-white hover:bg-white/5 p-2 rounded-xl transition-all flex-shrink-0"><X size={18}/></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-2.5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                  {/* Ubicación */}
                  <div className="lg:col-span-3">
                  <FranjaSeccion icon={<MapPin size={12}/>} titulo="Ubicación">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Sede</label>
                        <select value={franja.sedeId}
                          onChange={e => setFranja(p => ({ ...p, sedeId: e.target.value, departamentoId: '', consultorioId: '' }))}
                          className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50 transition-all">
                          <option value="">Selecciona una sede</option>
                          {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Departamento</label>
                        <select value={franja.departamentoId}
                          onChange={e => setFranja(p => ({ ...p, departamentoId: e.target.value, consultorioId: '' }))}
                          disabled={!franja.sedeId}
                          className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50 transition-all disabled:opacity-40">
                          <option value="">{franja.sedeId ? 'Selecciona' : 'Primero sede'}</option>
                          {franjaDeptos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Consultorio</label>
                        <select value={franja.consultorioId}
                          onChange={e => setFranja(p => ({ ...p, consultorioId: e.target.value }))}
                          disabled={!franja.departamentoId}
                          className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50 transition-all disabled:opacity-40">
                          <option value="">{franja.departamentoId ? 'Selecciona' : 'Primero depto.'}</option>
                          {franjaConsultorios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                      </div>
                    </div>
                  </FranjaSeccion>
                  </div>

                  {/* Especialidad / Tipo de consulta */}
                  <FranjaSeccion icon={<Stethoscope size={12}/>} titulo="Tipo de atención">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Especialidad</label>
                        <select value={franja.especialidadId}
                          onChange={e => setFranja(p => ({ ...p, especialidadId: e.target.value, tipoConsultaId: '' }))}
                          className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50 transition-all">
                          <option value="">Selecciona</option>
                          {especialidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Tipo consulta</label>
                        <select value={franja.tipoConsultaId}
                          onChange={e => setFranja(p => ({ ...p, tipoConsultaId: e.target.value }))}
                          disabled={!franja.especialidadId}
                          className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50 transition-all disabled:opacity-40">
                          <option value="">{franja.especialidadId ? 'Opcional' : 'Primero especialidad'}</option>
                          {franjaTiposConsulta.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                        </select>
                      </div>
                    </div>
                  </FranjaSeccion>

                  {/* Vigencia */}
                  <FranjaSeccion icon={<CalendarRange size={12}/>} titulo="Vigencia">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-gray-600">Meses en los que se generarán turnos</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={franja.añoVigencia <= new Date().getFullYear()}
                          onClick={() => setFranja(p => ({ ...p, añoVigencia: Math.max(new Date().getFullYear(), p.añoVigencia - 1), mesesSeleccionados: [] }))}
                          className="w-6 h-6 flex items-center justify-center rounded bg-white/[0.04] hover:bg-yellow-500/20 text-gray-500 hover:text-yellow-400 disabled:opacity-25 disabled:cursor-not-allowed transition-all">
                          <ChevronLeft size={12}/>
                        </button>
                        <span className="text-xs font-bold text-gray-300 w-14 text-center">
                          {franja.añoVigencia === new Date().getFullYear() ? 'actual' : franja.añoVigencia}
                        </span>
                        <button
                          onClick={() => setFranja(p => ({ ...p, añoVigencia: p.añoVigencia + 1, mesesSeleccionados: [] }))}
                          className="w-6 h-6 flex items-center justify-center rounded bg-white/[0.04] hover:bg-yellow-500/20 text-gray-500 hover:text-yellow-400 transition-all">
                          <ChevronRight size={12}/>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 mb-1.5">
                      {MESES_CORTO.map((m, i) => {
                        const mesNum = i + 1;
                        const hoyA   = new Date().getFullYear();
                        const hoyM   = new Date().getMonth() + 1;
                        const isPast = franja.añoVigencia === hoyA && mesNum < hoyM;
                        const isCurr = franja.añoVigencia === hoyA && mesNum === hoyM;
                        const isSel  = franja.mesesSeleccionados.includes(mesNum);
                        return (
                          <button key={i}
                            disabled={isPast}
                            onClick={() => setFranja(p => ({
                              ...p,
                              mesesSeleccionados: isSel
                                ? p.mesesSeleccionados.filter(x => x !== mesNum)
                                : [...p.mesesSeleccionados, mesNum].sort((a,b) => a - b),
                            }))}
                            className={`py-1.5 rounded-lg text-xs font-bold transition-all
                              ${isPast  ? 'opacity-20 cursor-not-allowed bg-transparent text-gray-700'
                              : isSel   ? 'bg-yellow-500 text-slate-900 shadow-sm shadow-yellow-500/25'
                              : isCurr  ? 'bg-white/[0.04] text-yellow-300/80 border border-yellow-500/25 hover:bg-yellow-500/15'
                              : 'bg-white/[0.03] text-gray-600 hover:bg-yellow-500/10 hover:text-yellow-400 border border-white/[0.05]'}`}>
                            {m}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3 mb-0.5">
                      <button onClick={() => {
                        const hA = new Date().getFullYear(); const hM = new Date().getMonth() + 1;
                        setFranja(p => ({ ...p, mesesSeleccionados: Array.from({length:12},(_,i)=>i+1).filter(m => !(p.añoVigencia===hA && m<hM)) }));
                      }} className="text-[10px] text-yellow-500/70 hover:text-yellow-300 transition-colors">todos</button>
                      <button onClick={() => {
                        const hA = new Date().getFullYear(); const hM = new Date().getMonth() + 1;
                        setFranja(p => ({ ...p, mesesSeleccionados: [1,2,3,4,5,6].filter(m => !(p.añoVigencia===hA && m<hM)) }));
                      }} className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">1er sem</button>
                      <button onClick={() => {
                        const hA = new Date().getFullYear(); const hM = new Date().getMonth() + 1;
                        setFranja(p => ({ ...p, mesesSeleccionados: [7,8,9,10,11,12].filter(m => !(p.añoVigencia===hA && m<hM)) }));
                      }} className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">2do sem</button>
                      {franja.mesesSeleccionados.length > 0 && (
                        <button onClick={() => setFranja(p => ({ ...p, mesesSeleccionados: [] }))}
                          className="text-[10px] text-gray-700 hover:text-gray-400 transition-colors ml-auto">limpiar</button>
                      )}
                    </div>
                    {franja.mesesSeleccionados.length === 0
                      ? <p className="text-[10px] text-amber-500/70 mt-1">Selecciona al menos un mes (his-core requiere un rango de fechas concreto)</p>
                      : <p className="text-[10px] text-yellow-500/60 mt-1">{franja.mesesSeleccionados.map(m => MESES_CORTO[m-1]).join(' · ')} {franja.añoVigencia}</p>
                    }
                  </FranjaSeccion>

                  {/* Días de la semana */}
                  <FranjaSeccion icon={<CalendarDays size={12}/>} titulo="Días de la semana">
                    <div className="flex items-center justify-end gap-2 mb-1.5 -mt-1">
                      <button onClick={() => setFranja(p => ({ ...p, diasSeleccionados: [1,2,3,4,5] }))}
                        className="text-[10px] text-yellow-500 hover:text-yellow-300 transition-colors">L–V</button>
                      <button onClick={() => setFranja(p => ({ ...p, diasSeleccionados: DIAS_LABORALES }))}
                        className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors">L–S</button>
                      <button onClick={() => setFranja(p => ({ ...p, diasSeleccionados: [] }))}
                        className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">ninguno</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {[0,1,2,3,4,5,6].map(dia => {
                        const sel = franja.diasSeleccionados.includes(dia);
                        return (
                          <button key={dia} onClick={() => toggleDia(dia)}
                            className={`flex flex-col items-center py-1.5 rounded-lg text-[10px] font-bold transition-all
                              ${sel ? 'bg-yellow-500 text-slate-900 shadow-md shadow-yellow-500/20' :
                                'bg-white/[0.04] text-gray-500 hover:bg-white/[0.08] hover:text-gray-300'}`}>
                            {DIAS_CORTO[dia]}
                          </button>
                        );
                      })}
                    </div>
                    {franja.diasSeleccionados.length > 0 && (
                      <p className="text-[10px] text-yellow-500/70 mt-1.5">
                        {franja.diasSeleccionados.map(d => DIAS_CORTO[d]).join(' · ')}
                      </p>
                    )}
                  </FranjaSeccion>

                  {/* Horario y duración */}
                  <div className="lg:col-span-2">
                  <FranjaSeccion icon={<Clock size={12}/>} titulo="Horario y duración">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Plantillas — multi-selección */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Plantillas rápidas</label>
                          {franja.plantillasActivas.length > 0 && (
                            <button onClick={() => setFranja(p => ({ ...p, plantillasActivas: [] }))}
                              className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">limpiar</button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {PLANTILLAS.map(pl => {
                            const Icon = pl.icon;
                            const activa = franja.plantillasActivas.includes(pl.label);
                            return (
                              <button key={pl.label}
                                onClick={() => setFranja(p => ({
                                  ...p,
                                  plantillasActivas: activa
                                    ? p.plantillasActivas.filter(x => x !== pl.label)
                                    : [...p.plantillasActivas, pl.label],
                                }))}
                                className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all
                                  ${activa ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300 ring-1 ring-yellow-500/20' : 'bg-white/[0.03] border-white/[0.07] text-gray-500 hover:border-white/15 hover:text-gray-300'}`}>
                                <Icon size={11}/> {pl.label}
                                <span className="ml-auto text-[9px] opacity-50">{pl.horaInicio}–{pl.horaFin}</span>
                                {activa && <Check size={9} className="text-yellow-400 flex-shrink-0"/>}
                              </button>
                            );
                          })}
                        </div>
                        {franja.plantillasActivas.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {franja.plantillasActivas.map(lbl => {
                              const pl = PLANTILLAS.find(p => p.label === lbl)!;
                              const t = calcTurnos(pl.horaInicio, pl.horaFin, franja.duracionSlot);
                              return (
                                <span key={lbl} className="text-[9px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400/80 rounded-full px-2 py-0.5">
                                  {lbl}: {t} turnos
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {/* Horario manual — solo si no hay plantillas activas */}
                        {franja.plantillasActivas.length === 0 ? (
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Horario manual</label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-gray-600 block mb-1">Inicio</label>
                                <input type="time" value={franja.horaInicio} onChange={e => setFranja(p => ({ ...p, horaInicio: e.target.value }))}
                                  className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50 transition-all"/>
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-600 block mb-1">Fin</label>
                                <input type="time" value={franja.horaFin} onChange={e => setFranja(p => ({ ...p, horaFin: e.target.value }))}
                                  className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50 transition-all"/>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-600 bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2.5">
                            El horario lo define la plantilla seleccionada. Deselecciónala para editar un horario manual.
                          </div>
                        )}

                        {/* Intervalo */}
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Duración del turno</label>
                          <div className="flex flex-wrap gap-1.5">
                            {INTERVALOS.map(v => (
                              <button key={v} onClick={() => setFranja(p => ({ ...p, duracionSlot: v }))}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all
                                  ${franja.duracionSlot === v ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300' : 'bg-white/[0.03] border-white/[0.07] text-gray-500 hover:text-gray-300 hover:border-white/15'}`}>
                                {v}min
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </FranjaSeccion>
                  </div>

                  {/* Configuración adicional */}
                  <FranjaSeccion icon={<Settings size={12}/>} titulo="Configuración adicional">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Modalidad</label>
                        <select value={franja.modalidad}
                          onChange={e => setFranja(p => ({ ...p, modalidad: e.target.value as any }))}
                          className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50 transition-all">
                          {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1.5 uppercase tracking-widest font-bold">Sobrecupos máx.</label>
                        <input type="number" min={0} value={franja.sobrecuposMax}
                          onChange={e => setFranja(p => ({ ...p, sobrecuposMax: Number(e.target.value) || 0 }))}
                          className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50 transition-all"/>
                      </div>
                    </div>
                  </FranjaSeccion>

                  {/* Preview turnos */}
                  <div className="lg:col-span-3">
                  <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 border text-sm
                    ${turnosPreview > 0 ? 'bg-emerald-500/[0.07] border-emerald-500/20 text-emerald-300' : 'bg-red-500/[0.07] border-red-500/20 text-red-400'}`}>
                    <Clock size={16} className="flex-shrink-0"/>
                    {turnosPreview > 0 ? (
                      franja.plantillasActivas.length > 1 ? (
                        <><strong className="text-white">{turnosPreview} cupos/día</strong> · {franja.plantillasActivas.length} jornadas · {franja.duracionSlot}min c/u</>
                      ) : (
                        <><strong className="text-white">{turnosPreview} cupos/día</strong> · {franja.plantillasActivas.length === 1 ? (() => { const pl = PLANTILLAS.find(p => p.label === franja.plantillasActivas[0])!; return `${pl.horaInicio}–${pl.horaFin}`; })() : `${franja.horaInicio}–${franja.horaFin}`} · {franja.duracionSlot}min c/u</>
                      )
                    ) : 'Revisa el horario'}
                  </div>
                  </div>
                </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-2.5 border-t border-yellow-500/15 bg-black/20 flex-shrink-0">
                  <button onClick={() => setPanelActivo(null)}
                    className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 text-sm font-semibold transition-all">
                    Cancelar
                  </button>
                  <button onClick={guardarFranja}
                    disabled={guardando || turnosPreview <= 0 || franja.diasSeleccionados.length === 0 || franja.mesesSeleccionados.length === 0}
                    className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black text-sm px-6 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20">
                    {guardando ? (
                      <><RefreshCw size={14} className="animate-spin"/> Creando turnos...</>
                    ) : (
                      <><Check size={14}/> Crear turnos</>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ━━ Panel lateral deslizante (Bloqueo / Eliminar) ━━ */}
        <AnimatePresence>
          {panelActivo && panelActivo !== 'franja' && profesionalSel && (
            <motion.div
              key={panelActivo}
              initial={{ x: 340, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 340, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 35 }}
              className={`w-full md:w-80 flex-shrink-0 flex flex-col border-l overflow-hidden
                ${panelActivo === 'bloqueo' ? 'border-orange-500/20 bg-[#0d0a08]' : 'border-rose-500/20 bg-[#0d0809]'}`}
            >
              {/* ── Panel Bloqueo ── */}
              {panelActivo === 'bloqueo' && (
                <>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-orange-500/15">
                    <div>
                      <p className="text-orange-400 font-bold text-sm flex items-center gap-1.5"><CalendarX2 size={14}/> Nuevo Bloqueo</p>
                      <p className="text-gray-600 text-[10px]">{profesionalSel.nombreCompleto}</p>
                    </div>
                    <button onClick={() => setPanelActivo(null)} className="text-gray-600 hover:text-white p-1"><X size={16}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    <div className="bg-orange-500/[0.05] border border-orange-500/15 rounded-xl px-3 py-2.5 text-[10px] text-orange-300/70">
                      Cancela los turnos ya abiertos en el período indicado (vacaciones, congresos, cirugías programadas, etc.). Los turnos con citas activas no se cancelan.
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Motivo</label>
                      <input value={bloqueoForm.motivo} onChange={e => setBloqueoForm(p => ({ ...p, motivo: e.target.value }))}
                        placeholder="Ej: Vacaciones, Congreso médico..."
                        className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-all"/>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-gray-600 block mb-1.5 uppercase tracking-widest font-bold">Desde</label>
                        <input type="date" value={bloqueoForm.fechaInicio} min={todayStr()}
                          onChange={e => setBloqueoForm(p => ({ ...p, fechaInicio: e.target.value }))}
                          className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-orange-500/50 transition-all"/>
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-600 block mb-1.5 uppercase tracking-widest font-bold">Hasta</label>
                        <input type="date" value={bloqueoForm.fechaFin} min={bloqueoForm.fechaInicio || todayStr()}
                          onChange={e => setBloqueoForm(p => ({ ...p, fechaFin: e.target.value }))}
                          className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-orange-500/50 transition-all"/>
                      </div>
                    </div>
                    {bloqueoForm.fechaInicio && bloqueoForm.fechaFin && (
                      <p className="text-[10px] text-orange-400/70">{fmtFecha(bloqueoForm.fechaInicio)} → {fmtFecha(bloqueoForm.fechaFin)}</p>
                    )}
                    <p className="text-[10px] text-gray-600">
                      {turnos.filter(t => t.estado === 'HABILITADO' && t.fecha >= bloqueoForm.fechaInicio && t.fecha <= bloqueoForm.fechaFin).length} turno(s) habilitado(s) serán cancelados en ese rango.
                    </p>
                  </div>

                  <div className="flex-shrink-0 px-4 py-3 border-t border-orange-500/15">
                    <button onClick={guardarBloqueo} disabled={guardando || !bloqueoForm.fechaInicio || !bloqueoForm.fechaFin}
                      className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black text-sm py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      {guardando ? <><RefreshCw size={14} className="animate-spin"/> Cancelando...</> : <><CalendarX2 size={14}/> Bloquear (cancelar turnos)</>}
                    </button>
                  </div>
                </>
              )}

              {/* ── Panel Eliminar / Cancelar en lote ── */}
              {panelActivo === 'eliminar' && (
                <>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-rose-500/15">
                    <div>
                      <p className="text-rose-400 font-bold text-sm flex items-center gap-1.5"><Trash2 size={14}/> Cancelar Turnos</p>
                      <p className="text-gray-600 text-[10px]">{profesionalSel.nombreCompleto}</p>
                    </div>
                    <button onClick={() => setPanelActivo(null)} className="text-gray-600 hover:text-white p-1"><X size={16}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    <div className="bg-rose-500/[0.05] border border-rose-500/15 rounded-xl px-3 py-2.5 text-[10px] text-rose-300/70">
                      Solo se cancelan turnos <strong>sin citas asignadas</strong>. Los que tienen citas activas quedan protegidos.
                    </div>

                    {/* Filtro días */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Filtrar por día</label>
                      <div className="flex flex-wrap gap-1">
                        {DIAS_LARGO.map((d, i) => {
                          const sel = elimFiltroDias.includes(i);
                          return (
                            <button key={i}
                              onClick={() => setElimFiltroDias(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])}
                              className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all
                                ${sel  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' :
                                  'bg-white/[0.04] border border-white/[0.08] text-gray-500 hover:text-rose-300 hover:border-rose-500/30'}`}>
                              {DIAS_CORTO[i]}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-1.5 mt-1.5">
                        <button onClick={() => setElimFiltroDias([1,2,3,4,5])} className="text-[9px] text-gray-600 hover:text-rose-400 transition-colors">L–V</button>
                        <span className="text-gray-700 text-[9px]">·</span>
                        <button onClick={() => setElimFiltroDias([1,2,3,4,5,6])} className="text-[9px] text-gray-600 hover:text-rose-400 transition-colors">L–S</button>
                        <span className="text-gray-700 text-[9px]">·</span>
                        <button onClick={() => setElimFiltroDias([])} className="text-[9px] text-gray-600 hover:text-rose-400 transition-colors">todos</button>
                      </div>
                    </div>

                    {/* Filtro meses */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Filtrar por mes</label>
                        <div className="flex items-center gap-1">
                          <button disabled={elimFiltroAño <= new Date().getFullYear()}
                            onClick={() => setElimFiltroAño(a => a - 1)}
                            className="w-5 h-5 flex items-center justify-center rounded text-gray-600 hover:text-rose-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft size={11}/>
                          </button>
                          <span className="text-[10px] text-gray-400 font-bold w-10 text-center">
                            {elimFiltroAño === new Date().getFullYear() ? 'actual' : elimFiltroAño}
                          </span>
                          <button onClick={() => setElimFiltroAño(a => a + 1)}
                            className="w-5 h-5 flex items-center justify-center rounded text-gray-600 hover:text-rose-400 transition-colors">
                            <ChevronRight size={11}/>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {MESES_CORTO.map((m, i) => {
                          const mesNum  = i + 1;
                          const isSel   = elimFiltroMeses.includes(mesNum);
                          return (
                            <button key={i}
                              onClick={() => setElimFiltroMeses(p => p.includes(mesNum) ? p.filter(x => x !== mesNum) : [...p, mesNum])}
                              className={`py-1.5 rounded-lg text-[10px] font-bold transition-all
                                ${isSel  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' :
                                  'bg-white/[0.04] text-gray-500 hover:bg-rose-500/10 hover:text-rose-300 border border-white/[0.06]'}`}>
                              {m}
                            </button>
                          );
                        })}
                      </div>
                      {elimFiltroMeses.length > 0 && (
                        <button onClick={() => setElimFiltroMeses([])} className="text-[9px] text-gray-600 hover:text-rose-400 mt-1 transition-colors">limpiar meses</button>
                      )}
                    </div>

                    {/* Botón cargar */}
                    <button onClick={cargarEliminar} disabled={elimCargando}
                      className="w-full flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/30 text-gray-300 hover:text-rose-300 text-xs font-semibold py-2 rounded-lg transition-all disabled:opacity-50">
                      {elimCargando ? <><RefreshCw size={12} className="animate-spin"/> Cargando...</> : <><Search size={12}/> Buscar turnos</>}
                    </button>

                    {/* Lista de turnos */}
                    {elimCargado && (
                      <div>
                        {elimFranjas.length === 0 ? (
                          <p className="text-center text-gray-600 text-xs py-4">No hay turnos con esos filtros</p>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{elimFranjas.length} turno{elimFranjas.length !== 1 ? 's' : ''}</span>
                              <div className="flex gap-2">
                                <button onClick={() => setElimSel(elimFranjas.filter(f => f.citasActivas === 0).map(f => f.id))}
                                  className="text-[9px] text-gray-600 hover:text-rose-400 transition-colors">todos libres</button>
                                <button onClick={() => setElimSel([])}
                                  className="text-[9px] text-gray-600 hover:text-rose-400 transition-colors">ninguno</button>
                              </div>
                            </div>
                            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                              {elimFranjas.map(t => {
                                const tieneCitas = t.citasActivas > 0;
                                const checked    = elimSel.includes(t.id);
                                return (
                                  <button key={t.id} disabled={tieneCitas}
                                    onClick={() => setElimSel(p => p.includes(t.id) ? p.filter(x => x !== t.id) : [...p, t.id])}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all
                                      ${tieneCitas ? 'opacity-50 cursor-not-allowed border-white/[0.04] bg-white/[0.02]' :
                                        checked    ? 'border-rose-500/30 bg-rose-500/10' :
                                        'border-white/[0.06] bg-white/[0.03] hover:border-rose-500/20'}`}>
                                    <div className={`w-3.5 h-3.5 rounded flex-shrink-0 border transition-all
                                      ${tieneCitas ? 'border-gray-700 bg-transparent' :
                                        checked    ? 'border-rose-500 bg-rose-500' : 'border-gray-600 bg-transparent'}`}>
                                      {checked && !tieneCitas && <Check size={10} className="text-white m-auto mt-px"/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-semibold text-gray-300 truncate">{fmtFecha(t.fecha)}</p>
                                      <p className="text-[10px] text-gray-600">{t.horaInicio} – {t.horaFin} · {t.consultorio.nombre}</p>
                                    </div>
                                    {tieneCitas ? (
                                      <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full flex-shrink-0">{t.citasActivas} cita{t.citasActivas !== 1 ? 's' : ''}</span>
                                    ) : (
                                      <span className="text-[9px] text-gray-700 flex-shrink-0">libre</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 px-4 py-3 border-t border-rose-500/15">
                    <button onClick={ejecutarEliminar}
                      disabled={elimEliminando || !elimSel.length}
                      className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      {elimEliminando
                        ? <><RefreshCw size={14} className="animate-spin"/> Cancelando...</>
                        : <><Trash2 size={14}/> Cancelar {elimSel.length > 0 ? `(${elimSel.length})` : ''}</>}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
