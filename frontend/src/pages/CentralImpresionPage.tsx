/**
 * CentralImpresionPage.tsx
 * Búsqueda de paciente → historial HC → Imprimir HC o Imprimir Órdenes
 * La impresión abre una nueva ventana con HTML limpio
 */
import { useState } from 'react';
import { Search, Printer, FileText, ClipboardList, User, Loader2, AlertCircle } from 'lucide-react';
import { searchPacientes, getHistoriasPaciente, getHistoriaClinica } from '../services/api';
import { API_BASE_URL } from '../config';

// ─────────────────────────────────────────────────────────
// Generador HTML para Historia Clínica (secciones 1-11)
// ─────────────────────────────────────────────────────────
const PRINT_CSS = `
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 0; }
  h1 { font-size: 15px; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 6px; margin-bottom: 10px; }
  h2 { font-size: 11px; font-weight: bold; background: #f0f0f0; padding: 3px 8px; border-left: 3px solid #555; margin: 12px 0 5px; page-break-after: avoid; }
  .hdr { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; background: #f8f8f8; border: 1px solid #ddd; padding: 7px 10px; border-radius: 3px; margin-bottom: 12px; }
  .g2  { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
  .g3  { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; }
  .f   { margin-bottom: 3px; }
  .lbl { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #666; letter-spacing: .5px; }
  .val { border-bottom: 1px solid #bbb; min-height: 14px; padding: 1px 0; white-space: pre-wrap; }
  .sec { margin-bottom: 6px; page-break-inside: avoid; }
  table { width:100%; border-collapse:collapse; margin-top:3px; }
  th { background:#eee; padding:3px 5px; text-align:left; border:1px solid #ccc; font-size:10px; }
  td { padding:3px 5px; border:1px solid #ddd; font-size:10px; }
  .firma { margin-top:28px; display:grid; grid-template-columns:1fr 1fr; gap:40px; }
  .firma-box { border-top:1px solid #333; padding-top:3px; text-align:center; font-size:9px; }
  @page { margin:12mm 15mm; size:A4; }
`;

const fld = (label: string, value: unknown) => {
  const v = value === true ? 'Sí' : value === false ? 'No' : String(value ?? '');
  return `<div class="f"><div class="lbl">${label}</div><div class="val">${v || '&nbsp;'}</div></div>`;
};
const sec = (title: string, body: string) =>
  `<div class="sec"><h2>${title}</h2>${body}</div>`;

