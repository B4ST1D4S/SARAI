import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { OdontogramaSubmodulo } from './OdontogramaSubmodulo';
import { normalizarOdontograma } from './hallazgos';
import type { OdontogramaDataDto } from './tipos';

const patch = vi.fn();
vi.mock('../../../../core/api/client', () => ({ apiClient: { patch: (...args: unknown[]) => patch(...args) } }));

const ultimoPayload = (): OdontogramaDataDto => patch.mock.calls.at(-1)![1] as OdontogramaDataDto;
const pieza = (datos: OdontogramaDataDto, fdi: number) => datos.piezas.find((p) => p.numeroPieza === fdi)!;

async function esperarAutosave() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
}

describe('OdontogramaSubmodulo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    patch.mockReset().mockResolvedValue({ data: {} });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('normaliza a 32 piezas sanas y conserva piezas fuera de la cuadrícula', () => {
    const datos = normalizarOdontograma({
      piezas: [{ numeroPieza: 55, estadoGeneral: 'CARIES', superficies: [] }],
    });
    expect(datos.piezas).toHaveLength(33);
    expect(pieza(datos, 11)).toEqual({ numeroPieza: 11, estadoGeneral: 'SANO', superficies: [] });
    expect(pieza(datos, 55).estadoGeneral).toBe('CARIES');
  });

  it('escribe la caries de una superficie dentro de piezas[].superficies y la envía por PATCH', async () => {
    render(<OdontogramaSubmodulo folioId="f1" />);
    fireEvent.click(screen.getByLabelText('Pieza 16, Oclusal: sana'));
    await esperarAutosave();

    expect(patch).toHaveBeenCalledWith('/clinical-records/folios/f1/seccion/odontograma', expect.any(Object));
    const enviado = ultimoPayload();
    expect(enviado.piezas).toHaveLength(32);
    expect(pieza(enviado, 16)).toEqual({
      numeroPieza: 16,
      estadoGeneral: 'SANO',
      superficies: [{ superficie: 'OCLUSAL', estado: 'CARIES' }],
    });
    expect(pieza(enviado, 17)).toEqual({ numeroPieza: 17, estadoGeneral: 'SANO', superficies: [] });
  });

  it('las herramientas de pieza escriben estadoGeneral y un segundo toque lo revierte a SANO', async () => {
    render(<OdontogramaSubmodulo folioId="f1" />);
    fireEvent.click(screen.getByRole('button', { name: /Corona/ }));
    fireEvent.click(screen.getByLabelText('Pieza 21, vista frontal: sin hallazgos'));
    await esperarAutosave();
    expect(pieza(ultimoPayload(), 21).estadoGeneral).toBe('CORONA');

    fireEvent.click(screen.getByLabelText('Pieza 21, vista frontal: Corona'));
    await esperarAutosave();
    expect(pieza(ultimoPayload(), 21).estadoGeneral).toBe('SANO');
  });

  it('sellante disponible como herramienta de superficie', async () => {
    render(<OdontogramaSubmodulo folioId="f1" />);
    fireEvent.click(screen.getByRole('button', { name: /Sellante/ }));
    fireEvent.click(screen.getByLabelText('Pieza 36, Oclusal: sana'));
    await esperarAutosave();
    expect(pieza(ultimoPayload(), 36).superficies).toEqual([{ superficie: 'OCLUSAL', estado: 'SELLANTE' }]);
  });

  it('la observación de la ficha va a piezas[].observacion', async () => {
    render(<OdontogramaSubmodulo folioId="f1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir ficha de la pieza 46' }));
    fireEvent.change(screen.getByPlaceholderText(/Movilidad/), { target: { value: 'Movilidad grado I' } });
    await esperarAutosave();
    expect(pieza(ultimoPayload(), 46).observacion).toBe('Movilidad grado I');
  });

  it('carga datosIniciales y en solo lectura no guarda ni permite marcar', async () => {
    render(
      <OdontogramaSubmodulo
        folioId="f1"
        readOnly
        defaultValues={{
          piezas: [{ numeroPieza: 11, estadoGeneral: 'SANO', superficies: [{ superficie: 'MESIAL', estado: 'CARIES' }] }],
        }}
      />,
    );
    expect(screen.getByLabelText('Pieza 11, Mesial: Caries')).toBeTruthy();
    expect(screen.queryByRole('toolbar')).toBeNull();
    fireEvent.click(screen.getByLabelText('Pieza 11, Mesial: Caries'));
    await esperarAutosave();
    expect(patch).not.toHaveBeenCalled();
  });
});
