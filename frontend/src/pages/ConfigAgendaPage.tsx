/**
 * CU-01: Configuración de Agenda del Profesional — v3
 * + Calendario integrado Mes / Semana / Día (estilo AgendaPage)
 * + Filtro profesional dinámico: nombre, especialidad, cédula/documento
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Plus, Trash2, Clock,
  AlertCircle, Check, X, User, ChevronDown, Search,
  Zap, Sun, Sunset, CalendarX2, CalendarCheck2,
  ToggleLeft, ToggleRight, RefreshCw,
  ChevronLeft, ChevronRight, LayoutGrid, CalendarDays, CalendarRange,
} from 'lucide-react';

// ─── Constantes ───────────────────────────────────────────────────────────────
const DIAS_CORTO  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_LARGO  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES       = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const INTERVALOS  = [10, 15, 20, 30, 45, 60, 90, 120];
const DIAS_LABORALES = [1, 2, 3, 4, 5, 6];

const PLANTILLAS = [
  { label: 'Mañana',  icon: Sun,    horaInicio: '07:00', horaFin: '12:00', slot: 30 },
  { label: 'Tarde',   icon: Sunset, horaInicio: '13:00', horaFin: '18:00', slot: 30 },
  { label: 'Jornada', icon: Zap,    horaInicio: '07:00', horaFin: '17:00', slot: 30 },
  { label: 'Completa',icon: Check,  horaInicio: '07:00', horaFin: '18:00', slot: 30 },
];

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface Medico {
  id: string; nombre: string; apellido: string;
  especialidad: string | null; registroMedico: string | null;
  email: string | null; numeroDocumento: string | null;
}
interface TipoConsulta {
  id: string; nombre: string; duracionMinutos: number; clasificacion: string;
}
interface Disponibilidad {
  id: string; diaSemana: number; horaInicio: string; horaFin: string;
  duracionSlot: number; sede: string; tipoAtencion: string;
  consultorio: string; activo: boolean;
  fechaDesde?: string | null; fechaHasta?: string | null;
}
interface Bloqueo {
  id: string; fechaInicio: string; fechaFin: string; motivo: string; todoElDia: boolean;
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
const estaEnBloqueo = (fecha: Date, bloqueos: Bloqueo[]) => {
  const iso = isoDate(fecha);
  return bloqueos.some(b => b.fechaInicio.slice(0, 10) <= iso && iso <= b.fechaFin.slice(0, 10));
};
const getBloqueosDia = (fecha: Date, bloqueos: Bloqueo[]) => {
  const iso = isoDate(fecha);
  return bloqueos.filter(b => b.fechaInicio.slice(0, 10) <= iso && iso <= b.fechaFin.slice(0, 10));
};
const startOfWeek = (d: Date) => {
  const c = new Date(d);
  const dow = c.getDay(); // 0=Dom
  const diff = dow === 0 ? -6 : 1 - dow; // lunes
  c.setDate(c.getDate() + diff);
  c.setHours(0, 0, 0, 0);
  return c;
};

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
  fecha, setFecha, setVista, dispPorDia, bloqueos, onClickDia, diaActivo, onClickMes,
}: {
  fecha: Date; setFecha: (d: Date) => void; setVista: (v: Vista) => void;
  dispPorDia: Record<number, Disponibilidad[]>; bloqueos: Bloqueo[];
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
    subVista === 'cal'  ? `${MESES[month]} ${year}` :
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
              const franjas     = dispPorDia[dow] || [];
              const bloqueado   = estaEnBloqueo(fecha_, bloqueos);
              const esHoy       = isoDate(fecha_) === isoDate(hoy);
              const esActivo    = diaActivo ? isoDate(fecha_) === isoDate(diaActivo) : false;
              const tieneFranja = franjas.length > 0;
              const esDom       = dow === 0;
              return (
                <button key={i}
                  onClick={() => !esDom && onClickDia(fecha_)}
                  disabled={esDom}
                  className={`
                    relative h-10 flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all
                    ${esDom ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}
                    ${esActivo ? 'bg-yellow-500 text-slate-900 shadow-md shadow-yellow-500/25' :
                      bloqueado ? 'bg-orange-500/15 border border-orange-500/30 text-orange-300 hover:bg-orange-500/25' :
                      tieneFranja && !esDom ? 'bg-yellow-500/10 border border-yellow-500/20 text-white hover:bg-yellow-500/20' :
                      'bg-white/[0.02] border border-white/[0.04] text-gray-500 hover:bg-white/[0.06] hover:text-gray-300'}
                    ${esHoy && !esActivo ? 'ring-1 ring-yellow-400/60' : ''}
                  `}>
                  <span>{dia}</span>
                  {tieneFranja && !esActivo && !esDom && (
                    <span className={`absolute bottom-1 w-1 h-1 rounded-full ${bloqueado ? 'bg-orange-400' : 'bg-yellow-400'}`}/>
                  )}
                </button>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[9px] text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/70"/> Agenda configurada
            </span>
            <span className="flex items-center gap-1.5 text-[9px] text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400/70"/> Bloqueado
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-componente: Calendario Semana ───────────────────────────────────────
function CalSemana({
  fecha, setFecha, dispPorDia, bloqueos, onClickDia, diaActivo, eliminarDisp, setPanelActivo, setFranja, emptyFranja,
}: {
  fecha: Date; setFecha: (d: Date) => void;
  dispPorDia: Record<number, Disponibilidad[]>; bloqueos: Bloqueo[];
  onClickDia: (d: Date) => void; diaActivo: Date | null;
  eliminarDisp: (id: string) => void;
  setPanelActivo: (p: 'franja' | 'bloqueo' | 'eliminar' | null) => void;
  setFranja: (fn: (p: any) => any) => void;
  emptyFranja: any;
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
      <div className="grid grid-cols-7 gap-1.5 flex-1 overflow-y-auto">
        {dias7.map((d, i) => {
          const dow       = d.getDay();
          const franjas   = dispPorDia[dow] || [];
          const bloqueado = estaEnBloqueo(d, bloqueos);
          const esHoy     = isoDate(d) === isoDate(hoy);
          const esDom     = dow === 0;
          const esActivo  = diaActivo ? isoDate(d) === isoDate(diaActivo) : false;

          return (
            <div key={i}
              className={`rounded-xl border flex flex-col transition-all
                ${esDom ? 'opacity-25' : ''}
                ${bloqueado ? 'border-orange-500/25 bg-orange-500/[0.04]' :
                  franjas.length > 0 ? 'border-yellow-500/20 bg-yellow-500/[0.04]' :
                  'border-white/[0.05] bg-white/[0.015]'}
                ${esActivo ? 'ring-1 ring-yellow-400/50' : ''}
              `}>

              {/* Cabecera día */}
              <div className={`flex items-center justify-between px-2 pt-2 pb-1.5 border-b
                ${bloqueado ? 'border-orange-500/15' : franjas.length > 0 ? 'border-yellow-500/15' : 'border-white/[0.04]'}`}>
                <div>
                  <p className={`text-[9px] font-black tracking-wide
                    ${esHoy ? 'text-yellow-400' : bloqueado ? 'text-orange-400' : franjas.length > 0 ? 'text-yellow-400/80' : 'text-gray-600'}`}>
                    {DIAS_CORTO[dow]}
                  </p>
                  <p className={`text-sm font-black leading-none ${esHoy ? 'text-white' : 'text-gray-500'}`}>
                    {d.getDate()}
                  </p>
                </div>
                {franjas.length > 0 && (
                  <span className="text-[8px] bg-yellow-500/15 text-yellow-400 rounded-full px-1 font-bold">{franjas.length}</span>
                )}
              </div>

              {/* Franjas */}
              <div className="flex-1 p-1 space-y-0.5 overflow-hidden">
                {bloqueado ? (
                  <div className="flex flex-col items-center justify-center py-2 text-orange-400/50 text-[8px] gap-0.5">
                    <CalendarX2 size={10}/>
                    <span>Bloq.</span>
                  </div>
                ) : franjas.length === 0 && !esDom ? (
                  <button
                    onClick={() => { setFranja((p: any) => ({ ...p, diasSeleccionados: [dow] })); setPanelActivo('franja'); }}
                    className="w-full py-3 flex flex-col items-center justify-center gap-0.5 text-gray-700 hover:text-gray-500 hover:bg-white/[0.03] rounded-lg transition-all group">
                    <Plus size={11} className="group-hover:text-yellow-500 transition-colors"/>
                    <span className="text-[8px]">Agregar</span>
                  </button>
                ) : (
                  franjas.map(f => (
                    <div key={f.id}
                      className="relative group/f flex flex-col gap-0.5 bg-yellow-500/10 border border-yellow-500/15 rounded-md px-1.5 py-1">
                      <HoraBarra inicio={f.horaInicio} fin={f.horaFin}/>
                      <p className="text-[8px] text-yellow-300/90 font-mono">{f.horaInicio}–{f.horaFin}</p>
                      <p className="text-[7px] text-gray-600">{f.duracionSlot}m · {calcTurnos(f.horaInicio, f.horaFin, f.duracionSlot)}t</p>
                      <button onClick={() => eliminarDisp(f.id)}
                        className="absolute top-0.5 right-0.5 opacity-0 group-hover/f:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                        <X size={8}/>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {franjas.length > 0 && !esDom && !bloqueado && (
                <button
                  onClick={() => { setFranja((p: any) => ({ ...p, diasSeleccionados: [dow] })); setPanelActivo('franja'); }}
                  className="w-full py-0.5 text-[8px] text-gray-700 hover:text-yellow-500 hover:bg-yellow-500/5 transition-all border-t border-white/[0.04] rounded-b-xl flex items-center justify-center gap-0.5">
                  <Plus size={8}/> franja
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
  fecha, setFecha, dispPorDia, bloqueos, eliminarDisp, setPanelActivo, setFranja,
}: {
  fecha: Date; setFecha: (d: Date) => void;
  dispPorDia: Record<number, Disponibilidad[]>; bloqueos: Bloqueo[];
  eliminarDisp: (id: string) => void;
  setPanelActivo: (p: 'franja' | 'bloqueo' | 'eliminar' | null) => void;
  setFranja: (fn: (p: any) => any) => void;
}) {
  const dow       = fecha.getDay();
  const franjas   = dispPorDia[dow] || [];
  const blqDia    = getBloqueosDia(fecha, bloqueos);
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
        {/* Bloqueos del día */}
        {blqDia.length > 0 && (
          <div className="bg-orange-500/[0.07] border border-orange-500/25 rounded-xl p-3">
            <p className="text-orange-400 text-xs font-bold flex items-center gap-1.5 mb-2">
              <CalendarX2 size={13}/> Día bloqueado
            </p>
            {blqDia.map(b => (
              <p key={b.id} className="text-orange-300/80 text-[10px]">
                {b.motivo || 'Bloqueo'} · {fmtFecha(b.fechaInicio.slice(0,10))} → {fmtFecha(b.fechaFin.slice(0,10))}
              </p>
            ))}
          </div>
        )}

        {/* Franjas del día */}
        {franjas.length > 0 ? (
          <div>
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">
              Franjas configuradas — {DIAS_LARGO[dow]}s
            </p>
            <div className="space-y-2">
              {franjas.map(f => {
                const turnos = calcTurnos(f.horaInicio, f.horaFin, f.duracionSlot);
                return (
                  <div key={f.id}
                    className="group/f flex items-center gap-3 bg-yellow-500/[0.06] border border-yellow-500/20 rounded-xl px-4 py-3">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-yellow-400"/>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{f.horaInicio} – {f.horaFin}</p>
                      <p className="text-gray-500 text-xs">{f.duracionSlot}min por turno · {turnos} turnos disponibles</p>
                      {f.sede && <p className="text-gray-600 text-[10px] mt-0.5">{f.sede}{f.consultorio ? ` · ${f.consultorio}` : ''}</p>}
                      <HoraBarra inicio={f.horaInicio} fin={f.horaFin}/>
                    </div>
                    <button onClick={() => eliminarDisp(f.id)}
                      className="opacity-0 group-hover/f:opacity-100 text-gray-600 hover:text-red-400 p-2 rounded-lg transition-all">
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
            <p className="text-sm">Sin franjas para los {DIAS_LARGO[dow]}s</p>
            <button
              onClick={() => { setPanelActivo('franja'); setFranja((p: any) => ({ ...p, diasSeleccionados: [dow] })); }}
              className="mt-3 flex items-center gap-1.5 text-xs text-yellow-500 hover:text-yellow-300 transition-colors">
              <Plus size={12}/> Agregar franja para este día
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ConfigAgendaPage() {
  // ── Datos ──────────────────────────────────────────────────────────────────
  const [medicos,          setMedicos]          = useState<Medico[]>([]);
  const [medicoSel,        setMedicoSel]        = useState<Medico | null>(null);
  const [tiposConsulta,    setTiposConsulta]    = useState<TipoConsulta[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [bloqueos,         setBloqueos]         = useState<Bloqueo[]>([]);

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
  const [vigenciaAño,  setVigenciaAño]  = useState(() => new Date().getFullYear());

  // ── Estado panel Eliminar ──────────────────────────────────────────────────
  type FranjaConCitas = Disponibilidad & { numCitas: number };
  const [elimFiltroDias,    setElimFiltroDias]    = useState<number[]>([]);
  const [elimFiltroMeses,   setElimFiltroMeses]   = useState<number[]>([]);
  const [elimFiltroAño,     setElimFiltroAño]     = useState(() => new Date().getFullYear());
  const [elimFranjas,       setElimFranjas]       = useState<FranjaConCitas[]>([]);
  const [elimSel,           setElimSel]           = useState<string[]>([]);
  const [elimCargando,      setElimCargando]      = useState(false);
  const [elimEliminando,    setElimEliminando]    = useState(false);
  const [elimCargado,       setElimCargado]       = useState(false);

  const emptyFranja = {
    diasSeleccionados: [1, 2, 3, 4, 5] as number[],
    horaInicio: '08:00', horaFin: '16:00',
    duracionSlot: 30, sede: 'Principal',
    tipoConsultaId: '', tipoConsultaNombre: '',
    consultorio: '', fechaDesde: '', fechaHasta: '',
    plantillasActivas: [] as string[],
    mesesSeleccionados: [] as number[],
    añoVigencia: new Date().getFullYear(),
  };
  const [franja,      setFranja]      = useState({ ...emptyFranja });
  const emptyBloqueo = { fechaInicio: todayStr(), fechaFin: todayStr(), motivo: '', todoElDia: true };
  const [bloqueoForm, setBloqueoForm] = useState({ ...emptyBloqueo });

  const token   = () => localStorage.getItem('accessToken') || '';
  const getUser = () => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } };

  // ── Cargar médicos ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingMedicos(true);
      try {
        const r = await fetch('/api/disponibilidad/medicos-list', { headers: { Authorization: `Bearer ${token()}` } });
        const d = await r.json();
        const lista: Medico[] = d.medicos || [];
        setMedicos(lista);
        const u = getUser();
        if (u.rol === 'MEDICO' && lista.length > 0) {
          const propio = lista.find(m => m.id === (u.id || u.userId));
          if (propio) await cargarDatosMedico(propio);
        }
      } catch { setError('Error cargando profesionales'); }
      finally { setLoadingMedicos(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Selección médico ───────────────────────────────────────────────────────
  const cargarDatosMedico = async (m: Medico) => {
    setMedicoSel(m);
    setDisponibilidades([]); setBloqueos([]); setTiposConsulta([]);
    setLoadingDatos(true); setPanelActivo(null);
    try {
      const [rT, rD, rB] = await Promise.all([
        fetch(`/api/disponibilidad/tipos-consulta/${m.id}`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`/api/disponibilidad/medico/${m.id}`,         { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`/api/disponibilidad/bloqueos/medico/${m.id}`,{ headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      const [dT, dD, dB] = await Promise.all([rT.json(), rD.json(), rB.json()]);
      setTiposConsulta(dT.tiposConsulta || []);
      setDisponibilidades(dD.disponibilidades || []);
      setBloqueos(dB.bloqueos || []);
      const primer = (dT.tiposConsulta || [])[0];
      if (primer) setFranja(p => ({ ...p, tipoConsultaId: primer.id, tipoConsultaNombre: primer.nombre, duracionSlot: primer.duracionMinutos || 30 }));
    } catch { setError('Error cargando datos del profesional'); }
    finally { setLoadingDatos(false); }
  };

  const recargar = useCallback(async () => {
    if (!medicoSel) return;
    setLoadingDatos(true);
    try {
      const [rD, rB] = await Promise.all([
        fetch(`/api/disponibilidad/medico/${medicoSel.id}`,         { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`/api/disponibilidad/bloqueos/medico/${medicoSel.id}`,{ headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      const [dD, dB] = await Promise.all([rD.json(), rB.json()]);
      setDisponibilidades(dD.disponibilidades || []);
      setBloqueos(dB.bloqueos || []);
    } finally { setLoadingDatos(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicoSel]);

  // ── Guardar franja ─────────────────────────────────────────────────────────
  const guardarFranja = async () => {
    if (!medicoSel) return;
    if (!franja.diasSeleccionados.length) { setError('Selecciona al menos un día'); return; }

    // Pares de horario a crear (plantillas activas o manual)
    const pares: { horaInicio: string; horaFin: string }[] =
      franja.plantillasActivas.length > 0
        ? franja.plantillasActivas.map(lbl => {
            const pl = PLANTILLAS.find(p => p.label === lbl)!;
            return { horaInicio: pl.horaInicio, horaFin: pl.horaFin };
          })
        : [{ horaInicio: franja.horaInicio, horaFin: franja.horaFin }];

    for (const par of pares) {
      if (calcTurnos(par.horaInicio, par.horaFin, franja.duracionSlot) <= 0) {
        setError(`Horario inválido: ${par.horaInicio}–${par.horaFin}`); return;
      }
    }

    // Rangos de fechas: uno por mes seleccionado, o indefinido
    const rangos: { fechaDesde?: string; fechaHasta?: string }[] =
      franja.mesesSeleccionados.length > 0
        ? franja.mesesSeleccionados.map(mes => {
            const mm      = String(mes).padStart(2, '0');
            const lastDay = new Date(franja.añoVigencia, mes, 0).toISOString().split('T')[0];
            return { fechaDesde: `${franja.añoVigencia}-${mm}-01`, fechaHasta: lastDay };
          })
        : [{}];

    setGuardando(true); setError('');
    try {
      const errores: string[] = [];
      let totalCreados = 0;
      for (const rango of rangos) {
        for (const par of pares) {
          const base = {
            medicoId: medicoSel.id, ...par,
            duracionSlot: franja.duracionSlot, sede: franja.sede || 'Principal',
            tipoAtencion: franja.tipoConsultaNombre || 'CONSULTA', consultorio: franja.consultorio,
            ...rango,
          };
          for (const dia of franja.diasSeleccionados) {
            const res = await fetch('/api/disponibilidad', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
              body: JSON.stringify({ ...base, diaSemana: dia }),
            });
            if (!res.ok) { const d = await res.json(); errores.push(`${DIAS_LARGO[dia]}: ${d.error || 'error'}`); }
            else totalCreados++;
          }
        }
      }
      setSuccess(`${totalCreados} franja${totalCreados !== 1 ? 's' : ''} creada${totalCreados !== 1 ? 's' : ''}`);
      if (errores.length) setError(errores.join(' | '));
      setFranja({ ...emptyFranja });
      setPanelActivo(null);
      await recargar();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) { setError(e.message); }
    finally { setGuardando(false); }
  };

  // ── Guardar bloqueo ────────────────────────────────────────────────────────
  const guardarBloqueo = async () => {
    if (!medicoSel) return;
    if (!bloqueoForm.fechaInicio || !bloqueoForm.fechaFin) { setError('Completa las fechas del bloqueo'); return; }
    setGuardando(true); setError('');
    try {
      const res = await fetch('/api/disponibilidad/bloqueos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ...bloqueoForm, medicoId: medicoSel.id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error'); }
      setSuccess('Bloqueo creado');
      setBloqueoForm({ ...emptyBloqueo });
      setPanelActivo(null);
      await recargar();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) { setError(e.message); }
    finally { setGuardando(false); }
  };

  const eliminarDisp    = async (id: string) => {
    const res = await fetch(`/api/disponibilidad/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Error al eliminar la franja'); return; }
    await recargar();
  };
  const eliminarBloqueo = async (id: string) => { await fetch(`/api/disponibilidad/bloqueos/${id}`,{ method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } }); await recargar(); };

  // ── Eliminar franjas en lote ───────────────────────────────────────────────
  const cargarEliminar = async () => {
    if (!medicoSel) return;
    setElimCargando(true); setElimCargado(false);
    try {
      const r = await fetch(`/api/disponibilidad/con-citas/${medicoSel.id}`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      let lista: FranjaConCitas[] = d.disponibilidades || [];
      if (elimFiltroDias.length > 0) lista = lista.filter(f => elimFiltroDias.includes(f.diaSemana));
      if (elimFiltroMeses.length > 0) {
        lista = lista.filter(f => {
          if (!f.fechaDesde && !f.fechaHasta) return true;
          return elimFiltroMeses.some(mes => {
            const p1 = new Date(elimFiltroAño, mes - 1, 1);
            const p2 = new Date(elimFiltroAño, mes, 0);
            const fd = f.fechaDesde ? new Date(f.fechaDesde) : null;
            const fh = f.fechaHasta ? new Date(f.fechaHasta) : null;
            if (!fd && !fh) return true;
            if (fd && !fh) return fd <= p2;
            if (!fd && fh) return fh >= p1;
            return fd <= p2 && fh >= p1;
          });
        });
      }
      setElimFranjas(lista);
      setElimSel(lista.filter(f => f.numCitas === 0).map(f => f.id));
      setElimCargado(true);
    } catch (e: any) { setError(e.message); }
    finally { setElimCargando(false); }
  };

  const ejecutarEliminar = async () => {
    if (!elimSel.length) return;
    setElimEliminando(true);
    let ok = 0; let fail = 0;
    for (const id of elimSel) {
      const r = await fetch(`/api/disponibilidad/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
      if (r.ok) ok++; else fail++;
    }
    setElimFranjas([]); setElimSel([]); setElimCargado(false);
    await recargar();
    setSuccess(`${ok} franja${ok !== 1 ? 's' : ''} eliminada${ok !== 1 ? 's' : ''}`);
    if (fail) setError(`${fail} no pudieron eliminarse (tienen citas)`);
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

  // Filtro dinámico: nombre + apellido + especialidad + cédula/documento
  const medicosFiltrados = useMemo(() =>
    medicos.filter(m => {
      const q = busqueda.toLowerCase().trim();
      if (!q) return true;
      return (
        `${m.nombre} ${m.apellido}`.toLowerCase().includes(q) ||
        (m.especialidad || '').toLowerCase().includes(q) ||
        (m.numeroDocumento || '').toLowerCase().includes(q) ||
        (m.registroMedico || '').toLowerCase().includes(q)
      );
    }),
  [medicos, busqueda]);

  const dispPorDia = useMemo(() => {
    const mapa: Record<number, Disponibilidad[]> = {};
    for (const d of disponibilidades) {
      if (!mapa[d.diaSemana]) mapa[d.diaSemana] = [];
      mapa[d.diaSemana].push(d);
    }
    return mapa;
  }, [disponibilidades]);

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
          {medicoSel && (
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-500 border border-white/10 rounded-full px-2 py-0.5">
              <User size={9}/> {medicoSel.nombre} {medicoSel.apellido}
            </span>
          )}
        </div>

        {/* Tabs vista */}
        {medicoSel && (
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
          {medicoSel && (
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

        {/* ━━ Columna izquierda: profesionales ━━ */}
        <div className="w-64 flex-shrink-0 border-r border-white/[0.06] flex flex-col bg-[#0a0c13]">
          {/* Buscador dinámico: nombre + especialidad + cédula */}
          <div className="px-3 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2">
              <Search size={12} className="text-gray-500 flex-shrink-0"/>
              <input
                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Nombre, especialidad o cédula…"
                className="bg-transparent text-white text-xs placeholder-gray-600 flex-1 focus:outline-none"
              />
              {busqueda && (
                <button onClick={() => setBusqueda('')} className="text-gray-600 hover:text-gray-400"><X size={11}/></button>
              )}
            </div>
            <p className="text-[9px] text-gray-700 mt-1 pl-1">
              {medicosFiltrados.length} de {medicos.length} profesional{medicos.length !== 1 ? 'es' : ''}
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
                const activo = medicoSel?.id === m.id;
                return (
                  <button key={m.id} onClick={() => cargarDatosMedico(m)}
                    className={`w-full text-left px-3 py-3 flex items-center gap-2.5 transition-all group border-l-2
                      ${activo ? 'bg-yellow-500/10 border-yellow-400' : 'border-transparent hover:bg-white/[0.03] hover:border-white/10'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0
                      ${activo ? 'bg-yellow-500 text-slate-900' : 'bg-white/[0.06] text-gray-400 group-hover:bg-white/10'}`}>
                      {m.nombre[0]}{m.apellido[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold truncate ${activo ? 'text-white' : 'text-gray-300'}`}>
                        {m.nombre} {m.apellido}
                      </p>
                      <p className="text-[10px] text-gray-600 truncate">{m.especialidad || 'Sin especialidad'}</p>
                      {m.numeroDocumento && (
                        <p className="text-[9px] text-gray-700 truncate font-mono">{m.numeroDocumento}</p>
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
          {!medicoSel ? (
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
                  <p className="text-white font-bold text-sm">{medicoSel.nombre} {medicoSel.apellido}</p>
                  <p className="text-gray-600 text-[10px]">
                    {medicoSel.especialidad || 'Sin especialidad'}
                    {medicoSel.numeroDocumento && <> · CC {medicoSel.numeroDocumento}</>}
                    {' · '}{disponibilidades.length} franjas · {bloqueos.length} bloqueos
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
                    dispPorDia={dispPorDia} bloqueos={bloqueos}
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
                    dispPorDia={dispPorDia} bloqueos={bloqueos}
                    onClickDia={onClickDiaCalendario} diaActivo={diaActivo}
                    eliminarDisp={eliminarDisp}
                    setPanelActivo={setPanelActivo}
                    setFranja={setFranja}
                    emptyFranja={emptyFranja}
                  />
                )}
                {vista === 'dia' && (
                  <CalDia
                    fecha={calFecha} setFecha={d => { setCalFecha(d); setDiaActivo(d); }}
                    dispPorDia={dispPorDia} bloqueos={bloqueos}
                    eliminarDisp={eliminarDisp}
                    setPanelActivo={setPanelActivo}
                    setFranja={setFranja}
                  />
                )}

                {/* Bloqueos resumen (solo en vista semana/mes) */}
                {vista !== 'dia' && bloqueos.length > 0 && (
                  <div className="mt-5">
                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <CalendarX2 size={11} className="text-orange-500"/> Bloqueos activos
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {bloqueos.map(b => (
                        <div key={b.id}
                          className="flex items-center justify-between gap-2 bg-orange-500/[0.05] border border-orange-500/20 rounded-xl px-3 py-2 group/blq">
                          <div>
                            <p className="text-white text-xs font-semibold">{b.motivo || 'Bloqueo'}</p>
                            <p className="text-orange-400/80 text-[10px]">
                              {fmtFecha(b.fechaInicio.slice(0,10))} → {fmtFecha(b.fechaFin.slice(0,10))}
                              {b.todoElDia && <span className="ml-1.5 text-[9px] text-orange-600">todo el día</span>}
                            </p>
                          </div>
                          <button onClick={() => eliminarBloqueo(b.id)}
                            className="opacity-0 group-hover/blq:opacity-100 text-gray-600 hover:text-red-400 p-1 rounded transition-all">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ━━ Panel lateral deslizante ━━ */}
        <AnimatePresence>
          {panelActivo && medicoSel && (
            <motion.div
              key={panelActivo}
              initial={{ x: 340, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 340, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 35 }}
              className={`w-80 flex-shrink-0 flex flex-col border-l overflow-hidden
                ${panelActivo === 'bloqueo' ? 'border-orange-500/20 bg-[#0d0a08]' : panelActivo === 'eliminar' ? 'border-rose-500/20 bg-[#0d0809]' : 'border-yellow-500/20 bg-[#0d0c08]'}`}
            >
              {/* ── Panel Franja ── */}
              {panelActivo === 'franja' && (
                <>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-yellow-500/15">
                    <div>
                      <p className="text-yellow-400 font-bold text-sm flex items-center gap-1.5"><CalendarCheck2 size={14}/> Nueva Franja</p>
                      <p className="text-gray-600 text-[10px]">{medicoSel.nombre} {medicoSel.apellido}</p>
                    </div>
                    <button onClick={() => setPanelActivo(null)} className="text-gray-600 hover:text-white p-1"><X size={16}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {/* Año + Meses */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Meses</label>
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={franja.añoVigencia <= new Date().getFullYear()}
                            onClick={() => setFranja(p => ({ ...p, añoVigencia: Math.max(new Date().getFullYear(), p.añoVigencia - 1), mesesSeleccionados: [] }))}
                            className="w-5 h-5 flex items-center justify-center rounded bg-white/[0.04] hover:bg-yellow-500/20 text-gray-500 hover:text-yellow-400 disabled:opacity-25 disabled:cursor-not-allowed transition-all">
                            <ChevronLeft size={11}/>
                          </button>
                          <span className="text-[10px] font-bold text-gray-400 w-14 text-center">
                            {franja.añoVigencia === new Date().getFullYear() ? 'actual' : franja.añoVigencia}
                          </span>
                          <button
                            onClick={() => setFranja(p => ({ ...p, añoVigencia: p.añoVigencia + 1, mesesSeleccionados: [] }))}
                            className="w-5 h-5 flex items-center justify-center rounded bg-white/[0.04] hover:bg-yellow-500/20 text-gray-500 hover:text-yellow-400 transition-all">
                            <ChevronRight size={11}/>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-1 mb-2">
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
                              className={`py-2 rounded-lg text-[10px] font-bold transition-all
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
                        }} className="text-[9px] text-yellow-500/70 hover:text-yellow-300 transition-colors">todos</button>
                        <button onClick={() => {
                          const hA = new Date().getFullYear(); const hM = new Date().getMonth() + 1;
                          setFranja(p => ({ ...p, mesesSeleccionados: [1,2,3,4,5,6].filter(m => !(p.añoVigencia===hA && m<hM)) }));
                        }} className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors">1er sem</button>
                        <button onClick={() => {
                          const hA = new Date().getFullYear(); const hM = new Date().getMonth() + 1;
                          setFranja(p => ({ ...p, mesesSeleccionados: [7,8,9,10,11,12].filter(m => !(p.añoVigencia===hA && m<hM)) }));
                        }} className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors">2do sem</button>
                        {franja.mesesSeleccionados.length > 0 && (
                          <button onClick={() => setFranja(p => ({ ...p, mesesSeleccionados: [] }))}
                            className="text-[9px] text-gray-700 hover:text-gray-400 transition-colors ml-auto">limpiar</button>
                        )}
                      </div>
                      {franja.mesesSeleccionados.length === 0
                        ? <p className="text-[9px] text-gray-700">Sin meses = vigencia indefinida</p>
                        : <p className="text-[9px] text-yellow-500/60">{franja.mesesSeleccionados.map(m => MESES_CORTO[m-1]).join(' · ')} {franja.añoVigencia}</p>
                      }
                    </div>

                    {/* Días de la semana */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Días de la semana</label>
                        <div className="flex gap-2">
                          <button onClick={() => setFranja(p => ({ ...p, diasSeleccionados: [1,2,3,4,5] }))}
                            className="text-[9px] text-yellow-500 hover:text-yellow-300 transition-colors">L–V</button>
                          <button onClick={() => setFranja(p => ({ ...p, diasSeleccionados: DIAS_LABORALES }))}
                            className="text-[9px] text-gray-500 hover:text-gray-300 transition-colors">L–S</button>
                          <button onClick={() => setFranja(p => ({ ...p, diasSeleccionados: [] }))}
                            className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors">ninguno</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {[0,1,2,3,4,5,6].map(dia => {
                          const sel = franja.diasSeleccionados.includes(dia);
                          const esDom = dia === 0;
                          return (
                            <button key={dia} onClick={() => !esDom && toggleDia(dia)} disabled={esDom}
                              className={`flex flex-col items-center py-2 rounded-lg text-[10px] font-bold transition-all
                                ${esDom ? 'opacity-25 cursor-not-allowed bg-transparent text-gray-600' :
                                  sel ? 'bg-yellow-500 text-slate-900 shadow-md shadow-yellow-500/20' :
                                  'bg-white/[0.04] text-gray-500 hover:bg-white/[0.08] hover:text-gray-300'}`}>
                              {DIAS_CORTO[dia]}
                            </button>
                          );
                        })}
                      </div>
                      {franja.diasSeleccionados.length > 0 && (
                        <p className="text-[9px] text-yellow-500/70 mt-1.5">
                          {franja.diasSeleccionados.map(d => DIAS_CORTO[d]).join(' · ')}
                        </p>
                      )}
                    </div>

                    {/* Plantillas — multi-selección */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Plantillas rápidas</label>
                        {franja.plantillasActivas.length > 0 && (
                          <button onClick={() => setFranja(p => ({ ...p, plantillasActivas: [] }))}
                            className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors">limpiar</button>
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

                    {/* Horario manual — solo si no hay plantillas activas */}
                    {franja.plantillasActivas.length === 0 && (
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Horario manual</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-gray-600 block mb-1">Inicio</label>
                            <input type="time" value={franja.horaInicio} onChange={e => setFranja(p => ({ ...p, horaInicio: e.target.value }))}
                              className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-yellow-500/50 transition-all"/>
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-600 block mb-1">Fin</label>
                            <input type="time" value={franja.horaFin} onChange={e => setFranja(p => ({ ...p, horaFin: e.target.value }))}
                              className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-yellow-500/50 transition-all"/>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Intervalo */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Duración del turno</label>
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

                    {/* Preview turnos */}
                    <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border text-xs
                      ${turnosPreview > 0 ? 'bg-emerald-500/[0.07] border-emerald-500/20 text-emerald-300' : 'bg-red-500/[0.07] border-red-500/20 text-red-400'}`}>
                      <Clock size={14} className="flex-shrink-0"/>
                      {turnosPreview > 0 ? (
                        franja.plantillasActivas.length > 1 ? (
                          <><strong className="text-white">{turnosPreview} turnos</strong> · {franja.plantillasActivas.length} franjas · {franja.duracionSlot}min c/u</>
                        ) : (
                          <><strong className="text-white">{turnosPreview} turnos</strong> · {franja.plantillasActivas.length === 1 ? (() => { const pl = PLANTILLAS.find(p => p.label === franja.plantillasActivas[0])!; return `${pl.horaInicio}–${pl.horaFin}`; })() : `${franja.horaInicio}–${franja.horaFin}`} · {franja.duracionSlot}min c/u</>
                        )
                      ) : 'Revisa el horario'}
                    </div>

                    {/* Tipo consulta */}
                    {tiposConsulta.length > 0 && (
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Tipo de consulta</label>
                        <div className="space-y-1">
                          {tiposConsulta.map(t => (
                            <button key={t.id}
                              onClick={() => setFranja(p => ({ ...p, tipoConsultaId: t.id, tipoConsultaNombre: t.nombre, duracionSlot: t.duracionMinutos || p.duracionSlot }))}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all
                                ${franja.tipoConsultaId === t.id ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:border-white/10 hover:text-gray-300'}`}>
                              <span>{t.nombre}</span>
                              <span className="text-[9px] opacity-60">{t.duracionMinutos}min</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sede / Consultorio */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-gray-600 block mb-1.5 uppercase tracking-widest font-bold">Sede</label>
                        <input value={franja.sede} onChange={e => setFranja(p => ({ ...p, sede: e.target.value }))}
                          placeholder="Principal"
                          className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-2.5 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-all"/>
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-600 block mb-1.5 uppercase tracking-widest font-bold">Consultorio</label>
                        <input value={franja.consultorio} onChange={e => setFranja(p => ({ ...p, consultorio: e.target.value }))}
                          placeholder="Ej: Cons. 2"
                          className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-2.5 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-all"/>
                      </div>
                    </div>

                  </div>

                  <div className="flex-shrink-0 px-4 py-3 border-t border-yellow-500/15">
                    <button onClick={guardarFranja}
                      disabled={guardando || turnosPreview <= 0 || franja.diasSeleccionados.length === 0}
                      className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black text-sm py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20">
                      {guardando ? (
                        <><RefreshCw size={14} className="animate-spin"/> Guardando...</>
                      ) : (() => {
                        const nMeses = franja.mesesSeleccionados.length || 1;
                        const nPares = franja.plantillasActivas.length || 1;
                        const nDias  = franja.diasSeleccionados.length;
                        const total  = nMeses * nPares * nDias;
                        const detalles = [nMeses>1?`${nMeses} meses`:'', nPares>1?`${nPares} horarios`:'', nDias>1?`${nDias} días`:''].filter(Boolean).join(' × ');
                        return <><Check size={14}/> Crear {total > 1 ? `${total} franjas` : 'franja'}{detalles ? ` (${detalles})` : ''}</>;
                      })()}
                    </button>
                  </div>
                </>
              )}

              {/* ── Panel Bloqueo ── */}
              {panelActivo === 'bloqueo' && (
                <>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-orange-500/15">
                    <div>
                      <p className="text-orange-400 font-bold text-sm flex items-center gap-1.5"><CalendarX2 size={14}/> Nuevo Bloqueo</p>
                      <p className="text-gray-600 text-[10px]">{medicoSel.nombre} {medicoSel.apellido}</p>
                    </div>
                    <button onClick={() => setPanelActivo(null)} className="text-gray-600 hover:text-white p-1"><X size={16}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    <div className="bg-orange-500/[0.05] border border-orange-500/15 rounded-xl px-3 py-2.5 text-[10px] text-orange-300/70">
                      Los bloqueos impiden agendar citas en el período indicado (vacaciones, congresos, cirugías programadas, etc.)
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
                    <div className="flex items-center gap-3">
                      <button onClick={() => setBloqueoForm(p => ({ ...p, todoElDia: !p.todoElDia }))} className="transition-colors">
                        {bloqueoForm.todoElDia ? <ToggleRight size={22} className="text-orange-400"/> : <ToggleLeft size={22} className="text-gray-600"/>}
                      </button>
                      <div>
                        <p className="text-white text-xs font-medium">Todo el día</p>
                        <p className="text-gray-600 text-[10px]">Bloquea todo el horario disponible</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 px-4 py-3 border-t border-orange-500/15">
                    <button onClick={guardarBloqueo} disabled={guardando || !bloqueoForm.fechaInicio || !bloqueoForm.fechaFin}
                      className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black text-sm py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      {guardando ? <><RefreshCw size={14} className="animate-spin"/> Guardando...</> : <><CalendarX2 size={14}/> Crear bloqueo</>}
                    </button>
                  </div>
                </>
              )}

              {/* ── Panel Eliminar Franjas ── */}
              {panelActivo === 'eliminar' && (
                <>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-rose-500/15">
                    <div>
                      <p className="text-rose-400 font-bold text-sm flex items-center gap-1.5"><Trash2 size={14}/> Eliminar Franjas</p>
                      <p className="text-gray-600 text-[10px]">{medicoSel.nombre} {medicoSel.apellido}</p>
                    </div>
                    <button onClick={() => setPanelActivo(null)} className="text-gray-600 hover:text-white p-1"><X size={16}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    <div className="bg-rose-500/[0.05] border border-rose-500/15 rounded-xl px-3 py-2.5 text-[10px] text-rose-300/70">
                      Solo se eliminan franjas <strong>sin pacientes asignados</strong>. Las que tienen citas activas quedan protegidas.
                    </div>

                    {/* Filtro días */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Filtrar por día</label>
                      <div className="flex flex-wrap gap-1">
                        {DIAS_LARGO.map((d, i) => {
                          const esDom = i === 0;
                          const sel   = elimFiltroDias.includes(i);
                          return (
                            <button key={i} disabled={esDom}
                              onClick={() => setElimFiltroDias(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])}
                              className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all
                                ${esDom ? 'opacity-20 cursor-not-allowed text-gray-700 bg-white/[0.02]' :
                                  sel  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' :
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
                          const hoyAño  = new Date().getFullYear();
                          const hoyMes  = new Date().getMonth() + 1;
                          const isPast  = elimFiltroAño === hoyAño && mesNum < hoyMes;
                          const isSel   = elimFiltroMeses.includes(mesNum);
                          return (
                            <button key={i} disabled={isPast}
                              onClick={() => setElimFiltroMeses(p => p.includes(mesNum) ? p.filter(x => x !== mesNum) : [...p, mesNum])}
                              className={`py-1.5 rounded-lg text-[10px] font-bold transition-all
                                ${isPast ? 'opacity-20 cursor-not-allowed text-gray-700 bg-white/[0.02]' :
                                  isSel  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' :
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
                      {elimCargando ? <><RefreshCw size={12} className="animate-spin"/> Cargando...</> : <><Search size={12}/> Buscar franjas</>}
                    </button>

                    {/* Lista de franjas */}
                    {elimCargado && (
                      <div>
                        {elimFranjas.length === 0 ? (
                          <p className="text-center text-gray-600 text-xs py-4">No hay franjas con esos filtros</p>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{elimFranjas.length} franja{elimFranjas.length !== 1 ? 's' : ''}</span>
                              <div className="flex gap-2">
                                <button onClick={() => setElimSel(elimFranjas.filter(f => f.numCitas === 0).map(f => f.id))}
                                  className="text-[9px] text-gray-600 hover:text-rose-400 transition-colors">todas libres</button>
                                <button onClick={() => setElimSel([])}
                                  className="text-[9px] text-gray-600 hover:text-rose-400 transition-colors">ninguna</button>
                              </div>
                            </div>
                            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                              {elimFranjas.map(f => {
                                const tieneCitas = f.numCitas > 0;
                                const checked    = elimSel.includes(f.id);
                                return (
                                  <button key={f.id} disabled={tieneCitas}
                                    onClick={() => setElimSel(p => p.includes(f.id) ? p.filter(x => x !== f.id) : [...p, f.id])}
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
                                      <p className="text-[11px] font-semibold text-gray-300 truncate">{DIAS_LARGO[f.diaSemana]}</p>
                                      <p className="text-[10px] text-gray-600">{f.horaInicio} – {f.horaFin}</p>
                                      {(f.fechaDesde || f.fechaHasta) && (
                                        <p className="text-[9px] text-gray-700 truncate">{fmtFecha(f.fechaDesde || '')} → {fmtFecha(f.fechaHasta || '')}</p>
                                      )}
                                    </div>
                                    {tieneCitas ? (
                                      <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full flex-shrink-0">{f.numCitas} cita{f.numCitas !== 1 ? 's' : ''}</span>
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
                        ? <><RefreshCw size={14} className="animate-spin"/> Eliminando...</>
                        : <><Trash2 size={14}/> Eliminar {elimSel.length > 0 ? `(${elimSel.length})` : ''}</>}
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
