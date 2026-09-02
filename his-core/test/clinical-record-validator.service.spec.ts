import { BadRequestException } from '@nestjs/common';
import { ClinicalRecordValidatorService } from '../src/modules/clinical-record/services/clinical-record-validator.service';
import {
  EspecialidadClinica,
  TipoDiagnostico,
} from '../src/modules/clinical-record/dto/create-folio-consulta-externa.dto';
import {
  EstadoPiezaDental,
  SuperficieDental,
} from '../src/modules/clinical-record/dto/odontograma-data.dto';

describe('ClinicalRecordValidatorService (Programmatic JSONB Validation)', () => {
  let service: ClinicalRecordValidatorService;

  beforeEach(() => {
    service = new ClinicalRecordValidatorService();
  });

  const validOdontologiaPayload = () => ({
    atencionId: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f',
    pacienteId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    profesionalId: '123e4567-e89b-12d3-a456-426614174000',
    fechaAtencion: '2026-09-02T09:00:00.000Z',
    especialidad: EspecialidadClinica.ODONTOLOGIA,
    numeroFolio: 'FOL-ODONTO-101',
    anamnesis: {
      motivoConsulta: 'Sensibilidad dental en cuadrante 1',
      enfermedadActual: 'Refiere dolor al frío en pieza 16 desde hace 1 semana',
      antecedentes: {
        alergicos: 'Ninguno conocido',
      },
      revisionSistemas: {
        general: 'Sin hallazgos patológicos',
      },
    },
    signosVitales: {
      presionArterialSistolica: 120,
      presionArterialDiastolica: 80,
      frecuenciaCardiaca: 70,
      temperatura: 36.6,
    },
    diagnosticos: [
      {
        codigoCIE10: 'K02.0',
        descripcion: 'Caries limitada al esmalte',
        tipo: TipoDiagnostico.CONFIRMADO_NUEVO,
        esPrincipal: true,
      },
    ],
    planTratamiento: 'Fluorización y sellado de fosas y fisuras',
    datosOdontologia: {
      piezas: [
        {
          numeroPieza: 16,
          estadoGeneral: EstadoPiezaDental.CARIES,
          superficies: [
            {
              superficie: SuperficieDental.OCLUSAL,
              estado: EstadoPiezaDental.CARIES,
            },
          ],
        },
      ],
      indicePlacaCalculado: 12.0,
    },
  });

  it('debe validar programáticamente y retornar la instancia tipada de CreateFolioConsultaExternaDto', async () => {
    const payload = validOdontologiaPayload();
    const result = await service.validateFolioConsultaExterna(payload);

    expect(result).toBeDefined();
    expect(result.atencionId).toBe('c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f');
    expect(result.especialidad).toBe(EspecialidadClinica.ODONTOLOGIA);
    expect(result.datosOdontologia?.piezas[0].numeroPieza).toBe(16);
  });

  it('debe fallar si especialidad es ODONTOLOGIA pero no se envía datosOdontologia', async () => {
    const payload = validOdontologiaPayload();
    delete (payload as any).datosOdontologia;

    await expect(service.validateFolioConsultaExterna(payload)).rejects.toThrow(
      BadRequestException,
    );

    try {
      await service.validateFolioConsultaExterna(payload);
    } catch (err: any) {
      const response = err.getResponse();
      expect(response.message).toContain('reglas clínicas de negocio');
      expect(response.validationErrors[0].property).toBe('datosOdontologia');
    }
  });

  it('debe fallar si especialidad es MEDICINA_ESTETICA pero no se envía datosEstetica', async () => {
    const payload = {
      ...validOdontologiaPayload(),
      especialidad: EspecialidadClinica.MEDICINA_ESTETICA,
      datosOdontologia: undefined,
    };

    await expect(service.validateFolioConsultaExterna(payload)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('debe fallar si ningún diagnóstico está marcado como principal (esPrincipal: true)', async () => {
    const payload = validOdontologiaPayload();
    payload.diagnosticos[0].esPrincipal = false;

    await expect(service.validateFolioConsultaExterna(payload)).rejects.toThrow(
      /reglas clínicas de negocio/,
    );
  });

  it('debe fallar si hay más de un diagnóstico principal en el mismo folio', async () => {
    const payload = validOdontologiaPayload();
    payload.diagnosticos.push({
      codigoCIE10: 'K05.0',
      descripcion: 'Gingivitis aguda',
      tipo: TipoDiagnostico.CONFIRMADO_NUEVO,
      esPrincipal: true, // Segundo principal (inválido)
    });

    await expect(service.validateFolioConsultaExterna(payload)).rejects.toThrow(
      /reglas clínicas de negocio/,
    );
  });

  it('debe fallar si la presión sistólica es menor o igual a la diastólica', async () => {
    const payload = validOdontologiaPayload();
    payload.signosVitales.presionArterialSistolica = 70;
    payload.signosVitales.presionArterialDiastolica = 90;

    await expect(service.validateFolioConsultaExterna(payload)).rejects.toThrow(
      /reglas clínicas de negocio/,
    );
  });

  it('safeValidateFolioConsultaExterna debe retornar isValid: false con array de errores sin lanzar excepción', async () => {
    const invalidPayload = {
      pacienteId: 'not-a-uuid',
    };

    const result = await service.safeValidateFolioConsultaExterna(invalidPayload);

    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
    expect(result.data).toBeUndefined();
  });

  it('safeValidateFolioConsultaExterna debe retornar isValid: true con la data cuando el payload es correcto', async () => {
    const validPayload = validOdontologiaPayload();
    const result = await service.safeValidateFolioConsultaExterna(validPayload);

    expect(result.isValid).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it('debe validar directamente un payload de Odontograma standalone', async () => {
    const payload = {
      piezas: [
        {
          numeroPieza: 24,
          estadoGeneral: EstadoPiezaDental.SANO,
          superficies: [],
        },
      ],
      indicePlacaCalculado: 10,
    };

    const result = await service.validateOdontograma(payload);
    expect(result.piezas[0].numeroPieza).toBe(24);
  });

  it('debe validar directamente un payload de Estética standalone', async () => {
    const payload = {
      puntosTratados: [
        {
          zonaAnatomica: 'Entrecejo',
          coordenadas: { x: 0, y: 15, z: 2 },
        },
      ],
      insumos: [
        {
          nombreComercial: 'Dysport',
          numeroLote: 'DY-778',
          fechaVencimiento: '2027-08-01',
          cantidadAplicada: 50,
          unidadMedida: 'UI',
          zonaAplicacion: 'Músculo corrugador',
        },
      ],
    };

    const result = await service.validateEstetica(payload);
    expect(result.puntosTratados[0].zonaAnatomica).toBe('Entrecejo');
    expect(result.insumos[0].nombreComercial).toBe('Dysport');
  });

  it('debe rechazar payload si no es un objeto válido', async () => {
    await expect(service.validateGeneric(Object as any, null)).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      service.validateGeneric(Object as any, 'string-no-objeto'),
    ).rejects.toThrow(BadRequestException);
  });
});
