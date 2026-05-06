import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Plus, Edit2, Trash2, Save, X, ChevronRight,
  Activity, BookOpen, Building2, FileText, Layers, List, ClipboardList, Search, ToggleLeft, ToggleRight
} from 'lucide-react';
import * as adminSvc from '../services/adminService';

// ─── tipos locales ────────────────────────────────────────────
type Esp = any; type HCM = any; type Dep = any; type Svc = any; type TC = any; type Prep = any;

// ─── helpers ──────────────────────────────────────────────────
const TABS = [
  { id: 'especialidades', label: 'Especialidades',    icon: Activity },
  { id: 'hc-modulos',     label: 'Módulos HC',        icon: BookOpen },
  { id: 'departamentos',  label: 'Departamentos',     icon: Building2 },
  { id: 'servicios',      label: 'Servicios (CUPS)',  icon: FileText },
  { id: 'tipos-consulta', label: 'Tipos Consulta',    icon: Layers },
  { id: 'preparaciones',  label: 'Preparaciones',     icon: ClipboardList },
];

const CLASIFICACIONES = ['CONSULTA', 'PROCEDIMIENTO', 'CIRUGIA', 'CONTROL'];

function Switch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition">
      {value
        ? <ToggleRight size={20} className="text-yellow-400" />
        : <ToggleLeft  size={20} className="text-gray-500" />}
      {label}
    </button>
  );
}

function ModalWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-yellow-600/30 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </motion.div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false, placeholder = '' }:
  { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      {type === 'textarea'
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none resize-none" />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none" />
      }
    </div>
  );
}

