import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, FileText, Plus, Search, X, ChevronRight, Users,
  Package, Tag, CheckCircle2, XCircle, Clock, AlertTriangle,
  Edit2, Trash2, ChevronDown, RefreshCw, DollarSign, Calendar,
  Phone, Mail, MapPin, User, Shield, Briefcase, Save, Eye,
} from 'lucide-react';
import { apiCall } from '../services/api';

// ─── TIPOS ──────────────────────────────────────────────────────────────────

interface Empresa {
  id: string;
  razonSocial: string;
  nombreComercial?: string;
  nit: string;
  tipo: string;
  contactoNombre?: string;
  contactoCargo?: string;
  contactoEmail?: string;
  contactoTelefono?: string;
  direccion?: string;
  ciudad?: string;
  estado: boolean;
  _count?: { contratos: number };
}

interface ContratoTarifa {
  id: string;
  codigoCUPS: string;
  descripcionCUPS: string;
  precioBase: number;
  precioNegociado: number;
  porcentajeDescuento: number;
  porcentajeCobertura: number;
  activo: boolean;
}

interface PaqueteItem {
  id: string;
  codigoCUPS?: string;
  descripcion: string;
  cantidad: number;
  precioUnit: number;
  esPrincipal: boolean;
}

interface ContratoPaquete {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  activo: boolean;
  items: PaqueteItem[];
}

interface Beneficiario {
  id: string;
  nombre: string;
  documento: string;
  tipoDoc: string;
  email?: string;
  telefono?: string;
  tipo: string;
  estado: string;
  paciente?: { id: string; nombreCompleto: string; numeroDocumento: string } | null;
}

interface Contrato {
  id: string;
  numero: number;
  descripcion: string;
  empresaId: string;
  empresa: Empresa;
  tipo: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  montoTotal?: number;
  montoMensual?: number;
  diasCredito: number;
  porcentajeDescuento: number;
  porcentajeCobertura: number;
  observaciones?: string;
  creadoPor: { id: string; nombre: string; apellido: string };
  tarifas: ContratoTarifa[];
  paquetes: ContratoPaquete[];
  _count: { beneficiarios: number };
  createdAt: string;
}

