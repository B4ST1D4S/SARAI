import { useCallback, useEffect, useState } from 'react';
import { Ban, RefreshCw } from 'lucide-react';
import { ErrBanner, ErrBox, Field, FormFooter, Modal, SecHeader, Sel } from '../components';
import { API_URL, authFetch } from '../../../services/api';

type Sede = { id: string; codigo: string; nombre: string; activo: boolean };
type Departamento = { id: string; sedeId: string; codigo: string; nombre: string; activo: boolean };
type Consultorio = { id: string; departamentoId: string; codigo: string; nombre: string; activo: boolean };
type Profesional = { id: string; nombreCompleto: string; especialidadPrincipal?: string | null; registroMedico?: string | null };
type Especialidad = { id: string; codigo: string; nombre: string; estado: boolean };

type Turno = {
  id: string;
  sede: { id: string; nombre: string };
  departamento: { id: string; nombre: string };
  consultorio: { id: string; nombre: string };
  profesional: { id: string; nombreCompleto: string };
  especialidadId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  intervaloMinutos: number;
  sobrecuposMax: number;
  modalidad: string;
  estado: string;
};

type TurnoForm = {
  sedeId: string; departamentoId: string; consultorioId: string;
  profesionalId: string; especialidadId: string;
  fecha: string; horaInicio: string; horaFin: string;
  intervaloMinutos: string; sobrecuposMax: string; modalidad: string;
};

const AGENDA_API = `${API_URL}/agenda-organizacional`;
const MODALIDADES = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'TELEMEDICINA', label: 'Telemedicina' },
];
const emptyForm: TurnoForm = {
  sedeId: '', departamentoId: '', consultorioId: '', profesionalId: '', especialidadId: '',
  fecha: '', horaInicio: '08:00', horaFin: '12:00', intervaloMinutos: '15', sobrecuposMax: '0', modalidad: 'PRESENCIAL',
};

const agenda = <T,>(path: string, options?: RequestInit) => authFetch<T>(`${AGENDA_API}${path}`, options);
const especialidadesApi = <T,>(path: string, options?: RequestInit) => authFetch<T>(`${API_URL}${path}`, options);

