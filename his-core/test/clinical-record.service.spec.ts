import { InternalServerErrorException } from '@nestjs/common';
import { ClinicalRecordService } from '../src/modules/clinical-record/services/clinical-record.service';
import { ClinicalRecordValidatorService } from '../src/modules/clinical-record/services/clinical-record-validator.service';
import { TenancyConnectionService } from '../src/core/tenancy/services/tenancy-connection.service';
import {
  EspecialidadClinica,
  TipoDiagnostico,
} from '../src/modules/clinical-record/dto/create-folio-consulta-externa.dto';
import {
  EstadoPiezaDental,
  SuperficieDental,
} from '../src/modules/clinical-record/dto/odontograma-data.dto';

describe('ClinicalRecordService (Transactional Persistence)', () => {
  let service: ClinicalRecordService;
  let validatorService: ClinicalRecordValidatorService;
  let tenancyConnectionService: TenancyConnectionService;
  let mockClient: any;

  const validOdontoPayload = () => ({
    atencionId: '11111111-2222-4333-8444-555555555555',
    pacienteId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    profesionalId: '123e4567-e89b-12d3-a456-426614174000',
    fechaAtencion: '2026-09-02T09:00:00.000Z',
    especialidad: EspecialidadClinica.ODONTOLOGIA,
    numeroFolio: 'FOL-ODONTO-101',
    registroMedicoRethus: 'RM-778899-COL',
    tipoRegistro: 'CONSULTA_EXTERNA',
    ipRegistro: '192.168.1.50',
    anamnesis: {
      motivoConsulta: 'Dolor dental al masticar en cuadrante 1',
      enfermedadActual: 'Evolución de 4 días con dolor en pieza 16',
      antecedentes: {
        alergicos: 'Penicilina',
        patologicos: 'Ninguno',
      },
      revisionSistemas: {
        general: 'Sin hallazgos patológicos',
      },
    },
    signosVitales: {
      presionArterialSistolica: 120,
      presionArterialDiastolica: 80,
      frecuenciaCardiaca: 70,
      frecuenciaRespiratoria: 16,
      temperatura: 36.6,
      saturacionOxigeno: 98,
      pesoKg: 70,
      tallaCm: 175,
      indiceMasaCorporal: 22.86,
    },
    diagnosticos: [
      {
        codigoCIE10: 'K02.1',
        descripcion: 'Caries de la dentina en pieza 16',
        tipo: TipoDiagnostico.CONFIRMADO_NUEVO,
        esPrincipal: true,
      },
    ],
    planTratamiento: 'Obturación con resina fotocurable',
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
      indicePlacaCalculado: 15.0,
    },
  });

  const validEsteticaPayload = () => ({
    atencionId: '22222222-3333-4444-8555-666666666666',
    pacienteId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    profesionalId: '123e4567-e89b-12d3-a456-426614174000',
    fechaAtencion: '2026-09-02T10:00:00.000Z',
    especialidad: EspecialidadClinica.MEDICINA_ESTETICA,
    anamnesis: {
      motivoConsulta: 'Líneas de expresión en frente',
      enfermedadActual: 'Paciente desea rejuvenecimiento facial tercio superior',
      antecedentes: {
        alergicos: 'Ninguno',
      },
    },
    signosVitales: {
      presionArterialSistolica: 115,
      presionArterialDiastolica: 75,
      frecuenciaCardiaca: 68,
    },
    diagnosticos: [
      {
        codigoCIE10: 'L90.8',
        descripcion: 'Rítides faciales hipercinéticas',
        tipo: TipoDiagnostico.CONFIRMADO_NUEVO,
        esPrincipal: true,
      },
    ],
    planTratamiento: 'Aplicación de toxina botulínica en glabela y frontal',
    datosEstetica: {
      puntosTratados: [
        {
          zonaAnatomica: 'Glabela',
          coordenadas: { x: 0, y: 10, z: 2 },
          nivelDolor: 2,
        },
      ],
      insumos: [
        {
          nombreComercial: 'Botox',
          numeroLote: 'LOT-BTX-2026',
          fechaVencimiento: '2028-10-31',
          cantidadAplicada: 20,
          unidadMedida: 'UI',
          zonaAplicacion: 'Músculos corrugadores',
        },
      ],
      fotos: {
        antes: ['tenants/t1/antes_01.webp'],
        despues: ['tenants/t1/despues_01.webp'],
      },
    },
  });

  beforeEach(() => {
    validatorService = new ClinicalRecordValidatorService();
    tenancyConnectionService = new TenancyConnectionService({} as any);

    mockClient = {
      query: jest.fn().mockImplementation((queryText: string) => {
        if (queryText.includes('next_folio')) {
          return Promise.resolve({ rows: [{ next_folio: '5' }] });
        }
        if (queryText.includes('INSERT INTO hc_folios')) {
          return Promise.resolve({
            rows: [{ id: 'folio-uuid-generated-1234', numero_folio: 5 }],
          });
        }
        return Promise.resolve({ rows: [] });
      }),
      release: jest.fn(),
    };

    jest
      .spyOn(tenancyConnectionService, 'transaction')
      .mockImplementation(async (callback) => {
        return callback(mockClient);
      });

    service = new ClinicalRecordService(
      tenancyConnectionService,
      validatorService,
    );
  });

  it('debe persistir exitosamente un folio odontológico con todas sus secciones transaccionales', async () => {
    const payload = validOdontoPayload();
    const result = await service.crearFolioConsultaExterna(payload);

    expect(result).toEqual({
      folioId: 'folio-uuid-generated-1234',
      numeroFolio: 5,
    });

    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('next_folio'),
      [payload.pacienteId],
    );

    // Inserción en hc_folios con firma hash
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO hc_folios'),
      expect.arrayContaining([
        payload.atencionId,
        payload.pacienteId,
        payload.profesionalId,
        EspecialidadClinica.ODONTOLOGIA,
        'RM-778899-COL',
        5,
        'CONSULTA_EXTERNA',
        'BORRADOR',
        expect.any(String), // firma_digital_hash SHA-256
        '192.168.1.50',
      ]),
    );

    // Inserción en hc_anamnesis
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO hc_anamnesis'),
      expect.arrayContaining([
        'folio-uuid-generated-1234',
        payload.anamnesis.motivoConsulta,
        payload.anamnesis.enfermedadActual,
        expect.any(String),
      ]),
    );

    // Inserción en hc_signos_vitales
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO hc_signos_vitales'),
      expect.arrayContaining([
        'folio-uuid-generated-1234',
        120,
        80,
        70,
      ]),
    );

    // Inserción en hc_diagnosticos
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO hc_diagnosticos'),
      expect.arrayContaining([
        'folio-uuid-generated-1234',
        payload.atencionId,
        'K02.1',
        'Caries de la dentina en pieza 16',
        'EVOLUCION',
        'PRINCIPAL',
        TipoDiagnostico.CONFIRMADO_NUEVO,
      ]),
    );

    // Inserción en hc_seccion_odontologia
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO hc_seccion_odontologia'),
      expect.arrayContaining([
        'folio-uuid-generated-1234',
        expect.stringContaining('16'),
      ]),
    );

    // Upsert en hc_antecedentes_paciente
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO hc_antecedentes_paciente'),
      expect.arrayContaining([
        payload.pacienteId,
        'folio-uuid-generated-1234',
        'Ninguno',
      ]),
    );
  });

  it('debe persistir exitosamente un folio de medicina estética en hc_seccion_estetica', async () => {
    const payload = validEsteticaPayload();
    const result = await service.crearFolioConsultaExterna(payload);

    expect(result.folioId).toBe('folio-uuid-generated-1234');
    expect(result.numeroFolio).toBe(5);

    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO hc_seccion_estetica'),
      expect.arrayContaining([
        'folio-uuid-generated-1234',
        expect.stringContaining('Glabela'),
        expect.stringContaining('Botox'),
        expect.stringContaining('tenants/t1/antes_01.webp'),
      ]),
    );
  });

  it('debe propagar InternalServerErrorException si la base de datos falla durante la transacción', async () => {
    mockClient.query.mockImplementation((queryText: string) => {
      if (queryText.includes('next_folio')) {
        return Promise.resolve({ rows: [{ next_folio: '1' }] });
      }
      if (queryText.includes('INSERT INTO hc_folios')) {
        return Promise.reject(new Error('Postgres connection lost'));
      }
      return Promise.resolve({ rows: [] });
    });

    const payload = validOdontoPayload();

    await expect(service.crearFolioConsultaExterna(payload)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
