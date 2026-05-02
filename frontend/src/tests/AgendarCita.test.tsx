/**
 * Tests del Módulo 1 — AgendarCita
 * Verifica el formulario de agendamiento y validaciones
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AgendarCita from '../components/AgendarCita';

// Mock framer-motion para que AnimatePresence renderice inmediatamente en jsdom
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_target: any, tag: string) =>
      ({ children, whileHover, whileTap, initial, animate, exit, transition, layout, ...rest }: any) => {
        const Tag = tag as keyof JSX.IntrinsicElements;
        return <Tag {...rest}>{children}</Tag>;
      },
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockLocalStorage = (() => {
  let store: Record<string, string> = {
    accessToken: 'token-test-valido',
    user: JSON.stringify({ id: 'medico-001', nombre: 'Dr. Test', rol: 'MEDICO' }),
  };
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('AgendarCita — Formulario', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Renderiza con nombre del paciente', () => {
    render(
      <AgendarCita
        pacienteId="pac-001"
        pacienteNombre="Juan Pérez"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    // Tanto el h2 como el botón contienen "Agendar Cita"
    expect(screen.getAllByText('Agendar Cita').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Juan Pérez/)).toBeInTheDocument();
  });

  it('Muestra error si se intenta agendar sin fecha/hora', async () => {
    const { container } = render(
      <AgendarCita
        pacienteId="pac-001"
        pacienteNombre="Juan Pérez"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    // Disparar submit directamente en el form para evitar que HTML5 required bloquee
    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Por favor completa fecha y hora/i)).toBeInTheDocument();
    });
  });

  it('Muestra error si pacienteId está vacío', async () => {
    render(
      <AgendarCita
        pacienteId=""
        pacienteNombre="Sin ID"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    // Llenar fecha y hora para pasar esa validación
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-06-01', name: 'fecha' } });

    const horaSelect = document.querySelector('select[name="hora"]') as HTMLSelectElement;
    fireEvent.change(horaSelect, { target: { value: '09:00', name: 'hora' } });

    const submitBtn = screen.getByRole('button', { name: /Agendar Cita/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/No se encontró el paciente/i)
      ).toBeInTheDocument();
    });
  });

  it('Muestra pantalla de éxito al agendar correctamente', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        cita: { id: 'cita-001', estado: 'PENDIENTE' },
      }),
    });

    render(
      <AgendarCita
        pacienteId="pac-001"
        pacienteNombre="Juan Pérez"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-06-10', name: 'fecha' } });

    const horaSelect = document.querySelector('select[name="hora"]') as HTMLSelectElement;
    fireEvent.change(horaSelect, { target: { value: '10:00', name: 'hora' } });

    const submitBtn = screen.getByRole('button', { name: /Agendar Cita/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('¡Cita Agendada!')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('Muestra error del servidor si la API falla', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Horario no disponible' }),
    });

    render(
      <AgendarCita
        pacienteId="pac-001"
        pacienteNombre="Juan Pérez"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-06-10', name: 'fecha' } });

    const horaSelect = document.querySelector('select[name="hora"]') as HTMLSelectElement;
    fireEvent.change(horaSelect, { target: { value: '10:00', name: 'hora' } });

    const submitBtn = screen.getByRole('button', { name: /Agendar Cita/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Horario no disponible')).toBeInTheDocument();
    });
  });

  it('Llama onClose al hacer click en Cancelar', () => {
    render(
      <AgendarCita
        pacienteId="pac-001"
        pacienteNombre="Juan Pérez"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
