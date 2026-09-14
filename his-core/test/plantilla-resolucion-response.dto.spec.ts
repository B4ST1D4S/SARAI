import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  PlantillaResolucionResponseDto,
  OrigenResolucionEnum,
  MetadataAtencionDto,
} from '../src/modules/clinical-record/dto/plantilla-resolucion-response.dto';

describe('PlantillaResolucionResponseDto', () => {
  const validPayload = () => ({
    plantillaId: 'a1111111-2222-4333-8444-555555555555',
    codigoPlantilla: 'PLANT-CONS-PRIMERA-VEZ',
    nombrePlantilla: 'Consulta Ambulatoria - Primera Vez (Estándar)',
    origenResolucion: OrigenResolucionEnum.INSTITUCIONAL_DEFAULT,
    estructura: {
      secciones: [
        {
          id: 'sec_valoracion',
          titulo: 'Valoración Clínica',
          submodulos: [{ id: 'motivo_consulta', requerido: true }],
        },
      ],
    },
    metadataAtencion: {
      citaId: 'b1111111-2222-4333-8444-555555555555',
      pacienteId: 'c1111111-2222-4333-8444-555555555555',
      profesionalId: 'd1111111-2222-4333-8444-555555555555',
      sedeId: 'e1111111-2222-4333-8444-555555555555',
      tipoConsultaId: 'f1111111-2222-4333-8444-555555555555',
    },
  });

  it('debe validar exitosamente un objeto válido con todos sus campos', async () => {
    const instance = plainToInstance(
      PlantillaResolucionResponseDto,
      validPayload(),
    );
    const errors = await validate(instance);
    expect(errors.length).toBe(0);
  });

  it('debe fallar si plantillaId no es un UUID v4 válido', async () => {
    const payload = {
      ...validPayload(),
      plantillaId: 'invalid-uuid',
    };
    const instance = plainToInstance(PlantillaResolucionResponseDto, payload);
    const errors = await validate(instance);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('plantillaId');
  });

  it('debe fallar si origenResolucion no es un valor permitido', async () => {
    const payload = {
      ...validPayload(),
      origenResolucion: 'INVALID_ORIGIN' as any,
    };
    const instance = plainToInstance(PlantillaResolucionResponseDto, payload);
    const errors = await validate(instance);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('origenResolucion');
  });

  it('debe fallar si metadataAtencion contiene campos inválidos', async () => {
    const payload = {
      ...validPayload(),
      metadataAtencion: {
        citaId: 'not-a-uuid',
        pacienteId: 'not-a-uuid',
        profesionalId: 'not-a-uuid',
        sedeId: 'not-a-uuid',
        tipoConsultaId: 'not-a-uuid',
      },
    };
    const instance = plainToInstance(PlantillaResolucionResponseDto, payload);
    const errors = await validate(instance);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('metadataAtencion');
  });
});
