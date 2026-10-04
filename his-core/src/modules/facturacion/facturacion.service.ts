import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TenancyConnectionService } from '../../core/tenancy/services/tenancy-connection.service';
import { CreateIngresoDto } from './dto/create-ingreso.dto';
import { CreateCuentaItemDto } from './dto/create-cuenta-item.dto';
import { UpdateCuentaItemDto } from './dto/update-cuenta-item.dto';
import { FacturarCuentaDto } from './dto/facturar-cuenta.dto';

// ════════════════════════════════════════════════════════════════════════
// MÓDULO DE FACTURACIÓN
// Flujo: al admitir o completar una cita → se crea Ingreso + Cuenta (ABIERTA).
// A la cuenta se le adicionan ítems/servicios; se pre-valida RIPS; se factura.
// Modelos: fac_ingresos · fac_cuentas · fac_cuenta_items · fac_facturas
//
// Fuera de alcance por ahora (fases posteriores):
//  - Catálogo oficial CUPS completo (se usa tipos_consulta_cups como fuente
//    mínima de búsqueda hasta que exista una importación real).
//  - Contratación (Contrato/ContratoBeneficiario) — la validación RIPS de
//    "contrato sin CUCON" del sistema anterior depende de eso y queda
//    pendiente hasta que ese módulo exista en his-core.
// ════════════════════════════════════════════════════════════════════════

const round2 = (n: number) => Math.round(n * 100) / 100;

export type TipoRips = 'AC' | 'AP' | 'AH' | 'AU' | 'AT';

export const COMPONENTE_LABEL: Record<string, string> = {
  AC: 'Consulta',
  AP: 'Procedimiento',
  AH: 'Hospitalización',
  AU: 'Urgencias',
  AT: 'Otros servicios',
};

// Heurística de clasificación del componente RIPS por código CUPS: los
// códigos de consulta externa empiezan por "89" (Manual FEV-RIPS v4.3 MSPS,
// ej. 890201/890301/890602/890701). Todo lo demás factura como Procedimiento
// (AP) por defecto; el usuario puede corregir el componente sugerido.
export function clasificarTipoRips(codigo?: string | null): TipoRips {
  const dig = (codigo || '').replace(/\D/g, '');
  if (dig.startsWith('89')) return 'AC';
  return 'AP';
}

interface CampoRipsRequerido {
  campo: string;
  label: string;
}
const CAMPOS_OBLIGATORIOS_POR_COMPONENTE: Record<string, CampoRipsRequerido[]> = {
  AC: [
    { campo: 'finalidad_tecnologia_salud', label: 'finalidad de la tecnología en salud' },
    { campo: 'causa_motivo_atencion', label: 'causa/motivo de atención' },
    { campo: 'tipo_diagnostico_principal', label: 'tipo de diagnóstico principal' },
  ],
  AP: [
    { campo: 'ambito_realizacion_procedimiento', label: 'ámbito de realización del procedimiento' },
    { campo: 'finalidad_tecnologia_salud', label: 'finalidad de la tecnología en salud' },
    { campo: 'tipo_diagnostico_principal', label: 'tipo de diagnóstico principal' },
  ],
  AH: [
    { campo: 'via_ingreso_servicio_salud', label: 'vía de ingreso al servicio de salud' },
    { campo: 'fecha_ingreso', label: 'fecha de ingreso' },
    { campo: 'fecha_salida', label: 'fecha de salida' },
    { campo: 'causa_motivo_atencion', label: 'causa/motivo de atención' },
    { campo: 'estado_salida', label: 'estado de salida (vivo/muerto)' },
    { campo: 'cod_diagnostico_ingreso', label: 'diagnóstico de ingreso' },
    { campo: 'cod_diagnostico_salida', label: 'diagnóstico de salida' },
  ],
  AU: [
    { campo: 'fecha_ingreso', label: 'fecha de ingreso a urgencias' },
    { campo: 'fecha_salida', label: 'fecha de salida de urgencias' },
    { campo: 'causa_motivo_atencion', label: 'causa/motivo de atención' },
    { campo: 'estado_salida', label: 'estado de salida (vivo/muerto)' },
    { campo: 'cod_diagnostico_ingreso', label: 'diagnóstico de ingreso' },
    { campo: 'cod_diagnostico_salida', label: 'diagnóstico de salida' },
  ],
  AT: [{ campo: 'tipo_otro_servicio', label: 'tipo de otro servicio' }],
};
const CONCEPTOS_RECAUDO_SIN_COPAGO = ['05'];
const esNumerico = (v?: string | null) => !!v && /^\d+$/.test(v);

