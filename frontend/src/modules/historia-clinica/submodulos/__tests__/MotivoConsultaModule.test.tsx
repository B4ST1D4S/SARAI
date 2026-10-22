import { useState } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotivoConsultaModule, REGLAS_MOTIVO_CONSULTA, type MotivoConsultaData } from '../MotivoConsultaModule';

/**
 * Padre mínimo que imita al Workbench: fusiona cada parche en su estado y lo
 * devuelve como `data`, para probar una escritura completa de varios caracteres.
 */
function ConPadre({ inicial = {}, espia }: { inicial?: MotivoConsultaData; espia: (p: Partial<MotivoConsultaData>) => void }) {
  const [data, setData] = useState<MotivoConsultaData>(inicial);
  return (
    <MotivoConsultaModule
      data={data}
      onChange={(patch) => {
        espia(patch);
        setData((prev) => ({ ...prev, ...patch }));
      }}
    />
  );
}

describe('MotivoConsultaModule', () => {
  afterEach(cleanup);

  it('muestra los valores recibidos en data', () => {
    render(<MotivoConsultaModule data={{ motivo: 'Cefalea', enfermedadActual: 'Dolor de 2 días' }} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/Motivo de Consulta/)).toHaveValue('Cefalea');
    expect(screen.getByLabelText(/Enfermedad Actual/)).toHaveValue('Dolor de 2 días');
  });

  it('emite por onChange solo el campo editado, sin estado propio', async () => {
    const onChange = vi.fn();
    render(<MotivoConsultaModule data={{ motivo: 'Cefalea', enfermedadActual: 'Dolor de 2 días' }} onChange={onChange} />);

    await userEvent.setup().type(screen.getByLabelText(/Motivo de Consulta/), 's');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ motivo: 'Cefaleas' });
  });

  it('con un padre que fusiona los parches, la escritura completa llega al borrador', async () => {
    const espia = vi.fn();
    render(<ConPadre espia={espia} />);

    await userEvent.setup().type(screen.getByLabelText(/Enfermedad Actual/), 'Fiebre de 3 días');

    expect(espia).toHaveBeenLastCalledWith({ enfermedadActual: 'Fiebre de 3 días' });
    expect(screen.getByLabelText(/Enfermedad Actual/)).toHaveValue('Fiebre de 3 días');
  });

  it('readOnly deshabilita los campos y no emite cambios', async () => {
    const onChange = vi.fn();
    render(<MotivoConsultaModule data={{ motivo: 'Cefalea' }} onChange={onChange} readOnly />);

    const motivo = screen.getByLabelText(/Motivo de Consulta/);
    expect(motivo).toBeDisabled();
    expect(screen.getByLabelText(/Enfermedad Actual/)).toBeDisabled();

    await userEvent.setup().type(motivo, 'x');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('marca el error de la regla compartida solo en los campos diligenciados', () => {
    render(<MotivoConsultaModule data={{ motivo: 'Tos' }} onChange={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent(REGLAS_MOTIVO_CONSULTA.motivo.mensaje);
    expect(screen.getByLabelText(/Motivo de Consulta/)).toHaveAttribute('aria-invalid', 'true');
    // Enfermedad actual vacía: la obligatoriedad la exige el cierre, no el campo.
    expect(screen.getByLabelText(/Enfermedad Actual/)).toHaveAttribute('aria-invalid', 'false');
  });
});
