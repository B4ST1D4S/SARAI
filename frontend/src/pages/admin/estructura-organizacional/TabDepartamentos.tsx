import { useCallback, useEffect, useState } from 'react';
import { EBadge, ErrBanner, ErrBox, Field, FormFooter, Modal, SecHeader, Sel, Sw, Table } from '../components';
import { API_URL, authFetch } from '../../../services/api';

type Sede = { id: string; codigo: string; nombre: string; activo: boolean };
type Departamento = {
  id: string; sedeId: string; codigo: string; nombre: string; tipo: string; pisoBloque?: string | null; activo: boolean;
};
type DepartamentoForm = { sedeId: string; codigo: string; nombre: string; tipo: string; pisoBloque: string; activo: boolean };

const API = `${API_URL}/agenda-organizacional`;
const tipos = [
  { value: 'ASISTENCIAL', label: 'Asistencial' },
  { value: 'APOYO', label: 'Apoyo' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
];
const emptyForm: DepartamentoForm = { sedeId: '', codigo: '', nombre: '', tipo: 'ASISTENCIAL', pisoBloque: '', activo: true };

const request = <T,>(path: string, options?: RequestInit) => authFetch<T>(`${API}${path}`, options);

export default function TabDepartamentos() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [sedeId, setSedeId] = useState('');
  const [items, setItems] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState('');
  const [form, setForm] = useState<DepartamentoForm>(emptyForm);
  const [editing, setEditing] = useState<Departamento | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadSedes = useCallback(async () => {
    try {
      const data = await request<Sede[]>('/sedes');
      setSedes(data.filter(sede => sede.activo));
      if (!sedeId && data.length) setSedeId(data[0].id);
    } catch (err: any) { setLoadErr(err.message || 'No se pudieron cargar las sedes'); }
  }, [sedeId]);

  const load = useCallback(async () => {
    if (!sedeId) { setItems([]); return; }
    setLoading(true);
    setLoadErr('');
    try { setItems(await request<Departamento[]>(`/sedes/${sedeId}/departamentos`)); }
    catch (err: any) { setLoadErr(err.message || 'No se pudieron cargar los departamentos'); }
    finally { setLoading(false); }
  }, [sedeId]);

  useEffect(() => { loadSedes(); }, [loadSedes]);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, sedeId }); setError(''); setOpen(true); };
  const openEdit = (item: Departamento) => {
    setEditing(item);
    setForm({ sedeId: item.sedeId, codigo: item.codigo, nombre: item.nombre, tipo: item.tipo, pisoBloque: item.pisoBloque || '', activo: item.activo });
    setError(''); setOpen(true);
  };

  const save = async () => {
    if (!form.sedeId) { setError('Selecciona una sede'); return; }
    setSaving(true); setError('');
    try {
      await request(editing ? `/departamentos/${editing.id}` : '/departamentos', {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify(form),
      });
      setOpen(false); setEditing(null); await load();
    } catch (err: any) { setError(err.message || 'No se pudo guardar el departamento'); }
    finally { setSaving(false); }
  };

  const remove = async (item: Departamento) => {
    if (!window.confirm(`¿Eliminar el departamento "${item.nombre}"?`)) return;
    try { await request(`/departamentos/${item.id}`, { method: 'DELETE' }); await load(); }
    catch (err: any) { setLoadErr(err.message || 'No se pudo eliminar el departamento'); }
  };

  const cols = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Departamento / Servicio' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'pisoBloque', label: 'Piso / Bloque' },
    { key: 'activo', label: 'Estado', render: (row: Departamento) => EBadge(row.activo) },
  ];

  return (
    <section>
      <SecHeader title="Departamentos / Servicios Asistenciales" onNew={openCreate} />
      <div className="mb-4 max-w-sm">
        <Sel label="Sede" value={sedeId} onChange={setSedeId} options={[
          { value: '', label: 'Selecciona una sede' },
          ...sedes.map(sede => ({ value: sede.id, label: `${sede.codigo} · ${sede.nombre}` })),
        ]} />
      </div>
      {loadErr && <ErrBanner msg={loadErr} onRetry={() => { loadSedes(); load(); }} />}
      <Table items={items} cols={cols} loading={loading} onEdit={openEdit} onDelete={remove} />

      {open && (
        <Modal title={editing ? 'Editar departamento' : 'Nuevo departamento'} onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Sel label="Sede" value={form.sedeId} onChange={value => setForm({ ...form, sedeId: value })} options={[
              { value: '', label: 'Selecciona una sede' },
              ...sedes.map(sede => ({ value: sede.id, label: `${sede.codigo} · ${sede.nombre}` })),
            ]} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Código interno / contable" value={form.codigo} onChange={codigo => setForm({ ...form, codigo })} required placeholder="CE-001" />
              <Field label="Nombre" value={form.nombre} onChange={nombre => setForm({ ...form, nombre })} required placeholder="Consulta Externa" />
              <Sel label="Tipo" value={form.tipo} onChange={tipo => setForm({ ...form, tipo })} options={tipos} />
              <Field label="Piso / Bloque" value={form.pisoBloque} onChange={pisoBloque => setForm({ ...form, pisoBloque })} placeholder="Piso 1 - Bloque A" />
            </div>
            <Sw value={form.activo} onChange={activo => setForm({ ...form, activo })} label="Departamento activo" />
          </div>
          {error && <div className="mt-4"><ErrBox msg={error} /></div>}
          <FormFooter onCancel={() => setOpen(false)} onSave={save} saving={saving} />
        </Modal>
      )}
    </section>
  );
}
