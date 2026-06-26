import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, FileText, Receipt, Plus, Search, Trash2, X, CheckCircle,
  RotateCcw, Loader2, Printer, User as UserIcon, Layers,
} from 'lucide-react';
import {
  getResumen, getIngresos, createIngreso, getCuenta, buscarCargos,
  addCuentaItem, updateCuentaItem, deleteCuentaItem, facturarCuenta,
  getFacturas, getFactura, anularFactura,
  type Ingreso, type CuentaDetalle, type CargoBusqueda, type Factura,
  type ResumenFacturacion,
} from '../services/facturacionService';
import { searchPacientes } from '../services/api';
import { getParametrosSistema } from '../services/adminService';
import QRCode from 'qrcode';

const cop = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

const fdate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

const fdateLarga = (s?: string) =>
  s ? new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

function estadoBadge(estado: string) {
  const map: Record<string, string> = {
    ABIERTA: 'bg-yellow-500/20 border-yellow-500 text-yellow-300',
    FACTURADA: 'bg-emerald-500/20 border-emerald-500 text-emerald-300',
    ANULADA: 'bg-red-500/20 border-red-500 text-red-300',
    EMITIDA: 'bg-emerald-500/20 border-emerald-500 text-emerald-300',
    ACTIVO: 'bg-blue-500/20 border-blue-500 text-blue-300',
    PAGADA: 'bg-emerald-500/20 border-emerald-500 text-emerald-300',
  };
  return map[estado] || 'bg-slate-600/30 border-slate-500 text-slate-300';
}

