import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronRight, Plus, Save, Search, Trash2 } from 'lucide-react';
import * as svc from '../../../services/adminService';
import { BulkModal, EBadge, ErrBanner, ErrBox, Field, FormFooter, Modal, SecHeader, Sel, Sw, Table } from '../components';

// ════════════════════════════════════════════════
// TAB: TIPOS DE CONSULTA
// ════════════════════════════════════════════════
const CLASIFS = [
  {value:'CONSULTA',label:'Consulta'},{value:'PROCEDIMIENTO',label:'Procedimiento'},
  {value:'CIRUGIA',label:'Cirugía'},{value:'CONTROL',label:'Control'},
];

export default function TabTiposConsulta() {
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

  // Guarda y queda en modo edición para poder asociar servicios CUPS
  const saveAndContinue = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true); setErr('');
    try {
      const result = await svc.createTipoConsulta(form) as any;
      setForm((p: any) => ({ ...p, id: result.id }));
      setModal('edit');
      loadSvcs(result.id);
      load();
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

  // Auto-guarda al entrar al tab Servicios en modo crear
  useEffect(() => {
    if (wiz === 2 && modal === 'create' && form.nombre && !savingRef.current) {
      saveAndContinue();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wiz]);

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
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
                    <span className="w-4 h-4 border-2 border-gray-500 border-t-yellow-400 rounded-full animate-spin" />
                    Guardando tipo de consulta…
                  </div>
                )}
              </div>
            )}

            {err && <ErrBox msg={err} />}

            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
              <div>{wiz > 0 && <button onClick={() => setWiz(w => w - 1)} className="px-3 py-2 text-xs text-gray-400 border border-white/10 rounded-lg hover:text-white transition">← Anterior</button>}</div>
              <div className="flex gap-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg transition">Cancelar</button>
                {wiz < TABS.length - 1 ? (
                  <button onClick={() => setWiz(w => w + 1)} className="flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition">Siguiente <ChevronRight size={13} /></button>
                ) : modal === 'edit' ? (
                  <button onClick={() => setModal(null)} className="px-4 py-2 text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg transition">Cerrar</button>
                ) : (
                  <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">{saving ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando…</> : <><Save size={13} /> Guardar</>}</button>
                )}
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
