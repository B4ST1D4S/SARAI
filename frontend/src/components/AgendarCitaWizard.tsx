/**
 * AgendarCitaWizard — Pantalla única fluida de agendamiento SaaS
 * Sin botón "Siguiente" — cada selección revela la siguiente sección
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertCircle, Stethoscope, Clock, MapPin, User, FileText, Zap, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { getTiposConsulta, getSedesActivas, getSlotsDisponibles, crearCita, type TipoConsultaItem, type SedeItem } from '../services/api';

interface SlotOption {
  key: string;
  turnoId: string;
  horaInicio: string;
  horaFin: string;
  profesional: string;
  consultorio: string;
}

export interface AgendarCitaWizardProps {
  pacienteId?: string; pacienteNombre?: string; entidadSaludInicial?: string;
  medicoIdPre?: string; onClose: () => void; onSuccess?: (citaId?: string) => void;
}

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"];
const fechaLarga = (anio: number, mes: number, dia: number) =>
  new Date(anio, mes - 1, dia).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

function SeccionHeader({ num, titulo, completado, resumen }: { num: number; titulo: string; completado: boolean; resumen?: string }) {
  return (
    <div className={`flex items-center justify-between px-5 py-3 border-b ${completado ? "border-emerald-500/20" : "border-yellow-500/10"}`}>
      <div className="flex items-center gap-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${completado ? "bg-emerald-500 text-black" : "bg-yellow-500/20 border border-yellow-500/50 text-yellow-300"}`}>
          {completado ? <Check size={12} /> : num}
        </div>
        <span className={`font-semibold text-sm ${completado ? "text-emerald-300" : "text-white"}`}>{titulo}</span>
      </div>
      {completado && resumen && <span className="text-xs text-emerald-400 font-medium truncate max-w-xs">{resumen}</span>}
    </div>
  );
}

export default function AgendarCitaWizard({
  pacienteId = "", pacienteNombre = "", onClose, onSuccess,
}: AgendarCitaWizardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tipoSel, setTipoSel] = useState<TipoConsultaItem | null>(null);
  const [sedeSel, setSedeSel] = useState<SedeItem | null>(null);
  const [diaSel, setDiaSel] = useState<number | null>(null);
  const [slotSel, setSlotSel] = useState<SlotOption | null>(null);
  const [notas, setNotas] = useState("");
  const [tipos, setTipos] = useState<TipoConsultaItem[]>([]);
  const [sedes, setSedes] = useState<SedeItem[]>([]);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loadTipos, setLoadTipos] = useState(false);
  const [loadSedes, setLoadSedes] = useState(false);
  const [loadSlots, setLoadSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const hoy = new Date();
  const [calMes, setCalMes] = useState(hoy.getMonth() + 1);
  const [calAnio, setCalAnio] = useState(hoy.getFullYear());

  const scrollToBottom = () => setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 180);

  useEffect(() => {
    setLoadTipos(true);
    getTiposConsulta()
      .then((data) => setTipos(Array.isArray(data) ? data.filter((t) => t.estado) : []))
      .catch(() => setTipos([]))
      .finally(() => setLoadTipos(false));
  }, []);

  useEffect(() => {
    if (!tipoSel) return;
    setLoadSedes(true); setSedes([]); setSedeSel(null); setDiaSel(null); setSlots([]); setSlotSel(null);
    getSedesActivas()
      .then((data) => { setSedes(Array.isArray(data) ? data : []); scrollToBottom(); })
      .catch(() => setSedes([]))
      .finally(() => setLoadSedes(false));
  }, [tipoSel]);

  useEffect(() => {
    if (!diaSel || !sedeSel || !tipoSel) return;
    setLoadSlots(true); setSlots([]); setSlotSel(null);
    const fecha = `${calAnio}-${String(calMes).padStart(2,"0")}-${String(diaSel).padStart(2,"0")}`;
    getSlotsDisponibles({ sedeId: sedeSel.id, especialidadId: tipoSel.especialidadId, fechaInicio: fecha, fechaFin: fecha })
      .then((turnos) => {
        const opciones: SlotOption[] = [];
        for (const turno of turnos || []) {
          for (const s of turno.slots || []) {
            if (!s.disponible) continue;
            opciones.push({
              key: s.slotId,
              turnoId: turno.turnoId,
              horaInicio: s.horaInicio,
              horaFin: s.horaFin,
              profesional: turno.profesional?.nombreCompleto || 'Profesional',
              consultorio: turno.consultorio?.nombre || '',
            });
          }
        }
        opciones.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        setSlots(opciones);
        scrollToBottom();
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadSlots(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaSel]);

  const handleConfirmar = async () => {
    if (!tipoSel || !sedeSel || !diaSel || !slotSel) return;
    setError(""); setSubmitting(true);
    try {
      const data: any = await crearCita({
        turnoId: slotSel.turnoId,
        horaInicio: slotSel.horaInicio,
        pacienteId,
        tipoConsultaId: tipoSel.id,
        motivoConsulta: notas || undefined,
      });
      setSubmitted(true);
      setTimeout(() => { onSuccess?.(data?.cita?.id); onClose(); }, 2400);
    } catch (e: any) { setError(e.message || "Error al crear la cita"); }
    finally { setSubmitting(false); }
  };

  const primerDia = new Date(calAnio, calMes - 1, 1).getDay();
  const diasEnMes = new Date(calAnio, calMes, 0).getDate();
  const celdas = [...Array(primerDia).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)];
  while (celdas.length % 7 !== 0) celdas.push(null);
  const hoyDia = hoy.getDate(); const hoyMes = hoy.getMonth() + 1; const hoyAnio = hoy.getFullYear();
  const esPasado = (d: number) => calAnio < hoyAnio || (calAnio === hoyAnio && calMes < hoyMes) || (calAnio === hoyAnio && calMes === hoyMes && d < hoyDia);
  const prevMes = () => { if (calMes===1){setCalMes(12);setCalAnio(a=>a-1);}else setCalMes(m=>m-1); };
  const nextMes = () => { if (calMes===12){setCalMes(1);setCalAnio(a=>a+1);}else setCalMes(m=>m+1); };
  const listo = !!(tipoSel && sedeSel && diaSel && slotSel);

  if (submitted) return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-slate-900 to-slate-800 border border-emerald-500/40 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center mx-auto mb-6">
          <Check className="text-emerald-400" size={40} />
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-1">¡Cita Agendada!</h3>
        <p className="text-gray-400 text-sm mb-5">{pacienteNombre && <><span className="text-yellow-300 font-semibold">{pacienteNombre}</span> — </>}{tipoSel?.nombre}</p>
        <div className="bg-slate-800/50 rounded-xl p-4 text-sm text-left space-y-2">
          <div className="flex justify-between"><span className="text-slate-500">Profesional</span><span className="text-white font-medium">{slotSel?.profesional}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Sede</span><span className="text-white font-medium">{sedeSel?.nombre}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Fecha</span><span className="text-white font-medium">{diaSel ? fechaLarga(calAnio,calMes,diaSel) : ""}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Hora</span><span className="text-yellow-300 font-bold">{slotSel?.horaInicio}</span></div>
        </div>
        <p className="mt-5 text-yellow-400/70 text-xs animate-pulse">Redirigiendo...</p>
      </motion.div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
        className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-yellow-500/20 rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl shadow-yellow-500/5 overflow-hidden"
        style={{ maxHeight: "calc(100vh - 16px)" }}>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-full" />
            <div>
              <h2 className="text-lg font-bold text-white">Agendar Cita</h2>
              {pacienteNombre && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><User size={11} />{pacienteNombre}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-full transition-colors"><X className="text-gray-400" size={18} /></button>
        </div>

        {/* Cuerpo scrollable */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">

          {/* ① TIPO DE CONSULTA */}
          <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${tipoSel ? "border-emerald-500/30 bg-emerald-500/5" : "border-yellow-500/20 bg-slate-800/30"}`}>
            <SeccionHeader num={1} titulo="Tipo de Consulta" completado={!!tipoSel}
              resumen={tipoSel ? tipoSel.nombre : undefined} />
            {!tipoSel && (
              <div className="px-5 py-4">
                <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                  <Stethoscope size={13} className="text-yellow-400" />Selecciona el tipo de consulta
                  {loadTipos && <RefreshCw size={11} className="animate-spin text-yellow-400 ml-1" />}
                </p>
                {!loadTipos && tipos.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-6">No hay tipos de consulta configurados. Configúralos en Parametrización.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {tipos.map(t => (
                      <button key={t.id} type="button" onClick={() => setTipoSel(t)}
                        className="relative flex flex-col gap-2 p-3.5 rounded-xl border text-left transition-all bg-slate-800/40 border-slate-700/40 hover:border-yellow-500/50 hover:bg-yellow-500/8">
                        <span className="font-semibold text-white text-xs leading-snug">{t.nombre}</span>
                        {t.descripcion && <span className="text-[10px] text-slate-400 line-clamp-2">{t.descripcion}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ② SEDE */}
          <AnimatePresence>
            {tipoSel && (
              <motion.div key="sede" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${sedeSel ? "border-emerald-500/30 bg-emerald-500/5" : "border-yellow-500/20 bg-slate-800/30"}`}>
                  <SeccionHeader num={2} titulo="Sede" completado={!!sedeSel}
                    resumen={sedeSel ? sedeSel.nombre : undefined} />
                  {!sedeSel && (
                    <div className="px-5 py-4">
                      <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                        <MapPin size={13} className="text-yellow-400" />¿Dónde se atenderá la consulta?
                        {loadSedes && <RefreshCw size={11} className="animate-spin text-yellow-400 ml-1" />}
                      </p>
                      {loadSedes ? (
                        <div className="flex items-center justify-center py-8"><div className="w-7 h-7 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" /></div>
                      ) : sedes.length === 0 ? (
                        <p className="text-center text-slate-500 text-sm py-6 flex flex-col items-center gap-2">
                          <MapPin size={32} className="opacity-20" />No hay sedes activas configuradas.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {sedes.map(s => (
                            <button key={s.id} type="button" onClick={() => setSedeSel(s)}
                              className="flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all bg-slate-800/40 border-slate-700/40 hover:border-yellow-500/50 hover:bg-yellow-500/8">
                              <div className="w-10 h-10 rounded-xl bg-slate-700/60 text-slate-300 flex items-center justify-center flex-shrink-0"><MapPin size={16} /></div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-xs truncate">{s.nombre}</p>
                                {s.ciudad && <p className="text-[11px] text-slate-400 truncate">{s.ciudad}</p>}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ③ CALENDARIO */}
          <AnimatePresence>
            {tipoSel && sedeSel && (
              <motion.div key="cal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${diaSel ? "border-emerald-500/30 bg-emerald-500/5" : "border-yellow-500/20 bg-slate-800/30"}`}>
                  <SeccionHeader num={3} titulo="Fecha" completado={!!diaSel}
                    resumen={diaSel ? fechaLarga(calAnio, calMes, diaSel) : undefined} />
                  {!diaSel && (
                    <div className="px-4 py-3">
                      {/* Nav mes */}
                      <div className="flex items-center justify-between mb-2">
                        <button onClick={prevMes} className="w-6 h-6 flex items-center justify-center hover:bg-slate-700/60 rounded-md transition-colors">
                          <ChevronLeft size={14} className="text-slate-400" />
                        </button>
                        <span className="font-semibold text-white text-xs">{MESES[calMes-1]} {calAnio}</span>
                        <button onClick={nextMes} className="w-6 h-6 flex items-center justify-center hover:bg-slate-700/60 rounded-md transition-colors">
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>
                      </div>
                      {/* Cabecera días */}
                      <div className="grid grid-cols-7 mb-1">
                        {DIAS.map(d => <div key={d} className="text-center text-[9px] text-slate-600 font-semibold py-0.5 uppercase">{d}</div>)}
                      </div>
                      {/* Celdas */}
                      <div className="grid grid-cols-7 gap-0.5">
                        {celdas.map((dia, i) => {
                          if (!dia) return <div key={`e-${i}`} className="aspect-square" />;
                          const esHoy = dia===hoyDia && calMes===hoyMes && calAnio===hoyAnio;
                          const pasado = esPasado(dia);
                          return (
                            <button key={dia} type="button"
                              disabled={pasado}
                              onClick={() => setDiaSel(dia)}
                              className={`relative aspect-square rounded-md text-[11px] font-medium transition-all flex items-center justify-center
                                ${!pasado
                                  ? "bg-yellow-500/12 text-yellow-300 hover:bg-yellow-500/28 border border-yellow-500/30 hover:scale-105"
                                  : "text-slate-700 cursor-default"}
                                ${esHoy ? "ring-1 ring-yellow-500/70" : ""}`}
                            >
                              {dia}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ④ HORARIOS */}
          <AnimatePresence>
            {tipoSel && sedeSel && diaSel && (
              <motion.div key="hora" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${slotSel ? "border-emerald-500/30 bg-emerald-500/5" : "border-yellow-500/20 bg-slate-800/30"}`}>
                  <SeccionHeader num={4} titulo="Horario" completado={!!slotSel}
                    resumen={slotSel ? `${slotSel.horaInicio} · ${slotSel.profesional}` : undefined} />
                  {!slotSel && (
                    <div className="px-5 py-4">
                      <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                        <Clock size={13} className="text-yellow-400" />
                        Horarios el {diaSel} de {MESES[calMes-1]}
                        {loadSlots && <RefreshCw size={11} className="animate-spin text-yellow-400 ml-1" />}
                      </p>
                      {loadSlots ? (
                        <div className="flex items-center gap-2 text-slate-400 text-xs py-4">
                          <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />Consultando...
                        </div>
                      ) : slots.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-5">
                          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2.5 text-xs text-amber-300 w-full">
                            <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-amber-400" />
                            <span>No hay horarios disponibles para este día en esta sede. Selecciona otra fecha.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDiaSel(null)}
                            className="text-xs text-slate-400 hover:text-yellow-300 underline underline-offset-2 transition-colors"
                          >
                            ← Volver al calendario
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {slots.map(s => (
                            <button
                              key={s.key}
                              type="button"
                              onClick={() => { setSlotSel(s); scrollToBottom(); }}
                              className="flex flex-col gap-1 py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all bg-slate-700/40 border-slate-600/40 text-white hover:border-yellow-500/60 hover:bg-yellow-500/10 hover:text-yellow-200 cursor-pointer text-left"
                            >
                              <span className="text-sm">{s.horaInicio}</span>
                              <span className="text-[10px] font-normal text-slate-400 truncate">{s.profesional}</span>
                              {s.consultorio && <span className="text-[9px] font-normal text-slate-500 truncate">{s.consultorio}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ⑤ CONFIRMAR */}
          <AnimatePresence>
            {listo && (
              <motion.div key="confirm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <div className="border border-yellow-500/30 rounded-2xl overflow-hidden bg-yellow-500/5">
                  <div className="px-5 py-3 border-b border-yellow-500/20 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-xs font-bold text-yellow-300">5</div>
                    <span className="font-semibold text-sm text-white">Confirmar Cita</span>
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs bg-slate-800/40 rounded-xl p-4">
                      <div><p className="text-slate-500 mb-0.5">Paciente</p><p className="text-white font-semibold">{pacienteNombre||"—"}</p></div>
                      <div><p className="text-slate-500 mb-0.5">Tipo</p><p className="text-yellow-300 font-semibold">{tipoSel?.nombre}</p></div>
                      <div><p className="text-slate-500 mb-0.5">Profesional</p><p className="text-white font-medium">{slotSel?.profesional}</p></div>
                      <div><p className="text-slate-500 mb-0.5">Hora</p><p className="text-yellow-300 font-bold text-sm">{slotSel?.horaInicio}</p></div>
                      <div><p className="text-slate-500 mb-0.5">Sede</p><p className="text-white font-medium">{sedeSel?.nombre}</p></div>
                      <div><p className="text-slate-500 mb-0.5">Fecha</p><p className="text-white font-medium">{diaSel ? fechaLarga(calAnio,calMes,diaSel) : ""}</p></div>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 mb-1.5">
                        <FileText size={13} className="text-yellow-400" />Notas <span className="text-slate-500 font-normal">(opcional)</span>
                      </label>
                      <textarea value={notas} onChange={e => setNotas(e.target.value)}
                        placeholder="Motivo, alergias, indicaciones especiales..."
                        rows={2} className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 transition resize-none" />
                    </div>
                    {error && (
                      <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" /><p className="text-red-400 text-xs">{error}</p>
                      </div>
                    )}
                    <button disabled={submitting} onClick={handleConfirmar}
                      className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-50 text-black font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 text-sm">
                      {submitting
                        ? <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Agendando...</>
                        : <><Zap size={16} />Confirmar Cita</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-2" />
        </div>
      </motion.div>
    </div>
  );
}
