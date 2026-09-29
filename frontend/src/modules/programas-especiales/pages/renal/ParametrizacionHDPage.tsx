// Parametrización HD — sillones, esquemas de turno, jornadas, máquinas
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParametrizacion } from '../../hooks/useHemodialisis';
import { useMaquinas } from '../../hooks/useDashboardRenal';
import type {
  SillonHD, EsquemaConfig, JornadaConfig,
} from '../../types';
import {
  DIAS_SEMANA, SILLON_ESTADO_COLOR, SILLON_ESTADO_LABEL,
} from '../../types';

// ── Utilidades ────────────────────────────────────────────────

const SECCIONES = ['sillones', 'esquemas', 'jornadas', 'maquinas'] as const;
type Seccion = typeof SECCIONES[number];

const SECCION_INFO: Record<Seccion, { label: string; icon: string; desc: string }> = {
  sillones: { label: 'Sillones',           icon: '🪑', desc: 'Puestos de diálisis disponibles' },
  esquemas: { label: 'Esquemas de turno',  icon: '📅', desc: 'Días de la semana por esquema (LMV, MJS…)' },
  jornadas: { label: 'Jornadas',           icon: '🕐', desc: 'Franjas horarias de atención' },
  maquinas: { label: 'Máquinas HD',        icon: '⚙️', desc: 'Equipos de hemodiálisis habilitados' },
};

// ── Sección: Sillones ─────────────────────────────────────────

