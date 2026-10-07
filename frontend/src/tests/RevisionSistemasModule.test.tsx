import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RevisionSistemasModule } from '../modules/historia-clinica/submodulos/RevisionSistemasModule';
import { RevisionSistemasData } from '../types/historiaClinica.types';

describe('RevisionSistemasModule Component', () => {
  const mockData: RevisionSistemasData = {
    general: 'Sin astenia ni adinamia. Afebril.',
    cardiovascular: 'Niega dolor precordial o palpitaciones.',
    respiratorio: 'Niega disnea o tos.',
    gastrointestinal: 'Niega dolor abdominal o náuseas.',
    genitourinario: 'Micción espontánea sin disuria.',
    neurologico: 'Sin cefalea ni mareo.',
    osteomuscular: 'Sin artralgias ni limitación funcional.',
    dermatologico: 'Piel íntegra sin lesiones activas.',
  };

  it('Caso 1: Renderizado completo de los 8 sistemas interrogados con sus etiquetas', () => {
    const handleOnChange = vi.fn();

    render(
      <RevisionSistemasModule
        data={mockData}
        onChange={handleOnChange}
      />
    );

    // 8 sistemas interrogados
    expect(screen.getByLabelText(/General \/ Constitucional/i)).toHaveValue(mockData.general);
    expect(screen.getByLabelText(/Cardiovascular/i)).toHaveValue(mockData.cardiovascular);
    expect(screen.getByLabelText(/Respiratorio/i)).toHaveValue(mockData.respiratorio);
    expect(screen.getByLabelText(/Gastrointestinal/i)).toHaveValue(mockData.gastrointestinal);
    expect(screen.getByLabelText(/Genitourinario/i)).toHaveValue(mockData.genitourinario);
    expect(screen.getByLabelText(/Neurológico/i)).toHaveValue(mockData.neurologico);
    expect(screen.getByLabelText(/Osteomuscular/i)).toHaveValue(mockData.osteomuscular);
    expect(screen.getByLabelText(/Dermatológico/i)).toHaveValue(mockData.dermatologico);
  });

  it('Caso 2: Emisión inmutable de onChange ante eventos de escritura (respiratorio y cardiovascular)', () => {
    const handleOnChange = vi.fn();

    render(
      <RevisionSistemasModule
        data={mockData}
        onChange={handleOnChange}
      />
    );

    // Modificar respiratorio
    const respiratorioInput = screen.getByLabelText(/Respiratorio/i);
    fireEvent.change(respiratorioInput, {
      target: { value: 'Refiere tos seca ocasional en las noches.' },
    });

    expect(handleOnChange).toHaveBeenCalledTimes(1);
    expect(handleOnChange).toHaveBeenCalledWith({
      ...mockData,
      respiratorio: 'Refiere tos seca ocasional en las noches.',
    });

    // Modificar cardiovascular
    const cardiovascularInput = screen.getByLabelText(/Cardiovascular/i);
    fireEvent.change(cardiovascularInput, {
      target: { value: 'Palpitaciones esporádicas asociadas al estrés.' },
    });

    expect(handleOnChange).toHaveBeenCalledTimes(2);
    expect(handleOnChange).toHaveBeenLastCalledWith({
      ...mockData,
      cardiovascular: 'Palpitaciones esporádicas asociadas al estrés.',
    });
  });

  it('Caso 3: Deshabilitación total de controles (disabled) cuando readOnly={true}', () => {
    const handleOnChange = vi.fn();

    render(
      <RevisionSistemasModule
        data={mockData}
        onChange={handleOnChange}
        readOnly={true}
      />
    );

    expect(screen.getByLabelText(/General \/ Constitucional/i)).toBeDisabled();
    expect(screen.getByLabelText(/Cardiovascular/i)).toBeDisabled();
    expect(screen.getByLabelText(/Respiratorio/i)).toBeDisabled();
    expect(screen.getByLabelText(/Gastrointestinal/i)).toBeDisabled();
    expect(screen.getByLabelText(/Genitourinario/i)).toBeDisabled();
    expect(screen.getByLabelText(/Neurológico/i)).toBeDisabled();
    expect(screen.getByLabelText(/Osteomuscular/i)).toBeDisabled();
    expect(screen.getByLabelText(/Dermatológico/i)).toBeDisabled();
  });
});
