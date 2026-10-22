import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { SignosVitalesModule, type SignosVitalesData } from '../SignosVitalesModule';

const NORMALES: SignosVitalesData = { paSistolica: 118, paDiastolica: 78, fc: 74, fr: 16, temp: 36.6, spo2: 99 };

const banner = () => screen.getAllByRole('status')[0];

describe('SignosVitalesModule', () => {
  afterEach(cleanup);

  it('banner de éxito con todos los signos en rango', () => {
    render(<SignosVitalesModule data={NORMALES} onChange={vi.fn()} />);

    expect(banner()).toHaveTextContent('Signos vitales dentro de rangos esperados');
    expect(banner()).toHaveClass('bg-success/10', 'text-success');
  });

  it('banner de precaución con una alerta ámbar', () => {
    render(<SignosVitalesModule data={{ ...NORMALES, temp: 39 }} onChange={vi.fn()} />);

    expect(banner()).toHaveTextContent('Fiebre');
    expect(banner()).toHaveClass('bg-warning/10', 'text-warning');
  });

  it('banner de peligro si alguna alerta es roja, listando todas', () => {
    render(<SignosVitalesModule data={{ ...NORMALES, temp: 39, spo2: 85 }} onChange={vi.fn()} />);

    expect(banner()).toHaveTextContent('Hipoxemia');
    expect(banner()).toHaveTextContent('Fiebre');
    expect(banner()).toHaveClass('bg-danger/10', 'text-danger');
  });

  it('sin mediciones no muestra banner', () => {
    render(<SignosVitalesModule data={{}} onChange={vi.fn()} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('muestra el IMC derivado de peso y talla con su clasificación', () => {
    render(<SignosVitalesModule data={{ pesoKg: 64, tallaCm: 168 }} onChange={vi.fn()} />);

    expect(screen.getByLabelText('Índice de masa corporal')).toHaveTextContent('22.7');
    expect(screen.getByText('Peso normal')).toBeInTheDocument();
  });

  it('al cambiar el peso emite el peso y el IMC recalculado en un solo parche', () => {
    const onChange = vi.fn();
    render(<SignosVitalesModule data={{ pesoKg: 64, tallaCm: 168 }} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/Peso/), { target: { value: '80' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ pesoKg: 80, imc: 28.3 });
  });

  it('al cambiar la talla emite la talla y el IMC recalculado', () => {
    const onChange = vi.fn();
    render(<SignosVitalesModule data={{ pesoKg: 64, tallaCm: 168 }} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/Talla/), { target: { value: '160' } });

    expect(onChange).toHaveBeenCalledWith({ tallaCm: 160, imc: 25 });
  });

  it('borrar la talla emite el IMC vacío', () => {
    const onChange = vi.fn();
    render(<SignosVitalesModule data={{ pesoKg: 64, tallaCm: 168 }} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/Talla/), { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith({ tallaCm: undefined, imc: undefined });
  });

  it('un signo fuera de rango muestra el error de la regla compartida', () => {
    render(<SignosVitalesModule data={{ fc: 1200 }} onChange={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('F. cardíaca fuera de rango (30–250 lpm)');
    expect(screen.getByLabelText(/F\. Cardíaca/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('readOnly deshabilita todos los campos', () => {
    render(<SignosVitalesModule data={NORMALES} onChange={vi.fn()} readOnly />);

    screen.getAllByRole('spinbutton').forEach((input) => expect(input).toBeDisabled());
  });
});
