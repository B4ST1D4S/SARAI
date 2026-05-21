/**
 * htmlTemplates.ts
 * Plantillas HTML para Historia Clínica y Órdenes Médicas
 * Estilo: Formulario médico profesional (compacto, tabular, etiquetas doradas)
 */

const BASE_CSS = `
  @page { margin: 8mm 10mm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 8px; color: #111; }

  /* ── Encabezado empresa ─────────────────────── */
  .top-header { display: table; width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  .top-header-row { display: table-row; }
  .logo-cell   { display: table-cell; width: 120px; vertical-align: middle; padding-right: 8px; }
  .logo-box    {
    width: 110px; height: 70px; border: 2px solid #2563AB; border-radius: 3px;
    text-align: center; line-height: 1.3; font-weight: bold; font-size: 9px;
    color: #2563AB; display: flex; align-items: center; justify-content: center; padding: 4px;
  }
  .empresa-cell { display: table-cell; vertical-align: middle; text-align: center; }
  .empresa-nombre { font-size: 12px; font-weight: bold; text-transform: uppercase; line-height: 1.5; }
  .empresa-sub    { font-size: 9px; font-weight: bold; line-height: 1.5; }
  .empresa-light  { font-size: 8px; line-height: 1.5; }
  .header-divider { border-bottom: 2px solid #333; margin: 4px 0 5px; }

  /* ── Título documento ───────────────────────── */
  .doc-title {
    text-align: center; font-weight: bold; font-size: 11px;
    border: 1.5px solid #111; padding: 5px 8px; margin: 5px 0;
    text-transform: uppercase; letter-spacing: .3px;
  }

  /* ── Tabla HC principal ─────────────────────── */
  .hc-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; font-size: 8px; }
  .hc-table td { border: 1px solid #888; padding: 2px 4px; vertical-align: top; }

  /* Fila encabezado de sección (texto azul centrado) */
  .sec-row td {
    background-color: #FFFFFF; color: #005B8E;
    font-weight: bold; font-size: 9px; text-align: center;
    text-transform: uppercase; padding: 3px 4px;
    border: 1px solid #888;
  }

  /* Encabezado de columna (fondo celeste) */
  .col-hdr {
    background-color: #DEEAF1; color: #000; font-weight: bold; font-size: 7.5px;
    text-align: center; text-transform: uppercase;
    border: 1px solid #888; padding: 2px 4px; vertical-align: middle;
  }

  /* Etiqueta de campo (dorado/ámbar) */
  .lbl { color: #7F4F00; font-weight: bold; font-size: 7px; text-transform: uppercase; }

  /* Valor de campo */
  .val { font-size: 8px; color: #111; }

  /* Texto multilínea (libre) dentro de tabla */
  .cell-multi { padding: 3px 4px; min-height: 18px; font-size: 8px; white-space: pre-wrap; word-break: break-word; }

  /* Bold dentro de celda (nombre médico, etc.) */
  .bold { font-weight: bold; }
  .italic { font-style: italic; }

  /* ── Tabla de órdenes ───────────────────────── */
  .ord-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 8px; }
  .ord-table th { background-color: #DEEAF1; font-weight: bold; font-size: 7.5px; text-transform: uppercase;
    border: 1px solid #888; padding: 2px 4px; text-align: center; }
  .ord-table td { border: 1px solid #888; padding: 2px 4px; vertical-align: top; }
  .ord-table tr:nth-child(even) td { background-color: #FAFCFE; }

  /* ── Firma médico ───────────────────────────── */
  .firma-wrap { margin-top: 22px; page-break-inside: avoid; }
  .firma-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
  .firma-box  { text-align: center; }
  .firma-img  { max-width: 130px; max-height: 50px; margin: 0 auto 3px; display: block; }
  .firma-line { border-top: 1px solid #000; padding-top: 3px; font-size: 7.5px; line-height: 1.6; }
  .firma-name { font-weight: bold; font-size: 8px; }

  /* ── Footer ─────────────────────────────────── */
  .doc-footer { font-size: 7px; color: #666; border-top: 1px solid #ccc;
    margin-top: 10px; padding-top: 3px; text-align: right; }

  /* ── Vacío ───────────────────────────────────── */
  .empty-notice { color: #888; font-style: italic; padding: 8px 4px; font-size: 8px; }
`;

