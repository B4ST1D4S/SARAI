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
  AlertTriangle, ChevronDown, FolderOpen,
} from 'lucide-react';
import * as svc from '../services/adminService';

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

function Table({ items, cols, onEdit, onDelete }: {
  items: any[];
  cols: { key: string; label: string; render?: (r: any) => React.ReactNode }[];
  onEdit: (r: any) => void;
  onDelete: (r: any) => void;
}) {
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

function FormFooter({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex justify-end gap-3 pt-3 border-t border-white/5 mt-4">
      <button onClick={onCancel}
        className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition">
        Cancelar
      </button>
      <button onClick={onSave}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg transition">
        <Save size={14} /> Guardar
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

function SecHeader({ title, onNew, onBulk }: { title: string; onNew: () => void; onBulk: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <h2 className="text-sm font-bold text-white">{title}</h2>
      <div className="flex gap-2">
        <button onClick={onBulk}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg text-xs font-semibold border border-white/10 transition">
          <Upload size={13} /> Cargue Masivo
        </button>
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
  const [items, setItems] = useState<any[]>([]);
  const [modal, setModal] = useState<null|'create'|'edit'|'bulk'>(null);
  const [form,  setForm]  = useState<any>({});
  const [err,   setErr]   = useState('');

  const load = useCallback(async () => { try { setItems(await svc.getEspecialidades() as any[]); } catch {} }, []);
  useEffect(() => { load(); }, [load]);

  const blank = () => ({
    codigo:'', nombre:'', descripcion:'',
    aplicaAnestesia:false, aplicaPediatria:false, aplicaCirugia:false,
    aplicaInstrumentacion:false, aplicaMedicoFamiliar:false,
  });

  const openCreate = () => { setForm(blank()); setErr(''); setModal('create'); };
  const openEdit   = (r: any) => { setForm({...r}); setErr(''); setModal('edit'); };

  const save = async () => {
    setErr('');
    try {
      if (modal === 'create') await svc.createEspecialidad(form);
      else await svc.updateEspecialidad(form.id, form);
      setModal(null); load();
    } catch(e: any) { setErr(e.message); }
  };

  const del = async (r: any) => {
    if (!confirm(`¿Desactivar "${r.nombre}"?`)) return;
    try { await svc.deleteEspecialidad(r.id); load(); } catch(e: any) { alert(e.message); }
  };

  const f = (k: string) => (v: any) => setForm((p: any) => ({...p, [k]: v}));

  return (
    <>
      <SecHeader title="Especialidades Médicas" onNew={openCreate} onBulk={() => setModal('bulk')} />
      <Table items={items}
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
              <FormFooter onCancel={() => setModal(null)} onSave={save} />
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
  const [items, setItems] = useState<any[]>([]);
  const [esps,  setEsps]  = useState<any[]>([]);
  const [deps,  setDeps]  = useState<any[]>([]);
  const [modal, setModal] = useState<null|'create'|'edit'|'bulk'>(null);
  const [wiz,   setWiz]   = useState(0);
  const [form,  setForm]  = useState<any>({});
  const [err,   setErr]   = useState('');

  const load = useCallback(async () => {
    try {
      const [tc, e, d] = await Promise.all([svc.getTiposConsulta(), svc.getEspecialidades(), svc.getDepartamentos()]);
      setItems(tc as any[]); setEsps(e as any[]); setDeps(d as any[]);
    } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const blank = () => ({
    nombre:'', descripcion:'', especialidadId:'', departamentoId:'',
    clasificacion:'CONSULTA', duracionMinutos:30,
    requiereCaja:false, manejaAnestesia:false, permiteAgendamiento:true,
    controlaTiempoCita:false, abreHistoriaClinica:true, permiteCargosAdicionales:false,
    esProgramaPYP:false, manejaProtocolos:false, esPsicologia:false,
  });

  const openCreate = () => { setForm(blank()); setErr(''); setWiz(0); setModal('create'); };
  const openEdit   = (r: any) => { setForm({...r, especialidadId:r.especialidadId||'', departamentoId:r.departamentoId||''}); setErr(''); setWiz(0); setModal('edit'); };

  const save = async () => {
    setErr('');
    try {
      if (modal === 'create') await svc.createTipoConsulta(form);
      else await svc.updateTipoConsulta(form.id, form);
      setModal(null); load();
    } catch(e: any) { setErr(e.message); }
  };

  const del = async (r: any) => {
    if (!confirm(`¿Desactivar "${r.nombre}"?`)) return;
    try { await svc.deleteTipoConsulta(r.id); load(); } catch(e: any) { alert(e.message); }
  };

  const f = (k: string) => (v: any) => setForm((p: any) => ({...p, [k]: v}));
  const TABS = ['General','Clínica'];

  return (
    <>
      <SecHeader title="Tipos de Consulta" onNew={openCreate} onBulk={() => setModal('bulk')} />
      <Table items={items}
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

            {err && <ErrBox msg={err} />}

            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
              <div>{wiz > 0 && <button onClick={() => setWiz(0)} className="px-3 py-2 text-xs text-gray-400 border border-white/10 rounded-lg hover:text-white transition">← Anterior</button>}</div>
              <div className="flex gap-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg transition">Cancelar</button>
                {wiz < TABS.length - 1
                  ? <button onClick={() => setWiz(1)} className="flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition">Siguiente <ChevronRight size={13} /></button>
                  : <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-semibold rounded-lg transition"><Save size={13} /> Guardar</button>
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
  const [items, setItems] = useState<any[]>([]);
  const [modal, setModal] = useState<null|'create'|'edit'|'bulk'>(null);
  const [form,  setForm]  = useState<any>({});
  const [err,   setErr]   = useState('');

  const load = useCallback(async () => { try { setItems(await svc.getDepartamentos() as any[]); } catch {} }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({codigo:'',nombre:'',descripcion:''}); setErr(''); setModal('create'); };
  const openEdit   = (r: any) => { setForm({...r}); setErr(''); setModal('edit'); };

  const save = async () => {
    setErr('');
    try {
      if (modal === 'create') await svc.createDepartamento(form);
      else await svc.updateDepartamento(form.id, form);
      setModal(null); load();
    } catch(e: any) { setErr(e.message); }
  };

  const del = async (r: any) => {
    if (!confirm(`¿Desactivar "${r.nombre}"?`)) return;
    try { await svc.deleteDepartamento(r.id); load(); } catch(e: any) { alert(e.message); }
  };

  const f = (k: string) => (v: any) => setForm((p: any) => ({...p, [k]: v}));

  return (
    <>
      <SecHeader title="Departamentos" onNew={openCreate} onBulk={() => setModal('bulk')} />
      <Table items={items}
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
              <FormFooter onCancel={() => setModal(null)} onSave={save} />
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
  const [items,  setItems]  = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modal,  setModal]  = useState<null|'create'|'edit'|'bulk'>(null);
  const [form,   setForm]   = useState<any>({});
  const [err,    setErr]    = useState('');

  const load = useCallback(async () => {
    try {
      setItems(await svc.getCargos(search ? `search=${encodeURIComponent(search)}` : '') as any[]);
    } catch {}
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
    setErr('');
    try {
      if (modal === 'create') await svc.createCargo(form);
      else await svc.updateCargo(form.id, form);
      setModal(null); load();
    } catch(e: any) { setErr(e.message); }
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

      <Table items={items}
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
              <FormFooter onCancel={() => setModal(null)} onSave={save} />
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
// ESTRUCTURA DE MÓDULOS/SUBMÓDULOS
// ════════════════════════════════════════════════
const SUBMODULOS = [
  { id:'especialidades', label:'Especialidades',    icon:Activity,   component:TabEspecialidades },
  { id:'tipos-consulta', label:'Tipos de Consulta', icon:Layers,     component:TabTiposConsulta  },
  { id:'departamentos',  label:'Departamentos',     icon:Building2,  component:TabDepartamentos  },
  { id:'cargos',         label:'Cargos',            icon:DollarSign, component:TabCargos         },
];

const MODULOS = [
  {
    id: 'consulta-externa',
    label: 'Administración Consulta Externa',
    icon: FolderOpen,
    desc: 'Especialidades · Tipos de Consulta · Departamentos · Cargos',
    submodulos: SUBMODULOS,
  },
  // Futuros módulos:
  // { id:'hospitalizacion', label:'Administración Hospitalización', ... }
];

// ════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════
export default function AdminPage() {
  const [activeMod, setActiveMod] = useState('consulta-externa');
  const [activeSub, setActiveSub] = useState('especialidades');
  const [expanded,  setExpanded]  = useState('consulta-externa');

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