const fechaLegible = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function TabTurnos() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);

  const [filtroSedeId, setFiltroSedeId] = useState('');
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState('');

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TurnoForm>(emptyForm);
  const [formDeptos, setFormDeptos] = useState<Departamento[]>([]);
  const [formConsultorios, setFormConsultorios] = useState<Consultorio[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const cargarCatalogos = useCallback(async () => {
    try {
      const [s, p, e] = await Promise.all([
        agenda<Sede[]>('/sedes?soloActivos=true'),
        agenda<Profesional[]>('/profesionales'),
        especialidadesApi<Especialidad[]>('/especialidades'),
      ]);
      setSedes(s);
      setProfesionales(p);
      setEspecialidades(e.filter((x) => x.estado));
    } catch (err: any) { setLoadErr(err.message || 'No se pudieron cargar los catálogos'); }
  }, []);

  const cargarTurnos = useCallback(async () => {
    setLoading(true); setLoadErr('');
    try {
      const qs = filtroSedeId ? `?sedeId=${filtroSedeId}` : '';
      setTurnos(await agenda<Turno[]>(`/turnos${qs}`));
    } catch (err: any) { setLoadErr(err.message || 'No se pudieron cargar los turnos'); }
    finally { setLoading(false); }
  }, [filtroSedeId]);

  useEffect(() => { cargarCatalogos(); }, [cargarCatalogos]);
  useEffect(() => { cargarTurnos(); }, [cargarTurnos]);

  // Cascada Sede -> Departamento -> Consultorio dentro del formulario
  useEffect(() => {
    if (!form.sedeId) { setFormDeptos([]); return; }
    agenda<Departamento[]>(`/sedes/${form.sedeId}/departamentos`).then((d) => setFormDeptos(d.filter((x) => x.activo))).catch(() => setFormDeptos([]));
  }, [form.sedeId]);

  useEffect(() => {
    if (!form.departamentoId) { setFormConsultorios([]); return; }
    agenda<Consultorio[]>(`/departamentos/${form.departamentoId}/consultorios`).then((c) => setFormConsultorios(c.filter((x) => x.activo))).catch(() => setFormConsultorios([]));
  }, [form.departamentoId]);

  const openCreate = () => { setForm({ ...emptyForm, sedeId: filtroSedeId }); setError(''); setOpen(true); };

  const save = async () => {
    if (!form.sedeId || !form.departamentoId || !form.consultorioId || !form.profesionalId || !form.especialidadId || !form.fecha) {
      setError('Completa sede, departamento, consultorio, profesional, especialidad y fecha');
      return;
    }
    setSaving(true); setError('');
    try {
      await agenda('/turnos', {
        method: 'POST',
        body: JSON.stringify({
          sedeId: form.sedeId,
          departamentoId: form.departamentoId,
          consultorioId: form.consultorioId,
          profesionalId: form.profesionalId,
          especialidadId: form.especialidadId,
          fecha: form.fecha,
          horaInicio: form.horaInicio,
          horaFin: form.horaFin,
          intervaloMinutos: Number(form.intervaloMinutos) || 15,
          sobrecuposMax: Number(form.sobrecuposMax) || 0,
          modalidad: form.modalidad,
        }),
      });
      setOpen(false);
      await cargarTurnos();
    } catch (err: any) { setError(err.message || 'No se pudo crear el turno'); }
    finally { setSaving(false); }
  };

  const cancelar = async (t: Turno) => {
    if (!window.confirm(`¿Cancelar el turno del ${fechaLegible(t.fecha)} (${t.horaInicio}-${t.horaFin}) de ${t.profesional.nombreCompleto}?`)) return;
    try { await agenda(`/turnos/${t.id}/cancelar`, { method: 'PUT' }); await cargarTurnos(); }
    catch (err: any) { setLoadErr(err.message || 'No se pudo cancelar el turno'); }
  };

  return (
    <section>
      <SecHeader title="Turnos (Apertura de Agenda)" onNew={openCreate} />

      <div className="grid gap-4 mb-4 max-w-xs">
        <Sel label="Filtrar por sede" value={filtroSedeId} onChange={setFiltroSedeId} options={[
          { value: '', label: 'Todas las sedes' },
          ...sedes.map((s) => ({ value: s.id, label: `${s.codigo} · ${s.nombre}` })),
        ]} />
      </div>

      {loadErr && <ErrBanner msg={loadErr} onRetry={cargarTurnos} />}

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-8 justify-center">
          <RefreshCw size={14} className="animate-spin" /> Cargando turnos...
        </div>
      ) : turnos.length === 0 ? (
        <p className="text-center text-gray-500 py-14 text-sm">
          Sin turnos abiertos. Crea uno nuevo para habilitar horarios de agendamiento.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800/70">
                {['Fecha', 'Horario', 'Sede', 'Consultorio', 'Profesional', 'Intervalo', 'Estado'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
                <th className="px-4 py-3 text-right font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {turnos.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{fechaLegible(t.fecha)}</td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{t.horaInicio} – {t.horaFin}</td>
                  <td className="px-4 py-3 text-gray-300">{t.sede.nombre}</td>
                  <td className="px-4 py-3 text-gray-300">{t.consultorio.nombre}</td>
                  <td className="px-4 py-3 text-gray-300">{t.profesional.nombreCompleto}</td>
                  <td className="px-4 py-3 text-gray-300">{t.intervaloMinutos} min</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${t.estado === 'HABILITADO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {t.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.estado === 'HABILITADO' && (
                      <button onClick={() => cancelar(t)} title="Cancelar turno"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition">
                        <Ban size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Modal title="Nuevo Turno" onClose={() => setOpen(false)} maxW="max-w-2xl">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Sel label="Sede" value={form.sedeId} onChange={(sedeId) => setForm({ ...form, sedeId, departamentoId: '', consultorioId: '' })} options={[
                { value: '', label: 'Selecciona una sede' },
                ...sedes.map((s) => ({ value: s.id, label: s.nombre })),
              ]} />
              <Sel label="Departamento" value={form.departamentoId} onChange={(departamentoId) => setForm({ ...form, departamentoId, consultorioId: '' })} options={[
                { value: '', label: form.sedeId ? 'Selecciona un departamento' : 'Primero elige sede' },
                ...formDeptos.map((d) => ({ value: d.id, label: d.nombre })),
              ]} />
              <Sel label="Consultorio" value={form.consultorioId} onChange={(consultorioId) => setForm({ ...form, consultorioId })} options={[
                { value: '', label: form.departamentoId ? 'Selecciona un consultorio' : 'Primero elige departamento' },
                ...formConsultorios.map((c) => ({ value: c.id, label: c.nombre })),
              ]} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Sel label="Profesional" value={form.profesionalId} onChange={(profesionalId) => setForm({ ...form, profesionalId })} options={[
                { value: '', label: 'Selecciona un profesional' },
                ...profesionales.map((p) => ({ value: p.id, label: `${p.nombreCompleto}${p.especialidadPrincipal ? ' · ' + p.especialidadPrincipal : ''}` })),
              ]} />
              <Sel label="Especialidad" value={form.especialidadId} onChange={(especialidadId) => setForm({ ...form, especialidadId })} options={[
                { value: '', label: 'Selecciona una especialidad' },
                ...especialidades.map((e) => ({ value: e.id, label: e.nombre })),
              ]} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Fecha" type="date" value={form.fecha} onChange={(fecha) => setForm({ ...form, fecha })} required />
              <Field label="Hora inicio" type="time" value={form.horaInicio} onChange={(horaInicio) => setForm({ ...form, horaInicio })} required />
              <Field label="Hora fin" type="time" value={form.horaFin} onChange={(horaFin) => setForm({ ...form, horaFin })} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Intervalo (min)" type="number" value={form.intervaloMinutos} onChange={(intervaloMinutos) => setForm({ ...form, intervaloMinutos })} />
              <Field label="Sobrecupos máx." type="number" value={form.sobrecuposMax} onChange={(sobrecuposMax) => setForm({ ...form, sobrecuposMax })} />
              <Sel label="Modalidad" value={form.modalidad} onChange={(modalidad) => setForm({ ...form, modalidad })} options={MODALIDADES} />
            </div>
          </div>
          {error && <div className="mt-4"><ErrBox msg={error} /></div>}
          <FormFooter onCancel={() => setOpen(false)} onSave={save} saving={saving} />
        </Modal>
      )}
    </section>
  );
}
