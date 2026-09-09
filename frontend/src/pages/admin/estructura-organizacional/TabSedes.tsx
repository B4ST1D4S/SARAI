import { useCallback, useEffect, useState } from 'react';
import { EBadge, ErrBanner, ErrBox, Field, FormFooter, Modal, SecHeader, Sw, Table } from '../components';
import { API_BASE_URL } from '../../../config';

type Sede = {
  id: string;
  codigo: string;
  nombre: string;
  codigoReps?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  ciudad?: string | null;
  activo: boolean;
};

type SedeForm = Omit<Sede, 'id' | 'activo'> & { activo: boolean };

const API = `${API_BASE_URL}/v1/agenda-organizacional`;
const emptyForm: SedeForm = {
  codigo: '', nombre: '', codigoReps: '', direccion: '', telefono: '', ciudad: '', activo: true,
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.error || `Error HTTP ${response.status}`);
  return data as T;
}

export default function TabSedes() {
  const [items, setItems] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [form, setForm] = useState<SedeForm>(emptyForm);
  const [editing, setEditing] = useState<Sede | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr('');
    try { setItems(await request<Sede[]>('/sedes')); }
    catch (err: any) { setLoadErr(err.message || 'No se pudieron cargar las sedes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setError(''); setOpen(true); };
  const openEdit = (item: Sede) => {
    setEditing(item);
    setForm({
      codigo: item.codigo, nombre: item.nombre, codigoReps: item.codigoReps || '',
      direccion: item.direccion || '', telefono: item.telefono || '', ciudad: item.ciudad || '', activo: item.activo,
    });
    setError(''); setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const path = editing ? `/sedes/${editing.id}` : '/sedes';
      await request(path, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setEditing(null); setOpen(false);
      await load();
    } catch (err: any) { setError(err.message || 'No se pudo guardar la sede'); }
    finally { setSaving(false); }
  };

  const remove = async (item: Sede) => {
    if (!window.confirm(`¿Eliminar la sede "${item.nombre}"?`)) return;
    try { await request(`/sedes/${item.id}`, { method: 'DELETE' }); await load(); }
    catch (err: any) { setLoadErr(err.message || 'No se pudo eliminar la sede'); }
  };

  const cols = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'codigoReps', label: 'Código REPS' },
    { key: 'ciudad', label: 'Ciudad' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'activo', label: 'Estado', render: (row: Sede) => EBadge(row.activo) },
  ];

  return (
    <section>
      <SecHeader title="Sedes Físicas" onNew={openCreate} />
      {loadErr && <ErrBanner msg={loadErr} onRetry={load} />}
      <Table items={items} cols={cols} loading={loading} onEdit={openEdit} onDelete={remove} />

      {open && (
        <Modal title={editing ? 'Editar sede' : 'Nueva sede'} onClose={() => setOpen(false)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Código" value={form.codigo} onChange={value => setForm({ ...form, codigo: value })} required placeholder="SEDE-01" />
            <Field label="Nombre" value={form.nombre} onChange={value => setForm({ ...form, nombre: value })} required placeholder="Sede Principal" />
            <Field label="Código REPS" value={form.codigoReps || ''} onChange={value => setForm({ ...form, codigoReps: value })} placeholder="Código MinSalud de 12 dígitos" />
            <Field label="Ciudad" value={form.ciudad || ''} onChange={value => setForm({ ...form, ciudad: value })} placeholder="Bogotá" />
            <Field label="Teléfono" value={form.telefono || ''} onChange={value => setForm({ ...form, telefono: value })} placeholder="601 000 0000" />
            <div className="sm:col-span-2">
              <Field label="Dirección" value={form.direccion || ''} onChange={value => setForm({ ...form, direccion: value })} placeholder="Dirección de la sede" />
            </div>
            <Sw value={form.activo} onChange={activo => setForm({ ...form, activo })} label="Sede activa" />
          </div>
          {error && <div className="mt-4"><ErrBox msg={error} /></div>}
          <FormFooter onCancel={() => setOpen(false)} onSave={save} saving={saving} />
        </Modal>
      )}
    </section>
  );
}
