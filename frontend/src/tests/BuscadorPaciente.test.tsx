/**
 * Tests del Módulo 1 — BuscadorPaciente
 * Verifica la búsqueda y creación de pacientes
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BuscadorPaciente } from '../components/BuscadorPaciente';

// Mock fetch global
const mockFetch = vi.fn();
(window as any).fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('BuscadorPaciente — Búsqueda', () => {
  const onPacienteEncontrado = vi.fn();
  const onNuevoPaciente = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.setItem('accessToken', 'token-test-valido');
  });

  it('Renderiza el formulario de búsqueda con tipo y número de documento', () => {
    render(
      <BuscadorPaciente
        onPacienteEncontrado={onPacienteEncontrado}
        onNuevoPaciente={onNuevoPaciente}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Búsqueda de Paciente')).toBeInTheDocument();
    expect(screen.getByText('Buscar Paciente')).toBeInTheDocument();
    expect(screen.getByText('Crear Nuevo')).toBeInTheDocument();
  });

  it('Muestra error si se busca con campo vacío', async () => {
    render(
      <BuscadorPaciente
        onPacienteEncontrado={onPacienteEncontrado}
        onNuevoPaciente={onNuevoPaciente}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('Buscar Paciente'));

    await waitFor(() => {
      expect(screen.getByText(/Por favor ingresa el número de documento/i)).toBeInTheDocument();
    });
  });

  it('Muestra paciente encontrado cuando la API responde 200', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'pac-001',
        nombreCompleto: 'Juan Pérez Test',
        tipoDocumento: 'CC',
        numeroDocumento: '12345678',
        email: 'juan@test.com',
        telefonos: ['3001234567'],
      }),
    });

    render(
      <BuscadorPaciente
        onPacienteEncontrado={onPacienteEncontrado}
        onNuevoPaciente={onNuevoPaciente}
        onClose={onClose}
      />
    );

    const input = screen.getByPlaceholderText(/Ej: 1234567890/i);
    fireEvent.change(input, { target: { value: '12345678' } });
    fireEvent.click(screen.getByText('Buscar Paciente'));

    await waitFor(() => {
      expect(screen.getByText('¡Paciente Encontrado!')).toBeInTheDocument();
      expect(screen.getByText('Juan Pérez Test')).toBeInTheDocument();
    });
  });

  it('Muestra "Paciente no encontrado" cuando la API responde 404', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'No encontrado' }),
    });

    render(
      <BuscadorPaciente
        onPacienteEncontrado={onPacienteEncontrado}
        onNuevoPaciente={onNuevoPaciente}
        onClose={onClose}
      />
    );

    const input = screen.getByPlaceholderText(/Ej: 1234567890/i);
    fireEvent.change(input, { target: { value: '99999999' } });
    fireEvent.click(screen.getByText('Buscar Paciente'));

    await waitFor(() => {
      expect(screen.getByText('Paciente no encontrado')).toBeInTheDocument();
    });
  });

  it('Llama onNuevoPaciente al hacer click en "Crear Nuevo"', () => {
    render(
      <BuscadorPaciente
        onPacienteEncontrado={onPacienteEncontrado}
        onNuevoPaciente={onNuevoPaciente}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('Crear Nuevo'));
    expect(onNuevoPaciente).toHaveBeenCalledTimes(1);
  });

  it('Llama onPacienteEncontrado al seleccionar paciente encontrado', async () => {
    const pacienteMock = {
      id: 'pac-001',
      nombreCompleto: 'Maria López',
      tipoDocumento: 'CC',
      numeroDocumento: '87654321',
      email: 'maria@test.com',
      telefonos: ['3009876543'],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => pacienteMock,
    });

    render(
      <BuscadorPaciente
        onPacienteEncontrado={onPacienteEncontrado}
        onNuevoPaciente={onNuevoPaciente}
        onClose={onClose}
      />
    );

    const input = screen.getByPlaceholderText(/Ej: 1234567890/i);
    fireEvent.change(input, { target: { value: '87654321' } });
    fireEvent.click(screen.getByText('Buscar Paciente'));

    await waitFor(() => {
      expect(screen.getByText('Usar este Paciente')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Usar este Paciente'));
    expect(onPacienteEncontrado).toHaveBeenCalledWith(pacienteMock);
  });

  it('Llama onClose al hacer click en el backdrop', () => {
    const { container } = render(
      <BuscadorPaciente
        onPacienteEncontrado={onPacienteEncontrado}
        onNuevoPaciente={onNuevoPaciente}
        onClose={onClose}
      />
    );

    // Click en el backdrop (primer div fixed)
    const backdrop = container.querySelector('.fixed.inset-0');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
