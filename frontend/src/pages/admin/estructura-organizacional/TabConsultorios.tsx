import { useCallback, useEffect, useState } from 'react';
import { EBadge, ErrBanner, ErrBox, Field, FormFooter, Modal, SecHeader, Sel, Sw, Table } from '../components';
import { API_URL, authFetch } from '../../../services/api';

type Sede = { id: string; codigo: string; nombre: string; activo: boolean };
type Departamento = { id: string; sedeId: string; codigo: string; nombre: string; activo: boolean };
type Consultorio = { id: string; departamentoId: string; codigo: string; nombre: string; tipo: string; activo: boolean };
type ConsultorioForm = { departamentoId: string; codigo: string; nombre: string; tipo: string; activo: boolean };

const API = `${API_URL}/agenda-organizacional`;
const tipos = [
  { value: 'CONSULTORIO', label: 'Consultorio' },
  { value: 'SALA_PROCEDIMIENTOS', label: 'Sala de procedimientos' },
  { value: 'SILLON_DENTAL', label: 'Sillón dental' },
];
const emptyForm: ConsultorioForm = { departamentoId: '', codigo: '', nombre: '', tipo: 'CONSULTORIO', activo: true };

const request = <T,>(path: string, options?: RequestInit) => authFetch<T>(`${API}${path}`, options);

export default function TabConsultorios() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [sedeId, setSedeId] = useState('');
  const [departamentoId, setDepartamentoId] = useState('');
  const [items, setItems] = useState<Consultorio[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState('');
  const [form, setForm] = useState<ConsultorioForm>(emptyForm);
  const [editing, setEditing] = useState<Consultorio | null>(null);
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

  const loadDepartamentos = useCallback(async () => {
    if (!sedeId) { setDepartamentos([]); setDepartamentoId(''); return; }
    try {
      const data = await request<Departamento[]>(`/sedes/${sedeId}/departamentos`);
      const activos = data.filter(departamento => departamento.activo);
      setDepartamentos(activos);
      setDepartamentoId(current => activos.some(item => item.id === current) ? current : (activos[0]?.id || ''));
    } catch (err: any) { setLoadErr(err.message || 'No se pudieron cargar los departamentos'); }
  }, [sedeId]);

  const load = useCallback(async () => {
    if (!departamentoId) { setItems([]); return; }
    setLoading(true); setLoadErr('');
    try { setItems(await request<Consultorio[]>(`/departamentos/${departamentoId}/consultorios`)); }
    catch (err: any) { setLoadErr(err.message || 'No se pudieron cargar los consultorios'); }
    finally { setLoading(false); }
  }, [departamentoId]);

  useEffect(() => { loadSedes(); }, [loadSedes]);
  useEffect(() => { loadDepartamentos(); }, [loadDepartamentos]);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, departamentoId }); setError(''); setOpen(true); };
  const openEdit = (item: Consultorio) => {
    setEditing(item);
    setForm({ departamentoId: item.departamentoId, codigo: item.codigo, nombre: item.nombre, tipo: item.tipo, activo: item.activo });
    setError(''); setOpen(true);
  };

  const save = async () => {
    if (!form.departamentoId) { setError('Selecciona un departamento'); return; }
    setSaving(true); setError('');
    try {
      await request(editing ? `/consultorios/${editing.id}` : '/consultorios', {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify(form),
      });
      setOpen(false); setEditing(null); await load();
    } catch (err: any) { setError(err.message || 'No se pudo guardar el consultorio'); }
    finally { setSaving(false); }
  };

  const remove = async (item: Consultorio) => {
    if (!window.confirm(`¿Eliminar el consultorio "${item.nombre}"?`)) return;
    try { await request(`/consultorios/${item.id}`, { method: 'DELETE' }); await load(); }
    catch (err: any) { setLoadErr(err.message || 'No se pudo eliminar el consultorio'); }
  };

  const cols = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'activo', label: 'Estado', render: (row: Consultorio) => EBadge(row.activo) },
  ];

  return (
    <section>
      <SecHeader title="Consultorios y Recursos Físicos" onNew={openCreate} />
      <div className="grid gap-4 mb-4 max-w-2xl sm:grid-cols-2">
        <Sel label="Sede" value={sedeId} onChange={setSedeId} options={[
          { value: '', label: 'Selecciona una sede' },
          ...sedes.map(sede => ({ value: sede.id, label: `${sede.codigo} · ${sede.nombre}` })),
        ]} />
        <Sel label="Departamento / Servicio" value={departamentoId} onChange={setDepartamentoId} options={[
          { value: '', label: sedeId ? 'Selecciona un departamento' : 'Selecciona primero una sede' },
          ...departamentos.map(departamento => ({ value: departamento.id, label: `${departamento.codigo} · ${departamento.nombre}` })),
        ]} />
      </div>
      {loadErr && <ErrBanner msg={loadErr} onRetry={() => { loadSedes(); loadDepartamentos(); load(); }} />}
      <Table items={items} cols={cols} loading={loading} onEdit={openEdit} onDelete={remove} />

      {open && (
        <Modal title={editing ? 'Editar consultorio' : 'Nuevo consultorio'} onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Sel label="Departamento / Servicio" value={form.departamentoId} onChange={departamentoId => setForm({ ...form, departamentoId })} options={[
              { value: '', label: 'Selecciona un departamento' },
              ...departamentos.map(departamento => ({ value: departamento.id, label: `${departamento.codigo} · ${departamento.nombre}` })),
            ]} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Código" value={form.codigo} onChange={codigo => setForm({ ...form, codigo })} required placeholder="C-101" />
              <Field label="Nombre" value={form.nombre} onChange={nombre => setForm({ ...form, nombre })} required placeholder="Consultorio Medicina General 1" />
              <Sel label="Tipo" value={form.tipo} onChange={tipo => setForm({ ...form, tipo })} options={tipos} />
            </div>
            <Sw value={form.activo} onChange={activo => setForm({ ...form, activo })} label="Consultorio activo" />
          </div>
          {error && <div className="mt-4"><ErrBox msg={error} /></div>}
          <FormFooter onCancel={() => setOpen(false)} onSave={save} saving={saving} />
        </Modal>
      )}
    </section>
  );
}