// ─── TABLA GENÉRICA ──────────────────────────────────────────
function DataTable({ items, columns, onEdit, onDelete, emptyText }:
  { items: any[]; columns: { key: string; label: string; render?: (r: any) => React.ReactNode }[];
    onEdit: (r: any) => void; onDelete: (r: any) => void; emptyText: string }) {
  if (items.length === 0)
    return <p className="text-center text-gray-500 py-12">{emptyText}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800/60">
            {columns.map(c => (
              <th key={c.key} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{c.label}</th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.map((row, i) => (
            <tr key={row.id || i} className="hover:bg-slate-800/30 transition">
              {columns.map(c => (
                <td key={c.key} className="px-4 py-3 text-gray-300">
                  {c.render ? c.render(row) : (row[c.key] ?? '—')}
                </td>
              ))}
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onEdit(row)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => onDelete(row)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition">
                    <Trash2 size={14} />
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

// ════════════════════════════════════════════════════════
// TAB: ESPECIALIDADES
// ════════════════════════════════════════════════════════
function TabEspecialidades() {
  const [items, setItems] = useState<Esp[]>([]);
  const [modal, setModal]   = useState<null | 'create' | 'edit'>(null);
  const [form, setForm]     = useState<any>({});
  const [error, setError]   = useState('');

  const load = useCallback(async () => {
    try { setItems(await adminSvc.getEspecialidades() as any); } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ codigo:'', nombre:'', descripcion:'', aplicaAnestesia:false, aplicaPediatria:false, aplicaCirugia:false, aplicaInstrumentacion:false, aplicaMedicoFamiliar:false }); setError(''); setModal('create'); };
  const openEdit   = (r: any) => { setForm({...r}); setError(''); setModal('edit'); };

  const save = async () => {
    setError('');
    try {
      if (modal === 'create') await adminSvc.createEspecialidad(form);
      else await adminSvc.updateEspecialidad(form.id, form);
      setModal(null); load();
    } catch(e: any) { setError(e.message); }
  };

  const remove = async (r: any) => {
    if (!confirm(`¿Desactivar "${r.nombre}"?`)) return;
    try { await adminSvc.deleteEspecialidad(r.id); load(); } catch(e: any) { alert(e.message); }
  };

  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-semibold transition">
          <Plus size={16} /> Nueva Especialidad
        </button>
      </div>
      <DataTable
        items={items}
        columns={[
          { key: 'codigo', label: 'Código' },
          { key: 'nombre', label: 'Nombre' },
          { key: 'descripcion', label: 'Descripción' },
          { key: 'estado', label: 'Estado', render: r => (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.estado ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {r.estado ? 'Activo' : 'Inactivo'}
            </span>
          )},
        ]}
        onEdit={openEdit} onDelete={remove} emptyText="No hay especialidades registradas" />

      <AnimatePresence>
        {modal && (
          <ModalWrapper title={modal === 'create' ? 'Nueva Especialidad' : 'Editar Especialidad'} onClose={() => setModal(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Código" value={form.codigo||''} onChange={f('codigo')} required placeholder="Ej: ESP-001" />
                <Field label="Nombre" value={form.nombre||''} onChange={f('nombre')} required placeholder="Ej: Cirugía Plástica" />
              </div>
              <Field label="Descripción" value={form.descripcion||''} onChange={f('descripcion')} type="textarea" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <Switch value={form.aplicaAnestesia}       onChange={f('aplicaAnestesia')}       label="Aplica Anestesia" />
                <Switch value={form.aplicaPediatria}       onChange={f('aplicaPediatria')}       label="Aplica Pediatría" />
                <Switch value={form.aplicaCirugia}         onChange={f('aplicaCirugia')}         label="Aplica Cirugía" />
                <Switch value={form.aplicaInstrumentacion} onChange={f('aplicaInstrumentacion')} label="Instrumentación" />
                <Switch value={form.aplicaMedicoFamiliar}  onChange={f('aplicaMedicoFamiliar')}  label="Médico Familiar" />
                {modal === 'edit' && <Switch value={form.estado} onChange={f('estado')} label="Activo" />}
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition">Cancelar</button>
                <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg transition">
                  <Save size={14} /> Guardar
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: HC MÓDULOS
// ════════════════════════════════════════════════════════
function TabHCModulos() {
  const [items, setItems] = useState<HCM[]>([]);
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null);
  const [form, setForm]   = useState<any>({});
  const [error, setError] = useState('');

  const load = useCallback(async () => { try { setItems(await adminSvc.getHCModulos() as any); } catch {} }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ codigo:'', nombre:'', descripcion:'', tipoFinalidad:'', tipoRips:'' }); setError(''); setModal('create'); };
  const openEdit   = (r: any) => { setForm({...r}); setError(''); setModal('edit'); };
  const save = async () => {
    setError('');
    try {
      if (modal === 'create') await adminSvc.createHCModulo(form);
      else await adminSvc.updateHCModulo(form.id, form);
      setModal(null); load();
    } catch(e: any) { setError(e.message); }
  };
  const remove = async (r: any) => {
    if (!confirm(`¿Desactivar "${r.nombre}"?`)) return;
    try { await adminSvc.deleteHCModulo(r.id); load(); } catch(e: any) { alert(e.message); }
  };
  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-semibold transition">
          <Plus size={16} /> Nuevo Módulo HC
        </button>
      </div>
      <DataTable items={items}
        columns={[
          { key: 'codigo', label: 'Código' },
          { key: 'nombre', label: 'Nombre' },
          { key: 'tipoFinalidad', label: 'Finalidad' },
          { key: 'tipoRips', label: 'Tipo RIPS' },
          { key: 'activo', label: 'Estado', render: r => (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.activo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {r.activo ? 'Activo' : 'Inactivo'}
            </span>
          )},
        ]}
        onEdit={openEdit} onDelete={remove} emptyText="No hay módulos HC registrados" />

      <AnimatePresence>
        {modal && (
          <ModalWrapper title={modal === 'create' ? 'Nuevo Módulo HC' : 'Editar Módulo HC'} onClose={() => setModal(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Código" value={form.codigo||''} onChange={f('codigo')} required placeholder="Ej: HC-001" />
                <Field label="Nombre" value={form.nombre||''} onChange={f('nombre')} required />
              </div>
              <Field label="Descripción" value={form.descripcion||''} onChange={f('descripcion')} type="textarea" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo Finalidad" value={form.tipoFinalidad||''} onChange={f('tipoFinalidad')} placeholder="Ej: CONSULTA" />
                <Field label="Tipo RIPS" value={form.tipoRips||''} onChange={f('tipoRips')} placeholder="Ej: C" />
              </div>
              {modal === 'edit' && <Switch value={form.activo} onChange={f('activo')} label="Activo" />}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition">Cancelar</button>
                <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg transition">
                  <Save size={14} /> Guardar
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: DEPARTAMENTOS
// ════════════════════════════════════════════════════════
function TabDepartamentos() {
  const [items, setItems] = useState<Dep[]>([]);
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null);
  const [form, setForm]   = useState<any>({});
  const [error, setError] = useState('');

  const load = useCallback(async () => { try { setItems(await adminSvc.getDepartamentos() as any); } catch {} }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ codigo:'', nombre:'', descripcion:'' }); setError(''); setModal('create'); };
  const openEdit   = (r: any) => { setForm({...r}); setError(''); setModal('edit'); };
  const save = async () => {
    setError('');
    try {
      if (modal === 'create') await adminSvc.createDepartamento(form);
      else await adminSvc.updateDepartamento(form.id, form);
      setModal(null); load();
    } catch(e: any) { setError(e.message); }
  };
  const remove = async (r: any) => {
    if (!confirm(`¿Desactivar "${r.nombre}"?`)) return;
    try { await adminSvc.deleteDepartamento(r.id); load(); } catch(e: any) { alert(e.message); }
  };
  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-semibold transition">
          <Plus size={16} /> Nuevo Departamento
        </button>
      </div>
      <DataTable items={items}
        columns={[
          { key: 'codigo', label: 'Código' },
          { key: 'nombre', label: 'Nombre' },
          { key: 'descripcion', label: 'Descripción' },
          { key: 'estado', label: 'Estado', render: r => (
            <span className={`px-2 py-0.5 rounded-full text-xs ${r.estado ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {r.estado ? 'Activo' : 'Inactivo'}
            </span>
          )},
        ]}
        onEdit={openEdit} onDelete={remove} emptyText="No hay departamentos registrados" />

      <AnimatePresence>
        {modal && (
          <ModalWrapper title={modal === 'create' ? 'Nuevo Departamento' : 'Editar Departamento'} onClose={() => setModal(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Código" value={form.codigo||''} onChange={f('codigo')} required placeholder="Ej: DEP-001" />
                <Field label="Nombre" value={form.nombre||''} onChange={f('nombre')} required />
              </div>
              <Field label="Descripción" value={form.descripcion||''} onChange={f('descripcion')} type="textarea" />
              {modal === 'edit' && <Switch value={form.estado} onChange={f('estado')} label="Activo" />}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition">Cancelar</button>
                <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg transition">
                  <Save size={14} /> Guardar
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: SERVICIOS FACTURABLES (CUPS)
// ════════════════════════════════════════════════════════
function TabServicios() {
  const [items, setItems] = useState<Svc[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<null | 'create' | 'edit'>(null);
  const [form, setForm]     = useState<any>({});
  const [error, setError]   = useState('');

  const load = useCallback(async () => {
    try { setItems(await adminSvc.getServicios(search ? `search=${encodeURIComponent(search)}` : '') as any); } catch {}
  }, [search]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const openCreate = () => { setForm({ codigoCups:'', nombre:'', descripcion:'', categoria:'', subcategoria:'', tipoServicio:'', nivelComplejidad:'', conceptoRips:'', precioBase:0, requiereCantidad:false, esHonorario:false, esPOS:false }); setError(''); setModal('create'); };
  const openEdit   = (r: any) => { setForm({...r}); setError(''); setModal('edit'); };
  const save = async () => {
    setError('');
    try {
      if (modal === 'create') await adminSvc.createServicio(form);
      else await adminSvc.updateServicio(form.id, form);
      setModal(null); load();
    } catch(e: any) { setError(e.message); }
  };
  const remove = async (r: any) => {
    if (!confirm(`¿Desactivar "${r.nombre}"?`)) return;
    try { await adminSvc.deleteServicio(r.id); load(); } catch(e: any) { alert(e.message); }
  };
  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código o nombre..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-yellow-500 focus:outline-none" />
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-semibold transition self-start">
          <Plus size={16} /> Nuevo Servicio
        </button>
      </div>
      <DataTable items={items}
        columns={[
          { key: 'codigoCups', label: 'CUPS' },
          { key: 'nombre', label: 'Nombre' },
          { key: 'categoria', label: 'Categoría' },
          { key: 'precioBase', label: 'Precio Base', render: r => new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(r.precioBase) },
          { key: 'esPOS', label: 'POS', render: r => r.esPOS ? <span className="text-xs text-emerald-400">Sí</span> : <span className="text-xs text-gray-500">No</span> },
        ]}
        onEdit={openEdit} onDelete={remove} emptyText="No hay servicios registrados" />

      <AnimatePresence>
        {modal && (
          <ModalWrapper title={modal === 'create' ? 'Nuevo Servicio CUPS' : 'Editar Servicio'} onClose={() => setModal(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Código CUPS" value={form.codigoCups||''} onChange={f('codigoCups')} required placeholder="Ej: 890201" />
                <Field label="Nombre" value={form.nombre||''} onChange={f('nombre')} required />
              </div>
              <Field label="Descripción" value={form.descripcion||''} onChange={f('descripcion')} type="textarea" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Categoría" value={form.categoria||''} onChange={f('categoria')} placeholder="Ej: Cirugía" />
                <Field label="Subcategoría" value={form.subcategoria||''} onChange={f('subcategoria')} />
                <Field label="Tipo Servicio" value={form.tipoServicio||''} onChange={f('tipoServicio')} />
                <Field label="Nivel Complejidad" value={form.nivelComplejidad||''} onChange={f('nivelComplejidad')} />
                <Field label="Concepto RIPS" value={form.conceptoRips||''} onChange={f('conceptoRips')} />
                <Field label="Precio Base (COP)" value={String(form.precioBase||0)} onChange={v => f('precioBase')(Number(v))} type="number" />
              </div>
              <div className="grid grid-cols-3 gap-3 pt-1">
                <Switch value={form.requiereCantidad} onChange={f('requiereCantidad')} label="Requiere Cantidad" />
                <Switch value={form.esHonorario}      onChange={f('esHonorario')}      label="Es Honorario" />
                <Switch value={form.esPOS}            onChange={f('esPOS')}            label="Es POS" />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition">Cancelar</button>
                <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg transition">
                  <Save size={14} /> Guardar
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: TIPOS DE CONSULTA (wizard de 4 tabs)
// ════════════════════════════════════════════════════════
function TabTiposConsulta() {
  const [items, setItems]         = useState<TC[]>([]);
  const [especialidades, setEsps] = useState<Esp[]>([]);
  const [departamentos, setDeps]  = useState<Dep[]>([]);
  const [hcModulos, setHCMs]      = useState<HCM[]>([]);
  const [allServicios, setAllSvc] = useState<Svc[]>([]);
  const [modal, setModal]         = useState<null | 'create' | 'edit'>(null);
  const [wizardTab, setWizardTab] = useState(0);
  const [form, setForm]           = useState<any>({});
  const [error, setError]         = useState('');

  const load = useCallback(async () => {
    try {
      const [tc, esps, deps, hcms, svcs] = await Promise.all([
        adminSvc.getTiposConsulta(),
        adminSvc.getEspecialidades(),
        adminSvc.getDepartamentos(),
        adminSvc.getHCModulos(),
        adminSvc.getServicios(),
      ]);
      setItems(tc as any); setEsps(esps as any); setDeps(deps as any); setHCMs(hcms as any); setAllSvc(svcs as any);
    } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const emptyForm = () => ({
    nombre:'', descripcion:'', especialidadId:'', departamentoId:'', hcModuloId:'',
    requiereCaja:false, manejaAnestesia:false, permiteAgendamiento:true,
    controlaTiempoCita:false, abreHistoriaClinica:true, permiteCargosAdicionales:false,
    esProgramaPYP:false, manejaProtocolos:false, clasificacion:'CONSULTA', esPsicologia:false,
    duracionMinutos:30, bodegaId:'', servicios:[],
  });

  const openCreate = () => { setForm(emptyForm()); setError(''); setWizardTab(0); setModal('create'); };
  const openEdit   = (r: any) => {
    const servicios = (r.serviciosConfig || []).map((sc: any) => ({
      servicioId: sc.servicioId, esPrincipal: sc.esPrincipal,
      generaAutomatico: sc.generaAutomatico, requiereOrden: sc.requiereOrden,
      cuentaContable: sc.cuentaContable || '', centroOperacionId: sc.centroOperacionId || '',
    }));
    setForm({ ...r, servicios });
    setError(''); setWizardTab(0); setModal('edit');
  };

  const save = async () => {
    setError('');
    try {
      if (modal === 'create') await adminSvc.createTipoConsulta(form);
      else await adminSvc.updateTipoConsulta(form.id, form);
      setModal(null); load();
    } catch(e: any) { setError(e.message); }
  };

  const remove = async (r: any) => {
    if (!confirm(`¿Desactivar "${r.nombre}"?`)) return;
    try { await adminSvc.deleteTipoConsulta(r.id); load(); } catch(e: any) { alert(e.message); }
  };

  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const toggleServicio = (svcId: string) => {
    setForm((p: any) => {
      const exists = p.servicios.find((s: any) => s.servicioId === svcId);
      if (exists) return { ...p, servicios: p.servicios.filter((s: any) => s.servicioId !== svcId) };
      return { ...p, servicios: [...p.servicios, { servicioId: svcId, esPrincipal: p.servicios.length === 0, generaAutomatico: false, requiereOrden: false, cuentaContable:'', centroOperacionId:'' }] };
    });
  };

  const setPrincipal = (svcId: string) => {
    setForm((p: any) => ({
      ...p,
      servicios: p.servicios.map((s: any) => ({ ...s, esPrincipal: s.servicioId === svcId })),
    }));
  };

  const WIZARD_TABS = ['General', 'Clínica', 'Facturación', 'Servicios'];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-semibold transition">
          <Plus size={16} /> Nuevo Tipo de Consulta
        </button>
      </div>
      <DataTable items={items}
        columns={[
          { key: 'nombre', label: 'Nombre' },
          { key: 'especialidad', label: 'Especialidad', render: r => r.especialidad?.nombre || '—' },
          { key: 'departamento', label: 'Departamento', render: r => r.departamento?.nombre || '—' },
          { key: 'clasificacion', label: 'Clasificación', render: r => (
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300">{r.clasificacion}</span>
          )},
          { key: 'duracionMinutos', label: 'Duración', render: r => `${r.duracionMinutos} min` },
          { key: 'serviciosConfig', label: 'Servicios', render: r => (
            <span className="text-yellow-400 font-semibold">{r.serviciosConfig?.length || 0}</span>
          )},
        ]}
        onEdit={openEdit} onDelete={remove} emptyText="No hay tipos de consulta registrados" />

      <AnimatePresence>
        {modal && (
          <ModalWrapper title={modal === 'create' ? 'Nuevo Tipo de Consulta' : 'Editar Tipo de Consulta'} onClose={() => setModal(null)}>
            {/* Wizard Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-800/60 rounded-xl p-1">
              {WIZARD_TABS.map((t, i) => (
                <button key={t} onClick={() => setWizardTab(i)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${wizardTab === i ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Tab 0: General */}
            {wizardTab === 0 && (
              <div className="space-y-4">
                <Field label="Nombre" value={form.nombre||''} onChange={f('nombre')} required />
                <Field label="Descripción" value={form.descripcion||''} onChange={f('descripcion')} type="textarea" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Especialidad</label>
                    <select value={form.especialidadId||''} onChange={e => f('especialidadId')(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none">
                      <option value="">— Sin asignar —</option>
                      {especialidades.map((e: any) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Departamento</label>
                    <select value={form.departamentoId||''} onChange={e => f('departamentoId')(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none">
                      <option value="">— Sin asignar —</option>
                      {departamentos.map((d: any) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Módulo HC</label>
                    <select value={form.hcModuloId||''} onChange={e => f('hcModuloId')(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none">
                      <option value="">— Sin asignar —</option>
                      {hcModulos.map((h: any) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Clasificación</label>
                    <select value={form.clasificacion||'CONSULTA'} onChange={e => f('clasificacion')(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none">
                      {CLASIFICACIONES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <Field label="Duración (min)" value={String(form.duracionMinutos||30)} onChange={v => f('duracionMinutos')(Number(v))} type="number" />
                </div>
              </div>
            )}

            {/* Tab 1: Clínica */}
            {wizardTab === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Switch value={form.requiereCaja}             onChange={f('requiereCaja')}             label="Requiere Caja" />
                <Switch value={form.manejaAnestesia}          onChange={f('manejaAnestesia')}          label="Maneja Anestesia" />
                <Switch value={form.permiteAgendamiento}      onChange={f('permiteAgendamiento')}      label="Permite Agendamiento" />
                <Switch value={form.controlaTiempoCita}       onChange={f('controlaTiempoCita')}       label="Controla Tiempo Cita" />
                <Switch value={form.abreHistoriaClinica}      onChange={f('abreHistoriaClinica')}      label="Abre Historia Clínica" />
                <Switch value={form.permiteCargosAdicionales} onChange={f('permiteCargosAdicionales')} label="Cargos Adicionales" />
                <Switch value={form.esProgramaPYP}            onChange={f('esProgramaPYP')}            label="Programa PyP" />
                <Switch value={form.manejaProtocolos}         onChange={f('manejaProtocolos')}         label="Maneja Protocolos" />
                <Switch value={form.esPsicologia}             onChange={f('esPsicologia')}             label="Es Psicología" />
              </div>
            )}

            {/* Tab 2: Facturación */}
            {wizardTab === 2 && (
              <div className="space-y-4">
                <Field label="Bodega ID (opcional)" value={form.bodegaId||''} onChange={f('bodegaId')} placeholder="Ej: BOD-001" />
                <p className="text-xs text-gray-500">Los servicios facturables se asignan en la pestaña "Servicios".</p>
              </div>
            )}

            {/* Tab 3: Servicios */}
            {wizardTab === 3 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">Selecciona los servicios CUPS para este tipo de consulta. Marca uno como <span className="text-yellow-400 font-semibold">Principal</span>.</p>
                <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                  {allServicios.map((svc: any) => {
                    const sel = form.servicios?.find((s: any) => s.servicioId === svc.id);
                    return (
                      <div key={svc.id}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border transition cursor-pointer
                          ${sel ? 'border-yellow-600/50 bg-yellow-500/5' : 'border-white/5 bg-slate-800/40 hover:border-white/20'}`}
                        onClick={() => toggleServicio(svc.id)}>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                            ${sel ? 'border-yellow-400 bg-yellow-400' : 'border-gray-600'}`}>
                            {sel && <span className="text-black text-[10px] font-black">✓</span>}
                          </div>
                          <span className="text-xs text-gray-300"><span className="text-yellow-500 font-mono">{svc.codigoCups}</span> — {svc.nombre}</span>
                        </div>
                        {sel && (
                          <button type="button" onClick={e => { e.stopPropagation(); setPrincipal(svc.id); }}
                            className={`text-[10px] px-2 py-0.5 rounded-full border transition ${sel.esPrincipal ? 'bg-yellow-600 border-yellow-500 text-white' : 'border-gray-600 text-gray-400 hover:border-yellow-500 hover:text-yellow-400'}`}>
                            {sel.esPrincipal ? '★ Principal' : 'Principal'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500">{form.servicios?.length || 0} servicio(s) seleccionado(s)</p>
              </div>
            )}

            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
              <div className="flex gap-2">
                {wizardTab > 0 && (
                  <button onClick={() => setWizardTab(w => w - 1)} className="px-3 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition">← Anterior</button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition">Cancelar</button>
                {wizardTab < 3
                  ? <button onClick={() => setWizardTab(w => w + 1)} className="flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition">Siguiente <ChevronRight size={14} /></button>
                  : <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg transition"><Save size={14} /> Guardar</button>
                }
              </div>
            </div>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: PREPARACIONES
// ════════════════════════════════════════════════════════
function TabPreparaciones() {
  const [items, setItems] = useState<Prep[]>([]);
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null);
  const [form, setForm]   = useState<any>({});
  const [error, setError] = useState('');
  const [tiposConsulta, setTCs] = useState<TC[]>([]);
  const [especialidades, setEsps] = useState<Esp[]>([]);

  const load = useCallback(async () => {
    try {
      const [preps, tcs, esps] = await Promise.all([
        adminSvc.getPreparaciones(),
        adminSvc.getTiposConsulta(),
        adminSvc.getEspecialidades(),
      ]);
      setItems(preps as any); setTCs(tcs as any); setEsps(esps as any);
    } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ nombre:'', descripcion:'', tipo:'consulta', especialidadId:'', tipoConsultaId:'' }); setError(''); setModal('create'); };
  const openEdit   = (r: any) => { setForm({...r}); setError(''); setModal('edit'); };
  const save = async () => {
    setError('');
    try {
      if (modal === 'create') await adminSvc.createPreparacion(form);
      else await adminSvc.updatePreparacion(form.id, form);
      setModal(null); load();
    } catch(e: any) { setError(e.message); }
  };
  const remove = async (r: any) => {
    if (!confirm(`¿Desactivar "${r.nombre}"?`)) return;
    try { await adminSvc.deletePreparacion(r.id); load(); } catch(e: any) { alert(e.message); }
  };
  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-semibold transition">
          <Plus size={16} /> Nueva Preparación
        </button>
      </div>
      <DataTable items={items}
        columns={[
          { key: 'nombre', label: 'Nombre' },
          { key: 'tipo', label: 'Tipo', render: r => <span className="capitalize text-xs">{r.tipo}</span> },
          { key: 'descripcion', label: 'Descripción' },
          { key: 'estado', label: 'Estado', render: r => (
            <span className={`px-2 py-0.5 rounded-full text-xs ${r.estado ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {r.estado ? 'Activo' : 'Inactivo'}
            </span>
          )},
        ]}
        onEdit={openEdit} onDelete={remove} emptyText="No hay preparaciones registradas" />

      <AnimatePresence>
        {modal && (
          <ModalWrapper title={modal === 'create' ? 'Nueva Preparación' : 'Editar Preparación'} onClose={() => setModal(null)}>
            <div className="space-y-4">
              <Field label="Nombre" value={form.nombre||''} onChange={f('nombre')} required />
              <Field label="Descripción / Indicaciones" value={form.descripcion||''} onChange={f('descripcion')} type="textarea" />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tipo</label>
                  <select value={form.tipo||'consulta'} onChange={e => f('tipo')(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none">
                    <option value="consulta">Consulta</option>
                    <option value="procedimiento">Procedimiento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Especialidad (opcional)</label>
                  <select value={form.especialidadId||''} onChange={e => f('especialidadId')(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none">
                    <option value="">—</option>
                    {especialidades.map((e: any) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tipo Consulta (opcional)</label>
                  <select value={form.tipoConsultaId||''} onChange={e => f('tipoConsultaId')(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none">
                    <option value="">—</option>
                    {tiposConsulta.map((t: any) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
              </div>
              {modal === 'edit' && <Switch value={form.estado} onChange={f('estado')} label="Activo" />}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition">Cancelar</button>
                <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg transition">
                  <Save size={14} /> Guardar
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('especialidades');

  const TAB_CONTENT: Record<string, React.ReactNode> = {
    'especialidades': <TabEspecialidades />,
    'hc-modulos':     <TabHCModulos />,
    'departamentos':  <TabDepartamentos />,
    'servicios':      <TabServicios />,
    'tipos-consulta': <TabTiposConsulta />,
    'preparaciones':  <TabPreparaciones />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-5 sm:mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-yellow-600/20 rounded-xl border border-yellow-600/30">
              <Settings size={20} className="text-yellow-400" />
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">
              Parametrización del Sistema
            </h1>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm ml-1">
            Consulta Externa · Especialidades · Tipos de Consulta · CUPS · Módulos HC · Departamentos · Preparaciones
          </p>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-5 sm:mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex flex-col items-center gap-1 p-2 sm:p-3 rounded-xl border transition
                ${activeTab === t.id
                  ? 'bg-yellow-600/20 border-yellow-600/50 text-yellow-400'
                  : 'bg-slate-800/40 border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10'}`}>
              <t.icon size={16} />
              <span className="text-[9px] sm:text-[11px] font-medium text-center leading-tight">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab sidebar + contenido */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
          {/* Tab bar horizontal en móvil */}
          <div className="flex overflow-x-auto border-b border-white/5 px-4 gap-1 scrollbar-hide">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition
                  ${activeTab === t.id
                    ? 'border-yellow-500 text-yellow-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Contenido */}
          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}>
                {TAB_CONTENT[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Info normativa */}
        <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <div className="flex items-start gap-2">
            <List size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-blue-300/80">
              Este módulo es el núcleo del sistema SARAI. Su correcta parametrización garantiza el cumplimiento de las normas
              <strong className="text-blue-300"> RIPS (Res. 3374/2000)</strong>,
              <strong className="text-blue-300"> CUPS (Res. 5521/2013)</strong>,
              <strong className="text-blue-300"> Historia Clínica (Res. 1995/1999)</strong> y
              <strong className="text-blue-300"> Facturación automática</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