function SillonesSection({
  sillones, guardando, onCrear, onActualizar, onEliminar,
}: {
  sillones: SillonHD[];
  guardando: boolean;
  onCrear: (d: Omit<SillonHD, 'id'>) => Promise<void>;
  onActualizar: (id: string, d: Partial<SillonHD>) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SillonHD, 'id'>>({
    numero: '', descripcion: '', estado: 'ACTIVO',
  });
  const [modo, setModo] = useState<'idle' | 'nuevo' | 'editar'>('idle');

  function abrirNuevo() {
    setForm({ numero: '', descripcion: '', estado: 'ACTIVO' });
    setModo('nuevo');
    setEditId(null);
  }

  function abrirEditar(s: SillonHD) {
    setForm({ numero: s.numero, descripcion: s.descripcion ?? '', estado: s.estado });
    setEditId(s.id);
    setModo('editar');
  }

  async function handleGuardar() {
    if (modo === 'nuevo') await onCrear(form);
    else if (editId) await onActualizar(editId, form);
    setModo('idle');
    setEditId(null);
  }

  const activos = sillones.filter((s) => s.estado === 'ACTIVO').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/40 text-xs">{activos} de {sillones.length} activos</p>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#00B4D8]/15 text-[#00B4D8] border border-[#00B4D8]/30 hover:bg-[#00B4D8]/25 transition-colors"
        >
          + Agregar sillón
        </button>
      </div>

      {/* Formulario */}
      <AnimatePresence>
        {(modo === 'nuevo' || modo === 'editar') && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 rounded-xl border border-[#00B4D8]/30 bg-[#00B4D8]/5 space-y-3">
              <p className="text-[#00B4D8] text-sm font-medium">
                {modo === 'nuevo' ? 'Nuevo sillón' : 'Editar sillón'}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Número / Código *</label>
                  <input
                    value={form.numero}
                    onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
                    placeholder="ej: A1, 5, B-3"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Descripción</label>
                  <input
                    value={form.descripcion}
                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Sala A, junto a ventana…"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Estado</label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value as SillonHD['estado'] }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="MANTENIMIENTO">Mantenimiento</option>
                    <option value="BAJA">Baja</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setModo('idle')}
                  className="text-xs px-3 py-1.5 text-white/40 hover:text-white/70 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={!form.numero || guardando}
                  className="text-xs px-4 py-1.5 rounded-lg bg-[#00B4D8] text-white hover:bg-[#00B4D8]/80 disabled:opacity-50 transition-colors"
                >
                  {guardando ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid de sillones */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {sillones.map((s) => (
          <div key={s.id}
            className="group flex items-center justify-between p-3 rounded-xl border border-white/8 bg-white/3 hover:border-white/15 transition-all"
          >
            <div>
              <p className="text-white font-bold text-base">🪑 {s.numero}</p>
              {s.descripcion && <p className="text-white/40 text-xs">{s.descripcion}</p>}
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border ${SILLON_ESTADO_COLOR[s.estado]}`}>
                {SILLON_ESTADO_LABEL[s.estado]}
              </span>
            </div>
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => abrirEditar(s)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={() => confirm(`¿Eliminar sillón ${s.numero}?`) && onEliminar(s.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {sillones.length === 0 && (
          <p className="col-span-3 text-white/30 text-sm text-center py-6">Sin sillones configurados</p>
        )}
      </div>
    </div>
  );
}

// ── Sección: Esquemas de turno ────────────────────────────────

function EsquemasSection({
  esquemas, guardando, onCrear, onActualizar, onEliminar,
}: {
  esquemas: EsquemaConfig[];
  guardando: boolean;
  onCrear: (d: Omit<EsquemaConfig, 'id'>) => Promise<void>;
  onActualizar: (id: string, d: Partial<EsquemaConfig>) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<EsquemaConfig, 'id'>>({
    codigo: '', nombre: '', dias: [], activo: true,
  });
  const [modo, setModo] = useState<'idle' | 'nuevo' | 'editar'>('idle');

  function abrirNuevo() {
    setForm({ codigo: '', nombre: '', dias: [], activo: true });
    setModo('nuevo'); setEditId(null);
  }
  function abrirEditar(e: EsquemaConfig) {
    setForm({ codigo: e.codigo, nombre: e.nombre, dias: [...e.dias], activo: e.activo });
    setEditId(e.id); setModo('editar');
  }
  async function handleGuardar() {
    if (modo === 'nuevo') await onCrear(form);
    else if (editId) await onActualizar(editId, form);
    setModo('idle'); setEditId(null);
  }
  function toggleDia(dia: number) {
    setForm((f) => ({
      ...f,
      dias: f.dias.includes(dia) ? f.dias.filter((d) => d !== dia) : [...f.dias, dia].sort(),
    }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/40 text-xs">{esquemas.filter((e) => e.activo).length} activos</p>
        <button onClick={abrirNuevo}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#00B4D8]/15 text-[#00B4D8] border border-[#00B4D8]/30 hover:bg-[#00B4D8]/25 transition-colors">
          + Agregar esquema
        </button>
      </div>

      <AnimatePresence>
        {(modo === 'nuevo' || modo === 'editar') && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
            <div className="p-4 rounded-xl border border-[#00B4D8]/30 bg-[#00B4D8]/5 space-y-3">
              <p className="text-[#00B4D8] text-sm font-medium">
                {modo === 'nuevo' ? 'Nuevo esquema' : 'Editar esquema'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Código *</label>
                  <input value={form.codigo}
                    onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                    placeholder="LMV, MJS, LUNES…"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Nombre *</label>
                  <input value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder="Lunes – Miércoles – Viernes"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
              </div>

              {/* Selector de días */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Días de la semana *</label>
                <div className="flex gap-2 flex-wrap">
                  {DIAS_SEMANA.map((dia, idx) => (
                    <button key={idx} type="button"
                      onClick={() => toggleDia(idx)}
                      className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all ${
                        form.dias.includes(idx)
                          ? 'bg-[#00B4D8]/20 border-[#00B4D8]/50 text-[#00B4D8]'
                          : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      {dia}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.activo}
                    onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                    className="w-4 h-4 accent-[#00B4D8]" />
                  <span className="text-white/60 text-sm">Activo</span>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setModo('idle')}
                  className="text-xs px-3 py-1.5 text-white/40 hover:text-white/70 transition-colors">Cancelar</button>
                <button onClick={handleGuardar}
                  disabled={!form.codigo || !form.nombre || form.dias.length === 0 || guardando}
                  className="text-xs px-4 py-1.5 rounded-lg bg-[#00B4D8] text-white hover:bg-[#00B4D8]/80 disabled:opacity-50 transition-colors">
                  {guardando ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {esquemas.map((e) => (
          <div key={e.id}
            className="group flex items-center gap-4 p-3 rounded-xl border border-white/8 bg-white/3 hover:border-white/15 transition-all"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">{e.codigo}</span>
                {!e.activo && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/10">Inactivo</span>
                )}
              </div>
              <p className="text-white/50 text-xs mt-0.5">{e.nombre}</p>
              <div className="flex gap-1 mt-1.5">
                {DIAS_SEMANA.map((d, i) => (
                  <span key={i}
                    className={`w-7 h-6 rounded-md text-xs flex items-center justify-center ${
                      e.dias.includes(i)
                        ? 'bg-[#00B4D8]/20 text-[#00B4D8] font-bold'
                        : 'bg-white/5 text-white/20'
                    }`}
                  >{d.substring(0, 1)}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => abrirEditar(e)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={() => confirm(`¿Eliminar esquema ${e.codigo}?`) && onEliminar(e.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {esquemas.length === 0 && (
          <p className="text-white/30 text-sm text-center py-6">Sin esquemas configurados</p>
        )}
      </div>
    </div>
  );
}

// ── Sección: Jornadas ─────────────────────────────────────────

function JornadasSection({
  jornadas, guardando, onCrear, onActualizar, onEliminar,
}: {
  jornadas: JornadaConfig[];
  guardando: boolean;
  onCrear: (d: Omit<JornadaConfig, 'id'>) => Promise<void>;
  onActualizar: (id: string, d: Partial<JornadaConfig>) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<JornadaConfig, 'id'>>({
    codigo: '', nombre: '', horaInicio: '06:00', horaFin: '12:00', activo: true, orden: 1,
  });
  const [modo, setModo] = useState<'idle' | 'nuevo' | 'editar'>('idle');

  function abrirNuevo() {
    setForm({ codigo: '', nombre: '', horaInicio: '06:00', horaFin: '12:00', activo: true, orden: jornadas.length + 1 });
    setModo('nuevo'); setEditId(null);
  }
  function abrirEditar(j: JornadaConfig) {
    setForm({ codigo: j.codigo, nombre: j.nombre, horaInicio: j.horaInicio, horaFin: j.horaFin, activo: j.activo, orden: j.orden });
    setEditId(j.id); setModo('editar');
  }
  async function handleGuardar() {
    if (modo === 'nuevo') await onCrear(form);
    else if (editId) await onActualizar(editId, form);
    setModo('idle'); setEditId(null);
  }

  const jornadasOrdenadas = [...jornadas].sort((a, b) => a.orden - b.orden);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/40 text-xs">{jornadas.filter((j) => j.activo).length} activas</p>
        <button onClick={abrirNuevo}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#00B4D8]/15 text-[#00B4D8] border border-[#00B4D8]/30 hover:bg-[#00B4D8]/25 transition-colors">
          + Agregar jornada
        </button>
      </div>

      <AnimatePresence>
        {(modo === 'nuevo' || modo === 'editar') && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
            <div className="p-4 rounded-xl border border-[#00B4D8]/30 bg-[#00B4D8]/5 space-y-3">
              <p className="text-[#00B4D8] text-sm font-medium">
                {modo === 'nuevo' ? 'Nueva jornada' : 'Editar jornada'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Código *</label>
                  <input value={form.codigo}
                    onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                    placeholder="MANANA, TARDE, NOCHE…"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Nombre *</label>
                  <input value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder="Mañana, Tarde, Noche…"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Hora inicio</label>
                  <input type="time" value={form.horaInicio}
                    onChange={(e) => setForm((f) => ({ ...f, horaInicio: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Hora fin</label>
                  <input type="time" value={form.horaFin}
                    onChange={(e) => setForm((f) => ({ ...f, horaFin: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Orden de visualización</label>
                  <input type="number" min={1} value={form.orden}
                    onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.activo}
                      onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                      className="w-4 h-4 accent-[#00B4D8]" />
                    <span className="text-white/60 text-sm">Activa</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setModo('idle')}
                  className="text-xs px-3 py-1.5 text-white/40 hover:text-white/70 transition-colors">Cancelar</button>
                <button onClick={handleGuardar}
                  disabled={!form.codigo || !form.nombre || guardando}
                  className="text-xs px-4 py-1.5 rounded-lg bg-[#00B4D8] text-white hover:bg-[#00B4D8]/80 disabled:opacity-50 transition-colors">
                  {guardando ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {jornadasOrdenadas.map((j) => (
          <div key={j.id}
            className="group flex items-center gap-4 p-3 rounded-xl border border-white/8 bg-white/3 hover:border-white/15 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-300 text-xs font-bold shrink-0">
              {j.orden}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">{j.nombre}</span>
                <span className="text-white/30 text-xs font-mono">{j.codigo}</span>
                {!j.activo && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/10">Inactiva</span>
                )}
              </div>
              <p className="text-white/40 text-xs mt-0.5">
                🕐 {j.horaInicio} – {j.horaFin}
              </p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => abrirEditar(j)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={() => confirm(`¿Eliminar jornada "${j.nombre}"?`) && onEliminar(j.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {jornadas.length === 0 && (
          <p className="text-white/30 text-sm text-center py-6">Sin jornadas configuradas</p>
        )}
      </div>
    </div>
  );
}

// ── Sección: Máquinas ─────────────────────────────────────────

function MaquinasSection({ sillones }: { sillones: import('../../types').SillonHD[] }) {
  const { maquinas, loading, guardando, crearMaquina, actualizarMaquina } = useMaquinas();
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    codigo: '', marca: '', modelo: '', serie: '', sillon: '', estado: 'ACTIVO',
  });
  const [modo, setModo] = useState<'idle' | 'nuevo' | 'editar'>('idle');
  const [error, setError] = useState<string | null>(null);

  function abrirNuevo() {
    setForm({ codigo: '', marca: '', modelo: '', serie: '', sillon: '', estado: 'ACTIVO' });
    setEditId(null);
    setModo('nuevo');
    setError(null);
  }

  function abrirEditar(m: import('../../types').MaquinaDialisis) {
    setForm({
      codigo:  m.codigo  ?? '',
      marca:   m.marca   ?? '',
      modelo:  m.modelo  ?? '',
      serie:   m.serie   ?? '',
      sillon:  m.sillon  ?? '',
      estado:  m.estado  ?? 'ACTIVO',
    });
    setEditId(m.id);
    setModo('editar');
    setError(null);
  }

  async function handleGuardar() {
    setError(null);
    try {
      const payload = {
        codigo:  form.codigo,
        marca:   form.marca,
        modelo:  form.modelo  || undefined,
        serie:   form.serie   || undefined,
        sillon:  form.sillon  || undefined,
        estado:  form.estado,
      };
      if (modo === 'nuevo') {
        await crearMaquina(payload);
      } else if (editId) {
        await actualizarMaquina(editId, payload);
      }
      setModo('idle');
      setEditId(null);
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar');
    }
  }

  if (loading) return <div className="h-32 animate-pulse bg-white/3 rounded-xl" />;

  const sillonesActivos = sillones.filter((s) => s.estado === 'ACTIVO');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/40 text-xs">
          {maquinas.filter((m) => m.estado === 'ACTIVO').length} de {maquinas.length} activas
        </p>
        <button onClick={abrirNuevo}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#00B4D8]/15 text-[#00B4D8] border border-[#00B4D8]/30 hover:bg-[#00B4D8]/25 transition-colors">
          + Agregar máquina
        </button>
      </div>

      {/* Formulario crear / editar */}
      <AnimatePresence>
        {(modo === 'nuevo' || modo === 'editar') && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
            <div className="p-4 rounded-xl border border-[#00B4D8]/30 bg-[#00B4D8]/5 space-y-3">
              <p className="text-[#00B4D8] text-sm font-medium">
                {modo === 'nuevo' ? 'Nueva máquina HD' : 'Editar máquina HD'}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Código *</label>
                  <input value={form.codigo}
                    onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                    placeholder="HD-01"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Marca *</label>
                  <input value={form.marca}
                    onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
                    placeholder="Fresenius, Nipro…"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Modelo</label>
                  <input value={form.modelo}
                    onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
                    placeholder="5008S, DBB-05"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">N° Serie</label>
                  <input value={form.serie}
                    onChange={(e) => setForm((f) => ({ ...f, serie: e.target.value }))}
                    placeholder="SN-XXXXXX"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Sillón asignado</label>
                  {sillonesActivos.length > 0 ? (
                    <select value={form.sillon}
                      onChange={(e) => setForm((f) => ({ ...f, sillon: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                      <option value="">Sin asignar</option>
                      {sillonesActivos.map((s) => (
                        <option key={s.id} value={s.numero}>
                          {s.numero}{s.descripcion ? ` — ${s.descripcion}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input value={form.sillon}
                      onChange={(e) => setForm((f) => ({ ...f, sillon: e.target.value }))}
                      placeholder="Configure sillones primero"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                  )}
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Estado</label>
                  <select value={form.estado}
                    onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="ACTIVO">Activo</option>
                    <option value="MANTENIMIENTO">Mantenimiento</option>
                    <option value="INACTIVO">Inactivo</option>
                    <option value="BAJA">Baja</option>
                  </select>
                </div>
              </div>
              {error && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button onClick={() => { setModo('idle'); setEditId(null); setError(null); }}
                  className="text-xs px-3 py-1.5 text-white/40 hover:text-white/70 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleGuardar}
                  disabled={!form.codigo || !form.marca || guardando}
                  className="text-xs px-4 py-1.5 rounded-lg bg-[#00B4D8] text-white hover:bg-[#00B4D8]/80 disabled:opacity-50 transition-colors">
                  {guardando ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de máquinas */}
      <div className="space-y-2">
        {maquinas.map((m) => (
          <div key={m.id}
            className="group flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/3 hover:border-white/15 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-white/50 text-sm shrink-0">⚙️</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">{m.codigo}</span>
                <span className="text-white/50 text-xs">{m.marca} {m.modelo ?? ''}</span>
                {m.serie && <span className="text-white/30 text-xs font-mono">#{m.serie}</span>}
              </div>
              <div className="flex gap-2 mt-1">
                {m.sillon && (
                  <span className="text-xs text-white/40 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
                    🪑 Sillón {m.sillon}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  m.estado === 'ACTIVO'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : m.estado === 'MANTENIMIENTO'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-white/5 text-white/30 border-white/10'
                }`}>{m.estado}</span>
              </div>
            </div>
            {/* Botón editar visible al hover */}
            <button
              onClick={() => abrirEditar(m)}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 text-white/40 hover:text-white/80 transition-all"
              title="Editar máquina"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        ))}
        {maquinas.length === 0 && (
          <p className="text-white/30 text-sm text-center py-6">Sin máquinas registradas</p>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────

export function ParametrizacionHDPage() {
  const [seccionActiva, setSeccionActiva] = useState<Seccion>('sillones');
  const {
    param, loading, guardando, error,
    crearSillon, actualizarSillon, eliminarSillon,
    crearEsquema, actualizarEsquema, eliminarEsquema,
    crearJornada, actualizarJornada, eliminarJornada,
  } = useParametrizacion();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-white text-lg font-semibold">⚙️ Parametrización HD</h2>
        <p className="text-white/40 text-sm mt-0.5">
          Configure sillones, esquemas de turno, jornadas y máquinas de hemodiálisis
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Tabs de sección */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SECCIONES.map((sec) => {
          const info = SECCION_INFO[sec];
          return (
            <button key={sec} onClick={() => setSeccionActiva(sec)}
              className={`p-3 rounded-xl border text-left transition-all ${
                seccionActiva === sec
                  ? 'border-[#00B4D8]/40 bg-[#00B4D8]/10 text-white'
                  : 'border-white/8 bg-white/3 text-white/50 hover:bg-white/5 hover:border-white/15'
              }`}
            >
              <p className="text-lg mb-1">{info.icon}</p>
              <p className="font-semibold text-sm">{info.label}</p>
              <p className="text-xs opacity-60 mt-0.5 leading-tight">{info.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Contenido de la sección activa */}
      <div className="p-5 rounded-2xl border border-white/8 bg-white/2">
        <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <span>{SECCION_INFO[seccionActiva].icon}</span>
          {SECCION_INFO[seccionActiva].label}
        </h3>

        <AnimatePresence mode="wait">
          <motion.div key={seccionActiva} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map((i) => <div key={i} className="h-12 rounded-xl bg-white/4 animate-pulse" />)}
              </div>
            ) : (
              <>
                {seccionActiva === 'sillones' && param && (
                  <SillonesSection
                    sillones={param.sillones}
                    guardando={guardando}
                    onCrear={crearSillon}
                    onActualizar={actualizarSillon}
                    onEliminar={eliminarSillon}
                  />
                )}
                {seccionActiva === 'esquemas' && param && (
                  <EsquemasSection
                    esquemas={param.esquemas}
                    guardando={guardando}
                    onCrear={crearEsquema}
                    onActualizar={actualizarEsquema}
                    onEliminar={eliminarEsquema}
                  />
                )}
                {seccionActiva === 'jornadas' && param && (
                  <JornadasSection
                    jornadas={param.jornadas}
                    guardando={guardando}
                    onCrear={crearJornada}
                    onActualizar={actualizarJornada}
                    onEliminar={eliminarJornada}
                  />
                )}
                {seccionActiva === 'maquinas' && (
                  <MaquinasSection sillones={param?.sillones ?? []} />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
