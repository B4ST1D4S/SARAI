import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import * as svc from '../../../services/adminService';
import { EBadge, ErrBanner, ErrBox, Field, FormFooter, Modal, SecHeader, Sel, Sw, Table } from '../components';

// ════════════════════════════════════════════════
// TAB: PREPARACIONES / RECOMENDACIONES MÉDICAS
// ════════════════════════════════════════════════
const TIPOS_PREP = [
  { value: 'consulta',      label: 'Consulta'      },
  { value: 'procedimiento', label: 'Procedimiento' },
  { value: 'cirugia',       label: 'Cirugía'       },
  { value: 'general',       label: 'General'       },
];

export default function TabPreparaciones() {
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
