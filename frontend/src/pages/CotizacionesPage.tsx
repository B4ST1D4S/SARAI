import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, TrendingUp, CheckCircle2, XCircle, Clock,
  FileText, Send, Trash2, DollarSign, RotateCw, Eye, AlertTriangle, Printer,
} from 'lucide-react';
import { apiCall, searchPacientes } from '../services/api';
import { leadsService } from '../services/mockData';
import { getParametrosSistema } from '../services/adminService';

const TERMINOS = `
1. <b>Validez de la cotización:</b> La presente cotización tiene vigencia según la fecha indicada. Pasada esa fecha los precios podrán variar sin previo aviso.
2. <b>Forma de pago:</b> Se exige un anticipo mínimo del 30% para confirmar la reserva de fecha quirúrgica. El saldo restante debe cancelarse antes del procedimiento.
3. <b>Precios:</b> Los valores incluyen IVA cuando aplique. Los costos de anestesia, hospitalización e insumos están desglosados según corresponda.
4. <b>Exclusiones:</b> Exámenes prequirúrgicos, valoración por medicina interna o cardiología no están incluidos salvo indicación expresa en este documento.
5. <b>Política de cancelación:</b> Cancelaciones con menos de 72 horas de anticipación generarán el cobro del 20% del valor del procedimiento como penalidad.
6. <b>Responsabilidad médica:</b> Los resultados estéticos dependen de las condiciones individuales de cada paciente. El médico tratante explicará alcances y limitaciones en la consulta preoperatoria.
7. <b>Confidencialidad:</b> La información del paciente es tratada bajo estricta reserva conforme a la Ley 1581 de 2012 (Habeas Data).
8. <b>Aceptación:</b> Al firmar este documento el paciente acepta los términos, precios y condiciones aquí estipulados.
`.trim();

// ─────────────────────────────────────────
// Generador HTML para impresión/PDF
// ─────────────────────────────────────────
const PRINT_CSS = `
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 0; }
  .logo-bar { display: flex; align-items: flex-start; justify-content: space-between;
              border-bottom: 3px solid #b8860b; padding-bottom: 10px; margin-bottom: 14px; }
  .logo-bar h1 { font-size: 15px; font-weight: bold; margin: 0 0 3px; color: #7a5c00; }
  .logo-bar p  { margin: 1px 0; font-size: 9.5px; color: #555; }
  .logo-bar .badge { background: #7a5c00; color: #fff; font-size: 8px; font-weight: bold;
                     padding: 2px 7px; border-radius: 10px; margin-top: 4px; display: inline-block; }
  .cot-title { text-align: right; }
  .cot-title h2 { font-size: 18px; font-weight: bold; color: #7a5c00; margin: 0; }
  .cot-title p  { margin: 2px 0; font-size: 9px; color: #777; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
  .info-box { background: #fafafa; border: 1px solid #ddd; border-radius: 4px; padding: 8px 10px; }
  .info-box h3 { font-size: 9px; font-weight: bold; text-transform: uppercase;
                 color: #7a5c00; letter-spacing: .5px; margin: 0 0 5px; border-bottom: 1px solid #e0c97a; padding-bottom: 2px; }
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
  .badge-estado { display: inline-block; padding: 2px 9px; border-radius: 10px; font-size: 9px;
                  font-weight: bold; letter-spacing: .3px; }
  .notas { background: #fafafa; border-left: 3px solid #b8860b; padding: 7px 10px;
           font-size: 10px; margin-bottom: 14px; border-radius: 0 4px 4px 0; }
  .notas strong { display: block; font-size: 9px; text-transform: uppercase; color: #7a5c00;
                  margin-bottom: 3px; letter-spacing: .4px; }
  .vigencia { display: flex; gap: 24px; background: #fffbea; border: 1px solid #e0c97a;
              border-radius: 4px; padding: 7px 12px; margin-bottom: 14px; font-size: 10px; }
  .vigencia span { font-weight: bold; color: #7a5c00; }
  .terminos { margin-top: 16px; page-break-inside: avoid; }
  .terminos h3 { font-size: 10px; font-weight: bold; color: #555; border-bottom: 1px solid #ccc;
                 padding-bottom: 3px; margin-bottom: 6px; }
  .terminos ol { margin: 0; padding-left: 16px; }
  .terminos li { font-size: 8.5px; color: #555; margin-bottom: 3px; line-height: 1.4; }
  .firma-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 32px; }
  .firma-box  { border-top: 1px solid #333; padding-top: 4px; font-size: 8.5px; text-align: center; color: #555; }
  @page { margin: 12mm 14mm; size: A4; }
`;

