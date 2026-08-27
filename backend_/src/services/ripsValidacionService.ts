import prisma from '../lib/prisma.js';

// ════════════════════════════════════════════════════════════════
//  Pre-validación de campos RIPS antes de cuadrar/facturar una cuenta.
//  Inspirado en el validador local del sistema IPSOFT-SIIS: revisa,
//  campo por campo, lo que exige el Documento Técnico 1 de la
//  Resolución 2275 de 2023, y reporta RECHAZADO/NOTIFICACION por ítem.
// ════════════════════════════════════════════════════════════════

export interface ResultadoValidacionRips {
  clase: 'RECHAZADO' | 'NOTIFICACION';
  codigo: string;
  descripcion: string;
  observaciones: string;
  pathFuente: string;
  fuente: 'Paciente' | 'CuentaItem' | 'Contrato';
}

export interface ReporteValidacionRips {
  cuentaId: string;
  totalErrores: number; // RECHAZADO
  totalNotificaciones: number; // NOTIFICACION
  puedeFacturar: boolean;
  resultados: ResultadoValidacionRips[];
}

const SEXOS_VALIDOS = ['M', 'F'];
const CONCEPTOS_RECAUDO_SIN_COPAGO = ['05']; // "No aplica cuota de recuperación"

function esNumerico(v?: string | null) {
  return !!v && /^\d+$/.test(v);
}

// ────────────────────────────────────────────────────────────────
//  Clasificación de componente RIPS (AC/AP/AH/AU/AT) por código CUPS.
//  Heurística propia de SARAI (no un catálogo oficial de excepciones como
//  el de IPSOFT, que depende de una tabla parametrizable por empresa que
//  no tenemos): los códigos de consulta externa en la nomenclatura CUPS
//  vigente empiezan por "89" (confirmado con los ejemplos reales del
//  manual FEV-RIPS v4.3 del MSPS: 890602, 890201, 890301, 890701...). Todo
//  lo demás factura como Procedimiento (AP) por defecto. El usuario puede
//  corregir el componente sugerido en el formulario si no aplica (p. ej.
//  Urgencias/Hospitalización/Otros servicios dependen del contexto de
//  atención, no solo del código).
// ────────────────────────────────────────────────────────────────
export function clasificarTipoRips(codigo?: string | null): string {
  const dig = (codigo || '').replace(/\D/g, '');
  if (dig.startsWith('89')) return 'AC';
  return 'AP';
}

export const COMPONENTE_LABEL: Record<string, string> = {
  AC: 'Consulta',
  AP: 'Procedimiento',
  AH: 'Hospitalización',
  AU: 'Urgencias',
  AT: 'Otros servicios',
};

// Campos exigidos (RECHAZADO si faltan) por cada componente RIPS, más allá
// de los comunes a todo ítem (código CUPS, diagnóstico principal).
interface CampoRipsRequerido { campo: string; label: string }
const CAMPOS_OBLIGATORIOS_POR_COMPONENTE: Record<string, CampoRipsRequerido[]> = {
  AC: [
    { campo: 'finalidadTecnologiaSalud', label: 'finalidad de la tecnología en salud' },
    { campo: 'causaMotivoAtencion', label: 'causa/motivo de atención' },
    { campo: 'tipoDiagnosticoPrincipal', label: 'tipo de diagnóstico principal' },
  ],
  AP: [
    { campo: 'ambitoRealizacionProcedimiento', label: 'ámbito de realización del procedimiento' },
    { campo: 'finalidadTecnologiaSalud', label: 'finalidad de la tecnología en salud' },
    { campo: 'tipoDiagnosticoPrincipal', label: 'tipo de diagnóstico principal' },
  ],
  AH: [
    { campo: 'viaIngresoServicioSalud', label: 'vía de ingreso al servicio de salud' },
    { campo: 'fechaIngreso', label: 'fecha de ingreso' },
    { campo: 'fechaSalida', label: 'fecha de salida' },
    { campo: 'causaMotivoAtencion', label: 'causa/motivo de atención' },
    { campo: 'estadoSalida', label: 'estado de salida (vivo/muerto)' },
    { campo: 'codDiagnosticoIngreso', label: 'diagnóstico de ingreso' },
    { campo: 'codDiagnosticoSalida', label: 'diagnóstico de salida' },
  ],
  AU: [
    { campo: 'fechaIngreso', label: 'fecha de ingreso a urgencias' },
    { campo: 'fechaSalida', label: 'fecha de salida de urgencias' },
    { campo: 'causaMotivoAtencion', label: 'causa/motivo de atención' },
    { campo: 'estadoSalida', label: 'estado de salida (vivo/muerto)' },
    { campo: 'codDiagnosticoIngreso', label: 'diagnóstico de ingreso' },
    { campo: 'codDiagnosticoSalida', label: 'diagnóstico de salida' },
  ],
  AT: [
    { campo: 'tipoOtroServicio', label: 'tipo de otro servicio' },
  ],
};

