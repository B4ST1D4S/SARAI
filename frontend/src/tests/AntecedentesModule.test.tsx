import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AntecedentesModule } from '../modules/historia-clinica/submodulos/AntecedentesModule';
import { AntecedentesData } from '../types/historiaClinica.types';

describe('AntecedentesModule Component', () => {
  const mockData: AntecedentesData = {
    patologicos: 'Hipertensión arterial controlada',
    quirurgicos: 'Apendicectomía en 2018',
    alergicos: 'Penicilina / Sulfa',
    farmacologicos: 'Losartán 50mg cada 12h',
    toxicos: 'Exfumador hace 5 años',
    familiares: 'Madre con DM2, Padre con HTA',
    ginecoObstetricos: {
      fum: '2026-03-15',
      gravidez: 2,
      partos: 1,
      cesareas: 1,
      abortos: 0,
      planificacion: 'DIU de Cobre',
    },
  };

  it('Prueba 1: Renderizado correcto de todos los campos con datos iniciales', () => {
    const handleOnChange = vi.fn();

    render(
      <AntecedentesModule
        data={mockData}
        onChange={handleOnChange}
      />
    );

    // Campos principales de antecedentes personales
    expect(screen.getByLabelText(/Antecedentes Patológicos/i)).toHaveValue('Hipertensión arterial controlada');
    expect(screen.getByLabelText(/Antecedentes Quirúrgicos/i)).toHaveValue('Apendicectomía en 2018');
    expect(screen.getByLabelText(/Antecedentes Farmacológicos/i)).toHaveValue('Losartán 50mg cada 12h');
    expect(screen.getByLabelText(/Antecedentes Tóxicos/i)).toHaveValue('Exfumador hace 5 años');

    // Alerta de seguridad asistencial para alergias
    expect(screen.getByLabelText(/Antecedentes Alérgicos/i)).toHaveValue('Penicilina / Sulfa');
    expect(screen.getByText(/Seguridad Asistencial \/ Alerta Crítica/i)).toBeInTheDocument();

    // Antecedentes familiares
    expect(screen.getByLabelText(/Antecedentes Familiares/i)).toHaveValue('Madre con DM2, Padre con HTA');

    // Campos gineco-obstétricos
    expect(screen.getByLabelText(/Fecha Última Menstruación/i)).toHaveValue('2026-03-15');
    expect(screen.getByLabelText(/Gravidez/i)).toHaveValue(2);
    expect(screen.getByLabelText(/Partos/i)).toHaveValue(1);
    expect(screen.getByLabelText(/Cesáreas/i)).toHaveValue(1);
    expect(screen.getByLabelText(/Abortos/i)).toHaveValue(0);
    expect(screen.getByLabelText(/Método de Planificación/i)).toHaveValue('DIU de Cobre');
  });

  it('Prueba 2: Emisión adecuada de onChange cuando el usuario tipea en patológicos o alérgicos', () => {
    const handleOnChange = vi.fn();

    render(
      <AntecedentesModule
        data={mockData}
        onChange={handleOnChange}
      />
    );

    // Modificar patológicos
    const patologicosInput = screen.getByLabelText(/Antecedentes Patológicos/i);
    fireEvent.change(patologicosInput, {
      target: { value: 'Diabetes Mellitus tipo 2 recién diagnosticada' },
    });

    expect(handleOnChange).toHaveBeenCalledTimes(1);
    expect(handleOnChange).toHaveBeenCalledWith({
      ...mockData,
      patologicos: 'Diabetes Mellitus tipo 2 recién diagnosticada',
    });

    // Modificar alérgicos
    const alergicosInput = screen.getByLabelText(/Antecedentes Alérgicos/i);
    fireEvent.change(alergicosInput, {
      target: { value: 'Alergia severa a dipirona y mariscos' },
    });

    expect(handleOnChange).toHaveBeenCalledTimes(2);
    expect(handleOnChange).toHaveBeenLastCalledWith({
      ...mockData,
      alergicos: 'Alergia severa a dipirona y mariscos',
    });
  });

  it('Prueba 3: Comportamiento inhabilitado cuando se renderiza con readOnly={true}', () => {
    const handleOnChange = vi.fn();

    render(
      <AntecedentesModule
        data={mockData}
        onChange={handleOnChange}
        readOnly={true}
      />
    );

    expect(screen.getByLabelText(/Antecedentes Patológicos/i)).toBeDisabled();
    expect(screen.getByLabelText(/Antecedentes Quirúrgicos/i)).toBeDisabled();
    expect(screen.getByLabelText(/Antecedentes Farmacológicos/i)).toBeDisabled();
    expect(screen.getByLabelText(/Antecedentes Tóxicos/i)).toBeDisabled();
    expect(screen.getByLabelText(/Antecedentes Alérgicos/i)).toBeDisabled();
    expect(screen.getByLabelText(/Antecedentes Familiares/i)).toBeDisabled();
    expect(screen.getByLabelText(/Fecha Última Menstruación/i)).toBeDisabled();
    expect(screen.getByLabelText(/Gravidez/i)).toBeDisabled();
    expect(screen.getByLabelText(/Partos/i)).toBeDisabled();
    expect(screen.getByLabelText(/Cesáreas/i)).toBeDisabled();
    expect(screen.getByLabelText(/Abortos/i)).toBeDisabled();
    expect(screen.getByLabelText(/Método de Planificación/i)).toBeDisabled();
  });
});