function buildCotizacionHtml(c: Cotizacion, clinica: Record<string, string>): string {
  const fechaEmision = new Date(c.creadoEn).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const fechaVigencia = new Date(c.vigenciaHasta).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const estadoColor: Record<string, string> = {
    GENERADA: 'background:#fff3cd;color:#856404',
    ACEPTADA: 'background:#d1fae5;color:#065f46',
    RECHAZADA: 'background:#fee2e2;color:#991b1b',
  };
  const estadoLabel: Record<string, string> = {
    GENERADA: 'Pendiente de aprobación',
    ACEPTADA: 'Aprobada',
    RECHAZADA: 'Rechazada',
  };
  const lineas: LineaItem[] = Array.isArray(c.lineas) ? c.lineas : [];

  const filasLineas = lineas.map((l, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td>${l.descripcion}</td>
      <td style="text-align:center">${l.cantidad}</td>
      <td style="text-align:right">${fmt(l.valorUnitario)}</td>
      <td style="text-align:right"><b>${fmt(l.cantidad * l.valorUnitario)}</b></td>
    </tr>`).join('');

  const terminosHtml = TERMINOS
    .split('\n')
    .filter(Boolean)
    .map(t => `<li>${t.replace(/^\d+\.\s+/, '')}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Cotización — ${c.paciente.nombreCompleto}</title>
<style>${PRINT_CSS}</style></head><body>

<!-- CABECERA -->
<div class="logo-bar">
  <!-- Logo + datos clínica (flex row) -->
  <div style="display:flex;align-items:flex-start;gap:14px">
    ${clinica.logo_url ? `<img src="${clinica.logo_url}" alt="Logo" style="max-height:80px;max-width:130px;object-fit:contain;flex-shrink:0;margin-top:2px" />` : ''}
    <div>
      <h1>${clinica.nombre_clinica || 'EstetIA Clínica'}</h1>
      ${clinica.nit         ? `<p><b>NIT:</b> ${clinica.nit}</p>` : ''}
      ${(clinica.direccion || clinica.ciudad) ? `<p>${[clinica.direccion, clinica.ciudad].filter(Boolean).join(' — ')}</p>` : ''}
      ${clinica.telefono    ? `<p>📞 ${clinica.telefono}</p>` : ''}
      ${clinica.email_contacto ? `<p>✉ ${clinica.email_contacto}</p>` : ''}
      ${clinica.sitio_web   ? `<p>🌐 ${clinica.sitio_web}</p>` : ''}
      ${clinica.regimen_tributario ? `<p style="color:#888;font-size:8.5px">${clinica.regimen_tributario}</p>` : ''}
    </div>
  </div>
  <!-- Título cotización -->
  <div class="cot-title">
    <h2>COTIZACIÓN</h2>
    <p>N.° <b>COT-${c.id.slice(-8).toUpperCase()}</b></p>
    <p>Emisión: ${fechaEmision}</p>
    <span class="badge-estado" style="${estadoColor[c.estado] || ''}">${estadoLabel[c.estado] || c.estado}</span>
  </div>
</div>

<!-- INFO PACIENTE + MÉDICO -->
<div class="info-grid">
  <div class="info-box">
    <h3>Datos del Paciente</h3>
    <p><b>${c.paciente.nombreCompleto}</b></p>
    <p>Documento: ${c.paciente.numeroDocumento}</p>
    ${c.paciente.email ? `<p>Email: ${c.paciente.email}</p>` : ''}
  </div>
  <div class="info-box">
    <h3>Médico Tratante</h3>
    <p><b>${c.medico.nombre} ${c.medico.apellido}</b></p>
    <p>${clinica.nombre_clinica || 'EstetIA Clínica'}</p>
    <p>${clinica.telefono || ''}</p>
  </div>
</div>

<!-- DESCRIPCIÓN DEL SERVICIO -->
<div class="info-box" style="margin-bottom:14px">
  <h3>Descripción del Servicio / Procedimiento</h3>
  <p style="font-size:11px;margin-top:4px">${c.descripcionServicio}</p>
</div>

<!-- TABLA DE LÍNEAS -->
<table>
  <thead>
    <tr>
      <th style="width:4%;text-align:center">#</th>
      <th>Descripción</th>
      <th style="width:8%;text-align:center">Cant.</th>
      <th style="width:16%;text-align:right">Valor Unit.</th>
      <th style="width:16%;text-align:right">Subtotal</th>
    </tr>
  </thead>
  <tbody>${filasLineas}</tbody>
</table>

<!-- TOTALES -->
<div class="total-box">
  <div class="total-row"><span>Subtotal</span><span>${fmt(c.subtotal)}</span></div>
  ${c.descuentoPorcentaje > 0 ? `<div class="total-row" style="color:#c07000"><span>Descuento (${c.descuentoPorcentaje}%)</span><span>−${fmt(c.descuentoValor)}</span></div>` : ''}
  <div class="total-row final"><span>TOTAL A PAGAR</span><span>${fmt(c.total)}</span></div>
</div>

<!-- VIGENCIA -->
<div class="vigencia" style="margin-top:14px">
  <div>Fecha de Emisión: <span>${fechaEmision}</span></div>
  <div>Válida hasta: <span>${fechaVigencia}</span></div>
</div>

<!-- NOTAS ADICIONALES -->
${c.notasAdicionales ? `<div class="notas"><strong>Notas Adicionales</strong>${c.notasAdicionales}</div>` : ''}

<!-- TÉRMINOS Y CONDICIONES -->
<div class="terminos">
  <h3>Términos y Condiciones</h3>
  <ol>${terminosHtml}</ol>
</div>

<!-- FIRMAS -->
<div class="firma-grid">
  <div class="firma-box">
    Firma y Sello del Médico<br>
    <b>${c.medico.nombre} ${c.medico.apellido}</b>
  </div>
  <div class="firma-box">
    Firma de Aceptación del Paciente<br>
    <b>${c.paciente.nombreCompleto}</b>
  </div>
</div>

<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),1400);}</script>
</body></html>`;
}

function imprimirCotizacion(c: Cotizacion, clinica: Record<string, string>) {
  const w = window.open('', '_blank');
  if (!w) { alert('Permita ventanas emergentes para imprimir.'); return; }
  w.document.open();
  w.document.write(buildCotizacionHtml(c, clinica));
  w.document.close();
}

// ─────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────
interface LineaItem {
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
}

interface Cotizacion {
  id: string;
  pacienteId: string;
  medicoId: string;
  descripcionServicio: string;
  lineas: LineaItem[];
  subtotal: number;
  descuentoPorcentaje: number;
  descuentoValor: number;
  total: number;
  notasAdicionales?: string;
  vigenciaHasta: string;
  estado: 'GENERADA' | 'ACEPTADA' | 'RECHAZADA';
  creadoEn: string;
  paciente: {
    id: string;
    nombreCompleto: string;
    email?: string;
    numeroDocumento: string;
  };
  medico: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

// ─────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────
const PROCEDIMIENTOS_SUGERIDOS = [
  { label: 'Consulta inicial', valor: 150000 },
  { label: 'Botox – Zona frontal', valor: 450000 },
  { label: 'Ácido hialurónico', valor: 650000 },
  { label: 'Liposucción (área pequeña)', valor: 3500000 },
  { label: 'Abdominoplastia', valor: 8000000 },
  { label: 'Aumento mamario', valor: 9500000 },
  { label: 'Lifting facial', valor: 12000000 },
  { label: 'Rinoplastia', valor: 7000000 },
  { label: 'Control post-operatorio', valor: 120000 },
  { label: 'Anestesia general', valor: 1200000 },
  { label: 'Hospitalización (día)', valor: 500000 },
  { label: 'Insumos quirúrgicos', valor: 800000 },
];

const ESTADO_CFG = {
  GENERADA: {
    label: 'Nueva',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    dot: 'bg-yellow-400',
    border: 'border-yellow-500/30',
  },
  ACEPTADA: {
    label: 'Aprobada',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    dot: 'bg-emerald-400',
    border: 'border-emerald-500/30',
  },
  RECHAZADA: {
    label: 'Rechazada',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    dot: 'bg-red-400',
    border: 'border-red-500/30',
  },
} as const;

// Tipos del mapa corporal que generan líneas de cotización
const TIPO_A_COTIZACION: Record<string, { label: string; valor: number }> = {
  IMPLANTE_MAMARIO: { label: 'Aumento Mamario',          valor: 9_500_000 },
  LIPOSUCCION:      { label: 'Liposucción',               valor: 3_500_000 },
  LIFTING_FACIAL:   { label: 'Lifting Facial',            valor: 12_000_000 },
  ABDOMINOPLASTIA:  { label: 'Abdominoplastia',           valor: 8_000_000 },
  RINOPLASTIA:      { label: 'Rinoplastia',               valor: 7_000_000 },
  CICATRIZ:         { label: 'Tratamiento de Cicatriz',   valor: 0 },
  AREA_TRATADA:     { label: 'Área Intervenida',          valor: 0 },
};

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// ─────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────
export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCrear, setShowCrear] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<'TODAS' | 'GENERADA' | 'ACEPTADA' | 'RECHAZADA'>('TODAS');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [periodoActivo, setPeriodoActivo] = useState<string>('todo');

  // Atajos de período
  const setRapido = (tipo: string) => {
    setPeriodoActivo(tipo);
    const hoy = new Date();
    const y = hoy.getFullYear();
    const toStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const hoyStr = toStr(hoy);
    if (tipo === 'todo')    { setFechaDesde(''); setFechaHasta(''); return; }
    if (tipo === 'hoy')     { setFechaDesde(hoyStr); setFechaHasta(hoyStr); return; }
    if (tipo === 'mes')     { setFechaDesde(`${y}-${String(hoy.getMonth()+1).padStart(2,'0')}-01`); setFechaHasta(toStr(new Date(y, hoy.getMonth()+1, 0))); return; }
    if (tipo === 'mes_ant') { const m = new Date(y, hoy.getMonth()-1, 1); setFechaDesde(toStr(m)); setFechaHasta(toStr(new Date(y, hoy.getMonth(), 0))); return; }
    if (tipo === '3m')      { setFechaDesde(toStr(new Date(y, hoy.getMonth()-2, 1))); setFechaHasta(hoyStr); return; }
    if (tipo === 'anio')    { setFechaDesde(`${y}-01-01`); setFechaHasta(`${y}-12-31`); }
  };
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [clinicaParams, setClinicaParams] = useState<Record<string, string>>({});

  // ── Form states ──
  const [pacienteSearch, setPacienteSearch] = useState('');
  const [pacientesBuscados, setPacientesBuscados] = useState<any[]>([]);
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [lineas, setLineas] = useState<LineaItem[]>([
    { descripcion: '', cantidad: 1, valorUnitario: 0 },
  ]);
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);
  const [notas, setNotas] = useState('');
  const [vigenciaDias, setVigenciaDias] = useState(30);
  const [guardando, setGuardando] = useState(false);
  const [formErrors, setFormErrors] = useState<{ paciente?: string; descripcion?: string; lineas?: string; api?: string }>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mapaPrecargado, setMapaPrecargado] = useState<string | null>(null);

  const token = localStorage.getItem('accessToken') || '';

  // ── Cálculos en tiempo real ──
  const subtotal = lineas.reduce((s, l) => s + l.cantidad * l.valorUnitario, 0);
  const descuentoValor = (subtotal * descuentoPorcentaje) / 100;
  const total = subtotal - descuentoValor;

  // ─────────────────────────────────────────
  // Cargar cotizaciones
  // ─────────────────────────────────────────
  // Precarga procedimientos del mapa corporal al seleccionar paciente
  const cargarMapaCorporal = async (pacienteId: string) => {
    try {
      const res = await apiCall<{ total: number; data: any[] }>(
        `/mapa-corporal/paciente/${pacienteId}`,
        { token },
      );
      const mapaData = res.data?.data;
      if (!mapaData?.length) return;

      // Mapa más reciente (ya viene ordenado por fechaEvaluacion desc)
      const marcas: any[] = Array.isArray(mapaData[0].zonasMarcadas)
        ? mapaData[0].zonasMarcadas
        : [];

      // Agrupar zonas por tipo de procedimiento
      const grupos: Record<string, string[]> = {};
      for (const m of marcas) {
        if (!(m.tipo in TIPO_A_COTIZACION)) continue;
        if (!grupos[m.tipo]) grupos[m.tipo] = [];
        const zona = m.zona?.trim();
        if (zona && !grupos[m.tipo].includes(zona)) grupos[m.tipo].push(zona);
      }

      const keys = Object.keys(grupos);
      if (!keys.length) return;

      const nuevasLineas: LineaItem[] = keys.map(tipo => {
        const cfg = TIPO_A_COTIZACION[tipo];
        const zonas = grupos[tipo].join(', ');
        return {
          descripcion: zonas ? `${cfg.label} — ${zonas}` : cfg.label,
          cantidad: 1,
          valorUnitario: cfg.valor,
        };
      });

      setLineas(nuevasLineas);
      setMapaPrecargado(
        `${keys.length} procedimiento${keys.length !== 1 ? 's' : ''} precargado${keys.length !== 1 ? 's' : ''} desde el mapa corporal`,
      );
    } catch {
      // Sin mapa corporal o error → el médico completa manualmente
    }
  };

  const cargarCotizaciones = async () => {
    setLoading(true);
    try {
      const res = await apiCall<{ cotizaciones: Cotizacion[] }>('/cotizaciones', { token });
      if (res.data?.cotizaciones) setCotizaciones(res.data.cotizaciones);
    } catch {
      // Sin conexión — continuar con array vacío
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarCotizaciones();
    // Cargar parámetros de la clínica desde la parametrización del sistema
    getParametrosSistema('clinica').then((items: any[]) => {
      const map: Record<string, string> = {};
      items.forEach((p: any) => { map[p.clave] = p.valor ?? ''; });
      setClinicaParams(map);
    }).catch(() => {});
  }, []);

  // ─────────────────────────────────────────
  // Buscar paciente
  // ─────────────────────────────────────────
  const buscarPaciente = async () => {
    if (!pacienteSearch.trim()) return;
    setBuscandoPaciente(true);
    try {
      const res = await searchPacientes(pacienteSearch, token);
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : [res.data];
        setPacientesBuscados(list);
      } else {
        setPacientesBuscados([]);
      }
    } catch {
      setPacientesBuscados([]);
    }
    setBuscandoPaciente(false);
  };

  // ─────────────────────────────────────────
  // Gestión de líneas
  // ─────────────────────────────────────────
  const agregarLinea = () =>
    setLineas(prev => [...prev, { descripcion: '', cantidad: 1, valorUnitario: 0 }]);

  const eliminarLinea = (i: number) =>
    setLineas(prev => prev.filter((_, idx) => idx !== i));

  const actualizarLinea = (i: number, campo: keyof LineaItem, valor: any) =>
    setLineas(prev => prev.map((l, idx) => idx === i ? { ...l, [campo]: valor } : l));

  const agregarSugerido = (p: { label: string; valor: number }) => {
    setLineas(prev => {
      const ultima = prev[prev.length - 1];
      if (!ultima.descripcion && ultima.valorUnitario === 0) {
        return prev.map((l, i) =>
          i === prev.length - 1
            ? { ...l, descripcion: p.label, valorUnitario: p.valor }
            : l
        );
      }
      return [...prev, { descripcion: p.label, cantidad: 1, valorUnitario: p.valor }];
    });
  };

  // ─────────────────────────────────────────
  // Crear cotización
  // ─────────────────────────────────────────
  const crearCotizacion = async () => {
    // Validación con feedback visible
    const errors: typeof formErrors = {};
    if (!pacienteSeleccionado) errors.paciente = 'Selecciona un paciente antes de continuar';
    if (!descripcion.trim()) errors.descripcion = 'Escribe una descripción del servicio';
    const lineasValidas = lineas.filter(l => l.descripcion.trim());
    if (lineasValidas.length === 0) errors.lineas = 'Agrega al menos un servicio o procedimiento';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setGuardando(true);
    try {
      const res = await apiCall('/cotizaciones', {
        method: 'POST',
        token,
        body: {
          pacienteId: pacienteSeleccionado!.id,
          descripcionServicio: descripcion,
          lineas: lineasValidas,
          descuentoPorcentaje,
          notasAdicionales: notas || undefined,
          vigenciaDias,
        },
      });
      if (res.error) {
        setFormErrors({ api: res.error });
        setGuardando(false);
        return;
      }
      // ── Conectar con CRM: crear lead en etapa COTIZO ──
      try {
        const hoy = new Date().toISOString().split('T')[0];
        const vigenciaFecha = new Date(Date.now() + vigenciaDias * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];
        leadsService.create({
          nombre: pacienteSeleccionado!.nombreCompleto,
          procedimiento: descripcion,
          etapa: 'COTIZO',
          valor: total,
          fechaContacto: hoy,
          proximoContacto: vigenciaFecha,
          notas: notas || `Cotización generada por ${fmt(total)}`,
        });
      } catch {
        // CRM mock — no es bloqueante
      }
      setSuccessMsg(`✅ Cotización creada y lead CRM registrado para ${pacienteSeleccionado!.nombreCompleto}`);
      await cargarCotizaciones();
      setTimeout(() => {
        setShowCrear(false);
        resetForm();
      }, 1800);
    } catch {
      setFormErrors({ api: 'Error de conexión con el servidor. Verifica que el backend esté activo.' });
    }
    setGuardando(false);
  };

  const resetForm = () => {
    setPacienteSearch('');
    setPacientesBuscados([]);
    setPacienteSeleccionado(null);
    setDescripcion('');
    setLineas([{ descripcion: '', cantidad: 1, valorUnitario: 0 }]);
    setDescuentoPorcentaje(0);
    setNotas('');
    setVigenciaDias(30);
    setFormErrors({});
    setSuccessMsg(null);
    setMapaPrecargado(null);
  };

  // ─────────────────────────────────────────
  // Cambiar estado
  // ─────────────────────────────────────────
  const cambiarEstado = async (id: string, accion: 'aceptar' | 'rechazar') => {
    setProcesando(id);
    try {
      await apiCall(`/cotizaciones/${id}/${accion}`, { method: 'POST', token });
      await cargarCotizaciones();
      setSelectedCotizacion(null);
    } catch {}
    setProcesando(null);
  };

  // ─────────────────────────────────────────
  // Filtrar
  // ─────────────────────────────────────────
  const cotizacionesFiltradas = cotizaciones.filter(c => {
    const matchEstado = filterEstado === 'TODAS' || c.estado === filterEstado;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      c.paciente.nombreCompleto.toLowerCase().includes(q) ||
      c.descripcionServicio.toLowerCase().includes(q);
    const fecha = new Date(c.creadoEn);
    const matchDesde = !fechaDesde || fecha >= new Date(fechaDesde + 'T00:00:00');
    const matchHasta = !fechaHasta || fecha <= new Date(fechaHasta + 'T23:59:59');
    return matchEstado && matchSearch && matchDesde && matchHasta;
  });

  // ─────────────────────────────────────────
  // Stats
  // ─────────────────────────────────────────
  const now = new Date();
  const esMesActual = (d: string) => {
    const f = new Date(d);
    return f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear();
  };
  const totalMes = cotizaciones.filter(c => esMesActual(c.creadoEn)).length;
  const aprobadas = cotizaciones.filter(c => c.estado === 'ACEPTADA').length;
  const pendientes = cotizaciones.filter(c => c.estado === 'GENERADA').length;
  const ingresoProyectado = cotizaciones
    .filter(c => c.estado === 'ACEPTADA')
    .reduce((s, c) => s + c.total, 0);

  const KANBAN_COLS = [
    { key: 'GENERADA' as const, label: 'Nuevas', Icon: Clock },
    { key: 'ACEPTADA' as const, label: 'Aprobadas', Icon: CheckCircle2 },
    { key: 'RECHAZADA' as const, label: 'Rechazadas', Icon: XCircle },
  ];

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080a0f] p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-5"
      >
        {/* ══ Header ══ */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">
              💰 Cotizaciones{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                SARAI
              </span>
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Gestión comercial inteligente · {cotizaciones.length} cotizaciones
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCrear(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-yellow-500/20 transition"
          >
            <Plus size={18} />
            Nueva Cotización
          </motion.button>
        </div>

        {/* ══ Stats ══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Total',
              value: cotizaciones.length,
              Icon: FileText,
              gradient: 'from-blue-600 to-blue-700',
              ic: 'text-blue-300',
            },
            {
              label: 'Este Mes',
              value: totalMes,
              Icon: TrendingUp,
              gradient: 'from-purple-600 to-purple-700',
              ic: 'text-purple-300',
            },
            {
              label: 'Aprobadas',
              value: aprobadas,
              Icon: CheckCircle2,
              gradient: 'from-emerald-600 to-emerald-700',
              ic: 'text-emerald-300',
            },
            {
              label: 'Ingresos Proyectados',
              value: fmt(ingresoProyectado),
              Icon: DollarSign,
              gradient: 'from-yellow-600 to-amber-700',
              ic: 'text-yellow-300',
              isMoney: true,
            },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }}
              className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs font-medium">{s.label}</span>
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center`}
                >
                  <s.Icon size={15} className={s.ic} />
                </div>
              </div>
              <p className={`font-bold text-white ${s.isMoney ? 'text-sm' : 'text-2xl'}`}>
                {s.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ══ Barra de búsqueda / filtros ══ */}
        <div className="flex flex-col gap-2">
          {/* Fila 1: buscador + estado + recargar */}
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[200px] relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por paciente o servicio…"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {(['TODAS', 'GENERADA', 'ACEPTADA', 'RECHAZADA'] as const).map(e => (
                <button
                  key={e}
                  onClick={() => setFilterEstado(e)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    filterEstado === e
                      ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                      : 'bg-slate-800 text-gray-400 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {e === 'TODAS' ? 'Todas' : ESTADO_CFG[e].label}
                </button>
              ))}
            </div>
            <button
              onClick={cargarCotizaciones}
              disabled={loading}
              title="Recargar"
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 transition"
            >
              <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Fila 2: rango de fechas */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Atajos rápidos */}
            <div className="flex gap-1">
              {([
                { k: 'hoy',     l: 'Hoy' },
                { k: 'mes',     l: 'Este mes' },
                { k: 'mes_ant', l: 'Mes ant.' },
                { k: '3m',      l: '3 meses' },
                { k: 'anio',    l: 'Este año' },
                { k: 'todo',    l: 'Todo' },
              ] as const).map(({ k, l }) => (
                <button
                  key={k}
                  onClick={() => setRapido(k)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                    periodoActivo === k
                      ? 'bg-slate-600 text-white border border-slate-500'
                      : 'bg-slate-800/70 text-gray-500 hover:bg-slate-700 hover:text-gray-300 border border-slate-700/50'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            {/* Separador */}
            <span className="text-slate-600 text-xs select-none">|</span>
            {/* Inputs fecha */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-xs">Desde</span>
              <input
                type="date"
                value={fechaDesde}
                onChange={e => { setFechaDesde(e.target.value); setPeriodoActivo(''); }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-yellow-500 transition"
              />
              <span className="text-gray-500 text-xs">Hasta</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={e => { setFechaHasta(e.target.value); setPeriodoActivo(''); }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-yellow-500 transition"
              />
              {(fechaDesde || fechaHasta) && (
                <button
                  onClick={() => setRapido('todo')}
                  title="Limpiar fechas"
                  className="text-gray-500 hover:text-red-400 transition"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            {/* Contador resultados */}
            <span className="ml-auto text-gray-600 text-xs">
              {cotizacionesFiltradas.length} resultado{cotizacionesFiltradas.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ══ Kanban Pipeline ══ */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500 text-sm animate-pulse">Cargando cotizaciones…</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {KANBAN_COLS.map(({ key, label, Icon }) => {
              const items = cotizacionesFiltradas.filter(c => c.estado === key);
              const cfg = ESTADO_CFG[key];
              return (
                <div
                  key={key}
                  className={`bg-slate-900/60 border ${cfg.border} rounded-xl p-3`}
                >
                  {/* Col header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={cfg.color} />
                      <span className="text-white font-semibold text-sm">{label}</span>
                    </div>
                    <span className="bg-slate-700 text-gray-300 text-xs rounded-full px-2 py-0.5 font-bold">
                      {items.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2 max-h-[520px] overflow-y-auto">
                    {items.length === 0 ? (
                      <p className="text-gray-600 text-xs text-center py-8">
                        Sin cotizaciones
                      </p>
                    ) : (
                      items.map(c => (
                        <motion.div
                          key={c.id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => setSelectedCotizacion(c)}
                          className="bg-slate-800 border border-slate-700/60 hover:border-yellow-500/30 rounded-lg p-3 cursor-pointer transition group"
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <p className="text-white text-xs font-bold truncate flex-1 leading-snug">
                              {c.paciente.nombreCompleto}
                            </p>
                            <span className={`text-xs font-bold ${cfg.color} flex-shrink-0`}>
                              {fmt(c.total)}
                            </span>
                          </div>
                          <p className="text-gray-400 text-[11px] truncate mb-2 leading-snug">
                            {c.descripcionServicio}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-[10px]">
                              {fmtDate(c.creadoEn)}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={e => { e.stopPropagation(); imprimirCotizacion(c, clinicaParams); }}
                                title="Imprimir"
                                className="text-gray-600 hover:text-blue-400 transition"
                              >
                                <Printer size={11} />
                              </button>
                              <span className="text-gray-600 text-[10px] group-hover:text-yellow-400 transition flex items-center gap-0.5">
                                <Eye size={10} /> Ver
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Col footer total */}
                  {items.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-700/40">
                      <p className="text-gray-500 text-[10px] text-right">
                        Total:{' '}
                        <span className="text-white font-bold">
                          {fmt(items.reduce((s, c) => s + c.total, 0))}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pipeline vacío */}
        {!loading && cotizaciones.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-3xl">
              💰
            </div>
            <p className="text-white font-semibold">Sin cotizaciones aún</p>
            <p className="text-gray-500 text-sm">
              Crea tu primera cotización con el botón de arriba
            </p>
          </div>
        )}
      </motion.div>

      {/* ══════════════════════════════════════════ */}
      {/* MODAL — Crear Cotización                  */}
      {/* ══════════════════════════════════════════ */}
      <AnimatePresence>
        {showCrear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => { setShowCrear(false); resetForm(); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0d0f14] border border-yellow-600/30 rounded-2xl shadow-2xl w-full max-w-2xl my-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
                <div>
                  <h2 className="text-white font-bold text-lg">💰 Nueva Cotización</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Complete los datos del servicio</p>
                </div>
                <button
                  onClick={() => { setShowCrear(false); resetForm(); }}
                  className="text-gray-500 hover:text-white p-1.5 hover:bg-slate-700 rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* ── Paciente ── */}
                <div>
                  <label className="text-xs font-bold text-yellow-400 block mb-1.5">
                    👤 PACIENTE
                  </label>
                  {pacienteSeleccionado ? (
                    <div className="flex items-center justify-between bg-emerald-900/30 border border-emerald-500/30 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-white text-sm font-semibold">
                          {pacienteSeleccionado.nombreCompleto}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {pacienteSeleccionado.tipoDocumento} {pacienteSeleccionado.numeroDocumento}
                        </p>
                        {mapaPrecargado && (
                          <p className="text-emerald-400 text-[11px] mt-1 flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            {mapaPrecargado}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => { setPacienteSeleccionado(null); setPacienteSearch(''); setMapaPrecargado(null); setLineas([{ descripcion: '', cantidad: 1, valorUnitario: 0 }]); }}
                        className="text-gray-500 hover:text-red-400 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={pacienteSearch}
                          onChange={e => { setPacienteSearch(e.target.value); setFormErrors(p => ({ ...p, paciente: undefined })); }}
                          onKeyDown={e => e.key === 'Enter' && buscarPaciente()}
                          placeholder="Buscar por nombre o cédula…"
                          className={`flex-1 bg-slate-800 border rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition ${formErrors.paciente ? 'border-red-500' : 'border-slate-600 focus:border-yellow-500'}`}
                        />
                        <button
                          onClick={buscarPaciente}
                          disabled={buscandoPaciente}
                          className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold px-4 py-2 rounded-xl text-sm transition disabled:opacity-50"
                        >
                          {buscandoPaciente ? '…' : '🔍'}
                        </button>
                      </div>
                      {pacientesBuscados.length > 0 && (
                        <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-yellow-600/30 rounded-xl shadow-xl z-50 max-h-44 overflow-y-auto">
                          {pacientesBuscados.map((p: any) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setPacienteSeleccionado(p);
                                setPacientesBuscados([]);
                                setPacienteSearch('');
                                cargarMapaCorporal(p.id);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-700 text-sm text-white border-b border-slate-700/50 last:border-0 transition"
                            >
                              <span className="font-semibold">{p.nombreCompleto}</span>
                              <span className="text-gray-400 text-xs ml-2">
                                {p.tipoDocumento} {p.numeroDocumento}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Descripción ── */}
                <div>
                  <label className="text-xs font-bold text-blue-400 block mb-1.5">
                    📋 DESCRIPCIÓN DEL SERVICIO
                  </label>
                  <input
                    type="text"
                    value={descripcion}
                    onChange={e => { setDescripcion(e.target.value); setFormErrors(p => ({ ...p, descripcion: undefined })); }}
                    placeholder="Ej: Procedimiento de abdominoplastia más controles…"
                    className={`w-full bg-slate-800 border rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition ${formErrors.descripcion ? 'border-red-500' : 'border-slate-600 focus:border-blue-500'}`}
                  />
                </div>

                {/* ── Procedimientos sugeridos ── */}
                <div>
                  <label className="text-xs font-bold text-purple-400 block mb-1.5">
                    💡 AGREGAR RÁPIDO
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {PROCEDIMIENTOS_SUGERIDOS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => agregarSugerido(p)}
                        className="px-2 py-0.5 bg-purple-900/30 hover:bg-purple-700/50 border border-purple-600/30 text-purple-300 text-[10px] rounded-full transition"
                      >
                        + {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Líneas ── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-cyan-400">
                      💉 LÍNEAS DE SERVICIO
                    </label>
                    <button
                      onClick={agregarLinea}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                    >
                      <Plus size={11} /> Agregar línea
                    </button>
                  </div>
                  {/* Headers */}
                  <div className="grid grid-cols-12 gap-1 px-1 mb-1 text-[10px] text-gray-500 font-semibold">
                    <span className="col-span-6">DESCRIPCIÓN</span>
                    <span className="col-span-2 text-center">CANT.</span>
                    <span className="col-span-3 text-right">VALOR UNIT.</span>
                    <span className="col-span-1" />
                  </div>
                  <div className="space-y-1.5">
                    {lineas.map((l, i) => (
                      <div key={i} className="grid grid-cols-12 gap-1 items-center">
                        <input
                          value={l.descripcion}
                          onChange={e => actualizarLinea(i, 'descripcion', e.target.value)}
                          placeholder="Procedimiento o insumo"
                          className="col-span-6 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition"
                        />
                        <input
                          type="number"
                          min="1"
                          value={l.cantidad}
                          onChange={e =>
                            actualizarLinea(i, 'cantidad', parseInt(e.target.value) || 1)
                          }
                          className="col-span-2 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-cyan-500 transition"
                        />
                        <input
                          type="number"
                          min="0"
                          value={l.valorUnitario || ''}
                          onChange={e =>
                            actualizarLinea(i, 'valorUnitario', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                          className="col-span-3 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:outline-none focus:border-cyan-500 transition"
                        />
                        <button
                          onClick={() => eliminarLinea(i)}
                          disabled={lineas.length === 1}
                          className="col-span-1 flex items-center justify-center text-gray-600 hover:text-red-400 disabled:opacity-30 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Descuento + Vigencia ── */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-orange-400 block mb-1.5">
                      🎁 DESCUENTO (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={descuentoPorcentaje}
                      onChange={e =>
                        setDescuentoPorcentaje(parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-pink-400 block mb-1.5">
                      📅 VIGENCIA (días)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={vigenciaDias}
                      onChange={e =>
                        setVigenciaDias(parseInt(e.target.value) || 30)
                      }
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 transition"
                    />
                  </div>
                </div>

                {/* ── Notas ── */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1.5">
                    📝 NOTAS ADICIONALES
                  </label>
                  <textarea
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    rows={2}
                    placeholder="Condiciones especiales, financiamiento, observaciones…"
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-y transition"
                  />
                </div>

                {/* ── Resumen financiero ── */}
                <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white">{fmt(subtotal)}</span>
                  </div>
                  {descuentoPorcentaje > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-400">
                        Descuento ({descuentoPorcentaje}%)
                      </span>
                      <span className="text-orange-400">−{fmt(descuentoValor)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t border-slate-600/50">
                    <span className="text-white text-base">TOTAL</span>
                    <span className="text-yellow-400 text-xl">{fmt(total)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-700/50 space-y-3">
                {/* Mensajes de error de validación */}
                {Object.keys(formErrors).length > 0 && (
                  <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-3 space-y-1">
                    {formErrors.paciente && (
                      <p className="text-red-400 text-xs flex items-center gap-1.5">
                        <AlertTriangle size={11} /> {formErrors.paciente}
                      </p>
                    )}
                    {formErrors.descripcion && (
                      <p className="text-red-400 text-xs flex items-center gap-1.5">
                        <AlertTriangle size={11} /> {formErrors.descripcion}
                      </p>
                    )}
                    {formErrors.lineas && (
                      <p className="text-red-400 text-xs flex items-center gap-1.5">
                        <AlertTriangle size={11} /> {formErrors.lineas}
                      </p>
                    )}
                    {formErrors.api && (
                      <p className="text-red-400 text-xs flex items-center gap-1.5">
                        <AlertTriangle size={11} /> {formErrors.api}
                      </p>
                    )}
                  </div>
                )}
                {/* Mensaje de éxito */}
                {successMsg && (
                  <div className="bg-emerald-900/30 border border-emerald-500/40 rounded-xl p-3">
                    <p className="text-emerald-400 text-xs">{successMsg}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowCrear(false); resetForm(); }}
                    className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={crearCotizacion}
                    disabled={guardando}
                    className="flex-1 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold rounded-xl text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {guardando ? (
                      <><RotateCw size={14} className="animate-spin" /> Guardando…</>
                    ) : (
                      <><Send size={14} /> Crear y Enviar</>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════ */}
      {/* MODAL — Ver Detalle Cotización            */}
      {/* ══════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedCotizacion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCotizacion(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0d0f14] border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      ESTADO_CFG[selectedCotizacion.estado].dot
                    }`}
                  />
                  <div>
                    <h3 className="text-white font-bold">Detalle Cotización</h3>
                    <p className="text-gray-500 text-xs">{fmtDate(selectedCotizacion.creadoEn)}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      ESTADO_CFG[selectedCotizacion.estado].bg
                    } ${ESTADO_CFG[selectedCotizacion.estado].color}`}
                  >
                    {ESTADO_CFG[selectedCotizacion.estado].label}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCotizacion(null)}
                  className="text-gray-500 hover:text-white p-1.5 hover:bg-slate-700 rounded-lg transition"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Paciente */}
                <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
                  <p className="text-[10px] text-gray-500 mb-1 font-semibold tracking-wider">
                    PACIENTE
                  </p>
                  <p className="text-white font-bold">{selectedCotizacion.paciente.nombreCompleto}</p>
                  <p className="text-gray-400 text-xs">{selectedCotizacion.paciente.numeroDocumento}</p>
                  {selectedCotizacion.paciente.email && (
                    <p className="text-gray-400 text-xs">{selectedCotizacion.paciente.email}</p>
                  )}
                </div>

                {/* Servicio */}
                <div>
                  <p className="text-[10px] text-gray-500 mb-1 font-semibold tracking-wider">
                    SERVICIO
                  </p>
                  <p className="text-white text-sm">{selectedCotizacion.descripcionServicio}</p>
                </div>

                {/* Líneas */}
                <div>
                  <p className="text-[10px] text-gray-500 mb-2 font-semibold tracking-wider">
                    LÍNEAS
                  </p>
                  <div className="space-y-1.5">
                    {(selectedCotizacion.lineas as LineaItem[]).map((l, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-white text-xs truncate block">{l.descripcion}</span>
                          <span className="text-gray-500 text-[10px]">
                            {l.cantidad} × {fmt(l.valorUnitario)}
                          </span>
                        </div>
                        <span className="text-cyan-400 text-xs font-semibold ml-2 flex-shrink-0">
                          {fmt(l.cantidad * l.valorUnitario)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totales */}
                <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white">{fmt(selectedCotizacion.subtotal)}</span>
                  </div>
                  {selectedCotizacion.descuentoPorcentaje > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-400">
                        Descuento ({selectedCotizacion.descuentoPorcentaje}%)
                      </span>
                      <span className="text-orange-400">
                        −{fmt(selectedCotizacion.descuentoValor)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-1.5 border-t border-slate-600/50">
                    <span className="text-white">TOTAL</span>
                    <span className="text-yellow-400 text-lg">
                      {fmt(selectedCotizacion.total)}
                    </span>
                  </div>
                </div>

                {/* Vigencia */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Válida hasta</span>
                  <span className="text-white">{fmtDate(selectedCotizacion.vigenciaHasta)}</span>
                </div>

                {/* Notas */}
                {selectedCotizacion.notasAdicionales && (
                  <div className="bg-slate-800/60 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 mb-1 font-semibold tracking-wider">
                      NOTAS
                    </p>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      {selectedCotizacion.notasAdicionales}
                    </p>
                  </div>
                )}
              </div>

              {/* Acciones — siempre visible */}
              <div className="flex gap-2 p-5 border-t border-slate-700/50">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => imprimirCotizacion(selectedCotizacion, clinicaParams)}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2"
                >
                  <Printer size={14} /> Imprimir / PDF
                </motion.button>
                {selectedCotizacion.estado === 'GENERADA' && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => cambiarEstado(selectedCotizacion.id, 'rechazar')}
                      disabled={!!procesando}
                      className="flex-1 py-2.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 font-semibold rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <XCircle size={14} /> Rechazar
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => cambiarEstado(selectedCotizacion.id, 'aceptar')}
                      disabled={!!procesando}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {procesando === selectedCotizacion.id ? (
                        <RotateCw size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      Aprobar
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
