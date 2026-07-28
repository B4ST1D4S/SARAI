import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Building2, MapPin, Layers, Key, Lock,
  AlertTriangle, Activity, Smartphone, Clock, UserCheck,
  RefreshCw, Plus, Search, ChevronRight, Eye, Edit,
  Trash2, CheckCircle, XCircle, Ban, LogOut, Info,
  BarChart3, Server, Globe, TrendingUp,
} from 'lucide-react';
import { API_BASE_URL } from '../config';

// ─────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────
type Tab =
  | 'dashboard' | 'empresas' | 'sedes' | 'perfiles' | 'roles'
  | 'grupos' | 'permisos' | 'politicas' | 'sesiones'
  | 'delegaciones' | 'auditoria' | 'eventos';

interface DashboardData {
  totalUsuarios: number; totalPerfiles: number; totalRoles: number;
  totalGrupos: number; sesionesActivas: number; eventosPendientes: number;
  delegacionesActivas: number; accesosHoy: number;
}

// ─────────────────────────────────────────────────────────
//  Hook de API
// ─────────────────────────────────────────────────────────
function useApi() {
  const token = localStorage.getItem('accessToken') || '';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const get = (path: string) =>
    fetch(`${API_BASE_URL}/seguridad${path}`, { headers }).then(r => r.json()).catch(() => null);

  // Siempre retorna un array — nunca crashea aunque el backend devuelva error JSON
  const getList = (path: string): Promise<any[]> =>
    fetch(`${API_BASE_URL}/seguridad${path}`, { headers })
      .then(r => r.json())
      .then(data => Array.isArray(data) ? data : [])
      .catch(() => []);

  const post = (path: string, body: any) =>
    fetch(`${API_BASE_URL}/seguridad${path}`, { method: 'POST', headers, body: JSON.stringify(body) }).then(r => r.json());

  const put = (path: string, body: any) =>
    fetch(`${API_BASE_URL}/seguridad${path}`, { method: 'PUT', headers, body: JSON.stringify(body) }).then(r => r.json());

  const del = (path: string) =>
    fetch(`${API_BASE_URL}/seguridad${path}`, { method: 'DELETE', headers }).then(r => r.json());

  return { get, getList, post, put, del };
}

