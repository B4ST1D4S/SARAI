import { ValidationPipe, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import {
  OdontogramaDataDto,
  EstadoPiezaDental,
  SuperficieDental,
  PiezaDentalDto,
} from '../src/modules/clinical-record/dto/odontograma-data.dto';

describe('OdontogramaDataDto & Nested DTOs', () => {
  let targetPipe: ValidationPipe;
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: OdontogramaDataDto,
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
    piezas: [
      {
        numeroPieza: 18,
        estadoGeneral: EstadoPiezaDental.SANO,
        superficies: [
          {
            superficie: SuperficieDental.OCLUSAL,
            estado: EstadoPiezaDental.CARIES,
            detalle: 'Caries de esmalte',
          },
          {
            superficie: SuperficieDental.MESIAL,
            estado: EstadoPiezaDental.OBTURADO_RESINA,
          },
        ],
        observacion: 'Requiere profilaxis',
      },
      {
        numeroPieza: 21,
        estadoGeneral: EstadoPiezaDental.CORONA,
        superficies: [
          {
            superficie: SuperficieDental.GENERAL,
            estado: EstadoPiezaDental.CORONA,
          },
        ],
      },
    ],
    indicePlacaCalculado: 15.5,
    observaciones: 'Paciente con higiene oral moderada',
    fechaActualizacion: '2026-09-02T10:30:00.000Z',
  });

  it('debe validar y transformar exitosamente un payload completo de Odontograma', async () => {
    const payload = createValidPayload();
    const result = (await targetPipe.transform(
      payload,
      metadata,
    )) as OdontogramaDataDto;

    expect(result).toBeInstanceOf(OdontogramaDataDto);
    expect(result.piezas).toHaveLength(2);
    expect(result.piezas[0]).toBeInstanceOf(PiezaDentalDto);
    expect(result.piezas[0].numeroPieza).toBe(18);
    expect(result.piezas[0].superficies[0].superficie).toBe(
      SuperficieDental.OCLUSAL,
    );
    expect(result.indicePlacaCalculado).toBe(15.5);
  });

  it('debe fallar si el número de pieza FDI está fuera de rango (< 11 o > 85)', async () => {
    const payload = {
      piezas: [
        {
          numeroPieza: 9, // Inválido FDI
          estadoGeneral: EstadoPiezaDental.SANO,
          superficies: [],
        },
      ],
    };

    try {
      await targetPipe.transform(payload, metadata);
      fail('Debería haber lanzado BadRequestException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(BadRequestException);
      const res = err.getResponse();
      expect(JSON.stringify(res.message)).toContain('numeroPieza');
    }
  });

  it('debe fallar si una superficie contiene un enum de superficie inválido', async () => {
    const payload = {
      piezas: [
        {
          numeroPieza: 11,
          estadoGeneral: EstadoPiezaDental.SANO,
          superficies: [
            {
              superficie: 'SUPERFICIE_INEXISTENTE',
              estado: EstadoPiezaDental.CARIES,
            },
          ],
        },
      ],
    };

    await expect(targetPipe.transform(payload, metadata)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('debe fallar si el índice de placa es mayor a 100 o negativo', async () => {
    const payloadNegative = {
      piezas: [],
      indicePlacaCalculado: -5,
    };
    await expect(
      targetPipe.transform(payloadNegative, metadata),
    ).rejects.toBeInstanceOf(BadRequestException);

    const payloadOverflow = {
      piezas: [],
      indicePlacaCalculado: 120,
    };
    await expect(
      targetPipe.transform(payloadOverflow, metadata),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('debe rechazar propiedades no permitidas por forbidNonWhitelisted', async () => {
    const payload = {
      ...createValidPayload(),
      campoMalicioso: 'injection',
    };

    try {
      await targetPipe.transform(payload, metadata);
      fail('Debería haber lanzado BadRequestException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(BadRequestException);
      const res = err.getResponse();
      expect(JSON.stringify(res.message)).toContain('property campoMalicioso should not exist');
    }
  });

  it('debe rechazar propiedades no permitidas anidadas en piezas', async () => {
    const payload = {
      piezas: [
        {
          numeroPieza: 11,
          estadoGeneral: EstadoPiezaDental.SANO,
          superficies: [],
          propiedadExtra: true,
        },
      ],
    };

    try {
      await targetPipe.transform(payload, metadata);
      fail('Debería haber lanzado BadRequestException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(BadRequestException);
      const res = err.getResponse();
      expect(JSON.stringify(res.message)).toContain('property propiedadExtra should not exist');
    }
  });
});
