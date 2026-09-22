/**
 * AdminPage.tsx
 * Módulo:    Parametrización del Sistema
 * Submódulo: Administración Consulta Externa
 *            → Especialidades | Tipos de Consulta | Departamentos | Cargos
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Plus, Edit2, Trash2, Save, X, Upload,
  ChevronRight, Activity, Building2, Layers,
  DollarSign, ToggleLeft, ToggleRight, Search, CheckCircle,
  AlertTriangle, ChevronDown, LayoutGrid, BookOpen, GitBranch,
  ClipboardList, RotateCcw,
  FileText, List, SlidersHorizontal, Stethoscope, Calendar, MessageSquare, Palette,
  Sparkles,
} from 'lucide-react';
import * as svc from '../../services/adminService';
import { useTheme, ThemeId } from '../../hooks/useTheme';
import TabOdontologia from './TabOdontologia';
import { BulkModal, EBadge, ErrBanner, ErrBox, Field, FormFooter, Modal, SecHeader, Sel, Sw, Table, TableSkeleton } from './components';
import { TabSedes, TabDepartamentos, TabConsultorios, TabTurnos } from './estructura-organizacional';
import { TabEspecialidades, TabTiposConsulta, TabPreparaciones, TabMotivosCita } from './consulta-externa';

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

// ════════════════════════════════════════════════
// ESTRUCTURA DE MÓDULOS/SUBMÓDULOS  (3 módulos)
// ════════════════════════════════════════════════
// TAB: TEMAS DEL SISTEMA
// ════════════════════════════════════════════════
// ════════════════════════════════════════════════
// TAB: TEMAS Y NAVEGACIÓN DEL SISTEMA
// ════════════════════════════════════════════════
function TabTemasistema() {
  const { theme, setTheme } = useTheme();
  const [navMode, setNavMode] = useState<'hub' | 'sidebar'>(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u?.preferencias?.navMode) return u.preferencias.navMode;
      }
      return (localStorage.getItem('sarai_nav_mode') as 'hub' | 'sidebar') || 'hub';
    } catch {
      return 'hub';
    }
  });

  const cambiarModoNavegacion = (nuevoModo: 'hub' | 'sidebar') => {
    setNavMode(nuevoModo);
    localStorage.setItem('sarai_nav_mode', nuevoModo);
    
    // Actualizar en localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        u.preferencias = { ...(u.preferencias || {}), navMode: nuevoModo };
        localStorage.setItem('user', JSON.stringify(u));
      }
    } catch { /* noop */ }

    // Persistir en backend
    svc.updatePreferenciasUsuario({ navMode: nuevoModo }).catch((err) => {
      console.warn('Error al guardar modo de navegación:', err);
    });
  };

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
    {
      id: 'rose-care',
      name: 'Rose Care',
      tagline: 'Rosa · Estética · Dermatología',
      desc: 'Paleta rosa suave ideal para clínicas de estética, dermatología y medicina cosmética. Transmite calidez y cuidado.',
      bg: ['#fdf2f5', '#fff5f7', '#ffffff'],
      accent: '#e11d48',
      card: '#ffffff',
      txt: '#3d0f1a',
      border: 'rgba(61,15,26,0.10)',
      swatches: ['#fdf2f5', '#e11d48', '#ffffff', '#f43f5e'],
      ideal: ['Clínicas de estética', 'Dermatología', 'Medicina cosmética'],
    },
    {
      id: 'fuchsia-premium',
      name: 'Fuchsia Premium',
      tagline: 'Fucsia · Tecnología · Innovación',
      desc: 'Diseño vibrante y moderno con acentos fucsia. Perfecto para clínicas que quieren transmitir innovación y vanguardia.',
      bg: ['#fdf4ff', '#faf0ff', '#ffffff'],
      accent: '#a21caf',
      card: '#ffffff',
      txt: '#2e0a35',
      border: 'rgba(46,10,53,0.10)',
      swatches: ['#fdf4ff', '#a21caf', '#ffffff', '#c026d3'],
      ideal: ['Tecnología médica', 'Centros de innovación', 'Clínicas modernas'],
    },
    {
      id: 'purple-care',
      name: 'Purple Care',
      tagline: 'Violeta · IA · Psicología',
      desc: 'Tonos violeta sofisticados inspirados en IA y salud mental. Ideal para psicología, neurología y terapias cognitivas.',
      bg: ['#f5f3ff', '#f8f6ff', '#ffffff'],
      accent: '#7c3aed',
      card: '#ffffff',
      txt: '#1e1040',
      border: 'rgba(30,16,64,0.10)',
      swatches: ['#f5f3ff', '#7c3aed', '#ffffff', '#8b5cf6'],
      ideal: ['Psicología clínica', 'Neurología', 'Salud mental'],
    },
    {
      id: 'arctic-blue',
      name: 'Arctic Blue Pro',
      tagline: 'Azul Nórdico · Confort Visual · Precisión',
      desc: 'Superficies slate-azul suave con contraste balanceado para reducir fatiga en turnos continuos.',
      // Fondo calibrado: no blanco reflectante, sino un grisáceo frío de bajo brillo
      bg: ['#f1f5f9', '#f8fafc', '#ffffff'], 
      accent: '#0284c7', // Sky 600 médico nítido
      card: '#ffffff',
      txt: '#0f172a', // Slate 900 de alta legibilidad
      border: 'rgba(148, 163, 184, 0.25)', // Borde definido pero sin saturar
      swatches: ['#f1f5f9', '#0284c7', '#ffffff', '#38bdf8'],
      ideal: ['Consulta Externa', 'Laboratorio', 'Imágenes Diagnósticas'],
    },
    {
      id: 'mint-premium',
      name: 'Mint Premium',
      tagline: 'Menta · Odontología · Frescura',
      desc: 'Verde menta y teal refrescantes. Diseñado para odontología, fisioterapia y servicios de bienestar integral.',
      bg: ['#f0fdfa', '#f5fffe', '#ffffff'],
      accent: '#0d9488',
      card: '#ffffff',
      txt: '#0f2d2a',
      border: 'rgba(15,45,42,0.10)',
      swatches: ['#f0fdfa', '#0d9488', '#ffffff', '#14b8a6'],
      ideal: ['Odontología', 'Fisioterapia', 'Bienestar integral'],
    },
    {
      id: 'sunset-care',
      name: 'Sunset Care',
      tagline: 'Ámbar Cálido · Calidez · Premium',
      desc: 'Tonos cálidos ámbar y dorado para consultorios que buscan transmitir cercanía, lujo y atención personalizada.',
      bg: ['#fffbf0', '#fff8e8', '#ffffff'],
      accent: '#d97706',
      card: '#ffffff',
      txt: '#2d1a0a',
      border: 'rgba(45,26,10,0.10)',
      swatches: ['#fffbf0', '#d97706', '#ffffff', '#f59e0b'],
      ideal: ['Consultorios premium', 'Medicina holística', 'Centros de relajación'],
    },
  ];

  return (
    <div style={{ maxWidth: 860 }} className="space-y-8">
      {/* ── SECCIÓN 1: MODO DE NAVEGACIÓN ── */}
      <div>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }} className="text-white">
            Modo de Navegación del Sistema
          </h2>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
            Elige la distribución de pantallas que mejor se adapte a tu flujo de trabajo diario.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Opción Hub */}
          <div
            onClick={() => cambiarModoNavegacion('hub')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              navMode === 'hub'
                ? 'bg-yellow-500/10 border-yellow-500/50 shadow-lg shadow-yellow-500/5'
                : 'bg-slate-800/40 border-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
                  <LayoutGrid size={18} />
                </div>
                <span className="text-sm font-bold text-white">Launchpad Hub</span>
              </div>
              {navMode === 'hub' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  ACTIVO
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Inicio con cuadrícula de macro-módulos e indicadores en vivo. La barra lateral solo aparece al entrar a un módulo específico.
            </p>
          </div>

          {/* Opción Barra Lateral */}
          <div
            onClick={() => cambiarModoNavegacion('sidebar')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              navMode === 'sidebar'
                ? 'bg-yellow-500/10 border-yellow-500/50 shadow-lg shadow-yellow-500/5'
                : 'bg-slate-800/40 border-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
                  <List size={18} />
                </div>
                <span className="text-sm font-bold text-white">Barra Lateral Permanente</span>
              </div>
              {navMode === 'sidebar' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  ACTIVO
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Menú lateral permanente con todos los módulos agrupados. El panel central se enfoca 100% en los indicadores del turno.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5" />

      {/* ── SECCIÓN 2: PALETA DE TEMAS ── */}
      <div>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }} className="text-white">
            Temas Visuales
          </h2>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
            Selecciona la paleta visual de SARAI. Tu preferencia se guardará en tu perfil de usuario.
          </p>
        </div>

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

                <div style={{
                  height: 108,
                  background: `linear-gradient(135deg, ${t.bg[0]}, ${t.bg[1]}, ${t.bg[2]})`,
                  padding: '10px 12px',
                  display: 'flex',
                  gap: 8,
                  overflow: 'hidden',
                }}>
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

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
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

                <div style={{
                  padding: '14px 16px',
                  background: t.bg[1],
                  borderTop: `1px solid ${t.border}`,
                }}>
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

                  <p style={{ fontSize: 11, color: `${t.txt}bb`, lineHeight: 1.55, marginBottom: 8 }}>
                    {t.desc}
                  </p>

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
                        : (['premium-light','soft-medical','rose-care','fuchsia-premium','purple-care','arctic-blue','mint-premium','sunset-care'].includes(t.id) ? '#ffffff' : '#0a0a0f'),
                    }}
                  >
                    {active ? '✓ Tema activo' : 'Activar tema'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div style={{
          marginTop: 20, padding: '12px 16px', borderRadius: 12,
          background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <SlidersHorizontal size={14} style={{ color: '#06b6d4', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#22d3ee', marginBottom: 3 }}>Sincronización en la Nube</p>
            <p style={{ fontSize: 11, color: 'rgba(34,211,238,0.6)', lineHeight: 1.55 }}>
              Tanto el tema visual como el modo de navegación se guardan en tu perfil de usuario en el servidor. Tus preferencias se mantendrán aunque cambies de computador o navegador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════

// ════════════════════════════════════════════════
// TAB: CATÁLOGO CUPS (Resolución 2706 de 2025)
// ════════════════════════════════════════════════

const NIVELES_CUPS = [
  { value: 'GRUPO',        label: 'Grupo',        cls: 'bg-purple-500/20 text-purple-300' },
  { value: 'SUBGRUPO',     label: 'Subgrupo',     cls: 'bg-blue-500/20 text-blue-300' },
  { value: 'CATEGORIA',    label: 'Categoría',    cls: 'bg-cyan-500/20 text-cyan-300' },
  { value: 'SUBCATEGORIA', label: 'Subcategoría', cls: 'bg-emerald-500/20 text-emerald-300' },
];

function nivelBadge(nivel: string) {
  const n = NIVELES_CUPS.find(x => x.value === nivel);
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${n?.cls || 'bg-slate-700 text-gray-300'}`}>
      {n?.label || nivel}
    </span>
  );
}

function TabCatalogoCUPS() {
  const [items,    setItems]    = useState<any[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [loadErr,  setLoadErr]  = useState('');
  const [search,   setSearch]   = useState('');
  const [debounced, setDebounced] = useState('');
  const [nivel,    setNivel]    = useState('');
  const [stats,    setStats]    = useState<any>(null);
  const [modal,    setModal]    = useState<null|'create'|'edit'|'bulk'>(null);
  const [form,     setForm]     = useState<any>({});
  const [err,      setErr]      = useState('');
  const [saving,   setSaving]   = useState(false);
  const savingRef = useRef(false);
  const pageSize = 50;

  // Debounce de la búsqueda
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadStats = useCallback(async () => {
    try { setStats(await svc.getCupsCodigosStats()); } catch { /* noop */ }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr('');
    try {
      const qs = new URLSearchParams();
      qs.set('page', String(page));
      qs.set('pageSize', String(pageSize));
      if (debounced) qs.set('search', debounced);
      if (nivel) qs.set('nivel', nivel);
      const res = await svc.getCupsCodigos(qs.toString()) as any;
      setItems(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (e: any) {
      setLoadErr(e?.message || 'Error al cargar el catálogo');
    } finally {
      setLoading(false);
    }
  }, [page, debounced, nivel]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const openCreate = () => { setForm({}); setErr(''); setModal('create'); };
  const openEdit   = (row: any) => { setForm({ ...row }); setErr(''); setModal('edit'); };

  const toggleActivo = async (row: any) => {
    try { await svc.updateCupsCodigo(row.id, { activo: !row.activo }); load(); loadStats(); } catch { /* noop */ }
  };

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true; setSaving(true); setErr('');
    try {
      if (modal === 'create') {
        if (!form.codigo?.trim())      throw new Error('El código es requerido');
        if (!form.descripcion?.trim()) throw new Error('La descripción es requerida');
        await svc.createCupsCodigo({
          codigo: form.codigo, descripcion: form.descripcion,
          seccion: form.seccion, capitulo: form.capitulo,
          incluye: form.incluye, excluye: form.excluye, nota: form.nota,
        });
      } else {
        await svc.updateCupsCodigo(form.id, {
          descripcion: form.descripcion, seccion: form.seccion, capitulo: form.capitulo,
          incluye: form.incluye, excluye: form.excluye, nota: form.nota,
          esFacturable: form.esFacturable,
        });
      }
      setModal(null); load(); loadStats();
    } catch (e: any) { setErr(e.message || 'Error al guardar'); }
    finally { savingRef.current = false; setSaving(false); }
  };

  const del = async (row: any) => {
    if (!confirm(`¿Desactivar el código ${row.codigoFormato}?`)) return;
    try { await svc.deleteCupsCodigo(row.id); load(); loadStats(); } catch { /* noop */ }
  };

  return (
    <>
      {/* Estadísticas */}
      {stats && (
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/70 border border-white/5 text-xs">
            <span className="text-gray-400">Total: </span>
            <span className="text-white font-bold">{stats.total?.toLocaleString('es-CO')}</span>
          </div>
          {NIVELES_CUPS.map(n => (
            <div key={n.value} className="px-3 py-1.5 rounded-lg bg-slate-800/70 border border-white/5 text-xs">
              <span className="text-gray-400">{n.label}: </span>
              <span className="text-white font-semibold">{(stats.niveles?.[n.value] || 0).toLocaleString('es-CO')}</span>
            </div>
          ))}
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <span className="text-emerald-400/80">Facturables: </span>
            <span className="text-emerald-300 font-semibold">{(stats.facturables || 0).toLocaleString('es-CO')}</span>
          </div>
        </div>
      )}

      <SecHeader title="Catálogo CUPS — Resolución 2706 de 2025" onNew={openCreate} onBulk={() => setModal('bulk')} />

      {/* Búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código sin puntos (ej. 010101) o descripción…"
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-yellow-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => { setNivel(''); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${nivel === '' ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-gray-400 hover:text-white border border-white/5'}`}>
            Todos
          </button>
          {NIVELES_CUPS.map(n => (
            <button key={n.value} onClick={() => { setNivel(n.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${nivel === n.value ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-gray-400 hover:text-white border border-white/5'}`}>
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {loadErr && <ErrBanner msg={loadErr} onRetry={load} />}

      {/* Tabla */}
      {loading && !items.length
        ? <TableSkeleton cols={4} />
        : !items.length
        ? <p className="text-center text-gray-500 py-14 text-sm">Sin resultados. Ajusta la búsqueda o usa <span className="text-yellow-500">Cargue Masivo</span>.</p>
        : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-800/70">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Código</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Nivel</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Descripción</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Fact.</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Activo</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((row: any) => (
                  <tr key={row.id} className={`hover:bg-slate-800/30 transition ${!row.activo ? 'opacity-40' : ''}`}>
                    <td className="px-4 py-2.5">
                      <code className="text-[11px] text-yellow-300 bg-slate-800/80 px-2 py-0.5 rounded border border-white/5 whitespace-nowrap">{row.codigo}</code>
                      <div className="text-[10px] text-gray-500 mt-0.5">{row.codigoFormato}</div>
                    </td>
                    <td className="px-3 py-2.5">{nivelBadge(row.nivel)}</td>
                    <td className="px-4 py-2.5 text-gray-200">{row.descripcion}</td>
                    <td className="px-3 py-2.5 text-center">
                      {row.esFacturable ? <CheckCircle size={14} className="text-emerald-400 inline" /> : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => toggleActivo(row)}
                        className={`p-1 rounded-lg transition ${row.activo ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-600 hover:bg-gray-500/10'}`}>
                        {row.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(row)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => del(row)}
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
        )
      }

      {/* Paginación */}
      {total > pageSize && (
        <div className="flex items-center justify-between gap-3 mt-3 text-xs text-gray-400">
          <span>{total.toLocaleString('es-CO')} registros · página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/5 text-gray-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition">
              Anterior
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/5 text-gray-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition">
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <Modal title={modal === 'create' ? 'Nuevo código CUPS' : `Editar código ${form.codigoFormato || ''}`} onClose={() => setModal(null)}>
            <div className="space-y-4">
              {modal === 'create'
                ? (
                  <>
                    <Field label="Código (solo dígitos: 2, 3, 4 o 6)" value={form.codigo || ''} onChange={f('codigo')} required placeholder="Ej: 01 · 010 · 0101 · 010101" />
                    <p className="text-[11px] text-gray-500 -mt-2">El nivel (Grupo/Subgrupo/Categoría/Subcategoría) se deduce de la cantidad de dígitos.</p>
                  </>
                )
                : (
                  <div className="flex items-center gap-2 p-3 bg-slate-800/60 rounded-xl border border-white/5">
                    <code className="text-xs text-yellow-400">{form.codigoFormato}</code>
                    {nivelBadge(form.nivel)}
                  </div>
                )
              }
              <Field label="Descripción *" value={form.descripcion || ''} onChange={f('descripcion')} required type="textarea" placeholder="Nombre del procedimiento" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Sección" value={form.seccion || ''} onChange={f('seccion')} placeholder="Opcional" />
                <Field label="Capítulo" value={form.capitulo || ''} onChange={f('capitulo')} placeholder="Opcional" />
              </div>
              <Field label="Incluye" value={form.incluye || ''} onChange={f('incluye')} type="textarea" placeholder="Notas de inclusión (opcional)" />
              <Field label="Excluye" value={form.excluye || ''} onChange={f('excluye')} type="textarea" placeholder="Notas de exclusión (opcional)" />
              <Field label="Nota" value={form.nota || ''} onChange={f('nota')} type="textarea" placeholder="Nota aclaratoria (opcional)" />
              {modal === 'edit' && (
                <Sw value={!!form.esFacturable} onChange={f('esFacturable')} label="Es facturable" />
              )}
              {err && <ErrBox msg={err} />}
              <FormFooter onCancel={() => setModal(null)} onSave={save} saving={saving} />
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Cargue masivo por archivo plano */}
      <AnimatePresence>
        {modal === 'bulk' && (
          <BulkModal
            title="Cargue masivo de códigos CUPS"
            headers={['codigo', 'descripcion', 'seccion', 'capitulo', 'incluye', 'excluye', 'nota']}
            filename="plantilla_cups.csv"
            onUpload={async (rows) => { const r = await svc.bulkCupsCodigos(rows) as any; load(); loadStats(); return r; }}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════
// TAB: TARIFAS — Clasificación (Grupos y Tipos de cargo)
// ════════════════════════════════════════════════
function TabTarifaClasificacion() {
  const [grupos, setGrupos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<null | 'grupo' | 'tipo'>(null);
  const [form, setForm] = useState<any>({});
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setLoadErr('');
    try { setGrupos(await svc.getTarifaGrupos() as any[]); }
    catch (e: any) { setLoadErr(e?.message || 'Error al cargar la clasificación'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const openGrupo = (g?: any) => { setForm(g ? { ...g } : {}); setErr(''); setModal('grupo'); };
  const openTipo = (grupoId: string, t?: any) => { setForm(t ? { ...t } : { grupoId }); setErr(''); setModal('tipo'); };

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true; setSaving(true); setErr('');
    try {
      if (modal === 'grupo') {
        if (!form.codigo?.trim()) throw new Error('El código es requerido');
        if (!form.nombre?.trim()) throw new Error('El nombre es requerido');
        if (form.id) await svc.updateTarifaGrupo(form.id, { nombre: form.nombre });
        else await svc.createTarifaGrupo({ codigo: form.codigo, nombre: form.nombre });
      } else {
        if (!form.codigo?.trim()) throw new Error('El código es requerido');
        if (!form.nombre?.trim()) throw new Error('El nombre es requerido');
        if (form.id) await svc.updateTarifaTipo(form.id, { nombre: form.nombre });
        else await svc.createTarifaTipo({ grupoId: form.grupoId, codigo: form.codigo, nombre: form.nombre });
      }
      setModal(null); load();
    } catch (e: any) { setErr(e.message || 'Error al guardar'); }
    finally { savingRef.current = false; setSaving(false); }
  };

  const toggleGrupo = async (g: any) => { try { await svc.updateTarifaGrupo(g.id, { activo: !g.activo }); load(); } catch { /* */ } };
  const toggleTipo = async (t: any) => { try { await svc.updateTarifaTipo(t.id, { activo: !t.activo }); load(); } catch { /* */ } };

  return (
    <>
      <SecHeader title="Clasificación de cargos — Grupos y Tipos" onNew={() => openGrupo()} />
      {loadErr && <ErrBanner msg={loadErr} onRetry={load} />}
      {loading
        ? <TableSkeleton cols={3} />
        : !grupos.length
        ? <p className="text-center text-gray-500 py-14 text-sm">Aún no hay grupos. Crea el primero con <span className="text-yellow-500">Nuevo</span>.</p>
        : (
          <div className="space-y-2">
            {grupos.map((g: any) => (
              <div key={g.id} className={`rounded-xl border border-white/5 bg-slate-800/40 ${!g.activo ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2 px-4 py-2.5">
                  <button onClick={() => setExpanded(p => ({ ...p, [g.id]: !p[g.id] }))} className="text-gray-400 hover:text-white">
                    {expanded[g.id] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>
                  <code className="text-[11px] text-yellow-300 bg-slate-800/80 px-2 py-0.5 rounded border border-white/5">{g.codigo}</code>
                  <span className="text-sm text-white font-semibold flex-1">{g.nombre}</span>
                  <span className="text-[11px] text-gray-500">{g.tipos?.length || 0} tipos · {g._count?.cargos || 0} cargos</span>
                  <button onClick={() => openTipo(g.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition" title="Agregar tipo"><Plus size={13} /></button>
                  <button onClick={() => openGrupo(g)} className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition"><Edit2 size={13} /></button>
                  <button onClick={() => toggleGrupo(g)} className={`p-1.5 rounded-lg transition ${g.activo ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-600 hover:bg-gray-500/10'}`}>{g.activo ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}</button>
                </div>
                {expanded[g.id] && (
                  <div className="px-4 pb-3 pl-12 space-y-1">
                    {(!g.tipos || !g.tipos.length)
                      ? <p className="text-[11px] text-gray-500 py-1">Sin tipos. Usa el botón <span className="text-emerald-400">+</span> para agregar.</p>
                      : g.tipos.map((t: any) => (
                        <div key={t.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 ${!t.activo ? 'opacity-50' : ''}`}>
                          <code className="text-[10px] text-gray-300 bg-slate-900/80 px-1.5 py-0.5 rounded">{t.codigo}</code>
                          <span className="text-xs text-gray-200 flex-1">{t.nombre}</span>
                          <button onClick={() => openTipo(g.id, t)} className="p-1 rounded text-gray-400 hover:text-yellow-400 transition"><Edit2 size={12} /></button>
                          <button onClick={() => toggleTipo(t)} className={`p-1 rounded transition ${t.activo ? 'text-emerald-400' : 'text-gray-600'}`}>{t.activo ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}</button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      <AnimatePresence>
        {modal && (
          <Modal title={modal === 'grupo' ? (form.id ? 'Editar grupo' : 'Nuevo grupo') : (form.id ? 'Editar tipo' : 'Nuevo tipo de cargo')} onClose={() => setModal(null)} maxW="max-w-md">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Field label="Código" value={form.codigo || ''} onChange={f('codigo')} required placeholder="Ej: PROC" />
                </div>
                <div className="col-span-2">
                  <Field label="Nombre" value={form.nombre || ''} onChange={f('nombre')} required placeholder="Ej: Procedimientos" />
                </div>
              </div>
              {form.id && <p className="text-[11px] text-gray-500 -mt-2">El código no se puede cambiar.</p>}
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
// TAB: TARIFAS — Cargos (catálogo interno + equivalencia CUPS)
// ════════════════════════════════════════════════
function TabCargosTarifa() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [grupoId, setGrupoId] = useState('');
  const [grupos, setGrupos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [modal, setModal] = useState<null | 'create' | 'edit' | 'bulk'>(null);
  const [form, setForm] = useState<any>({});
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const pageSize = 50;

  useEffect(() => { const t = setTimeout(() => { setDebounced(search.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [search]);

  const load = useCallback(async () => {
    setLoading(true); setLoadErr('');
    try {
      const qs = new URLSearchParams();
      qs.set('page', String(page)); qs.set('pageSize', String(pageSize));
      if (debounced) qs.set('search', debounced);
      if (grupoId) qs.set('grupoId', grupoId);
      const res = await svc.getCargosTarifa(qs.toString()) as any;
      setItems(res.items || []); setTotal(res.total || 0); setTotalPages(res.totalPages || 1);
    } catch (e: any) { setLoadErr(e?.message || 'Error al cargar los cargos'); }
    finally { setLoading(false); }
  }, [page, debounced, grupoId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { svc.getTarifaGrupos().then(g => setGrupos(g as any[])).catch(() => {}); svc.getCargosTarifaStats().then(setStats).catch(() => {}); }, []);

  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const tiposDelGrupo = (gid: string) => grupos.find(g => g.id === gid)?.tipos || [];
  const openCreate = () => { setForm({}); setErr(''); setModal('create'); };
  const openEdit = (row: any) => { setForm({ ...row, cupsCodigo: row.cupsCodigoStr || '', grupoId: row.grupoId || '', tipoId: row.tipoId || '' }); setErr(''); setModal('edit'); };

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true; setSaving(true); setErr('');
    try {
      if (modal === 'create') {
        if (!form.codigo?.trim()) throw new Error('El código es requerido');
        if (!form.descripcion?.trim()) throw new Error('La descripción es requerida');
        await svc.createCargoTarifa({
          codigo: form.codigo, descripcion: form.descripcion, cupsCodigo: form.cupsCodigo,
          grupoId: form.grupoId, tipoId: form.tipoId, nivel: form.nivel, tipoUnidad: form.tipoUnidad, conceptoRips: form.conceptoRips,
        });
      } else {
        await svc.updateCargoTarifa(form.id, {
          descripcion: form.descripcion, cupsCodigo: form.cupsCodigo,
          grupoId: form.grupoId, tipoId: form.tipoId, nivel: form.nivel, tipoUnidad: form.tipoUnidad, conceptoRips: form.conceptoRips,
        });
      }
      setModal(null); load(); svc.getCargosTarifaStats().then(setStats).catch(() => {});
    } catch (e: any) { setErr(e.message || 'Error al guardar'); }
    finally { savingRef.current = false; setSaving(false); }
  };

  const toggleActivo = async (row: any) => { try { await svc.updateCargoTarifa(row.id, { activo: !row.activo }); load(); } catch { /* */ } };
  const del = async (row: any) => { if (!confirm(`¿Desactivar el cargo ${row.codigo}?`)) return; try { await svc.deleteCargoTarifa(row.id); load(); } catch { /* */ } };

  return (
    <>
      {stats && (
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/70 border border-white/5 text-xs"><span className="text-gray-400">Total: </span><span className="text-white font-bold">{stats.total?.toLocaleString('es-CO')}</span></div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/70 border border-white/5 text-xs"><span className="text-gray-400">Activos: </span><span className="text-white font-semibold">{stats.activos?.toLocaleString('es-CO')}</span></div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs"><span className="text-emerald-400/80">Con CUPS: </span><span className="text-emerald-300 font-semibold">{stats.conCups?.toLocaleString('es-CO')}</span></div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs"><span className="text-amber-400/80">Sin equivalencia: </span><span className="text-amber-300 font-semibold">{stats.sinCups?.toLocaleString('es-CO')}</span></div>
        </div>
      )}

      <SecHeader title="Cargos / Servicios — equivalencia con CUPS" onNew={openCreate} onBulk={() => setModal('bulk')} />

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código, descripción o CUPS…"
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-yellow-500 focus:outline-none" />
        </div>
        <select value={grupoId} onChange={e => { setGrupoId(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none">
          <option value="">Todos los grupos</option>
          {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
        </select>
      </div>

      {loadErr && <ErrBanner msg={loadErr} onRetry={load} />}

      {loading && !items.length
        ? <TableSkeleton cols={5} />
        : !items.length
        ? <p className="text-center text-gray-500 py-14 text-sm">Sin resultados. Ajusta la búsqueda o usa <span className="text-yellow-500">Cargue Masivo</span>.</p>
        : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-800/70">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Código</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Descripción</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Equivalencia CUPS</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Clasificación</th>
                <th className="text-center px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Activo</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {items.map((row: any) => (
                  <tr key={row.id} className={`hover:bg-slate-800/30 transition ${!row.activo ? 'opacity-40' : ''}`}>
                    <td className="px-4 py-2.5"><code className="text-[11px] text-yellow-300 bg-slate-800/80 px-2 py-0.5 rounded border border-white/5 whitespace-nowrap">{row.codigo}</code></td>
                    <td className="px-4 py-2.5 text-gray-200">{row.descripcion}</td>
                    <td className="px-3 py-2.5">
                      {row.cupsCodigo
                        ? <span className="inline-flex items-center gap-1.5"><code className="text-[10px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{row.cupsCodigo.codigoFormato}</code><span className="text-[10px] text-gray-500 max-w-[180px] truncate">{row.cupsCodigo.descripcion}</span></span>
                        : <span className="text-gray-600 text-[11px]">— sin equivalencia</span>}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-gray-400">{row.grupo ? `${row.grupo.nombre}${row.tipo ? ' · ' + row.tipo.nombre : ''}` : '—'}</td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => toggleActivo(row)} className={`p-1 rounded-lg transition ${row.activo ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-600 hover:bg-gray-500/10'}`}>{row.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}</button>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition"><Edit2 size={13} /></button>
                        <button onClick={() => del(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {total > pageSize && (
        <div className="flex items-center justify-between gap-3 mt-3 text-xs text-gray-400">
          <span>{total.toLocaleString('es-CO')} registros · página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/5 text-gray-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition">Anterior</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/5 text-gray-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition">Siguiente</button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <Modal title={modal === 'create' ? 'Nuevo cargo' : `Editar cargo ${form.codigo || ''}`} onClose={() => setModal(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">{modal === 'create'
                  ? <Field label="Código interno *" value={form.codigo || ''} onChange={f('codigo')} required placeholder="Ej: SRV-001" />
                  : <div><label className="block text-xs text-gray-400 mb-1">Código</label><div className="px-3 py-2 bg-slate-800/60 rounded-lg border border-white/5"><code className="text-xs text-yellow-400">{form.codigo}</code></div></div>}
                </div>
                <div className="col-span-2"><Field label="Descripción *" value={form.descripcion || ''} onChange={f('descripcion')} required placeholder="Nombre del servicio/cargo" /></div>
              </div>
              <Field label="Equivalencia CUPS (código sin puntos)" value={form.cupsCodigo || ''} onChange={f('cupsCodigo')} placeholder="Ej: 010101 (opcional)" />
              <p className="text-[11px] text-gray-500 -mt-2">Si el código existe en el catálogo CUPS (Res. 2706), se vincula automáticamente.</p>
              <div className="grid grid-cols-2 gap-3">
                <Sel label="Grupo" value={form.grupoId || ''} onChange={v => setForm((p: any) => ({ ...p, grupoId: v, tipoId: '' }))} options={[{ value: '', label: '— Sin grupo —' }, ...grupos.map(g => ({ value: g.id, label: g.nombre }))]} />
                <Sel label="Tipo" value={form.tipoId || ''} onChange={f('tipoId')} options={[{ value: '', label: '— Sin tipo —' }, ...tiposDelGrupo(form.grupoId).map((t: any) => ({ value: t.id, label: t.nombre }))]} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Nivel" value={form.nivel || ''} onChange={f('nivel')} placeholder="Opc." />
                <Field label="Unidad" value={form.tipoUnidad || ''} onChange={f('tipoUnidad')} placeholder="Opc." />
                <Field label="Concepto RIPS" value={form.conceptoRips || ''} onChange={f('conceptoRips')} placeholder="Opc." />
              </div>
              {err && <ErrBox msg={err} />}
              <FormFooter onCancel={() => setModal(null)} onSave={save} saving={saving} />
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal === 'bulk' && (
          <BulkModal title="Cargue masivo de cargos"
            headers={['codigo', 'descripcion', 'cupsCodigo', 'grupo', 'tipo', 'nivel', 'tipoUnidad', 'conceptoRips']}
            filename="plantilla_cargos.csv"
            onUpload={async (rows) => { const r = await svc.bulkCargosTarifa(rows) as any; load(); svc.getCargosTarifaStats().then(setStats).catch(() => {}); return r; }}
            onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════
// TAB: TARIFAS — Tarifarios (listas de precios)
// ════════════════════════════════════════════════
function TabTarifarios() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [sel, setSel] = useState<any>(null); // tarifario seleccionado (vista de precios)
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null);
  const [form, setForm] = useState<any>({});
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setLoadErr('');
    try { setList(await svc.getTarifarios() as any[]); }
    catch (e: any) { setLoadErr(e?.message || 'Error al cargar los tarifarios'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const toDateInput = (d: any) => d ? new Date(d).toISOString().slice(0, 10) : '';
  const openCreate = () => { setForm({}); setErr(''); setModal('create'); };
  const openEdit = (t: any) => { setForm({ ...t, baseId: t.baseId || '', vigenciaDesde: toDateInput(t.vigenciaDesde), vigenciaHasta: toDateInput(t.vigenciaHasta) }); setErr(''); setModal('edit'); };

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true; setSaving(true); setErr('');
    try {
      if (!form.codigo?.trim()) throw new Error('El código es requerido');
      if (!form.nombre?.trim()) throw new Error('El nombre es requerido');
      const body = {
        codigo: form.codigo, nombre: form.nombre, descripcion: form.descripcion, tipo: form.tipo,
        baseId: form.baseId, porcentaje: form.porcentaje, vigenciaDesde: form.vigenciaDesde, vigenciaHasta: form.vigenciaHasta,
      };
      if (modal === 'create') await svc.createTarifario(body);
      else await svc.updateTarifario(form.id, body);
      setModal(null); load();
    } catch (e: any) { setErr(e.message || 'Error al guardar'); }
    finally { savingRef.current = false; setSaving(false); }
  };

  const toggleActivo = async (t: any) => { try { await svc.updateTarifario(t.id, { activo: !t.activo }); load(); } catch { /* */ } };
  const del = async (t: any) => { if (!confirm(`¿Desactivar el tarifario ${t.nombre}?`)) return; try { await svc.deleteTarifario(t.id); load(); } catch { /* */ } };

  if (sel) return <TarifarioDetalle tarifario={sel} onBack={() => { setSel(null); load(); }} tarifarios={list} />;

  return (
    <>
      <SecHeader title="Tarifarios — listas de precios" onNew={openCreate} />
      {loadErr && <ErrBanner msg={loadErr} onRetry={load} />}
      {loading
        ? <TableSkeleton cols={4} />
        : !list.length
        ? <p className="text-center text-gray-500 py-14 text-sm">Aún no hay tarifarios. Crea el primero con <span className="text-yellow-500">Nuevo</span>.</p>
        : (
          <div className="grid gap-2 sm:grid-cols-2">
            {list.map((t: any) => (
              <div key={t.id} className={`rounded-xl border border-white/5 bg-slate-800/40 p-4 ${!t.activo ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] text-yellow-300 bg-slate-800/80 px-2 py-0.5 rounded border border-white/5">{t.codigo}</code>
                      {t.tipo && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/70 text-gray-300">{t.tipo}</span>}
                    </div>
                    <h3 className="text-sm text-white font-semibold mt-1.5 truncate">{t.nombre}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {t._count?.items || 0} ítems
                      {t.base && <span> · base: {t.base.nombre}{t.porcentaje != null ? ` (${t.porcentaje}%)` : ''}</span>}
                    </p>
                  </div>
                  <button onClick={() => toggleActivo(t)} className={`p-1 rounded-lg transition flex-shrink-0 ${t.activo ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-600 hover:bg-gray-500/10'}`}>{t.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}</button>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                  <button onClick={() => setSel(t)} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600/90 hover:bg-yellow-500 text-white rounded-lg text-xs font-semibold transition"><DollarSign size={13} /> Gestionar precios</button>
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition"><Edit2 size={13} /></button>
                  <button onClick={() => del(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

      <AnimatePresence>
        {modal && (
          <Modal title={modal === 'create' ? 'Nuevo tarifario' : `Editar ${form.nombre || ''}`} onClose={() => setModal(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">{modal === 'create'
                  ? <Field label="Código *" value={form.codigo || ''} onChange={f('codigo')} required placeholder="Ej: PART" />
                  : <div><label className="block text-xs text-gray-400 mb-1">Código</label><div className="px-3 py-2 bg-slate-800/60 rounded-lg border border-white/5"><code className="text-xs text-yellow-400">{form.codigo}</code></div></div>}
                </div>
                <div className="col-span-2"><Field label="Nombre *" value={form.nombre || ''} onChange={f('nombre')} required placeholder="Ej: Particular 2026" /></div>
              </div>
              <Field label="Descripción" value={form.descripcion || ''} onChange={f('descripcion')} placeholder="Opcional" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo" value={form.tipo || ''} onChange={f('tipo')} placeholder="PARTICULAR, EPS, SOAT…" />
                <Sel label="Tarifario base (opcional)" value={form.baseId || ''} onChange={f('baseId')} options={[{ value: '', label: '— Ninguno —' }, ...list.filter(x => x.id !== form.id).map(x => ({ value: x.id, label: x.nombre }))]} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="% sobre base" value={form.porcentaje != null ? String(form.porcentaje) : ''} onChange={f('porcentaje')} type="number" placeholder="Ej: 110" />
                <Field label="Vigencia desde" value={form.vigenciaDesde || ''} onChange={f('vigenciaDesde')} type="date" />
                <Field label="Vigencia hasta" value={form.vigenciaHasta || ''} onChange={f('vigenciaHasta')} type="date" />
              </div>
              <p className="text-[11px] text-gray-500 -mt-2">El % se aplica al generar precios desde la base (110 = +10%). Lo haces dentro de "Gestionar precios".</p>
              {err && <ErrBox msg={err} />}
              <FormFooter onCancel={() => setModal(null)} onSave={save} saving={saving} />
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Vista de detalle: precios (ítems) de un tarifario ─────────
function TarifarioDetalle({ tarifario, onBack, tarifarios }: { tarifario: any; onBack: () => void; tarifarios: any[] }) {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [modal, setModal] = useState<null | 'add' | 'bulk' | 'base'>(null);
  const [edicion, setEdicion] = useState<Record<string, string>>({});
  const pageSize = 50;
  const base = tarifarios.find(x => x.id === tarifario.baseId);

  useEffect(() => { const t = setTimeout(() => { setDebounced(search.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [search]);

  const load = useCallback(async () => {
    setLoading(true); setLoadErr('');
    try {
      const qs = new URLSearchParams(); qs.set('page', String(page)); qs.set('pageSize', String(pageSize));
      if (debounced) qs.set('search', debounced);
      const res = await svc.getTarifarioItems(tarifario.id, qs.toString()) as any;
      setItems(res.items || []); setTotal(res.total || 0); setTotalPages(res.totalPages || 1);
    } catch (e: any) { setLoadErr(e?.message || 'Error al cargar los precios'); }
    finally { setLoading(false); }
  }, [tarifario.id, page, debounced]);
  useEffect(() => { load(); }, [load]);

  const guardarPrecio = async (item: any) => {
    const val = edicion[item.id];
    if (val === undefined) return;
    const precio = Number(val);
    if (!Number.isFinite(precio) || precio < 0) return;
    try { await svc.upsertTarifarioItem(tarifario.id, { cargoId: item.cargo.id, precio }); setEdicion(p => { const n = { ...p }; delete n[item.id]; return n; }); load(); } catch { /* */ }
  };
  const delItem = async (item: any) => { if (!confirm(`¿Quitar ${item.cargo.codigo} del tarifario?`)) return; try { await svc.deleteTarifarioItem(tarifario.id, item.id); load(); } catch { /* */ } };

  return (
    <>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-3 transition"><ChevronRight size={14} className="rotate-180" /> Volver a tarifarios</button>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2"><DollarSign size={15} className="text-yellow-500" /> {tarifario.nombre}</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Código {tarifario.codigo}{tarifario.tipo ? ` · ${tarifario.tipo}` : ''}{base ? ` · base: ${base.nombre} (${tarifario.porcentaje ?? 100}%)` : ''}</p>
        </div>
        <div className="flex gap-2">
          {tarifario.baseId && <button onClick={() => setModal('base')} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg text-xs font-semibold border border-white/10 transition"><RotateCcw size={13} /> Generar desde base</button>}
          <button onClick={() => setModal('bulk')} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg text-xs font-semibold border border-white/10 transition"><Upload size={13} /> Cargue Masivo</button>
          <button onClick={() => setModal('add')} className="flex items-center gap-1.5 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-xs font-semibold transition"><Plus size={13} /> Agregar cargo</button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cargo por código, descripción o CUPS…"
          className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-yellow-500 focus:outline-none" />
      </div>

      {loadErr && <ErrBanner msg={loadErr} onRetry={load} />}

      {loading && !items.length
        ? <TableSkeleton cols={4} />
        : !items.length
        ? <p className="text-center text-gray-500 py-14 text-sm">Este tarifario no tiene precios aún. Agrega cargos o usa <span className="text-yellow-500">Cargue Masivo</span>.</p>
        : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-800/70">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Cargo</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Descripción</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">CUPS</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Precio (COP)</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {items.map((it: any) => (
                  <tr key={it.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-2.5"><code className="text-[11px] text-yellow-300 bg-slate-800/80 px-2 py-0.5 rounded border border-white/5 whitespace-nowrap">{it.cargo.codigo}</code></td>
                    <td className="px-4 py-2.5 text-gray-200">{it.cargo.descripcion}</td>
                    <td className="px-3 py-2.5">{it.cargo.cupsCodigoStr ? <code className="text-[10px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{it.cargo.cupsCodigoStr}</code> : <span className="text-gray-600">—</span>}</td>
                    <td className="px-4 py-2.5 text-right">
                      <input type="number" value={edicion[it.id] ?? String(it.precio)}
                        onChange={e => setEdicion(p => ({ ...p, [it.id]: e.target.value }))}
                        onBlur={() => guardarPrecio(it)} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        className={`w-28 text-right bg-slate-800 border rounded-lg px-2 py-1 text-white focus:outline-none ${edicion[it.id] !== undefined ? 'border-yellow-500' : 'border-slate-700 focus:border-yellow-500'}`} />
                    </td>
                    <td className="px-4 py-2.5 text-right"><button onClick={() => delItem(it)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"><Trash2 size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {total > pageSize && (
        <div className="flex items-center justify-between gap-3 mt-3 text-xs text-gray-400">
          <span>{total.toLocaleString('es-CO')} ítems · página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/5 text-gray-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition">Anterior</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/5 text-gray-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition">Siguiente</button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {modal === 'add' && <AgregarCargoModal tarifarioId={tarifario.id} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
        {modal === 'base' && <GenerarBaseModal tarifario={tarifario} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
        {modal === 'bulk' && (
          <BulkModal title="Cargue masivo de precios"
            headers={['cargo', 'precio']} filename="plantilla_precios.csv"
            onUpload={async (rows) => { const r = await svc.bulkTarifarioItems(tarifario.id, rows) as any; load(); return { created: r.created, skipped: r.updated, errors: r.errors }; }}
            onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Modal: buscar y agregar un cargo con precio ───────────────
function AgregarCargoModal({ tarifarioId, onClose, onSaved }: { tarifarioId: string; onClose: () => void; onSaved: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [cargo, setCargo] = useState<any>(null);
  const [precio, setPrecio] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cargo || q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try { const r = await svc.getCargosTarifa(`search=${encodeURIComponent(q.trim())}&pageSize=8&activo=true`) as any; setResults(r.items || []); } catch { /* */ }
    }, 300);
    return () => clearTimeout(t);
  }, [q, cargo]);

  const save = async () => {
    setErr('');
    if (!cargo) { setErr('Selecciona un cargo'); return; }
    const p = Number(precio);
    if (!Number.isFinite(p) || p < 0) { setErr('Precio inválido'); return; }
    setSaving(true);
    try { await svc.upsertTarifarioItem(tarifarioId, { cargoId: cargo.id, precio: p }); onSaved(); }
    catch (e: any) { setErr(e.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Agregar cargo al tarifario" onClose={onClose} maxW="max-w-md">
      <div className="space-y-4">
        {!cargo ? (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Buscar cargo</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={q} onChange={e => setQ(e.target.value)} autoFocus placeholder="Código, descripción o CUPS…"
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-yellow-500 focus:outline-none" />
            </div>
            {results.length > 0 && (
              <div className="mt-2 rounded-lg border border-white/5 divide-y divide-white/5 max-h-56 overflow-y-auto">
                {results.map(r => (
                  <button key={r.id} onClick={() => { setCargo(r); setResults([]); }} className="w-full text-left px-3 py-2 hover:bg-slate-800/60 transition flex items-center gap-2">
                    <code className="text-[10px] text-yellow-300 bg-slate-800/80 px-1.5 py-0.5 rounded">{r.codigo}</code>
                    <span className="text-xs text-gray-200 flex-1 truncate">{r.descripcion}</span>
                    {r.cupsCodigoStr && <code className="text-[10px] text-emerald-300">{r.cupsCodigoStr}</code>}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-slate-800/60 rounded-xl border border-white/5">
            <code className="text-[11px] text-yellow-300 bg-slate-800/80 px-2 py-0.5 rounded">{cargo.codigo}</code>
            <span className="text-xs text-gray-200 flex-1 truncate">{cargo.descripcion}</span>
            <button onClick={() => setCargo(null)} className="text-gray-500 hover:text-white"><X size={14} /></button>
          </div>
        )}
        <Field label="Precio (COP)" value={precio} onChange={setPrecio} type="number" placeholder="Ej: 150000" />
        {err && <ErrBox msg={err} />}
        <FormFooter onCancel={onClose} onSave={save} saving={saving} />
      </div>
    </Modal>
  );
}

// ─── Modal: generar precios desde el tarifario base ────────────
function GenerarBaseModal({ tarifario, onClose, onDone }: { tarifario: any; onClose: () => void; onDone: () => void }) {
  const [sobrescribir, setSobrescribir] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');

  const generar = async () => {
    setSaving(true); setErr('');
    try { const r = await svc.generarTarifarioBase(tarifario.id, { sobrescribir }) as any; setResult(r); }
    catch (e: any) { setErr(e.message || 'Error al generar'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Generar precios desde la base" onClose={onClose} maxW="max-w-md">
      <div className="space-y-4">
        <p className="text-xs text-gray-300">Se copiarán los precios del tarifario base aplicando el <span className="text-yellow-400 font-semibold">{tarifario.porcentaje ?? 100}%</span> configurado.</p>
        <Sw value={sobrescribir} onChange={setSobrescribir} label="Sobrescribir precios que ya existen en este tarifario" />
        {result && (
          <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
            <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <div><p className="font-semibold">¡Listo!</p><p>Creados: {result.creados} · Actualizados: {result.actualizados} · Omitidos: {result.omitidos}</p></div>
          </div>
        )}
        {err && <ErrBox msg={err} />}
        <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
          <button onClick={result ? onDone : onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition">{result ? 'Cerrar' : 'Cancelar'}</button>
          {!result && <button onClick={generar} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition">{saving ? 'Generando…' : <><RotateCcw size={14} /> Generar</>}</button>}
        </div>
      </div>
    </Modal>
  );
}

const MODULOS = [
  {
    id: 'estructura',
    label: 'Estructura Física & Departamentos',
    icon: Building2,
    submodulos: [
      { id:'sedes',                   label:'Sedes (REPS)',              icon:Building2,  component:TabSedes },
      { id:'departamentos-servicios', label:'Departamentos / Servicios', icon:Layers,     component:TabDepartamentos },
      { id:'consultorios-recursos',   label:'Consultorios / Recursos',   icon:LayoutGrid, component:TabConsultorios },
      { id:'turnos',                  label:'Turnos (Agenda)',           icon:Calendar,   component:TabTurnos },
    ],
  },
  {
    id: 'consulta-externa',
    label: 'Catálogos Consulta Externa',
    icon: Stethoscope,
    submodulos: [
      { id:'especialidades',      label:'Especialidades',           icon:Activity,      component:TabEspecialidades },
      { id:'tipos-consulta-cups', label:'Tipos de Consulta & CUPS', icon:Layers,        component:TabTiposConsulta  },
      { id:'preparaciones',       label:'Preparaciones',            icon:BookOpen,      component:TabPreparaciones  },
      { id:'motivos-cita',        label:'Motivos de Cita',          icon:MessageSquare, component:TabMotivosCita    },
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
    id: 'catalogo-cups',
    label: 'Catálogo CUPS',
    icon: BookOpen,
    submodulos: [
      { id:'cups-codigos',      label:'Códigos CUPS (Res. 2706/2025)', icon:Layers, component:TabCatalogoCUPS },
    ],
  },
  {
    id: 'tarifas',
    label: 'Tarifas y Tarifarios',
    icon: DollarSign,
    submodulos: [
      { id:'tarifa-clasificacion', label:'Clasificación (Grupos/Tipos)', icon:GitBranch,    component:TabTarifaClasificacion },
      { id:'cargos-tarifa',        label:'Cargos / Equivalencia CUPS',  icon:List,         component:TabCargosTarifa       },
      { id:'tarifarios',           label:'Tarifarios (Listas de precio)', icon:DollarSign,  component:TabTarifarios         },
    ],
  },
  {
    id: 'odontologia',
    label: 'Odontología',
    icon: Sparkles,
    submodulos: [
      { id:'odonto-catalogos',  label:'Catálogos Clínicos',   icon:Sparkles,      component:TabOdontologia         },
    ],
  },
  {
    id: 'config-general',
    label: 'Configuración General',
    icon: SlidersHorizontal,
    submodulos: [
      { id:'config-clinica',    label:'Datos de la Clínica', icon:Stethoscope,   component:TabConfigClinica       },
      { id:'param-agenda',      label:'Parámetros de Agenda',icon:Calendar,      component:TabParamAgenda         },
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
export default function AdminPage({
  initialModuloId = 'estructura',
  initialSubmoduloId = 'sedes',
}: { initialModuloId?: string; initialSubmoduloId?: string } = {}) {
  const [activeMod, setActiveMod] = useState(initialModuloId);
  const [activeSub, setActiveSub] = useState(initialSubmoduloId);
  const [expanded,  setExpanded]  = useState(initialModuloId);

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
