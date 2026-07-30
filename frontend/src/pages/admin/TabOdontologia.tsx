import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, Sparkles, Search, Star } from 'lucide-react';
import * as odo from '../../services/odontologiaService';
import type { OdontoHallazgo, OdontoCatalogoItem, CargoBusqueda } from '../../services/odontologiaService';

// ════════════════════════════════════════════════════════════════
//  PARAMETRIZACIÓN ODONTOLOGÍA (Admin)
//  Catálogos: Hallazgos · Estados clínicos · Prioridades · Riesgo
// ════════════════════════════════════════════════════════════════

const SUB = [
  { id: 'hallazgos', label: 'Hallazgos' },
  { id: 'estados', label: 'Estados clínicos' },
  { id: 'prioridades', label: 'Prioridades' },
  { id: 'riesgos', label: 'Riesgo clínico' },
] as const;

type SubId = (typeof SUB)[number]['id'];

export default function TabOdontologia() {
  const [sub, setSub] = useState<SubId>('hallazgos');
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} className="text-yellow-400" />
        <p className="text-sm text-gray-400">
          Catálogos del módulo de Odontología. Los <b className="text-gray-200">procedimientos facturables</b> se consumen del catálogo CUPS / Tarifas.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5 bg-slate-800/40 rounded-xl p-1 w-fit">
        {SUB.map((s) => (
          <button key={s.id} onClick={() => setSub(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              sub === s.id ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {s.label}
          </button>
        ))}
      </div>
      {sub === 'hallazgos' ? <Hallazgos /> : <CatalogoSimple kind={sub} />}
    </div>
  );
}