// ═══════════════════════════════════════════════════════════════
// Utilidades
// ═══════════════════════════════════════════════════════════════

/** Etiqueta + valor inline dentro de una celda */
function lv(label: string, value: unknown): string {
  const v = value === true ? 'Sí' : value === false ? 'No' : String(value ?? '');
  return `<span class="lbl">${label}:</span> <span class="val">${v}</span>`;
}

/** Calcula edad a partir de fecha de nacimiento */
function calcEdad(fechaNac: unknown): string {
  if (!fechaNac) return '';
  try {
    const d = new Date(String(fechaNac));
    const hoy = new Date();
    let age = hoy.getFullYear() - d.getFullYear();
    const m = hoy.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) age--;
    return `${age} Años`;
  } catch { return ''; }
}

/** Formatea fecha a DD/MM/YYYY o DD/MM/YYYY - HH:MM */
function fmtFecha(v: unknown, soloFecha = false): string {
  if (!v) return '';
  try {
    const d = new Date(String(v));
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    if (soloFecha) return `${dd}/${mm}/${yy}`;
    const hh = String(d.getHours()).padStart(2, '0');
    const mn = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yy} - ${hh}:${mn}`;
  } catch { return String(v); }
}

/** Formatea teléfonos (array o string) */
function fmtTel(telefonos: unknown): string {
  if (!telefonos) return '';
  if (Array.isArray(telefonos)) return telefonos.map((t: any) => t.numero ?? t).join(' / ');
  return String(telefonos);
}

const FINALIDAD_MAP: Record<string, string> = {
  P:'Promoción y Mantenimiento', V:'Prevención', D:'Diagnóstico',
  T:'Tratamiento', R:'Rehabilitación', C:'Cuidado Paliativo',
  E:'Educación', I:'Investigación',
};
const ORIGEN_MAP: Record<string, string> = {
  CE:'Consulta Externa', UR:'Urgencias', HO:'Hospitalización',
  RE:'Remisión', PA:'Particular', TM:'Telemedicina',
};

// ═══════════════════════════════════════════════════════════════
// Encabezado empresa
// ═══════════════════════════════════════════════════════════════
function buildEmpresaHeader(medico: any, titulo: string, historia: any, clinica?: Record<string, string>): string {
  const nombreMedico = medico
    ? `Dr(a). ${medico.nombre ?? ''} ${medico.apellido ?? ''}`.trim()
    : '';
  const especialidad = medico?.especialidad ?? '';
  const regMedico    = medico?.registroMedico ? `R.M.: ${medico.registroMedico}` : '';
  const regProf      = medico?.registroProfesional ? `R.P.: ${medico.registroProfesional}` : '';
  const hcNum        = historia?.id ? historia.id.slice(-8).toUpperCase() : '';

  const nombreClinica = clinica?.nombre_clinica?.trim() || 'Sistema de Gestión Médica';
  const nit           = clinica?.nit?.trim()            || '';
  const direccion     = clinica?.direccion?.trim()      || '';
  const ciudad        = clinica?.ciudad?.trim()         || '';
  const telefono      = clinica?.telefono?.trim()       || '';
  const logoUrl       = clinica?.logo_url?.trim()       || '';

  const infoLines = [
    nit       ? `NIT: ${nit}`       : '',
    direccion ? direccion            : '',
    ciudad    ? ciudad               : '',
    telefono  ? `Tel: ${telefono}`  : '',
  ].filter(Boolean);

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" style="max-width:110px; max-height:72px; object-fit:contain; display:block;" alt="Logo"/>`
    : `<div class="logo-box">LOGO<br>CLÍNICA</div>`;

  return `
  <table class="top-header">
    <tr>
      <td class="logo-cell">
        ${logoHtml}
      </td>
      <td class="empresa-cell">
        <div class="empresa-nombre">${nombreClinica}</div>
        ${infoLines.map(l => `<div class="empresa-light">${l}</div>`).join('')}
        ${nombreMedico ? `<div class="empresa-sub">${nombreMedico}${especialidad ? ' &mdash; ' + especialidad : ''}</div>` : ''}
        ${(regMedico || regProf) ? `<div class="empresa-light">${[regMedico, regProf].filter(Boolean).join(' &nbsp;&middot;&nbsp; ')}</div>` : ''}
        <div class="empresa-light">Impreso: ${new Date().toLocaleString('es-CO', { dateStyle:'short', timeStyle:'short' })}</div>
      </td>
    </tr>
  </table>
  <div class="header-divider"></div>
  <div class="doc-title">${titulo}${hcNum ? ' &nbsp;#' + hcNum : ''}</div>`;
}

