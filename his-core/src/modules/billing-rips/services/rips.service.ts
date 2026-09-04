import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES, JOBS } from '../../../core/queue/constants/queue.constants';
import { TenancyConnectionService } from '../../../core/tenancy/services/tenancy-connection.service';
import { TenantService } from '../../../core/tenancy/services/tenant.service';
import {
  TenantContextService,
  TenantContext,
} from '../../../core/tenancy/services/tenant-context.service';
import { SpacesStorageService } from '../../../core/storage/services/spaces-storage.service';
import { GenerateRipsDto } from '../dto/generate-rips.dto';

export type EstadoRipsLote =
  | 'EN_COLA'
  | 'PROCESANDO'
  | 'VALIDADO'
  | 'RECHAZADO'
  | 'FALLIDO';

export interface EncolarRipsResponse {
  loteId: string;
  estado: EstadoRipsLote;
  message: string;
}

export interface RipsLoteDetalleResponse {
  id: string;
  numFactura: string | null;
  fechaInicio: string;
  fechaFin: string;
  tipoNota: string | null;
  numNota: string | null;
  estado: EstadoRipsLote;
  totalUsuarios: number;
  totalConsultas: number;
  totalProcedimientos: number;
  totalMedicamentos: number;
  jsonFileKey: string | null;
  hashSha256: string | null;
  erroresValidacion: any[] | null;
  downloadUrl?: string;
  creadoEn: Date;
  validadoEn: Date | null;
}

export interface RipsLoteDbRow {
  id: string;
  num_factura: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_nota: string | null;
  num_nota: string | null;
  estado: EstadoRipsLote;
  total_usuarios: number | null;
  total_consultas: number | null;
  total_procedimientos: number | null;
  total_medicamentos: number | null;
  json_file_key: string | null;
  hash_sha256: string | null;
  errores_validacion: any;
  creado_en: Date;
  validado_en: Date | null;
}

@Injectable()
export class RipsService {
  private readonly logger = new Logger(RipsService.name);

  constructor(
    @InjectQueue(QUEUES.RIPS_GENERATION)
    private readonly ripsQueue: Queue,
    private readonly tenancyConnectionService: TenancyConnectionService,
    private readonly spacesStorageService: SpacesStorageService,
    private readonly tenantService: TenantService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Registra un nuevo lote de RIPS en estado EN_COLA y lo agrega
   * al procesamiento asíncrono de BullMQ.
   *
   * @param tenantId Identificador UUID del tenant
   * @param dto Parámetros de generación de RIPS (rango de fechas, factura, etc.)
   */
  async encolarGeneracionRips(
    tenantId: string,
    dto: GenerateRipsDto,
  ): Promise<EncolarRipsResponse> {
    if (!tenantId) {
      throw new BadRequestException('tenantId es obligatorio para generar RIPS.');
    }

    const tenant = await this.tenantService.findById(tenantId);
    const tenantContext: TenantContext = {
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
      code: tenant.code,
      tenant,
      dbConfig: {
        host: tenant.dbHost,
        port: tenant.dbPort,
        database: tenant.dbName,
        username: tenant.dbUser,
      },
    };

    return this.tenantContextService.run(tenantContext, async () => {
      const insertQuery = `
        INSERT INTO rips_lotes (
          num_factura,
          fecha_inicio,
          fecha_fin,
          tipo_nota,
          num_nota,
          estado,
          total_usuarios,
          total_consultas,
          total_procedimientos,
          total_medicamentos,
          creado_en
        ) VALUES ($1, $2, $3, $4, $5, 'EN_COLA', 0, 0, 0, 0, NOW())
        RETURNING id;
      `;

      const result = await this.tenancyConnectionService.query<{ id: string }>(
        insertQuery,
        [
          dto.numFactura || null,
          dto.fechaInicio,
          dto.fechaFin,
          dto.tipoNota || 'NA',
          dto.numNota || null,
        ],
      );

      const loteId = result.rows[0].id;
      this.logger.log(
        `Lote de RIPS #${loteId} creado en estado EN_COLA para tenant [${tenantId}]`,
      );

      // Encolar trabajo en BullMQ
      await this.ripsQueue.add(
        JOBS.GENERATE_RIPS_JSON,
        { tenantId, loteId },
        {
          jobId: `rips-${tenantId}-${loteId}`,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      return {
        loteId,
        estado: 'EN_COLA',
        message: 'Generación de RIPS encolada con éxito.',
      };
    });
  }

  /**
   * Consulta el estado del lote de RIPS, los errores de validación y la URL de descarga
   * si el lote fue validado y generado en Spaces.
   *
   * @param tenantId Identificador UUID del tenant
   * @param loteId Identificador UUID del lote
   */
  async consultarEstadoLote(
    tenantId: string,
    loteId: string,
  ): Promise<RipsLoteDetalleResponse> {
    if (!tenantId || !loteId) {
      throw new BadRequestException('tenantId y loteId son obligatorios.');
    }

    const tenant = await this.tenantService.findById(tenantId);
    const tenantContext: TenantContext = {
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
      code: tenant.code,
      tenant,
      dbConfig: {
        host: tenant.dbHost,
        port: tenant.dbPort,
        database: tenant.dbName,
        username: tenant.dbUser,
      },
    };

    return this.tenantContextService.run(tenantContext, async () => {
      const selectQuery = `
        SELECT 
          id, num_factura, fecha_inicio, fecha_fin, tipo_nota, num_nota,
          estado, total_usuarios, total_consultas, total_procedimientos,
          total_medicamentos, json_file_key, hash_sha256, errores_validacion,
          creado_en, validado_en
        FROM rips_lotes
        WHERE id = $1;
      `;

      const result =
        await this.tenancyConnectionService.query<RipsLoteDbRow>(selectQuery, [
          loteId,
        ]);

      if (!result.rows || result.rows.length === 0) {
        throw new NotFoundException(
          `No se encontró el lote de RIPS con ID [${loteId}] en el tenant [${tenantId}].`,
        );
      }

      const row = result.rows[0];
      let downloadUrl: string | undefined = undefined;

      // Si el archivo fue generado y validado con éxito, generar URL de descarga temporal
      if (row.estado === 'VALIDADO' && row.json_file_key) {
        downloadUrl = await this.spacesStorageService.getPresignedDownloadUrl(
          row.json_file_key,
        );
      }

      let erroresParsed: any[] | null = null;
      if (row.errores_validacion) {
        erroresParsed =
          typeof row.errores_validacion === 'string'
            ? JSON.parse(row.errores_validacion)
            : row.errores_validacion;
      }

      return {
        id: row.id,
        numFactura: row.num_factura,
        fechaInicio: row.fecha_inicio,
        fechaFin: row.fecha_fin,
        tipoNota: row.tipo_nota,
        numNota: row.num_nota,
        estado: row.estado,
        totalUsuarios: row.total_usuarios || 0,
        totalConsultas: row.total_consultas || 0,
        totalProcedimientos: row.total_procedimientos || 0,
        totalMedicamentos: row.total_medicamentos || 0,
        jsonFileKey: row.json_file_key,
        hashSha256: row.hash_sha256,
        erroresValidacion: erroresParsed,
        downloadUrl,
        creadoEn: row.creado_en,
        validadoEn: row.validado_en,
      };
    });
  }
}
