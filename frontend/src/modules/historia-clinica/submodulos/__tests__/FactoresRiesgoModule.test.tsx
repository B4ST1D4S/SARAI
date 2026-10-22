import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { FactoresRiesgoModule, type FactoresRiesgoData } from '../FactoresRiesgoModule';

const FUMADOR: FactoresRiesgoData = { tabaquismo: 'CURRENT', paquetesAnio: 10 };

/** Último parche emitido por onChange. */
const ultimo = (onChange: ReturnType<typeof vi.fn>) => onChange.mock.lastCall?.[0] as FactoresRiesgoData;

describe('FactoresRiesgoModule', () => {
  afterEach(cleanup);

  it('sin datos todos los hábitos quedan "Sin registrar" (no se asume ninguno)', () => {
    render(<FactoresRiesgoModule data={{}} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/Tabaquismo/)).toHaveValue('');
    expect(screen.getByLabelText(/Ingesta de Alcohol/)).toHaveValue('');
    expect(screen.getByLabelText(/Actividad Física/)).toHaveValue('');
    expect(screen.queryByLabelText('Índice paquetes/año')).not.toBeInTheDocument();
  });

  it.each([
    ['NEVER', 'NEVER'],
    ['', undefined],
  ])('pasar el tabaquismo a "%s" borra el índice paquetes/año en el mismo parche', (opcion, esperado) => {
    const onChange = vi.fn();
    render(<FactoresRiesgoModule data={FUMADOR} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/Tabaquismo/), { target: { value: opcion } });

    const parche = ultimo(onChange);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(parche.tabaquismo).toBe(esperado);
    // La clave debe viajar explícitamente en undefined para que el borrador la limpie.
    expect(parche).toHaveProperty('paquetesAnio', undefined);
  });

  it('pasar de fumador activo a exfumador conserva el índice paquetes/año', () => {
    const onChange = vi.fn();
    render(<FactoresRiesgoModule data={FUMADOR} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/Tabaquismo/), { target: { value: 'FORMER' } });

    expect(ultimo(onChange)).toEqual({ tabaquismo: 'FORMER' });
    expect(ultimo(onChange)).not.toHaveProperty('paquetesAnio');
  });

  it('el índice paquetes/año solo se muestra a fumadores y exfumadores, y emite número', () => {
    const onChange = vi.fn();
    const { rerender } = render(<FactoresRiesgoModule data={FUMADOR} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Índice paquetes/año'), { target: { value: '12.5' } });
    expect(ultimo(onChange)).toEqual({ paquetesAnio: 12.5 });

    rerender(<FactoresRiesgoModule data={{ tabaquismo: 'NEVER' }} onChange={onChange} />);
    expect(screen.queryByLabelText('Índice paquetes/año')).not.toBeInTheDocument();
  });

  it('volver un hábito a "Sin registrar" emite undefined', () => {
    const onChange = vi.fn();
    render(<FactoresRiesgoModule data={{ alcohol: 'OCASIONAL' }} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/Ingesta de Alcohol/), { target: { value: '' } });

    expect(ultimo(onChange)).toHaveProperty('alcohol', undefined);
  });

  it('readOnly deshabilita todos los campos', () => {
    render(<FactoresRiesgoModule data={FUMADOR} onChange={vi.fn()} readOnly />);

    screen.getAllByRole('combobox').forEach((s) => expect(s).toBeDisabled());
    expect(screen.getByLabelText('Índice paquetes/año')).toBeDisabled();
    expect(screen.getByLabelText(/Exposición Ocupacional/)).toBeDisabled();
  });
});
