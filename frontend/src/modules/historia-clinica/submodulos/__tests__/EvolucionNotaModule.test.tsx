import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvolucionNotaModule } from '../EvolucionNotaModule';
import { REGLAS_EVOLUCION_NOTA } from '../../utils/validaciones';

describe('EvolucionNotaModule', () => {
  afterEach(cleanup);

  it('muestra data.notaEvolucion en el textarea', () => {
    render(<EvolucionNotaModule data={{ notaEvolucion: 'Paciente estable, afebril' }} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/Nota de evolución clínica/)).toHaveValue('Paciente estable, afebril');
  });

  it('emite por onChange el parche con notaEvolucion, sin estado propio', async () => {
    const onChange = vi.fn();
    render(<EvolucionNotaModule data={{ notaEvolucion: 'Paciente estable' }} onChange={onChange} />);

    await userEvent.setup().type(screen.getByLabelText(/Nota de evolución clínica/), '.');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ notaEvolucion: 'Paciente estable.' });
  });

  it('readOnly deshabilita el textarea y no emite cambios', async () => {
    const onChange = vi.fn();
    render(<EvolucionNotaModule data={{ notaEvolucion: 'Paciente estable' }} onChange={onChange} readOnly />);

    const nota = screen.getByLabelText(/Nota de evolución clínica/);
    expect(nota).toBeDisabled();

    await userEvent.setup().type(nota, 'x');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('marca el error de la regla compartida solo cuando la nota está diligenciada', () => {
    const { rerender } = render(<EvolucionNotaModule data={{ notaEvolucion: 'Estable' }} onChange={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent(REGLAS_EVOLUCION_NOTA.notaEvolucion.mensaje);

    rerender(<EvolucionNotaModule data={{}} onChange={vi.fn()} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