// ═══════════════════════════════════════════════════════════════
// Firma
// ═══════════════════════════════════════════════════════════════
function buildFirma(medico: any): string {
  const nombre = medico ? `Dr(a). ${medico.nombre ?? ''} ${medico.apellido ?? ''}`.trim() : '';
  const lines  = [
    medico?.especialidad ?? '',
    medico?.registroMedico ? `R.M.: ${medico.registroMedico}` : '',
    medico?.registroProfesional ? `R.P.: ${medico.registroProfesional}` : '',
  ].filter(Boolean);

  return `
  <div class="firma-wrap">
    <div class="firma-grid">
      <div class="firma-box">
        ${medico?.firmaBase64
          ? `<img src="${medico.firmaBase64}" class="firma-img" alt="Firma"/>`
          : '<div style="height:45px;"></div>'}
        <div class="firma-line">
          <div class="firma-name">${nombre}</div>
          ${lines.map((l: string) => `<div>${l}</div>`).join('')}
        </div>
      </div>
      <div class="firma-box">
        <div style="height:45px;"></div>
        <div class="firma-line">Firma del Paciente / Representante</div>
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// HISTORIA CLÍNICA
// ═══════════════════════════════════════════════════════════════
export function buildHCHtml(historia: any, clinica?: Record<string, string>): string {
  const raw  = historia.datosExtendidos ?? historia.contenido ?? {};
  const ext  = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const sv   = ext.signosVitales          ?? {};
  const antP = ext.antecedentesPersonales ?? {};
  const antF = ext.antecedentesFamiliares ?? {};
  const gin  = ext.antecedentesGineco     ?? {};
  const evCx = ext.evolucionCx            ?? {};
  const diag = ext.diagnostico            ?? {};
  const plan = ext.planTerapeutico        ?? {};
  const pac  = historia.paciente ?? {};
  const med  = historia.usuario  ?? {};

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>HC — ${pac.nombreCompleto ?? ''}</title>
  <style>${BASE_CSS}</style>
</head>
<body>

  ${buildEmpresaHeader(med, 'HISTORIA CLÍNICA', historia, clinica)}

  <!-- ── Datos del paciente ── -->
  <table class="hc-table">
    <tr class="sec-row"><td colspan="8">DATOS DEL PACIENTE</td></tr>
    <tr>
      <td colspan="3">${lv('NOMBRE', pac.nombreCompleto)}</td>
      <td colspan="2">${lv('IDENTIFICACIÓN', `${pac.tipoDocumento ?? ''} ${pac.numeroDocumento ?? ''}`)}</td>
      <td>${lv('HC', pac.numeroDocumento)}</td>
      <td>${lv('EDAD', calcEdad(pac.fechaNacimiento))}</td>
      <td>${lv('SEXO', pac.genero ? pac.genero.charAt(0).toUpperCase() : '')}</td>
    </tr>
    <tr>
      <td colspan="2">${lv('FECHA NAC.', fmtFecha(pac.fechaNacimiento, true))}</td>
      <td colspan="3">${lv('CIUDAD / RESIDENCIA', pac.ciudad)}</td>
      <td colspan="2">${lv('TELÉFONO', fmtTel(pac.telefonos))}</td>
      <td>${lv('EMAIL', pac.email)}</td>
    </tr>
    <tr>
      <td colspan="2">${lv('TIPO CONSULTA', historia.tipoConsulta)}</td>
      <td colspan="2">${lv('TIPO HISTORIA', historia.tipoHistoria)}</td>
      <td colspan="2">${lv('FECHA CONSULTA', fmtFecha(historia.fechaCreacion ?? historia.createdAt))}</td>
      <td>${lv('FINALIDAD', FINALIDAD_MAP[ext.finalidadAtencion] ?? ext.finalidadAtencion ?? '')}</td>
      <td>${lv('ORIGEN', ORIGEN_MAP[ext.origenAtencion] ?? ext.origenAtencion ?? '')}</td>
    </tr>
  </table>

  <!-- ── Motivo de consulta ── -->
  <table class="hc-table">
    <tr>
      <td class="col-hdr" width="11%">FECHA</td>
      <td class="sec-row" style="text-align:left; padding-left:6px; border-left:none;">
        MOTIVO DE CONSULTA Y ENFERMEDAD ACTUAL
      </td>
    </tr>
    <tr>
      <td style="vertical-align:top; padding-top:3px;">
        <div class="bold">${fmtFecha(historia.fechaCreacion ?? historia.createdAt, true)}</div>
        <div style="margin-top:3px; font-size:7.5px; color:#005B8E; font-weight:bold;">${
          med.nombre ? `${med.nombre} ${med.apellido ?? ''}` : ''
        }</div>
      </td>
      <td>
        <div style="margin-bottom:4px;"><span class="lbl">MOTIVO DE CONSULTA:</span><br><span class="cell-multi">${historia.quejaPrincipal ?? ext.quejaPrincipal ?? ''}</span></div>
        <div><span class="lbl">ENFERMEDAD ACTUAL:</span><br><span class="cell-multi">${historia.historiaEnfermedad ?? ext.historiaEnfermedad ?? ''}</span></div>
      </td>
    </tr>
  </table>

  <!-- ── Signos Vitales ── -->
  <table class="hc-table">
    <tr class="sec-row"><td colspan="9">SIGNOS VITALES</td></tr>
    <tr>
      <td class="col-hdr">PESO<br>(kg)</td>
      <td class="col-hdr">TALLA<br>(cm)</td>
      <td class="col-hdr">IMC</td>
      <td class="col-hdr">TEMP.<br>(°C)</td>
      <td class="col-hdr">F.C.<br>(lpm)</td>
      <td class="col-hdr">F.R.<br>(rpm)</td>
      <td class="col-hdr">TA SIST.<br>(mmHg)</td>
      <td class="col-hdr">TA DIAST.<br>(mmHg)</td>
      <td class="col-hdr">SAT O₂<br>(%)</td>
    </tr>
    <tr>
      <td class="val" style="text-align:center;">${sv.peso ?? ''}</td>
      <td class="val" style="text-align:center;">${sv.talla ?? ''}</td>
      <td class="val" style="text-align:center;">${sv.imc ?? ''}</td>
      <td class="val" style="text-align:center;">${sv.temperatura ?? ''}</td>
      <td class="val" style="text-align:center;">${sv.frecuenciaCardiaca ?? ''}</td>
      <td class="val" style="text-align:center;">${sv.frecuenciaRespiratoria ?? ''}</td>
      <td class="val" style="text-align:center;">${sv.taSistolica ?? ''}</td>
      <td class="val" style="text-align:center;">${sv.taDiastolica ?? ''}</td>
      <td class="val" style="text-align:center;">${sv.saturacionO2 ?? ''}</td>
    </tr>
  </table>

  <!-- ── Antecedentes Personales ── -->
  <table class="hc-table">
    <tr class="sec-row"><td colspan="8">ANTECEDENTES PERSONALES</td></tr>
    <tr>
      <td class="col-hdr" width="14%">ANTECEDENTE</td>
      <td class="col-hdr" width="4%">OP</td>
      <td class="col-hdr" width="25%">DETALLE</td>
      <td class="col-hdr" width="3%"></td>
      <td class="col-hdr" width="14%">ANTECEDENTE</td>
      <td class="col-hdr" width="4%">OP</td>
      <td class="col-hdr">DETALLE</td>
    </tr>
    <tr>
      <td class="sec-row" colspan="3" style="font-size:8px;">PATOLÓGICOS</td>
      <td style="border:none;"></td>
      <td class="sec-row" colspan="3" style="font-size:8px;">FARMACOLÓGICOS</td>
    </tr>
    <tr>
      <td><span class="lbl">PATOLÓGICOS</span></td>
      <td style="text-align:center; font-size:8px;">${antP.patologicos ? 'SÍ' : 'NO'}</td>
      <td class="cell-multi">${antP.patologicos ?? ''}</td>
      <td style="border:none;"></td>
      <td><span class="lbl">FARMACOLÓGICOS</span></td>
      <td style="text-align:center; font-size:8px;">${antP.farmacologicos ? 'SÍ' : 'NO'}</td>
      <td class="cell-multi">${antP.farmacologicos ?? ''}</td>
    </tr>
    <tr>
      <td class="sec-row" colspan="3" style="font-size:8px;">TÓXICO ALÉRGICOS</td>
      <td style="border:none;"></td>
      <td class="sec-row" colspan="3" style="font-size:8px;">QUIRÚRGICOS / HOSPITALARIOS</td>
    </tr>
    <tr>
      <td><span class="lbl">ALÉRGICOS</span></td>
      <td style="text-align:center; font-size:8px;">${antP.alergicos ? 'SÍ' : 'NO'}</td>
      <td class="cell-multi">${antP.alergicos ?? ''}</td>
      <td style="border:none;"></td>
      <td><span class="lbl">QUIRÚRGICOS</span></td>
      <td style="text-align:center; font-size:8px;">${antP.quirurgicos ? 'SÍ' : 'NO'}</td>
      <td class="cell-multi">${antP.quirurgicos ?? ''}</td>
    </tr>
    <tr>
      <td><span class="lbl">TÓXICOS</span></td>
      <td style="text-align:center; font-size:8px;">${antP.toxicos ? 'SÍ' : 'NO'}</td>
      <td class="cell-multi">${antP.toxicos ?? ''}</td>
      <td style="border:none;"></td>
      <td><span class="lbl">HOSPITALARIOS</span></td>
      <td style="text-align:center; font-size:8px;">${antP.hospitalarios ? 'SÍ' : 'NO'}</td>
      <td class="cell-multi">${antP.hospitalarios ?? ''}</td>
    </tr>
  </table>

  <!-- ── Antecedentes Familiares ── -->
  <table class="hc-table">
    <tr class="sec-row"><td colspan="6">ANTECEDENTES FAMILIARES</td></tr>
    <tr>
      <td class="col-hdr">ANTECEDENTE</td>
      <td class="col-hdr" width="5%">OP</td>
      <td class="col-hdr">DETALLE</td>
      <td class="col-hdr">ANTECEDENTE</td>
      <td class="col-hdr" width="5%">OP</td>
      <td class="col-hdr">DETALLE</td>
    </tr>
    <tr>
      <td><span class="lbl">HTA</span></td>
      <td style="text-align:center; font-size:8px;">${antF.hta ? 'SÍ' : 'NO'}</td>
      <td class="cell-multi">${antF.hta ?? ''}</td>
      <td><span class="lbl">DIABETES</span></td>
      <td style="text-align:center; font-size:8px;">${antF.diabetes ? 'SÍ' : 'NO'}</td>
      <td class="cell-multi">${antF.diabetes ?? ''}</td>
    </tr>
    <tr>
      <td><span class="lbl">CÁNCER</span></td>
      <td style="text-align:center; font-size:8px;">${antF.cancer ? 'SÍ' : 'NO'}</td>
      <td class="cell-multi">${antF.cancer ?? ''}</td>
      <td><span class="lbl">CARDIOPATÍAS</span></td>
      <td style="text-align:center; font-size:8px;">${antF.cardiopatias ? 'SÍ' : 'NO'}</td>
      <td class="cell-multi">${antF.cardiopatias ?? ''}</td>
    </tr>
    ${antF.otros ? `<tr><td colspan="6"><span class="lbl">OTROS:</span> <span class="val">${antF.otros}</span></td></tr>` : ''}
  </table>

  <!-- ── Antecedentes Gineco-Obstétricos ── -->
  <table class="hc-table">
    <tr class="sec-row"><td colspan="7">ANTECEDENTES GINECO-OBSTÉTRICOS</td></tr>
    <tr>
      <td class="col-hdr">FUM</td>
      <td class="col-hdr">G</td>
      <td class="col-hdr">P</td>
      <td class="col-hdr">C</td>
      <td class="col-hdr">A</td>
      <td class="col-hdr">PLANIFICACIÓN</td>
      <td class="col-hdr">MENOPAUSIA</td>
    </tr>
    <tr>
      <td class="val" style="text-align:center;">${gin.fum ?? ''}</td>
      <td class="val" style="text-align:center;">${gin.gestaciones ?? ''}</td>
      <td class="val" style="text-align:center;">${gin.partos ?? ''}</td>
      <td class="val" style="text-align:center;">${gin.cesareas ?? ''}</td>
      <td class="val" style="text-align:center;">${gin.abortos ?? ''}</td>
      <td class="val" style="text-align:center;">${gin.planificacion ?? ''}</td>
      <td class="val" style="text-align:center;">${gin.menopausia ?? ''}</td>
    </tr>
  </table>

  ${evCx.procedimientoRealizado || evCx.evolucion ? `
  <!-- ── Evolución Clínica ── -->
  <table class="hc-table">
    <tr class="sec-row"><td colspan="2">EVOLUCIÓN CLÍNICA / CIRUGÍA</td></tr>
    <tr>
      <td colspan="2"><span class="lbl">PROCEDIMIENTO REALIZADO:</span><br><span class="cell-multi">${evCx.procedimientoRealizado ?? ''}</span></td>
    </tr>
    <tr>
      <td width="50%"><span class="lbl">EVOLUCIÓN:</span><br><span class="cell-multi">${evCx.evolucion ?? ''}</span></td>
      <td width="50%"><span class="lbl">COMPLICACIONES:</span><br><span class="cell-multi">${evCx.complicaciones ?? ''}</span></td>
    </tr>
    <tr>
      <td><span class="lbl">RECOMENDACIONES QUIRÚRGICAS:</span><br><span class="cell-multi">${evCx.recomendaciones ?? ''}</span></td>
      <td><span class="lbl">EVOLUCIÓN POSTOPERATORIA:</span><br><span class="cell-multi">${evCx.evolucionPostop ?? ''}</span></td>
    </tr>
  </table>` : ''}

  ${ext.revisionSistemas ? `
  <!-- ── Revisión por Sistemas ── -->
  <table class="hc-table">
    <tr class="sec-row"><td>REVISIÓN POR SISTEMAS</td></tr>
    <tr><td class="cell-multi">${ext.revisionSistemas}</td></tr>
  </table>` : ''}

  <!-- ── Examen Físico ── -->
  <table class="hc-table">
    <tr class="sec-row"><td colspan="2">EXAMEN FÍSICO</td></tr>
    <tr>
      <td width="50%"><span class="lbl">DESCRIPCIÓN GENERAL:</span><br><span class="cell-multi">${ext.examenFisico?.descripcionGeneral ?? historia.observacionesAntropometricas ?? ''}</span></td>
      <td width="50%"><span class="lbl">HALLAZGOS RELEVANTES:</span><br><span class="cell-multi">${ext.examenFisico?.hallazgos ?? ''}</span></td>
    </tr>
  </table>

  <!-- ── Impresión Diagnóstica ── -->
  <table class="hc-table">
    <tr class="sec-row"><td colspan="4">IMPRESIÓN DIAGNÓSTICA</td></tr>
    <tr>
      <td class="col-hdr" width="40%">DIAGNÓSTICO PRINCIPAL</td>
      <td class="col-hdr" width="13%">CÓDIGO CIE-10</td>
      <td class="col-hdr" width="32%">DIAGNÓSTICOS RELACIONADOS</td>
      <td class="col-hdr" width="15%">TIPO DIAGNÓSTICO</td>
    </tr>
    <tr>
      <td class="cell-multi">${diag.principal ?? historia.diagnostico ?? ''}</td>
      <td class="val" style="text-align:center;">${diag.codigoCie10 ?? ''}</td>
      <td class="cell-multi">${diag.relacionados ?? ''}</td>
      <td class="val">${diag.tipo ?? ''}</td>
    </tr>
  </table>

  <!-- ── Plan Terapéutico ── -->
  <table class="hc-table">
    <tr class="sec-row"><td colspan="3">PLAN TERAPÉUTICO</td></tr>
    <tr>
      <td colspan="3"><span class="lbl">CONDUCTA / MANEJO:</span><br><span class="cell-multi">${plan.conducta ?? historia.tratamientoRecomendado ?? ''}</span></td>
    </tr>
    <tr>
      <td><span class="lbl">INCAPACIDAD (días):</span> <span class="val">${plan.incapacidadDias ?? ''}</span></td>
      <td><span class="lbl">PROCEDIMIENTOS:</span> <span class="val">${plan.procedimientos ?? ''}</span></td>
      <td><span class="lbl">SEGUIMIENTO:</span> <span class="val">${plan.seguimiento ?? ''}</span></td>
    </tr>
  </table>

  ${ext.recomendaciones ? `
  <!-- ── Recomendaciones ── -->
  <table class="hc-table">
    <tr class="sec-row"><td>RECOMENDACIONES AL PACIENTE</td></tr>
    <tr><td class="cell-multi">${ext.recomendaciones}</td></tr>
  </table>` : ''}

  ${buildFirma(med)}

  <div class="doc-footer">
    Historia Clínica &nbsp;&middot;&nbsp; ${pac.nombreCompleto ?? ''} &nbsp;&middot;&nbsp; ${fmtFecha(historia.fechaCreacion ?? historia.createdAt)}
  </div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// ÓRDENES MÉDICAS
// ═══════════════════════════════════════════════════════════════
export function buildOrdenesHtml(historia: any, clinica?: Record<string, string>): string {
  const raw    = historia.datosExtendidos ?? historia.contenido ?? {};
  const ext    = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const ordenes = ext.ordenesMedicas ?? {};

  const apoyos : any[] = ordenes.apoyosDiagnosticos ?? [];
  const procQx : any[] = ordenes.procedimientosQx   ?? [];
  const meds   : any[] = ordenes.medicamentos        ?? [];
  const interc : any[] = ordenes.interconsultas      ?? [];
  const recoms : any[] = ordenes.recomendaciones     ?? [];

  const pac = historia.paciente ?? {};
  const med = historia.usuario  ?? {};

  const noOrdenes = apoyos.length + procQx.length + meds.length + interc.length + recoms.length === 0;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Órdenes — ${pac.nombreCompleto ?? ''}</title>
  <style>${BASE_CSS}</style>
</head>
<body>

  ${buildEmpresaHeader(med, 'ÓRDENES MÉDICAS', historia, clinica)}

  <!-- Datos paciente resumen -->
  <table class="hc-table">
    <tr class="sec-row"><td colspan="4">DATOS DEL PACIENTE</td></tr>
    <tr>
      <td colspan="2">${lv('NOMBRE', pac.nombreCompleto)}</td>
      <td>${lv('IDENTIFICACIÓN', `${pac.tipoDocumento ?? ''} ${pac.numeroDocumento ?? ''}`)}</td>
      <td>${lv('FECHA', fmtFecha(historia.fechaCreacion ?? historia.createdAt, true))}</td>
    </tr>
    <tr>
      <td>${lv('TIPO CONSULTA', historia.tipoConsulta)}</td>
      <td>${lv('CIUDAD', pac.ciudad)}</td>
      <td>${lv('TELÉFONO', fmtTel(pac.telefonos))}</td>
      <td>${lv('EDAD', calcEdad(pac.fechaNacimiento))}</td>
    </tr>
  </table>

  ${noOrdenes
    ? '<p class="empty-notice">No se registraron órdenes médicas en esta historia clínica.</p>'
    : ''}

  ${apoyos.length > 0 ? `
  <table class="hc-table">
    <tr class="sec-row"><td colspan="3">SOLICITUD DE APOYOS DIAGNÓSTICOS</td></tr>
    <tr>
      <td class="col-hdr" width="18%">TIPO</td>
      <td class="col-hdr">DESCRIPCIÓN</td>
      <td class="col-hdr" width="8%">URGENTE</td>
    </tr>
    ${apoyos.map((x: any) => `
    <tr>
      <td class="val">${x.tipo ?? ''}</td>
      <td class="cell-multi">${x.descripcion ?? ''}</td>
      <td class="val" style="text-align:center;">${x.urgente ? 'Sí' : 'No'}</td>
    </tr>`).join('')}
  </table>` : ''}

  ${procQx.length > 0 ? `
  <table class="hc-table">
    <tr class="sec-row"><td colspan="5">SOLICITUD DE PROCEDIMIENTOS QUIRÚRGICOS</td></tr>
    <tr>
      <td class="col-hdr" width="10%">CÓD. CUPS</td>
      <td class="col-hdr">NOMBRE PROCEDIMIENTO</td>
      <td class="col-hdr" width="12%">PRIORIDAD</td>
      <td class="col-hdr" width="14%">ANESTESIA</td>
      <td class="col-hdr">OBSERVACIONES</td>
    </tr>
    ${procQx.map((x: any) => `
    <tr>
      <td class="val" style="text-align:center;">${x.codigoCups ?? ''}</td>
      <td class="val">${x.nombre ?? ''}</td>
      <td class="val">${x.prioridad ?? ''}</td>
      <td class="val">${x.anestesia ?? ''}</td>
      <td class="cell-multi">${x.observaciones ?? ''}</td>
    </tr>`).join('')}
  </table>` : ''}

  ${meds.length > 0 ? `
  <table class="hc-table">
    <tr class="sec-row"><td colspan="6">FORMULACIÓN DE MEDICAMENTOS</td></tr>
    <tr>
      <td class="col-hdr">MEDICAMENTO</td>
      <td class="col-hdr" width="13%">CONCENTRACIÓN</td>
      <td class="col-hdr" width="10%">DOSIS</td>
      <td class="col-hdr" width="12%">FRECUENCIA</td>
      <td class="col-hdr" width="12%">DURACIÓN</td>
      <td class="col-hdr" width="8%">VÍA</td>
    </tr>
    ${meds.map((x: any) => `
    <tr>
      <td class="val">${x.nombre ?? ''}</td>
      <td class="val">${x.concentracion ?? ''}</td>
      <td class="val" style="text-align:center;">${x.dosis ?? ''}</td>
      <td class="val">${x.frecuencia ?? ''}</td>
      <td class="val">${x.duracion ?? ''}</td>
      <td class="val" style="text-align:center;">${x.via ?? ''}</td>
    </tr>`).join('')}
  </table>` : ''}

  ${interc.length > 0 ? `
  <table class="hc-table">
    <tr class="sec-row"><td colspan="4">SOLICITUD DE INTERCONSULTA</td></tr>
    <tr>
      <td class="col-hdr">ESPECIALIDAD DESTINO</td>
      <td class="col-hdr" width="12%">PRIORIDAD</td>
      <td class="col-hdr">MOTIVO</td>
      <td class="col-hdr">OBSERVACIONES</td>
    </tr>
    ${interc.map((x: any) => `
    <tr>
      <td class="val">${x.especialidad ?? ''}</td>
      <td class="val">${x.prioridad ?? ''}</td>
      <td class="cell-multi">${x.motivo ?? ''}</td>
      <td class="cell-multi">${x.observaciones ?? ''}</td>
    </tr>`).join('')}
  </table>` : ''}

  ${recoms.length > 0 ? `
  <table class="hc-table">
    <tr class="sec-row"><td>RECOMENDACIONES MÉDICAS</td></tr>
    ${recoms.map((x: any) => `
    <tr><td class="cell-multi">${typeof x === 'string' ? x : (x.descripcion ?? x.texto ?? JSON.stringify(x))}</td></tr>`
    ).join('')}
  </table>` : ''}

  ${buildFirma(med)}

  <div class="doc-footer">
    Órdenes Médicas &nbsp;&middot;&nbsp; ${pac.nombreCompleto ?? ''} &nbsp;&middot;&nbsp; ${fmtFecha(historia.fechaCreacion ?? historia.createdAt)}
  </div>
</body>
</html>`;
}

