import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlanManejoModule } from '../modules/historia-clinica/submodulos/PlanManejoModule';
import { PlanManejoData } from '../types/historiaClinica.types';

describe('PlanManejoModule Component', () => {
  const mockData: PlanManejoData = {
    conducta: 'Iniciar antibioticoterapia ambulatoria con Amoxicilina 500mg cada 8 horas por 7 días.',
    recomendaciones: 'Hidratación abundante, reposo relativo en casa, dieta blanda y fraccionada.',
    signosAlarma: 'Fiebre persistente >38.5°C no atribuible, dolor abdominal agudo, intolerancia a la vía oral.',
    incapacidad: {
      requiere: false,
    },
  };

  it('Caso 1: Renderizado inicial de conducta, recomendaciones y signos de alarma', () => {
    const handleOnChange = vi.fn();

    render(
      <PlanManejoModule
        data={mockData}
        onChange={handleOnChange}
      />
    );

    // Conducta médica
    expect(screen.getByLabelText(/Conducta Médica/i)).toHaveValue(mockData.conducta);
    // Recomendaciones generales
    expect(screen.getByLabelText(/Recomendaciones Generales/i)).toHaveValue(mockData.recomendaciones);
    // Signos de alarma
    expect(screen.getByLabelText(/Signos de Alarma/i)).toHaveValue(mockData.signosAlarma);
    // Checkbox de incapacidad desmarcado y campos no visibles inicialmente
    expect(screen.getByLabelText(/¿Genera incapacidad médica\?/i)).not.toBeChecked();
    expect(screen.queryByLabelText(/Días de Incapacidad/i)).not.toBeInTheDocument();
  });

  it('Caso 2: Emisión inmutable de onChange al tipear en el campo de conducta o recomendaciones', () => {
    const handleOnChange = vi.fn();

    render(
      <PlanManejoModule
        data={mockData}
        onChange={handleOnChange}
      />
    );

    // Tipear en conducta
    const conductaInput = screen.getByLabelText(/Conducta Médica/i);
    fireEvent.change(conductaInput, {
      target: { value: 'Nueva conducta: Manejo expectante y control en 48 horas.' },
    });

    expect(handleOnChange).toHaveBeenCalledTimes(1);
    expect(handleOnChange).toHaveBeenCalledWith({
      ...mockData,
      conducta: 'Nueva conducta: Manejo expectante y control en 48 horas.',
    });

    // Tipear en recomendaciones
    const recomendacionesInput = screen.getByLabelText(/Recomendaciones Generales/i);
    fireEvent.change(recomendacionesInput, {
      target: { value: 'Uso de protector solar diario cada 4 horas.' },
    });

    expect(handleOnChange).toHaveBeenCalledTimes(2);
    expect(handleOnChange).toHaveBeenLastCalledWith({
      ...mockData,
      recomendaciones: 'Uso de protector solar diario cada 4 horas.',
    });
  });

  it('Caso 3: Activación de incapacidad médica y edición de días/fechas', () => {
    const handleOnChange = vi.fn();

    const dataConIncapacidad: PlanManejoData = {
      ...mockData,
      incapacidad: {
        requiere: true,
        dias: 3,
        fechaInicio: '2026-10-08',
        fechaFin: '2026-10-10',
        observaciones: 'Reposo en cama por cuadro viral.',
      },
    };

    const { rerender } = render(
      <PlanManejoModule
        data={mockData}
        onChange={handleOnChange}
      />
    );

    // Activar checkbox
    const checkbox = screen.getByLabelText(/¿Genera incapacidad médica\?/i);
    fireEvent.click(checkbox);

    expect(handleOnChange).toHaveBeenCalledWith({
      ...mockData,
      incapacidad: {
        requiere: true,
      },
    });

    // Re-render con incapacidad activa
    rerender(
      <PlanManejoModule
        data={dataConIncapacidad}
        onChange={handleOnChange}
      />
    );

    expect(screen.getByLabelText(/¿Genera incapacidad médica\?/i)).toBeChecked();
    const diasInput = screen.getByLabelText(/Días de Incapacidad/i);
    const fechaInicioInput = screen.getByLabelText(/Fecha de Inicio/i);
    const fechaFinInput = screen.getByLabelText(/Fecha de Fin/i);
    const observacionesInput = screen.getByLabelText(/Observaciones de Incapacidad/i);

    expect(diasInput).toHaveValue(3);
    expect(fechaInicioInput).toHaveValue('2026-10-08');
    expect(fechaFinInput).toHaveValue('2026-10-10');
    expect(observacionesInput).toHaveValue('Reposo en cama por cuadro viral.');

    // Editar días
    fireEvent.change(diasInput, { target: { value: '5' } });
    expect(handleOnChange).toHaveBeenLastCalledWith({
      ...dataConIncapacidad,
      incapacidad: {
        ...dataConIncapacidad.incapacidad,
        dias: 5,
      },
    });

    // Editar fecha de inicio
    fireEvent.change(fechaInicioInput, { target: { value: '2026-10-09' } });
    expect(handleOnChange).toHaveBeenLastCalledWith({
      ...dataConIncapacidad,
      incapacidad: {
        ...dataConIncapacidad.incapacidad,
        fechaInicio: '2026-10-09',
      },
    });
  });

  it('Caso 4: Deshabilitación total de controles (disabled) cuando readOnly={true}', () => {
    const handleOnChange = vi.fn();

    const dataConIncapacidad: PlanManejoData = {
      ...mockData,
      incapacidad: {
        requiere: true,
        dias: 3,
        fechaInicio: '2026-10-08',
        fechaFin: '2026-10-10',
        observaciones: 'Reposo en cama.',
      },
    };

    render(
      <PlanManejoModule
        data={dataConIncapacidad}
        onChange={handleOnChange}
        readOnly={true}
      />
    );

    expect(screen.getByLabelText(/Conducta Médica/i)).toBeDisabled();
    expect(screen.getByLabelText(/Recomendaciones Generales/i)).toBeDisabled();
    expect(screen.getByLabelText(/Signos de Alarma/i)).toBeDisabled();
    expect(screen.getByLabelText(/¿Genera incapacidad médica\?/i)).toBeDisabled();
    expect(screen.getByLabelText(/Días de Incapacidad/i)).toBeDisabled();
    expect(screen.getByLabelText(/Fecha de Inicio/i)).toBeDisabled();
    expect(screen.getByLabelText(/Fecha de Fin/i)).toBeDisabled();
    expect(screen.getByLabelText(/Observaciones de Incapacidad/i)).toBeDisabled();
  });
});