// ─────────────────────────────────────────────────────────
//  Componente principal
// ─────────────────────────────────────────────────────────
export default function SeguridadPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try { setDashboard(await api.get('/dashboard')); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Tabs de navegación lateral
  const tabs: { id: Tab; label: string; icon: React.ReactNode; group: string }[] = [
    { id: 'dashboard',    label: 'Dashboard',          icon: <BarChart3 size={16} />,  group: 'RESUMEN' },
    { id: 'empresas',     label: 'Empresas',            icon: <Building2 size={16} />,  group: 'ESTRUCTURA' },
    { id: 'sedes',        label: 'Sedes',               icon: <MapPin size={16} />,     group: 'ESTRUCTURA' },
    { id: 'perfiles',     label: 'Perfiles',            icon: <Layers size={16} />,     group: 'IDENTIDAD' },
    { id: 'roles',        label: 'Roles IAM',           icon: <Key size={16} />,        group: 'IDENTIDAD' },
    { id: 'grupos',       label: 'Grupos',              icon: <Users size={16} />,      group: 'IDENTIDAD' },
    { id: 'permisos',     label: 'Permisos',            icon: <Lock size={16} />,       group: 'ACCESO' },
    { id: 'politicas',    label: 'Políticas',           icon: <Shield size={16} />,     group: 'ACCESO' },
    { id: 'sesiones',     label: 'Sesiones Activas',    icon: <Globe size={16} />,      group: 'MONITOREO' },
    { id: 'delegaciones', label: 'Delegaciones',        icon: <UserCheck size={16} />,  group: 'MONITOREO' },
    { id: 'auditoria',    label: 'Historial Accesos',   icon: <Activity size={16} />,   group: 'AUDITORIA' },
    { id: 'eventos',      label: 'Eventos Seguridad',   icon: <AlertTriangle size={16} />, group: 'AUDITORIA' },
  ];

  const groups = [...new Set(tabs.map(t => t.group))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* ── Sidebar de navegación IAM ── */}
      <aside className="w-56 flex-shrink-0 border-r border-white/5 bg-[#0a0c13] flex flex-col">
        {/* Header */}
        <div className="px-4 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Seguridad</p>
              <p className="text-red-400/60 text-xs">IAM Enterprise</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {groups.map(group => (
            <div key={group}>
              <p className="text-gray-600 text-[10px] font-bold tracking-widest px-2 mb-1">{group}</p>
              {tabs.filter(t => t.group === group).map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    tab === t.id
                      ? 'bg-red-600/15 text-red-400 border border-red-500/20'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                  {t.id === 'eventos' && dashboard?.eventosPendientes ? (
                    <span className="ml-auto bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {dashboard.eventosPendientes}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-white/5">
          <div className="text-[10px] text-gray-600 text-center">
            RBAC + ABAC · Least Privilege
          </div>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <main className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            {tab === 'dashboard'    && <DashboardTab data={dashboard} loading={loading} onRefresh={loadDashboard} />}
            {tab === 'empresas'     && <EmpresasTab api={api} />}
            {tab === 'sedes'        && <SedesTab api={api} />}
            {tab === 'perfiles'     && <PerfilesTab api={api} />}
            {tab === 'roles'        && <RolesTab api={api} />}
            {tab === 'grupos'       && <GruposTab api={api} />}
            {tab === 'permisos'     && <PermisosTab api={api} />}
            {tab === 'politicas'    && <PoliticasTab api={api} />}
            {tab === 'sesiones'     && <SesionesTab api={api} />}
            {tab === 'delegaciones' && <DelegacionesTab api={api} />}
            {tab === 'auditoria'    && <AuditoriaTab api={api} />}
            {tab === 'eventos'      && <EventosTab api={api} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Dashboard Tab
// ─────────────────────────────────────────────────────────
function DashboardTab({ data, loading, onRefresh }: { data: DashboardData | null; loading: boolean; onRefresh: () => void }) {
  const cards = data ? [
    { label: 'Usuarios Activos',      value: data.totalUsuarios,       icon: <Users size={20} />,        color: 'from-blue-600 to-blue-700',    bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
    { label: 'Perfiles',              value: data.totalPerfiles,        icon: <Layers size={20} />,       color: 'from-violet-600 to-violet-700',bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { label: 'Roles IAM',             value: data.totalRoles,           icon: <Key size={20} />,          color: 'from-amber-600 to-orange-600', bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
    { label: 'Grupos',                value: data.totalGrupos,          icon: <Users size={20} />,        color: 'from-teal-600 to-cyan-600',    bg: 'bg-teal-500/10',   border: 'border-teal-500/20' },
    { label: 'Sesiones Activas',      value: data.sesionesActivas,      icon: <Globe size={20} />,        color: 'from-emerald-600 to-green-600',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20' },
    { label: 'Eventos Pendientes',    value: data.eventosPendientes,    icon: <AlertTriangle size={20} />,color: 'from-red-600 to-rose-600',     bg: 'bg-red-500/10',    border: 'border-red-500/20' },
    { label: 'Delegaciones Activas',  value: data.delegacionesActivas,  icon: <UserCheck size={20} />,    color: 'from-indigo-600 to-blue-600',  bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { label: 'Accesos Hoy',           value: data.accesosHoy,           icon: <Activity size={20} />,     color: 'from-pink-600 to-rose-600',    bg: 'bg-pink-500/10',   border: 'border-pink-500/20' },
  ] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield size={24} className="text-red-400" />
            IAM — Identity & Access Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            RBAC + ABAC · Least Privilege · Separation of Duties · Auditoría completa
          </p>
        </div>
        <button onClick={onRefresh} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
          <RefreshCw size={16} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`${card.bg} ${card.border} border rounded-2xl p-4`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
              {card.icon}
            </div>
            <p className="text-3xl font-bold text-white">{card.value}</p>
            <p className="text-gray-400 text-xs mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Principios de seguridad */}
      <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/5 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Info size={16} className="text-blue-400" />
          Arquitectura de Seguridad Enterprise
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { title: 'Least Privilege',         desc: 'Acceso mínimo necesario por defecto. DENY si no hay permiso explícito.' },
            { title: 'RBAC',                     desc: 'Control por Roles. Perfiles heredan roles, usuarios heredan perfiles.' },
            { title: 'ABAC',                     desc: 'Restricciones por contexto: empresa, sede, fecha, horario.' },
            { title: 'Separation of Duties',     desc: 'Conflictos de interés detectados. Permisos incompatibles bloqueados.' },
            { title: 'Herencia de Permisos',     desc: 'Usuario > Perfil > Rol > Grupo. DENY siempre gana sobre ALLOW.' },
            { title: 'Permisos Temporales',      desc: 'Fecha inicio/fin en cada permiso. Expiración automática.' },
            { title: 'Delegaciones',             desc: 'Sustitutos temporales con recursos específicos y período definido.' },
            { title: 'Auditoría Total',          desc: 'Quién, cuándo, desde dónde, qué cambió. Valores antes/después.' },
          ].map(p => (
            <div key={p.title} className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
              <p className="text-white text-xs font-semibold mb-1">{p.title}</p>
              <p className="text-gray-500 text-[11px] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Empresas Tab
// ─────────────────────────────────────────────────────────
function EmpresasTab({ api }: { api: ReturnType<typeof useApi> }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', nit: '', razonSocial: '', ciudad: '', telefono: '', email: '' });

  useEffect(() => { api.getList('/empresas').then(setItems).finally(() => setLoading(false)); }, []);

  const handleCreate = async () => {
    const res = await api.post('/empresas', form);
    if (res.id) { setItems(p => [res, ...p]); setShowForm(false); setForm({ nombre: '', nit: '', razonSocial: '', ciudad: '', telefono: '', email: '' }); }
  };

  return (
    <SectionLayout
      title="Empresas" icon={<Building2 size={20} className="text-blue-400" />}
      onAdd={() => setShowForm(true)} loading={loading}
    >
      <AnimatePresence>
        {showForm && (
          <FormModal title="Nueva Empresa" onClose={() => setShowForm(false)} onSave={handleCreate}>
            <FormField label="Nombre *" value={form.nombre} onChange={v => setForm(p => ({ ...p, nombre: v }))} />
            <FormField label="NIT" value={form.nit} onChange={v => setForm(p => ({ ...p, nit: v }))} />
            <FormField label="Razón Social" value={form.razonSocial} onChange={v => setForm(p => ({ ...p, razonSocial: v }))} />
            <FormField label="Ciudad" value={form.ciudad} onChange={v => setForm(p => ({ ...p, ciudad: v }))} />
            <FormField label="Teléfono" value={form.telefono} onChange={v => setForm(p => ({ ...p, telefono: v }))} />
            <FormField label="Email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
          </FormModal>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map(e => (
          <Card key={e.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                  <Building2 size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">{e.nombre}</p>
                  <p className="text-gray-500 text-xs">{e.nit || 'Sin NIT'} · {e.ciudad || 'Sin ciudad'}</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><MapPin size={11} />{e._count?.sedes ?? 0} sedes</span>
                <span className="flex items-center gap-1"><Users size={11} />{e._count?.usuarios ?? 0}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </SectionLayout>
  );
}

// ─────────────────────────────────────────────────────────
//  Sedes Tab
// ─────────────────────────────────────────────────────────
function SedesTab({ api }: { api: ReturnType<typeof useApi> }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', empresaId: '', ciudad: '', direccion: '', telefono: '' });
  const [empresas, setEmpresas] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([api.getList('/sedes'), api.getList('/empresas')]).then(([s, e]) => { setItems(s); setEmpresas(e); }).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    const res = await api.post('/sedes', form);
    if (res.id) { setItems(p => [res, ...p]); setShowForm(false); }
  };

  return (
    <SectionLayout title="Sedes" icon={<MapPin size={20} className="text-emerald-400" />} onAdd={() => setShowForm(true)} loading={loading}>
      <AnimatePresence>
        {showForm && (
          <FormModal title="Nueva Sede" onClose={() => setShowForm(false)} onSave={handleCreate}>
            <div className="space-y-2">
              <label className="text-gray-400 text-xs">Empresa *</label>
              <select className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-white text-sm" value={form.empresaId} onChange={e => setForm(p => ({ ...p, empresaId: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {empresas.map(e => <option key={e.id} value={e.id} className="bg-[#0d0f14]">{e.nombre}</option>)}
              </select>
            </div>
            <FormField label="Nombre *" value={form.nombre} onChange={v => setForm(p => ({ ...p, nombre: v }))} />
            <FormField label="Ciudad" value={form.ciudad} onChange={v => setForm(p => ({ ...p, ciudad: v }))} />
            <FormField label="Dirección" value={form.direccion} onChange={v => setForm(p => ({ ...p, direccion: v }))} />
          </FormModal>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map(s => (
          <Card key={s.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                <MapPin size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-semibold">{s.nombre}</p>
                <p className="text-gray-500 text-xs">{s.empresa?.nombre} · {s.ciudad || 'Sin ciudad'}</p>
              </div>
              <span className="ml-auto text-xs text-gray-500">{s._count?.usuarios ?? 0} usuarios</span>
            </div>
          </Card>
        ))}
      </div>
    </SectionLayout>
  );
}

// ─────────────────────────────────────────────────────────
//  Perfiles Tab
// ─────────────────────────────────────────────────────────
function PerfilesTab({ api }: { api: ReturnType<typeof useApi> }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', clonarDesdeId: '' });

  useEffect(() => { api.getList('/perfiles').then(setItems).finally(() => setLoading(false)); }, []);

  const handleCreate = async () => {
    const res = await api.post('/perfiles', form);
    if (res.id) { setItems(p => [res, ...p]); setShowForm(false); setForm({ nombre: '', descripcion: '', clonarDesdeId: '' }); }
  };

  const handleDelete = async (id: string) => {
    await api.del(`/perfiles/${id}`);
    setItems(p => p.filter(x => x.id !== id));
  };

  return (
    <SectionLayout title="Perfiles" icon={<Layers size={20} className="text-violet-400" />} onAdd={() => setShowForm(true)} loading={loading}>
      <AnimatePresence>
        {showForm && (
          <FormModal title="Nuevo Perfil" onClose={() => setShowForm(false)} onSave={handleCreate}>
            <FormField label="Nombre *" value={form.nombre} onChange={v => setForm(p => ({ ...p, nombre: v }))} />
            <FormField label="Descripción" value={form.descripcion} onChange={v => setForm(p => ({ ...p, descripcion: v }))} />
            <div className="space-y-2">
              <label className="text-gray-400 text-xs">Clonar desde perfil existente</label>
              <select className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-white text-sm" value={form.clonarDesdeId} onChange={e => setForm(p => ({ ...p, clonarDesdeId: e.target.value }))}>
                <option value="" className="bg-[#0d0f14]">Nuevo perfil vacío</option>
                {items.map(p => <option key={p.id} value={p.id} className="bg-[#0d0f14]">{p.nombre}</option>)}
              </select>
            </div>
          </FormModal>
        )}
      </AnimatePresence>
      <div className="space-y-2">
        {items.map(p => (
          <Card key={p.id} className="p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Layers size={16} className="text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{p.nombre}</p>
              <p className="text-gray-500 text-xs">{p.descripcion || 'Sin descripción'}</p>
            </div>
            <div className="flex gap-3 text-xs text-gray-500 flex-shrink-0">
              <span>{p._count?.usuarios ?? 0} usuarios</span>
              <span>{p._count?.permisos ?? 0} permisos</span>
              {p.esBase ? <span className="text-amber-400">BASE</span> : null}
            </div>
            {!p.esBase && (
              <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 size={14} className="text-red-400/60 hover:text-red-400" />
              </button>
            )}
          </Card>
        ))}
      </div>
    </SectionLayout>
  );
}

// ─────────────────────────────────────────────────────────
//  Roles IAM Tab
// ─────────────────────────────────────────────────────────
function RolesTab({ api }: { api: ReturnType<typeof useApi> }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', codigo: '', descripcion: '' });

  useEffect(() => { api.getList('/roles').then(setItems).finally(() => setLoading(false)); }, []);

  const handleCreate = async () => {
    const res = await api.post('/roles', form);
    if (res.id) { setItems(p => [res, ...p]); setShowForm(false); setForm({ nombre: '', codigo: '', descripcion: '' }); }
  };

  return (
    <SectionLayout title="Roles IAM" icon={<Key size={20} className="text-amber-400" />} onAdd={() => setShowForm(true)} loading={loading}>
      <AnimatePresence>
        {showForm && (
          <FormModal title="Nuevo Rol IAM" onClose={() => setShowForm(false)} onSave={handleCreate}>
            <FormField label="Nombre *" value={form.nombre} onChange={v => setForm(p => ({ ...p, nombre: v }))} />
            <FormField label="Código único *" value={form.codigo} onChange={v => setForm(p => ({ ...p, codigo: v.toUpperCase() }))} placeholder="Ej: ROL_MEDICO_SENIOR" />
            <FormField label="Descripción" value={form.descripcion} onChange={v => setForm(p => ({ ...p, descripcion: v }))} />
          </FormModal>
        )}
      </AnimatePresence>
      <div className="space-y-2">
        {items.map(r => (
          <Card key={r.id} className="p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Key size={16} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{r.nombre}</p>
              <p className="text-gray-500 text-xs font-mono">{r.codigo}</p>
            </div>
            <div className="flex gap-3 text-xs text-gray-500">
              <span>{r._count?.perfiles ?? 0} perfiles</span>
              <span>{r._count?.permisos ?? 0} permisos</span>
              {r.esBase && <span className="text-amber-400">BASE</span>}
            </div>
          </Card>
        ))}
      </div>
    </SectionLayout>
  );
}

// ─────────────────────────────────────────────────────────
//  Grupos Tab
// ─────────────────────────────────────────────────────────
function GruposTab({ api }: { api: ReturnType<typeof useApi> }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });

  useEffect(() => { api.getList('/grupos').then(setItems).finally(() => setLoading(false)); }, []);

  const handleCreate = async () => {
    const res = await api.post('/grupos', form);
    if (res.id) { setItems(p => [res, ...p]); setShowForm(false); setForm({ nombre: '', descripcion: '' }); }
  };

  return (
    <SectionLayout title="Grupos de Usuarios" icon={<Users size={20} className="text-teal-400" />} onAdd={() => setShowForm(true)} loading={loading}>
      <AnimatePresence>
        {showForm && (
          <FormModal title="Nuevo Grupo" onClose={() => setShowForm(false)} onSave={handleCreate}>
            <FormField label="Nombre *" value={form.nombre} onChange={v => setForm(p => ({ ...p, nombre: v }))} />
            <FormField label="Descripción" value={form.descripcion} onChange={v => setForm(p => ({ ...p, descripcion: v }))} />
          </FormModal>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map(g => (
          <Card key={g.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
                <Users size={16} className="text-teal-400" />
              </div>
              <div>
                <p className="text-white font-semibold">{g.nombre}</p>
                <p className="text-gray-500 text-xs">{g.descripcion || 'Sin descripción'}</p>
              </div>
              <span className="ml-auto text-xs text-gray-500">{g._count?.miembros ?? 0} miembros</span>
            </div>
          </Card>
        ))}
      </div>
    </SectionLayout>
  );
}

// ─────────────────────────────────────────────────────────
//  Permisos Tab — Vista matricial RBAC
// ─────────────────────────────────────────────────────────
function PermisosTab({ api }: { api: ReturnType<typeof useApi> }) {
  const [recursos, setRecursos] = useState<any[]>([]);
  const [perfiles, setPerfiles] = useState<any[]>([]);
  const [selPerfil, setSelPerfil] = useState('');
  const [permisos, setPermisos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const ACCIONES = ['VER', 'CREAR', 'EDITAR', 'ELIMINAR', 'IMPRIMIR', 'EXPORTAR', 'APROBAR', 'ANULAR'];

  useEffect(() => {
    Promise.all([api.getList('/recursos'), api.getList('/perfiles')]).then(([r, p]) => { setRecursos(r); setPerfiles(p); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selPerfil) api.getList(`/permisos?sujetoTipo=PERFIL&sujetoId=${selPerfil}`).then(setPermisos);
  }, [selPerfil]);

  const tienePermiso = (recursoId: string, accion: string) =>
    permisos.some(p => p.recursoId === recursoId && p.accion === accion && p.efecto === 'PERMITIR');

  const recargar = async () => {
    const updated = await api.getList(`/permisos?sujetoTipo=PERFIL&sujetoId=${selPerfil}`);
    setPermisos(updated);
  };

  const flatRecursos = (list: any[], level = 0): { item: any; level: number }[] =>
    list.flatMap(r => [{ item: r, level }, ...flatRecursos(r.hijos || [], level + 1)]);

  const flat = flatRecursos(recursos);

  const togglePermiso = async (recurso: any, accion: string) => {
    const tiene = tienePermiso(recurso.id, accion);
    await api.post('/permisos', {
      sujetoTipo: 'PERFIL', sujetoId: selPerfil,
      recursoCodigo: recurso.codigo, accion,
      efecto: tiene ? 'DENEGAR' : 'PERMITIR',
    });
    await recargar();
  };

  // ── Asignar TODOS los permisos al perfil
  const asignarTodos = async () => {
    if (!selPerfil || guardando) return;
    setGuardando(true);
    await Promise.all(
      flat.flatMap(({ item }) =>
        ACCIONES.map(accion =>
          api.post('/permisos', {
            sujetoTipo: 'PERFIL', sujetoId: selPerfil,
            recursoCodigo: item.codigo, accion, efecto: 'PERMITIR',
          })
        )
      )
    );
    await recargar();
    setGuardando(false);
  };

  // ── Quitar TODOS los permisos del perfil
  const revocarTodos = async () => {
    if (!selPerfil || guardando) return;
    setGuardando(true);
    await Promise.all(
      flat.flatMap(({ item }) =>
        ACCIONES.map(accion =>
          api.post('/permisos', {
            sujetoTipo: 'PERFIL', sujetoId: selPerfil,
            recursoCodigo: item.codigo, accion, efecto: 'DENEGAR',
          })
        )
      )
    );
    await recargar();
    setGuardando(false);
  };

  // ── Toggle toda una columna (acción)
  const toggleColumna = async (accion: string) => {
    if (!selPerfil || guardando) return;
    const todasTienen = flat.every(({ item }) => tienePermiso(item.id, accion));
    setGuardando(true);
    await Promise.all(
      flat.map(({ item }) =>
        api.post('/permisos', {
          sujetoTipo: 'PERFIL', sujetoId: selPerfil,
          recursoCodigo: item.codigo, accion,
          efecto: todasTienen ? 'DENEGAR' : 'PERMITIR',
        })
      )
    );
    await recargar();
    setGuardando(false);
  };

  // ── Toggle toda una fila (recurso)
  const toggleFila = async (recurso: any) => {
    if (!selPerfil || guardando) return;
    const todasTienen = ACCIONES.every(a => tienePermiso(recurso.id, a));
    setGuardando(true);
    await Promise.all(
      ACCIONES.map(accion =>
        api.post('/permisos', {
          sujetoTipo: 'PERFIL', sujetoId: selPerfil,
          recursoCodigo: recurso.codigo, accion,
          efecto: todasTienen ? 'DENEGAR' : 'PERMITIR',
        })
      )
    );
    await recargar();
    setGuardando(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Lock size={20} className="text-rose-400" />
          Matriz de Permisos
        </h2>
        <select className="bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-white text-sm min-w-[200px]" value={selPerfil} onChange={e => setSelPerfil(e.target.value)}>
          <option value="" className="bg-[#0d0f14]">Seleccionar perfil...</option>
          {perfiles.map(p => <option key={p.id} value={p.id} className="bg-[#0d0f14]">{p.nombre}</option>)}
        </select>
      </div>

      {/* Barra de acciones masivas */}
      {selPerfil && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={asignarTodos}
            disabled={guardando}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-all"
          >
            <CheckCircle size={13} />
            {guardando ? 'Guardando…' : 'Marcar todos'}
          </button>
          <button
            onClick={revocarTodos}
            disabled={guardando}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-all"
          >
            <XCircle size={13} />
            {guardando ? 'Guardando…' : 'Quitar todos'}
          </button>
          <span className="text-xs text-gray-600 self-center ml-2">
            También puedes hacer clic en una columna o en el nombre de un recurso para marcar/desmarcar toda esa fila/columna.
          </span>
        </div>
      )}

      {selPerfil ? (
        <div className="overflow-auto rounded-2xl border border-white/5">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#0a0c13] border-b border-white/5">
                <th className="text-left text-gray-500 font-medium px-4 py-3 min-w-[200px]">Recurso</th>
                {ACCIONES.map(a => {
                  const todasTienen = flat.length > 0 && flat.every(({ item }) => tienePermiso(item.id, a));
                  return (
                    <th key={a} className="text-center px-2 py-3 min-w-[70px]">
                      <button
                        onClick={() => toggleColumna(a)}
                        disabled={guardando}
                        title={`Click para ${todasTienen ? 'quitar' : 'marcar'} todos en ${a}`}
                        className={`w-full font-semibold transition-colors rounded-lg py-0.5 ${
                          todasTienen
                            ? 'text-emerald-400 hover:text-emerald-300'
                            : 'text-gray-500 hover:text-white'
                        }`}
                      >
                        {a}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {flat.map(({ item, level }) => {
                const todasFilaTienen = ACCIONES.every(a => tienePermiso(item.id, a));
                return (
                  <tr key={item.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5" style={{ paddingLeft: `${16 + level * 16}px` }}>
                      <div className="flex items-center gap-1.5">
                        {level > 0 && <ChevronRight size={11} className="text-gray-600" />}
                        <button
                          onClick={() => toggleFila(item)}
                          disabled={guardando}
                          title={`Click para ${todasFilaTienen ? 'quitar' : 'marcar'} todos los permisos de ${item.nombre}`}
                          className={`text-left font-${level === 0 ? 'semibold' : 'normal'} transition-colors hover:underline ${
                            level === 0 ? 'text-white' : level === 1 ? 'text-gray-300' : 'text-gray-400'
                          } ${todasFilaTienen ? 'text-emerald-300' : ''}`}
                        >
                          {item.nombre}
                        </button>
                        <span className="text-gray-600 font-mono text-[10px]">{item.tipo}</span>
                      </div>
                    </td>
                    {ACCIONES.map(accion => (
                      <td key={accion} className="text-center px-2 py-2.5">
                        <button
                          onClick={() => togglePermiso(item, accion)}
                          disabled={guardando}
                          className={`w-6 h-6 rounded-lg border transition-all mx-auto flex items-center justify-center disabled:opacity-50 ${
                            tienePermiso(item.id, accion)
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                              : 'bg-white/[0.03] border-white/10 text-gray-700 hover:border-white/20'
                          }`}
                        >
                          {tienePermiso(item.id, accion) ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        </button>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <Lock size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Selecciona un perfil para ver/editar la matriz de permisos</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Políticas Tab
// ─────────────────────────────────────────────────────────
function PoliticasTab({ api }: { api: ReturnType<typeof useApi> }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getList('/politicas').then(setItems).finally(() => setLoading(false)); }, []);

  return (
    <SectionLayout title="Políticas de Seguridad" icon={<Shield size={20} className="text-indigo-400" />} loading={loading}>
      <div className="space-y-4">
        {items.map(p => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white font-semibold">{p.nombre}</p>
                <p className="text-gray-500 text-xs">{p.empresa?.nombre || 'Global'}</p>
              </div>
              {p.esDefault && <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">DEFAULT</span>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Long. mín. password', value: p.longitudMinima },
                { label: 'Vencimiento (días)',    value: p.diasVencimientoPassword || 'Nunca' },
                { label: 'Historial passwords',  value: p.historialPasswords },
                { label: 'Inactividad (min)',     value: p.tiempoInactividad },
                { label: 'Sesiones máx.',         value: p.sesionesMaximas },
                { label: 'Intentos fallidos',     value: p.intentosFallidos },
              ].map(item => (
                <div key={item.label} className="bg-white/[0.03] rounded-xl px-3 py-2 border border-white/5">
                  <p className="text-gray-500 text-[10px]">{item.label}</p>
                  <p className="text-white font-semibold text-sm">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-3 flex-wrap">
              {p.requiereMayusculas  && <Tag>Mayúsculas</Tag>}
              {p.requiereNumeros     && <Tag>Números</Tag>}
              {p.requiereEspeciales  && <Tag>Caracteres especiales</Tag>}
              {p.mfaObligatorio      && <Tag color="text-amber-400 bg-amber-500/10 border-amber-500/20">MFA Obligatorio</Tag>}
            </div>
          </Card>
        ))}
        {items.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-600">
            <Shield size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay políticas configuradas</p>
          </div>
        )}
      </div>
    </SectionLayout>
  );
}

// ─────────────────────────────────────────────────────────
//  Sesiones Activas Tab
// ─────────────────────────────────────────────────────────
function SesionesTab({ api }: { api: ReturnType<typeof useApi> }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.getList('/sesiones').then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const revocar = async (id: string) => { await api.del(`/sesiones/${id}`); load(); };

  return (
    <SectionLayout title="Sesiones Activas" icon={<Globe size={20} className="text-emerald-400" />} loading={loading} onRefresh={load}>
      <div className="space-y-2">
        {items.map(s => (
          <Card key={s.id} className="p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Smartphone size={16} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{s.usuario?.nombre} {s.usuario?.apellido}</p>
              <p className="text-gray-500 text-xs truncate">{s.ipAddress} · {s.userAgent?.slice(0, 60)}</p>
            </div>
            <div className="text-xs text-gray-500 text-right flex-shrink-0 mr-2">
              <p>Último: {new Date(s.ultimaActividad).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
              <p>Expira: {new Date(s.expiraEn).toLocaleDateString('es-CO')}</p>
            </div>
            <button onClick={() => revocar(s.id)} className="p-2 hover:bg-red-500/10 rounded-xl transition-colors flex-shrink-0" title="Revocar sesión">
              <LogOut size={14} className="text-red-400/60 hover:text-red-400" />
            </button>
          </Card>
        ))}
        {items.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-600">
            <Globe size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay sesiones activas</p>
          </div>
        )}
      </div>
    </SectionLayout>
  );
}

// ─────────────────────────────────────────────────────────
//  Delegaciones Tab
// ─────────────────────────────────────────────────────────
function DelegacionesTab({ api }: { api: ReturnType<typeof useApi> }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ delegadoId: '', motivo: '', fechaInicio: '', fechaFin: '', recursosCodigos: '' });

  const load = () => api.getList('/delegaciones').then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const res = await api.post('/delegaciones', {
      ...form,
      recursosCodigos: form.recursosCodigos.split(',').map(s => s.trim()).filter(Boolean),
    });
    if (res.id) { load(); setShowForm(false); }
  };

  const revocar = async (id: string) => { await api.del(`/delegaciones/${id}`); load(); };

  const ahora = new Date();
  const activas = items.filter(d => d.activa && new Date(d.fechaFin) >= ahora);
  const expiradas = items.filter(d => !d.activa || new Date(d.fechaFin) < ahora);

  return (
    <SectionLayout title="Delegaciones Temporales" icon={<UserCheck size={20} className="text-indigo-400" />} onAdd={() => setShowForm(true)} loading={loading}>
      <AnimatePresence>
        {showForm && (
          <FormModal title="Nueva Delegación" onClose={() => setShowForm(false)} onSave={handleCreate}>
            <FormField label="ID del usuario delegado *" value={form.delegadoId} onChange={v => setForm(p => ({ ...p, delegadoId: v }))} placeholder="userId del sustituto" />
            <FormField label="Motivo" value={form.motivo} onChange={v => setForm(p => ({ ...p, motivo: v }))} />
            <FormField label="Fecha inicio *" value={form.fechaInicio} onChange={v => setForm(p => ({ ...p, fechaInicio: v }))} placeholder="2026-07-08T08:00" />
            <FormField label="Fecha fin *" value={form.fechaFin} onChange={v => setForm(p => ({ ...p, fechaFin: v }))} placeholder="2026-07-15T18:00" />
            <FormField label="Recursos (cód. separados por coma)" value={form.recursosCodigos} onChange={v => setForm(p => ({ ...p, recursosCodigos: v }))} placeholder="AGENDA.CITAS, CLINICA.HISTORIA" />
          </FormModal>
        )}
      </AnimatePresence>

      {activas.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 font-medium">ACTIVAS ({activas.length})</p>
          <div className="space-y-2">
            {activas.map(d => <DelegacionCard key={d.id} d={d} onRevocar={revocar} />)}
          </div>
        </div>
      )}
      {expiradas.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">EXPIRADAS ({expiradas.length})</p>
          <div className="space-y-2 opacity-50">
            {expiradas.slice(0, 5).map(d => <DelegacionCard key={d.id} d={d} />)}
          </div>
        </div>
      )}
    </SectionLayout>
  );
}

function DelegacionCard({ d, onRevocar }: { d: any; onRevocar?: (id: string) => void }) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
        <UserCheck size={16} className="text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium">
          {d.delegante?.nombre} → {d.delegado?.nombre}
        </p>
        <p className="text-gray-500 text-xs">{d.motivo || 'Sin motivo'} · {d.recursosCodigos?.join(', ')}</p>
        <p className="text-gray-600 text-[10px]">{new Date(d.fechaInicio).toLocaleDateString('es-CO')} — {new Date(d.fechaFin).toLocaleDateString('es-CO')}</p>
      </div>
      {onRevocar && (
        <button onClick={() => onRevocar(d.id)} className="p-2 hover:bg-red-500/10 rounded-xl transition-colors flex-shrink-0">
          <Ban size={14} className="text-red-400/60 hover:text-red-400" />
        </button>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
//  Auditoría Tab
// ─────────────────────────────────────────────────────────
function AuditoriaTab({ api }: { api: ReturnType<typeof useApi> }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { api.getList('/auditoria/accesos').then(setItems).finally(() => setLoading(false)); }, []);

  const filtered = items.filter(i =>
    !search || i.email?.toLowerCase().includes(search.toLowerCase()) || i.accion?.toLowerCase().includes(search.toLowerCase())
  );

  const colorResultado = (r: string) => r === 'EXITOSO' ? 'text-emerald-400' : r === 'FALLIDO' ? 'text-red-400' : 'text-amber-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity size={20} className="text-blue-400" /> Historial de Accesos
        </h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="bg-[#0d0f14] border border-white/10 rounded-xl pl-8 pr-4 py-2 text-white text-sm w-52 outline-none focus:border-blue-500/50" />
        </div>
      </div>
      <div className="overflow-auto rounded-2xl border border-white/5">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#0a0c13] border-b border-white/5 text-gray-500">
              <th className="text-left px-4 py-3">Usuario</th>
              <th className="text-left px-4 py-3">Acción</th>
              <th className="text-left px-4 py-3">Recurso</th>
              <th className="text-left px-4 py-3">Resultado</th>
              <th className="text-left px-4 py-3">IP</th>
              <th className="text-left px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map(log => (
              <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                <td className="px-4 py-2.5 text-gray-300">{log.email || log.usuarioId?.slice(0, 8) || '—'}</td>
                <td className="px-4 py-2.5 text-white font-mono">{log.accion}</td>
                <td className="px-4 py-2.5 text-gray-400">{log.recurso || '—'}</td>
                <td className={`px-4 py-2.5 font-medium ${colorResultado(log.resultado)}`}>{log.resultado}</td>
                <td className="px-4 py-2.5 text-gray-500 font-mono">{log.ipAddress || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{new Date(log.createdAt).toLocaleString('es-CO')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !loading && (
          <div className="text-center py-10 text-gray-600"><p>Sin registros</p></div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Eventos de Seguridad Tab
// ─────────────────────────────────────────────────────────
function EventosTab({ api }: { api: ReturnType<typeof useApi> }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.getList('/auditoria/eventos').then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const resolver = async (id: string) => {
    await api.put(`/auditoria/eventos/${id}/resolver`, {});
    load();
  };

  const colorSev = (s: string) => ({ CRITICA: 'text-red-400 bg-red-500/10 border-red-500/20', ALTA: 'text-orange-400 bg-orange-500/10 border-orange-500/20', MEDIA: 'text-amber-400 bg-amber-500/10 border-amber-500/20', BAJA: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' })[s] || 'text-gray-400';

  return (
    <SectionLayout title="Eventos de Seguridad" icon={<AlertTriangle size={20} className="text-red-400" />} loading={loading} onRefresh={load}>
      <div className="space-y-2">
        {items.map(ev => (
          <Card key={ev.id} className="p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-medium">{ev.tipo.replace(/_/g, ' ')}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${colorSev(ev.severidad)}`}>{ev.severidad}</span>
              </div>
              <p className="text-gray-500 text-xs">{ev.email || ev.usuarioId || 'Anónimo'} · IP: {ev.ipAddress || '—'}</p>
              <p className="text-gray-600 text-[10px]">{new Date(ev.createdAt).toLocaleString('es-CO')}</p>
            </div>
            <button onClick={() => resolver(ev.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors flex-shrink-0">
              <CheckCircle size={12} /> Resolver
            </button>
          </Card>
        ))}
        {items.length === 0 && !loading && (
          <div className="text-center py-12 text-emerald-600/50">
            <CheckCircle size={36} className="mx-auto mb-3" />
            <p className="text-sm">Sin eventos pendientes</p>
          </div>
        )}
      </div>
    </SectionLayout>
  );
}

// ─────────────────────────────────────────────────────────
//  Componentes reutilizables
// ─────────────────────────────────────────────────────────
function SectionLayout({ title, icon, children, onAdd, loading, onRefresh }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
  onAdd?: () => void; loading?: boolean; onRefresh?: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">{icon}{title}</h2>
        <div className="flex gap-2">
          {onRefresh && (
            <button onClick={onRefresh} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          {onAdd && (
            <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl text-sm font-medium transition-all">
              <Plus size={14} /> Nuevo
            </button>
          )}
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
          <RefreshCw size={18} className="animate-spin" /> Cargando...
        </div>
      ) : children}
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-white/5 rounded-2xl hover:border-white/10 transition-all ${className}`}>
      {children}
    </div>
  );
}

function FormModal({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-[#0d0f14] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><XCircle size={18} /></button>
        </div>
        {children}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors">Cancelar</button>
          <button onClick={onSave} className="flex-1 py-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-sm font-medium transition-all">Guardar</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FormField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-gray-400 text-xs">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-[#11141b] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 placeholder-gray-600" />
    </div>
  );
}

function Tag({ children, color = 'text-gray-400 bg-white/5 border-white/10' }: { children: React.ReactNode; color?: string }) {
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${color}`}>{children}</span>;
}