export interface ResultadoValidacionRips {
  clase: 'RECHAZADO' | 'NOTIFICACION';
  codigo: string;
  descripcion: string;
  observaciones: string;
  pathFuente: string;
  fuente: 'Paciente' | 'CuentaItem';
}
export interface ReporteValidacionRips {
  cuentaId: string;
  totalErrores: number;
  totalNotificaciones: number;
  puedeFacturar: boolean;
  resultados: ResultadoValidacionRips[];
}

@Injectable()
export class FacturacionService {
  private readonly logger = new Logger(FacturacionService.name);

  constructor(private readonly tenancyConnectionService: TenancyConnectionService) {}

  // ── INGRESOS ────────────────────────────────────────────────────────────

  /**
   * Crea Ingreso + Cuenta (ABIERTA) a partir de una cita. Idempotente: si la
   * cita ya tiene un ingreso, lo devuelve. Se invoca automáticamente al
   * admitir o completar una cita (ver CitasController) sin bloquear esa
   * acción si falla.
   */
  async crearIngresoYCuentaDesdeCita(citaId: string) {
    const pool = this.tenancyConnectionService.getTenantPool();

    const existente = await pool.query(`SELECT id FROM fac_ingresos WHERE cita_id = $1`, [citaId]);
    if (existente.rows.length > 0) {
      return this.obtenerIngresoPorId(existente.rows[0].id);
    }

    const citaRes = await pool.query(
      `SELECT c.paciente_id, c.profesional_id, p.entidad_salud
       FROM citas c
       JOIN pacientes p ON p.id = c.paciente_id
       WHERE c.id = $1`,
      [citaId],
    );
    if (citaRes.rows.length === 0) {
      throw new NotFoundException(`Cita con ID '${citaId}' no encontrada`);
    }
    const cita = citaRes.rows[0];

    const result = await pool.query(
      `INSERT INTO fac_ingresos (paciente_id, cita_id, medico_id, tipo_ingreso, entidad, estado)
       VALUES ($1, $2, $3, 'AMBULATORIO', $4, 'ACTIVO')
       RETURNING id;`,
      [cita.paciente_id, citaId, cita.profesional_id, cita.entidad_salud ?? null],
    );
    const ingresoId = result.rows[0].id;

    await pool.query(`INSERT INTO fac_cuentas (ingreso_id, estado) VALUES ($1, 'ABIERTA');`, [ingresoId]);

    this.logger.log(`Ingreso [${ingresoId}] + cuenta creados automáticamente desde cita [${citaId}]`);
    return this.obtenerIngresoPorId(ingresoId);
  }

  async crearIngreso(dto: CreateIngresoDto) {
    const pool = this.tenancyConnectionService.getTenantPool();

    const pacienteExiste = await pool.query(`SELECT id FROM pacientes WHERE id = $1`, [dto.pacienteId]);
    if (pacienteExiste.rows.length === 0) {
      throw new NotFoundException(`Paciente con ID '${dto.pacienteId}' no encontrado`);
    }

    const result = await pool.query(
      `INSERT INTO fac_ingresos (paciente_id, medico_id, tipo_ingreso, entidad, plan, observaciones, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVO')
       RETURNING id;`,
      [
        dto.pacienteId,
        dto.medicoId ?? null,
        dto.tipoIngreso || 'AMBULATORIO',
        dto.entidad ?? null,
        dto.plan ?? null,
        dto.observaciones ?? null,
      ],
    );
    const ingresoId = result.rows[0].id;
    await pool.query(`INSERT INTO fac_cuentas (ingreso_id, estado) VALUES ($1, 'ABIERTA');`, [ingresoId]);

    return this.obtenerIngresoPorId(ingresoId);
  }