// ─── Hallazgos ───────────────────────────────────────────────
function Hallazgos() {
  const [items, setItems] = useState<OdontoHallazgo[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Partial<OdontoHallazgo> | null>(null);
  const [err, setErr] = useState('');
  // ── Soluciones sugeridas (hallazgo → procedimiento CUPS) ──
  const [sug, setSug] = useState<{ id: string; codigo: string; descripcion: string }[]>([]);
  const [defCargo, setDefCargo] = useState('');
  const [cargoQ, setCargoQ] = useState('');
  const [cargoRes, setCargoRes] = useState<CargoBusqueda[]>([]);

  const load = () => {
    setLoading(true);
    odo.getHallazgos(true).then(setItems).catch(() => setErr('Error al cargar')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const abrirNuevo = () => {
    setEdit({ color: '#ef4444', generaTratamiento: true, activo: true });
    setSug([]); setDefCargo(''); setCargoQ(''); setCargoRes([]); setErr('');
  };
  const abrirEdit = (h: OdontoHallazgo) => {
    setEdit(h);
    const s = (h.sugerencias || []).map((x) => ({ id: x.cargo.id, codigo: x.cargo.codigo, descripcion: x.cargo.descripcion }));
    setSug(s);
    setDefCargo(h.sugerencias?.find((x) => x.porDefecto)?.cargo.id || s[0]?.id || '');
    setCargoQ(''); setCargoRes([]); setErr('');
  };

  const buscarCargo = async (q: string) => {
    setCargoQ(q);
    if (q.trim().length < 2) { setCargoRes([]); return; }
    try { setCargoRes(await odo.buscarCargos(q.trim())); } catch { setCargoRes([]); }
  };
  const addCargo = (c: CargoBusqueda) => {
    if (!sug.some((s) => s.id === c.id)) {
      const next = [...sug, { id: c.id, codigo: c.cupsCodigoStr || c.codigo, descripcion: c.descripcion }];
      setSug(next);
      if (!defCargo) setDefCargo(c.id);
    }
    setCargoQ(''); setCargoRes([]);
  };
  const removeCargo = (id: string) => {
    const next = sug.filter((s) => s.id !== id);
    setSug(next);
    if (defCargo === id) setDefCargo(next[0]?.id || '');
  };

  const guardar = async () => {
    if (!edit?.nombre?.trim()) { setErr('El nombre es requerido'); return; }
    try {
      let hid = edit.id;
      if (hid) await odo.updateHallazgo(hid, edit);
      else {
        const creado = await odo.createHallazgo({ ...edit, codigo: edit.codigo || edit.nombre.toUpperCase().replace(/\s+/g, '_') });
        hid = creado.id;
      }
      if (hid) await odo.setSugerencias(hid, sug.map((s) => s.id), defCargo || undefined);
      setEdit(null); setErr(''); load();
    } catch (e: any) { setErr(e.message || 'Error al guardar'); }
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Desactivar este hallazgo?')) return;
    await odo.deleteHallazgo(id); load();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg transition">
          <Plus size={14} /> Nuevo hallazgo
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-800/70">
              {['', 'Código', 'Nombre', 'Categoría', 'Genera trat.', 'Prioridad', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="text-left px-3 py-3 font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && !items.length && <tr><td colSpan={8} className="text-center py-8 text-gray-500">Cargando…</td></tr>}
            {!loading && !items.length && <tr><td colSpan={8} className="text-center py-8 text-gray-500">Sin hallazgos</td></tr>}
            {items.map((h) => (
              <tr key={h.id} className="hover:bg-slate-800/30">
                <td className="px-3 py-2"><span className="w-4 h-4 rounded-full inline-block" style={{ background: h.color }} /></td>
                <td className="px-3 py-2 text-gray-400 font-mono">{h.codigo}</td>
                <td className="px-3 py-2 text-white">{h.nombre}</td>
                <td className="px-3 py-2 text-gray-400">{h.categoria || '—'}</td>
                <td className="px-3 py-2">{h.generaTratamiento ? <span className="text-emerald-400">Sí</span> : <span className="text-gray-500">No</span>}</td>
                <td className="px-3 py-2 text-gray-400">{h.prioridadDefault || '—'}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${h.activo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {h.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button onClick={() => abrirEdit(h)} className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10"><Edit2 size={13} /></button>
                    <button onClick={() => eliminar(h.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <ModalForm title={edit.id ? 'Editar hallazgo' : 'Nuevo hallazgo'} onClose={() => { setEdit(null); setErr(''); }} onSave={guardar}>
          <div className="grid grid-cols-2 gap-3">
            <F label="Código" value={edit.codigo || ''} onChange={(v) => setEdit({ ...edit, codigo: v })} disabled={!!edit.id} />
            <F label="Nombre *" value={edit.nombre || ''} onChange={(v) => setEdit({ ...edit, nombre: v })} />
            <F label="Categoría" value={edit.categoria || ''} onChange={(v) => setEdit({ ...edit, categoria: v })} placeholder="PATOLOGIA, RESTAURACION…" />
            <div>
              <label className="block text-xs text-gray-400 mb-1">Color</label>
              <input type="color" value={edit.color || '#ef4444'} onChange={(e) => setEdit({ ...edit, color: e.target.value })}
                className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer" />
            </div>
            <F label="Prioridad por defecto" value={edit.prioridadDefault || ''} onChange={(v) => setEdit({ ...edit, prioridadDefault: v })} placeholder="URGENTE, ALTA…" />
            <F label="Ícono (lucide)" value={edit.icono || ''} onChange={(v) => setEdit({ ...edit, icono: v })} />
          </div>
          <div className="flex gap-4 mt-3">
            <Sw label="Genera tratamiento" value={!!edit.generaTratamiento} onChange={(v) => setEdit({ ...edit, generaTratamiento: v })} />
            <Sw label="Activo" value={edit.activo !== false} onChange={(v) => setEdit({ ...edit, activo: v })} />
          </div>
          <F label="Descripción" type="textarea" value={edit.descripcion || ''} onChange={(v) => setEdit({ ...edit, descripcion: v })} />

          {/* ── Soluciones sugeridas (hallazgo → procedimiento CUPS) ── */}
          <div className="mt-4 border-t border-white/5 pt-4">
            <label className="block text-xs font-bold text-yellow-400 mb-1">Soluciones sugeridas (procedimientos CUPS)</label>
            <p className="text-[11px] text-gray-500 mb-2">
              Al “Generar plan”, este hallazgo creará automáticamente el procedimiento marcado como
              <b className="text-yellow-400"> predeterminado</b> (con su precio y código CUPS para la facturación).
            </p>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
              <input value={cargoQ} onChange={(e) => buscarCargo(e.target.value)}
                placeholder="Buscar procedimiento CUPS por código o nombre…"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none" />
              {cargoRes.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg max-h-44 overflow-y-auto shadow-xl">
                  {cargoRes.map((c) => (
                    <button key={c.id} type="button" onClick={() => addCargo(c)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 text-xs border-b border-white/5 last:border-0">
                      <span className="text-yellow-400 font-mono">{c.cupsCodigoStr || c.codigo}</span>
                      <span className="text-gray-300 ml-2">{c.descripcion}</span>
                      {c.precioSugerido > 0 && <span className="text-emerald-400 ml-2">${c.precioSugerido.toLocaleString('es-CO')}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2 space-y-1">
              {sug.length === 0 && (
                <p className="text-[11px] text-gray-600 italic">Sin procedimientos sugeridos. El plan se generará sin precio hasta asignar uno manualmente.</p>
              )}
              {sug.map((s) => (
                <div key={s.id} className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-2 py-1.5 text-xs">
                  <button type="button" onClick={() => setDefCargo(s.id)} title="Marcar como predeterminado"
                    className={defCargo === s.id ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-300'}>
                    <Star size={14} fill={defCargo === s.id ? 'currentColor' : 'none'} />
                  </button>
                  <span className="text-yellow-400 font-mono">{s.codigo}</span>
                  <span className="text-gray-300 flex-1 truncate">{s.descripcion}</span>
                  {defCargo === s.id && <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">Predeterminado</span>}
                  <button type="button" onClick={() => removeCargo(s.id)} className="text-gray-500 hover:text-red-400"><X size={13} /></button>
                </div>
              ))}
            </div>
          </div>
          {err && <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2 mt-2">{err}</p>}
        </ModalForm>
      )}
    </div>
  );
}

// ─── Catálogos simples (estados / prioridades / riesgos) ─────
function CatalogoSimple({ kind }: { kind: 'estados' | 'prioridades' | 'riesgos' }) {
  const [items, setItems] = useState<OdontoCatalogoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Partial<OdontoCatalogoItem> | null>(null);
  const [err, setErr] = useState('');

  const load = () => {
    setLoading(true);
    odo.getCatalogo(kind).then(setItems).catch(() => setErr('Error al cargar')).finally(() => setLoading(false));
  };
  useEffect(load, [kind]);

  const guardar = async () => {
    if (!edit?.nombre?.trim()) { setErr('El nombre es requerido'); return; }
    try {
      if (edit.id) await odo.updateCatalogo(kind, edit.id, edit);
      else await odo.createCatalogo(kind, { ...edit, codigo: edit.codigo || edit.nombre.toUpperCase().replace(/\s+/g, '_') });
      setEdit(null); setErr(''); load();
    } catch (e: any) { setErr(e.message || 'Error al guardar'); }
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Desactivar este registro?')) return;
    await odo.deleteCatalogo(kind, id); load();
  };

  const esPrioridad = kind === 'prioridades';

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setEdit({ color: esPrioridad ? '#f59e0b' : '#22c55e', activo: true })}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg transition">
          <Plus size={14} /> Nuevo
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-800/70">
              {['', 'Código', 'Nombre', ...(esPrioridad ? ['Nivel'] : []), 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="text-left px-3 py-3 font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && !items.length && <tr><td colSpan={6} className="text-center py-8 text-gray-500">Cargando…</td></tr>}
            {!loading && !items.length && <tr><td colSpan={6} className="text-center py-8 text-gray-500">Sin registros</td></tr>}
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-slate-800/30">
                <td className="px-3 py-2"><span className="w-4 h-4 rounded-full inline-block" style={{ background: it.color }} /></td>
                <td className="px-3 py-2 text-gray-400 font-mono">{it.codigo}</td>
                <td className="px-3 py-2 text-white">{it.nombre}</td>
                {esPrioridad && <td className="px-3 py-2 text-gray-400">{it.nivel ?? '—'}</td>}
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${it.activo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {it.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button onClick={() => setEdit(it)} className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10"><Edit2 size={13} /></button>
                    <button onClick={() => eliminar(it.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <ModalForm title={edit.id ? 'Editar' : 'Nuevo'} onClose={() => { setEdit(null); setErr(''); }} onSave={guardar}>
          <div className="grid grid-cols-2 gap-3">
            <F label="Código" value={edit.codigo || ''} onChange={(v) => setEdit({ ...edit, codigo: v })} disabled={!!edit.id} />
            <F label="Nombre *" value={edit.nombre || ''} onChange={(v) => setEdit({ ...edit, nombre: v })} />
            <div>
              <label className="block text-xs text-gray-400 mb-1">Color</label>
              <input type="color" value={edit.color || '#22c55e'} onChange={(e) => setEdit({ ...edit, color: e.target.value })}
                className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer" />
            </div>
            {esPrioridad && <F label="Nivel (urgencia)" value={String(edit.nivel ?? '')} onChange={(v) => setEdit({ ...edit, nivel: Number(v) || 0 })} type="number" />}
            <F label="Orden" value={String(edit.orden ?? '')} onChange={(v) => setEdit({ ...edit, orden: Number(v) || 0 })} type="number" />
          </div>
          <div className="mt-3">
            <Sw label="Activo" value={edit.activo !== false} onChange={(v) => setEdit({ ...edit, activo: v })} />
          </div>
          {err && <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2 mt-2">{err}</p>}
        </ModalForm>
      )}
    </div>
  );
}

// ─── Mini UI helpers (autocontenidos) ────────────────────────
function F({ label, value, onChange, type = 'text', placeholder = '', disabled = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none resize-none" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none disabled:opacity-50" />
      )}
    </div>
  );
}

function Sw({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`flex items-center gap-2 text-xs transition select-none ${value ? 'text-yellow-400' : 'text-gray-500'}`}>
      <span className={`w-9 h-5 rounded-full relative transition ${value ? 'bg-yellow-500/40' : 'bg-slate-700'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? 'left-4' : 'left-0.5'}`} />
      </span>
      {label}
    </button>
  );
}

function ModalForm({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-yellow-600/30 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-bold text-sm">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-white/5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg">Cancelar</button>
          <button onClick={onSave} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg">
            <Save size={14} /> Guardar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