function buildHCHtml(h: any): string {
  const raw = h.datosExtendidos || h.contenido || {};
  const ext = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const sv   = ext.signosVitales || {};
  const antP = ext.antecedentesPersonales || {};
  const antF = ext.antecedentesFamiliares || {};
  const gin  = ext.antecedentesGineco || {};
  const evCx = ext.evolucionCx || {};
  const diag = ext.diagnostico || {};
  const plan = ext.planTerapeutico || {};

  const finalidadMap: Record<string, string> = {
    P:'Promoción y Mantenimiento', V:'Prevención', D:'Diagnóstico',
    T:'Tratamiento', R:'Rehabilitación', C:'Cuidado Paliativo', E:'Educación', I:'Investigación',
  };
  const origenMap: Record<string, string> = {
    CE:'Consulta Externa', UR:'Urgencias', HO:'Hospitalización', RE:'Remisión', PA:'Particular', TM:'Telemedicina',
  };

  const paciente = h.paciente?.nombreCompleto || h.pacienteNombre || '';
  const doc      = h.paciente?.numeroDocumento ? `${h.paciente.tipoDocumento} ${h.paciente.numeroDocumento}` : '';
  const fecha    = h.fechaCreacion || h.createdAt || '';
  const fechaStr = fecha ? new Date(fecha).toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' }) : '';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Historia Clínica — ${paciente}</title>
<style>${PRINT_CSS}</style></head><body>
<h1>Historia Clínica</h1>
<div class="hdr">
  ${fld('Paciente', paciente)}
  ${fld('Documento', doc)}
  ${fld('Fecha', fechaStr)}
  ${fld('Tipo Consulta', h.tipoConsulta)}
  ${fld('Tipo Historia', h.tipoHistoria)}
  ${fld('Finalidad', finalidadMap[ext.finalidadAtencion] || ext.finalidadAtencion || '')}
  ${fld('Origen', origenMap[ext.origenAtencion] || ext.origenAtencion || '')}
</div>

${sec('1. Motivo de Consulta', `
  <div class="g2">
    ${fld('Motivo / Queja Principal', h.quejaPrincipal)}
    ${fld('Historia de la Enfermedad Actual', h.historiaEnfermedad)}
  </div>`)}

${sec('2. Signos Vitales', `
  <div class="g3">
    ${fld('Peso (kg)', sv.peso)} ${fld('Talla (cm)', sv.talla)} ${fld('IMC', sv.imc)}
    ${fld('Temperatura °C', sv.temperatura)} ${fld('FC (lpm)', sv.frecuenciaCardiaca)} ${fld('FR (rpm)', sv.frecuenciaRespiratoria)}
    ${fld('TA Sistólica (mmHg)', sv.taSistolica)} ${fld('TA Diastólica (mmHg)', sv.taDiastolica)} ${fld('SatO₂ (%)', sv.saturacionO2)}
  </div>`)}

${sec('3. Antecedentes Personales', `
  <div class="g2">
    ${fld('Patológicos', antP.patologicos)} ${fld('Farmacológicos', antP.farmacologicos)}
    ${fld('Quirúrgicos', antP.quirurgicos)} ${fld('Alérgicos', antP.alergicos)}
    ${fld('Tóxicos', antP.toxicos)} ${fld('Hospitalarios', antP.hospitalarios)}
  </div>`)}

${sec('4. Antecedentes Familiares', `
  <div class="g2">
    ${fld('HTA', antF.hta)} ${fld('Diabetes', antF.diabetes)}
    ${fld('Cáncer', antF.cancer)} ${fld('Cardiopatías', antF.cardiopatias)}
    ${fld('Otros', antF.otros)}
  </div>`)}

${sec('5. Antecedentes Gineco-Obstétricos', `
  <div class="g3">
    ${fld('FUM', gin.fum)} ${fld('Gestaciones (G)', gin.gestaciones)} ${fld('Partos (P)', gin.partos)}
    ${fld('Cesáreas (C)', gin.cesareas)} ${fld('Abortos (A)', gin.abortos)} ${fld('Planificación', gin.planificacion)}
    ${fld('Menopausia', gin.menopausia)}
  </div>`)}

${sec('6. Evolución Cirugía Plástica y Estética', `
  ${fld('Procedimiento Realizado', evCx.procedimientoRealizado)}
  <div class="g2">
    ${fld('Evolución', evCx.evolucion)} ${fld('Complicaciones', evCx.complicaciones)}
    ${fld('Recomendaciones Quirúrgicas', evCx.recomendaciones)} ${fld('Evolución Postoperatoria', evCx.evolucionPostop)}
  </div>`)}

${sec('9. Impresión Diagnóstica', `
  <div class="g2">
    ${fld('Diagnóstico Principal', diag.principal || h.diagnostico)} ${fld('Código CIE-10', diag.codigoCie10)}
    ${fld('Diagnósticos Relacionados', diag.relacionados)} ${fld('Tipo de Diagnóstico', diag.tipo)}
  </div>`)}

${sec('10. Plan Terapéutico', `
  ${fld('Conducta / Manejo', plan.conducta || h.tratamientoRecomendado)}
  <div class="g2">
    ${fld('Incapacidad (días)', plan.incapacidadDias)} ${fld('Procedimientos', plan.procedimientos)}
    ${fld('Seguimiento', plan.seguimiento)}
  </div>`)}

${sec('11. Recomendaciones Médicas', fld('Recomendaciones al Paciente', ext.recomendaciones))}

<div class="firma">
  <div class="firma-box">Firma del Médico</div>
  <div class="firma-box">Firma del Paciente / Acompañante</div>
</div>
<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),1200);}</script>
</body></html>`;
}

// ─────────────────────────────────────────────────────────
// Generador HTML para Órdenes Médicas (secciones 12-15)
// ─────────────────────────────────────────────────────────
function buildOrdenesHtml(h: any): string {
  const raw     = h.datosExtendidos || h.contenido || {};
  const ext     = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const ordenes = ext.ordenesMedicas || {};
  const apoyos  = ordenes.apoyosDiagnosticos || [];
  const procQx  = ordenes.procedimientosQx   || [];
  const meds    = ordenes.medicamentos        || [];
  const interc  = ordenes.interconsultas      || [];
  const paciente = h.paciente?.nombreCompleto || '';
  const doc      = h.paciente?.numeroDocumento ? `${h.paciente.tipoDocumento} ${h.paciente.numeroDocumento}` : '';
  const fecha    = h.fechaCreacion || h.createdAt || '';
  const fechaStr = fecha ? new Date(fecha).toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' }) : '';

  const noOrdenes = apoyos.length + procQx.length + meds.length + interc.length === 0;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Órdenes Médicas — ${paciente}</title>
<style>${PRINT_CSS}</style></head><body>
<h1>Órdenes Médicas</h1>
<div class="hdr">
  ${fld('Paciente', paciente)}
  ${fld('Documento', doc)}
  ${fld('Fecha', fechaStr)}
  ${fld('Tipo Consulta', h.tipoConsulta)}
</div>

${noOrdenes ? '<p style="color:#666;font-style:italic;padding:12px 0;">No se registraron órdenes médicas en esta historia clínica.</p>' : ''}

${apoyos.length > 0 ? sec('Solicitud Apoyos Diagnósticos', `
  <table>
    <thead><tr><th>Tipo</th><th>Descripción</th><th>Urgente</th></tr></thead>
    <tbody>${apoyos.map((x: any) => `<tr><td>${x.tipo||''}</td><td>${x.descripcion||''}</td><td>${x.urgente?'Sí':'No'}</td></tr>`).join('')}</tbody>
  </table>`) : ''}

${procQx.length > 0 ? sec('Solicitud Procedimientos Quirúrgicos', `
  <table>
    <thead><tr><th>Cód. CUPS</th><th>Nombre</th><th>Prioridad</th><th>Anestesia</th><th>Observaciones</th></tr></thead>
    <tbody>${procQx.map((x: any) => `<tr><td>${x.codigoCups||''}</td><td>${x.nombre||''}</td><td>${x.prioridad||''}</td><td>${x.anestesia||''}</td><td>${x.observaciones||''}</td></tr>`).join('')}</tbody>
  </table>`) : ''}

${meds.length > 0 ? sec('Formulación de Medicamentos', `
  <table>
    <thead><tr><th>Medicamento</th><th>Dosis</th><th>Frecuencia</th><th>Duración</th><th>Vía</th><th>Observaciones</th></tr></thead>
    <tbody>${meds.map((x: any) => `<tr><td>${x.nombre||''}</td><td>${x.dosis||''}</td><td>${x.frecuencia||''}</td><td>${x.duracion||''}</td><td>${x.via||''}</td><td>${x.observaciones||''}</td></tr>`).join('')}</tbody>
  </table>`) : ''}

${interc.length > 0 ? sec('Solicitud de Interconsulta', `
  <table>
    <thead><tr><th>Especialidad Destino</th><th>Prioridad</th><th>Motivo</th><th>Observaciones</th></tr></thead>
    <tbody>${interc.map((x: any) => `<tr><td>${x.especialidad||''}</td><td>${x.prioridad||''}</td><td>${x.motivo||''}</td><td>${x.observaciones||''}</td></tr>`).join('')}</tbody>
  </table>`) : ''}

<div style="margin-top:28px;border-top:1px solid #333;padding-top:3px;text-align:center;font-size:9px;width:38%;margin-left:auto;margin-right:0;">
  Firma del Médico
</div>
<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),1200);}</script>
</body></html>`;
}

