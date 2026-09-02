import { ValidationPipe, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import {
  EsteticaDataDto,
  PuntoMapaCorporalDto,
  InsumoAplicadoDto,
  Coordenada3DDto,
} from '../src/modules/clinical-record/dto/estetica-data.dto';

describe('EsteticaDataDto & Nested DTOs', () => {
  let targetPipe: ValidationPipe;
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: EsteticaDataDto,
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

  const createValidPayload = () => ({
    puntosTratados: [
      {
        zonaAnatomica: 'Surco nasogeniano derecho',
        coordenadas: {
          x: 12.5,
          y: -4.2,
          z: 3.1,
        },
        nivelDolor: 3,
        observacionClinica: 'Punto de mayor profundidad',
      },
    ],
    insumos: [
      {
        nombreComercial: 'Juvederm Voluma',
        numeroLote: 'LOT-2026-X99',
        fechaVencimiento: '2028-12-31',
        cantidadAplicada: 1.0,
        unidadMedida: 'ml',
        zonaAplicacion: 'Tercio medio facial',
      },
    ],
    fotos: {
      antes: ['tenants/t1/patients/p1/antes_01.webp'],
      despues: ['tenants/t1/patients/p1/despues_01.webp'],
    },
    procedimientoRealizado: 'Relleno de ácido hialurónico reticulado',
    recomendacionesPostProcedimiento: 'No masajear la zona por 48 horas',
  });

  it('debe validar y transformar correctamente un payload completo de estética', async () => {
    const payload = createValidPayload();
    const result = (await targetPipe.transform(
      payload,
      metadata,
    )) as EsteticaDataDto;

    expect(result).toBeInstanceOf(EsteticaDataDto);
    expect(result.puntosTratados[0]).toBeInstanceOf(PuntoMapaCorporalDto);
    expect(result.puntosTratados[0].coordenadas).toBeInstanceOf(Coordenada3DDto);
    expect(result.insumos[0]).toBeInstanceOf(InsumoAplicadoDto);
    expect(result.insumos[0].cantidadAplicada).toBe(1.0);
    expect(result.fotos?.antes[0]).toBe('tenants/t1/patients/p1/antes_01.webp');
  });

  it('debe fallar si las coordenadas 3D no son numéricas', async () => {
    const payload = {
      puntosTratados: [
        {
          zonaAnatomica: 'Glabela',
          coordenadas: {
            x: 'invalid-coord',
            y: 0,
            z: 0,
          },
        },
      ],
      insumos: [],
    };

    await expect(targetPipe.transform(payload, metadata)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('debe fallar si la cantidad de insumo aplicada es menor o igual a 0', async () => {
    const payload = {
      puntosTratados: [],
      insumos: [
        {
          nombreComercial: 'Botox',
          numeroLote: 'LOT-1',
          fechaVencimiento: '2027-01-01',
          cantidadAplicada: 0, // Invalido: min 0.01
          unidadMedida: 'UI',
          zonaAplicacion: 'Frente',
        },
      ],
    };

    try {
      await targetPipe.transform(payload, metadata);
      fail('Debería haber lanzado BadRequestException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(BadRequestException);
      const res = err.getResponse();
      expect(JSON.stringify(res.message)).toContain('cantidadAplicada');
    }
  });

  it('debe fallar si la fecha de vencimiento no es ISO date válida', async () => {
    const payload = {
      puntosTratados: [],
      insumos: [
        {
          nombreComercial: 'Botox',
          numeroLote: 'LOT-1',
          fechaVencimiento: '31/12/2026', // Formato no ISO
          cantidadAplicada: 20,
          unidadMedida: 'UI',
          zonaAplicacion: 'Frente',
        },
      ],
    };

    try {
      await targetPipe.transform(payload, metadata);
      fail('Debería haber lanzado BadRequestException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(BadRequestException);
      const res = err.getResponse();
      expect(JSON.stringify(res.message)).toContain('fechaVencimiento');
    }
  });

  it('debe fallar si el nivel de dolor en EVA es mayor a 10', async () => {
    const payload = {
      puntosTratados: [
        {
          zonaAnatomica: 'Labios',
          coordenadas: { x: 0, y: 0, z: 0 },
          nivelDolor: 11, // Max es 10
        },
      ],
      insumos: [],
    };

    try {
      await targetPipe.transform(payload, metadata);
      fail('Debería haber lanzado BadRequestException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(BadRequestException);
      const res = err.getResponse();
      expect(JSON.stringify(res.message)).toContain('nivelDolor');
    }
  });
});