export async function validarRipsCuenta(cuentaId: string): Promise<ReporteValidacionRips> {
  const cuenta = await prisma.cuenta.findUnique({
    where: { id: cuentaId },
    include: {
      items: true,
      ingreso: {
        include: {
          paciente: true,
        },
      },
    },
  });
  if (!cuenta) throw new Error('Cuenta no encontrada');

  const resultados: ResultadoValidacionRips[] = [];
  const paciente = cuenta.ingreso.paciente;

  // ── Paciente ──────────────────────────────────────────────────────────
  if (!paciente.tipoDocumento || !paciente.numeroDocumento) {
    resultados.push({
      clase: 'RECHAZADO',
      codigo: 'RVS-01',
      descripcion: 'El paciente debe tener tipo y número de documento de identificación',
      observaciones: `tipoDocumento=${paciente.tipoDocumento || '—'} numeroDocumento=${paciente.numeroDocumento || '—'}`,
      pathFuente: 'usuarios[0].tipoDocumentoIdentificacion / numDocumentoIdentificacion',
      fuente: 'Paciente',
    });
  }
  if (!paciente.fechaNacimiento) {
    resultados.push({
      clase: 'RECHAZADO',
      codigo: 'RVS-02',
      descripcion: 'El paciente debe tener fecha de nacimiento',
      observaciones: 'fechaNacimiento vacía',
      pathFuente: 'usuarios[0].fechaNacimiento',
      fuente: 'Paciente',
    });
  }
  if (!paciente.genero || !SEXOS_VALIDOS.includes(paciente.genero.toUpperCase().charAt(0))) {
    resultados.push({
      clase: 'RECHAZADO',
      codigo: 'RVS-03',
      descripcion: 'El sexo del paciente debe ser M o F para efectos de RIPS',
      observaciones: `genero="${paciente.genero || '—'}"`,
      pathFuente: 'usuarios[0].codSexo',
      fuente: 'Paciente',
    });
  }
  if (!paciente.ciudad) {
    resultados.push({
      clase: 'NOTIFICACION',
      codigo: 'RVS-04',
      descripcion: 'Se recomienda registrar el municipio de residencia del paciente',
      observaciones: 'ciudad vacía — requerida para codMunicipioResidencia',
      pathFuente: 'usuarios[0].codMunicipioResidencia',
      fuente: 'Paciente',
    });
  }

  // ── Ítems de la cuenta ───────────────────────────────────────────────
  if (cuenta.items.length === 0) {
    resultados.push({
      clase: 'RECHAZADO',
      codigo: 'RVS-05',
      descripcion: 'La cuenta no tiene ítems/servicios para reportar en el RIPS',
      observaciones: '',
      pathFuente: 'usuarios[0].servicios',
      fuente: 'CuentaItem',
    });
  }

  cuenta.items.forEach((item, idx) => {
    const ruta = `usuarios[0].servicios[${idx}]`;
    const tipoRips = item.tipoRips || clasificarTipoRips(item.codigo);
    const nombreComponente = COMPONENTE_LABEL[tipoRips] ?? tipoRips;

    if (!esNumerico(item.codigo)) {
      resultados.push({
        clase: 'RECHAZADO',
        codigo: 'RVS-06',
        descripcion: 'El código del servicio (CUPS) debe existir y ser numérico',
        observaciones: `codigo="${item.codigo || '—'}" en "${item.descripcion}"`,
        pathFuente: `${ruta}.codConsulta / codProcedimiento`,
        fuente: 'CuentaItem',
      });
    }
    if (!item.codDiagnosticoPrincipal) {
      resultados.push({
        clase: 'RECHAZADO',
        codigo: 'RVS-07',
        descripcion: 'Falta el diagnóstico principal del servicio',
        observaciones: `Ítem "${item.descripcion}" sin codDiagnosticoPrincipal`,
        pathFuente: `${ruta}.codDiagnosticoPrincipal`,
        fuente: 'CuentaItem',
      });
    }

    // Campos exigidos según el componente RIPS del ítem (AC/AP/AH/AU/AT)
    const requeridos = CAMPOS_OBLIGATORIOS_POR_COMPONENTE[tipoRips] ?? [];
    for (const { campo, label } of requeridos) {
      const valor = (item as any)[campo];
      if (valor === null || valor === undefined || valor === '') {
        resultados.push({
          clase: 'RECHAZADO',
          codigo: 'RVS-14',
          descripcion: `[${tipoRips} — ${nombreComponente}] Falta ${label}`,
          observaciones: `Ítem "${item.descripcion}" sin ${campo}`,
          pathFuente: `${ruta}.${campo}`,
          fuente: 'CuentaItem',
        });
      }
    }
    // Diagnóstico de causa de muerte, exigido solo si el paciente falleció (AH/AU)
    if (['AH', 'AU'].includes(tipoRips) && item.estadoSalida === '2' && !item.codDiagnosticoMuerte) {
      resultados.push({
        clase: 'RECHAZADO',
        codigo: 'RVS-15',
        descripcion: `[${tipoRips} — ${nombreComponente}] Falta el diagnóstico de causa de muerte`,
        observaciones: `Ítem "${item.descripcion}" con estadoSalida=2 (fallecido) sin codDiagnosticoMuerte`,
        pathFuente: `${ruta}.codDiagnosticoMuerte`,
        fuente: 'CuentaItem',
      });
    }

    if (!item.codPrestador) {
      resultados.push({
        clase: 'NOTIFICACION',
        codigo: 'RVS-10',
        descripcion: 'Se recomienda registrar el código del prestador que ejecutó el servicio',
        observaciones: `Ítem "${item.descripcion}" sin codPrestador`,
        pathFuente: `${ruta}.codPrestador`,
        fuente: 'CuentaItem',
      });
    }

    // Consistencia concepto de recaudo <-> valor pago moderador
    if (item.conceptoRecaudo) {
      const debeSerCero = CONCEPTOS_RECAUDO_SIN_COPAGO.includes(item.conceptoRecaudo);
      const valor = item.valorPagoModerador ?? 0;
      if (debeSerCero && valor > 0) {
        resultados.push({
          clase: 'RECHAZADO',
          codigo: 'RVS-11',
          descripcion: 'El valor de pago moderador debe ser 0 cuando el concepto de recaudo no aplica copago',
          observaciones: `conceptoRecaudo="${item.conceptoRecaudo}" valorPagoModerador=${valor} en "${item.descripcion}"`,
          pathFuente: `${ruta}.valorPagoModerador`,
          fuente: 'CuentaItem',
        });
      } else if (!debeSerCero && valor <= 0) {
        resultados.push({
          clase: 'RECHAZADO',
          codigo: 'RVS-12',
          descripcion: 'El valor de pago moderador debe ser mayor a 0 para este concepto de recaudo',
          observaciones: `conceptoRecaudo="${item.conceptoRecaudo}" valorPagoModerador=${valor} en "${item.descripcion}"`,
          pathFuente: `${ruta}.valorPagoModerador`,
          fuente: 'CuentaItem',
        });
      }
    }
  });

  // ── Contrato (CUCON / factura sin contrato) ─────────────────────────
  const beneficiario = await prisma.contratoBeneficiario.findFirst({
    where: { pacienteId: paciente.id, estado: 'ACTIVO' },
    include: { contrato: true },
    orderBy: { createdAt: 'desc' },
  });
  if (beneficiario) {
    const c = beneficiario.contrato;
    const cuconOk = c.tieneCucon ? !!c.codigoCucon : !!c.facturaSinContrato;
    if (!cuconOk) {
      resultados.push({
        clase: 'RECHAZADO',
        codigo: 'RVS-13',
        descripcion: 'El contrato vinculado al paciente no tiene diligenciado CUCON ni código de factura sin contrato',
        observaciones: `Contrato #${c.numero} — "${c.descripcion}"`,
        pathFuente: 'facturaElectronica.NumeroContrato / NumeroPoliza',
        fuente: 'Contrato',
      });
    }
  }

  const totalErrores = resultados.filter((r) => r.clase === 'RECHAZADO').length;
  const totalNotificaciones = resultados.filter((r) => r.clase === 'NOTIFICACION').length;

  return {
    cuentaId,
    totalErrores,
    totalNotificaciones,
    puedeFacturar: totalErrores === 0,
    resultados,
  };
}
