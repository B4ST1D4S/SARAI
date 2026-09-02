import { ValidationPipe, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { RevisionSistemasDto } from '../src/modules/clinical-record/dto/revision-sistemas.dto';

describe('RevisionSistemasDto', () => {
  let targetPipe: ValidationPipe;
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: RevisionSistemasDto,
    data: '',
  };

  beforeEach(() => {
    targetPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
  });

  it('debe validar un objeto vacío (todos los campos son opcionales)', async () => {
    const payload = {};
    const result = (await targetPipe.transform(
      payload,
      metadata,
    )) as RevisionSistemasDto;

    expect(result).toBeInstanceOf(RevisionSistemasDto);
    expect(result.cardiovascular).toBeUndefined();
  });

  it('debe validar y recibir campos de sistemas clínicos', async () => {
    const payload = {
      cardiovascular: 'Sin soplos ni ruidos sobreagregados',
      respiratorio: 'Murmullo vesicular conservado, sin tirajes',
      neurologico: 'Alerta, orientado en 3 esferas, sin déficit focal',
      dermatologico: 'Sin lesiones activas ni eritema',
    };

    const result = (await targetPipe.transform(
      payload,
      metadata,
    )) as RevisionSistemasDto;

    expect(result).toBeInstanceOf(RevisionSistemasDto);
    expect(result.cardiovascular).toBe('Sin soplos ni ruidos sobreagregados');
    expect(result.neurologico).toBe(
      'Alerta, orientado en 3 esferas, sin déficit focal',
    );
  });

  it('debe rechazar campos adicionales no definidos', async () => {
    const payload = {
      cardiovascular: 'Normal',
      sistemaInexistente: 'Valor no permitido',
    };

    try {
      await targetPipe.transform(payload, metadata);
      fail('Debería haber lanzado BadRequestException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(BadRequestException);
      const res = err.getResponse();
      expect(JSON.stringify(res.message)).toContain('property sistemaInexistente should not exist');
    }
  });
});
