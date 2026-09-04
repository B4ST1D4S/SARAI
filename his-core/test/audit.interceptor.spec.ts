import { of, throwError, lastValueFrom } from 'rxjs';
import { AuditInterceptor } from '../src/core/interceptors/audit.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';

describe('AuditInterceptor (ISO/IEC 27001 - A.8.15 Logging)', () => {
  let interceptor: AuditInterceptor;
  let mockAuditService: any;
  let mockTenantContextService: any;

  beforeEach(() => {
    mockAuditService = {
      registrarLog: jest.fn().mockResolvedValue({ logId: 'log-123' }),
    };

    mockTenantContextService = {
      getTenantId: jest.fn().mockReturnValue('t-hospital-san-rafael'),
    };

    interceptor = new AuditInterceptor(
      mockAuditService,
      mockTenantContextService,
    );
  });

  function createMockExecutionContext(
    req: any,
    res: any = { statusCode: 200 },
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as any;
  }

  function createMockCallHandler(returnValue: any = { ok: true }): CallHandler {
    return {
      handle: () => of(returnValue),
    };
  }

  it('debe ignorar peticiones a rutas de health check (/health)', async () => {
    const req = {
      url: '/api/v1/health',
      method: 'GET',
      headers: {},
    };
    const context = createMockExecutionContext(req);
    const next = createMockCallHandler();

    await lastValueFrom(interceptor.intercept(context, next));

    expect(mockAuditService.registrarLog).not.toHaveBeenCalled();
  });

  it('debe ignorar peticiones si no hay tenantId en el contexto', async () => {
    mockTenantContextService.getTenantId.mockReturnValue(null);

    const req = {
      url: '/api/v1/clinical-records/folios',
      method: 'GET',
      headers: {},
    };
    const context = createMockExecutionContext(req);
    const next = createMockCallHandler();

    await lastValueFrom(interceptor.intercept(context, next));

    expect(mockAuditService.registrarLog).not.toHaveBeenCalled();
  });

  it('debe deducir DESCARGA_IMPRESION_HC e HISTORIA_CLINICA cuando la URL contiene /pdf', async () => {
    const req = {
      url: '/api/v1/clinical-records/folios/f-uuid-1/pdf',
      method: 'GET',
      ip: '190.24.50.12',
      headers: {
        'user-agent': 'Mozilla/5.0 MedicalClient/1.0',
      },
      params: { id: 'f-uuid-1' },
      query: { watermark: 'true' },
      user: {
        id: 'a0000000-1111-2222-3333-444444444444',
        username: 'dr_martinez',
      },
    };
    const context = createMockExecutionContext(req);
    const next = createMockCallHandler();

    await lastValueFrom(interceptor.intercept(context, next));

    expect(mockAuditService.registrarLog).toHaveBeenCalledWith(
      't-hospital-san-rafael',
      expect.objectContaining({
        tipoEvento: 'DESCARGA_IMPRESION_HC',
        modulo: 'HISTORIA_CLINICA',
        usuarioIdHis: 'a0000000-1111-2222-3333-444444444444',
        recursoAfectado: 'hc_folios',
        recursoId: 'f-uuid-1',
        ipAddress: '190.24.50.12',
        logData: expect.objectContaining({
          metodo_http: 'GET',
          ruta: '/api/v1/clinical-records/folios/f-uuid-1/pdf',
          user_agent: 'Mozilla/5.0 MedicalClient/1.0',
          campos_consultados: ['watermark'],
          codigo_estado: 200,
        }),
      }),
    );
  });

  it('debe deducir LECTURA_HISTORIA_CLINICA cuando se consulta un folio con GET', async () => {
    const req = {
      url: '/api/v1/clinical-records/folios/f-uuid-2',
      method: 'GET',
      headers: {},
      params: { id: 'f-uuid-2' },
    };
    const context = createMockExecutionContext(req);
    const next = createMockCallHandler();

    await lastValueFrom(interceptor.intercept(context, next));

    expect(mockAuditService.registrarLog).toHaveBeenCalledWith(
      't-hospital-san-rafael',
      expect.objectContaining({
        tipoEvento: 'LECTURA_HISTORIA_CLINICA',
        modulo: 'HISTORIA_CLINICA',
        usuarioIdHis: undefined,
        logData: expect.objectContaining({
          usuario: 'ANONIMO_O_SISTEMA',
        }),
      }),
    );
  });

  it('debe deducir CREACION_REGISTRO y FACTURACION_RIPS en POST /api/v1/rips/generar', async () => {
    const req = {
      url: '/api/v1/rips/generar',
      method: 'POST',
      headers: {},
    };
    const context = createMockExecutionContext(req, { statusCode: 202 });
    const next = createMockCallHandler();

    await lastValueFrom(interceptor.intercept(context, next));

    expect(mockAuditService.registrarLog).toHaveBeenCalledWith(
      't-hospital-san-rafael',
      expect.objectContaining({
        tipoEvento: 'CREACION_REGISTRO',
        modulo: 'FACTURACION_RIPS',
        recursoAfectado: 'rips_lotes',
      }),
    );
  });

  it('debe capturar auditoría aún si el controlador arroja error y no propagar fallo de auditoría', async () => {
    const req = {
      url: '/api/v1/clinical-records/folios/consulta-externa',
      method: 'POST',
      headers: {},
    };
    const context = createMockExecutionContext(req);
    const next: CallHandler = {
      handle: () => throwError(() => new Error('DB Connection Exception')),
    };

    // Simulamos que el registro de auditoría también falla
    mockAuditService.registrarLog.mockRejectedValueOnce(
      new Error('Audit DB Down'),
    );

    let errorCapturado: any;
    try {
      await lastValueFrom(interceptor.intercept(context, next));
    } catch (err: any) {
      errorCapturado = err;
    }

    expect(errorCapturado).toBeDefined();
    expect(errorCapturado.message).toBe('DB Connection Exception');
    expect(mockAuditService.registrarLog).toHaveBeenCalled();
  });
});
