import { ClinicalPdfWorker } from '../src/modules/clinical-record/processors/clinical-pdf.worker';
import { JOBS } from '../src/core/queue/constants/queue.constants';
import { Tenant, TenantStatus, TenantPlan } from '../src/core/tenancy/entities/tenant.entity';

describe('ClinicalPdfWorker (PDF Compilation, QR & Spaces WORM)', () => {
  let worker: ClinicalPdfWorker;
  let mockTenancyConnectionService: any;
  let mockSpacesStorageService: any;
  let mockTenantService: any;
  let tenantContextService: any;

  const mockTenant: Tenant = {
    id: 't-worker-pdf-001',
    name: 'Clinica Santa Fe',
    subdomain: 'santafe',
    code: 'REPS-4433',
    status: TenantStatus.ACTIVE,
    plan: TenantPlan.HOSPITAL_ENTERPRISE,
    dbName: 'his_tenant_santafe',
    dbHost: 'localhost',
    dbPort: 5432,
    dbUser: 'usr_santafe',
    clinicalSettings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleFolio = {
    id: 'f-1111-2222-3333-4444',
    numero_folio: 42,
    atencion_id: 'a-1111-2222-3333-4444',
    paciente_id: 'p-1111-2222-3333-4444',
    profesional_id: 'med-dr-garcia',
    fecha_atencion: '2026-09-03T10:00:00.000Z',
    especialidad_profesional: 'Medicina Interna',
    registro_medico_rethus: 'RM-102030',
    firma_digital_hash: 'a3f5b7c8d9e0123456789abcdef0123456789abcdef0123456789abcdef01234',
    firma_digital_fecha: '2026-09-03T10:05:00.000Z',
    pdf_estado: 'EN_PROCESO',
    pdf_file_key: null,
  };

  const sampleAnamnesis = {
    motivo_consulta: 'Control médico y chequeo de hipertensión',
    enfermedad_actual: 'Paciente asintomático con cifras controladas.',
    antecedentes: { hta: true },
  };

  const sampleSignos = {
    presion_sistolica: 120,
    presion_diastolica: 80,
    frecuencia_cardiaca: 72,
    frecuencia_respiratoria: 16,
    temperatura: 36.5,
    saturacion_oxigeno: 98,
    peso_kg: 70,
    talla_cm: 172,
  };

  const sampleDiagnosticos = [
    {
      codigo_cie10: 'I10X',
      descripcion: 'Hipertensión esencial (primaria)',
      tipo_diagnostico: 'Confirmado Repetido',
      es_principal: true,
    },
  ];

  beforeEach(() => {
    mockTenancyConnectionService = {
      query: jest.fn(),
    };

    mockSpacesStorageService = {
      uploadClinicalPdfBuffer: jest
        .fn()
        .mockResolvedValue(
          'tenants/t-worker-pdf-001/clinical-records/f-1111-2222-3333-4444.pdf',
        ),
    };

    mockTenantService = {
      findById: jest.fn().mockResolvedValue(mockTenant),
    };

    tenantContextService = {
      run: jest.fn().mockImplementation((context, callback) => callback()),
    };

    worker = new ClinicalPdfWorker(
      mockTenancyConnectionService,
      mockSpacesStorageService,
      mockTenantService,
      tenantContextService,
    );
  });

  it('debe ignorar trabajos cuyo nombre no sea GENERATE_CLINICAL_PDF', async () => {
    const job: any = {
      name: 'other-job',
      data: { tenantId: 't-worker-pdf-001', folioId: 'f-1111' },
      id: 'job-ignore',
    };

    const result = await worker.process(job);

    expect(result.numeroFolio).toBe(0);
    expect(mockTenantService.findById).not.toHaveBeenCalled();
  });

  it('debe compilar el PDF con pdfmake, generar QR, subir a Spaces y actualizar estado a GENERADO', async () => {
    mockTenancyConnectionService.query
      .mockResolvedValueOnce({ rows: [sampleFolio] }) // SELECT hc_folios
      .mockResolvedValueOnce({ rows: [sampleAnamnesis] }) // SELECT hc_anamnesis
      .mockResolvedValueOnce({ rows: [sampleSignos] }) // SELECT hc_signos_vitales
      .mockResolvedValueOnce({ rows: sampleDiagnosticos }) // SELECT hc_diagnosticos
      .mockResolvedValueOnce({ rows: [] }); // UPDATE hc_folios

    const job: any = {
      name: JOBS.GENERATE_CLINICAL_PDF,
      data: {
        tenantId: 't-worker-pdf-001',
        folioId: 'f-1111-2222-3333-4444',
      },
      id: 'job-pdf-success',
    };

    const result = await worker.process(job);

    expect(result).toEqual({
      tenantId: 't-worker-pdf-001',
      folioId: 'f-1111-2222-3333-4444',
      numeroFolio: 42,
      fileKey: 'tenants/t-worker-pdf-001/clinical-records/f-1111-2222-3333-4444.pdf',
      pdfGeneradoEn: expect.any(Date),
    });

    // Verificar subida a Spaces con buffer binario
    expect(mockSpacesStorageService.uploadClinicalPdfBuffer).toHaveBeenCalledWith(
      't-worker-pdf-001',
      'f-1111-2222-3333-4444',
      expect.any(Buffer),
    );

    // Verificar actualización en base de datos
    expect(mockTenancyConnectionService.query).toHaveBeenLastCalledWith(
      expect.stringContaining("UPDATE hc_folios"),
      [
        'tenants/t-worker-pdf-001/clinical-records/f-1111-2222-3333-4444.pdf',
        expect.any(Date),
        'f-1111-2222-3333-4444',
      ],
    );
  });

  it('debe marcar estado FALLIDO y relanzar el error si ocurre un fallo durante la generación', async () => {
    mockTenancyConnectionService.query
      .mockResolvedValueOnce({ rows: [sampleFolio] }) // SELECT hc_folios
      .mockResolvedValueOnce({ rows: [sampleAnamnesis] }) // SELECT hc_anamnesis
      .mockResolvedValueOnce({ rows: [sampleSignos] }) // SELECT hc_signos_vitales
      .mockResolvedValueOnce({ rows: sampleDiagnosticos }) // SELECT hc_diagnosticos
      .mockResolvedValueOnce({ rows: [] }); // UPDATE hc_folios SET pdf_estado = 'FALLIDO'

    mockSpacesStorageService.uploadClinicalPdfBuffer.mockRejectedValueOnce(
      new Error('S3 upload timeout'),
    );

    const job: any = {
      name: JOBS.GENERATE_CLINICAL_PDF,
      data: {
        tenantId: 't-worker-pdf-001',
        folioId: 'f-1111-2222-3333-4444',
      },
      id: 'job-pdf-error',
    };

    await expect(worker.process(job)).rejects.toThrow('S3 upload timeout');

    expect(mockTenancyConnectionService.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE hc_folios SET pdf_estado = 'FALLIDO'"),
      ['f-1111-2222-3333-4444'],
    );
  });
});
