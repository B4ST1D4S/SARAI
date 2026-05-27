/**
 * AdminPage.tsx
 * Módulo:    Parametrización del Sistema
 * Submódulo: Administración Consulta Externa
 *            → Especialidades | Tipos de Consulta | Departamentos | Cargos
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Plus, Edit2, Trash2, Save, X, Upload,
  Download, ChevronRight, Activity, Building2, Layers,
  DollarSign, ToggleLeft, ToggleRight, Search, CheckCircle,
  AlertTriangle, ChevronDown, FolderOpen, LayoutGrid, BookOpen, GitBranch,
  ClipboardList, Eye, EyeOff, Star, RotateCcw,
  FileText, List, SlidersHorizontal, Stethoscope, Calendar, MessageSquare, Palette,
} from 'lucide-react';
import * as svc from '../services/adminService';
import { useTheme, ThemeId } from '../hooks/useTheme';

// ─── CSV helpers ──────────────────────────────────────────────
function csvToObjects(text: string): any[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj: any = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
}

function downloadTemplate(headers: string[], filename: string) {
  const blob = new Blob([headers.join(',') + '\n'], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Base components ───────────────────────────────────────────
function Sw({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition select-none">
      {value
        ? <ToggleRight size={20} className="text-yellow-400" />
        : <ToggleLeft  size={20} className="text-gray-500" />}
      {label}
    </button>
  );
}

function Modal({ title, onClose, children, maxW = 'max-w-xl' }:
  { title: string; onClose: () => void; children: React.ReactNode; maxW?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={`bg-slate-900 border border-yellow-600/30 rounded-2xl shadow-2xl w-full ${maxW} max-h-[92vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
          <h3 className="text-white font-bold text-sm">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </motion.div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false, placeholder = '', step }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string; step?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {type === 'textarea'
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none resize-none" />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} required={required} step={step}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none" />
      }
    </div>
  );
}

function Sel({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <div className="rounded-xl border border-white/5 overflow-hidden animate-pulse">
      <div className="bg-slate-800/70 flex gap-3 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-2.5 bg-slate-600 rounded flex-1" />
        ))}
        <div className="h-2.5 bg-slate-600 rounded w-14 shrink-0" />
      </div>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="flex gap-3 items-center px-4 py-4 border-t border-white/5">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-2.5 bg-slate-800/80 rounded flex-1" style={{ maxWidth: `${80 + j * 25}px` }} />
          ))}
          <div className="h-2.5 bg-slate-800/80 rounded w-10 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function Table({ items, cols, onEdit, onDelete, loading = false }: {
  items: any[];
  cols: { key: string; label: string; render?: (r: any) => React.ReactNode }[];
  onEdit: (r: any) => void;
  onDelete: (r: any) => void;
  loading?: boolean;
}) {
  if (loading && !items.length)
    return <TableSkeleton cols={cols.length} />;
  if (!items.length)
    return (
      <p className="text-center text-gray-500 py-14 text-sm">
        Sin registros. Agrega uno nuevo o usa <span className="text-yellow-500">Cargue Masivo</span>.
      </p>
    );
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-800/70">
            {cols.map(c => (
              <th key={c.key} className="text-left px-4 py-3 font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{c.label}</th>
            ))}
            <th className="px-4 py-3 text-right font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.map((row, i) => (
            <tr key={row.id || i} className="hover:bg-slate-800/30 transition">
              {cols.map(c => (
                <td key={c.key} className="px-4 py-3 text-gray-300">
                  {c.render ? c.render(row) : (row[c.key] ?? '—')}
                </td>
              ))}
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => onEdit(row)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => onDelete(row)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition">
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EBadge(v: boolean) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium
      ${v ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
      {v ? 'Activo' : 'Inactivo'}
    </span>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{msg}</p>;
}

function ErrBanner({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">
      <span className="flex-1">⚠ {msg}</span>
      <button onClick={onRetry} className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 transition text-red-200">
        Reintentar
      </button>
    </div>
  );
}

function FormFooter({ onCancel, onSave, saving = false }: {
  onCancel: () => void; onSave: () => void; saving?: boolean;
}) {
  return (
    <div className="flex justify-end gap-3 pt-3 border-t border-white/5 mt-4">
      <button onClick={onCancel} disabled={saving}
        className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition disabled:opacity-40 disabled:pointer-events-none">
        Cancelar
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none">
        {saving
          ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando…</>
          : <><Save size={14} /> Guardar</>}
      </button>
    </div>
  );
}

// ─── Bulk modal ────────────────────────────────────────────────
function BulkModal({ title, headers, filename, onUpload, onClose }: {
  title: string; headers: string[]; filename: string;
  onUpload: (items: any[]) => Promise<any>; onClose: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [state,   setState]   = useState<'idle'|'loading'|'done'|'error'>('idle');
  const [result,  setResult]  = useState<any>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPreview(csvToObjects(ev.target?.result as string).slice(0, 5));
    reader.readAsText(file, 'utf-8');
  };

  const send = async () => {
    const file = ref.current?.files?.[0]; if (!file) return;
    setState('loading');
    try {
      const res = await onUpload(csvToObjects(await file.text()));
      setResult(res); setState('done');
    } catch(err: any) { setResult({ error: err.message }); setState('error'); }
  };

  return (
    <Modal title={title} onClose={onClose} maxW="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div>
            <p className="text-xs font-semibold text-blue-300">1. Descarga la plantilla CSV</p>
            <p className="text-[11px] text-blue-400/70">Columnas: {headers.join(', ')}</p>
          </div>
          <button onClick={() => downloadTemplate(headers, filename)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs rounded-lg border border-blue-500/30 transition">
            <Download size={13} /> Plantilla
          </button>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-300 mb-2">2. Sube el archivo CSV completado</p>
          <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-slate-600 hover:border-yellow-600/50 rounded-xl cursor-pointer transition">
            <Upload size={24} className="text-gray-500" />
            <span className="text-xs text-gray-400">Haz clic o arrastra tu archivo CSV aquí</span>
            <input ref={ref} type="file" accept=".csv" className="hidden" onChange={onFile} />
          </label>
        </div>

        {preview.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Vista previa (primeras {preview.length} filas):</p>
            <div className="overflow-x-auto rounded-lg border border-white/5">
              <table className="w-full text-[10px]">
                <thead><tr className="bg-slate-800">
                  {Object.keys(preview[0]).map(k => <th key={k} className="px-2 py-1 text-gray-400 text-left">{k}</th>)}
                </tr></thead>
                <tbody>{preview.map((r, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {Object.values(r).map((v: any, j) => <td key={j} className="px-2 py-1 text-gray-300">{v}</td>)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {state === 'done' && result && (
          <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-emerald-300">
              <p className="font-semibold">¡Cargue completado!</p>
              <p>Creados: {result.created} · Omitidos (ya existen): {result.skipped}</p>
              {result.errors?.length > 0 && <p className="text-yellow-400 mt-1">Errores: {result.errors.length}</p>}
            </div>
          </div>
        )}
        {state === 'error' && result && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-300">{result.error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition">
            {state === 'done' ? 'Cerrar' : 'Cancelar'}
          </button>
          {state !== 'done' && (
            <button onClick={send} disabled={state === 'loading'}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition">
              {state === 'loading' ? 'Procesando...' : <><Upload size={14} /> Importar</>}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function SecHeader({ title, onNew, onBulk }: { title: string; onNew: () => void; onBulk?: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <h2 className="text-sm font-bold text-white">{title}</h2>
      <div className="flex gap-2">
        {onBulk && (
          <button onClick={onBulk}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg text-xs font-semibold border border-white/10 transition">
            <Upload size={13} /> Cargue Masivo
          </button>
        )}
        <button onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-xs font-semibold transition">
          <Plus size={13} /> Nuevo
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// TAB: ESPECIALIDADES
// ════════════════════════════════════════════════
function TabEspecialidades() {
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [modal,   setModal]   = useState<null|'create'|'edit'|'bulk'>(null);
  const [form,    setForm]    = useState<any>({});
  const [err,     setErr]     = useState('');
  const [saving,  setSaving]  = useState(false);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setLoadErr('');
    try { setItems(await svc.getEspecialidades() as any[]); }
    catch(e: any) { setLoadErr(e?.message || 'Error al cargar'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const blank = () => ({
    codigo:'', nombre:'', descripcion:'',
    aplicaAnestesia:false, aplicaPediatria:false, aplicaCirugia:false,
    aplicaInstrumentacion:false, aplicaMedicoFamiliar:false,
  });

  const openCreate = () => { setForm(blank()); setErr(''); setModal('create'); };
  const openEdit   = (r: any) => { setForm({...r}); setErr(''); setModal('edit'); };

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setErr('');
    try {
      if (modal === 'create') await svc.createEspecialidad(form);
      else await svc.updateEspecialidad(form.id, form);
      setModal(null); load();
    } catch(e: any) { setErr(e.message); }
    finally { savingRef.current = false; setSaving(false); }
  };

  const del = async (r: any) => {
    if (!confirm(`¿Desactivar "${r.nombre}"?`)) return;
    try { await svc.deleteEspecialidad(r.id); load(); } catch(e: any) { alert(e.message); }
  };

  const f = (k: string) => (v: any) => setForm((p: any) => ({...p, [k]: v}));

  return (
    <>
      <SecHeader title="Especialidades Médicas" onNew={openCreate} onBulk={() => setModal('bulk')} />
      {loadErr && <ErrBanner msg={loadErr} onRetry={load} />}
      <Table items={items} loading={loading}
        cols={[
          { key:'codigo', label:'Código' },
          { key:'nombre', label:'Nombre' },
          { key:'descripcion', label:'Descripción' },
          { key:'aplicaCirugia', label:'Cirugía', render: r => r.aplicaCirugia ? <span className="text-yellow-400">✓</span> : <span className="text-gray-600">—</span> },
          { key:'aplicaAnestesia', label:'Anestesia', render: r => r.aplicaAnestesia ? <span className="text-yellow-400">✓</span> : <span className="text-gray-600">—</span> },
          { key:'estado', label:'Estado', render: r => EBadge(r.estado) },
        ]}
        onEdit={openEdit} onDelete={del}
      />

      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <Modal title={modal === 'create' ? 'Nueva Especialidad' : 'Editar Especialidad'} onClose={() => setModal(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Código" value={form.codigo||''} onChange={f('codigo')} required placeholder="Ej: ESP-001" />
                <Field label="Nombre" value={form.nombre||''} onChange={f('nombre')} required placeholder="Ej: Cirugía Plástica" />
              </div>
              <Field label="Descripción" value={form.descripcion||''} onChange={f('descripcion')} type="textarea" />
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Características clínicas</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Sw value={!!form.aplicaAnestesia}       onChange={f('aplicaAnestesia')}       label="Aplica Anestesia" />
                <Sw value={!!form.aplicaPediatria}       onChange={f('aplicaPediatria')}       label="Aplica Pediatría" />
                <Sw value={!!form.aplicaCirugia}         onChange={f('aplicaCirugia')}         label="Aplica Cirugía" />
                <Sw value={!!form.aplicaInstrumentacion} onChange={f('aplicaInstrumentacion')} label="Instrumentación" />
                <Sw value={!!form.aplicaMedicoFamiliar}  onChange={f('aplicaMedicoFamiliar')}  label="Médico Familiar" />
                {modal === 'edit' && <Sw value={!!form.estado} onChange={f('estado')} label="Activo" />}
              </div>
              {err && <ErrBox msg={err} />}
              <FormFooter onCancel={() => setModal(null)} onSave={save} saving={saving} />
            </div>
          </Modal>
        )}
        {modal === 'bulk' && (
          <BulkModal
            title="Cargue Masivo – Especialidades"
            headers={['codigo','nombre','descripcion','aplicaAnestesia','aplicaPediatria','aplicaCirugia','aplicaInstrumentacion','aplicaMedicoFamiliar']}
            filename="plantilla_especialidades.csv"
            onUpload={items => svc.bulkEspecialidades(items)}
            onClose={() => { setModal(null); load(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════
// TAB: TIPOS DE CONSULTA
// ════════════════════════════════════════════════
const CLASIFS = [
  {value:'CONSULTA',label:'Consulta'},{value:'PROCEDIMIENTO',label:'Procedimiento'},
  {value:'CIRUGIA',label:'Cirugía'},{value:'CONTROL',label:'Control'},
];

function TabTiposConsulta() {
  const [items,    setItems]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [loadErr,  setLoadErr]  = useState('');
  const [esps,     setEsps]     = useState<any[]>([]);
  const [deps,     setDeps]     = useState<any[]>([]);
  const [modal,    setModal]    = useState<null|'create'|'edit'|'bulk'>(null);
  const [wiz,      setWiz]      = useState(0);
  const [form,     setForm]     = useState<any>({});
  const [err,      setErr]      = useState('');
  const [saving,   setSaving]   = useState(false);
  const savingRef  = useRef(false);

  // ─── Servicios asociados al tipo en edición ───
  const [svcs,       setSvcs]       = useState<any[]>([]);
  const [svcsLoading,setSvcsLoading]= useState(false);
  const [svcResults,   setSvcResults]   = useState<any[]>([]);
  const [svcSearching, setSvcSearching] = useState(false);
  const [svcSearch,    setSvcSearch]    = useState('');
  const [tableSearch,  setTableSearch]  = useState('');
  const [addSvcId,   setAddSvcId]   = useState('');
  const [addPrincipal, setAddPrincipal] = useState(false);
  const [addingServ, setAddingServ] = useState(false);
  const [svcErr,     setSvcErr]     = useState('');

  const load = useCallback(async () => {
    setLoading(true); setLoadErr('');
    try {
      const [tc, e, d] = await Promise.all([svc.getTiposConsulta(), svc.getEspecialidades(), svc.getDepartamentos()]);
      setItems(tc as any[]); setEsps(e as any[]); setDeps(d as any[]);
    } catch(ex: any) { setLoadErr(ex?.message || 'Error al cargar'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const loadSvcs = useCallback(async (tcId: string) => {
    setSvcsLoading(true); setSvcErr('');
    try { setSvcs(await svc.getServiciosDeConsulta(tcId) as any[]); }
    catch(e: any) { setSvcErr(e?.message || 'Error al cargar servicios'); }
    finally { setSvcsLoading(false); }
  }, []);

  const blank = () => ({
    nombre:'', descripcion:'', especialidadId:'', departamentoId:'',
    clasificacion:'CONSULTA', duracionMinutos:30,
    requiereCaja:false, manejaAnestesia:false, permiteAgendamiento:true,
    controlaTiempoCita:false, abreHistoriaClinica:true, permiteCargosAdicionales:false,
    esProgramaPYP:false, manejaProtocolos:false, esPsicologia:false,
  });

  const openCreate = () => { setForm(blank()); setErr(''); setWiz(0); setSvcs([]); setModal('create'); };
  const openEdit   = (r: any) => {
    const { especialidad, departamento, hcModulo, serviciosConfig, preparaciones, ...rest } = r;
    setForm({ ...rest, especialidadId: r.especialidadId || '', departamentoId: r.departamentoId || '', hcModuloId: r.hcModuloId || '' });
    setErr(''); setWiz(0); setSvcs([]); setAddSvcId(''); setSvcSearch(''); setSvcErr(''); setSvcResults([]);
    setModal('edit');
    loadSvcs(r.id);
  };

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setErr('');
    try {
      if (modal === 'create') await svc.createTipoConsulta(form);
      else await svc.updateTipoConsulta(form.id, form);
      setModal(null); load();
    } catch(e: any) { setErr(e.message); }
    finally { savingRef.current = false; setSaving(false); }
  };

  const del = async (r: any) => {
    if (!confirm(`¿Desactivar "${r.nombre}"?`)) return;
    try { await svc.deleteTipoConsulta(r.id); load(); } catch(e: any) { alert(e.message); }
  };

  const addServicio = async () => {
    if (!addSvcId) return;
    setAddingServ(true); setSvcErr('');
    try {
      await svc.addServicioAConsulta(form.id, { servicioId: addSvcId, esPrincipal: addPrincipal, generaAutomatico: true, requiereOrden: false });
      setAddSvcId(''); setAddPrincipal(false); setSvcSearch('');
      await loadSvcs(form.id);
    } catch(e: any) { setSvcErr(e?.message || 'Error al agregar'); }
    finally { setAddingServ(false); }
  };

  const removeServicio = async (confId: string) => {
    if (!confirm('¿Quitar este servicio del tipo de consulta?')) return;
    setSvcErr('');
    try { await svc.removeServicioDeConsulta(confId); await loadSvcs(form.id); }
    catch(e: any) { setSvcErr(e?.message || 'Error al quitar'); }
  };

  const f = (k: string) => (v: any) => setForm((p: any) => ({...p, [k]: v}));
  const TABS = ['General', 'Clínica', 'Servicios'];

  useEffect(() => {
    if (!svcSearch || svcSearch.length < 2 || addSvcId) { setSvcResults([]); setSvcSearching(false); return; }
    setSvcSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await svc.getServicios(`search=${encodeURIComponent(svcSearch)}`);
        const already = new Set(svcs.map((x: any) => x.servicioId));
        setSvcResults((data as any[]).filter((s: any) => !already.has(s.id)));
      } catch { setSvcResults([]); }
      finally { setSvcSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [svcSearch, svcs, addSvcId]);

  return (
    <>
      <SecHeader title="Tipos de Consulta" onNew={openCreate} onBulk={() => setModal('bulk')} />
      {loadErr && <ErrBanner msg={loadErr} onRetry={load} />}
      <div className="relative mb-4 max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={tableSearch} onChange={e => setTableSearch(e.target.value)}
          placeholder="Buscar por nombre, especialidad o clasificación…"
          className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:border-yellow-500 focus:outline-none" />
      </div>
      <Table items={tableSearch ? items.filter(i =>
        i.nombre?.toLowerCase().includes(tableSearch.toLowerCase()) ||
        i.especialidad?.nombre?.toLowerCase().includes(tableSearch.toLowerCase()) ||
        i.clasificacion?.toLowerCase().includes(tableSearch.toLowerCase())
      ) : items} loading={loading}
        cols={[
          { key:'nombre', label:'Nombre' },
          { key:'clasificacion', label:'Clasificación', render: r => <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300">{r.clasificacion}</span> },
          { key:'especialidad', label:'Especialidad', render: r => r.especialidad?.nombre || '—' },
          { key:'departamento', label:'Departamento', render: r => r.departamento?.nombre || '—' },
          { key:'duracionMinutos', label:'Duración', render: r => `${r.duracionMinutos} min` },
          { key:'abreHistoriaClinica', label:'HC', render: r => r.abreHistoriaClinica ? <span className="text-yellow-400">✓</span> : <span className="text-gray-600">—</span> },
          { key:'estado', label:'Estado', render: r => EBadge(r.estado ?? true) },
        ]}
        onEdit={openEdit} onDelete={del}
      />

      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <Modal title={modal === 'create' ? 'Nuevo Tipo de Consulta' : 'Editar Tipo de Consulta'} onClose={() => setModal(null)} maxW="max-w-2xl">
            {/* Wizard tabs */}
            <div className="flex gap-1 mb-5 bg-slate-800/60 rounded-xl p-1">
              {TABS.map((t, i) => (
                <button key={t} onClick={() => setWiz(i)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${wiz === i ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* General */}
            {wiz === 0 && (
              <div className="space-y-4">
                <Field label="Nombre" value={form.nombre||''} onChange={f('nombre')} required />
                <Field label="Descripción" value={form.descripcion||''} onChange={f('descripcion')} type="textarea" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Sel label="Clasificación" value={form.clasificacion||'CONSULTA'} onChange={f('clasificacion')} options={CLASIFS} />
                  <Sel label="Especialidad" value={form.especialidadId||''} onChange={f('especialidadId')}
                    options={[{value:'',label:'— Sin asignar —'}, ...esps.map((e:any) => ({value:e.id, label:e.nombre}))]} />
                  <Sel label="Departamento" value={form.departamentoId||''} onChange={f('departamentoId')}
                    options={[{value:'',label:'— Sin asignar —'}, ...deps.map((d:any) => ({value:d.id, label:d.nombre}))]} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Duración (min)" value={String(form.duracionMinutos||30)} onChange={v => f('duracionMinutos')(Number(v))} type="number" />
                  <Field label="Bodega / Almacén ID (opcional)" value={form.bodegaId||''} onChange={f('bodegaId')} placeholder="Ej: BOD-001" />
                </div>
              </div>
            )}

            {/* Clínica */}
            {wiz === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Sw value={!!form.requiereCaja}             onChange={f('requiereCaja')}             label="Requiere Caja" />
                <Sw value={!!form.manejaAnestesia}          onChange={f('manejaAnestesia')}          label="Maneja Anestesia" />
                <Sw value={!!form.permiteAgendamiento}      onChange={f('permiteAgendamiento')}      label="Permite Agendamiento" />
                <Sw value={!!form.controlaTiempoCita}       onChange={f('controlaTiempoCita')}       label="Controla Tiempo Cita" />
                <Sw value={!!form.abreHistoriaClinica}      onChange={f('abreHistoriaClinica')}      label="Abre Historia Clínica" />
                <Sw value={!!form.permiteCargosAdicionales} onChange={f('permiteCargosAdicionales')} label="Cargos Adicionales" />
                <Sw value={!!form.esProgramaPYP}            onChange={f('esProgramaPYP')}            label="Programa PyP" />
                <Sw value={!!form.manejaProtocolos}         onChange={f('manejaProtocolos')}         label="Maneja Protocolos" />
                <Sw value={!!form.esPsicologia}             onChange={f('esPsicologia')}             label="Es Psicología" />
                {modal === 'edit' && <Sw value={!!form.estado} onChange={f('estado')} label="Activo" />}
              </div>
            )}

            {/* Servicios CUPS */}
            {wiz === 2 && (
              <div className="space-y-4">
                {modal === 'edit' ? (
                  <>
                    {/* Lista de servicios asociados */}
                    {svcsLoading ? (
                      <div className="flex items-center gap-2 text-xs text-gray-400 py-4"><span className="w-4 h-4 border-2 border-gray-500 border-t-yellow-400 rounded-full animate-spin" /> Cargando servicios…</div>
                    ) : svcs.length === 0 ? (
                      <p className="text-xs text-gray-500 py-3">Sin servicios CUPS asociados.</p>
                    ) : (
                      <div className="space-y-2">
                        {svcs.map((c: any) => (
                          <div key={c.id} className="flex items-center justify-between bg-slate-800/60 border border-white/5 rounded-xl px-3 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-mono bg-yellow-600/20 text-yellow-300 px-1.5 py-0.5 rounded shrink-0">{c.servicio?.codigoCups}</span>
                              <span className="text-xs text-gray-200 truncate">{c.servicio?.nombre}</span>
                              {c.esPrincipal && <span className="shrink-0 text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">Principal</span>}
                            </div>
                            <button onClick={() => removeServicio(c.id)} className="ml-2 shrink-0 text-gray-600 hover:text-red-400 transition"><Trash2 size={13} /></button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Agregar servicio */}
                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Agregar servicio CUPS</p>
                      <input
                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                        placeholder="Buscar por código CUPS o descripción…"
                        value={svcSearch}
                        onChange={e => { setSvcSearch(e.target.value); setAddSvcId(''); }}
                      />
                      {!svcSearch && !addSvcId && (
                        <p className="text-[10px] text-gray-600">Escribe 2+ caracteres para buscar servicios CUPS</p>
                      )}
                      {svcSearch && svcSearch.length >= 2 && !addSvcId && (
                        <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-900/60 rounded-xl border border-white/5 p-1">
                          {svcSearching ? (
                            <div className="flex items-center gap-2 text-xs text-gray-400 px-3 py-2">
                              <span className="w-3 h-3 border-2 border-gray-500 border-t-yellow-400 rounded-full animate-spin" /> Buscando…
                            </div>
                          ) : svcResults.length > 0 ? (
                            svcResults.slice(0, 20).map((s: any) => (
                              <button key={s.id} onClick={() => { setAddSvcId(s.id); setSvcSearch(`[${s.codigoCups}] ${s.nombre}`); }}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs transition hover:bg-white/5 text-gray-300">
                                <span className="font-mono text-yellow-400 mr-2">{s.codigoCups}</span>{s.nombre}
                              </button>
                            ))
                          ) : (
                            <div className="text-xs text-gray-500 px-3 py-2">Sin resultados para "{svcSearch}"</div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400">
                          <input type="checkbox" className="accent-yellow-500" checked={addPrincipal} onChange={e => setAddPrincipal(e.target.checked)} />
                          Servicio principal
                        </label>
                        <button
                          onClick={addServicio}
                          disabled={!addSvcId || addingServ}
                          className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded-lg transition"
                        >
                          {addingServ ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={12} />}
                          Asociar
                        </button>
                      </div>
                    </div>
                    {svcErr && <ErrBox msg={svcErr} />}
                  </>
                ) : (
                  <p className="text-xs text-gray-500 py-3">Guarda el tipo de consulta primero para poder asociar servicios CUPS.</p>
                )}
              </div>
            )}

            {err && <ErrBox msg={err} />}

            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
              <div>{wiz > 0 && <button onClick={() => setWiz(w => w - 1)} className="px-3 py-2 text-xs text-gray-400 border border-white/10 rounded-lg hover:text-white transition">← Anterior</button>}</div>
              <div className="flex gap-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg transition">Cancelar</button>
                {wiz < TABS.length - 1
                  ? <button onClick={() => setWiz(w => w + 1)} className="flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition">Siguiente <ChevronRight size={13} /></button>
                  : wiz === 2
                    ? <button onClick={() => setModal(null)} className="px-4 py-2 text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg transition">Cerrar</button>
                    : <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none">{saving ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando…</> : <><Save size={13} /> Guardar</>}</button>
                }
              </div>
            </div>
          </Modal>
        )}
        {modal === 'bulk' && (
          <BulkModal
            title="Cargue Masivo – Tipos de Consulta"
            headers={['nombre','descripcion','clasificacion','duracionMinutos','especialidadId','departamentoId']}
            filename="plantilla_tipos_consulta.csv"
            onUpload={items => svc.bulkTiposConsulta(items)}
            onClose={() => { setModal(null); load(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════
// TAB: DEPARTAMENTOS
// ════════════════════════════════════════════════
function TabDepartamentos() {
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [modal,   setModal]   = useState<null|'create'|'edit'|'bulk'>(null);
  const [form,    setForm]    = useState<any>({});
  const [err,     setErr]     = useState('');
  const [saving,  setSaving]  = useState(false);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setLoadErr('');
    try { setItems(await svc.getDepartamentos() as any[]); }
    catch(e: any) { setLoadErr(e?.message || 'Error al cargar'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({codigo:'',nombre:'',descripcion:''}); setErr(''); setModal('create'); };
  const openEdit   = (r: any) => { setForm({...r}); setErr(''); setModal('edit'); };

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setErr('');
    try {
      if (modal === 'create') await svc.createDepartamento(form);
      else await svc.updateDepartamento(form.id, form);
      setModal(null); load();
    } catch(e: any) { setErr(e.message); }
    finally { savingRef.current = false; setSaving(false); }
  };

  const del = async (r: any) => {
    if (!confirm(`¿Desactivar "${r.nombre}"?`)) return;
    try { await svc.deleteDepartamento(r.id); load(); } catch(e: any) { alert(e.message); }
  };

  const f = (k: string) => (v: any) => setForm((p: any) => ({...p, [k]: v}));

  return (
    <>
      <SecHeader title="Departamentos" onNew={openCreate} onBulk={() => setModal('bulk')} />
      {loadErr && <ErrBanner msg={loadErr} onRetry={load} />}
      <Table items={items} loading={loading}
        cols={[
          { key:'codigo', label:'Código' },
          { key:'nombre', label:'Nombre' },
          { key:'descripcion', label:'Descripción' },
          { key:'estado', label:'Estado', render: r => EBadge(r.estado) },
        ]}
        onEdit={openEdit} onDelete={del}
      />

      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <Modal title={modal === 'create' ? 'Nuevo Departamento' : 'Editar Departamento'} onClose={() => setModal(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Código" value={form.codigo||''} onChange={f('codigo')} required placeholder="Ej: DEP-001" />
                <Field label="Nombre" value={form.nombre||''} onChange={f('nombre')} required />
              </div>
              <Field label="Descripción" value={form.descripcion||''} onChange={f('descripcion')} type="textarea" />
              {modal === 'edit' && <Sw value={!!form.estado} onChange={f('estado')} label="Activo" />}
              {err && <ErrBox msg={err} />}
              <FormFooter onCancel={() => setModal(null)} onSave={save} saving={saving} />
            </div>
          </Modal>
        )}
        {modal === 'bulk' && (
          <BulkModal
            title="Cargue Masivo – Departamentos"
            headers={['codigo','nombre','descripcion']}
            filename="plantilla_departamentos.csv"
            onUpload={items => svc.bulkDepartamentos(items)}
            onClose={() => { setModal(null); load(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════
// TAB: CARGOS DE CONSULTA EXTERNA
// ════════════════════════════════════════════════
const TIPOS_CARGO = [
  {value:'CONSULTA',label:'Consulta'},
  {value:'PROCEDIMIENTO',label:'Procedimiento'},
  {value:'CIRUGIA',label:'Cirugía'},
  {value:'ADMINISTRATIVO',label:'Administrativo'},
  {value:'HONORARIO',label:'Honorario'},
  {value:'INSUMO',label:'Insumo'},
];

const UNIDADES = [
  {value:'',label:'— Sin unidad —'},
  {value:'unidad',label:'Unidad'},
  {value:'sesion',label:'Sesión'},
  {value:'hora',label:'Hora'},
  {value:'dia',label:'Día'},
  {value:'procedimiento',label:'Procedimiento'},
];

function TabCargos() {
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState<null|'create'|'edit'|'bulk'>(null);
  const [form,    setForm]    = useState<any>({});
  const [err,     setErr]     = useState('');
  const [saving,  setSaving]  = useState(false);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setLoadErr('');
    try {
      setItems(await svc.getCargos(search ? `search=${encodeURIComponent(search)}` : '') as any[]);
    } catch(e: any) { setLoadErr(e?.message || 'Error al cargar'); }
    finally { setLoading(false); }
  }, [search]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const blank = () => ({
    codigo:'', nombre:'', descripcion:'', tipo:'CONSULTA', valor:0,
    unidad:'', codigoReferencia:'', aplicaIva:false, tasaIva:0,
    esObligatorio:false, aplicaPYP:false,
  });

  const openCreate = () => { setForm(blank()); setErr(''); setModal('create'); };
  const openEdit   = (r: any) => { setForm({...r}); setErr(''); setModal('edit'); };

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setErr('');
    try {
      if (modal === 'create') await svc.createCargo(form);
      else await svc.updateCargo(form.id, form);
      setModal(null); load();
    } catch(e: any) { setErr(e.message); }
    finally { savingRef.current = false; setSaving(false); }
  };

  const del = async (r: any) => {
    if (!confirm(`¿Desactivar "${r.nombre}"?`)) return;
    try { await svc.deleteCargo(r.id); load(); } catch(e: any) { alert(e.message); }
  };

  const f = (k: string) => (v: any) => setForm((p: any) => ({...p, [k]: v}));
  const fmt = (n: number) => new Intl.NumberFormat('es-CO', {style:'currency',currency:'COP',maximumFractionDigits:0}).format(n);

  return (
    <>
      <SecHeader title="Cargos de Consulta Externa" onNew={openCreate} onBulk={() => setModal('bulk')} />

      <div className="relative mb-4 max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código o nombre..."
          className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:border-yellow-500 focus:outline-none" />
      </div>
      {loadErr && <ErrBanner msg={loadErr} onRetry={load} />}

      <Table items={items} loading={loading}
        cols={[
          { key:'codigo', label:'Código' },
          { key:'nombre', label:'Nombre' },
          { key:'tipo', label:'Tipo', render: r => <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300">{r.tipo}</span> },
          { key:'valor', label:'Valor', render: r => fmt(r.valor) },
          { key:'unidad', label:'Unidad', render: r => r.unidad || '—' },
          { key:'codigoReferencia', label:'Ref. CUPS', render: r => r.codigoReferencia || '—' },
          { key:'flags', label:'Flags', render: r => (
            <div className="flex gap-1 flex-wrap">
              {r.aplicaIva     && <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/20 text-blue-300">IVA</span>}
              {r.esObligatorio && <span className="px-1.5 py-0.5 rounded text-[9px] bg-orange-500/20 text-orange-300">Obligatorio</span>}
              {r.aplicaPYP     && <span className="px-1.5 py-0.5 rounded text-[9px] bg-teal-500/20 text-teal-300">PyP</span>}
            </div>
          )},
          { key:'estado', label:'Estado', render: r => EBadge(r.estado) },
        ]}
        onEdit={openEdit} onDelete={del}
      />

      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <Modal title={modal === 'create' ? 'Nuevo Cargo' : 'Editar Cargo'} onClose={() => setModal(null)} maxW="max-w-2xl">
            <div className="space-y-4">
              {/* Identificación */}
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Identificación</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Código" value={form.codigo||''} onChange={f('codigo')} required placeholder="Ej: CAR-001" />
                <Field label="Nombre del Cargo" value={form.nombre||''} onChange={f('nombre')} required />
              </div>
              <Field label="Descripción" value={form.descripcion||''} onChange={f('descripcion')} type="textarea" placeholder="Descripción detallada del cargo..." />

              {/* Clasificación */}
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider pt-1">Clasificación y Valor</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Sel label="Tipo de Cargo" value={form.tipo||'CONSULTA'} onChange={f('tipo')} options={TIPOS_CARGO} />
                <Field label="Valor Base (COP)" value={String(form.valor||0)} onChange={v => f('valor')(Number(v))} type="number" />
                <Sel label="Unidad de Medida" value={form.unidad||''} onChange={f('unidad')} options={UNIDADES} />
                <Field label="Código Referencia (CUPS/interno)" value={form.codigoReferencia||''} onChange={f('codigoReferencia')} placeholder="Ej: 890201" />
              </div>

              {/* IVA */}
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider pt-1">Configuración Tributaria y Reglas</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col gap-3">
                  <Sw value={!!form.aplicaIva}      onChange={f('aplicaIva')}      label="Aplica IVA" />
                  <Sw value={!!form.esObligatorio}  onChange={f('esObligatorio')}  label="Es Obligatorio" />
                  <Sw value={!!form.aplicaPYP}      onChange={f('aplicaPYP')}      label="Aplica PyP" />
                  {modal === 'edit' && <Sw value={!!form.estado} onChange={f('estado')} label="Activo" />}
                </div>
                {!!form.aplicaIva && (
                  <Field label="Tasa IVA (%)" value={String(form.tasaIva||0)} onChange={v => f('tasaIva')(Number(v))} type="number" step="0.01" placeholder="Ej: 19" />
                )}
              </div>

              {err && <ErrBox msg={err} />}
              <FormFooter onCancel={() => setModal(null)} onSave={save} saving={saving} />
            </div>
          </Modal>
        )}
        {modal === 'bulk' && (
          <BulkModal
            title="Cargue Masivo – Cargos"
            headers={['codigo','nombre','descripcion','tipo','valor','unidad','codigoReferencia','aplicaIva','tasaIva','esObligatorio','aplicaPYP']}
            filename="plantilla_cargos.csv"
            onUpload={items => svc.bulkCargos(items)}
            onClose={() => { setModal(null); load(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════
// TAB: TIPOS DE CONSULTORIO
// ════════════════════════════════════════════════
function TabTiposConsultorio() {
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [modal,   setModal]   = useState<null|'create'|'edit'>(null);
  const [form,    setForm]    = useState<any>({});
  const [err,     setErr]     = useState('');
  const [saving,  setSaving]  = useState(false);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setLoadErr('');
    try { setItems(await svc.getTiposConsultorio() as any[]); }
    catch(e: any) { setLoadErr(e?.message || 'Error al cargar'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const blank = () => ({ codigo: '', tipoConsultorio: '', descripcion: '', indiceAutomatico: '' });
  const openCreate = () => { setForm(blank()); setErr(''); setModal('create'); };
  const openEdit   = (r: any) => {
    setForm({ ...r, indiceAutomatico: r.indiceAutomatico != null ? String(r.indiceAutomatico) : '' });
    setErr(''); setModal('edit');
  };

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setErr('');
    try {
      if (modal === 'create') await svc.createTipoConsultorio(form);
      else await svc.updateTipoConsultorio(form.id, form);
      setModal(null); load();
    } catch (e: any) { setErr(e.message); }
    finally { savingRef.current = false; setSaving(false); }
  };

  const del = async (r: any) => {
    if (!confirm(`¿Desactivar consultorio "${r.codigo}"?`)) return;
    try { await svc.deleteTipoConsultorio(r.id); load(); } catch (e: any) { alert(e.message); }
  };

  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <>
      <SecHeader title="Tipos de Consultorio" onNew={openCreate} />
      {loadErr && <ErrBanner msg={loadErr} onRetry={load} />}
      <Table items={items} loading={loading}
        cols={[
          { key: 'codigo',           label: 'Código' },
          { key: 'tipoConsultorio',  label: 'Tipo Consultorio' },
          { key: 'descripcion',      label: 'Descripción' },
          { key: 'indiceAutomatico', label: 'Índice Auto', render: r => r.indiceAutomatico ?? '—' },
          { key: 'estado',           label: 'Estado', render: r => EBadge(r.estado) },
        ]}
        onEdit={openEdit} onDelete={del}
      />
      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <Modal title={modal === 'create' ? 'Nuevo Tipo Consultorio' : 'Editar Tipo Consultorio'} onClose={() => setModal(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Código" value={form.codigo || ''} onChange={f('codigo')} required placeholder="Ej: C001" />
                <Field label="Tipo Consultorio" value={form.tipoConsultorio || ''} onChange={f('tipoConsultorio')} required placeholder="Ej: CONS" />
              </div>
              <Field label="Descripción" value={form.descripcion || ''} onChange={f('descripcion')} type="textarea" />
              <Field label="Índice Automático" value={String(form.indiceAutomatico ?? '')} onChange={f('indiceAutomatico')} type="number" placeholder="Ej: 1" />
              {modal === 'edit' && <Sw value={!!form.estado} onChange={f('estado')} label="Activo" />}
              {err && <ErrBox msg={err} />}
              <FormFooter onCancel={() => setModal(null)} onSave={save} saving={saving} />
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════
// TAB: DEPARTAMENTOS × CARGOS
// ════════════════════════════════════════════════
function TabDepartamentosCargos() {
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [cargos,        setCargos]        = useState<any[]>([]);
  const [selDep,        setSelDep]        = useState('');
  const [items,         setItems]         = useState<any[]>([]);
  const [modal,         setModal]         = useState<null|'create'|'edit'>(null);
  const [form,          setForm]          = useState<any>({});
  const [err,           setErr]           = useState('');
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    Promise.all([svc.getDepartamentos(), svc.getCargos()]).then(([d, c]) => {
      setDepartamentos(d as any[]); setCargos(c as any[]);
    });
  }, []);

  const loadItems = useCallback(async () => {
    if (!selDep) { setItems([]); return; }
    setLoading(true);
    try { setItems(await svc.getDepartamentoCargos(selDep) as any[]); }
    catch {} finally { setLoading(false); }
  }, [selDep]);
  useEffect(() => { loadItems(); }, [loadItems]);

  const blankForm = () => ({
    cargoId: '',
    permiteSeleccion: true,  manejaInsumos: false,
    cumplimientoAutomatico: false, tomadoAutomatico: false,
    interfaceExterno: false,  generaOrden: false,
    liquidaHonorarios: false, cumplimientoParcial: false, manejaCentroCosto: false,
  });

  const openCreate = () => { setForm(blankForm()); setErr(''); setModal('create'); };
  const openEdit   = (r: any) => {
    const { cargo, departamento, ...rest } = r;
    setForm({ ...rest }); setErr(''); setModal('edit');
  };

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setErr('');
    try {
      if (modal === 'create') await svc.createDepartamentoCargo(selDep, form);
      else await svc.updateDepartamentoCargo(form.id, form);
      setModal(null); loadItems();
    } catch (e: any) { setErr(e.message); }
    finally { savingRef.current = false; setSaving(false); }
  };

  const del = async (r: any) => {
    if (!confirm(`¿Eliminar asignación de "${r.cargo?.nombre}"?`)) return;
    try { await svc.deleteDepartamentoCargo(r.id); loadItems(); } catch (e: any) { alert(e.message); }
  };

  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const depNombre = departamentos.find(d => d.id === selDep)?.nombre || '';

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white">Cargos por Departamento</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Selecciona un departamento para gestionar sus cargos asignados</p>
        </div>
        {selDep && (
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-xs font-semibold transition">
            <Plus size={13} /> Asignar Cargo
          </button>
        )}
      </div>

      <div className="mb-5">
        <Sel label="Departamento" value={selDep} onChange={setSelDep}
          options={[{ value: '', label: '— Selecciona un departamento —' },
            ...departamentos.map(d => ({ value: d.id, label: `${d.codigo} – ${d.nombre}` }))]} />
      </div>

      {!selDep ? (
        <p className="text-center text-gray-500 py-14 text-sm">Selecciona un departamento para ver sus cargos.</p>
      ) : loading ? (
        <p className="text-center text-gray-500 py-10 text-sm">Cargando...</p>
      ) : (
        <>
          {depNombre && (
            <p className="text-xs text-yellow-400 font-semibold mb-3">
              Departamento: {depNombre} · <span className="text-gray-400">{items.length} cargo(s) asignado(s)</span>
            </p>
          )}
          <Table items={items}
            cols={[
              { key: 'cargo',           label: 'Cargo',       render: r => r.cargo?.nombre || '—' },
              { key: 'codigoCargo',     label: 'Código',      render: r => <span className="font-mono text-yellow-400/80">{r.cargo?.codigo || '—'}</span> },
              { key: 'tipo',            label: 'Tipo',        render: r => <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300">{r.cargo?.tipo || '—'}</span> },
              { key: 'permiteSeleccion',   label: 'Selección',  render: r => r.permiteSeleccion ? <span className="text-emerald-400">✓</span> : <span className="text-gray-600">—</span> },
              { key: 'generaOrden',        label: 'Crea Orden', render: r => r.generaOrden ? <span className="text-yellow-400">✓</span> : <span className="text-gray-600">—</span> },
              { key: 'liquidaHonorarios',  label: 'Honorarios', render: r => r.liquidaHonorarios ? <span className="text-blue-400">✓</span> : <span className="text-gray-600">—</span> },
              { key: 'manejaCentroCosto',  label: 'Cto. Costo', render: r => r.manejaCentroCosto ? <span className="text-teal-400">✓</span> : <span className="text-gray-600">—</span> },
            ]}
            onEdit={openEdit} onDelete={del}
          />
        </>
      )}

      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <Modal title={modal === 'create' ? 'Asignar Cargo al Departamento' : 'Editar Reglas del Cargo'} onClose={() => setModal(null)} maxW="max-w-2xl">
            <div className="space-y-4">
              {modal === 'create' ? (
                <Sel label="Cargo *" value={form.cargoId || ''} onChange={f('cargoId')}
                  options={[{ value: '', label: '— Selecciona un cargo —' },
                    ...cargos.map(c => ({ value: c.id, label: `${c.codigo} – ${c.nombre}` }))]} />
              ) : (
                <div className="p-3 bg-slate-800/60 rounded-xl border border-white/5 text-xs">
                  <span className="text-gray-400">Cargo: </span>
                  <span className="text-white font-semibold">{items.find(i => i.id === form.id)?.cargo?.nombre}</span>
                </div>
              )}
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Reglas Operativas</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Sw value={!!form.permiteSeleccion}       onChange={f('permiteSeleccion')}       label="Permite Selección" />
                <Sw value={!!form.manejaInsumos}          onChange={f('manejaInsumos')}          label="Maneja Insumos" />
                <Sw value={!!form.cumplimientoAutomatico} onChange={f('cumplimientoAutomatico')} label="Cumplido Automático" />
                <Sw value={!!form.tomadoAutomatico}       onChange={f('tomadoAutomatico')}       label="Tomado Automático" />
                <Sw value={!!form.interfaceExterno}       onChange={f('interfaceExterno')}       label="Interface Externo" />
                <Sw value={!!form.generaOrden}            onChange={f('generaOrden')}            label="Genera Orden" />
                <Sw value={!!form.liquidaHonorarios}      onChange={f('liquidaHonorarios')}      label="Liquida Honorarios" />
                <Sw value={!!form.cumplimientoParcial}    onChange={f('cumplimientoParcial')}    label="Cumplimiento Parcial" />
                <Sw value={!!form.manejaCentroCosto}      onChange={f('manejaCentroCosto')}      label="Centro de Costo" />
              </div>
              {err && <ErrBox msg={err} />}
              <FormFooter onCancel={() => setModal(null)} onSave={save} saving={saving} />
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════
// TAB: PREPARACIONES / RECOMENDACIONES MÉDICAS
// ════════════════════════════════════════════════
const TIPOS_PREP = [
  { value: 'consulta',      label: 'Consulta'      },
  { value: 'procedimiento', label: 'Procedimiento' },
  { value: 'cirugia',       label: 'Cirugía'       },
  { value: 'general',       label: 'General'       },
];

function TabPreparaciones() {
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [esps,    setEsps]    = useState<any[]>([]);
  const [tcs,     setTcs]     = useState<any[]>([]);
  const [modal,   setModal]   = useState<null|'create'|'edit'>(null);
  const [form,    setForm]    = useState<any>({});
  const [err,     setErr]     = useState('');
  const [search,  setSearch]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setLoadErr('');
    try {
      const [preps, e, tc] = await Promise.all([
        svc.getPreparaciones(),
        svc.getEspecialidades(),
        svc.getTiposConsulta(),
      ]);
      const all = preps as any[];
      const q = search.toLowerCase();
      const filtered = search
        ? all.filter(p =>
            p.nombre?.toLowerCase().includes(q) ||
            (p.tipoConsulta?.nombre || '').toLowerCase().includes(q) ||
            (p.especialidad?.nombre || '').toLowerCase().includes(q)
          )
        : all;
      setItems(filtered); setEsps(e as any[]); setTcs(tc as any[]);
    } catch(ex: any) { setLoadErr(ex?.message || 'Error al cargar'); }
    finally { setLoading(false); }
  }, [search]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const blank = () => ({ nombre: '', descripcion: '', tipo: 'consulta', especialidadId: '', tipoConsultaId: '' });
  const openCreate = () => { setForm(blank()); setErr(''); setModal('create'); };
  const openEdit   = (r: any) => {
    const { especialidad, tipoConsulta, ...rest } = r;
    setForm({ ...rest, especialidadId: r.especialidadId || '', tipoConsultaId: r.tipoConsultaId || '' });
    setErr(''); setModal('edit');
  };

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setErr('');
    try {
      if (modal === 'create') await svc.createPreparacion(form);
      else await svc.updatePreparacion(form.id, form);
      setModal(null); load();
    } catch (e: any) { setErr(e.message); }
    finally { savingRef.current = false; setSaving(false); }
  };

  const del = async (r: any) => {
    if (!confirm(`¿Desactivar preparación "${r.nombre}"?`)) return;
    try { await svc.deletePreparacion(r.id); load(); } catch (e: any) { alert(e.message); }
  };

  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <>
      <SecHeader title="Preparaciones / Recomendaciones Médicas" onNew={openCreate} />
      <div className="relative mb-4 max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre..."
          className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:border-yellow-500 focus:outline-none" />
      </div>
      {loadErr && <ErrBanner msg={loadErr} onRetry={load} />}
      <Table items={items} loading={loading}
        cols={[
          { key: 'nombre',       label: 'Nombre' },
          { key: 'tipo',         label: 'Tipo',         render: r => <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300">{r.tipo}</span> },
          { key: 'especialidad', label: 'Especialidad', render: r => r.especialidad?.nombre || '— Todas —' },
          { key: 'tipoConsulta', label: 'Tipo Consulta',render: r => r.tipoConsulta?.nombre || '— Todas —' },
          { key: 'descripcion',  label: 'Instrucciones',render: r => r.descripcion ? r.descripcion.slice(0, 60) + (r.descripcion.length > 60 ? '…' : '') : '—' },
          { key: 'estado',       label: 'Estado',       render: r => EBadge(r.estado) },
        ]}
        onEdit={openEdit} onDelete={del}
      />
      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <Modal title={modal === 'create' ? 'Nueva Preparación / Recomendación' : 'Editar Preparación'} onClose={() => setModal(null)} maxW="max-w-xl">
            <div className="space-y-4">
              <Field label="Nombre *" value={form.nombre || ''} onChange={f('nombre')} required placeholder="Ej: Ayuno 8 horas previo al procedimiento" />
              <Field label="Instrucciones detalladas" value={form.descripcion || ''} onChange={f('descripcion')} type="textarea" placeholder="Escriba las instrucciones completas para el paciente..." />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Sel label="Tipo" value={form.tipo || 'consulta'} onChange={f('tipo')} options={TIPOS_PREP} />
                <Sel label="Especialidad" value={form.especialidadId || ''} onChange={f('especialidadId')}
                  options={[{ value: '', label: '— Todas las especialidades —' }, ...esps.map(e => ({ value: e.id, label: e.nombre }))]} />
                <Sel label="Tipo de Consulta" value={form.tipoConsultaId || ''} onChange={f('tipoConsultaId')}
                  options={[{ value: '', label: '— Todos los tipos —' }, ...tcs.map(t => ({ value: t.id, label: t.nombre }))]} />
              </div>
              {modal === 'edit' && <Sw value={!!form.estado} onChange={f('estado')} label="Activo" />}
              {err && <ErrBox msg={err} />}
              <FormFooter onCancel={() => setModal(null)} onSave={save} saving={saving} />
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════
// TAB: CAMPOS DEL FORMULARIO DE PACIENTE
// ════════════════════════════════════════════════

const SECCIONES_PACIENTE: { value: string; label: string; emoji: string }[] = [
  { value: 'documentacion', label: 'Documentación',           emoji: '📋' },
  { value: 'personal',      label: 'Datos Personales',        emoji: '👤' },
  { value: 'contacto',      label: 'Contacto',                emoji: '📞' },
  { value: 'laboral',       label: 'Laboral',                 emoji: '💼' },
  { value: 'demografico',   label: 'Demográfico',             emoji: '🏥' },
  { value: 'consulta',      label: 'Consulta',                emoji: '📄' },
  { value: 'salud',         label: 'Salud',                   emoji: '❤️' },
  { value: 'notas',         label: 'Notas',                   emoji: '📝' },
];

const TIPOS_CAMPO = [
  { value: 'text',     label: 'Texto'        },
  { value: 'email',    label: 'Email'        },
  { value: 'tel',      label: 'Teléfono'     },
  { value: 'number',   label: 'Número'       },
  { value: 'date',     label: 'Fecha'        },
  { value: 'select',   label: 'Selección'    },
  { value: 'textarea', label: 'Área de texto'},
];

function TabCamposPaciente() {
  const [items,        setItems]        = useState<any[]>([]);
  const [pending,      setPending]      = useState<Record<string, { esVisible?: boolean; esObligatorio?: boolean }>>({});
  const [seccionFiltro,setSeccionFiltro]= useState('');
  const [search,       setSearch]       = useState('');
  const [modal,        setModal]        = useState<null|'create'|'edit'>(null);
  const [form,         setForm]         = useState<any>({});
  const [opcionesStr,  setOpcionesStr]  = useState('');
  const [err,          setErr]          = useState('');
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await svc.getCamposPaciente() as any[];
      setItems(data);
      setPending({});
    } catch { /* noop */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  // Valor efectivo combinando items + pending
  const getVal = (id: string, key: 'esVisible'|'esObligatorio', base: boolean) =>
    pending[id]?.[key] !== undefined ? pending[id][key]! : base;

  const toggleCell = (id: string, key: 'esVisible'|'esObligatorio', base: boolean) => {
    const current = getVal(id, key, base);
    setPending(prev => ({
      ...prev,
      [id]: { ...prev[id], [key]: !current },
    }));
  };

  // Marcar todo visible / desmarcar todo
  const toggleAllVisible = (val: boolean) => {
    const map: typeof pending = {};
    filtered.forEach(c => { map[c.id] = { ...pending[c.id], esVisible: val }; });
    setPending(prev => ({ ...prev, ...map }));
  };
  const toggleAllObligatorio = (val: boolean) => {
    const map: typeof pending = {};
    filtered.forEach(c => { map[c.id] = { ...pending[c.id], esObligatorio: val }; });
    setPending(prev => ({ ...prev, ...map }));
  };

  const hasPending = Object.keys(pending).length > 0;

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const [id, changes] of Object.entries(pending)) {
        await svc.updateCampoPaciente(id, changes);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      load();
    } catch { /* noop */ }
    setSaving(false);
  };

  const filtrados = items.filter(i => {
    const matchSec = !seccionFiltro || i.seccion === seccionFiltro;
    const matchQ   = !search ||
      i.etiqueta.toLowerCase().includes(search.toLowerCase()) ||
      i.nombre.toLowerCase().includes(search.toLowerCase());
    return matchSec && matchQ;
  });
  const filtered = filtrados;

  // numeros de fila globales
  const orderedAll = [...items].sort((a,b) => {
    const si = SECCIONES_PACIENTE.findIndex(s => s.value === a.seccion);
    const sj = SECCIONES_PACIENTE.findIndex(s => s.value === b.seccion);
    return si !== sj ? si - sj : a.orden - b.orden;
  });

  const openCreate = () => {
    setForm({ tipoCampo: 'text', seccion: 'personal', esObligatorio: false, esVisible: true });
    setOpcionesStr(''); setErr(''); setModal('create');
  };
  const openEdit = (row: any) => {
    setForm({ ...row });
    setOpcionesStr(row.opciones ? JSON.stringify(row.opciones, null, 2) : '');
    setErr(''); setModal('edit');
  };

  const save = async () => {
    setErr('');
    if (!form.nombre?.trim())   return setErr('El nombre interno es requerido');
    if (!form.etiqueta?.trim()) return setErr('La etiqueta es requerida');
    if (!form.seccion)          return setErr('La sección es requerida');
    if (modal === 'create' && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(form.nombre))
      return setErr('Nombre interno: solo letras/números/guiones, sin espacios');
    let opciones = null;
    if (form.tipoCampo === 'select' && opcionesStr.trim()) {
      try { opciones = JSON.parse(opcionesStr); }
      catch { return setErr('JSON de opciones inválido'); }
    }
    setSaving(true);
    try {
      if (modal === 'create') {
        await svc.createCampoPaciente({ ...form, opciones });
      } else {
        const { nombre: _n, esPersonalizado: _e, ...rest } = form;
        await svc.updateCampoPaciente(form.id, { ...rest, opciones });
      }
      setModal(null); load();
    } catch (e: any) { setErr(e.message || 'Error al guardar'); }
    setSaving(false);
  };

  const del = async (row: any) => {
    if (!row.esPersonalizado) return;
    if (!confirm(`¿Eliminar "${row.etiqueta}"?`)) return;
    try { await svc.deleteCampoPaciente(row.id); load(); } catch { /* noop */ }
  };

  const doReset = async () => {
    try { await svc.resetCamposPaciente(); load(); setConfirmReset(false); } catch { /* noop */ }
  };

  const totalVisible     = items.filter(i => getVal(i.id, 'esVisible', i.esVisible)).length;
  const totalObligatorio = items.filter(i => getVal(i.id, 'esObligatorio', i.esObligatorio)).length;

  // ── render ───────────────────────────────────
  return (
    <>
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar campo..." className="bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white focus:border-yellow-500 focus:outline-none w-44" />
          </div>
          <select value={seccionFiltro} onChange={e => setSeccionFiltro(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-yellow-500 focus:outline-none">
            <option value="">Todas las secciones</option>
            {SECCIONES_PACIENTE.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
          </select>
          {/* Contadores inline */}
          <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-white/5 text-[11px]">
            <span className="text-emerald-400 font-semibold">{totalVisible}</span>
            <span className="text-gray-500">visibles</span>
            <span className="text-yellow-400 font-semibold ml-2">{totalObligatorio}</span>
            <span className="text-gray-500">obligatorios</span>
          </div>
        </div>

        <div className="flex gap-2">
          {hasPending && (
            <button onClick={saveAll} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition">
              {saved ? <><CheckCircle size={12} /> Guardado</> : saving ? 'Guardando…' : <><Save size={12} /> Guardar ({Object.keys(pending).length})</>}
            </button>
          )}
          <button onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg text-xs font-semibold border border-white/10 transition">
            <RotateCcw size={12} /> Restaurar
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-xs font-semibold transition">
            <Plus size={12} /> Nuevo Campo
          </button>
        </div>
      </div>

      {/* ── Tabla principal ── */}
      {filtered.length === 0
        ? <p className="text-center text-gray-500 py-14 text-sm">Sin campos. Cargando…</p>
        : (
          <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/40">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 border-b border-slate-700">
                  <th className="px-3 py-3 text-center font-bold text-slate-400 uppercase tracking-wider w-10">#</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider">Campo</th>
                  <th className="px-3 py-3 text-center font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Sección</th>
                  <th className="px-3 py-3 text-center font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Tipo</th>
                  {/* VISIBLE header con checkbox para marcar/desmarcar todos */}
                  <th className="px-4 py-3 text-center w-24">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">Visible</span>
                      <div className="flex gap-1">
                        <button onClick={() => toggleAllVisible(true)}  title="Marcar todos visibles"
                          className="text-[9px] text-emerald-500 hover:text-emerald-300 transition">✓ All</button>
                        <span className="text-gray-600">|</span>
                        <button onClick={() => toggleAllVisible(false)} title="Ocultar todos"
                          className="text-[9px] text-red-500 hover:text-red-300 transition">✕ All</button>
                      </div>
                    </div>
                  </th>
                  {/* REQUERIDO header */}
                  <th className="px-4 py-3 text-center w-24">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">Requerido</span>
                      <div className="flex gap-1">
                        <button onClick={() => toggleAllObligatorio(true)}  title="Marcar todos obligatorios"
                          className="text-[9px] text-yellow-500 hover:text-yellow-300 transition">✓ All</button>
                        <span className="text-gray-600">|</span>
                        <button onClick={() => toggleAllObligatorio(false)} title="Quitar todos obligatorios"
                          className="text-[9px] text-red-500 hover:text-red-300 transition">✕ All</button>
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => {
                  const visible    = getVal(c.id, 'esVisible', c.esVisible);
                  const obligatorio= getVal(c.id, 'esObligatorio', c.esObligatorio);
                  const changed    = pending[c.id] !== undefined;
                  const rowNum     = orderedAll.findIndex(o => o.id === c.id) + 1;
                  const secInfo    = SECCIONES_PACIENTE.find(s => s.value === c.seccion);
                  return (
                    <tr key={c.id}
                      className={`border-b border-slate-800 transition-colors
                        ${changed ? 'bg-yellow-500/5' : idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-800/20'}
                        hover:bg-slate-800/40 ${!visible ? 'opacity-50' : ''}`}>
                      {/* # */}
                      <td className="px-3 py-2.5 text-center text-slate-500 font-mono">{rowNum}</td>
                      {/* Campo */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-300 text-[11px]">{c.nombre}</span>
                          {c.esPersonalizado && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-500/25 text-purple-400 border border-purple-500/30 uppercase">custom</span>
                          )}
                          {changed && (
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" title="Cambio pendiente de guardar" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{c.etiqueta}</div>
                      </td>
                      {/* Sección */}
                      <td className="px-3 py-2.5 text-center hidden md:table-cell">
                        <span className="text-[10px] text-slate-400">{secInfo?.emoji} {secInfo?.label}</span>
                      </td>
                      {/* Tipo */}
                      <td className="px-3 py-2.5 text-center hidden lg:table-cell">
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded">{c.tipoCampo}</span>
                      </td>
                      {/* Visible — checkbox directo */}
                      <td className="px-4 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={visible}
                          onChange={() => toggleCell(c.id, 'esVisible', c.esVisible)}
                          className="w-4 h-4 rounded border-slate-500 bg-slate-800 text-emerald-500 cursor-pointer accent-emerald-500 focus:ring-0 focus:ring-offset-0"
                          title={visible ? 'Ocultar campo' : 'Mostrar campo'}
                        />
                      </td>
                      {/* Requerido — checkbox directo */}
                      <td className="px-4 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={obligatorio}
                          onChange={() => toggleCell(c.id, 'esObligatorio', c.esObligatorio)}
                          className="w-4 h-4 rounded border-slate-500 bg-slate-800 text-yellow-500 cursor-pointer accent-yellow-500 focus:ring-0 focus:ring-offset-0"
                          title={obligatorio ? 'Quitar obligatorio' : 'Marcar obligatorio'}
                        />
                      </td>
                      {/* Acciones */}
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => openEdit(c)} title="Editar etiqueta / opciones"
                            className="p-1 rounded text-slate-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition">
                            <Edit2 size={11} />
                          </button>
                          {c.esPersonalizado && (
                            <button onClick={() => del(c)} title="Eliminar campo personalizado"
                              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition">
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      }

      {/* Barra inferior de guardado */}
      {hasPending && (
        <div className="fixed bottom-6 right-6 z-40">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-3 bg-slate-800 border border-yellow-600/40 rounded-xl px-4 py-3 shadow-2xl">
            <span className="text-xs text-yellow-400 font-semibold">{Object.keys(pending).length} cambio(s) sin guardar</span>
            <button onClick={() => setPending({})} className="text-xs text-gray-500 hover:text-white transition px-2 py-1 rounded hover:bg-slate-700">Descartar</button>
            <button onClick={saveAll} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition">
              {saving ? 'Guardando…' : <><Save size={12} /> Guardar</>}
            </button>
          </motion.div>
        </div>
      )}

      {/* Modal crear / editar campo personalizado */}
      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <Modal
            title={modal === 'create' ? 'Nuevo Campo Personalizado' : `Editar — ${form.etiqueta}`}
            onClose={() => setModal(null)} maxW="max-w-lg">
            <div className="space-y-4">
              {modal === 'create'
                ? <Field label="Nombre interno *" value={form.nombre || ''} onChange={f('nombre')} required placeholder="Ej: telefonoEmergencia (sin espacios)" />
                : (
                  <div className="flex items-center gap-2 p-2.5 bg-slate-800/60 rounded-lg border border-white/5">
                    <code className="text-xs text-yellow-400">{form.nombre}</code>
                    <span className="text-[10px] text-gray-500">— no editable</span>
                  </div>
                )
              }
              <Field label="Etiqueta visible *" value={form.etiqueta || ''} onChange={f('etiqueta')} required placeholder="Ej: Teléfono de Emergencia" />
              <div className="grid grid-cols-2 gap-3">
                <Sel label="Sección *" value={form.seccion || 'personal'} onChange={f('seccion')}
                  options={SECCIONES_PACIENTE.map(s => ({ value: s.value, label: `${s.emoji} ${s.label}` }))} />
                <Sel label="Tipo *" value={form.tipoCampo || 'text'} onChange={f('tipoCampo')} options={TIPOS_CAMPO} />
              </div>
              <Field label="Placeholder" value={form.placeholder || ''} onChange={f('placeholder')} placeholder="Texto de ayuda" />
              {form.tipoCampo === 'select' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Opciones JSON <span className="text-gray-600 font-normal">— {`[{"value":"v","label":"L"}]`}</span>
                  </label>
                  <textarea value={opcionesStr} onChange={e => setOpcionesStr(e.target.value)} rows={4}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-yellow-500 focus:outline-none resize-none font-mono" />
                </div>
              )}
              <div className="flex gap-5">
                <Sw value={!!form.esVisible}     onChange={f('esVisible')}     label="Visible" />
                <Sw value={!!form.esObligatorio} onChange={f('esObligatorio')} label="Obligatorio" />
              </div>
              {err && <ErrBox msg={err} />}
              <FormFooter onCancel={() => setModal(null)} onSave={save} saving={saving} />
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal restaurar */}
      <AnimatePresence>
        {confirmReset && (
          <Modal title="Restaurar campos base" onClose={() => setConfirmReset(false)} maxW="max-w-sm">
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <AlertTriangle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-300">Reinicia los campos base a su configuración original. Los campos personalizados no se ven afectados.</p>
              </div>
              <FormFooter onCancel={() => setConfirmReset(false)} onSave={doReset} />
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════
// TAB: LISTAS DE SELECCIÓN
// ════════════════════════════════════════════════

const GRUPOS_LISTA = [
  { value:'tipoDocumento',     label:'Tipos de Documento',   emoji:'🪪' },
  { value:'generoBiologico',   label:'Género Biológico',      emoji:'⚧️' },
  { value:'generoSentido',     label:'Género Sentido',        emoji:'🏳️' },
  { value:'estadoCivil',       label:'Estado Civil',          emoji:'💍' },
  { value:'grupoEtnico',       label:'Grupo Étnico',          emoji:'🌎' },
  { value:'nivelEducacion',    label:'Nivel Educación',       emoji:'🎓' },
  { value:'orientacionSexual', label:'Orientación Sexual',    emoji:'🌈' },
  { value:'discapacidad',      label:'Discapacidad',          emoji:'♿' },
  { value:'formaAsignacion',   label:'Forma de Asignación',   emoji:'📋' },
];

function TabListasSeleccion() {
  const [all,    setAll]    = useState<any[]>([]);
  const [grupo,  setGrupo]  = useState('tipoDocumento');
  const [modal,  setModal]  = useState<null|'create'|'edit'>(null);
  const [form,   setForm]   = useState<any>({});
  const [err,    setErr]    = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    try { setAll((await svc.getListasValores() as any[])); } catch { /* noop */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const items     = all.filter(i => i.grupo === grupo);
  const grupoInfo = GRUPOS_LISTA.find(g => g.value === grupo);
  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const toggleActivo = async (item: any) => {
    try { await svc.updateListaValor(item.id, { activo: !item.activo }); load(); } catch { /* noop */ }
  };

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setErr('');
    if (!form.valor?.trim())    { setSaving(false); savingRef.current = false; return setErr('El valor interno es requerido'); }
    if (!form.etiqueta?.trim()) { setSaving(false); savingRef.current = false; return setErr('La etiqueta es requerida'); }
    try {
      if (modal === 'create') await svc.createListaValor({ ...form, grupo });
      else await svc.updateListaValor(form.id, { etiqueta: form.etiqueta, orden: form.orden });
      setModal(null); load();
    } catch (e: any) { setErr(e.message || 'Error'); }
    finally { savingRef.current = false; setSaving(false); }
  };

  return (
    <>
      {/* Selector de grupo */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {GRUPOS_LISTA.map(g => (
          <button key={g.value} onClick={() => setGrupo(g.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${grupo === g.value ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-gray-400 hover:text-white border border-white/5'}`}>
            <span>{g.emoji}</span> {g.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${grupo === g.value ? 'bg-white/20 text-white' : 'bg-slate-700 text-gray-500'}`}>
              {all.filter(i => i.grupo === g.value && i.activo).length}
            </span>
          </button>
        ))}
      </div>

      <SecHeader
        title={`${grupoInfo?.emoji} ${grupoInfo?.label}`}
        onNew={() => { setForm({ orden: items.length + 1 }); setErr(''); setModal('create'); }}
      />

      {items.length === 0
        ? <p className="text-center text-gray-500 py-10 text-sm">Sin valores. Cargando o agrega uno nuevo.</p>
        : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-800/70">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Valor Interno</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Etiqueta Visible</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Orden</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Activo</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((row: any) => (
                  <tr key={row.id} className={`hover:bg-slate-800/30 transition ${!row.activo ? 'opacity-40' : ''}`}>
                    <td className="px-4 py-2.5">
                      <code className="text-[11px] text-yellow-300 bg-slate-800/80 px-2 py-0.5 rounded border border-white/5">{row.valor}</code>
                    </td>
                    <td className="px-4 py-2.5 text-gray-200">{row.etiqueta}</td>
                    <td className="px-3 py-2.5 text-center text-gray-400">{row.orden}</td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => toggleActivo(row)}
                        className={`p-1 rounded-lg transition ${row.activo ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-600 hover:bg-gray-500/10'}`}>
                        {row.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => { setForm({ ...row }); setErr(''); setModal('edit'); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition">
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <Modal title={modal === 'create' ? `Nuevo valor — ${grupoInfo?.label}` : 'Editar valor'} onClose={() => setModal(null)}>
            <div className="space-y-4">
              {modal === 'create'
                ? <Field label="Valor interno *" value={form.valor || ''} onChange={f('valor')} required placeholder="Ej: CC, Soltero, Pregrado (sin espacios)" />
                : (
                  <div className="flex items-center gap-2 p-3 bg-slate-800/60 rounded-xl border border-white/5">
                    <code className="text-xs text-yellow-400">{form.valor}</code>
                    <span className="text-[10px] text-gray-500">— valor interno (no editable)</span>
                  </div>
                )
              }
              <Field label="Etiqueta visible *" value={form.etiqueta || ''} onChange={f('etiqueta')} required placeholder="Ej: Cédula de Ciudadanía" />
              <Field label="Orden" value={String(form.orden ?? '')} onChange={v => f('orden')(Number(v))} type="number" placeholder="0" />
              {err && <ErrBox msg={err} />}
              <FormFooter onCancel={() => setModal(null)} onSave={save} saving={saving} />
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════
// TAB GENÉRICO: PARÁMETROS KEY-VALUE POR GRUPO
// ════════════════════════════════════════════════

function TabParamKV({ grupo, descripcion }: { grupo: string; descripcion: string }) {
  const [items,   setItems]   = useState<any[]>([]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await svc.getParametrosSistema(grupo) as any[];
      setItems(data);
      const map: Record<string, string> = {};
      data.forEach((p: any) => { map[p.clave] = p.valor; });
      setValores(map);
    } catch { /* noop */ }
  }, [grupo]);
  useEffect(() => { load(); }, [load]);

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const item of items) {
        const nuevoValor = valores[item.clave] ?? '';
        if (nuevoValor !== item.valor) {
          await svc.updateParametroSistema(grupo, item.clave, nuevoValor);
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      load();
    } catch { /* noop */ }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-xs text-gray-400 max-w-lg">{descripcion}</p>
        <button onClick={saveAll} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition whitespace-nowrap">
          {saved ? <><CheckCircle size={13} /> Guardado</> : saving ? 'Guardando...' : <><Save size={13} /> Guardar Todo</>}
        </button>
      </div>

      {items.length === 0
        ? <p className="text-center text-gray-500 py-10 text-sm">Cargando parámetros...</p>
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {items.map((p: any) => (
              <div key={p.clave} className={p.clave === 'logo_url' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs text-gray-400 mb-1.5">{p.etiqueta}</label>
                {p.tipo === 'boolean'
                  ? (
                    <Sw
                      value={valores[p.clave] === 'true'}
                      onChange={v => setValores(prev => ({ ...prev, [p.clave]: v ? 'true' : 'false' }))}
                      label={valores[p.clave] === 'true' ? 'Activado' : 'Desactivado'}
                    />
                  ) : p.clave === 'logo_url'
                  ? (
                    <div className="flex items-start gap-4">
                      <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg cursor-pointer transition border border-slate-600 whitespace-nowrap">
                        <Upload size={13} />
                        Cargar imagen
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = ev => {
                              setValores(prev => ({ ...prev, logo_url: ev.target?.result as string ?? '' }));
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {valores['logo_url']
                        ? (
                          <div className="flex items-center gap-3">
                            <img
                              src={valores['logo_url']}
                              alt="Logo clínica"
                              className="max-h-14 max-w-[160px] object-contain rounded border border-slate-600 bg-white/5 p-1"
                            />
                            <button
                              onClick={() => setValores(prev => ({ ...prev, logo_url: '' }))}
                              className="text-xs text-red-400 hover:text-red-300 transition"
                            >
                              Quitar
                            </button>
                          </div>
                        )
                        : <span className="text-xs text-gray-500 self-center">Sin logo configurado</span>
                      }
                    </div>
                  ) : (
                    <input
                      type={p.tipo === 'url' ? 'text' : p.tipo}
                      value={valores[p.clave] ?? ''}
                      onChange={e => setValores(prev => ({ ...prev, [p.clave]: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
                    />
                  )
                }
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

function TabConfigClinica() {
  return (
    <TabParamKV
      grupo="clinica"
      descripcion="Información general de la clínica. Aparece en documentos, facturas y reportes generados por el sistema."
    />
  );
}

function TabParamAgenda() {
  return (
    <TabParamKV
      grupo="agenda"
      descripcion="Configuración del módulo de agendamiento: horarios, duración de citas, anticipación y recordatorios."
    />
  );
}

// ════════════════════════════════════════════════
// TAB: MOTIVOS DE CITA / CANCELACIÓN
// ════════════════════════════════════════════════

const TIPOS_MOTIVO = [
  { value:'consulta',       label:'Consulta'       },
  { value:'control',        label:'Control'        },
  { value:'preoperatorio',  label:'Preoperatorio'  },
  { value:'seguimiento',    label:'Seguimiento'    },
  { value:'cancelacion',    label:'Cancelación'    },
];

function TabMotivosCita() {
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [tipo,    setTipo]    = useState('');
  const [modal,   setModal]   = useState<null|'create'|'edit'>(null);
  const [form,    setForm]    = useState<any>({});
  const [err,     setErr]     = useState('');
  const [saving,  setSaving]  = useState(false);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setLoadErr('');
    try { setItems((await svc.getMotivosCita() as any[])); }
    catch(e: any) { setLoadErr(e?.message || 'Error al cargar'); /* noop */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(i => !tipo || i.tipo === tipo);
  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setErr('');
    if (!form.nombre?.trim()) { savingRef.current = false; setSaving(false); return setErr('El nombre es requerido'); }
    try {
      if (modal === 'create') await svc.createMotivoCita(form);
      else await svc.updateMotivoCita(form.id, form);
      setModal(null); load();
    } catch (e: any) { setErr(e.message || 'Error'); }
    finally { savingRef.current = false; setSaving(false); }
  };

  const del = async (row: any) => {
    if (!confirm(`¿Desactivar "${row.nombre}"?`)) return;
    try { await svc.deleteMotivoCita(row.id); load(); } catch { /* noop */ }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setTipo('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${!tipo ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-gray-400 hover:text-white border border-white/5'}`}>
            Todos
          </button>
          {TIPOS_MOTIVO.map(t => (
            <button key={t.value} onClick={() => setTipo(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tipo === t.value ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-gray-400 hover:text-white border border-white/5'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => { setForm({ tipo: 'consulta', orden: filtered.length + 1, activo: true }); setErr(''); setModal('create'); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-xs font-semibold transition">
          <Plus size={13} /> Nuevo Motivo
        </button>
      </div>

      {loadErr && <ErrBanner msg={loadErr} onRetry={load} />}
      <Table
        items={filtered}
        loading={loading && !items.length}
        cols={[
          { key:'nombre',      label:'Nombre'      },
          { key:'tipo',        label:'Tipo',        render: r => <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/15 text-yellow-400">{r.tipo}</span> },
          { key:'descripcion', label:'Descripción'  },
          { key:'orden',       label:'Orden'        },
          { key:'activo',      label:'Estado',      render: r => EBadge(r.activo) },
        ]}
        onEdit={r  => { setForm({ ...r }); setErr(''); setModal('edit'); }}
        onDelete={del}
      />

      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <Modal title={modal === 'create' ? 'Nuevo Motivo' : 'Editar Motivo'} onClose={() => setModal(null)}>
            <div className="space-y-4">
              <Field label="Nombre *" value={form.nombre || ''} onChange={f('nombre')} required placeholder="Ej: Consulta de primera vez" />
              <Field label="Descripción" value={form.descripcion || ''} onChange={f('descripcion')} type="textarea" placeholder="Descripción opcional" />
              <div className="grid grid-cols-2 gap-4">
                <Sel label="Tipo *" value={form.tipo || 'consulta'} onChange={f('tipo')} options={TIPOS_MOTIVO} />
                <Field label="Orden" value={String(form.orden ?? '')} onChange={v => f('orden')(Number(v))} type="number" />
              </div>
              {modal === 'edit' && <Sw value={!!form.activo} onChange={f('activo')} label="Activo" />}
              {err && <ErrBox msg={err} />}
              <FormFooter onCancel={() => setModal(null)} onSave={save} saving={saving} />
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════
// ESTRUCTURA DE MÓDULOS/SUBMÓDULOS  (3 módulos)
// ════════════════════════════════════════════════
// TAB: TEMAS DEL SISTEMA
// ════════════════════════════════════════════════
function TabTemasistema() {
  const { theme, setTheme } = useTheme();

  type TemaInfo = {
    id: ThemeId;
    name: string;
    tagline: string;
    desc: string;
    bg: [string, string, string];
    accent: string;
    card: string;
    txt: string;
    border: string;
    swatches: string[];
    ideal: string[];
  };

  const TEMAS: TemaInfo[] = [
    {
      id: 'dark',
      name: 'SARAI Dark',
      tagline: 'Futurista · IA Médica · Gold',
      desc: 'El estilo original de SARAI. Interfaz oscura premium con acentos dorados. Diseñada para entornos con poca luz y trabajo nocturno.',
      bg: ['#0a0a0f', '#0f1117', '#14151f'],
      accent: '#d4af37',
      card: '#1a1d29',
      txt: '#f1f5f9',
      border: 'rgba(255,255,255,0.08)',
      swatches: ['#0a0a0f', '#d4af37', '#1a1d29', '#0ea5e9'],
      ideal: ['Noche y poca luz', 'Estética clínica premium', 'Trabajo prolongado'],
    },
    {
      id: 'premium-light',
      name: 'Premium Light',
      tagline: 'Apple Health · Clean · Moderno',
      desc: 'Interfaz clara premium estilo Apple Health. Blanca y elegante con acentos azul eléctrico. Ideal para consultorios bien iluminados.',
      bg: ['#f0f4f8', '#f5f7fc', '#ffffff'],
      accent: '#2563eb',
      card: '#ffffff',
      txt: '#0f172a',
      border: 'rgba(15,23,42,0.10)',
      swatches: ['#f0f4f8', '#2563eb', '#ffffff', '#06b6d4'],
      ideal: ['Clínicas bien iluminadas', 'Consultas privadas', 'Dispositivos Apple'],
    },
    {
      id: 'soft-medical',
      name: 'Soft Medical',
      tagline: 'Verde Salvia · Calma · Bienestar',
      desc: 'Reduce la fatiga visual en jornadas largas. Tonos de verde salvia y esmeralda inspirados en entornos médicos calmados.',
      bg: ['#e8f0eb', '#eff5f0', '#f7fbf7'],
      accent: '#059669',
      card: '#f7fbf7',
      txt: '#1a3326',
      border: 'rgba(26,51,38,0.10)',
      swatches: ['#e8f0eb', '#059669', '#f7fbf7', '#0891b2'],
      ideal: ['Jornadas largas (8h+)', 'Enfermería y auxiliares', 'Consulta general'],
    },
    {
      id: 'executive-ai',
      name: 'Executive AI',
      tagline: 'Navy · Cyan · Ultra Premium',
      desc: 'Estilo corporativo ultra-premium inspirado en dashboards de IA. Azul naval profundo con detalles cyan brillante.',
      bg: ['#030712', '#060e1a', '#091525'],
      accent: '#06b6d4',
      card: '#091525',
      txt: '#e2e8f0',
      border: 'rgba(6,182,212,0.12)',
      swatches: ['#030712', '#06b6d4', '#091525', '#7c3aed'],
      ideal: ['Dirección médica', 'Tecnología avanzada', 'Uso ejecutivo'],
    },
  ];

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Temas del Sistema</h2>
        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
          Selecciona la paleta visual de SARAI. El cambio aplica inmediatamente en toda la interfaz.
        </p>
      </div>

      {/* Grid 1 col mobile / 2 col desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16,
      }}>
        {TEMAS.map(t => {
          const active = theme === t.id;
          return (
            <motion.div
              key={t.id}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              onClick={() => setTheme(t.id)}
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                border: `1.5px solid ${active ? t.accent : t.border}`,
                boxShadow: active ? `0 0 22px ${t.accent}28` : '0 2px 8px rgba(0,0,0,0.18)',
                cursor: 'pointer',
                position: 'relative',
                background: t.bg[1],
              }}
            >
              {/* Badge activo */}
              {active && (
                <div style={{
                  position: 'absolute', top: 10, right: 10, zIndex: 10,
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px',
                  background: `${t.accent}22`,
                  border: `1px solid ${t.accent}55`,
                  borderRadius: 99,
                  fontSize: 10, fontWeight: 700,
                  color: t.accent,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: t.accent,
                    display: 'inline-block',
                    boxShadow: `0 0 4px ${t.accent}`,
                  }} />
                  ACTIVO
                </div>
              )}

              {/* Preview mini-UI */}
              <div style={{
                height: 108,
                background: `linear-gradient(135deg, ${t.bg[0]}, ${t.bg[1]}, ${t.bg[2]})`,
                padding: '10px 12px',
                display: 'flex',
                gap: 8,
                overflow: 'hidden',
              }}>
                {/* Sidebar mock */}
                <div style={{
                  width: 32, flexShrink: 0,
                  background: t.bg[0],
                  border: `1px solid ${t.border}`,
                  borderRadius: 7,
                  padding: '6px 5px',
                  display: 'flex', flexDirection: 'column', gap: 5,
                }}>
                  {([1,0,0,0] as number[]).map((hl, i) => (
                    <div key={i} style={{
                      height: 4, borderRadius: 3,
                      background: hl ? t.accent : `${t.txt}18`,
                      width: hl ? '80%' : '60%',
                    }} />
                  ))}
                  <div style={{ flex: 1 }} />
                  <div style={{ height: 4, borderRadius: 3, background: `${t.txt}10`, width: '70%' }} />
                </div>
                {/* Contenido */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {/* Navbar */}
                  <div style={{
                    height: 14, background: t.card,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    display: 'flex', alignItems: 'center', gap: 4, padding: '0 6px',
                  }}>
                    <div style={{ height: 3, width: '30%', borderRadius: 2, background: `${t.txt}25` }} />
                    <div style={{ flex: 1 }} />
                    <div style={{ width: 12, height: 6, borderRadius: 3, background: t.accent }} />
                  </div>
                  {/* Stat cards */}
                  <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                    {([t.accent, `${t.accent}80`, `${t.accent}44`] as string[]).map((c, i) => (
                      <div key={i} style={{
                        flex: 1, background: t.card,
                        border: `1px solid ${t.border}`,
                        borderRadius: 6, padding: 4,
                      }}>
                        <div style={{ height: 3, width: '70%', background: c, borderRadius: 2, marginBottom: 3 }} />
                        <div style={{ height: 2, width: '90%', background: `${t.txt}20`, borderRadius: 2 }} />
                        <div style={{ height: 2, width: '50%', background: `${t.txt}12`, borderRadius: 2, marginTop: 2 }} />
                      </div>
                    ))}
                  </div>
                  {/* Table rows */}
                  <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 6, overflow: 'hidden' }}>
                    {([0, 1] as number[]).map(i => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 6px',
                        background: i === 0 ? `${t.accent}10` : 'transparent',
                        borderBottom: i === 0 ? `1px solid ${t.border}` : 'none',
                      }}>
                        <div style={{ height: 2, flex: 1, background: `${t.txt}20`, borderRadius: 2 }} />
                        <div style={{ height: 5, width: 20, background: i === 0 ? t.accent : `${t.txt}15`, borderRadius: 3 }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div style={{
                padding: '14px 16px',
                background: t.bg[1],
                borderTop: `1px solid ${t.border}`,
              }}>
                {/* Nombre + swatches */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', marginBottom: 6,
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: t.txt, marginBottom: 2 }}>{t.name}</p>
                    <p style={{ fontSize: 10, fontWeight: 600, color: t.accent }}>{t.tagline}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 3, flexShrink: 0, marginTop: 2 }}>
                    {t.swatches.map((c, i) => (
                      <div key={i} style={{
                        width: 12, height: 12, borderRadius: '50%',
                        background: c, border: `1.5px solid ${t.border}`,
                      }} />
                    ))}
                  </div>
                </div>
                {/* Descripción */}
                <p style={{ fontSize: 11, color: `${t.txt}bb`, lineHeight: 1.55, marginBottom: 8 }}>
                  {t.desc}
                </p>
                {/* Ideal para */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                  {t.ideal.map((label, i) => (
                    <span key={i} style={{
                      fontSize: 9, padding: '2px 8px', borderRadius: 99, fontWeight: 600,
                      background: `${t.accent}15`,
                      color: t.accent,
                      border: `1px solid ${t.accent}30`,
                    }}>{label}</span>
                  ))}
                </div>
                {/* Botón */}
                <button
                  onClick={e => { e.stopPropagation(); setTheme(t.id); }}
                  style={{
                    width: '100%', padding: '8px 0', borderRadius: 10,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    transition: 'opacity 0.15s',
                    border: active ? `1.5px solid ${t.accent}55` : 'none',
                    background: active ? `${t.accent}18` : t.accent,
                    color: active
                      ? t.accent
                      : (t.id === 'premium-light' || t.id === 'soft-medical' ? '#ffffff' : '#0a0a0f'),
                  }}
                >
                  {active ? '✓ Tema activo' : 'Activar tema'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info banner */}
      <div style={{
        marginTop: 20, padding: '12px 16px', borderRadius: 12,
        background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)',
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <SlidersHorizontal size={14} style={{ color: '#06b6d4', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#22d3ee', marginBottom: 3 }}>Sobre los temas visuales</p>
          <p style={{ fontSize: 11, color: 'rgba(34,211,238,0.6)', lineHeight: 1.55 }}>
            Los temas cambian la paleta de colores de toda la interfaz SARAI. Tu preferencia se guarda
            en el dispositivo y se aplica automáticamente al iniciar sesión.
          </p>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════

const MODULOS = [
  {
    id: 'consulta-externa',
    label: 'Administración Consulta Externa',
    icon: FolderOpen,
    submodulos: [
      { id:'especialidades',    label:'Especialidades',      icon:Activity,      component:TabEspecialidades      },
      { id:'tipos-consulta',    label:'Tipos de Consulta',   icon:Layers,        component:TabTiposConsulta       },
      { id:'tipos-consultorio', label:'Tipos Consultorio',   icon:LayoutGrid,    component:TabTiposConsultorio    },
      { id:'departamentos',     label:'Departamentos',       icon:Building2,     component:TabDepartamentos       },
      { id:'deptos-cargos',     label:'Depto × Cargos',      icon:GitBranch,     component:TabDepartamentosCargos },
      { id:'preparaciones',     label:'Preparaciones',       icon:BookOpen,      component:TabPreparaciones       },
    ],
  },
  {
    id: 'param-formularios',
    label: 'Parametrización de Formularios',
    icon: FileText,
    submodulos: [
      { id:'campos-paciente',   label:'Campos del Paciente', icon:ClipboardList, component:TabCamposPaciente      },
      { id:'listas-seleccion',  label:'Listas de Selección', icon:List,          component:TabListasSeleccion     },
    ],
  },
  {
    id: 'config-general',
    label: 'Configuración General',
    icon: SlidersHorizontal,
    submodulos: [
      { id:'config-clinica',    label:'Datos de la Clínica', icon:Stethoscope,   component:TabConfigClinica       },
      { id:'param-agenda',      label:'Parámetros de Agenda',icon:Calendar,      component:TabParamAgenda         },
      { id:'motivos-cita',      label:'Motivos de Cita',     icon:MessageSquare, component:TabMotivosCita         },
    ],
  },
  {
    id: 'temas',
    label: 'Temas del Sistema',
    icon: Palette,
    submodulos: [
      { id:'temas-visuales',    label:'Temas Visuales',      icon:Palette,       component:TabTemasistema         },
    ],
  },
];

// ════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════
export default function AdminPage() {
  const [activeMod, setActiveMod] = useState('consulta-externa');
  const [activeSub, setActiveSub] = useState('especialidades');
  const [expanded,  setExpanded]  = useState('consulta-externa');

  // Precarga los datos más comunes en paralelo al montar la página
  // para que el cache esté caliente cuando el usuario navegue a cada tab
  useEffect(() => {
    Promise.all([
      svc.getEspecialidades(),
      svc.getDepartamentos(),
      svc.getTiposConsulta(),
      svc.getCargos(),
      svc.getTiposConsultorio(),
    ]).catch(() => {});
  }, []);
  const modulo    = MODULOS.find(m => m.id === activeMod);
  const submodulo = modulo?.submodulos.find(s => s.id === activeSub);
  const Content   = submodulo?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header raíz */}
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-600/20 rounded-xl border border-yellow-600/30">
              <Settings size={20} className="text-yellow-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">
                Parametrización del Sistema
              </h1>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {modulo?.label} › {submodulo?.label}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">

          {/* Sidebar – visible en md+ */}
          <aside className="hidden md:flex flex-col w-64 flex-shrink-0 gap-2">
            {MODULOS.map(mod => (
              <div key={mod.id}>
                <button onClick={() => setExpanded(expanded === mod.id ? '' : mod.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition text-left
                    ${activeMod === mod.id
                      ? 'bg-yellow-600/15 border-yellow-600/40 text-yellow-300'
                      : 'bg-slate-800/40 border-white/5 text-gray-400 hover:text-gray-200 hover:border-white/15'}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <mod.icon size={14} className="flex-shrink-0" />
                    <span className="text-xs font-semibold leading-tight truncate">{mod.label}</span>
                  </div>
                  <ChevronDown size={13} className={`flex-shrink-0 transition-transform ${expanded === mod.id ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {expanded === mod.id && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                      exit={{ height:0, opacity:0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                      <div className="mt-1 ml-2 pl-2 border-l border-yellow-600/20 space-y-0.5">
                        {mod.submodulos.map(sub => (
                          <button key={sub.id}
                            onClick={() => { setActiveMod(mod.id); setActiveSub(sub.id); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition
                              ${activeSub === sub.id && activeMod === mod.id
                                ? 'bg-yellow-500/15 text-yellow-400'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-slate-700/40'}`}>
                            <sub.icon size={13} />
                            <span className="text-xs">{sub.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <div className="mt-2 p-3 rounded-xl border border-dashed border-white/5 text-center">
              <p className="text-[10px] text-gray-600">+ Más submódulos próximamente</p>
            </div>
          </aside>

          {/* Tabs en móvil */}
          <div className="flex md:hidden overflow-x-auto gap-1 mb-4 bg-slate-800/40 rounded-xl p-1 w-full">
            {modulo?.submodulos.map(sub => (
              <button key={sub.id} onClick={() => setActiveSub(sub.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold whitespace-nowrap transition
                  ${activeSub === sub.id ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <sub.icon size={13} /> {sub.label}
              </button>
            ))}
          </div>

          {/* Panel principal */}
          <main className="flex-1 min-w-0 space-y-3">
            {/* Breadcrumb del submódulo */}
            <div className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3">
              {submodulo && (
                <div className="p-1.5 bg-yellow-600/10 rounded-lg border border-yellow-600/20">
                  <submodulo.icon size={14} className="text-yellow-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-white leading-tight">{submodulo?.label}</p>
                <p className="text-[10px] text-gray-500">{modulo?.label}</p>
              </div>
            </div>

            {/* Contenido */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 sm:p-5">
              <AnimatePresence mode="wait">
                <motion.div key={`${activeMod}-${activeSub}`}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-8 }} transition={{ duration: 0.13 }}>
                  {Content
                    ? <Content />
                    : <p className="text-gray-500 text-sm text-center py-10">Selecciona un submódulo</p>}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Nota normativa */}
            <div className="px-4 py-2.5 bg-blue-500/5 border border-blue-500/15 rounded-xl flex items-start gap-2">
              <AlertTriangle size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-blue-300/70 leading-relaxed">
                Parametrización rige sobre{' '}
                <strong className="text-blue-300">RIPS (Res. 3374/2000)</strong>,{' '}
                <strong className="text-blue-300">CUPS (Res. 5521/2013)</strong> e{' '}
                <strong className="text-blue-300">Historia Clínica (Res. 1995/1999)</strong>.
                Los cambios son inmediatos y afectan agendamiento, facturación e HC.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