  async listarIngresos(search?: string, estado?: string) {
    const pool = this.tenancyConnectionService.getTenantPool();
    const condiciones: string[] = [];
    const params: any[] = [];

    if (estado) {
      params.push(estado);
      condiciones.push(`i.estado = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      condiciones.push(`(p.nombre_completo ILIKE $${params.length} OR p.numero_documento ILIKE $${params.length})`);
    }
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT i.*,
        p.id AS pac_id, p.nombre_completo AS pac_nombre, p.numero_documento AS pac_doc, p.tipo_documento AS pac_tipo_doc,
        u.primer_nombre AS med_nombre, u.primer_apellido AS med_apellido
       FROM fac_ingresos i
       JOIN pacientes p ON p.id = i.paciente_id
       LEFT JOIN usuarios u ON u.id = i.medico_id
       ${where}
       ORDER BY i.created_at DESC
       LIMIT 100;`,
      params,
    );

    const ingresoIds = result.rows.map((r) => r.id);
    const cuentasPorIngreso = await this.obtenerCuentasResumenPorIngresos(ingresoIds);

    return result.rows.map((row) => this.mapIngresoRow(row, cuentasPorIngreso[row.id] || []));
  }

  async obtenerIngresoPorId(id: string) {
    const pool = this.tenancyConnectionService.getTenantPool();
    const result = await pool.query(
      `SELECT i.*,
        p.id AS pac_id, p.nombre_completo AS pac_nombre, p.numero_documento AS pac_doc, p.tipo_documento AS pac_tipo_doc,
        p.fecha_nacimiento AS pac_fecha_nacimiento, p.genero AS pac_genero,
        u.primer_nombre AS med_nombre, u.primer_apellido AS med_apellido
       FROM fac_ingresos i
       JOIN pacientes p ON p.id = i.paciente_id
       LEFT JOIN usuarios u ON u.id = i.medico_id
       WHERE i.id = $1;`,
      [id],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Ingreso con ID '${id}' no encontrado`);
    }
    const row = result.rows[0];
    const cuentasPorIngreso = await this.obtenerCuentasResumenPorIngresos([id]);
    return this.mapIngresoRow(row, cuentasPorIngreso[id] || []);
  }

  private async obtenerCuentasResumenPorIngresos(ingresoIds: string[]): Promise<Record<string, any[]>> {
    if (ingresoIds.length === 0) return {};
    const pool = this.tenancyConnectionService.getTenantPool();
    const result = await pool.query(
      `SELECT c.id, c.numero, c.estado, c.ingreso_id,
        COALESCE(SUM(it.valor_total), 0) AS total,
        COUNT(it.id)::int AS total_items,
        f.id AS factura_id, f.numero AS factura_numero, f.prefijo AS factura_prefijo, f.estado AS factura_estado
       FROM fac_cuentas c
       LEFT JOIN fac_cuenta_items it ON it.cuenta_id = c.id
       LEFT JOIN fac_facturas f ON f.cuenta_id = c.id
       WHERE c.ingreso_id = ANY($1::uuid[])
       GROUP BY c.id, f.id
       ORDER BY c.numero ASC;`,
      [ingresoIds],
    );

    const agrupado: Record<string, any[]> = {};
    for (const row of result.rows) {
      if (!agrupado[row.ingreso_id]) agrupado[row.ingreso_id] = [];
      agrupado[row.ingreso_id].push({
        id: row.id,
        numero: row.numero,
        estado: row.estado,
        total: round2(Number(row.total)),
        _count: { items: row.total_items },
        factura: row.factura_id
          ? { id: row.factura_id, numero: row.factura_numero, prefijo: row.factura_prefijo, estado: row.factura_estado }
          : null,
      });
    }
    return agrupado;
  }

  private mapIngresoRow(row: any, cuentas: any[]) {
    return {
      id: row.id,
      numero: row.numero,
      estado: row.estado,
      tipoIngreso: row.tipo_ingreso,
      entidad: row.entidad,
      plan: row.plan,
      fechaIngreso: row.fecha_ingreso,
      paciente: {
        id: row.pac_id,
        nombreCompleto: row.pac_nombre,
        numeroDocumento: row.pac_doc,
        tipoDocumento: row.pac_tipo_doc,
        ...(row.pac_fecha_nacimiento !== undefined ? { fechaNacimiento: row.pac_fecha_nacimiento } : {}),
        ...(row.pac_genero !== undefined ? { genero: row.pac_genero } : {}),
      },
      medico: row.med_nombre ? { id: row.medico_id, nombre: row.med_nombre, apellido: row.med_apellido } : null,
      cuentas,
    };
  }

  // ── CUENTAS ─────────────────────────────────────────────────────────────

  async obtenerCuentaPorId(id: string) {
    const pool = this.tenancyConnectionService.getTenantPool();
    const cuentaRes = await pool.query(`SELECT * FROM fac_cuentas WHERE id = $1;`, [id]);
    if (cuentaRes.rows.length === 0) {
      throw new NotFoundException(`Cuenta con ID '${id}' no encontrada`);
    }
    const cuenta = cuentaRes.rows[0];

    const [itemsRes, facturaRes, ingreso] = await Promise.all([
      pool.query(`SELECT * FROM fac_cuenta_items WHERE cuenta_id = $1 ORDER BY created_at ASC;`, [id]),
      pool.query(`SELECT * FROM fac_facturas WHERE cuenta_id = $1;`, [id]),
      this.obtenerIngresoPorId(cuenta.ingreso_id),
    ]);

    const items = itemsRes.rows.map((r) => this.mapCuentaItemRow(r));
    const total = round2(items.reduce((s, it) => s + it.valorTotal, 0));

    return {
      id: cuenta.id,
      numero: cuenta.numero,
      estado: cuenta.estado,
      total,
      items,
      factura: facturaRes.rows[0] ? this.mapFacturaRow(facturaRes.rows[0]) : null,
      ingreso: {
        id: ingreso.id,
        numero: ingreso.numero,
        tipoIngreso: ingreso.tipoIngreso,
        entidad: ingreso.entidad,
        plan: ingreso.plan,
        paciente: ingreso.paciente,
        medico: ingreso.medico,
      },
    };
  }

  private mapCuentaItemRow(row: any) {
    return {
      id: row.id,
      cargoId: row.cargo_id,
      codigo: row.codigo,
      descripcion: row.descripcion,
      departamento: row.departamento,
      cantidad: Number(row.cantidad),
      precioUnitario: Number(row.precio_unitario),
      valorTotal: Number(row.valor_total),
      tipoRips: row.tipo_rips,
      codDiagnosticoPrincipal: row.cod_diagnostico_principal,
      tipoDiagnosticoPrincipal: row.tipo_diagnostico_principal,
      finalidadTecnologiaSalud: row.finalidad_tecnologia_salud,
      causaMotivoAtencion: row.causa_motivo_atencion,
      viaIngresoServicioSalud: row.via_ingreso_servicio_salud,
      modalidadGrupoServicioTecSal: row.modalidad_grupo_servicio_tec_sal,
      numAutorizacion: row.num_autorizacion,
      codPrestador: row.cod_prestador,
      conceptoRecaudo: row.concepto_recaudo,
      valorPagoModerador: row.valor_pago_moderador !== null ? Number(row.valor_pago_moderador) : null,
      ambitoRealizacionProcedimiento: row.ambito_realizacion_procedimiento,
      viaAccesoQuirurgico: row.via_acceso_quirurgico,
      numMipres: row.num_mipres,
      fechaAtencion: row.fecha_atencion,
      fechaIngreso: row.fecha_ingreso,
      fechaSalida: row.fecha_salida,
      estadoSalida: row.estado_salida,
      destinoUsuarioEgreso: row.destino_usuario_egreso,
      codDiagnosticoIngreso: row.cod_diagnostico_ingreso,
      codDiagnosticoSalida: row.cod_diagnostico_salida,
      codDiagnosticoMuerte: row.cod_diagnostico_muerte,
      tipoOtroServicio: row.tipo_otro_servicio,
    };
  }

  async agregarCuentaItem(cuentaId: string, dto: CreateCuentaItemDto) {
    const pool = this.tenancyConnectionService.getTenantPool();
    const cuentaRes = await pool.query(`SELECT estado FROM fac_cuentas WHERE id = $1;`, [cuentaId]);
    if (cuentaRes.rows.length === 0) throw new NotFoundException(`Cuenta con ID '${cuentaId}' no encontrada`);
    if (cuentaRes.rows[0].estado !== 'ABIERTA') throw new ConflictException('La cuenta no está abierta');

    const descripcion = (dto.descripcion || '').trim();
    if (!descripcion) throw new BadRequestException('La descripción es requerida');

    const cantidad = Math.max(dto.cantidad ?? 1, 0.01);
    const precioUnitario = Number.isFinite(dto.precioUnitario) ? (dto.precioUnitario as number) : 0;
    const valorTotal = round2(precioUnitario * cantidad);
    const codigo = dto.codigo || null;
    const tipoRips = dto.tipoRips || (codigo ? clasificarTipoRips(codigo) : null);

    const result = await pool.query(
      `INSERT INTO fac_cuenta_items (
        cuenta_id, cargo_id, codigo, descripcion, departamento, cantidad, precio_unitario, valor_total, tipo_rips,
        cod_diagnostico_principal, tipo_diagnostico_principal, finalidad_tecnologia_salud, causa_motivo_atencion,
        via_ingreso_servicio_salud, modalidad_grupo_servicio_tec_sal, num_autorizacion, cod_prestador,
        concepto_recaudo, valor_pago_moderador, ambito_realizacion_procedimiento, via_acceso_quirurgico, num_mipres,
        fecha_atencion, fecha_ingreso, fecha_salida, estado_salida, destino_usuario_egreso,
        cod_diagnostico_ingreso, cod_diagnostico_salida, cod_diagnostico_muerte, tipo_otro_servicio
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31
      ) RETURNING *;`,
      [
        cuentaId,
        dto.cargoId ?? null,
        codigo,
        descripcion,
        dto.departamento ?? null,
        cantidad,
        precioUnitario,
        valorTotal,
        tipoRips,
        dto.codDiagnosticoPrincipal ?? null,
        dto.tipoDiagnosticoPrincipal ?? null,
        dto.finalidadTecnologiaSalud ?? null,
        dto.causaMotivoAtencion ?? null,
        dto.viaIngresoServicioSalud ?? null,
        dto.modalidadGrupoServicioTecSal ?? null,
        dto.numAutorizacion ?? null,
        dto.codPrestador ?? null,
        dto.conceptoRecaudo ?? null,
        dto.valorPagoModerador ?? null,
        dto.ambitoRealizacionProcedimiento ?? null,
        dto.viaAccesoQuirurgico ?? null,
        dto.numMipres ?? null,
        dto.fechaAtencion ?? null,
        dto.fechaIngreso ?? null,
        dto.fechaSalida ?? null,
        dto.estadoSalida ?? null,
        dto.destinoUsuarioEgreso ?? null,
        dto.codDiagnosticoIngreso ?? null,
        dto.codDiagnosticoSalida ?? null,
        dto.codDiagnosticoMuerte ?? null,
        dto.tipoOtroServicio ?? null,
      ],
    );

    return this.mapCuentaItemRow(result.rows[0]);
  }

  async actualizarCuentaItem(cuentaId: string, itemId: string, dto: UpdateCuentaItemDto) {
    const pool = this.tenancyConnectionService.getTenantPool();
    const itemRes = await pool.query(
      `SELECT it.*, c.estado AS cuenta_estado
       FROM fac_cuenta_items it JOIN fac_cuentas c ON c.id = it.cuenta_id
       WHERE it.id = $1 AND it.cuenta_id = $2;`,
      [itemId, cuentaId],
    );
    if (itemRes.rows.length === 0) throw new NotFoundException(`Ítem con ID '${itemId}' no encontrado`);
    const item = itemRes.rows[0];
    if (item.cuenta_estado !== 'ABIERTA') throw new ConflictException('La cuenta no está abierta');

    const cantidad = dto.cantidad !== undefined ? Math.max(dto.cantidad, 0.01) : Number(item.cantidad);
    const precioUnitario = dto.precioUnitario !== undefined ? dto.precioUnitario : Number(item.precio_unitario);
    const valorTotal = round2(precioUnitario * cantidad);

    const result = await pool.query(
      `UPDATE fac_cuenta_items SET
        cantidad = $1, precio_unitario = $2, valor_total = $3,
        descripcion = COALESCE($4, descripcion),
        departamento = CASE WHEN $5::text IS NOT NULL THEN NULLIF($5, '') ELSE departamento END,
        tipo_rips = CASE WHEN $6::text IS NOT NULL THEN NULLIF($6, '') ELSE tipo_rips END,
        updated_at = now()
       WHERE id = $7
       RETURNING *;`,
      [cantidad, precioUnitario, valorTotal, dto.descripcion ?? null, dto.departamento ?? null, dto.tipoRips ?? null, itemId],
    );

    return this.mapCuentaItemRow(result.rows[0]);
  }

  async eliminarCuentaItem(cuentaId: string, itemId: string): Promise<{ success: true }> {
    const pool = this.tenancyConnectionService.getTenantPool();
    const itemRes = await pool.query(
      `SELECT it.id, c.estado AS cuenta_estado
       FROM fac_cuenta_items it JOIN fac_cuentas c ON c.id = it.cuenta_id
       WHERE it.id = $1 AND it.cuenta_id = $2;`,
      [itemId, cuentaId],
    );
    if (itemRes.rows.length === 0) throw new NotFoundException(`Ítem con ID '${itemId}' no encontrado`);
    if (itemRes.rows[0].cuenta_estado !== 'ABIERTA') throw new ConflictException('La cuenta no está abierta');

    await pool.query(`DELETE FROM fac_cuenta_items WHERE id = $1;`, [itemId]);
    return { success: true };
  }

  /**
   * Búsqueda de cargos facturables para adicionar a una cuenta. Fuente actual:
   * `tipos_consulta_cups` (códigos CUPS ya asociados a tipos de consulta para
   * RIPS). Es un catálogo mínimo, no el oficial de la Resolución 2706/2025
   * (esa importación masiva queda para una fase posterior) — mientras tanto
   * el usuario también puede escribir un ítem manual sin cargoId.
   */
  async buscarCargos(search?: string) {
    const pool = this.tenancyConnectionService.getTenantPool();
    const condiciones = ['tcc.activo = true'];
    const params: any[] = [];
    if (search) {
      params.push(`%${search}%`);
      condiciones.push(`(tcc.nombre_procedimiento ILIKE $${params.length} OR tcc.codigo_cups ILIKE $${params.length})`);
    }

    const result = await pool.query(
      `SELECT DISTINCT ON (tcc.codigo_cups) tcc.id, tcc.codigo_cups, tcc.nombre_procedimiento
       FROM tipos_consulta_cups tcc
       WHERE ${condiciones.join(' AND ')}
       ORDER BY tcc.codigo_cups, tcc.nombre_procedimiento
       LIMIT 25;`,
      params,
    );

    return result.rows.map((row) => ({
      id: row.id,
      codigo: row.codigo_cups,
      descripcion: row.nombre_procedimiento,
      cupsCodigoStr: row.codigo_cups,
      grupo: null,
      precioSugerido: 0,
      tipoRips: clasificarTipoRips(row.codigo_cups),
    }));
  }

  // ── VALIDACIÓN RIPS ─────────────────────────────────────────────────────

  async validarRips(cuentaId: string): Promise<ReporteValidacionRips> {
    const pool = this.tenancyConnectionService.getTenantPool();
    const cuentaRes = await pool.query(
      `SELECT c.id, i.paciente_id
       FROM fac_cuentas c JOIN fac_ingresos i ON i.id = c.ingreso_id
       WHERE c.id = $1;`,
      [cuentaId],
    );
    if (cuentaRes.rows.length === 0) throw new NotFoundException(`Cuenta con ID '${cuentaId}' no encontrada`);

    const pacienteRes = await pool.query(
      `SELECT tipo_documento, numero_documento, fecha_nacimiento, genero, ciudad FROM pacientes WHERE id = $1;`,
      [cuentaRes.rows[0].paciente_id],
    );
    const paciente = pacienteRes.rows[0];

    const itemsRes = await pool.query(`SELECT * FROM fac_cuenta_items WHERE cuenta_id = $1;`, [cuentaId]);
    const items = itemsRes.rows;

    const resultados: ResultadoValidacionRips[] = [];

    if (!paciente.tipo_documento || !paciente.numero_documento) {
      resultados.push({
        clase: 'RECHAZADO',
        codigo: 'RVS-01',
        descripcion: 'El paciente debe tener tipo y número de documento de identificación',
        observaciones: `tipoDocumento=${paciente.tipo_documento || '—'} numeroDocumento=${paciente.numero_documento || '—'}`,
        pathFuente: 'usuarios[0].tipoDocumentoIdentificacion / numDocumentoIdentificacion',
        fuente: 'Paciente',
      });
    }
    if (!paciente.fecha_nacimiento) {
      resultados.push({
        clase: 'RECHAZADO',
        codigo: 'RVS-02',
        descripcion: 'El paciente debe tener fecha de nacimiento',
        observaciones: 'fechaNacimiento vacía',
        pathFuente: 'usuarios[0].fechaNacimiento',
        fuente: 'Paciente',
      });
    }
    const sexo = (paciente.genero || '').toUpperCase().charAt(0);
    if (!paciente.genero || !['M', 'F'].includes(sexo)) {
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

    if (items.length === 0) {
      resultados.push({
        clase: 'RECHAZADO',
        codigo: 'RVS-05',
        descripcion: 'La cuenta no tiene ítems/servicios para reportar en el RIPS',
        observaciones: '',
        pathFuente: 'usuarios[0].servicios',
        fuente: 'CuentaItem',
      });
    }

    items.forEach((item, idx) => {
      const ruta = `usuarios[0].servicios[${idx}]`;
      const tipoRips: string = item.tipo_rips || clasificarTipoRips(item.codigo);
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
      if (!item.cod_diagnostico_principal) {
        resultados.push({
          clase: 'RECHAZADO',
          codigo: 'RVS-07',
          descripcion: 'Falta el diagnóstico principal del servicio',
          observaciones: `Ítem "${item.descripcion}" sin codDiagnosticoPrincipal`,
          pathFuente: `${ruta}.codDiagnosticoPrincipal`,
          fuente: 'CuentaItem',
        });
      }

      const requeridos = CAMPOS_OBLIGATORIOS_POR_COMPONENTE[tipoRips] ?? [];
      for (const { campo, label } of requeridos) {
        const valor = item[campo];
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
      if (['AH', 'AU'].includes(tipoRips) && item.estado_salida === '2' && !item.cod_diagnostico_muerte) {
        resultados.push({
          clase: 'RECHAZADO',
          codigo: 'RVS-15',
          descripcion: `[${tipoRips} — ${nombreComponente}] Falta el diagnóstico de causa de muerte`,
          observaciones: `Ítem "${item.descripcion}" con estadoSalida=2 (fallecido) sin codDiagnosticoMuerte`,
          pathFuente: `${ruta}.codDiagnosticoMuerte`,
          fuente: 'CuentaItem',
        });
      }
      if (!item.cod_prestador) {
        resultados.push({
          clase: 'NOTIFICACION',
          codigo: 'RVS-10',
          descripcion: 'Se recomienda registrar el código del prestador que ejecutó el servicio',
          observaciones: `Ítem "${item.descripcion}" sin codPrestador`,
          pathFuente: `${ruta}.codPrestador`,
          fuente: 'CuentaItem',
        });
      }
      if (item.concepto_recaudo) {
        const debeSerCero = CONCEPTOS_RECAUDO_SIN_COPAGO.includes(item.concepto_recaudo);
        const valor = Number(item.valor_pago_moderador ?? 0);
        if (debeSerCero && valor > 0) {
          resultados.push({
            clase: 'RECHAZADO',
            codigo: 'RVS-11',
            descripcion: 'El valor de pago moderador debe ser 0 cuando el concepto de recaudo no aplica copago',
            observaciones: `conceptoRecaudo="${item.concepto_recaudo}" valorPagoModerador=${valor} en "${item.descripcion}"`,
            pathFuente: `${ruta}.valorPagoModerador`,
            fuente: 'CuentaItem',
          });
        } else if (!debeSerCero && valor <= 0) {
          resultados.push({
            clase: 'RECHAZADO',
            codigo: 'RVS-12',
            descripcion: 'El valor de pago moderador debe ser mayor a 0 para este concepto de recaudo',
            observaciones: `conceptoRecaudo="${item.concepto_recaudo}" valorPagoModerador=${valor} en "${item.descripcion}"`,
            pathFuente: `${ruta}.valorPagoModerador`,
            fuente: 'CuentaItem',
          });
        }
      }
    });

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

  // ── FACTURAS ────────────────────────────────────────────────────────────

  async facturarCuenta(cuentaId: string, dto: FacturarCuentaDto) {
    const pool = this.tenancyConnectionService.getTenantPool();
    const cuentaRes = await pool.query(
      `SELECT c.*, i.paciente_id, i.entidad, i.plan,
        (SELECT id FROM fac_facturas WHERE cuenta_id = c.id) AS factura_id
       FROM fac_cuentas c JOIN fac_ingresos i ON i.id = c.ingreso_id
       WHERE c.id = $1;`,
      [cuentaId],
    );
    if (cuentaRes.rows.length === 0) throw new NotFoundException(`Cuenta con ID '${cuentaId}' no encontrada`);
    const cuenta = cuentaRes.rows[0];

    if (cuenta.factura_id) throw new ConflictException('La cuenta ya fue facturada');
    if (cuenta.estado !== 'ABIERTA') throw new ConflictException('La cuenta no está abierta');

    const itemsRes = await pool.query(`SELECT valor_total FROM fac_cuenta_items WHERE cuenta_id = $1;`, [cuentaId]);
    if (itemsRes.rows.length === 0) throw new BadRequestException('La cuenta no tiene ítems para facturar');

    if (!dto.omitirValidacionRips) {
      const reporte = await this.validarRips(cuentaId);
      if (!reporte.puedeFacturar) {
        throw new UnprocessableEntityException({
          error: 'La cuenta tiene información RIPS pendiente por corregir antes de facturar',
          validacionRips: reporte,
        });
      }
    }

    const total = round2(itemsRes.rows.reduce((s, it) => s + Number(it.valor_total), 0));

    const facturaRes = await pool.query(
      `INSERT INTO fac_facturas (cuenta_id, paciente_id, entidad, plan, subtotal, total, estado, observaciones)
       VALUES ($1, $2, $3, $4, $5, $5, 'EMITIDA', $6)
       RETURNING *;`,
      [cuentaId, cuenta.paciente_id, cuenta.entidad, cuenta.plan, total, dto.observaciones ?? null],
    );
    await pool.query(`UPDATE fac_cuentas SET estado = 'FACTURADA', updated_at = now() WHERE id = $1;`, [cuentaId]);

    return this.mapFacturaRow(facturaRes.rows[0]);
  }

  async listarFacturas(search?: string, estado?: string) {
    const pool = this.tenancyConnectionService.getTenantPool();
    const condiciones: string[] = [];
    const params: any[] = [];
    if (estado) {
      params.push(estado);
      condiciones.push(`f.estado = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      condiciones.push(`(p.nombre_completo ILIKE $${params.length} OR p.numero_documento ILIKE $${params.length})`);
    }
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT f.*, p.id AS pac_id, p.nombre_completo AS pac_nombre, p.numero_documento AS pac_doc, p.tipo_documento AS pac_tipo_doc
       FROM fac_facturas f
       JOIN pacientes p ON p.id = f.paciente_id
       ${where}
       ORDER BY f.fecha DESC
       LIMIT 100;`,
      params,
    );

    return result.rows.map((row) => this.mapFacturaRow(row));
  }

  async obtenerFacturaPorId(id: string) {
    const pool = this.tenancyConnectionService.getTenantPool();
    const result = await pool.query(
      `SELECT f.*, p.id AS pac_id, p.nombre_completo AS pac_nombre, p.numero_documento AS pac_doc, p.tipo_documento AS pac_tipo_doc
       FROM fac_facturas f
       JOIN pacientes p ON p.id = f.paciente_id
       WHERE f.id = $1;`,
      [id],
    );
    if (result.rows.length === 0) throw new NotFoundException(`Factura con ID '${id}' no encontrada`);
    const factura = this.mapFacturaRow(result.rows[0]);
    const cuenta = await this.obtenerCuentaPorId(result.rows[0].cuenta_id);
    return { ...factura, cuenta };
  }

  async anularFactura(id: string): Promise<{ success: true }> {
    const pool = this.tenancyConnectionService.getTenantPool();
    const result = await pool.query(`SELECT * FROM fac_facturas WHERE id = $1;`, [id]);
    if (result.rows.length === 0) throw new NotFoundException(`Factura con ID '${id}' no encontrada`);
    const factura = result.rows[0];
    if (factura.estado === 'ANULADA') throw new ConflictException('La factura ya está anulada');

    await pool.query(`UPDATE fac_facturas SET estado = 'ANULADA', updated_at = now() WHERE id = $1;`, [id]);
    // Reabrir la cuenta para permitir correcciones
    await pool.query(`UPDATE fac_cuentas SET estado = 'ABIERTA', updated_at = now() WHERE id = $1;`, [factura.cuenta_id]);

    return { success: true };
  }

  private mapFacturaRow(row: any) {
    return {
      id: row.id,
      numero: row.numero,
      prefijo: row.prefijo,
      cuentaId: row.cuenta_id,
      estado: row.estado,
      subtotal: Number(row.subtotal),
      total: Number(row.total),
      entidad: row.entidad,
      plan: row.plan,
      fecha: row.fecha,
      paciente: row.pac_id
        ? { id: row.pac_id, nombreCompleto: row.pac_nombre, numeroDocumento: row.pac_doc, tipoDocumento: row.pac_tipo_doc }
        : undefined,
    };
  }

  // ── RESUMEN / KPIs ──────────────────────────────────────────────────────

  async getResumen() {
    const pool = this.tenancyConnectionService.getTenantPool();
    const [cuentasAbiertas, facturasEmitidas, totalFacturado] = await Promise.all([
      pool.query(`SELECT count(*)::int AS c FROM fac_cuentas WHERE estado = 'ABIERTA';`),
      pool.query(`SELECT count(*)::int AS c FROM fac_facturas WHERE estado = 'EMITIDA';`),
      pool.query(`SELECT COALESCE(SUM(total), 0) AS s FROM fac_facturas WHERE estado != 'ANULADA';`),
    ]);

    return {
      cuentasAbiertas: cuentasAbiertas.rows[0].c,
      facturasEmitidas: facturasEmitidas.rows[0].c,
      totalFacturado: round2(Number(totalFacturado.rows[0].s)),
    };
  }
}