interface Stats {
  totalContratos: number;
  activos: number;
  porVencer: number;
  empresas: number;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

const fmt = (n?: number) =>
  n != null ? `$${n.toLocaleString('es-CO', { minimumFractionDigits: 0 })}` : '—';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const diasRestantes = (fechaFin: string) => {
  const diff = new Date(fechaFin).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const ESTADOS_CONTRATO: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  BORRADOR:  { label: 'Borrador',  color: 'text-slate-400 bg-slate-500/10 border-slate-500/30', icon: <Edit2 size={11} /> },
  ACTIVO:    { label: 'Activo',    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 size={11} /> },
  SUSPENDIDO:{ label: 'Suspendido',color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: <Clock size={11} /> },
  VENCIDO:   { label: 'Vencido',   color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: <XCircle size={11} /> },
  CANCELADO: { label: 'Cancelado', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', icon: <XCircle size={11} /> },
};

const TIPOS_EMPRESA = ['EMPRESA', 'ASEGURADORA', 'CONVENIO'];
const TIPOS_CONTRATO = ['CONVENIO', 'CORPORATIVO', 'COLECTIVO'];

function EstadoChip({ estado }: { estado: string }) {
  const cfg = ESTADOS_CONTRATO[estado] ?? ESTADOS_CONTRATO.BORRADOR;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────

export default function ContratacionPage() {
  const token = localStorage.getItem('accessToken') ?? '';

  // Estado general
  const [tab, setTab] = useState<'contratos' | 'empresas'>('contratos');
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros contratos
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroEmpresa, setFiltroEmpresa] = useState('');

  // Filtros empresas
  const [busqEmpresa, setBusqEmpresa] = useState('');

  // Modales
  const [showNuevoContrato, setShowNuevoContrato] = useState(false);
  const [showNuevaEmpresa, setShowNuevaEmpresa] = useState(false);
  const [contratoDetalle, setContratoDetalle] = useState<Contrato | null>(null);
  const [empresaEditar, setEmpresaEditar] = useState<Empresa | null>(null);

  // Carga inicial
  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    setLoading(true);
    setError(null);
    try {
      const [resContratos, resEmpresas, resStats] = await Promise.all([
        apiCall<{ contratos: Contrato[] }>('/contratacion', { token }),
        apiCall<{ empresas: Empresa[] }>('/contratacion/empresas', { token }),
        apiCall<{ stats: Stats }>('/contratacion/stats', { token }),
      ]);
      if (resContratos.data?.contratos) setContratos(resContratos.data.contratos);
      if (resEmpresas.data?.empresas) setEmpresas(resEmpresas.data.empresas);
      if (resStats.data?.stats) setStats(resStats.data.stats);
    } catch {
      setError('Error cargando datos. Verifica la conexión con el servidor.');
    }
    setLoading(false);
  }

  // Actualizar estado de contrato localmente
  function actualizarContratoLocal(contrato: Contrato) {
    setContratos(prev => prev.map(c => c.id === contrato.id ? contrato : c));
    if (contratoDetalle?.id === contrato.id) setContratoDetalle(contrato);
  }

  // Filtrado
  const contratosFiltrados = useMemo(() => {
    return contratos.filter(c => {
      const matchEstado = filtroEstado === 'TODOS' || c.estado === filtroEstado;
      const matchEmpresa = !filtroEmpresa || c.empresaId === filtroEmpresa;
      const q = busqueda.toLowerCase();
      const matchBusqueda = !q || c.descripcion.toLowerCase().includes(q) ||
        c.empresa.razonSocial.toLowerCase().includes(q) ||
        c.empresa.nit.includes(q) ||
        String(c.numero).includes(q);
      return matchEstado && matchEmpresa && matchBusqueda;
    });
  }, [contratos, filtroEstado, filtroEmpresa, busqueda]);

  const empresasFiltradas = useMemo(() => {
    const q = busqEmpresa.toLowerCase();
    return empresas.filter(e =>
      !q || e.razonSocial.toLowerCase().includes(q) ||
      e.nit.includes(q) || (e.nombreComercial ?? '').toLowerCase().includes(q)
    );
  }, [empresas, busqEmpresa]);

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-[#0a0c11] text-white overflow-hidden">

      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Contratación</h1>
              <p className="text-xs text-slate-400">Convenios y contratos con empresas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={cargarTodo} className="p-2 text-slate-400 hover:text-white transition-colors" title="Recargar">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => tab === 'contratos' ? setShowNuevoContrato(true) : setShowNuevaEmpresa(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={15} />
              {tab === 'contratos' ? 'Nuevo Contrato' : 'Nueva Empresa'}
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Total contratos', value: stats.totalContratos, icon: <FileText size={14} />, color: 'text-indigo-400' },
              { label: 'Activos', value: stats.activos, icon: <CheckCircle2 size={14} />, color: 'text-emerald-400' },
              { label: 'Por vencer (30d)', value: stats.porVencer, icon: <AlertTriangle size={14} />, color: 'text-amber-400' },
              { label: 'Empresas', value: stats.empresas, icon: <Building2 size={14} />, color: 'text-violet-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex items-center gap-3">
                <div className={`${s.color} opacity-80`}>{s.icon}</div>
                <div>
                  <p className="text-lg font-semibold text-white leading-none">{s.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-white/[0.03] rounded-lg p-1 w-fit">
          {([['contratos', 'Contratos', <FileText size={13} />], ['empresas', 'Empresas', <Building2 size={13} />]] as const).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                tab === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <XCircle size={15} /> {error}
        </div>
      )}

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {tab === 'contratos' ? (
          <TablaContratos
            contratos={contratosFiltrados}
            empresas={empresas}
            loading={loading}
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            filtroEmpresa={filtroEmpresa}
            setFiltroEmpresa={setFiltroEmpresa}
            onVerDetalle={setContratoDetalle}
            token={token}
            onActualizar={actualizarContratoLocal}
          />
        ) : (
          <TablaEmpresas
            empresas={empresasFiltradas}
            loading={loading}
            busqueda={busqEmpresa}
            setBusqueda={setBusqEmpresa}
            onEditar={setEmpresaEditar}
          />
        )}
      </div>

      {/* Modal nuevo contrato */}
      <AnimatePresence>
        {showNuevoContrato && (
          <ModalNuevoContrato
            empresas={empresas}
            token={token}
            onClose={() => setShowNuevoContrato(false)}
            onCreado={(c) => { setContratos(prev => [c, ...prev]); setShowNuevoContrato(false); cargarTodo(); }}
          />
        )}
      </AnimatePresence>

      {/* Modal nueva/editar empresa */}
      <AnimatePresence>
        {(showNuevaEmpresa || empresaEditar) && (
          <ModalEmpresa
            empresa={empresaEditar}
            token={token}
            onClose={() => { setShowNuevaEmpresa(false); setEmpresaEditar(null); }}
            onGuardado={() => { setShowNuevaEmpresa(false); setEmpresaEditar(null); cargarTodo(); }}
          />
        )}
      </AnimatePresence>

      {/* Modal detalle contrato */}
      <AnimatePresence>
        {contratoDetalle && (
          <ModalDetalleContrato
            contrato={contratoDetalle}
            token={token}
            onClose={() => setContratoDetalle(null)}
            onActualizar={actualizarContratoLocal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TABLA CONTRATOS ─────────────────────────────────────────────────────────

function TablaContratos({
  contratos, empresas, loading, busqueda, setBusqueda,
  filtroEstado, setFiltroEstado, filtroEmpresa, setFiltroEmpresa,
  onVerDetalle, token, onActualizar,
}: {
  contratos: Contrato[];
  empresas: Empresa[];
  loading: boolean;
  busqueda: string;
  setBusqueda: (v: string) => void;
  filtroEstado: string;
  setFiltroEstado: (v: string) => void;
  filtroEmpresa: string;
  setFiltroEmpresa: (v: string) => void;
  onVerDetalle: (c: Contrato) => void;
  token: string;
  onActualizar: (c: Contrato) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por descripción, empresa, NIT..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
          {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={13} /></button>}
        </div>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
        >
          <option value="TODOS">Todos los estados</option>
          {Object.entries(ESTADOS_CONTRATO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select
          value={filtroEmpresa}
          onChange={e => setFiltroEmpresa(e.target.value)}
          className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
        >
          <option value="">Todas las empresas</option>
          {empresas.map(e => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <RefreshCw size={20} className="animate-spin mr-2" /> Cargando contratos...
        </div>
      )}

      {/* Lista */}
      {!loading && contratos.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay contratos que coincidan con los filtros</p>
        </div>
      )}

      {!loading && contratos.map(contrato => {
        const dias = diasRestantes(contrato.fechaFin);
        const alerta = contrato.estado === 'ACTIVO' && dias <= 30 && dias > 0;
        return (
          <motion.div
            key={contrato.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] border border-white/5 hover:border-indigo-500/20 rounded-xl p-4 transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText size={16} className="text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-500 font-mono">#{contrato.numero}</span>
                    <h3 className="text-sm font-medium text-white truncate">{contrato.descripcion}</h3>
                    <EstadoChip estado={contrato.estado} />
                    {alerta && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border text-amber-400 bg-amber-500/10 border-amber-500/30">
                        <AlertTriangle size={10} /> Vence en {dias}d
                      </span>
                    )}
                    {contrato.estado === 'ACTIVO' && dias <= 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border text-red-400 bg-red-500/10 border-red-500/30">
                        <XCircle size={10} /> Vencido hace {Math.abs(dias)}d
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Building2 size={11} /> {contrato.empresa.razonSocial}
                    <span className="text-slate-600 mx-1">·</span>
                    NIT {contrato.empresa.nit}
                    <span className="text-slate-600 mx-1">·</span>
                    <span className="capitalize">{contrato.tipo.toLowerCase()}</span>
                  </p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar size={10} /> {fmtDate(contrato.fechaInicio)} → {fmtDate(contrato.fechaFin)}
                    </span>
                    {contrato.montoTotal && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <DollarSign size={10} /> {fmt(contrato.montoTotal)}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Tag size={10} /> {contrato.tarifas.length} tarifas
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Package size={10} /> {contrato.paquetes.length} paquetes
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Users size={10} /> {contrato._count.beneficiarios} beneficiarios
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onVerDetalle(contrato)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-indigo-400 hover:text-white hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 transition-all opacity-0 group-hover:opacity-100"
              >
                <Eye size={13} /> Ver detalle
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── TABLA EMPRESAS ──────────────────────────────────────────────────────────

function TablaEmpresas({ empresas, loading, busqueda, setBusqueda, onEditar }: {
  empresas: Empresa[];
  loading: boolean;
  busqueda: string;
  setBusqueda: (v: string) => void;
  onEditar: (e: Empresa) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar empresa, NIT..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <RefreshCw size={20} className="animate-spin mr-2" /> Cargando empresas...
        </div>
      )}

      {!loading && empresas.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay empresas registradas</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {!loading && empresas.map(emp => (
          <motion.div
            key={emp.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/[0.03] border border-white/5 hover:border-violet-500/20 rounded-xl p-4 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Building2 size={16} className="text-violet-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  emp.estado ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-slate-500 bg-slate-500/10 border-slate-500/30'
                }`}>
                  {emp.estado ? 'Activa' : 'Inactiva'}
                </span>
                <button
                  onClick={() => onEditar(emp)}
                  className="p-1 text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Edit2 size={13} />
                </button>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-white leading-tight">{emp.razonSocial}</h3>
            {emp.nombreComercial && <p className="text-xs text-slate-500">{emp.nombreComercial}</p>}
            <p className="text-xs text-slate-400 mt-1 font-mono">NIT: {emp.nit}</p>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {emp._count?.contratos ?? 0} contrato{(emp._count?.contratos ?? 0) !== 1 ? 's' : ''}
              </span>
              <span className="text-[11px] text-slate-500 px-2 py-0.5 bg-violet-500/10 rounded-full text-violet-400">
                {emp.tipo}
              </span>
            </div>
            {(emp.contactoNombre || emp.contactoEmail) && (
              <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                {emp.contactoNombre && <p className="flex items-center gap-1"><User size={10} /> {emp.contactoNombre}</p>}
                {emp.contactoEmail && <p className="flex items-center gap-1"><Mail size={10} /> {emp.contactoEmail}</p>}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── MODAL NUEVO CONTRATO ────────────────────────────────────────────────────

function ModalNuevoContrato({ empresas, token, onClose, onCreado }: {
  empresas: Empresa[];
  token: string;
  onClose: () => void;
  onCreado: (c: Contrato) => void;
}) {
  const [form, setForm] = useState({
    descripcion: '', empresaId: '', tipo: 'CONVENIO',
    fechaInicio: '', fechaFin: '',
    montoTotal: '', montoMensual: '', diasCredito: '30',
    porcentajeDescuento: '0', porcentajeCobertura: '100',
    observaciones: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function guardar() {
    if (!form.descripcion.trim() || !form.empresaId || !form.fechaInicio || !form.fechaFin) {
      setErr('Completa los campos obligatorios: descripción, empresa y fechas');
      return;
    }
    setSaving(true);
    setErr(null);
    const res = await apiCall<{ contrato: Contrato }>('/contratacion', {
      method: 'POST',
      token,
      body: {
        ...form,
        montoTotal: form.montoTotal ? Number(form.montoTotal) : undefined,
        montoMensual: form.montoMensual ? Number(form.montoMensual) : undefined,
        diasCredito: Number(form.diasCredito),
        porcentajeDescuento: Number(form.porcentajeDescuento),
        porcentajeCobertura: Number(form.porcentajeCobertura),
      },
    });
    setSaving(false);
    if (res.error) { setErr(res.error); return; }
    if (res.data?.contrato) onCreado(res.data.contrato);
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-xl">
        <ModalHeader title="Nuevo Contrato" icon={<FileText size={16} />} onClose={onClose} />
        <div className="p-5 space-y-4">
          {err && <ErrBox msg={err} />}

          <Campo label="Descripción *">
            <input value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              placeholder="Nombre o descripción del contrato"
              className={inputCls} />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Empresa *">
              <select value={form.empresaId} onChange={e => set('empresaId', e.target.value)} className={inputCls}>
                <option value="">Seleccionar empresa</option>
                {empresas.filter(e => e.estado).map(e => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
              </select>
            </Campo>
            <Campo label="Tipo de contrato">
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={inputCls}>
                {TIPOS_CONTRATO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Fecha inicio *">
              <input type="date" value={form.fechaInicio} onChange={e => set('fechaInicio', e.target.value)} className={inputCls} />
            </Campo>
            <Campo label="Fecha fin *">
              <input type="date" value={form.fechaFin} onChange={e => set('fechaFin', e.target.value)} className={inputCls} />
            </Campo>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Campo label="Monto total ($)">
              <input type="number" value={form.montoTotal} onChange={e => set('montoTotal', e.target.value)}
                placeholder="0" className={inputCls} />
            </Campo>
            <Campo label="Monto mensual ($)">
              <input type="number" value={form.montoMensual} onChange={e => set('montoMensual', e.target.value)}
                placeholder="0" className={inputCls} />
            </Campo>
            <Campo label="Días crédito">
              <input type="number" value={form.diasCredito} onChange={e => set('diasCredito', e.target.value)}
                className={inputCls} />
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="% Descuento general">
              <input type="number" min="0" max="100" value={form.porcentajeDescuento}
                onChange={e => set('porcentajeDescuento', e.target.value)} className={inputCls} />
            </Campo>
            <Campo label="% Cobertura">
              <input type="number" min="0" max="100" value={form.porcentajeCobertura}
                onChange={e => set('porcentajeCobertura', e.target.value)} className={inputCls} />
            </Campo>
          </div>

          <Campo label="Observaciones">
            <textarea value={form.observaciones} onChange={e => set('observaciones', e.target.value)}
              rows={2} placeholder="Notas internas del contrato..." className={inputCls} />
          </Campo>
        </div>

        <ModalFooter onClose={onClose} onSave={guardar} saving={saving} label="Crear Contrato" />
      </div>
    </ModalOverlay>
  );
}

// ─── MODAL EMPRESA ───────────────────────────────────────────────────────────

function ModalEmpresa({ empresa, token, onClose, onGuardado }: {
  empresa: Empresa | null;
  token: string;
  onClose: () => void;
  onGuardado: () => void;
}) {
  const [form, setForm] = useState({
    razonSocial: empresa?.razonSocial ?? '',
    nombreComercial: empresa?.nombreComercial ?? '',
    nit: empresa?.nit ?? '',
    tipo: empresa?.tipo ?? 'EMPRESA',
    contactoNombre: empresa?.contactoNombre ?? '',
    contactoCargo: empresa?.contactoCargo ?? '',
    contactoEmail: empresa?.contactoEmail ?? '',
    contactoTelefono: empresa?.contactoTelefono ?? '',
    direccion: empresa?.direccion ?? '',
    ciudad: empresa?.ciudad ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function guardar() {
    if (!form.razonSocial.trim() || !form.nit.trim()) {
      setErr('Razón social y NIT son obligatorios'); return;
    }
    setSaving(true); setErr(null);
    const endpoint = empresa ? `/contratacion/empresas/${empresa.id}` : '/contratacion/empresas';
    const method = empresa ? 'PUT' : 'POST';
    const res = await apiCall<{ empresa: Empresa }>(endpoint, { method, token, body: form });
    setSaving(false);
    if (res.error) { setErr(res.error); return; }
    onGuardado();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-lg">
        <ModalHeader
          title={empresa ? `Editar: ${empresa.razonSocial}` : 'Nueva Empresa'}
          icon={<Building2 size={16} />}
          onClose={onClose}
        />
        <div className="p-5 space-y-4">
          {err && <ErrBox msg={err} />}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Campo label="Razón social *">
                <input value={form.razonSocial} onChange={e => set('razonSocial', e.target.value)}
                  placeholder="Nombre legal de la empresa" className={inputCls} />
              </Campo>
            </div>
            <Campo label="Nombre comercial">
              <input value={form.nombreComercial} onChange={e => set('nombreComercial', e.target.value)}
                placeholder="Nombre de marca" className={inputCls} />
            </Campo>
            <Campo label="NIT *">
              <input value={form.nit} onChange={e => set('nit', e.target.value)}
                placeholder="900.123.456-7" className={inputCls} disabled={!!empresa} />
            </Campo>
            <Campo label="Tipo">
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={inputCls}>
                {TIPOS_EMPRESA.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Campo>
            <Campo label="Ciudad">
              <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)}
                placeholder="Bogotá, Medellín..." className={inputCls} />
            </Campo>
          </div>

          <div className="border-t border-white/5 pt-4">
            <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1">
              <User size={12} /> Contacto principal
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Nombre">
                <input value={form.contactoNombre} onChange={e => set('contactoNombre', e.target.value)}
                  placeholder="Nombre del contacto" className={inputCls} />
              </Campo>
              <Campo label="Cargo">
                <input value={form.contactoCargo} onChange={e => set('contactoCargo', e.target.value)}
                  placeholder="Gerente, Coordinador..." className={inputCls} />
              </Campo>
              <Campo label="Email">
                <input type="email" value={form.contactoEmail} onChange={e => set('contactoEmail', e.target.value)}
                  placeholder="contacto@empresa.com" className={inputCls} />
              </Campo>
              <Campo label="Teléfono">
                <input value={form.contactoTelefono} onChange={e => set('contactoTelefono', e.target.value)}
                  placeholder="601 123 4567" className={inputCls} />
              </Campo>
            </div>
          </div>

          <Campo label="Dirección">
            <input value={form.direccion} onChange={e => set('direccion', e.target.value)}
              placeholder="Calle, carrera, barrio..." className={inputCls} />
          </Campo>
        </div>
        <ModalFooter onClose={onClose} onSave={guardar} saving={saving} label={empresa ? 'Guardar cambios' : 'Crear Empresa'} />
      </div>
    </ModalOverlay>
  );
}

// ─── MODAL DETALLE CONTRATO ──────────────────────────────────────────────────

function ModalDetalleContrato({ contrato, token, onClose, onActualizar }: {
  contrato: Contrato;
  token: string;
  onClose: () => void;
  onActualizar: (c: Contrato) => void;
}) {
  const [tabDetalle, setTabDetalle] = useState<'info' | 'tarifas' | 'paquetes' | 'beneficiarios'>('info');
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [loadingBenef, setLoadingBenef] = useState(false);

  // Cargar beneficiarios cuando se activa la pestaña
  useEffect(() => {
    if (tabDetalle === 'beneficiarios' && !beneficiarios.length) {
      setLoadingBenef(true);
      apiCall<{ beneficiarios: Beneficiario[] }>(`/contratacion/${contrato.id}/beneficiarios`, { token })
        .then(r => { if (r.data?.beneficiarios) setBeneficiarios(r.data.beneficiarios); })
        .finally(() => setLoadingBenef(false));
    }
  }, [tabDetalle]);

  const transicionesValidas: Record<string, string[]> = {
    BORRADOR: ['ACTIVO', 'CANCELADO'],
    ACTIVO: ['SUSPENDIDO', 'CANCELADO'],
    SUSPENDIDO: ['ACTIVO', 'CANCELADO'],
    VENCIDO: [],
    CANCELADO: [],
  };

  async function cambiarEstado(estado: string) {
    setCambiandoEstado(true);
    const res = await apiCall<{ contrato: Contrato }>(`/contratacion/${contrato.id}/estado`, {
      method: 'PATCH', token, body: { estado },
    });
    setCambiandoEstado(false);
    if (res.data?.contrato) onActualizar(res.data.contrato);
  }

  const opciones = transicionesValidas[contrato.estado] ?? [];

  return (
    <ModalOverlay onClose={onClose} wide>
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] text-slate-500 font-mono">Contrato #{contrato.numero}</span>
              <EstadoChip estado={contrato.estado} />
            </div>
            <h2 className="text-base font-semibold text-white">{contrato.descripcion}</h2>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <Building2 size={11} /> {contrato.empresa.razonSocial} · NIT {contrato.empresa.nit}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {opciones.length > 0 && (
              <div className="flex items-center gap-1">
                {opciones.map(op => (
                  <button
                    key={op}
                    onClick={() => cambiarEstado(op)}
                    disabled={cambiandoEstado}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${
                      op === 'CANCELADO'
                        ? 'text-red-400 border-red-500/30 hover:bg-red-500/10'
                        : op === 'ACTIVO'
                        ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                        : 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
                    }`}
                  >
                    {cambiandoEstado ? '...' : ESTADOS_CONTRATO[op]?.label ?? op}
                  </button>
                ))}
              </div>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 border-b border-white/5 pb-0">
          {([
            ['info', 'Información', <FileText size={12} />],
            ['tarifas', `Tarifas (${contrato.tarifas.length})`, <Tag size={12} />],
            ['paquetes', `Paquetes (${contrato.paquetes.length})`, <Package size={12} />],
            ['beneficiarios', `Beneficiarios (${contrato._count.beneficiarios})`, <Users size={12} />],
          ] as const).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setTabDetalle(id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                tabDetalle === id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Contenido tabs */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">

          {/* INFO */}
          {tabDetalle === 'info' && (
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={<Calendar size={13} />} label="Periodo" value={`${fmtDate(contrato.fechaInicio)} → ${fmtDate(contrato.fechaFin)}`} />
              <InfoItem icon={<Briefcase size={13} />} label="Tipo" value={contrato.tipo} />
              {contrato.montoTotal && <InfoItem icon={<DollarSign size={13} />} label="Monto total" value={fmt(contrato.montoTotal)} />}
              {contrato.montoMensual && <InfoItem icon={<DollarSign size={13} />} label="Monto mensual" value={fmt(contrato.montoMensual)} />}
              <InfoItem icon={<Clock size={13} />} label="Días crédito" value={`${contrato.diasCredito} días`} />
              <InfoItem icon={<Shield size={13} />} label="% Descuento general" value={`${contrato.porcentajeDescuento}%`} />
              <InfoItem icon={<Shield size={13} />} label="% Cobertura" value={`${contrato.porcentajeCobertura}%`} />
              <InfoItem icon={<User size={13} />} label="Creado por" value={`${contrato.creadoPor.nombre} ${contrato.creadoPor.apellido}`} />
              {contrato.observaciones && (
                <div className="col-span-2">
                  <InfoItem icon={<FileText size={13} />} label="Observaciones" value={contrato.observaciones} />
                </div>
              )}
              {/* Datos empresa */}
              <div className="col-span-2 border-t border-white/5 pt-4 mt-2">
                <p className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1">
                  <Building2 size={12} /> Datos de la empresa
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem icon={<Building2 size={12} />} label="Razón social" value={contrato.empresa.razonSocial} />
                  <InfoItem icon={<FileText size={12} />} label="NIT" value={contrato.empresa.nit} />
                  {contrato.empresa.contactoNombre && <InfoItem icon={<User size={12} />} label="Contacto" value={`${contrato.empresa.contactoNombre}${contrato.empresa.contactoCargo ? ` · ${contrato.empresa.contactoCargo}` : ''}`} />}
                  {contrato.empresa.contactoEmail && <InfoItem icon={<Mail size={12} />} label="Email contacto" value={contrato.empresa.contactoEmail} />}
                  {contrato.empresa.contactoTelefono && <InfoItem icon={<Phone size={12} />} label="Teléfono" value={contrato.empresa.contactoTelefono} />}
                  {contrato.empresa.ciudad && <InfoItem icon={<MapPin size={12} />} label="Ciudad" value={contrato.empresa.ciudad} />}
                </div>
              </div>
            </div>
          )}

          {/* TARIFAS */}
          {tabDetalle === 'tarifas' && (
            <div>
              {contrato.tarifas.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Tag size={30} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin tarifas negociadas en este contrato</p>
                  <p className="text-xs mt-1 text-slate-600">Las tarifas definen precios especiales para procedimientos CUPS</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-white/5">
                        <th className="text-left pb-2 pr-3">CUPS</th>
                        <th className="text-left pb-2 pr-3">Descripción</th>
                        <th className="text-right pb-2 pr-3">Precio base</th>
                        <th className="text-right pb-2 pr-3">Precio negociado</th>
                        <th className="text-right pb-2 pr-3">Descuento</th>
                        <th className="text-right pb-2">Cobertura</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {contrato.tarifas.map(t => (
                        <tr key={t.id} className="text-slate-300 hover:bg-white/[0.02]">
                          <td className="py-2 pr-3 font-mono text-indigo-400">{t.codigoCUPS}</td>
                          <td className="py-2 pr-3 text-slate-300 max-w-[180px] truncate">{t.descripcionCUPS}</td>
                          <td className="py-2 pr-3 text-right text-slate-500">{fmt(t.precioBase)}</td>
                          <td className="py-2 pr-3 text-right font-medium text-emerald-400">{fmt(t.precioNegociado)}</td>
                          <td className="py-2 pr-3 text-right text-amber-400">{t.porcentajeDescuento}%</td>
                          <td className="py-2 text-right text-blue-400">{t.porcentajeCobertura}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PAQUETES */}
          {tabDetalle === 'paquetes' && (
            <div className="space-y-3">
              {contrato.paquetes.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Package size={30} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin paquetes de servicios en este contrato</p>
                </div>
              ) : contrato.paquetes.map(paq => (
                <div key={paq.id} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-violet-400" />
                      <span className="text-sm font-medium text-white">{paq.nombre}</span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-400">{fmt(paq.precio)}</span>
                  </div>
                  {paq.descripcion && <p className="text-xs text-slate-500 mb-2">{paq.descripcion}</p>}
                  {paq.items.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {paq.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            {item.esPrincipal && <span className="text-amber-400 text-[10px]">★</span>}
                            {item.codigoCUPS && <span className="font-mono text-indigo-400">{item.codigoCUPS}</span>}
                            <span>{item.descripcion}</span>
                            <span className="text-slate-600">× {item.cantidad}</span>
                          </span>
                          <span>{fmt(item.precioUnit * item.cantidad)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* BENEFICIARIOS */}
          {tabDetalle === 'beneficiarios' && (
            <div>
              {loadingBenef ? (
                <div className="flex justify-center py-8 text-slate-500">
                  <RefreshCw size={18} className="animate-spin mr-2" /> Cargando beneficiarios...
                </div>
              ) : beneficiarios.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users size={30} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin beneficiarios registrados en este contrato</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {beneficiarios.map(b => (
                    <div key={b.id} className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-indigo-500/10 flex items-center justify-center">
                          <User size={13} className="text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm text-white">{b.nombre}</p>
                          <p className="text-xs text-slate-400">{b.tipoDoc} {b.documento}</p>
                          {b.paciente && <p className="text-[10px] text-indigo-400">Vinculado al paciente</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          b.tipo === 'TITULAR'
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                            : 'text-slate-400 bg-slate-500/10 border-slate-500/30'
                        }`}>{b.tipo}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          b.estado === 'ACTIVO'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                            : 'text-slate-500 bg-slate-500/10 border-slate-500/30'
                        }`}>{b.estado}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── COMPONENTES REUTILIZABLES ───────────────────────────────────────────────

const inputCls = 'w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed';

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-400 font-medium">{label}</label>
      {children}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] text-slate-500 flex items-center gap-1">{icon} {label}</p>
      <p className="text-sm text-white">{value}</p>
    </div>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
      <XCircle size={14} /> {msg}
    </div>
  );
}

function ModalOverlay({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 16 }}
        onClick={e => e.stopPropagation()}
        className={`bg-[#0d0f14] border border-white/10 rounded-2xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-xl'}`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function ModalHeader({ title, icon, onClose }: { title: string; icon: React.ReactNode; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">{icon}</div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
        <X size={15} />
      </button>
    </div>
  );
}

function ModalFooter({ onClose, onSave, saving, label }: { onClose: () => void; onSave: () => void; saving: boolean; label: string }) {
  return (
    <div className="flex justify-end gap-2 px-5 py-4 border-t border-white/5">
      <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
        Cancelar
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
        {saving ? 'Guardando...' : label}
      </button>
    </div>
  );
}
