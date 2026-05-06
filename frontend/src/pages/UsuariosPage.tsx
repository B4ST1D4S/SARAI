import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  UserCheck,
  UserX,
  Edit3,
  X,
  Eye,
  EyeOff,
  Upload,
  Users,
  Shield,
  Stethoscope,
  User,
} from 'lucide-react';
import {
  createUsuario,
  getAllUsuarios,
  updateUsuario,
  toggleUsuarioStatus,
  CreateUserRequest,
  UpdateUserRequest,
} from '../services/api';

// ─── Constantes ──────────────────────────────────────────────────────────────
const ROLES = [
  { value: 'MEDICO',        label: 'Médico',        color: 'text-yellow-400  bg-yellow-500/10  border-yellow-500/30' },
  { value: 'AUXILIAR',      label: 'Auxiliar',      color: 'text-blue-400    bg-blue-500/10    border-blue-500/30'   },
  { value: 'RECEPCIONISTA', label: 'Recepcionista', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'},
  { value: 'SUPER_ADMIN',   label: 'Super Admin',   color: 'text-purple-400  bg-purple-500/10  border-purple-500/30' },
];

const TIPOS_DOCUMENTO = [
  { value: 'CC',  label: 'Cédula de Ciudadanía (CC)' },
  { value: 'CE',  label: 'Cédula de Extranjería (CE)' },
  { value: 'PS',  label: 'Pasaporte (PS)' },
  { value: 'TI',  label: 'Tarjeta de Identidad (TI)' },
];

const ROLES_PROFESIONALES = ['MEDICO', 'AUXILIAR'];

function getRolConfig(rol: string) {
  return ROLES.find((r) => r.value === rol) || {
    value: rol,
    label: rol,
    color: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
  };
}

function getInitials(nombre: string, apellido: string) {
  return `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase();
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface UsuarioData {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  rol: string;
  especialidad?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  registroProfesional?: string;
  registroMedico?: string;
  firmaBase64?: string;
  activo: boolean;
  createdAt: string;
}

type FormMode = 'crear' | 'editar';

const FORM_EMPTY: CreateUserRequest = {
  username: '',
  password: '',
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  rol: 'RECEPCIONISTA',
  especialidad: '',
  tipoDocumento: 'CC',
  numeroDocumento: '',
  registroProfesional: '',
  registroMedico: '',
  firmaBase64: '',
};

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioData[]>([]);
  const [loading, setLoading]   = useState(false);
  const [filtro, setFiltro]     = useState('');
  const [rolFiltro, setRolFiltro] = useState('TODOS');

  const [showModal, setShowModal] = useState(false);
  const [mode, setMode]           = useState<FormMode>('crear');
  const [editId, setEditId]       = useState<string | null>(null);

  const [form, setForm]           = useState<CreateUserRequest>(FORM_EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [firmaPreview, setFirmaPreview] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);

  const token    = localStorage.getItem('accessToken') || '';
  const firmaRef = useRef<HTMLInputElement>(null);

  // ── Carga ─────────────────────────────────────────────────────────────────
  const loadUsuarios = async () => {
    setLoading(true);
    const res = await getAllUsuarios(token);
    if (res.data) setUsuarios(res.data as UsuarioData[]);
    setLoading(false);
  };

  useEffect(() => { loadUsuarios(); }, []);

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const usuariosFiltrados = usuarios.filter((u) => {
    const texto = filtro.toLowerCase();
    const matchTexto =
      !texto ||
      u.nombre.toLowerCase().includes(texto) ||
      u.apellido.toLowerCase().includes(texto) ||
      u.username.toLowerCase().includes(texto) ||
      (u.email ?? '').toLowerCase().includes(texto);
    const matchRol = rolFiltro === 'TODOS' || u.rol === rolFiltro;
    return matchTexto && matchRol;
  });

  const stats = {
    total:    usuarios.length,
    activos:  usuarios.filter((u) => u.activo).length,
    medicos:  usuarios.filter((u) => u.rol === 'MEDICO').length,
    profesionales: usuarios.filter((u) => ROLES_PROFESIONALES.includes(u.rol)).length,
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const abrirCrear = () => {
    setMode('crear');
    setEditId(null);
    setForm(FORM_EMPTY);
    setFirmaPreview(null);
    setError(null);
    setShowModal(true);
  };

  const abrirEditar = async (u: UsuarioData) => {
    setMode('editar');
    setEditId(u.id);
    setForm({
      username:           u.username,
      password:           '',
      nombre:             u.nombre,
      apellido:           u.apellido,
      email:              u.email ?? '',
      telefono:           u.telefono ?? '',
      rol:                u.rol,
      especialidad:       u.especialidad ?? '',
      tipoDocumento:      u.tipoDocumento ?? 'CC',
      numeroDocumento:    u.numeroDocumento ?? '',
      registroProfesional: u.registroProfesional ?? '',
      registroMedico:     u.registroMedico ?? '',
      firmaBase64:        u.firmaBase64 ?? '',
    });
    setFirmaPreview(u.firmaBase64 ? u.firmaBase64 : null);
    setError(null);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setError(null);
    setFirmaPreview(null);
  };

  // ── Firma upload ──────────────────────────────────────────────────────────
  const handleFirmaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setFirmaPreview(base64);
      setForm((f) => ({ ...f, firmaBase64: base64 }));
    };
    reader.readAsDataURL(file);
  };

  // ── Guardar ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (mode === 'crear') {
        const payload: CreateUserRequest = { ...form };
        // Limpiar campos vacíos opcionales
        if (!payload.email)              delete payload.email;
        if (!payload.telefono)           delete payload.telefono;
        if (!payload.especialidad)       delete payload.especialidad;
        if (!ROLES_PROFESIONALES.includes(payload.rol)) {
          delete payload.tipoDocumento;
          delete payload.numeroDocumento;
          delete payload.registroProfesional;
          delete payload.registroMedico;
          delete payload.firmaBase64;
        } else {
          if (!payload.tipoDocumento)       delete payload.tipoDocumento;
          if (!payload.numeroDocumento)     delete payload.numeroDocumento;
          if (!payload.registroProfesional) delete payload.registroProfesional;
          if (!payload.registroMedico)      delete payload.registroMedico;
          if (!payload.firmaBase64)         delete payload.firmaBase64;
        }

        const res = await createUsuario(payload, token);
        if (res.error) { setError(res.error); setSaving(false); return; }
        setSuccess('Usuario creado correctamente');
      } else if (editId) {
        const payload: UpdateUserRequest = { ...form };
        if (!payload.password) delete payload.password;
        if (!payload.email)    delete payload.email;
        if (!ROLES_PROFESIONALES.includes(payload.rol ?? '')) {
          delete payload.tipoDocumento;
          delete payload.numeroDocumento;
          delete payload.registroProfesional;
          delete payload.registroMedico;
          delete payload.firmaBase64;
        }

        const res = await updateUsuario(editId, payload, token);
        if (res.error) { setError(res.error); setSaving(false); return; }
        setSuccess('Usuario actualizado correctamente');
      }

      await loadUsuarios();
      setTimeout(() => { setSuccess(null); cerrarModal(); }, 1200);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle estado ──────────────────────────────────────────────────────────
  const handleToggle = async (id: string) => {
    const res = await toggleUsuarioStatus(id, token);
    if (!res.error) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, activo: (res.data as any).activo } : u))
      );
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  const esProfesional = ROLES_PROFESIONALES.includes(form.rol);

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Gestión de usuarios y profesionales del sistema
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500
                     text-slate-900 font-semibold rounded-xl hover:from-yellow-400 hover:to-amber-400
                     transition-all shadow-lg shadow-yellow-500/20 text-sm"
        >
          <Plus size={16} />
          Nuevo Usuario
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total usuarios', value: stats.total,        icon: Users,       color: 'text-yellow-400' },
          { label: 'Activos',        value: stats.activos,       icon: UserCheck,   color: 'text-emerald-400' },
          { label: 'Médicos',        value: stats.medicos,       icon: Stethoscope, color: 'text-blue-400' },
          { label: 'Profesionales',  value: stats.profesionales, icon: Shield,      color: 'text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#0d0f14] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs">{label}</p>
              <Icon size={16} className={color} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o correo..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full pl-8 pr-4 py-2.5 bg-[#0d0f14] border border-white/5 rounded-xl
                       text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['TODOS', ...ROLES.map((r) => r.value)].map((r) => (
            <button
              key={r}
              onClick={() => setRolFiltro(r)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                rolFiltro === r
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                  : 'border-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
              }`}
            >
              {r === 'TODOS' ? 'Todos' : getRolConfig(r).label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-[#0d0f14] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">
            <div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mr-3" />
            Cargando usuarios...
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-600">
            <Users size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[11px] text-gray-600 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Usuario</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Nombre</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Correo</th>
                  <th className="text-left px-5 py-3">Rol</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Especialidad</th>
                  <th className="text-center px-5 py-3">Estado</th>
                  <th className="text-right px-5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u, i) => {
                  const rolCfg = getRolConfig(u.rol);
                  return (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Avatar + username */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            u.activo
                              ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-slate-900'
                              : 'bg-white/5 text-gray-600'
                          }`}>
                            {getInitials(u.nombre, u.apellido)}
                          </div>
                          <span className="text-white font-mono text-xs">{u.username}</span>
                        </div>
                      </td>
                      {/* Nombre completo */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-gray-300">{u.nombre} {u.apellido}</span>
                      </td>
                      {/* Email */}
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-gray-500 text-xs">{u.email || '—'}</span>
                      </td>
                      {/* Rol badge */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${rolCfg.color}`}>
                          {rolCfg.label}
                        </span>
                      </td>
                      {/* Especialidad */}
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-gray-500 text-xs">{u.especialidad || '—'}</span>
                      </td>
                      {/* Estado toggle */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleToggle(u.id)}
                          title={u.activo ? 'Desactivar' : 'Activar'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                            u.activo
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'text-gray-500 bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {u.activo
                            ? <><UserCheck size={11} /> Activo</>
                            : <><UserX size={11} /> Inactivo</>
                          }
                        </button>
                      </td>
                      {/* Editar */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => abrirEditar(u)}
                          title="Editar usuario"
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-500
                                     hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
                        >
                          <Edit3 size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODAL: Crear / Editar usuario
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={cerrarModal}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#0d0f14] border-l border-white/5
                         z-50 overflow-y-auto shadow-2xl"
            >
              <form onSubmit={handleSubmit} className="flex flex-col h-full">

                {/* Header del panel */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
                  <div>
                    <h2 className="text-white font-bold text-base">
                      {mode === 'crear' ? 'Nuevo usuario' : 'Editar usuario'}
                    </h2>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {mode === 'crear'
                        ? 'Completa los campos para crear el acceso'
                        : `Modificando: ${form.username}`}
                    </p>
                  </div>
                  <button type="button" onClick={cerrarModal}
                    className="p-2 rounded-xl text-gray-600 hover:text-white hover:bg-white/5 transition-all">
                    <X size={18} />
                  </button>
                </div>

                {/* Body del panel */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                  {/* Error / Success */}
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                        {error}
                      </motion.div>
                    )}
                    {success && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                        {success}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Sección: Acceso ── */}
                  <Section title="Acceso al sistema" icon={<Shield size={14} />}>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Usuario *">
                        <input
                          required
                          value={form.username}
                          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                          placeholder="ej: drlopez"
                          className={inputCls}
                        />
                      </Field>
                      <Field label={mode === 'crear' ? 'Contraseña *' : 'Nueva contraseña'}>
                        <div className="relative">
                          <input
                            required={mode === 'crear'}
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                            placeholder={mode === 'editar' ? 'Dejar vacío para no cambiar' : '••••••••'}
                            className={`${inputCls} pr-10`}
                          />
                          <button type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </Field>
                    </div>
                    <Field label="Rol *">
                      <select
                        required
                        value={form.rol}
                        onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
                        className={inputCls}
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </Field>
                  </Section>

                  {/* ── Sección: Datos personales ── */}
                  <Section title="Datos personales" icon={<User size={14} />}>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Nombre(s) *">
                        <input required value={form.nombre}
                          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                          placeholder="Nombre(s)" className={inputCls} />
                      </Field>
                      <Field label="Apellido(s) *">
                        <input required value={form.apellido}
                          onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
                          placeholder="Apellido(s)" className={inputCls} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Correo electrónico">
                        <input type="email" value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="correo@clinica.com" className={inputCls} />
                      </Field>
                      <Field label="Teléfono">
                        <input type="tel" value={form.telefono}
                          onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                          placeholder="+57 300 000 0000" className={inputCls} />
                      </Field>
                    </div>
                  </Section>

                  {/* ── Sección: Datos profesionales (solo MEDICO / AUXILIAR) ── */}
                  <AnimatePresence>
                    {esProfesional && (
                      <motion.div
                        key="prof"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <Section title="Datos profesionales" icon={<Stethoscope size={14} />}
                          accent="border-yellow-500/30 bg-yellow-500/[0.03]">
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Tipo de documento">
                              <select
                                value={form.tipoDocumento}
                                onChange={(e) => setForm((f) => ({ ...f, tipoDocumento: e.target.value }))}
                                className={inputCls}
                              >
                                {TIPOS_DOCUMENTO.map((t) => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </Field>
                            <Field label="Número de documento">
                              <input value={form.numeroDocumento}
                                onChange={(e) => setForm((f) => ({ ...f, numeroDocumento: e.target.value }))}
                                placeholder="Ej: 1234567890" className={inputCls} />
                            </Field>
                          </div>
                          <Field label="Especialidad">
                            <input value={form.especialidad}
                              onChange={(e) => setForm((f) => ({ ...f, especialidad: e.target.value }))}
                              placeholder="Ej: Cirugía Plástica" className={inputCls} />
                          </Field>
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Registro profesional">
                              <input value={form.registroProfesional}
                                onChange={(e) => setForm((f) => ({ ...f, registroProfesional: e.target.value }))}
                                placeholder="Tarjeta profesional" className={inputCls} />
                            </Field>
                            <Field label="Registro médico (RETHUS)">
                              <input value={form.registroMedico}
                                onChange={(e) => setForm((f) => ({ ...f, registroMedico: e.target.value }))}
                                placeholder="Ej: 123456" className={inputCls} />
                            </Field>
                          </div>

                          {/* Firma del profesional */}
                          <Field label="Firma del profesional">
                            <div
                              className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col
                                         items-center justify-center gap-3 cursor-pointer
                                         hover:border-yellow-500/30 hover:bg-yellow-500/[0.03] transition-all"
                              onClick={() => firmaRef.current?.click()}
                            >
                              {firmaPreview ? (
                                <div className="relative w-full">
                                  <img
                                    src={firmaPreview}
                                    alt="Firma"
                                    className="max-h-20 mx-auto object-contain rounded"
                                  />
                                  <p className="text-center text-xs text-gray-500 mt-2">
                                    Clic para cambiar
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <Upload size={24} className="text-gray-600" />
                                  <div className="text-center">
                                    <p className="text-gray-400 text-sm font-medium">Subir firma</p>
                                    <p className="text-gray-600 text-xs mt-0.5">
                                      PNG, JPG o SVG — máx 2 MB
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                            <input
                              ref={firmaRef}
                              type="file"
                              accept="image/png,image/jpeg,image/svg+xml"
                              className="hidden"
                              onChange={handleFirmaChange}
                            />
                          </Field>
                        </Section>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 flex-shrink-0">
                  <button type="button" onClick={cerrarModal}
                    className="px-4 py-2 rounded-xl text-gray-500 hover:text-white border border-white/5
                               hover:border-white/10 hover:bg-white/[0.04] transition-all text-sm">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900
                               font-semibold rounded-xl hover:from-yellow-400 hover:to-amber-400 disabled:opacity-50
                               transition-all text-sm flex items-center gap-2"
                  >
                    {saving && (
                      <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    )}
                    {saving ? 'Guardando...' : mode === 'crear' ? 'Crear usuario' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
const inputCls =
  'w-full px-3 py-2.5 bg-[#080a0f] border border-white/5 rounded-xl text-white text-sm ' +
  'placeholder-gray-600 focus:outline-none focus:border-yellow-500/40 transition-colors ' +
  '[&>option]:bg-[#0d0f14]';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
  accent = 'border-white/5 bg-transparent',
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className={`rounded-xl border p-4 space-y-4 ${accent}`}>
      <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
