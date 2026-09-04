import { RipsGeneratorWorker } from '../src/modules/billing-rips/processors/rips-generator.worker';
import { JOBS } from '../src/core/queue/constants/queue.constants';
import { Tenant, TenantStatus, TenantPlan } from '../src/core/tenancy/entities/tenant.entity';

describe('RipsGeneratorWorker (Resolución 2275 de 2023 - MinSalud)', () => {
  let worker: RipsGeneratorWorker;
  let mockTenancyConnectionService: any;
  let mockSpacesStorageService: any;
  let mockTenantService: any;
  let tenantContextService: any;

  const mockTenant: Tenant = {
    id: 't-rips-worker-001',
    name: 'Hospital Universitario Mayor',
    subdomain: 'humayor',
    code: '110010009988',
    status: TenantStatus.ACTIVE,
    plan: TenantPlan.HOSPITAL_ENTERPRISE,
    dbName: 'his_tenant_humayor',
    dbHost: 'localhost',
    dbPort: 5432,
    dbUser: 'usr_humayor',
    clinicalSettings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleLote = {
    id: 'l-00000000-1111-2222-3333-444444444444',
    num_factura: 'FEV-2026-999',
    fecha_inicio: '2026-09-01',
    fecha_fin: '2026-09-30',
    tipo_nota: 'NA',
    num_nota: null,
  };

  const validConsultas = [
    {
      folio_id: 'f-1',
      numero_folio: 101,
      paciente_id: 'p-1',
      profesional_id: 'med-1',
      fecha_atencion: '2026-09-05T10:00:00.000Z',
      especialidad_profesional: 'Medicina General',
      tipo_documento: 'CC',
      numero_documento: '1020304050',
      tipo_usuario: '01',
      fecha_nacimiento: '1985-03-20',
      cod_sexo: 'M',
      cod_pais_residencia: '170',
      cod_municipio_residencia: '11001',
      cod_zona_residencia: '01',
      incapacidad: false,
      cod_diagnostico_principal: 'K021',
      tipo_diagnostico: '01',
      diagnostico_descripcion: 'Caries de la dentina',
    },
  ];

  const validProcedimientos = [
    {
      id: 'proc-1',
      folio_id: 'f-1',
      paciente_id: 'p-1',
      cod_procedimiento_cups: '232101',
      via_ingreso_servicio_salud: '01',
      modalidad_grupo_servicio: '01',
      finalidad_tecnologia_salud: '01',
      cod_diagnostico_principal: 'K021',
      fecha_procedimiento: '2026-09-05T10:30:00.000Z',
      tipo_documento: 'CC',
      numero_documento: '1020304050',
    },
  ];

  const validMedicamentos = [
    {
      id: 'med-1',
      folio_id: 'f-1',
      paciente_id: 'p-1',
      cod_diagnostico_principal: 'K021',
      codigo_cum: '19958473-01',
      nombre_generico_dci: 'AMOXICILINA 500MG',
      forma_farmaceutica: 'Cápsula',
      concentracion: '500mg',
      codigo_upr: '001',
      unidad_dispensacion: 'Unidad',
      codigo_via_administracion: '01',
      via_administracion: 'Oral',
      cantidad_formulada: 21,
      dias_tratamiento: 7,
      fecha_prescripcion: '2026-09-05T11:00:00.000Z',
      tipo_documento: 'CC',
      numero_documento: '1020304050',
    },
  ];

  beforeEach(() => {
    mockTenancyConnectionService = {
      query: jest.fn(),
    };

    mockSpacesStorageService = {
      uploadRipsJsonBuffer: jest
        .fn()
        .mockResolvedValue(
          'tenants/t-rips-worker-001/rips/l-00000000-1111-2222-3333-444444444444.json',
        ),
    };

    mockTenantService = {
      findById: jest.fn().mockResolvedValue(mockTenant),
    };

    tenantContextService = {
      run: jest.fn().mockImplementation((context, callback) => callback()),
    };

    worker = new RipsGeneratorWorker(
      mockTenancyConnectionService,
      mockSpacesStorageService,
      mockTenantService,
      tenantContextService,
    );
  });

  it('debe ignorar trabajos cuyo nombre no sea GENERATE_RIPS_JSON', async () => {
    const job: any = {
      name: 'other-job-name',
      data: { tenantId: 't-rips-worker-001', loteId: 'lote-1' },
      id: 'job-ignore-rips',
    };

    const result = await worker.process(job);

    expect(result.estado).toBe('FALLIDO');
    expect(mockTenantService.findById).not.toHaveBeenCalled();
  });

  it('debe rechazar el lote si se detectan inconsistencias técnicas (falta diagnóstico CIE-10 o código UPR)', async () => {
    const invalidConsultas = [
      {
        folio_id: 'f-invalid-1',
        numero_folio: 202,
        paciente_id: 'p-2',
        fecha_atencion: '2026-09-06T10:00:00.000Z',
        tipo_documento: 'CC',
        numero_documento: '987654321',
        cod_diagnostico_principal: null, // Error: Falta CIE-10
      },
    ];

    const invalidMedicamentos = [
      {
        id: 'med-invalid-1',
        nombre_generico_dci: 'IBUPROFENO',
        codigo_upr: null, // Error: Falta UPR
      },
    ];

    mockTenancyConnectionService.query
      .mockResolvedValueOnce({ rows: [] }) // UPDATE estado = PROCESANDO
      .mockResolvedValueOnce({ rows: [sampleLote] }) // SELECT rips_lotes
      .mockResolvedValueOnce({ rows: invalidConsultas }) // Consultas
      .mockResolvedValueOnce({ rows: [] }) // Procedimientos
      .mockResolvedValueOnce({ rows: invalidMedicamentos }) // Medicamentos
      .mockResolvedValueOnce({ rows: [] }); // UPDATE estado = RECHAZADO

    const job: any = {
      name: JOBS.GENERATE_RIPS_JSON,
      data: {
        tenantId: 't-rips-worker-001',
        loteId: 'l-00000000-1111-2222-3333-444444444444',
      },
      id: 'job-rips-rejected',
    };

    const result = await worker.process(job);

    expect(result.estado).toBe('RECHAZADO');
    expect(result.errores?.length).toBe(2);

    expect(mockSpacesStorageService.uploadRipsJsonBuffer).not.toHaveBeenCalled();

    expect(mockTenancyConnectionService.query).toHaveBeenLastCalledWith(
      expect.stringContaining("UPDATE rips_lotes \n             SET estado = 'RECHAZADO'"),
      [expect.any(String), 'l-00000000-1111-2222-3333-444444444444'],
    );
  });

  it('debe validar, generar estructura Res. 2275, calcular SHA-256, subir a Spaces y marcar VALIDADO', async () => {
    mockTenancyConnectionService.query
      .mockResolvedValueOnce({ rows: [] }) // UPDATE PROCESANDO
      .mockResolvedValueOnce({ rows: [sampleLote] }) // SELECT rips_lotes
      .mockResolvedValueOnce({ rows: validConsultas }) // Consultas
      .mockResolvedValueOnce({ rows: validProcedimientos }) // Procedimientos
      .mockResolvedValueOnce({ rows: validMedicamentos }) // Medicamentos
      .mockResolvedValueOnce({ rows: [] }); // UPDATE VALIDADO

    const job: any = {
      name: JOBS.GENERATE_RIPS_JSON,
      data: {
        tenantId: 't-rips-worker-001',
        loteId: 'l-00000000-1111-2222-3333-444444444444',
      },
      id: 'job-rips-valid',
    };

    const result = await worker.process(job);

    expect(result.estado).toBe('VALIDADO');
    expect(result.totalUsuarios).toBe(1);
    expect(result.totalConsultas).toBe(1);
    expect(result.totalProcedimientos).toBe(1);
    expect(result.totalMedicamentos).toBe(1);
    expect(result.hashSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(result.fileKey).toBe(
      'tenants/t-rips-worker-001/rips/l-00000000-1111-2222-3333-444444444444.json',
    );

    expect(mockSpacesStorageService.uploadRipsJsonBuffer).toHaveBeenCalledWith(
      't-rips-worker-001',
      'l-00000000-1111-2222-3333-444444444444',
      expect.any(Buffer),
    );

    expect(mockTenancyConnectionService.query).toHaveBeenLastCalledWith(
      expect.stringContaining("UPDATE rips_lotes\n           SET estado = 'VALIDADO'"),
      [
        1,
        1,
        1,
        1,
        'tenants/t-rips-worker-001/rips/l-00000000-1111-2222-3333-444444444444.json',
        expect.any(String),
        'l-00000000-1111-2222-3333-444444444444',
      ],
    );
  });

  it('debe marcar estado FALLIDO y relanzar la excepción si ocurre un fallo en base de datos o almacenamiento', async () => {
    mockTenancyConnectionService.query
      .mockResolvedValueOnce({ rows: [] }) // UPDATE PROCESANDO
      .mockResolvedValueOnce({ rows: [sampleLote] }) // SELECT rips_lotes
      .mockResolvedValueOnce({ rows: validConsultas })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    mockSpacesStorageService.uploadRipsJsonBuffer.mockRejectedValueOnce(
      new Error('Spaces network timeout'),
    );

    const job: any = {
      name: JOBS.GENERATE_RIPS_JSON,
      data: {
        tenantId: 't-rips-worker-001',
        loteId: 'l-00000000-1111-2222-3333-444444444444',
      },
      id: 'job-rips-error',
    };

    await expect(worker.process(job)).rejects.toThrow('Spaces network timeout');

    expect(mockTenancyConnectionService.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE rips_lotes SET estado = 'FALLIDO' WHERE id = $1;"),
      ['l-00000000-1111-2222-3333-444444444444'],
    );
  });
});
