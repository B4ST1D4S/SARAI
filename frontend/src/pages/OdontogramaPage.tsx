import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Save, Sparkles, Trash2, Eraser, Stethoscope, ClipboardList,
  Activity, CheckCircle2, Clock, CalendarClock, Ban, PauseCircle, DollarSign, X, Printer,
} from 'lucide-react';
import { searchPacientes } from '../services/api';
import OdontogramaInteractivo, { SUPERFICIES } from '../components/medical/OdontogramaInteractivo';
import * as odo from '../services/odontologiaService';
import type {
  OdontoCatalogos, OdontoHallazgo, PiezaHallazgo, Odontograma, PlanItem, Evolucion, EstadoTratamiento,
} from '../services/odontologiaService';

const fmtCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

// ════════════════════════════════════════════════════════════════
//  IMPRESIÓN ODONTOGRAMA — generador HTML + SVG
// ════════════════════════════════════════════════════════════════
function printInNewWindow(html: string) {
  const w = window.open('', '_blank');
  if (!w) { alert('Permita ventanas emergentes en su navegador para imprimir.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

const ODO_PRINT_CSS = `
  body{font-family:Arial,sans-serif;font-size:11px;color:#111;margin:0}
  h1{font-size:14px;font-weight:bold;border-bottom:2px solid #222;padding-bottom:5px;margin-bottom:10px}
  h2{font-size:10px;font-weight:bold;background:#f0f0f0;padding:3px 8px;border-left:3px solid #555;margin:10px 0 5px;page-break-after:avoid}
  .hdr{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;background:#f8f8f8;border:1px solid #ddd;padding:6px 8px;border-radius:3px;margin-bottom:10px}
  .f{margin-bottom:3px}
  .lbl{font-size:8px;font-weight:bold;text-transform:uppercase;color:#666;letter-spacing:.5px}
  .val{border-bottom:1px solid #bbb;min-height:14px;padding:1px 0;white-space:pre-wrap}
  .g2{display:grid;grid-template-columns:1fr 1fr;gap:5px}
  .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px}
  .sec{margin-bottom:6px;page-break-inside:avoid}
  .odo-wrap{background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;padding:10px;margin-bottom:6px}
  .legend{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0;font-size:9px}
  .ldot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:2px;vertical-align:middle}
  table{width:100%;border-collapse:collapse;margin-top:4px}
  th{background:#eee;padding:3px 5px;text-align:left;border:1px solid #ccc;font-size:9px}
  td{padding:3px 5px;border:1px solid #ddd;font-size:9px}
  tfoot td{background:#f8f8f8;font-weight:bold}
  .firma{margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:40px}
  .firma-box{border-top:1px solid #333;padding-top:3px;text-align:center;font-size:9px}
  @page{margin:12mm 15mm;size:A4}
  @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
`;

function _toothSvg(diente: number, piezas: PiezaHallazgo[], x: number, y: number): string {
  const S = 36, a = 11;
  const q = Math.floor(diente / 10);
  const mesialRight = q === 1 || q === 4 || q === 5 || q === 8;
  const rightCode = mesialRight ? 'M' : 'D';
  const leftCode  = mesialRight ? 'D' : 'M';
  const find = (code: string | null) =>
    piezas.find(p => p.diente === diente && (p.superficie || null) === code);
  const col = (code: string | null): string => {
    const f = find(code);
    if (!f) return 'transparent';
    return f.colorOverride || f.estado?.color || f.hallazgo?.color || 'transparent';
  };
  const whole      = find(null);
  const wholeColor = whole ? (whole.colorOverride || whole.hallazgo?.color || null) : null;
  const absent     = whole?.hallazgo?.codigo === 'AUSENTE';
  const hasCircle  = whole && ['CORONA', 'IMPLANTE', 'PROTESIS'].includes(whole.hallazgo?.codigo || '');
  const wc         = wholeColor || '#94a3b8';
  const wfill      = wholeColor ? `${wholeColor}30` : 'rgba(200,200,200,0.06)';
  return `<g transform="translate(${x},${y})">
    <text x="${S/2}" y="-2" text-anchor="middle" font-size="6.5" fill="#666" font-family="Arial,sans-serif" font-weight="bold">${diente}</text>
    <rect x="0" y="0" width="${S}" height="${S}" rx="2" fill="${wfill}" stroke="${wc}" stroke-width="${wholeColor ? 1.2 : 0.5}"/>
    <polygon points="0,0 ${S},0 ${S-a},${a} ${a},${a}" fill="${col('V')}" stroke="#9ca3af" stroke-width="0.4"/>
    <polygon points="0,${S} ${S},${S} ${S-a},${S-a} ${a},${S-a}" fill="${col('L')}" stroke="#9ca3af" stroke-width="0.4"/>
    <polygon points="${S},0 ${S},${S} ${S-a},${S-a} ${S-a},${a}" fill="${col(rightCode)}" stroke="#9ca3af" stroke-width="0.4"/>
    <polygon points="0,0 0,${S} ${a},${S-a} ${a},${a}" fill="${col(leftCode)}" stroke="#9ca3af" stroke-width="0.4"/>
    <rect x="${a}" y="${a}" width="${S-2*a}" height="${S-2*a}" fill="${col('O')}" stroke="#9ca3af" stroke-width="0.4"/>
    ${absent ? `<line x1="5" y1="5" x2="${S-5}" y2="${S-5}" stroke="${wholeColor||'#374151'}" stroke-width="2" stroke-linecap="round"/>
    <line x1="${S-5}" y1="5" x2="5" y2="${S-5}" stroke="${wholeColor||'#374151'}" stroke-width="2" stroke-linecap="round"/>` : ''}
    ${hasCircle ? `<circle cx="${S/2}" cy="${S/2}" r="${S/2-4}" fill="none" stroke="${whole!.hallazgo?.color||'#6b7280'}" stroke-width="1.5"/>` : ''}
  </g>`;
}

function _buildOdoSvg(piezas: PiezaHallazgo[], denticion: string): string {
  const S = 36, step = 38;
  const PERM = {
    supD: [18,17,16,15,14,13,12,11], supI: [21,22,23,24,25,26,27,28],
    infD: [48,47,46,45,44,43,42,41], infI: [31,32,33,34,35,36,37,38],
  };
  const TEMP = {
    supD: [55,54,53,52,51], supI: [61,62,63,64,65],
    infD: [85,84,83,82,81], infI: [71,72,73,74,75],
  };
  const leftPad = 10, midGap = 14;
  const permW = 8 * step, tempW = 5 * step;
  const totalW = leftPad + permW + midGap + permW + leftPad;
  const mostrarPerm = denticion === 'PERMANENTE' || denticion === 'MIXTA';
  const mostrarTemp = denticion === 'TEMPORAL'   || denticion === 'MIXTA';
  const parts: string[] = [];
  let curY = 10;
  if (mostrarPerm) {
    for (let i = 0; i < 8; i++) {
      parts.push(_toothSvg(PERM.supD[i], piezas, leftPad + i * step, curY));
      parts.push(_toothSvg(PERM.supI[i], piezas, leftPad + permW + midGap + i * step, curY));
    }
    const mx = leftPad + permW + midGap / 2;
    parts.push(`<line x1="${mx}" y1="${curY-6}" x2="${mx}" y2="${curY+S+10}" stroke="#d1d5db" stroke-width="0.8" stroke-dasharray="3,2"/>`);
    const sepY = curY + S + 6;
    parts.push(`<line x1="${leftPad}" y1="${sepY}" x2="${totalW-leftPad}" y2="${sepY}" stroke="#d1d5db" stroke-width="0.8"/>`);
    curY = sepY + 8;
    for (let i = 0; i < 8; i++) {
      parts.push(_toothSvg(PERM.infD[i], piezas, leftPad + i * step, curY));
      parts.push(_toothSvg(PERM.infI[i], piezas, leftPad + permW + midGap + i * step, curY));
    }
    parts.push(`<line x1="${mx}" y1="${curY-6}" x2="${mx}" y2="${curY+S+8}" stroke="#d1d5db" stroke-width="0.8" stroke-dasharray="3,2"/>`);
    curY += S + 14;
  }
  if (mostrarTemp) {
    if (mostrarPerm) {
      parts.push(`<line x1="${leftPad}" y1="${curY}" x2="${totalW-leftPad}" y2="${curY}" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="4,3"/>`);
      parts.push(`<text x="${totalW/2}" y="${curY+10}" text-anchor="middle" font-size="7" fill="#9ca3af" font-family="Arial,sans-serif" font-weight="bold" letter-spacing="1">DENTICIÓN TEMPORAL</text>`);
      curY += 18;
    }
    const tStart = leftPad + (permW - tempW) / 2;
    for (let i = 0; i < 5; i++) {
      parts.push(_toothSvg(TEMP.supD[i], piezas, tStart + i * step, curY));
      parts.push(_toothSvg(TEMP.supI[i], piezas, tStart + tempW + midGap + i * step, curY));
    }
    const tmx = tStart + tempW + midGap / 2;
    parts.push(`<line x1="${tmx}" y1="${curY-6}" x2="${tmx}" y2="${curY+S+10}" stroke="#d1d5db" stroke-width="0.8" stroke-dasharray="3,2"/>`);
    const tSepY = curY + S + 6;
    parts.push(`<line x1="${tStart}" y1="${tSepY}" x2="${tStart+2*tempW+midGap}" y2="${tSepY}" stroke="#d1d5db" stroke-width="0.8"/>`);
    curY = tSepY + 8;
    for (let i = 0; i < 5; i++) {
      parts.push(_toothSvg(TEMP.infD[i], piezas, tStart + i * step, curY));
      parts.push(_toothSvg(TEMP.infI[i], piezas, tStart + tempW + midGap + i * step, curY));
    }
    parts.push(`<line x1="${tmx}" y1="${curY-6}" x2="${tmx}" y2="${curY+S+8}" stroke="#d1d5db" stroke-width="0.8" stroke-dasharray="3,2"/>`);
    curY += S + 14;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${curY}" style="display:block;max-width:100%;background:white">${parts.join('')}</svg>`;
}

interface PrintOdoParams {
  paciente: { nombreCompleto: string; tipoDocumento?: string; numeroDocumento: string };
  odontograma: Odontograma;
  piezas: PiezaHallazgo[];
  generales: any;
  estetica: any;
  riesgoId: string;
  resumenIA: string;
  denticion: string;
  catalogos: OdontoCatalogos;
  tipo: 'PRIMERA_VEZ' | 'TRATAMIENTO';
}

function buildOdontogramaHtml(p: PrintOdoParams): string {
  const { paciente, odontograma, piezas, generales, estetica, riesgoId, resumenIA, denticion, catalogos, tipo } = p;
  const fechaHoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  const riesgo = catalogos.riesgos.find(r => r.id === riesgoId)?.nombre || '—';
  const fld = (label: string, value: unknown) => {
    const v = value === true ? 'Sí' : value === false ? 'No' : String(value ?? '');
    return `<div class="f"><div class="lbl">${label}</div><div class="val">${v || '&nbsp;'}</div></div>`;
  };
  const sec = (title: string, body: string) => `<div class="sec"><h2>${title}</h2>${body}</div>`;
  const items = odontograma.planItems || [];
  const total = items.reduce((s, i) => s + (i.precio || 0), 0);
  const usedH = [...new Map(piezas.filter(pp => pp.hallazgo).map(pp => [pp.hallazgo!.id, pp.hallazgo!])).values()];
  const legend = usedH.length > 0
    ? `<div class="legend">${usedH.map(h => `<span><span class="ldot" style="background:${h.color}"></span>${h.nombre}</span>`).join('')}</div>`
    : '';
  const tipoLabel = tipo === 'PRIMERA_VEZ' ? 'Primera Vez' : 'Tratamiento';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Odontograma ${tipoLabel} — ${paciente.nombreCompleto}</title>
<style>${ODO_PRINT_CSS}</style></head><body>
<h1>Odontograma Odontológico · ${tipoLabel}</h1>
<div class="hdr">
  ${fld('Paciente', paciente.nombreCompleto)}
  ${fld('Documento', `${paciente.tipoDocumento || ''} ${paciente.numeroDocumento}`)}
  ${fld('Fecha', fechaHoy)}
  ${fld('Dentición', denticion)}
  ${fld('Riesgo clínico', riesgo)}
  ${fld('Tipo', tipoLabel)}
</div>

${sec('Odontograma FDI · Numeración Internacional',
  `<div class="odo-wrap">${_buildOdoSvg(piezas, denticion)}${legend}</div>`
)}

${sec('Hallazgos Generales', `<div class="g2">
  ${fld('Higiene oral', generales.higiene || '')}
  ${fld('Estado periodontal', generales.periodontal || '')}
  ${fld('Oclusión', generales.oclusion || '')}
  ${fld('ATM', generales.atm || '')}
  ${fld('Riesgo clínico', riesgo)}
  ${fld('Observaciones', generales.observaciones || '')}
</div>`)}

${sec('Odontología Estética', `<div class="g3">
  ${fld('Color dental (VITA)', estetica.colorDental || '')}
  ${fld('Pigmentaciones', estetica.pigmentaciones || '')}
  ${fld('Diastemas', estetica.diastemas || '')}
  ${fld('Alteraciones de forma', estetica.forma || '')}
  ${fld('Alteraciones de tamaño', estetica.tamano || '')}
  ${fld('Sonrisa gingival', estetica.sonrisaGingival || '')}
  ${fld('Asimetrías', estetica.asimetrias || '')}
  ${fld('Rest. antiestéticas', estetica.restauracionesAntiesteticas || '')}
  ${fld('Desgaste estético', estetica.desgasteEstetico || '')}
</div>${fld('Observaciones estéticas', estetica.observaciones || '')}`)}

${sec('Resumen Clínico', fld('Resumen', resumenIA))}

${items.length > 0 ? sec(`Plan de Tratamiento · ${items.length} procedimiento(s) · Total: ${fmtCOP(total)}`, `
<table>
  <thead><tr><th>Diente</th><th>Diagnóstico</th><th>Procedimiento</th><th>CUPS</th><th>Prioridad</th><th>Estado</th><th>Precio</th></tr></thead>
  <tbody>
    ${items.map(item => `<tr>
      <td>${item.diente ? `${item.diente}${item.superficie ? ' · ' + item.superficie : ''}` : '—'}</td>
      <td>${item.diagnostico || ''}</td>
      <td>${item.descripcionProcedimiento || ''}</td>
      <td>${item.codigoCups || '—'}</td>
      <td>${(item as any).prioridad?.nombre || '—'}</td>
      <td>${ESTADO_META[item.estadoTratamiento]?.label || item.estadoTratamiento}</td>
      <td>${fmtCOP(item.precio)}</td>
    </tr>`).join('')}
  </tbody>
  <tfoot><tr><td colspan="6" style="text-align:right">TOTAL</td><td>${fmtCOP(total)}</td></tr></tfoot>
</table>`) : ''}

<div class="firma">
  <div class="firma-box">Firma y Sello del Odontólogo</div>
  <div class="firma-box">Firma del Paciente / Representante</div>
</div>
<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),1400);}</script>
</body></html>`;
}

const ESTADO_FLOW: { code: EstadoTratamiento; label: string; color: string; icon: any }[] = [
  { code: 'PLANEADO', label: 'Planeado', color: '#94a3b8', icon: ClipboardList },
  { code: 'AGENDADO', label: 'Agendado', color: '#06b6d4', icon: CalendarClock },
  { code: 'EN_TRATAMIENTO', label: 'En tratamiento', color: '#eab308', icon: Activity },
  { code: 'FINALIZADO', label: 'Finalizado', color: '#22c55e', icon: CheckCircle2 },
];
const ESTADO_META: Record<string, { label: string; color: string; icon: any }> = {
  PLANEADO: { label: 'Planeado', color: '#94a3b8', icon: ClipboardList },
  AGENDADO: { label: 'Agendado', color: '#06b6d4', icon: CalendarClock },
  EN_TRATAMIENTO: { label: 'En tratamiento', color: '#eab308', icon: Activity },
  FINALIZADO: { label: 'Finalizado', color: '#22c55e', icon: CheckCircle2 },
  SUSPENDIDO: { label: 'Suspendido', color: '#f97316', icon: PauseCircle },
  CANCELADO: { label: 'Cancelado', color: '#ef4444', icon: Ban },
};

interface PacienteSel {
  id: string;
  nombreCompleto: string;
  numeroDocumento: string;
  tipoDocumento?: string;
}

export default function OdontogramaPage() {
  const token = localStorage.getItem('accessToken') || '';
  const [tab, setTab] = useState<'PRIMERA_VEZ' | 'TRATAMIENTO'>('PRIMERA_VEZ');
  const [catalogos, setCatalogos] = useState<OdontoCatalogos | null>(null);
  const [resumen, setResumen] = useState<odo.ResumenOdonto | null>(null);
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'err' } | null>(null);

  // Paciente
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<PacienteSel[]>([]);
  const [paciente, setPaciente] = useState<PacienteSel | null>(null);

  // Odontogramas
  const [odontograma, setOdontograma] = useState<Odontograma | null>(null);
  const [odontogramasTrat, setOdontogramasTrat] = useState<Odontograma[]>([]);

  const notify = (msg: string, tipo: 'ok' | 'err' = 'ok') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    odo.getCatalogos().then(setCatalogos).catch(() => notify('Error cargando catálogos', 'err'));
    odo.getResumen().then(setResumen).catch(() => {});
  }, []);

  // Búsqueda de pacientes (debounce)
  useEffect(() => {
    if (!busqueda.trim() || paciente) { setResultados([]); return; }
    const t = setTimeout(async () => {
      const res = await searchPacientes(busqueda.trim(), token);
      const data: any = (res as any).data;
      const lista: PacienteSel[] = Array.isArray(data) ? data : data?.pacientes || [];
      setResultados(lista.slice(0, 8));
    }, 350);
    return () => clearTimeout(t);
  }, [busqueda, paciente, token]);

  const seleccionarPaciente = async (p: PacienteSel) => {
    setPaciente(p);
    setBusqueda('');
    setResultados([]);
    await cargarOdontogramas(p.id);
  };

  const cargarOdontogramas = async (pacienteId: string) => {
    const [pv, tr] = await Promise.all([
      odo.getOdontogramasByPaciente(pacienteId, 'PRIMERA_VEZ'),
      odo.getOdontogramasByPaciente(pacienteId, 'TRATAMIENTO'),
    ]);
    if (pv[0]) {
      const full = await odo.getOdontograma(pv[0].id);
      setOdontograma(full);
    } else {
      setOdontograma(null);
    }
    // Para tratamiento: usar el de primera vez (el plan vive ahí) + cualquiera de tratamiento
    setOdontogramasTrat(tr);
  };

  const limpiarPaciente = () => {
    setPaciente(null);
    setOdontograma(null);
    setOdontogramasTrat([]);
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-12 rounded-full bg-gradient-to-b from-yellow-400 to-amber-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">
              <span className="bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">Odontología</span>
            </h1>
            <p className="text-gray-500 text-sm flex items-center gap-1.5">
              <Stethoscope size={14} /> Odontograma · Primera vez y Tratamiento
            </p>
          </div>
        </div>
        {resumen && (
          <div className="grid grid-cols-4 gap-2">
            <KpiMini label="Valoraciones" value={resumen.totalOdontogramas} color="#eab308" />
            <KpiMini label="En plan" value={resumen.planAbierto} color="#06b6d4" />
            <KpiMini label="Finalizados" value={resumen.finalizados} color="#22c55e" />
            <KpiMini label="Facturados" value={resumen.facturados} color="#a855f7" />
          </div>
        )}
      </div>

      {/* Selector de paciente */}
      <div className="mb-6">
        {!paciente ? (
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar paciente por nombre o documento…"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#0d0f14] border border-white/10 text-white placeholder-gray-600 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 outline-none"
            />
            <AnimatePresence>
              {resultados.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute z-30 mt-2 w-full rounded-2xl bg-[#11141b] border border-white/10 shadow-2xl overflow-hidden"
                >
                  {resultados.map((p) => (
                    <button key={p.id} onClick={() => seleccionarPaciente(p)}
                      className="w-full text-left px-4 py-3 hover:bg-yellow-500/10 transition-colors border-b border-white/5 last:border-0">
                      <p className="text-white text-sm font-semibold">{p.nombreCompleto}</p>
                      <p className="text-gray-500 text-xs">{p.tipoDocumento} {p.numeroDocumento}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center justify-between max-w-xl px-4 py-3 rounded-2xl bg-yellow-500/[0.06] border border-yellow-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold">
                {paciente.nombreCompleto.charAt(0)}
              </div>
              <div>
                <p className="text-white font-semibold">{paciente.nombreCompleto}</p>
                <p className="text-gray-500 text-xs">{paciente.tipoDocumento} {paciente.numeroDocumento}</p>
              </div>
            </div>
            <button onClick={limpiarPaciente} className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-white/5">
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {paciente && catalogos && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 rounded-2xl bg-[#0d0f14] border border-white/10 w-fit">
            {(['PRIMERA_VEZ', 'TRATAMIENTO'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  tab === t ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900' : 'text-gray-400 hover:text-white'
                }`}>
                {t === 'PRIMERA_VEZ' ? 'Odontograma Primera Vez' : 'Odontograma de Tratamiento'}
              </button>
            ))}
          </div>

          {tab === 'PRIMERA_VEZ' ? (
            <PrimeraVez
              paciente={paciente}
              catalogos={catalogos}
              odontograma={odontograma}
              onCreate={async () => {
                const o = await odo.crearOdontograma({ pacienteId: paciente.id, tipo: 'PRIMERA_VEZ' });
                const full = await odo.getOdontograma(o.id);
                setOdontograma(full);
                notify('Valoración creada');
              }}
              onRefresh={async () => {
                if (odontograma) setOdontograma(await odo.getOdontograma(odontograma.id));
              }}
              notify={notify}
            />
          ) : (
            <Tratamiento
              odontograma={odontograma}
              odontogramasTrat={odontogramasTrat}
              catalogos={catalogos}
              notify={notify}
              onRefresh={async () => {
                if (odontograma) setOdontograma(await odo.getOdontograma(odontograma.id));
                odo.getResumen().then(setResumen).catch(() => {});
              }}
            />
          )}
        </>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-semibold ${
              toast.tipo === 'ok' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-red-500/15 border-red-500/30 text-red-300'
            }`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KpiMini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="px-3 py-2 rounded-xl bg-[#0d0f14] border border-white/10 text-center min-w-[78px]">
      <p className="text-xl font-black" style={{ color }}>{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  PESTAÑA · PRIMERA VEZ
// ════════════════════════════════════════════════════════════════
function PrimeraVez({
  paciente, catalogos, odontograma, onCreate, onRefresh, notify,
}: {
  paciente: PacienteSel;
  catalogos: OdontoCatalogos;
  odontograma: Odontograma | null;
  onCreate: () => Promise<void>;
  onRefresh: () => Promise<void>;
  notify: (m: string, t?: 'ok' | 'err') => void;
}) {
  const [piezas, setPiezas] = useState<PiezaHallazgo[]>([]);
  const [brush, setBrush] = useState<OdontoHallazgo | null>(null);
  const [erase, setErase] = useState(false);
  const [estadoBrush, setEstadoBrush] = useState<string>('');
  const [generales, setGenerales] = useState<any>({});
  const [estetica, setEstetica] = useState<any>({});
  const [riesgoId, setRiesgoId] = useState('');
  const [resumenIA, setResumenIA] = useState('');
  const [denticion, setDenticion] = useState('PERMANENTE');
  const [guardando, setGuardando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (odontograma) {
      setPiezas(odontograma.piezas || []);
      setGenerales(odontograma.hallazgosGenerales || {});
      setEstetica(odontograma.estetica || {});
      setRiesgoId(odontograma.riesgoId || '');
      setResumenIA(odontograma.resumenIA || '');
      setDenticion(odontograma.denticion || 'PERMANENTE');
    }
  }, [odontograma?.id]);

  // Autoguardado de piezas (debounce)
  const persistPiezas = useCallback(async (next: PiezaHallazgo[]) => {
    if (!odontograma) return;
    setGuardando(true);
    try {
      await odo.guardarPiezas(odontograma.id, next);
    } catch {
      notify('Error al guardar hallazgos', 'err');
    } finally {
      setGuardando(false);
    }
  }, [odontograma?.id]);

  useEffect(() => {
    if (!dirtyRef.current) return;
    const t = setTimeout(() => { persistPiezas(piezas); dirtyRef.current = false; }, 1200);
    return () => clearTimeout(t);
  }, [piezas, persistPiezas]);

  const aplicar = (diente: number, superficie: string | null) => {
    dirtyRef.current = true;
    setPiezas((prev) => {
      const idx = prev.findIndex((p) => p.diente === diente && (p.superficie || null) === (superficie || null));
      if (erase) {
        if (idx >= 0) { const c = [...prev]; c.splice(idx, 1); return c; }
        return prev;
      }
      if (!brush) return prev;
      // toggle: si ya tiene el mismo hallazgo, quitar
      if (idx >= 0 && prev[idx].hallazgoId === brush.id) {
        const c = [...prev]; c.splice(idx, 1); return c;
      }
      const estadoObj = catalogos.estados.find((e) => e.id === estadoBrush);
      const nueva: PiezaHallazgo = {
        diente, superficie: superficie || null, hallazgoId: brush.id,
        estadoId: estadoBrush || null,
        hallazgo: { id: brush.id, codigo: brush.codigo, nombre: brush.nombre, color: brush.color, categoria: brush.categoria },
        estado: estadoObj ? { id: estadoObj.id, codigo: estadoObj.codigo, nombre: estadoObj.nombre, color: estadoObj.color } : null,
      };
      if (idx >= 0) { const c = [...prev]; c[idx] = nueva; return c; }
      return [...prev, nueva];
    });
  };

  const guardarGenerales = async () => {
    if (!odontograma) return;
    await odo.updateOdontograma(odontograma.id, { hallazgosGenerales: generales, estetica, riesgoId: riesgoId || null, resumenIA, denticion });
    notify('Información clínica guardada');
    onRefresh();
  };

  // Inteligencia clínica: resumen automático editable a partir de hallazgos/riesgo/severidad
  const sugerirResumen = () => {
    const conHallazgo = piezas.filter((p) => p.hallazgo?.codigo && p.hallazgo.codigo !== 'SANO');
    const dientesAfectados = [...new Set(conHallazgo.map((p) => p.diente))];
    const conteo: Record<string, number> = {};
    for (const p of conHallazgo) {
      const n = p.hallazgo?.nombre || 'hallazgo';
      conteo[n] = (conteo[n] || 0) + 1;
    }
    const lista = Object.entries(conteo).map(([n, c]) => `${c} ${n.toLowerCase()}`);
    const riesgo = catalogos.riesgos.find((r) => r.id === riesgoId)?.nombre;
    const partes: string[] = [];
    if (dientesAfectados.length) {
      partes.push(`Paciente presenta ${lista.join(', ')} en ${dientesAfectados.length} pieza(s) (${dientesAfectados.sort((a, b) => a - b).join(', ')}).`);
    } else {
      partes.push('Paciente sin hallazgos patológicos registrados en el odontograma.');
    }
    if (generales.higiene) partes.push(`Higiene oral ${String(generales.higiene).toLowerCase()}.`);
    if (generales.periodontal) partes.push(`Estado periodontal: ${String(generales.periodontal).toLowerCase()}.`);
    if (generales.oclusion) partes.push(`Oclusión ${String(generales.oclusion).toLowerCase()}.`);
    if (estetica.colorDental) partes.push(`Color dental inicial ${estetica.colorDental}.`);
    if (riesgo) partes.push(`Riesgo clínico: ${riesgo.toLowerCase()}.`);
    setResumenIA(partes.join(' '));
    notify('Resumen sugerido generado · edítalo si es necesario');
  };

  const generarPlan = async () => {
    if (!odontograma) return;
    setGenerando(true);
    try {
      if (dirtyRef.current) { await persistPiezas(piezas); dirtyRef.current = false; }
      const r = await odo.generarPlan(odontograma.id);
      notify(`Plan generado: ${r.creados} procedimiento(s)`);
      onRefresh();
    } catch {
      notify('Error al generar el plan', 'err');
    } finally {
      setGenerando(false);
    }
  };

  if (!odontograma) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-[#0d0f14] border border-white/10">
        <Stethoscope size={48} className="text-yellow-500/40 mb-4" />
        <p className="text-gray-400 mb-6">Este paciente aún no tiene una valoración odontológica de primera vez.</p>
        <button onClick={onCreate}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-yellow-500/20 transition-all">
          <Plus size={18} /> Nueva valoración
        </button>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-5">
      {/* Columna principal: odontograma */}
      <div className="space-y-4">
        {/* Paleta de hallazgos */}
        <div className="p-4 rounded-2xl bg-[#0d0f14] border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 tracking-widest">HALLAZGOS</p>
            <div className="flex items-center gap-2">
              <select value={denticion} onChange={(e) => setDenticion(e.target.value)}
                className="text-xs bg-[#11141b] border border-white/10 rounded-lg px-2 py-1 text-gray-300">
                <option value="PERMANENTE">Permanente</option>
                <option value="TEMPORAL">Temporal</option>
                <option value="MIXTA">Mixta</option>
              </select>
              <span className={`text-[11px] flex items-center gap-1 ${guardando ? 'text-yellow-400' : 'text-emerald-400'}`}>
                {guardando ? <><Clock size={12} /> Guardando…</> : <><CheckCircle2 size={12} /> Guardado</>}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {catalogos.hallazgos.map((h) => (
              <button key={h.id} onClick={() => { setBrush(h); setErase(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  brush?.id === h.id && !erase ? 'border-white/40 scale-105' : 'border-white/10 hover:border-white/25'
                }`}
                style={{ background: `${h.color}1f`, color: h.color }}>
                <span className="w-3 h-3 rounded-full" style={{ background: h.color }} />
                {h.nombre}
              </button>
            ))}
            <button onClick={() => { setErase(true); setBrush(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                erase ? 'border-white/40 bg-white/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/25'
              }`}>
              <Eraser size={14} /> Borrar
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[11px] text-gray-500">Estado clínico:</span>
            <select value={estadoBrush} onChange={(e) => setEstadoBrush(e.target.value)}
              className="text-xs bg-[#11141b] border border-white/10 rounded-lg px-2 py-1 text-gray-300">
              <option value="">— (opcional)</option>
              {catalogos.estados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
            <span className="text-[11px] text-gray-600 ml-auto">Selecciona un hallazgo y haz clic en la superficie del diente</span>
          </div>
        </div>

        {/* Odontograma */}
        <OdontogramaInteractivo piezas={piezas} onSurface={aplicar} denticion={denticion} />

        {/* Leyenda superficies */}
        <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 px-2">
          {SUPERFICIES.map((s) => <span key={s.code}><b className="text-gray-400">{s.code}</b> {s.label}</span>)}
        </div>

        {/* Plan generado */}
        <PlanLista odontograma={odontograma} catalogos={catalogos} onRefresh={onRefresh} notify={notify} modo="plan" />
      </div>

      {/* Columna lateral: hallazgos generales + IA */}
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-[#0d0f14] border border-white/10 space-y-3">
          <p className="text-xs font-bold text-gray-400 tracking-widest">HALLAZGOS GENERALES</p>
          <Campo label="Higiene oral" value={generales.higiene || ''} onChange={(v) => setGenerales({ ...generales, higiene: v })}
            opciones={['Excelente', 'Buena', 'Regular', 'Deficiente']} />
          <Campo label="Estado periodontal" value={generales.periodontal || ''} onChange={(v) => setGenerales({ ...generales, periodontal: v })}
            opciones={['Sano', 'Gingivitis', 'Periodontitis leve', 'Periodontitis moderada', 'Periodontitis severa']} />
          <Campo label="Oclusión" value={generales.oclusion || ''} onChange={(v) => setGenerales({ ...generales, oclusion: v })}
            opciones={['Normal', 'Clase I', 'Clase II', 'Clase III', 'Mordida abierta', 'Mordida cruzada']} />
          <Campo label="ATM" value={generales.atm || ''} onChange={(v) => setGenerales({ ...generales, atm: v })}
            opciones={['Normal', 'Chasquido', 'Dolor', 'Limitación apertura']} />
          <div>
            <label className="text-[11px] text-gray-500">Riesgo clínico</label>
            <select value={riesgoId} onChange={(e) => setRiesgoId(e.target.value)}
              className="w-full mt-1 text-sm bg-[#11141b] border border-white/10 rounded-xl px-3 py-2 text-gray-200">
              <option value="">— Sin definir</option>
              {catalogos.riesgos.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-gray-500">Observaciones</label>
            <textarea value={generales.observaciones || ''} onChange={(e) => setGenerales({ ...generales, observaciones: e.target.value })}
              rows={3} className="w-full mt-1 text-sm bg-[#11141b] border border-white/10 rounded-xl px-3 py-2 text-gray-200 resize-none" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0d0f14] border border-white/10 space-y-2">
          <p className="text-xs font-bold text-gray-400 tracking-widest flex items-center gap-1.5">
            <Sparkles size={13} className="text-pink-400" /> ODONTOLOGÍA ESTÉTICA
          </p>
          <div>
            <label className="text-[11px] text-gray-500">Color dental inicial (escala VITA)</label>
            <input value={estetica.colorDental || ''} onChange={(e) => setEstetica({ ...estetica, colorDental: e.target.value })}
              placeholder="A1, A2, B1, C2…"
              className="w-full mt-1 text-sm bg-[#11141b] border border-white/10 rounded-xl px-3 py-2 text-gray-200" />
          </div>
          <Campo label="Pigmentaciones" value={estetica.pigmentaciones || ''} onChange={(v) => setEstetica({ ...estetica, pigmentaciones: v })}
            opciones={['Ninguna', 'Leve', 'Moderada', 'Severa']} />
          <Campo label="Diastemas" value={estetica.diastemas || ''} onChange={(v) => setEstetica({ ...estetica, diastemas: v })}
            opciones={['No', 'Sí - anterior', 'Sí - múltiples']} />
          <Campo label="Alteraciones de forma" value={estetica.forma || ''} onChange={(v) => setEstetica({ ...estetica, forma: v })}
            opciones={['Normal', 'Leve', 'Moderada', 'Severa']} />
          <Campo label="Alteraciones de tamaño" value={estetica.tamano || ''} onChange={(v) => setEstetica({ ...estetica, tamano: v })}
            opciones={['Normal', 'Microdoncia', 'Macrodoncia']} />
          <Campo label="Sonrisa gingival" value={estetica.sonrisaGingival || ''} onChange={(v) => setEstetica({ ...estetica, sonrisaGingival: v })}
            opciones={['No', 'Leve', 'Moderada', 'Severa']} />
          <Campo label="Asimetrías" value={estetica.asimetrias || ''} onChange={(v) => setEstetica({ ...estetica, asimetrias: v })}
            opciones={['No', 'Dental', 'Gingival', 'Facial']} />
          <Campo label="Restauraciones antiestéticas" value={estetica.restauracionesAntiesteticas || ''} onChange={(v) => setEstetica({ ...estetica, restauracionesAntiesteticas: v })}
            opciones={['No', 'Sí - anteriores', 'Sí - posteriores']} />
          <Campo label="Desgaste estético" value={estetica.desgasteEstetico || ''} onChange={(v) => setEstetica({ ...estetica, desgasteEstetico: v })}
            opciones={['No', 'Leve', 'Moderado', 'Severo']} />
          <div>
            <label className="text-[11px] text-gray-500">Alteraciones de sonrisa / observaciones estéticas</label>
            <textarea value={estetica.observaciones || ''} onChange={(e) => setEstetica({ ...estetica, observaciones: e.target.value })}
              rows={3} className="w-full mt-1 text-sm bg-[#11141b] border border-white/10 rounded-xl px-3 py-2 text-gray-200 resize-none" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0d0f14] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 tracking-widest flex items-center gap-1.5">
              <Sparkles size={13} className="text-yellow-400" /> RESUMEN CLÍNICO
            </p>
            <button onClick={sugerirResumen}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/20 flex items-center gap-1">
              <Sparkles size={11} /> Sugerir
            </button>
          </div>
          <textarea value={resumenIA} onChange={(e) => setResumenIA(e.target.value)} rows={4}
            placeholder="Resumen de la valoración…"
            className="w-full text-sm bg-[#11141b] border border-white/10 rounded-xl px-3 py-2 text-gray-200 resize-none" />
        </div>

        <button onClick={guardarGenerales}
          className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-200 font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
          <Save size={16} /> Guardar información clínica
        </button>
        <button
          onClick={() => printInNewWindow(buildOdontogramaHtml({
            paciente, odontograma, piezas, generales, estetica,
            riesgoId, resumenIA, denticion, catalogos, tipo: 'PRIMERA_VEZ',
          }))}
          className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-200 font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
          <Printer size={16} /> Imprimir Odontograma
        </button>
        <button onClick={generarPlan} disabled={generando}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-yellow-500/20 transition-all disabled:opacity-60">
          <ClipboardList size={16} /> {generando ? 'Generando…' : 'Generar plan de tratamiento'}
        </button>
      </div>
    </div>
  );
}

function Campo({ label, value, onChange, opciones }: { label: string; value: string; onChange: (v: string) => void; opciones: string[] }) {
  return (
    <div>
      <label className="text-[11px] text-gray-500">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 text-sm bg-[#11141b] border border-white/10 rounded-xl px-3 py-2 text-gray-200">
        <option value="">— Sin definir</option>
        {opciones.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  LISTA DE PLAN / TRATAMIENTO
// ════════════════════════════════════════════════════════════════
function PlanLista({
  odontograma, catalogos, onRefresh, notify, modo,
}: {
  odontograma: Odontograma;
  catalogos: OdontoCatalogos;
  onRefresh: () => Promise<void>;
  notify: (m: string, t?: 'ok' | 'err') => void;
  modo: 'plan' | 'tratamiento';
}) {
  const items = odontograma.planItems || [];
  const [showAdd, setShowAdd] = useState(false);

  const total = items.reduce((s, i) => s + (i.precio || 0), 0);
  const facturado = items.filter((i) => i.facturado).reduce((s, i) => s + (i.precio || 0), 0);

  const cambiarEstado = async (item: PlanItem, estado: EstadoTratamiento) => {
    try {
      const r = await odo.cambiarEstadoTratamiento(odontograma.id, item.id, estado);
      if (r.facturacion) notify(`Procedimiento facturado: ${fmtCOP(r.facturacion.valor)}`);
      else notify(`Estado → ${ESTADO_META[estado]?.label || estado}`);
      onRefresh();
    } catch (e: any) {
      notify(e.message || 'Error al cambiar estado', 'err');
    }
  };

  const eliminar = async (item: PlanItem) => {
    try { await odo.deletePlanItem(odontograma.id, item.id); notify('Ítem eliminado'); onRefresh(); }
    catch (e: any) { notify(e.message || 'Error al eliminar', 'err'); }
  };

  return (
    <div className="p-4 rounded-2xl bg-[#0d0f14] border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-gray-400 tracking-widest flex items-center gap-1.5">
          <ClipboardList size={14} /> PLAN DE TRATAMIENTO ({items.length})
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Total: <b className="text-yellow-400">{fmtCOP(total)}</b></span>
          {facturado > 0 && <span className="text-xs text-gray-400">Facturado: <b className="text-purple-400">{fmtCOP(facturado)}</b></span>}
          <button onClick={() => setShowAdd(true)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 text-xs font-semibold flex items-center gap-1 hover:bg-white/10">
            <Plus size={13} /> Agregar
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-6">Sin procedimientos. Genera el plan desde los hallazgos o agrega manualmente.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const meta = ESTADO_META[item.estadoTratamiento] || ESTADO_META.PLANEADO;
            const Icon = meta.icon;
            return (
              <div key={item.id} className="p-3 rounded-xl bg-[#11141b] border border-white/5 hover:border-white/15 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.diente && <span className="px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 text-[10px] font-bold">Diente {item.diente}{item.superficie ? ` · ${item.superficie}` : ''}</span>}
                      {item.prioridad && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: `${item.prioridad.color}22`, color: item.prioridad.color }}>{item.prioridad.nombre}</span>}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1" style={{ background: `${meta.color}22`, color: meta.color }}>
                        <Icon size={11} /> {meta.label}
                      </span>
                      {item.facturado && <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 text-[10px] font-bold flex items-center gap-1"><DollarSign size={10} /> Facturado</span>}
                    </div>
                    <p className="text-white text-sm font-semibold mt-1">{item.diagnostico}</p>
                    <p className="text-gray-500 text-xs">{item.descripcionProcedimiento}{item.codigoCups ? ` · CUPS ${item.codigoCups}` : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-yellow-400 font-bold text-sm">{fmtCOP(item.precio)}</p>
                    {!item.facturado && (
                      <button onClick={() => eliminar(item)} className="text-gray-600 hover:text-red-400 mt-1"><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
                {/* Acciones de flujo de estado */}
                {modo === 'tratamiento' && (
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/5">
                    {ESTADO_FLOW.map((s) => (
                      <button key={s.code} onClick={() => cambiarEstado(item, s.code)}
                        disabled={item.estadoTratamiento === s.code || (item.facturado && s.code !== 'FINALIZADO')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                          item.estadoTratamiento === s.code ? 'border-white/30' : 'border-white/10 hover:border-white/25 opacity-80 hover:opacity-100'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                        style={{ color: s.color, background: item.estadoTratamiento === s.code ? `${s.color}22` : 'transparent' }}>
                        {s.label}
                      </button>
                    ))}
                    <button onClick={() => cambiarEstado(item, 'SUSPENDIDO')}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold border border-white/10 text-orange-400 hover:border-orange-400/40">Suspender</button>
                    <button onClick={() => cambiarEstado(item, 'CANCELADO')}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold border border-white/10 text-red-400 hover:border-red-400/40">Cancelar</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddPlanItemModal odontograma={odontograma} catalogos={catalogos} onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); onRefresh(); }} notify={notify} />
      )}
    </div>
  );
}

function AddPlanItemModal({
  odontograma, catalogos, onClose, onSaved, notify,
}: {
  odontograma: Odontograma;
  catalogos: OdontoCatalogos;
  onClose: () => void;
  onSaved: () => void;
  notify: (m: string, t?: 'ok' | 'err') => void;
}) {
  const [diagnostico, setDiagnostico] = useState('');
  const [diente, setDiente] = useState('');
  const [prioridadId, setPrioridadId] = useState('');
  const [cargoQuery, setCargoQuery] = useState('');
  const [cargos, setCargos] = useState<odo.CargoBusqueda[]>([]);
  const [cargoSel, setCargoSel] = useState<odo.CargoBusqueda | null>(null);
  const [precio, setPrecio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!cargoQuery.trim() || cargoSel) { setCargos([]); return; }
    const t = setTimeout(async () => {
      try { setCargos(await odo.buscarCargos(cargoQuery.trim())); } catch { /* */ }
    }, 300);
    return () => clearTimeout(t);
  }, [cargoQuery, cargoSel]);

  const guardar = async () => {
    if (!diagnostico.trim()) { notify('El diagnóstico es requerido', 'err'); return; }
    setSaving(true);
    try {
      await odo.addPlanItem(odontograma.id, {
        diagnostico: diagnostico.trim(),
        diente: diente ? Number(diente) : null,
        prioridadId: prioridadId || null,
        cargoId: cargoSel?.id || null,
        descripcionProcedimiento: cargoSel?.descripcion || diagnostico.trim(),
        precio: precio ? Number(precio) : (cargoSel?.precioSugerido ?? 0),
      } as any);
      notify('Procedimiento agregado');
      onSaved();
    } catch (e: any) {
      notify(e.message || 'Error al agregar', 'err');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-[#0d0f14] border border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Agregar procedimiento</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <div>
          <label className="text-[11px] text-gray-500">Diagnóstico *</label>
          <input value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)}
            className="w-full mt-1 text-sm bg-[#11141b] border border-white/10 rounded-xl px-3 py-2 text-gray-200" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-gray-500">Diente (FDI)</label>
            <input value={diente} onChange={(e) => setDiente(e.target.value)} inputMode="numeric"
              className="w-full mt-1 text-sm bg-[#11141b] border border-white/10 rounded-xl px-3 py-2 text-gray-200" />
          </div>
          <div>
            <label className="text-[11px] text-gray-500">Prioridad</label>
            <select value={prioridadId} onChange={(e) => setPrioridadId(e.target.value)}
              className="w-full mt-1 text-sm bg-[#11141b] border border-white/10 rounded-xl px-3 py-2 text-gray-200">
              <option value="">—</option>
              {catalogos.prioridades.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="relative">
          <label className="text-[11px] text-gray-500">Procedimiento (CUPS facturable)</label>
          {cargoSel ? (
            <div className="flex items-center justify-between mt-1 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <span className="text-sm text-yellow-300">{cargoSel.codigo} · {cargoSel.descripcion}</span>
              <button onClick={() => { setCargoSel(null); setPrecio(''); }} className="text-gray-400 hover:text-red-400"><X size={16} /></button>
            </div>
          ) : (
            <input value={cargoQuery} onChange={(e) => setCargoQuery(e.target.value)} placeholder="Buscar procedimiento…"
              className="w-full mt-1 text-sm bg-[#11141b] border border-white/10 rounded-xl px-3 py-2 text-gray-200" />
          )}
          {cargos.length > 0 && !cargoSel && (
            <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-xl bg-[#11141b] border border-white/10 shadow-xl">
              {cargos.map((c) => (
                <button key={c.id} onClick={() => { setCargoSel(c); setPrecio(String(c.precioSugerido || 0)); setCargos([]); }}
                  className="w-full text-left px-3 py-2 hover:bg-yellow-500/10 border-b border-white/5 last:border-0">
                  <p className="text-sm text-white">{c.descripcion}</p>
                  <p className="text-[11px] text-gray-500">{c.codigo} · {fmtCOP(c.precioSugerido)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="text-[11px] text-gray-500">Precio (COP)</label>
          <input value={precio} onChange={(e) => setPrecio(e.target.value)} inputMode="numeric"
            className="w-full mt-1 text-sm bg-[#11141b] border border-white/10 rounded-xl px-3 py-2 text-gray-200" />
        </div>
        <button onClick={guardar} disabled={saving}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 font-bold disabled:opacity-60">
          {saving ? 'Guardando…' : 'Agregar al plan'}
        </button>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  PESTAÑA · TRATAMIENTO
// ════════════════════════════════════════════════════════════════
function Tratamiento({
  odontograma, odontogramasTrat, catalogos, onRefresh, notify,
}: {
  odontograma: Odontograma | null;
  odontogramasTrat: Odontograma[];
  catalogos: OdontoCatalogos;
  onRefresh: () => Promise<void>;
  notify: (m: string, t?: 'ok' | 'err') => void;
}) {
  const [timeline, setTimeline] = useState<Evolucion[]>([]);

  useEffect(() => {
    if (odontograma) odo.getTimeline(odontograma.id).then(setTimeline).catch(() => {});
  }, [odontograma?.id, odontograma?.planItems]);

  if (!odontograma) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-[#0d0f14] border border-white/10">
        <Activity size={48} className="text-yellow-500/40 mb-4" />
        <p className="text-gray-400">Primero crea una valoración de primera vez y genera el plan de tratamiento.</p>
      </div>
    );
  }

  const items = odontograma.planItems || [];
  const piezas = odontograma.piezas || [];

  // Comparativo clínico: estado actual = piezas iniciales + procedimientos finalizados marcados como tratados
  const tratadoEstado = catalogos.estados.find((e) => e.codigo === 'TRATADO' || e.codigo === 'FINALIZADO');
  const piezasActual: PiezaHallazgo[] = (() => {
    const base = piezas.map((p) => ({ ...p }));
    for (const it of items) {
      if (it.estadoTratamiento !== 'FINALIZADO' || !it.diente) continue;
      const idx = base.findIndex((p) => p.diente === it.diente && (p.superficie || null) === (it.superficie || null));
      const tratada: PiezaHallazgo = {
        diente: it.diente,
        superficie: it.superficie || null,
        hallazgoId: it.hallazgoId || '',
        estadoId: tratadoEstado?.id || null,
        colorOverride: '#3b82f6',
        hallazgo: { id: it.hallazgoId || '', codigo: 'TRATADO', nombre: it.descripcionProcedimiento || 'Tratado', color: '#3b82f6', categoria: 'RESTAURACION' },
        estado: tratadoEstado ? { id: tratadoEstado.id, codigo: tratadoEstado.codigo, nombre: tratadoEstado.nombre, color: tratadoEstado.color } : null,
      };
      if (idx >= 0) base[idx] = tratada; else base.push(tratada);
    }
    return base;
  })();

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-5">
      <div className="space-y-4">
        {/* Comparativo clínico: Estado Inicial vs Estado Actual */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-2xl bg-[#0d0f14] border border-white/10">
            <p className="text-xs font-bold text-gray-400 tracking-widest mb-2 flex items-center gap-1.5">
              <Stethoscope size={13} className="text-yellow-400" /> ESTADO INICIAL
            </p>
            <OdontogramaInteractivo piezas={piezas} onSurface={() => {}} denticion={odontograma.denticion} readOnly />
          </div>
          <div className="p-3 rounded-2xl bg-[#0d0f14] border border-emerald-500/20">
            <p className="text-xs font-bold text-gray-400 tracking-widest mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" /> ESTADO ACTUAL
            </p>
            <OdontogramaInteractivo piezas={piezasActual} onSurface={() => {}} denticion={odontograma.denticion} readOnly />
          </div>
        </div>

        {/* Seguimiento de procedimientos */}
        <PlanLista odontograma={odontograma} catalogos={catalogos} onRefresh={onRefresh} notify={notify} modo="tratamiento" />
      </div>

      {/* Línea de tiempo */}
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-[#0d0f14] border border-white/10">
          <p className="text-xs font-bold text-gray-400 tracking-widest mb-3 flex items-center gap-1.5">
            <Clock size={14} /> LÍNEA DE TIEMPO
          </p>
          {timeline.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6">Sin evoluciones registradas.</p>
          ) : (
            <div className="space-y-3">
              {timeline.map((ev) => (
                <div key={ev.id} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="absolute left-[3.5px] top-3.5 bottom-0 w-px bg-white/10" />
                  <p className="text-[11px] text-gray-500">{new Date(ev.fecha).toLocaleString('es-CO')}</p>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-gray-400 font-bold my-0.5">{ev.tipo}</span>
                  <p className="text-sm text-gray-200">{ev.descripcion}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progreso */}
        <div className="p-4 rounded-2xl bg-[#0d0f14] border border-white/10">
          <p className="text-xs font-bold text-gray-400 tracking-widest mb-3">PROGRESO</p>
          {(() => {
            const fin = items.filter((i) => i.estadoTratamiento === 'FINALIZADO').length;
            const pct = items.length ? Math.round((fin / items.length) * 100) : 0;
            return (
              <>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">{fin} de {items.length} finalizados</span>
                  <span className="text-emerald-400 font-bold">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