// ─────────────────────────────────────────────────────────
// Abrir nueva ventana y disparar print
// ─────────────────────────────────────────────────────────
function printInNewWindow(html: string) {
  const w = window.open('', '_blank');
  if (!w) { alert('Permita ventanas emergentes en su navegador para imprimir.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

// ─────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────
export default function CentralImpresionPage() {
  const token = localStorage.getItem('accessToken') || '';

  const [query,             setQuery]            = useState('');
  const [pacientes,         setPacientes]         = useState<any[]>([]);
  const [buscando,          setBuscando]          = useState(false);
  const [selectedPaciente,  setSelectedPaciente]  = useState<any>(null);
  const [historias,         setHistorias]         = useState<any[]>([]);
  const [loadingH,          setLoadingH]          = useState(false);
  const [printing,          setPrinting]          = useState<string | null>(null);
  const [errorMsg,          setErrorMsg]          = useState('');

  // ── Buscar pacientes ──
  const buscar = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setBuscando(true);
    setErrorMsg('');
    const r = await searchPacientes(q, token);
    if (r.data) {
      const lista = Array.isArray(r.data) ? r.data : (r.data as any).pacientes || [];
      setPacientes(lista);
    } else {
      setErrorMsg(r.error || 'Error buscando pacientes');
      setPacientes([]);
    }
    setBuscando(false);
  };

  // ── Seleccionar paciente → cargar historias ──
  const seleccionarPaciente = async (p: any) => {
    setSelectedPaciente(p);
    setHistorias([]);
    setLoadingH(true);
    setErrorMsg('');
    const r = await getHistoriasPaciente(p.id, token);
    if (r.data) {
      const lista = Array.isArray(r.data) ? r.data : (r.data as any).historias || [];
      setHistorias(lista);
    } else {
      setErrorMsg(r.error || 'Error cargando historias');
    }
    setLoadingH(false);
  };

  // ── Descargar PDF desde el backend (sin diálogo de impresión) ──
  const API_BASE = API_BASE_URL;

  const handlePrint = async (historiaId: string, tipo: 'hc' | 'ordenes') => {
    const key = historiaId + tipo;
    setPrinting(key);
    setErrorMsg('');
    try {
      const endpoint =
        tipo === 'hc'
          ? `${API_BASE}/pdf/historia-clinica/${historiaId}`
          : `${API_BASE}/pdf/ordenes/${historiaId}`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Error ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        tipo === 'hc'
          ? `HistoriaClinica_${historiaId.slice(-6)}.pdf`
          : `OrdenesMedicas_${historiaId.slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al generar el PDF');
    } finally {
      setPrinting(null);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#080a0f]">

      {/* TOP BAR */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-white/[0.015]">
        <Printer size={18} className="text-yellow-400" />
        <h1 className="text-lg font-black text-white tracking-tight">
          Central de <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Impresión</span>
        </h1>
        <span className="text-[10px] text-gray-600 border border-white/10 rounded-full px-2 py-0.5 ml-1">
          HC · Órdenes Médicas
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ══ PANEL IZQUIERDO: búsqueda de pacientes ══ */}
        <div className="w-72 flex-shrink-0 border-r border-white/[0.08] flex flex-col bg-[#0b0d14]">
          <div className="p-4">
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-2">Buscar Paciente</p>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="Nombre o documento..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-yellow-500/60 transition-all"
              />
              <button
                onClick={buscar}
                disabled={buscando || query.trim().length < 2}
                className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-all disabled:opacity-40"
              >
                {buscando ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              </button>
            </div>
            {query.trim().length > 0 && query.trim().length < 2 && (
              <p className="text-[10px] text-gray-600 mt-1">Escriba al menos 2 caracteres</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {errorMsg && (
              <div className="flex items-center gap-2 text-red-400 text-xs px-3 py-2">
                <AlertCircle size={12} /> {errorMsg}
              </div>
            )}
            {pacientes.map(p => (
              <button
                key={p.id}
                onClick={() => seleccionarPaciente(p)}
                className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all flex items-center gap-2 ${
                  selectedPaciente?.id === p.id
                    ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-200'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <User size={12} className="shrink-0 opacity-60" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight truncate">{p.nombreCompleto}</p>
                  <p className="text-[10px] text-gray-600">{p.tipoDocumento} {p.numeroDocumento}</p>
                </div>
              </button>
            ))}
            {!buscando && pacientes.length === 0 && query.length >= 2 && !errorMsg && (
              <p className="text-center text-gray-700 text-xs py-4">Sin resultados para "{query}"</p>
            )}
            {query.length === 0 && (
              <p className="text-center text-gray-700 text-[10px] py-4 px-3 leading-relaxed">
                Busque por nombre o número de documento para ver las historias clínicas del paciente
              </p>
            )}
          </div>
        </div>

        {/* ══ PANEL DERECHO: historias del paciente ══ */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedPaciente && (
            <div className="flex flex-col items-center justify-center h-full text-gray-700 select-none">
              <Printer size={56} className="mb-4 opacity-10" />
              <p className="text-sm font-semibold text-gray-600">Seleccione un paciente</p>
              <p className="text-xs text-gray-700 mt-1">Búsquelo en el panel izquierdo</p>
            </div>
          )}

          {selectedPaciente && (
            <>
              {/* Info del paciente seleccionado */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/[0.06]">
                <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 font-black text-base shrink-0">
                  {selectedPaciente.nombreCompleto?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-white font-bold text-base leading-tight">{selectedPaciente.nombreCompleto}</h2>
                  <p className="text-gray-500 text-xs">{selectedPaciente.tipoDocumento} {selectedPaciente.numeroDocumento}</p>
                </div>
                <span className="ml-auto text-[10px] text-gray-600 border border-white/10 rounded-full px-2.5 py-1">
                  {loadingH ? 'cargando…' : `${historias.length} historia${historias.length !== 1 ? 's' : ''}`}
                </span>
              </div>

              {loadingH && (
                <div className="flex items-center gap-2 text-gray-600 text-sm py-4">
                  <Loader2 size={14} className="animate-spin" /> Cargando historias…
                </div>
              )}

              {!loadingH && historias.length === 0 && (
                <div className="text-center py-16 text-gray-700">
                  <p className="text-4xl mb-3">📋</p>
                  <p className="text-sm font-semibold">Sin historias registradas</p>
                  <p className="text-xs mt-1">Este paciente no tiene historias clínicas aún</p>
                </div>
              )}

              {/* Lista de historias */}
              <div className="space-y-3">
                {historias.map((h: any) => {
                  const fecha = h.fechaCreacion || h.createdAt || '';
                  const fechaStr = fecha
                    ? new Date(fecha).toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })
                    : '—';
                  const hora = fecha
                    ? new Date(fecha).toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })
                    : '';
                  return (
                    <div
                      key={h.id}
                      className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-white/[0.08] transition-all"
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 text-[10px] font-black shrink-0">
                            HC
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm leading-tight">
                              {h.tipoHistoria} · {h.tipoConsulta}
                            </p>
                            <p className="text-gray-600 text-xs">{fechaStr} {hora && `· ${hora}`}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold shrink-0 ${
                          h.entregadoEn
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                        }`}>
                          {h.entregadoEn ? 'Entregada' : 'Pendiente'}
                        </span>
                      </div>

                      {/* Botones de impresión */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handlePrint(h.id, 'hc')}
                          disabled={printing === h.id + 'hc'}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-yellow-500/15 to-amber-500/15 border border-yellow-500/30 text-yellow-300 hover:from-yellow-500/25 hover:to-amber-500/25 hover:border-yellow-400 transition-all disabled:opacity-50"
                        >
                          {printing === h.id + 'hc'
                            ? <Loader2 size={12} className="animate-spin" />
                            : <FileText size={12} />}
                          Imprimir Historia Clínica
                        </button>
                        <button
                          onClick={() => handlePrint(h.id, 'ordenes')}
                          disabled={printing === h.id + 'ordenes'}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400 transition-all disabled:opacity-50"
                        >
                          {printing === h.id + 'ordenes'
                            ? <Loader2 size={12} className="animate-spin" />
                            : <ClipboardList size={12} />}
                          Imprimir Órdenes Médicas
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
