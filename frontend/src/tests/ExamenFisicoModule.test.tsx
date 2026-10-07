import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExamenFisicoModule } from '../modules/historia-clinica/submodulos/ExamenFisicoModule';
import { ExamenFisicoData } from '../types/historiaClinica.types';

describe('ExamenFisicoModule Component', () => {
  const mockData: ExamenFisicoData = {
    estadoGeneral: 'Paciente en adecuadas condiciones generales, hidratado, orientado.',
    cabezaCuello: 'Normocéfalo, escleras anictéricas, cuello sin adenopatías.',
    toraxCardiopulmonar: 'Ruidos cardíacos rítmicos sin soplos, murmullo vesicular limpio.',
    abdomen: 'Blando, depresible, no doloroso, sin visceromegalias.',
    extremidades: 'Simétricas, sin edema, pulsos distales conservados.',
    neurologico: 'Alerta, orientado, Glasgow 15/15, sin déficit motor.',
    osteomuscular: 'Arcos de movimiento completos, fuerza 5/5 conservada.',
  };

  it('Caso 1: Renderizado completo de los campos del examen físico con sus placeholders/etiquetas', () => {
    const handleOnChange = vi.fn();

    const { rerender } = render(
      <ExamenFisicoModule
        data={mockData}
        onChange={handleOnChange}
      />
    );

    // Verificación de etiquetas y valores
    expect(screen.getByLabelText(/Estado General/i)).toHaveValue(mockData.estadoGeneral);
    expect(screen.getByLabelText(/Cabeza y Cuello/i)).toHaveValue(mockData.cabezaCuello);
    expect(screen.getByLabelText(/Tórax y Cardiopulmonar/i)).toHaveValue(mockData.toraxCardiopulmonar);
    expect(screen.getByLabelText(/Abdomen/i)).toHaveValue(mockData.abdomen);
    expect(screen.getByLabelText(/Extremidades/i)).toHaveValue(mockData.extremidades);
    expect(screen.getByLabelText(/Neurológico/i)).toHaveValue(mockData.neurologico);
    expect(screen.getByLabelText(/Osteomuscular/i)).toHaveValue(mockData.osteomuscular);

    // Verificación de placeholders contextuales cuando no hay datos
    rerender(
      <ExamenFisicoModule
        data={{}}
        onChange={handleOnChange}
      />
    );

    expect(screen.getByPlaceholderText(/Paciente alerta, orientado/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Normocéfalo, pupilas isocóricas/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ruidos cardíacos rítmicos/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Blando, depresible, no doloroso/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Simétricas, eutróficas/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Escala de Glasgow 15\/15/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Arcos de movimiento activos/i)).toBeInTheDocument();
  });

  it('Caso 2: Emisión adecuada e inmutable de onChange ante eventos de escritura (cabezaCuello y abdomen)', () => {
    const handleOnChange = vi.fn();

    render(
      <ExamenFisicoModule
        data={mockData}
        onChange={handleOnChange}
      />
    );

    // Escritura en cabezaCuello
    const cabezaCuelloInput = screen.getByLabelText(/Cabeza y Cuello/i);
    fireEvent.change(cabezaCuelloInput, {
      target: { value: 'Pupilas mióticas, conjuntivas pálidas.' },
    });

    expect(handleOnChange).toHaveBeenCalledTimes(1);
    expect(handleOnChange).toHaveBeenCalledWith({
      ...mockData,
      cabezaCuello: 'Pupilas mióticas, conjuntivas pálidas.',
    });

    // Escritura en abdomen
    const abdomenInput = screen.getByLabelText(/Abdomen/i);
    fireEvent.change(abdomenInput, {
      target: { value: 'Dolor en fosa ilíaca derecha a la descompresión.' },
    });

    expect(handleOnChange).toHaveBeenCalledTimes(2);
    expect(handleOnChange).toHaveBeenLastCalledWith({
      ...mockData,
      abdomen: 'Dolor en fosa ilíaca derecha a la descompresión.',
    });
  });

  it('Caso 3: Deshabilitación de controles (disabled) cuando readOnly={true}', () => {
    const handleOnChange = vi.fn();

    render(
      <ExamenFisicoModule
        data={mockData}
        onChange={handleOnChange}
        readOnly={true}
      />
    );

    expect(screen.getByLabelText(/Estado General/i)).toBeDisabled();
    expect(screen.getByLabelText(/Cabeza y Cuello/i)).toBeDisabled();
    expect(screen.getByLabelText(/Tórax y Cardiopulmonar/i)).toBeDisabled();
    expect(screen.getByLabelText(/Abdomen/i)).toBeDisabled();
    expect(screen.getByLabelText(/Extremidades/i)).toBeDisabled();
    expect(screen.getByLabelText(/Neurológico/i)).toBeDisabled();
    expect(screen.getByLabelText(/Osteomuscular/i)).toBeDisabled();
  });
});