// ════════════════════════════════════════════════════════════════
//  Página principal
// ════════════════════════════════════════════════════════════════
export default function FacturacionPage() {
  const [tab, setTab] = useState<'cuentas' | 'facturas'>('cuentas');
  const [resumen, setResumen] = useState<ResumenFacturacion | null>(null);
  const [cuentaActiva, setCuentaActiva] = useState<string | null>(null);

  const cargarResumen = useCallback(() => {
    getResumen().then(setResumen).catch(() => {});
  }, []);

  useEffect(() => { cargarResumen(); }, [cargarResumen]);

  if (cuentaActiva) {
    return (
      <CuentaDetalleView
        cuentaId={cuentaActiva}
        onClose={() => { setCuentaActiva(null); cargarResumen(); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-2">
              <Receipt className="text-yellow-500" /> Facturación
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm">Ingresos, cuentas y facturas de venta</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <KpiCard icon={DollarSign} label="Total facturado" value={cop(resumen?.totalFacturado ?? 0)} from="from-emerald-600" to="to-emerald-800" border="border-emerald-500/30" />
          <KpiCard icon={FileText} label="Facturas emitidas" value={String(resumen?.facturasEmitidas ?? 0)} from="from-blue-600" to="to-blue-800" border="border-blue-500/30" />
          <KpiCard icon={Layers} label="Cuentas abiertas" value={String(resumen?.cuentasAbiertas ?? 0)} from="from-yellow-600" to="to-yellow-800" border="border-yellow-500/30" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-white/10">
          <TabBtn active={tab === 'cuentas'} onClick={() => setTab('cuentas')}>Cuentas</TabBtn>
          <TabBtn active={tab === 'facturas'} onClick={() => setTab('facturas')}>Facturas</TabBtn>
        </div>

        {tab === 'cuentas'
          ? <CuentasTab onAbrirCuenta={setCuentaActiva} onChange={cargarResumen} />
          : <FacturasTab onChange={cargarResumen} />}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, from, to, border }: any) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} className={`bg-gradient-to-br ${from} ${to} rounded-lg p-4 border ${border}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white/70 text-xs font-semibold mb-1">{label}</div>
          <div className="text-2xl font-bold text-white">{value}</div>
        </div>
        <Icon className="text-white/40" size={32} />
      </div>
    </motion.div>
  );
}

function TabBtn({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold transition border-b-2 -mb-px ${active ? 'border-yellow-500 text-yellow-400' : 'border-transparent text-gray-400 hover:text-white'}`}
    >
      {children}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════
//  Pestaña: Cuentas (ingresos)
// ════════════════════════════════════════════════════════════════
function CuentasTab({ onAbrirCuenta, onChange }: { onAbrirCuenta: (id: string) => void; onChange: () => void }) {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [nuevoOpen, setNuevoOpen] = useState(false);

  const cargar = useCallback((q = '') => {
    setLoading(true);
    getIngresos({ search: q })
      .then(setIngresos)
      .catch(() => setIngresos([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => cargar(search), 300);
    return () => clearTimeout(t);
  }, [search, cargar]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o documento del paciente…"
            className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:border-yellow-500 outline-none"
          />
        </div>
        <button
          onClick={() => setNuevoOpen(true)}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2 justify-center"
        >
          <Plus size={16} /> Nuevo Ingreso
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-yellow-500" /></div>
      ) : ingresos.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          No hay ingresos. Se crean automáticamente al completar una cita, o usa “Nuevo Ingreso”.
        </div>
      ) : (
        <div className="space-y-3">
          {ingresos.map((ing) => (
            <div key={ing.id} className="bg-slate-800/60 border border-white/10 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-white font-semibold flex items-center gap-2">
                    <UserIcon size={16} className="text-yellow-500" />
                    {ing.paciente.nombreCompleto}
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${estadoBadge(ing.estado)}`}>{ing.estado}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {ing.paciente.tipoDocumento} {ing.paciente.numeroDocumento} · Ingreso #{ing.numero} · {fdate(ing.fechaIngreso)}
                    {ing.entidad ? ` · ${ing.entidad}` : ''}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-2">
                {ing.cuentas.map((c) => (
                  <div key={c.id} className="flex items-center justify-between bg-slate-900/60 rounded px-3 py-2 border border-white/5">
                    <div className="text-xs text-gray-300">
                      Cuenta #{c.numero} · {c._count?.items ?? 0} ítem(s)
                      <span className={`ml-2 text-[10px] px-2 py-0.5 rounded border ${estadoBadge(c.estado)}`}>{c.estado}</span>
                      {c.factura && (
                        <span className="ml-2 text-[10px] text-emerald-400">Factura {c.factura.prefijo}-{c.factura.numero}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">{cop(c.total)}</span>
                      <button
                        onClick={() => onAbrirCuenta(c.id)}
                        className="px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded font-semibold"
                      >
                        {c.estado === 'ABIERTA' ? 'Gestionar' : 'Ver'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {nuevoOpen && (
        <NuevoIngresoModal
          onClose={() => setNuevoOpen(false)}
          onCreated={() => { setNuevoOpen(false); cargar(search); onChange(); }}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  Modal: Nuevo Ingreso (busca paciente)
// ════════════════════════════════════════════════════════════════
function NuevoIngresoModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [sel, setSel] = useState<any | null>(null);
  const [tipoIngreso, setTipoIngreso] = useState('AMBULATORIO');
  const [entidad, setEntidad] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sel || q.trim().length < 2) { setResultados([]); return; }
    const t = setTimeout(async () => {
      const token = localStorage.getItem('accessToken') || '';
      const r = await searchPacientes(q.trim(), token);
      const arr = (r.data as any)?.pacientes || (r.data as any) || [];
      setResultados(Array.isArray(arr) ? arr : []);
    }, 300);
    return () => clearTimeout(t);
  }, [q, sel]);

  const crear = async () => {
    if (!sel) return;
    setSaving(true); setError('');
    try {
      await createIngreso({ pacienteId: sel.id, tipoIngreso, entidad: entidad.trim() || undefined });
      onCreated();
    } catch (e: any) {
      setError(e.message || 'Error al crear el ingreso');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Nuevo Ingreso" onClose={onClose}>
      {error && <div className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">{error}</div>}

      {!sel ? (
        <div>
          <label className="text-xs text-gray-400">Buscar paciente</label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              autoFocus value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre o documento…"
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-white/10 rounded text-white text-sm focus:border-yellow-500 outline-none"
            />
          </div>
          <div className="mt-2 max-h-56 overflow-y-auto divide-y divide-white/5">
            {resultados.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSel(p); setResultados([]); }}
                className="w-full text-left px-3 py-2 hover:bg-slate-700/50 rounded text-sm"
              >
                <div className="text-white">{p.nombreCompleto}</div>
                <div className="text-xs text-gray-400">{p.tipoDocumento} {p.numeroDocumento}</div>
              </button>
            ))}
            {q.trim().length >= 2 && resultados.length === 0 && (
              <div className="text-xs text-gray-500 py-3 text-center">Sin resultados</div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-white/10 rounded px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-white text-sm">{sel.nombreCompleto}</div>
              <div className="text-xs text-gray-400">{sel.tipoDocumento} {sel.numeroDocumento}</div>
            </div>
            <button onClick={() => setSel(null)} className="text-gray-400 hover:text-white"><X size={16} /></button>
          </div>
          <div>
            <label className="text-xs text-gray-400">Tipo de ingreso</label>
            <select value={tipoIngreso} onChange={(e) => setTipoIngreso(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-900 border border-white/10 rounded text-white text-sm focus:border-yellow-500 outline-none">
              <option value="AMBULATORIO">Ambulatorio</option>
              <option value="HOSPITALARIO">Hospitalario</option>
              <option value="URGENCIAS">Urgencias</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400">Responsable / Entidad (opcional)</label>
            <input value={entidad} onChange={(e) => setEntidad(e.target.value)}
              placeholder="Ej. Particular, EPS, SOAT…"
              className="w-full mt-1 px-3 py-2 bg-slate-900 border border-white/10 rounded text-white text-sm focus:border-yellow-500 outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Cancelar</button>
            <button onClick={crear} disabled={saving}
              className="px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded font-semibold flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} Crear ingreso
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

// ════════════════════════════════════════════════════════════════
//  Vista: Detalle de cuenta (adicionar cargos, facturar)
// ════════════════════════════════════════════════════════════════
function CuentaDetalleView({ cuentaId, onClose }: { cuentaId: string; onClose: () => void }) {
  const [cuenta, setCuenta] = useState<CuentaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [facturando, setFacturando] = useState(false);
  const [error, setError] = useState('');
  const [facturaGenerada, setFacturaGenerada] = useState<Factura | null>(null);

  const cargar = useCallback(() => {
    setLoading(true);
    getCuenta(cuentaId).then(setCuenta).catch(() => setCuenta(null)).finally(() => setLoading(false));
  }, [cuentaId]);

  useEffect(() => { cargar(); }, [cargar]);

  const facturar = async () => {
    if (!cuenta) return;
    setFacturando(true); setError('');
    try {
      const f = await facturarCuenta(cuenta.id);
      setFacturaGenerada(f);
      cargar();
    } catch (e: any) {
      setError(e.message || 'Error al facturar');
    } finally {
      setFacturando(false);
    }
  };

  const eliminarItem = async (itemId: string) => {
    await deleteCuentaItem(cuentaId, itemId).catch(() => {});
    cargar();
  };

  const editarItem = async (itemId: string, body: { cantidad?: number; precioUnitario?: number }) => {
    await updateCuentaItem(cuentaId, itemId, body).catch(() => {});
    cargar();
  };

  if (loading || !cuenta) {
    return (
      <div className="min-h-screen bg-slate-900 p-6 flex items-center justify-center">
        <Loader2 className="animate-spin text-yellow-500" />
      </div>
    );
  }

  const abierta = cuenta.estado === 'ABIERTA';
  const p = cuenta.ingreso.paciente;

  return (
    <div className="min-h-screen bg-slate-900 p-3 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1">
          ← Volver a facturación
        </button>

        <div className="bg-slate-800/60 border border-white/10 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="text-white text-lg font-bold flex items-center gap-2">
                Cuenta #{cuenta.numero}
                <span className={`text-[10px] px-2 py-0.5 rounded border ${estadoBadge(cuenta.estado)}`}>{cuenta.estado}</span>
              </div>
              <div className="text-sm text-gray-300 mt-1">{p.nombreCompleto}</div>
              <div className="text-xs text-gray-400">
                {p.tipoDocumento} {p.numeroDocumento} · Ingreso #{cuenta.ingreso.numero} · {cuenta.ingreso.tipoIngreso}
                {cuenta.ingreso.entidad ? ` · ${cuenta.ingreso.entidad}` : ''}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Total cuenta</div>
              <div className="text-2xl font-bold text-yellow-400">{cop(cuenta.total)}</div>
            </div>
          </div>
        </div>

        {error && <div className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">{error}</div>}

        {/* Acciones */}
        <div className="flex flex-wrap gap-2 mb-4">
          {abierta && (
            <>
              <button onClick={() => setAddOpen(true)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2">
                <Plus size={16} /> Adicionar cargo
              </button>
              <button onClick={facturar} disabled={facturando || cuenta.items.length === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2">
                {facturando ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Facturar
              </button>
            </>
          )}
          {cuenta.factura && <FacturaVerButton facturaId={cuenta.factura.id} />}
        </div>

        {/* Tabla de ítems */}
        <div className="bg-slate-800/60 border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/80 text-gray-400 text-xs">
              <tr>
                <th className="text-left px-3 py-2">Código</th>
                <th className="text-left px-3 py-2">Descripción</th>
                <th className="text-right px-3 py-2 w-20">Cant.</th>
                <th className="text-right px-3 py-2 w-32">Precio unit.</th>
                <th className="text-right px-3 py-2 w-32">Valor</th>
                {abierta && <th className="px-3 py-2 w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {cuenta.items.length === 0 ? (
                <tr><td colSpan={abierta ? 6 : 5} className="text-center text-gray-500 py-6 text-xs">Sin ítems. Adiciona un cargo.</td></tr>
              ) : cuenta.items.map((it) => (
                <tr key={it.id} className="text-gray-200">
                  <td className="px-3 py-2 font-mono text-xs text-yellow-400">{it.codigo || '—'}</td>
                  <td className="px-3 py-2">{it.descripcion}</td>
                  <td className="px-3 py-2 text-right">
                    {abierta ? (
                      <input type="number" min={0.01} step="any" defaultValue={it.cantidad}
                        onBlur={(e) => { const v = Number(e.target.value); if (v && v !== it.cantidad) editarItem(it.id, { cantidad: v }); }}
                        className="w-16 bg-slate-900 border border-white/10 rounded px-2 py-1 text-right text-white text-xs" />
                    ) : it.cantidad}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {abierta ? (
                      <input type="number" min={0} step="any" defaultValue={it.precioUnitario}
                        onBlur={(e) => { const v = Number(e.target.value); if (v !== it.precioUnitario) editarItem(it.id, { precioUnitario: v }); }}
                        className="w-28 bg-slate-900 border border-white/10 rounded px-2 py-1 text-right text-white text-xs" />
                    ) : cop(it.precioUnitario)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-white">{cop(it.valorTotal)}</td>
                  {abierta && (
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => eliminarItem(it.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900/80">
                <td colSpan={4} className="px-3 py-2 text-right text-gray-400 text-xs font-semibold">TOTAL</td>
                <td className="px-3 py-2 text-right text-yellow-400 font-bold">{cop(cuenta.total)}</td>
                {abierta && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {addOpen && (
        <AgregarCargoModal
          onClose={() => setAddOpen(false)}
          onAdd={async (body) => { await addCuentaItem(cuentaId, body); setAddOpen(false); cargar(); }}
        />
      )}

      {facturaGenerada && (
        <FacturaModal facturaId={facturaGenerada.id} onClose={() => setFacturaGenerada(null)} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  Modal: Adicionar cargo a la cuenta
// ════════════════════════════════════════════════════════════════
function AgregarCargoModal({ onClose, onAdd }: { onClose: () => void; onAdd: (body: any) => Promise<void> }) {
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState<CargoBusqueda[]>([]);
  const [sel, setSel] = useState<CargoBusqueda | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [precio, setPrecio] = useState<number>(0);
  const [descLibre, setDescLibre] = useState('');
  const [modo, setModo] = useState<'cargo' | 'libre'>('cargo');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sel || q.trim().length < 2) { setResultados([]); return; }
    const t = setTimeout(() => {
      buscarCargos(q.trim()).then(setResultados).catch(() => setResultados([]));
    }, 300);
    return () => clearTimeout(t);
  }, [q, sel]);

  const guardar = async () => {
    setSaving(true); setError('');
    try {
      if (modo === 'cargo') {
        if (!sel) { setError('Selecciona un cargo'); setSaving(false); return; }
        await onAdd({ cargoId: sel.id, cantidad, precioUnitario: precio });
      } else {
        if (!descLibre.trim()) { setError('Ingresa una descripción'); setSaving(false); return; }
        await onAdd({ descripcion: descLibre.trim(), cantidad, precioUnitario: precio });
      }
    } catch (e: any) {
      setError(e.message || 'Error al agregar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Adicionar cargo" onClose={onClose}>
      {error && <div className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">{error}</div>}

      <div className="flex gap-2 mb-3">
        <button onClick={() => setModo('cargo')} className={`flex-1 py-1.5 text-xs rounded font-semibold ${modo === 'cargo' ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-gray-300'}`}>Desde catálogo</button>
        <button onClick={() => setModo('libre')} className={`flex-1 py-1.5 text-xs rounded font-semibold ${modo === 'libre' ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-gray-300'}`}>Ítem libre</button>
      </div>

      {modo === 'cargo' ? (
        !sel ? (
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por descripción, código o CUPS…"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-white/10 rounded text-white text-sm focus:border-yellow-500 outline-none" />
            </div>
            <div className="mt-2 max-h-56 overflow-y-auto divide-y divide-white/5">
              {resultados.map((c) => (
                <button key={c.id} onClick={() => { setSel(c); setPrecio(c.precioSugerido); setResultados([]); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700/50 rounded">
                  <div className="text-white text-sm">{c.descripcion}</div>
                  <div className="text-xs text-gray-400 flex justify-between">
                    <span>{c.codigo}{c.cupsCodigoStr ? ` · CUPS ${c.cupsCodigoStr}` : ''}</span>
                    <span className="text-emerald-400">{cop(c.precioSugerido)}</span>
                  </div>
                </button>
              ))}
              {q.trim().length >= 2 && resultados.length === 0 && (
                <div className="text-xs text-gray-500 py-3 text-center">Sin resultados</div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-slate-900 border border-white/10 rounded px-3 py-2 flex items-center justify-between">
              <div>
                <div className="text-white text-sm">{sel.descripcion}</div>
                <div className="text-xs text-gray-400">{sel.codigo}{sel.cupsCodigoStr ? ` · CUPS ${sel.cupsCodigoStr}` : ''}</div>
              </div>
              <button onClick={() => setSel(null)} className="text-gray-400 hover:text-white"><X size={16} /></button>
            </div>
            <CantidadPrecio cantidad={cantidad} setCantidad={setCantidad} precio={precio} setPrecio={setPrecio} />
            <FooterBtns onClose={onClose} onSave={guardar} saving={saving} />
          </div>
        )
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400">Descripción</label>
            <input value={descLibre} onChange={(e) => setDescLibre(e.target.value)} autoFocus
              placeholder="Ej. Material quirúrgico"
              className="w-full mt-1 px-3 py-2 bg-slate-900 border border-white/10 rounded text-white text-sm focus:border-yellow-500 outline-none" />
          </div>
          <CantidadPrecio cantidad={cantidad} setCantidad={setCantidad} precio={precio} setPrecio={setPrecio} />
          <FooterBtns onClose={onClose} onSave={guardar} saving={saving} />
        </div>
      )}
    </ModalShell>
  );
}

function CantidadPrecio({ cantidad, setCantidad, precio, setPrecio }: any) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs text-gray-400">Cantidad</label>
        <input type="number" min={0.01} step="any" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))}
          className="w-full mt-1 px-3 py-2 bg-slate-900 border border-white/10 rounded text-white text-sm focus:border-yellow-500 outline-none" />
      </div>
      <div>
        <label className="text-xs text-gray-400">Precio unitario</label>
        <input type="number" min={0} step="any" value={precio} onChange={(e) => setPrecio(Number(e.target.value))}
          className="w-full mt-1 px-3 py-2 bg-slate-900 border border-white/10 rounded text-white text-sm focus:border-yellow-500 outline-none" />
      </div>
      <div className="col-span-2 text-right text-sm text-gray-300">
        Subtotal: <span className="font-bold text-yellow-400">{cop((cantidad || 0) * (precio || 0))}</span>
      </div>
    </div>
  );
}

function FooterBtns({ onClose, onSave, saving }: any) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Cancelar</button>
      <button onClick={onSave} disabled={saving}
        className="px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded font-semibold flex items-center gap-2">
        {saving && <Loader2 size={14} className="animate-spin" />} Agregar
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  Pestaña: Facturas
// ════════════════════════════════════════════════════════════════
function FacturasTab({ onChange }: { onChange: () => void }) {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [verId, setVerId] = useState<string | null>(null);

  const cargar = useCallback((q = '') => {
    setLoading(true);
    getFacturas({ search: q }).then(setFacturas).catch(() => setFacturas([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => cargar(search), 300);
    return () => clearTimeout(t);
  }, [search, cargar]);

  const anular = async (id: string) => {
    if (!confirm('¿Anular esta factura? La cuenta volverá a quedar abierta.')) return;
    await anularFactura(id).catch(() => {});
    cargar(search); onChange();
  };

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar factura por paciente…"
          className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:border-yellow-500 outline-none" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-yellow-500" /></div>
      ) : facturas.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">No hay facturas emitidas.</div>
      ) : (
        <div className="bg-slate-800/60 border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/80 text-gray-400 text-xs">
              <tr>
                <th className="text-left px-3 py-2">Factura</th>
                <th className="text-left px-3 py-2">Paciente</th>
                <th className="text-left px-3 py-2">Fecha</th>
                <th className="text-right px-3 py-2">Total</th>
                <th className="text-center px-3 py-2">Estado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {facturas.map((f) => (
                <tr key={f.id} className="text-gray-200">
                  <td className="px-3 py-2 font-mono text-yellow-400">{f.prefijo}-{f.numero}</td>
                  <td className="px-3 py-2">
                    <div>{f.paciente?.nombreCompleto}</div>
                    <div className="text-xs text-gray-500">{f.paciente?.tipoDocumento} {f.paciente?.numeroDocumento}</div>
                  </td>
                  <td className="px-3 py-2">{fdate(f.fecha)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-white">{cop(f.total)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${estadoBadge(f.estado)}`}>{f.estado}</span>
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button onClick={() => setVerId(f.id)} className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded mr-1">Ver</button>
                    {f.estado === 'EMITIDA' && (
                      <button onClick={() => anular(f.id)} className="px-2 py-1 text-xs bg-red-600/80 hover:bg-red-600 text-white rounded inline-flex items-center gap-1">
                        <RotateCcw size={12} /> Anular
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {verId && <FacturaModal facturaId={verId} onClose={() => setVerId(null)} />}
    </div>
  );
}

function FacturaVerButton({ facturaId }: { facturaId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2">
        <FileText size={16} /> Ver factura
      </button>
      {open && <FacturaModal facturaId={facturaId} onClose={() => setOpen(false)} />}
    </>
  );
}

// ════════════════════════════════════════════════════════════════
//  Generador de factura profesional (HTML imprimible / PDF)
// ════════════════════════════════════════════════════════════════
const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ',
  'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE'];
const DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS',
  'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function seccion(n: number): string {
  if (n === 0) return '';
  if (n <= 20) return UNIDADES[n];
  if (n < 100) {
    const d = Math.floor(n / 10), u = n % 10;
    if (n >= 21 && n <= 29) return 'VEINTI' + UNIDADES[u];
    return DECENAS[d] + (u ? ' Y ' + UNIDADES[u] : '');
  }
  if (n === 100) return 'CIEN';
  const c = Math.floor(n / 100), r = n % 100;
  return CENTENAS[c] + (r ? ' ' + seccion(r) : '');
}

function numeroALetras(num: number): string {
  num = Math.floor(Math.abs(num));
  if (num === 0) return 'CERO';
  let palabras = '';
  const millones = Math.floor(num / 1_000_000);
  const miles = Math.floor((num % 1_000_000) / 1000);
  const resto = num % 1000;
  if (millones) palabras += (millones === 1 ? 'UN MILLÓN' : seccion(millones) + ' MILLONES') + ' ';
  if (miles) palabras += (miles === 1 ? 'MIL' : seccion(miles) + ' MIL') + ' ';
  if (resto) palabras += seccion(resto);
  return palabras.trim();
}

const FACTURA_CSS = `
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 0; }
  .logo-bar { display: flex; align-items: flex-start; justify-content: space-between;
              border-bottom: 3px solid #b8860b; padding-bottom: 10px; margin-bottom: 14px; }
  .logo-bar h1 { font-size: 15px; font-weight: bold; margin: 0 0 3px; color: #7a5c00; }
  .logo-bar p  { margin: 1px 0; font-size: 9.5px; color: #555; }
  .fac-title { text-align: right; }
  .fac-title h2 { font-size: 18px; font-weight: bold; color: #7a5c00; margin: 0; }
  .fac-title p  { margin: 2px 0; font-size: 9px; color: #777; }
  .badge-estado { display: inline-block; padding: 2px 9px; border-radius: 10px; font-size: 9px;
                  font-weight: bold; letter-spacing: .3px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
  .info-box { background: #fafafa; border: 1px solid #ddd; border-radius: 4px; padding: 8px 10px; }
  .info-box h3 { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #7a5c00;
                 letter-spacing: .5px; margin: 0 0 5px; border-bottom: 1px solid #e0c97a; padding-bottom: 2px; }
  .info-box p  { margin: 2px 0; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  thead th { background: #7a5c00; color: #fff; padding: 5px 8px; text-align: left; font-size: 10px; }
  tbody tr:nth-child(even) { background: #fdf8e9; }
  tbody td { padding: 5px 8px; border-bottom: 1px solid #e8e8e8; font-size: 10px; }
  .total-box { margin-left: auto; width: 300px; }
  .total-row { display: flex; justify-content: space-between; padding: 3px 0;
               border-bottom: 1px dashed #ddd; font-size: 10px; }
  .total-row.final { border-bottom: 2px solid #7a5c00; border-top: 2px solid #7a5c00;
                     font-weight: bold; font-size: 13px; color: #7a5c00; padding: 5px 0; }
  .son { background: #fffbea; border: 1px solid #e0c97a; border-radius: 4px; padding: 7px 12px;
         margin: 12px 0; font-size: 10px; font-weight: bold; color: #7a5c00; }
  .firma-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 40px; }
  .firma-box  { border-top: 1px solid #333; padding-top: 4px; font-size: 8.5px; text-align: center; color: #555; }
  @page { margin: 12mm 14mm; size: A4; }
`;

function buildFacturaHtml(f: any, clinica: Record<string, string>, qrDataUrl?: string): string {
  const fechaElab = fdateLarga(f.fecha);
  const ingreso = f.cuenta?.ingreso;
  const medico = ingreso?.medico ? `${ingreso.medico.nombre} ${ingreso.medico.apellido}` : '';
  const estadoColor: Record<string, string> = {
    EMITIDA: 'background:#d1fae5;color:#065f46',
    ANULADA: 'background:#fee2e2;color:#991b1b',
    PAGADA: 'background:#d1fae5;color:#065f46',
  };
  const filas = (f.cuenta?.items || []).map((it: any) => `
    <tr>
      <td>${it.codigo || '—'}</td>
      <td>${it.descripcion}</td>
      <td style="text-align:center">${it.cantidad}</td>
      <td style="text-align:right">${cop(it.precioUnitario)}</td>
      <td style="text-align:right"><b>${cop(it.valorTotal)}</b></td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Factura ${f.prefijo}-${f.numero} — ${f.paciente?.nombreCompleto || ''}</title>
<style>${FACTURA_CSS}</style></head><body>

<div class="logo-bar">
  <div style="display:flex;align-items:flex-start;gap:14px">
    ${clinica.logo_url ? `<img src="${clinica.logo_url}" alt="Logo" style="max-height:80px;max-width:130px;object-fit:contain;flex-shrink:0;margin-top:2px" />` : ''}
    <div>
      <h1>${clinica.nombre_clinica || 'SARAI Clínica'}</h1>
      ${clinica.nit ? `<p><b>NIT:</b> ${clinica.nit}</p>` : ''}
      ${(clinica.direccion || clinica.ciudad) ? `<p>${[clinica.direccion, clinica.ciudad].filter(Boolean).join(' — ')}</p>` : ''}
      ${clinica.telefono ? `<p>Tel: ${clinica.telefono}</p>` : ''}
      ${clinica.email_contacto ? `<p>${clinica.email_contacto}</p>` : ''}
      ${clinica.regimen_tributario ? `<p style="color:#888;font-size:8.5px">${clinica.regimen_tributario}</p>` : ''}
    </div>
  </div>
  <div class="fac-title">
    <h2>FACTURA DE VENTA</h2>
    <p>N.° <b>${f.prefijo}-${String(f.numero).padStart(6, '0')}</b></p>
    <p>Fecha de elaboración: ${fechaElab}</p>
    <span class="badge-estado" style="${estadoColor[f.estado] || ''}">${f.estado}</span>
    ${qrDataUrl ? `<div style="margin-top:8px"><img src="${qrDataUrl}" alt="QR" style="width:96px;height:96px" /></div>` : ''}
  </div>
</div>

<div class="info-grid">
  <div class="info-box">
    <h3>Datos del Paciente</h3>
    <p><b>${f.paciente?.nombreCompleto || ''}</b></p>
    <p>Documento: ${f.paciente?.tipoDocumento || ''} ${f.paciente?.numeroDocumento || ''}</p>
    ${f.paciente?.telefonos?.length ? `<p>Tel: ${f.paciente.telefonos[0]}</p>` : ''}
    ${f.paciente?.direccion ? `<p>${f.paciente.direccion}${f.paciente.ciudad ? ' — ' + f.paciente.ciudad : ''}</p>` : ''}
  </div>
  <div class="info-box">
    <h3>Datos de Facturación</h3>
    <p><b>Responsable:</b> ${f.entidad || 'Particular'}</p>
    ${f.plan ? `<p><b>Plan:</b> ${f.plan}</p>` : ''}
    ${ingreso ? `<p><b>Ingreso:</b> #${ingreso.numero} · ${ingreso.tipoIngreso || ''}</p>` : ''}
    ${ingreso?.fechaIngreso ? `<p><b>Fecha ingreso:</b> ${fdate(ingreso.fechaIngreso)}</p>` : ''}
    ${medico ? `<p><b>Profesional:</b> ${medico}</p>` : ''}
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="width:12%">Código</th>
      <th>Concepto de facturación</th>
      <th style="width:8%;text-align:center">Cant.</th>
      <th style="width:16%;text-align:right">Valor Unit.</th>
      <th style="width:16%;text-align:right">Valor</th>
    </tr>
  </thead>
  <tbody>${filas}</tbody>
</table>

<div class="total-box">
  <div class="total-row"><span>Subtotal</span><span>${cop(f.subtotal)}</span></div>
  <div class="total-row"><span>Valor no cubierto</span><span>${cop(0)}</span></div>
  <div class="total-row final"><span>TOTAL FACTURADO</span><span>${cop(f.total)}</span></div>
</div>

<div class="son">SON: ${numeroALetras(f.total)} PESOS M/CTE</div>

${f.observaciones ? `<div class="info-box" style="margin-top:8px"><h3>Observaciones</h3><p>${f.observaciones}</p></div>` : ''}

<div class="firma-grid">
  <div class="firma-box">Firma del Paciente<br><b>${f.paciente?.nombreCompleto || ''}</b></div>
  <div class="firma-box">Elaborado por<br><b>${medico || clinica.nombre_clinica || 'SARAI'}</b></div>
</div>

<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),1400);}</script>
</body></html>`;
}

function imprimirFactura(f: any, clinica: Record<string, string>, qrDataUrl?: string) {
  const w = window.open('', '_blank');
  if (!w) { alert('Permita ventanas emergentes para imprimir.'); return; }
  w.document.open();
  w.document.write(buildFacturaHtml(f, clinica, qrDataUrl));
  w.document.close();
}

// Contenido codificado en el QR de la factura
function facturaQrTexto(f: any, clinica: Record<string, string>): string {
  return [
    `Factura: ${f.prefijo}-${String(f.numero).padStart(6, '0')}`,
    `Fecha: ${fdate(f.fecha)}`,
    clinica.nit ? `NIT Emisor: ${clinica.nit}` : '',
    `Cliente: ${f.paciente?.nombreCompleto || ''}`,
    f.paciente?.numeroDocumento ? `Doc: ${f.paciente.tipoDocumento || ''} ${f.paciente.numeroDocumento}` : '',
    `Total: ${cop(f.total)}`,
  ].filter(Boolean).join('\n');
}

// ════════════════════════════════════════════════════════════════
//  Modal: Vista de factura (vista previa + impresión profesional)
// ════════════════════════════════════════════════════════════════
function FacturaModal({ facturaId, onClose }: { facturaId: string; onClose: () => void }) {
  const [factura, setFactura] = useState<any | null>(null);
  const [clinica, setClinica] = useState<Record<string, string>>({});
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    getFactura(facturaId).then(setFactura).catch(() => setFactura(null));
    getParametrosSistema('clinica').then((items: any[]) => {
      const map: Record<string, string> = {};
      items.forEach((p: any) => { map[p.clave] = p.valor ?? ''; });
      setClinica(map);
    }).catch(() => {});
  }, [facturaId]);

  // Generar el código QR cuando ya hay factura y datos de clínica
  useEffect(() => {
    if (!factura) return;
    QRCode.toDataURL(facturaQrTexto(factura, clinica), { margin: 1, width: 200 })
      .then(setQrUrl)
      .catch(() => setQrUrl(''));
  }, [factura, clinica]);

  const ingreso = factura?.cuenta?.ingreso;
  const medico = ingreso?.medico ? `${ingreso.medico.nombre} ${ingreso.medico.apellido}` : '';

  return (
    <ModalShell title={`Factura ${factura ? factura.prefijo + '-' + String(factura.numero).padStart(6, '0') : ''}`} onClose={onClose} wide>
      {!factura ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-yellow-500" /></div>
      ) : (
        <>
          {/* Vista previa estilo documento */}
          <div className="bg-white text-slate-900 rounded-lg p-5 text-sm border border-gray-200">
            <div className="flex justify-between items-start border-b-2 border-yellow-700 pb-3 mb-3">
              <div className="flex items-start gap-3">
                {clinica.logo_url && <img src={clinica.logo_url} alt="Logo" className="max-h-16 max-w-[110px] object-contain" />}
                <div>
                  <div className="font-bold text-yellow-800 text-base">{clinica.nombre_clinica || 'SARAI Clínica'}</div>
                  {clinica.nit && <div className="text-[11px] text-gray-600">NIT: {clinica.nit}</div>}
                  {(clinica.direccion || clinica.ciudad) && <div className="text-[11px] text-gray-600">{[clinica.direccion, clinica.ciudad].filter(Boolean).join(' — ')}</div>}
                  {clinica.telefono && <div className="text-[11px] text-gray-600">Tel: {clinica.telefono}</div>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-yellow-800 text-lg">FACTURA DE VENTA</div>
                <div className="text-xs text-gray-600">N.° {factura.prefijo}-{String(factura.numero).padStart(6, '0')}</div>
                <div className="text-xs text-gray-600">Fecha: {fdate(factura.fecha)}</div>
                <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded border ${estadoBadge(factura.estado)}`}>{factura.estado}</span>
                {qrUrl && <img src={qrUrl} alt="QR" className="w-20 h-20 mt-2 ml-auto" />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div className="bg-gray-50 border border-gray-200 rounded p-2">
                <div className="text-[9px] font-bold uppercase text-yellow-800 border-b border-yellow-300 pb-1 mb-1">Datos del paciente</div>
                <div className="font-semibold">{factura.paciente?.nombreCompleto}</div>
                <div>{factura.paciente?.tipoDocumento} {factura.paciente?.numeroDocumento}</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded p-2">
                <div className="text-[9px] font-bold uppercase text-yellow-800 border-b border-yellow-300 pb-1 mb-1">Datos de facturación</div>
                <div>Responsable: <b>{factura.entidad || 'Particular'}</b></div>
                {ingreso && <div>Ingreso #{ingreso.numero} · {ingreso.tipoIngreso}</div>}
                {medico && <div>Profesional: {medico}</div>}
              </div>
            </div>

            <table className="w-full text-xs">
              <thead>
                <tr className="bg-yellow-800 text-white">
                  <th className="text-left px-2 py-1">Código</th>
                  <th className="text-left px-2 py-1">Concepto</th>
                  <th className="text-center px-2 py-1">Cant.</th>
                  <th className="text-right px-2 py-1">Valor unit.</th>
                  <th className="text-right px-2 py-1">Valor</th>
                </tr>
              </thead>
              <tbody>
                {(factura.cuenta?.items || []).map((it: any) => (
                  <tr key={it.id} className="border-b border-gray-100">
                    <td className="px-2 py-1 font-mono">{it.codigo || '—'}</td>
                    <td className="px-2 py-1">{it.descripcion}</td>
                    <td className="px-2 py-1 text-center">{it.cantidad}</td>
                    <td className="px-2 py-1 text-right">{cop(it.precioUnitario)}</td>
                    <td className="px-2 py-1 text-right font-semibold">{cop(it.valorTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mt-3">
              <div className="w-64">
                <div className="flex justify-between text-xs py-1 border-b border-dashed border-gray-300"><span>Subtotal</span><span>{cop(factura.subtotal)}</span></div>
                <div className="flex justify-between font-bold text-yellow-800 text-base py-1 border-y-2 border-yellow-700"><span>TOTAL</span><span>{cop(factura.total)}</span></div>
              </div>
            </div>
            <div className="mt-3 bg-yellow-50 border border-yellow-300 rounded px-3 py-2 text-[11px] font-semibold text-yellow-800">
              SON: {numeroALetras(factura.total)} PESOS M/CTE
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => imprimirFactura(factura, clinica, qrUrl)}
              className="px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded font-semibold flex items-center gap-2">
              <Printer size={16} /> Imprimir / PDF
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ════════════════════════════════════════════════════════════════
//  Shell de modal reutilizable
// ════════════════════════════════════════════════════════════════
function ModalShell({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className={`bg-slate-800 border border-white/10 rounded-xl p-5 w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
