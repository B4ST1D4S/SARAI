import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import * as svc from '../../../services/adminService';
import { EBadge, ErrBanner, ErrBox, Field, FormFooter, Modal, Sel, Sw, Table } from '../components';

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

export default function TabMotivosCita() {
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
