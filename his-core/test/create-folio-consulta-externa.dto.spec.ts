import { ValidationPipe, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import {
  CreateFolioConsultaExternaDto,
  EspecialidadClinica,
  TipoDiagnostico,
  AnamnesisDto,
  SignosVitalesDto,
  DiagnosticoItemDto,
} from '../src/modules/clinical-record/dto/create-folio-consulta-externa.dto';
import {
  EstadoPiezaDental,
  SuperficieDental,
} from '../src/modules/clinical-record/dto/odontograma-data.dto';

describe('CreateFolioConsultaExternaDto', () => {
  let targetPipe: ValidationPipe;
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: CreateFolioConsultaExternaDto,
    data: '',
  };

  beforeEach(() => {
    targetPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    });
  });

  const createBaseFolio = () => ({
    atencionId: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f',
    pacienteId: 'a1b2c3d4-e5f6-4a8b-9c0d-1e2f3a4b5c6d',
    profesionalId: 'f9e8d7c6-b5a4-4210-8edc-ba9876543210',
    fechaAtencion: '2026-09-02T08:00:00.000Z',
    especialidad: EspecialidadClinica.ODONTOLOGIA,
    numeroFolio: 'FOL-2026-0001',
    tipoAtencion: 'PRIMERA_VEZ',
    anamnesis: {
      motivoConsulta: 'Dolor en molar inferior derecho al masticar',
      enfermedadActual:
        'Paciente refiere dolor punzante de 3 días de evolución en cuadrante 4.',
      antecedentes: {
        patologicos: 'Hipertensión arterial controlada',
        alergicos: 'Penicilina',
      },
      revisionSistemas: {
        cardiovascular: 'Sin alteraciones reportadas',
        gastrointestinal: 'Normal',
      },
    },
    signosVitales: {
      frecuenciaCardiaca: 72,
      frecuenciaRespiratoria: 16,
      presionArterialSistolica: 120,
      presionArterialDiastolica: 80,
      temperatura: 36.5,
      saturacionOxigeno: 98,
      pesoKg: 70.5,
      tallaCm: 172,
      indiceMasaCorporal: 23.83,
    },
    examenFisicoGeneral: 'Paciente en buen estado general, afebril, hidratado.',
    diagnosticos: [
      {
        codigoCIE10: 'K02.1',
        descripcion: 'Caries de la dentina en pieza 46',
        tipo: TipoDiagnostico.CONFIRMADO_NUEVO,
        esPrincipal: true,
      },
    ],
    planTratamiento: 'Obturación con resina fotocurable pieza 46 previa anestesia local.',
    recomendaciones: 'Evitar alimentos duros por 24 horas y mantener higiene oral.',
    datosOdontologia: {
      piezas: [
        {
          numeroPieza: 46,
          estadoGeneral: EstadoPiezaDental.CARIES,
          superficies: [
            {
              superficie: SuperficieDental.OCLUSAL,
              estado: EstadoPiezaDental.CARIES,
            },
          ],
        },
      ],
      indicePlacaCalculado: 20,
    },
  });

  it('debe validar y transformar correctamente un folio odontológico completo', async () => {
    const payload = createBaseFolio();
    const result = (await targetPipe.transform(
      payload,
      metadata,
    )) as CreateFolioConsultaExternaDto;

    expect(result).toBeInstanceOf(CreateFolioConsultaExternaDto);
    expect(result.atencionId).toBe('c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f');
    expect(result.anamnesis).toBeInstanceOf(AnamnesisDto);
    expect(result.signosVitales).toBeInstanceOf(SignosVitalesDto);
    expect(result.diagnosticos[0]).toBeInstanceOf(DiagnosticoItemDto);
    expect(result.datosOdontologia?.piezas[0].numeroPieza).toBe(46);
  });

  it('debe validar un folio de medicina estética con datos especializados', async () => {
    const payload = {
      ...createBaseFolio(),
      especialidad: EspecialidadClinica.MEDICINA_ESTETICA,
      datosOdontologia: undefined,
      datosEstetica: {
        puntosTratados: [
          {
            zonaAnatomica: 'Surco nasogeniano izquierdo',
            coordenadas: { x: 5, y: -2, z: 1 },
          },
        ],
        insumos: [
          {
            nombreComercial: 'Restylane Defyne',
            numeroLote: 'LOT-9988',
            fechaVencimiento: '2028-06-30',
            cantidadAplicada: 1.0,
            unidadMedida: 'ml',
            zonaAplicacion: 'Surco nasogeniano',
          },
        ],
      },
    };

    const result = (await targetPipe.transform(
      payload,
      metadata,
    )) as CreateFolioConsultaExternaDto;

    expect(result.especialidad).toBe(EspecialidadClinica.MEDICINA_ESTETICA);
    expect(result.datosEstetica?.puntosTratados).toHaveLength(1);
    expect(result.datosEstetica?.insumos[0].nombreComercial).toBe(
      'Restylane Defyne',
    );
  });

  it('debe fallar si atencionId falta o no es un UUID válido', async () => {
    const payload = {
      ...createBaseFolio(),
      atencionId: 'invalido',
    };

    try {
      await targetPipe.transform(payload, metadata);
      fail('Debería haber lanzado BadRequestException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(BadRequestException);
      const res = err.getResponse();
      expect(res.message).toEqual(
        expect.arrayContaining([expect.stringMatching(/atencionId must be a UUID/)]),
      );
    }
  });

  it('debe fallar si pacienteId no es un UUID válido', async () => {
    const payload = {
      ...createBaseFolio(),
      pacienteId: 'id-invalido-123',
    };

    try {
      await targetPipe.transform(payload, metadata);
      fail('Debería haber lanzado BadRequestException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(BadRequestException);
      const res = err.getResponse();
      expect(res.message).toEqual(
        expect.arrayContaining([expect.stringMatching(/pacienteId must be a UUID/)]),
      );
    }
  });

  it('debe fallar si la lista de diagnósticos está vacía', async () => {
    const payload = {
      ...createBaseFolio(),
      diagnosticos: [],
    };

    try {
      await targetPipe.transform(payload, metadata);
      fail('Debería haber lanzado BadRequestException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(BadRequestException);
      const res = err.getResponse();
      expect(res.message).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/diagnosticos must contain at least 1 elements/),
        ]),
      );
    }
  });

  it('debe fallar si los signos vitales contienen valores no fisiológicos', async () => {
    const payload = {
      ...createBaseFolio(),
      signosVitales: {
        temperatura: 55, // Incompatible con la vida humana (> 45)
      },
    };

    try {
      await targetPipe.transform(payload, metadata);
      fail('Debería haber lanzado BadRequestException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(BadRequestException);
      const res = err.getResponse();
      expect(JSON.stringify(res.message)).toContain('temperatura must not be greater than 45');
    }
  });
});
