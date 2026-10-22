import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanManejoModule, type IncapacidadMedicaData, type PlanManejoData } from '../PlanManejoModule';
import { erroresCierrePlanManejo, fechaFinIncapacidad } from '../../utils/validaciones';

const HOY = '2026-10-22';

/** Certificado completo y coherente, que inicia hoy. */
const CERTIFICADO: IncapacidadMedicaData = {
  requiere: true,
  tipoIncapacidad: 'ENFERMEDAD_GENERAL',
  modalidadServicio: 'INTRAMURAL',
  fechaInicio: HOY,
  dias: 3,
  esProrroga: false,
  esRetroactiva: false,
  codigoCie10: 'J06.9',
  observaciones: 'Reposo por infección respiratoria aguda',
};

/** Último parche emitido por onChange. */
const ultimo = (onChange: ReturnType<typeof vi.fn>) => onChange.mock.lastCall?.[0] as PlanManejoData;

describe('PlanManejoModule', () => {
  afterEach(cleanup);

  describe('conducta', () => {
    it('escribir la conducta emite solo ese campo', async () => {
      const onChange = vi.fn();
      render(<PlanManejoModule data={{ conducta: 'Analgesia' }} onChange={onChange} />);

      await userEvent.setup().type(screen.getByLabelText(/Conducta Médica/), '.');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({ conducta: 'Analgesia.' });
    });

    it('una conducta diligenciada pero corta muestra el error; vacía no', () => {
      const { rerender } = render(<PlanManejoModule data={{ conducta: 'Hid' }} onChange={vi.fn()} />);
      expect(screen.getByRole('alert')).toHaveTextContent('mínimo 5 caracteres');

      rerender(<PlanManejoModule data={{}} onChange={vi.fn()} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('incapacidad', () => {
    it('el detalle del certificado solo aparece al otorgar incapacidad', async () => {
      const onChange = vi.fn();
      render(<PlanManejoModule data={{}} onChange={onChange} />);

      expect(screen.queryByLabelText(/Número de días/)).not.toBeInTheDocument();
      await userEvent.setup().click(screen.getByLabelText('Otorgar incapacidad'));

      expect(ultimo(onChange)).toEqual({ incapacidad: { requiere: true, fechaFin: undefined } });
    });

    it('introducir los días emite el certificado completo con la fecha final derivada', () => {
      const onChange = vi.fn();
      const data: PlanManejoData = { conducta: 'Reposo', incapacidad: { requiere: true, fechaInicio: '2026-10-30' } };
      render(<PlanManejoModule data={data} onChange={onChange} />);

      fireEvent.change(screen.getByLabelText(/Número de días/), { target: { value: '5' } });

      // Cruza el fin de mes: 30 oct + 5 días - 1 = 3 nov.
      expect(ultimo(onChange)).toEqual({
        incapacidad: { requiere: true, fechaInicio: '2026-10-30', dias: 5, fechaFin: '2026-11-03' },
      });
      expect(data.incapacidad).toEqual({ requiere: true, fechaInicio: '2026-10-30' });
    });

    it('la fecha final se muestra derivada de data en cada render', () => {
      render(<PlanManejoModule data={{ incapacidad: { requiere: true, fechaInicio: '2026-10-01', dias: 10 } }} onChange={vi.fn()} />);

      expect(screen.getByTestId('incap-fecha-fin')).toHaveTextContent('10/10/2026');
    });

    it('sin días válidos no hay fecha final', () => {
      render(<PlanManejoModule data={{ incapacidad: { requiere: true, fechaInicio: '2026-10-01' } }} onChange={vi.fn()} />);

      expect(screen.getByTestId('incap-fecha-fin')).toHaveTextContent('—');
    });

    it('una fecha de inicio pasada sugiere marcarla como retroactiva', () => {
      const onChange = vi.fn();
      render(<PlanManejoModule data={{ incapacidad: { requiere: true, dias: 2 } }} onChange={onChange} />);

      fireEvent.change(screen.getByLabelText(/Fecha de inicio/), { target: { value: '2020-01-10' } });

      expect(ultimo(onChange).incapacidad).toEqual(
        expect.objectContaining({ fechaInicio: '2020-01-10', esRetroactiva: true, fechaFin: '2020-01-11' }),
      );
    });

    it('un código CIE-10 mal formado muestra error; uno vacío no (se exige al cierre)', () => {
      const { rerender } = render(
        <PlanManejoModule data={{ incapacidad: { requiere: true, codigoCie10: '123' } }} onChange={vi.fn()} />,
      );
      expect(screen.getByRole('alert')).toHaveTextContent('código CIE-10 válido');

      rerender(<PlanManejoModule data={{ incapacidad: { requiere: true } }} onChange={vi.fn()} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('readOnly deshabilita la conducta, el certificado y sus campos', () => {
    render(<PlanManejoModule data={{ conducta: 'Reposo', incapacidad: CERTIFICADO }} onChange={vi.fn()} readOnly />);

    expect(screen.getByLabelText(/Conducta Médica/)).toBeDisabled();
    expect(screen.getByLabelText('Otorgar incapacidad')).toBeDisabled();
    expect(screen.getByLabelText(/Número de días/)).toBeDisabled();
    screen.getAllByRole('radio').forEach((r) => expect(r).toBeDisabled());
  });
});

describe('reglas de cierre del plan de manejo', () => {
  it('fechaFinIncapacidad: inicio + días - 1, sin fecha si faltan datos', () => {
    expect(fechaFinIncapacidad('2026-10-22', 1)).toBe('2026-10-22');
    expect(fechaFinIncapacidad('2026-12-30', 3)).toBe('2027-01-01');
    expect(fechaFinIncapacidad('2026-10-22', 0)).toBeUndefined();
    expect(fechaFinIncapacidad('2026-02-30', 3)).toBeUndefined();
  });

  it('exige la conducta mínima', () => {
    expect(erroresCierrePlanManejo({}, HOY)).toEqual(['Describa la conducta médica (mínimo 5 caracteres).']);
    expect(erroresCierrePlanManejo({ conducta: 'Analgesia y control' }, HOY)).toEqual([]);
  });

  it('sin incapacidad otorgada no exige el certificado', () => {
    expect(erroresCierrePlanManejo({ conducta: 'Analgesia', incapacidad: { requiere: false } }, HOY)).toEqual([]);
  });

  it('con incapacidad otorgada exige el certificado completo', () => {
    expect(erroresCierrePlanManejo({ conducta: 'Reposo', incapacidad: CERTIFICADO }, HOY)).toEqual([]);
    expect(erroresCierrePlanManejo({ conducta: 'Reposo', incapacidad: { requiere: true } }, HOY)).toEqual([
      'Seleccione el tipo de incapacidad.',
      'Seleccione la modalidad del servicio.',
      'Indique los días (entero entre 1 y 180).',
      'Indique si es prórroga.',
      'Indique un código CIE-10 válido (ej. J06.9).',
      'Escriba la observación de la incapacidad.',
      'Indique una fecha de inicio válida.',
    ]);
  });

  it('la retroactividad debe coincidir con la fecha de inicio', () => {
    const pasada = { ...CERTIFICADO, fechaInicio: '2026-10-20' };
    expect(erroresCierrePlanManejo({ conducta: 'Reposo', incapacidad: pasada }, HOY)).toEqual([
      'La fecha de inicio es anterior a hoy: márquela como retroactiva.',
    ]);
    expect(erroresCierrePlanManejo({ conducta: 'Reposo', incapacidad: { ...CERTIFICADO, esRetroactiva: true } }, HOY)).toEqual([
      'Una incapacidad retroactiva debe iniciar antes de hoy.',
    ]);
  });
});
