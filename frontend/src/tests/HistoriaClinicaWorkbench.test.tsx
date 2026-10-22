import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HistoriaClinicaWorkbench, DEFAULT_PLANTILLA_RESUELTA } from '../pages/HistoriaClinicaWorkbench';

describe('HistoriaClinicaWorkbench Component', () => {
  const mockPaciente = {
    id: 'pac_test_1',
    nombreCompleto: 'Laura Sofía Gómez',
    tipoDocumento: 'CC',
    numeroDocumento: '1098765432',
    edad: '28 años',
    sexo: 'Femenino',
    eps: 'Compensar',
  };

  it('debe renderizar la barra superior asistencial con los datos del paciente y plantilla', () => {
    render(
      <HistoriaClinicaWorkbench
        plantillaResuelta={DEFAULT_PLANTILLA_RESUELTA}
        paciente={mockPaciente}
      />
    );

    expect(screen.getByText('Laura Sofía Gómez')).toBeInTheDocument();
    expect(screen.getByText(/1098765432/)).toBeInTheDocument();
    expect(screen.getByText(/28 años/)).toBeInTheDocument();
    expect(screen.getAllByText(/HC-MED-GEN-01/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Guardar y Finalizar Atención').length).toBeGreaterThan(0);
  });

  it('debe renderizar las secciones de la plantilla en la sub-sidebar izquierda y en el contenido', () => {
    render(
      <HistoriaClinicaWorkbench
        plantillaResuelta={DEFAULT_PLANTILLA_RESUELTA}
        paciente={mockPaciente}
      />
    );

    DEFAULT_PLANTILLA_RESUELTA.estructura.secciones.forEach((sec) => {
      expect(screen.getAllByText(sec.titulo).length).toBeGreaterThan(0);
    });
  });

  it('debe renderizar los submódulos de la cascada derecha montados desde SUBMODULOS_REGISTRY', () => {
    render(
      <HistoriaClinicaWorkbench
        plantillaResuelta={DEFAULT_PLANTILLA_RESUELTA}
        paciente={mockPaciente}
      />
    );

    // Verificar presencia de títulos de submódulos
    expect(screen.getByText(/Motivo de Consulta & Anamnesis/i)).toBeInTheDocument();
    expect(screen.getByText(/Signos Vitales & Biometría/i)).toBeInTheDocument();
    expect(screen.getByText(/Diagnósticos \(CIE-10\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Plan de Manejo & Conducta/i)).toBeInTheDocument();
  });

  it('debe actualizar el estado del borrador al escribir en el motivo de consulta', async () => {
    render(
      <HistoriaClinicaWorkbench
        plantillaResuelta={DEFAULT_PLANTILLA_RESUELTA}
        paciente={mockPaciente}
      />
    );

    const motivoInput = await screen.findByPlaceholderText(/Describa textualmente el motivo expresado/i);
    fireEvent.change(motivoInput, { target: { value: 'Paciente refiere dolor abdominal agudo' } });

    await waitFor(() => {
      expect(motivoInput).toHaveValue('Paciente refiere dolor abdominal agudo');
      expect(screen.getByText(/Cambios pendientes/i)).toBeInTheDocument();
    });
  });

  it('debe calcular el IMC automáticamente en el submódulo de signos vitales', async () => {
    render(
      <HistoriaClinicaWorkbench
        plantillaResuelta={DEFAULT_PLANTILLA_RESUELTA}
        paciente={mockPaciente}
      />
    );

    const pesoInput = await screen.findByPlaceholderText('70.0');
    const tallaInput = await screen.findByPlaceholderText('170');

    fireEvent.change(pesoInput, { target: { value: '80' } });
    fireEvent.change(tallaInput, { target: { value: '180' } });

    // 80 / (1.80 * 1.80) = 24.7 (Peso normal)
    await waitFor(() => {
      expect(screen.getByText('24.7')).toBeInTheDocument();
      expect(screen.getByText(/Peso normal/i)).toBeInTheDocument();
    });
  });

  it('debe llamar a onSaveDraft cuando se hace clic en Guardar Borrador', async () => {
    const handleSaveDraft = vi.fn();

    render(
      <HistoriaClinicaWorkbench
        plantillaResuelta={DEFAULT_PLANTILLA_RESUELTA}
        paciente={mockPaciente}
        onSaveDraft={handleSaveDraft}
      />
    );

    const btnGuardarBorrador = screen.getByText('Guardar Borrador');
    fireEvent.click(btnGuardarBorrador);

    await waitFor(() => {
      expect(handleSaveDraft).toHaveBeenCalledTimes(1);
    });

    await screen.findByText(/Guardado a las/i);
  });
});
