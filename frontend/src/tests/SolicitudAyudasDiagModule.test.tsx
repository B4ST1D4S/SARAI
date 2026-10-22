import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SolicitudAyudasDiagModule } from '../modules/historia-clinica/submodulos/SolicitudAyudasDiagModule';
import { SolicitudAyudasDiagData, AyudaDiagnosticaItem } from '../types/historiaClinica.types';

describe('SolicitudAyudasDiagModule Component', () => {
  const itemMock1: AyudaDiagnosticaItem = {
    id: 'estudio_1',
    codigoCups: '903841',
    descripcion: 'Hemograma tipo IV automatizado',
    cantidad: 1,
    justificacion: 'Evaluación de anemia y recuento plaquetario.',
  };

  const itemMock2: AyudaDiagnosticaItem = {
    id: 'estudio_2',
    codigoCups: '871010',
    descripcion: 'Radiografía de tórax PA y lateral',
    cantidad: 1,
    justificacion: 'Descarte de condensación pulmonar.',
  };

  const mockDataConItems: SolicitudAyudasDiagData = {
    items: [itemMock1, itemMock2],
    observacionesGenerales: 'Ayuno mínimo de 8 horas para toma de muestras sanguíneas.',
  };

  it('Caso 1: Renderizado con lista vacía y mensaje de ausencia de estudios', () => {
    const handleOnChange = vi.fn();

    render(
      <SolicitudAyudasDiagModule
        data={{ items: [] }}
        onChange={handleOnChange}
      />
    );

    expect(screen.getByText(/No se han ordenado paraclínicos o ayudas diagnósticas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agregar Estudio \/ Paraclínico/i })).toBeInTheDocument();
  });

  it('Caso 2: Adición de un nuevo estudio mediante el botón "Agregar" y propagación a onChange', () => {
    const handleOnChange = vi.fn();

    render(
      <SolicitudAyudasDiagModule
        data={{ items: [] }}
        onChange={handleOnChange}
      />
    );

    const btnAgregar = screen.getByRole('button', { name: /Agregar Estudio \/ Paraclínico/i });
    fireEvent.click(btnAgregar);

    expect(handleOnChange).toHaveBeenCalledTimes(1);
    const callArg = handleOnChange.mock.calls[0][0];
    expect(callArg.items).toHaveLength(1);
    expect(callArg.items[0]).toEqual(
      expect.objectContaining({
        codigoCups: '',
        descripcion: '',
        cantidad: 1,
        justificacion: '',
      })
    );
  });

  it('Caso 3: Eliminación de un item existente', () => {
    const handleOnChange = vi.fn();

    render(
      <SolicitudAyudasDiagModule
        data={mockDataConItems}
        onChange={handleOnChange}
      />
    );

    // Verificar que los dos items se renderizan
    expect(screen.getByDisplayValue('Hemograma tipo IV automatizado')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Radiografía de tórax PA y lateral')).toBeInTheDocument();

    // Eliminar el primer estudio
    const btnEliminar = screen.getByLabelText('Eliminar estudio 1');
    fireEvent.click(btnEliminar);

    expect(handleOnChange).toHaveBeenCalledTimes(1);
    expect(handleOnChange).toHaveBeenCalledWith({
      ...mockDataConItems,
      items: [itemMock2],
    });
  });

  it('Caso 4: Deshabilitación de controles y bloqueo de botones cuando readOnly={true}', () => {
    const handleOnChange = vi.fn();

    render(
      <SolicitudAyudasDiagModule
        data={mockDataConItems}
        onChange={handleOnChange}
        readOnly={true}
      />
    );

    // Los botones de acción deben no existir o estar bloqueados
    expect(screen.queryByRole('button', { name: /Agregar Estudio \/ Paraclínico/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Eliminar estudio/i)).not.toBeInTheDocument();

    // Todos los campos editables deben estar inhabilitados
    const cupsInputs = screen.getAllByLabelText(/Código CUPS/i);
    cupsInputs.forEach((input) => expect(input).toBeDisabled());

    const descInputs = screen.getAllByLabelText(/Descripción del Estudio/i);
    descInputs.forEach((input) => expect(input).toBeDisabled());

    const cantInputs = screen.getAllByLabelText(/Cantidad/i);
    cantInputs.forEach((input) => expect(input).toBeDisabled());

    const justInputs = screen.getAllByLabelText(/Justificación Clínica/i);
    justInputs.forEach((input) => expect(input).toBeDisabled());

    expect(screen.getByLabelText(/Observaciones Generales/i)).toBeDisabled();
  });
});
