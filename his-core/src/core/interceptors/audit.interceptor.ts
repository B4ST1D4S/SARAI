import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/services/audit.service';
import { TenantContextService } from '../tenancy/services/tenant-context.service';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest();
    const res = httpCtx.getResponse();

    return next.handle().pipe(
      tap({
        next: () => {
          this.capturarAuditoria(req, res, startTime);
        },
        error: (err) => {
          this.capturarAuditoria(req, res, startTime, err);
        },
      }),
    );
  }

  private async capturarAuditoria(
    req: any,
    res: any,
    startTime: number,
    error?: any,
  ): Promise<void> {
    try {
      if (!req) return;

      const url = req.originalUrl || req.url || '';

      // Si la URL es de health check o endpoints excluidos, ignorar
      if (url.includes('/health')) {
        return;
      }

      // Obtener tenantId desde TenantContextService
      const tenantId = this.tenantContextService.getTenantId();
      if (!tenantId) {
        return;
      }

      const durationMs = Date.now() - startTime;
      const method = (req.method || 'GET').toUpperCase();

      // Usuario autenticado (extraído de req.user por JwtAuthGuard o fallback anónimo)
      const userObj = req.user;
      let usuarioIdentificador = 'ANONIMO_O_SISTEMA';
      let usuarioIdHis: string | undefined = undefined;

      if (userObj) {
        const rawId =
          userObj.id ||
          userObj.usuarioId ||
          userObj.sub ||
          userObj.userId ||
          userObj.username ||
          userObj.email;

        if (rawId) {
          usuarioIdentificador = String(rawId);
          if (UUID_REGEX.test(usuarioIdentificador)) {
            usuarioIdHis = usuarioIdentificador;
          }
        }
      }

      // IP de origen y User Agent
      const ip =
        req.ip ||
        req.headers?.['x-forwarded-for'] ||
        req.socket?.remoteAddress ||
        '127.0.0.1';
      const userAgent = req.headers?.['user-agent'] || 'Desconocido';

      // Deducción de tipo_evento
      let tipoEvento = 'CONSULTA_GENERAL';
      if (url.includes('/pdf')) {
        tipoEvento = 'DESCARGA_IMPRESION_HC';
      } else if (url.includes('/folios') && method === 'GET') {
        tipoEvento = 'LECTURA_HISTORIA_CLINICA';
      } else if (method === 'POST') {
        tipoEvento = 'CREACION_REGISTRO';
      } else if (method === 'PUT' || method === 'PATCH') {
        tipoEvento = 'ACTUALIZACION_REGISTRO';
      } else {
        tipoEvento = 'CONSULTA_GENERAL';
      }

      // Deducción de módulo
      let modulo = 'GENERAL';
      if (url.includes('/clinical-records') || url.includes('/folios')) {
        modulo = 'HISTORIA_CLINICA';
      } else if (url.includes('/rips')) {
        modulo = 'FACTURACION_RIPS';
      } else if (url.includes('/odontologia')) {
        modulo = 'ODONTOLOGIA';
      } else {
        modulo = 'GENERAL';
      }

      // Recurso afectado y recurso ID si aplica
      let recursoAfectado: string | undefined = undefined;
      let recursoId: string | undefined = undefined;

      if (url.includes('/folios')) recursoAfectado = 'hc_folios';
      else if (url.includes('/rips')) recursoAfectado = 'rips_lotes';
      else if (url.includes('/pacientes')) recursoAfectado = 'adm_pacientes';

      if (req.params?.id) {
        recursoId = String(req.params.id);
      }

      const statusCode = error
        ? error.status || error.statusCode || 500
        : res.statusCode || 200;

      const logData: Record<string, any> = {
        metodo_http: method,
        ruta: url,
        ip_origen: typeof ip === 'string' ? ip : String(ip),
        user_agent: userAgent,
        duracion_ms: durationMs,
        campos_consultados: Object.keys(req.query || {}),
        codigo_estado: statusCode,
        usuario: usuarioIdentificador,
      };

      if (error) {
        logData.error = {
          mensaje: error.message,
          tipo: error.name,
        };
      }

      // Invocar registro asíncrono
      await this.auditService.registrarLog(tenantId, {
        usuarioIdHis,
        tipoEvento,
        modulo,
        recursoAfectado,
        recursoId,
        logData,
        ipAddress: typeof ip === 'string' ? ip : String(ip),
      });
    } catch (err: any) {
      // Bloque silencioso para que un fallo en auditoría jamás rompa la respuesta médica al cliente
      this.logger.warn(
        `No se pudo registrar log de auditoría automático: ${err.message}`,
      );
    }
  }
}
