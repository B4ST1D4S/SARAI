import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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

  describe('obtenerPlantillaParaCita (Dynamic Template Resolution)', () => {
    const citaId = 'c1111111-2222-3333-4444-555555555555';
    const pacienteId = 'p1111111-2222-3333-4444-555555555555';
    const profesionalId = 'u1111111-2222-3333-4444-555555555555';
    const sedeId = 's1111111-2222-3333-4444-555555555555';
    const tipoConsultaId = 't1111111-2222-3333-4444-555555555555';

    const mockCitaRow = {
      id: citaId,
      paciente_id: pacienteId,
      profesional_id: profesionalId,
      sede_id: sedeId,
      tipo_consulta_id: tipoConsultaId,
    };

    const mockEstructura = {
      secciones: [
        {
          id: 'sec_valoracion',
          titulo: 'Valoración Clínica',
          submodulos: [{ id: 'motivo_consulta', requerido: true }],
        },
      ],
    };

    it('debe lanzar NotFoundException si la cita no existe', async () => {
      jest.spyOn(tenancyConnectionService, 'query').mockResolvedValueOnce({
        rows: [],
      } as any);

      await expect(
        service.obtenerPlantillaParaCita('non-existent-cita-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe resolver con prioridad 1 (PROFESIONAL_OVERRIDE) si existe personalización médica', async () => {
      jest.spyOn(tenancyConnectionService, 'query').mockImplementation((queryText: string) => {
        if (queryText.includes('FROM citas')) {
          return Promise.resolve({ rows: [mockCitaRow] } as any);
        }
        if (queryText.includes('FROM tipos_consulta_cups')) {
          return Promise.resolve({ rows: [{ finalidad: 'PRIMERA_VEZ' }] } as any);
        }
        if (queryText.includes('FROM hc_configuracion_plantillas')) {
          return Promise.resolve({
            rows: [
              {
                plantilla_id: 'plantilla-prof-111',
                codigo_plantilla: 'PLANT-CARDIO-DR-PEREZ',
                nombre_plantilla: 'Cardiología - Dr. Pérez (Personalizada)',
                estructura: mockEstructura,
                origen_resolucion: 'PROFESIONAL_OVERRIDE',
                prioridad: 1,
              },
            ],
          } as any);
        }
        return Promise.resolve({ rows: [] } as any);
      });

      const result = await service.obtenerPlantillaParaCita(citaId);

      expect(result).toEqual({
        plantillaId: 'plantilla-prof-111',
        codigoPlantilla: 'PLANT-CARDIO-DR-PEREZ',
        nombrePlantilla: 'Cardiología - Dr. Pérez (Personalizada)',
        origenResolucion: 'PROFESIONAL_OVERRIDE',
        estructura: mockEstructura,
        metadataAtencion: {
          citaId,
          pacienteId,
          profesionalId,
          sedeId,
          tipoConsultaId,
        },
      });
    });

    it('debe resolver con prioridad 2 (SEDE_OVERRIDE) si no hay override profesional pero sí de sede', async () => {
      jest.spyOn(tenancyConnectionService, 'query').mockImplementation((queryText: string) => {
        if (queryText.includes('FROM citas')) {
          return Promise.resolve({ rows: [mockCitaRow] } as any);
        }
        if (queryText.includes('FROM tipos_consulta_cups')) {
          return Promise.resolve({ rows: [{ finalidad: 'CONTROL' }] } as any);
        }
        if (queryText.includes('FROM hc_configuracion_plantillas')) {
          return Promise.resolve({
            rows: [
              {
                plantilla_id: 'plantilla-sede-222',
                codigo_plantilla: 'PLANT-CARDIO-SEDE-NORTE',
                nombre_plantilla: 'Cardiología - Sede Norte',
                estructura: JSON.stringify(mockEstructura), // probar parseo JSON string
                origen_resolucion: 'SEDE_OVERRIDE',
                prioridad: 2,
              },
            ],
          } as any);
        }
        return Promise.resolve({ rows: [] } as any);
      });

      const result = await service.obtenerPlantillaParaCita(citaId);

      expect(result.origenResolucion).toBe('SEDE_OVERRIDE');
      expect(result.plantillaId).toBe('plantilla-sede-222');
      expect(result.codigoPlantilla).toBe('PLANT-CARDIO-SEDE-NORTE');
      expect(result.estructura).toEqual(mockEstructura);
    });

    it('debe resolver con prioridad 3 (INSTITUCIONAL_DEFAULT) desde configuración de plantilla', async () => {
      jest.spyOn(tenancyConnectionService, 'query').mockImplementation((queryText: string) => {
        if (queryText.includes('FROM citas')) {
          return Promise.resolve({ rows: [mockCitaRow] } as any);
        }
        if (queryText.includes('FROM tipos_consulta_cups')) {
          return Promise.resolve({ rows: [] } as any); // finalidad asume 'PRIMERA_VEZ'
        }
        if (queryText.includes('FROM hc_configuracion_plantillas')) {
          return Promise.resolve({
            rows: [
              {
                plantilla_id: 'plantilla-inst-333',
                codigo_plantilla: 'PLANT-CONS-PRIMERA-VEZ',
                nombre_plantilla: 'Consulta Ambulatoria - Primera Vez (Estándar)',
                estructura: mockEstructura,
                origen_resolucion: 'INSTITUCIONAL_DEFAULT',
                prioridad: 3,
              },
            ],
          } as any);
        }
        return Promise.resolve({ rows: [] } as any);
      });

      const result = await service.obtenerPlantillaParaCita(citaId);

      expect(result.origenResolucion).toBe('INSTITUCIONAL_DEFAULT');
      expect(result.plantillaId).toBe('plantilla-inst-333');
      expect(result.codigoPlantilla).toBe('PLANT-CONS-PRIMERA-VEZ');
    });

    it('debe recurrir al fallback de catálogo PLANT-CONS-PRIMERA-VEZ si no hay configuración', async () => {
      jest.spyOn(tenancyConnectionService, 'query').mockImplementation((queryText: string) => {
        if (queryText.includes('FROM citas')) {
          return Promise.resolve({ rows: [mockCitaRow] } as any);
        }
        if (queryText.includes('FROM tipos_consulta_cups')) {
          return Promise.resolve({ rows: [] } as any);
        }
        if (queryText.includes('FROM hc_configuracion_plantillas')) {
          return Promise.resolve({ rows: [] } as any); // sin registros de configuración
        }
        if (queryText.includes('FROM hc_plantillas_catalogo') && queryText.includes('codigo = $1')) {
          return Promise.resolve({
            rows: [
              {
                plantilla_id: 'plantilla-catalogo-444',
                codigo_plantilla: 'PLANT-CONS-PRIMERA-VEZ',
                nombre_plantilla: 'Consulta Ambulatoria - Primera Vez (Estándar)',
                estructura: mockEstructura,
              },
            ],
          } as any);
        }
        return Promise.resolve({ rows: [] } as any);
      });

      const result = await service.obtenerPlantillaParaCita(citaId);

      expect(result.origenResolucion).toBe('INSTITUCIONAL_DEFAULT');
      expect(result.plantillaId).toBe('plantilla-catalogo-444');
      expect(result.codigoPlantilla).toBe('PLANT-CONS-PRIMERA-VEZ');
      expect(result.metadataAtencion.citaId).toBe(citaId);
    });

    it('debe lanzar NotFoundException si no existe ninguna plantilla activa en catálogo', async () => {
      jest.spyOn(tenancyConnectionService, 'query').mockImplementation((queryText: string) => {
        if (queryText.includes('FROM citas')) {
          return Promise.resolve({ rows: [mockCitaRow] } as any);
        }
        return Promise.resolve({ rows: [] } as any);
      });

      await expect(service.obtenerPlantillaParaCita(citaId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
