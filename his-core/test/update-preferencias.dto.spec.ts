import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdatePreferenciasDto } from '../src/modules/users/dto/update-preferencias.dto';

describe('UpdatePreferenciasDto', () => {
  it('debe pasar la validación con datos válidos completos', async () => {
    const payload = {
      navMode: 'hub',
      theme: 'dark',
    };

    const dto = plainToInstance(UpdatePreferenciasDto, payload);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('debe pasar la validación cuando navMode es "sidebar"', async () => {
    const payload = {
      navMode: 'sidebar',
    };

    const dto = plainToInstance(UpdatePreferenciasDto, payload);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('debe pasar la validación con objeto vacío (todos los campos son opcionales)', async () => {
    const payload = {};

    const dto = plainToInstance(UpdatePreferenciasDto, payload);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('debe fallar si navMode tiene un valor no permitido', async () => {
    const payload = {
      navMode: 'invalid-mode',
    };

    const dto = plainToInstance(UpdatePreferenciasDto, payload);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const navModeError = errors.find((e) => e.property === 'navMode');
    expect(navModeError).toBeDefined();
    expect(navModeError?.constraints?.isIn).toBe(
      'El modo de navegación debe ser "hub" o "sidebar"',
    );
  });

  it('debe fallar si theme no es string', async () => {
    const payload = {
      theme: 12345,
    };

    const dto = plainToInstance(UpdatePreferenciasDto, payload);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const themeError = errors.find((e) => e.property === 'theme');
    expect(themeError).toBeDefined();
  });
});
