import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import * as svc from '../../../services/adminService';
import { BulkModal, EBadge, ErrBanner, ErrBox, Field, FormFooter, Modal, SecHeader, Sw, Table } from '../components';

// ════════════════════════════════════════════════
// TAB: ESPECIALIDADES
// ════════════════════════════════════════════════
export default function TabEspecialidades() {
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
              <div className={modal === 'edit' ? 'grid grid-cols-2 gap-4' : ''}>
                {modal === 'edit' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Código</label>
                    <input readOnly value={form.codigo||''}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-not-allowed" />
                  </div>
                )}
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
