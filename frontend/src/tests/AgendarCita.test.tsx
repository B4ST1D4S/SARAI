/**
 * Tests del Módulo 1 — AgendarCita
 * Verifica el formulario de agendamiento y validaciones.
 * El componente usa grilla de slots (botones) en lugar de <select name="hora">.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AgendarCita from '../components/AgendarCita';

// Mock framer-motion
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
(window as any).fetch = mockFetch;

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

/** Helpers de respuesta mock */
const makeSlotsResponse = (slots: string[] = ['09:00', '10:00', '11:00']) =>
  ({ ok: true, json: async () => ({ success: true, slots }) });
const makeErrorCitasResponse = (errorMsg: string) =>
  ({ ok: false, json: async () => ({ error: errorMsg }) });
const makeSuccessCitasResponse = () =>
  ({ ok: true, json: async () => ({ success: true, cita: { id: 'cita-001', estado: 'PENDIENTE' } }) });

/** Mock de fetch que despacha según la URL */
function setupFetchMock(options: {
  slotsSlots?: string[];
  citasOk?: boolean;
  citasError?: string;
}) {
  mockFetch.mockImplementation(async (url: string) => {
    if (url.includes('disponibilidad/slots')) {
      return makeSlotsResponse(options.slotsSlots ?? ['09:00', '10:00', '11:00']);
    }
    if (url.includes('/api/citas')) {
      if (options.citasOk === false) {
        return makeErrorCitasResponse(options.citasError ?? 'Error');
      }
      return makeSuccessCitasResponse();
    }
    return { ok: true, json: async () => ({}) };
  });
}

describe('AgendarCita — Formulario', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    // Re-assign fetch mock after reset
    (window as any).fetch = mockFetch;
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

    expect(screen.getAllByText('Agendar Cita').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Juan Pérez/)).toBeInTheDocument();
  });

  it('Muestra mensaje "Selecciona una fecha" antes de elegir fecha', () => {
    render(
      <AgendarCita
        pacienteId="pac-001"
        pacienteNombre="Juan Pérez"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText(/Selecciona una fecha para ver los horarios/i)).toBeInTheDocument();
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

    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Por favor completa fecha y hora/i)).toBeInTheDocument();
    });
  });

  it('Muestra grilla de slots tras seleccionar fecha', async () => {
    setupFetchMock({});

    const { container: c } = render(<AgendarCita pacienteId="pac-001" pacienteNombre="Juan Pérez" onClose={onClose} onSuccess={onSuccess} />);
    const dateInput = c.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-06-10', name: 'fecha' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '09:00' })).toBeInTheDocument();
    });
  });

  it('Muestra error si pacienteId está vacío', async () => {
    setupFetchMock({});

    const { container } = render(
      <AgendarCita
        pacienteId=""
        pacienteNombre="Sin ID"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-06-01', name: 'fecha' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '09:00' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '09:00' }));

    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/No se encontró el paciente/i)).toBeInTheDocument();
    });
  });

  it('Muestra pantalla de éxito al agendar correctamente', async () => {
    setupFetchMock({ citasOk: true });

    const { container } = render(
      <AgendarCita
        pacienteId="pac-001"
        pacienteNombre="Juan Pérez"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-06-10', name: 'fecha' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '10:00' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '10:00' }));

    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('¡Cita Agendada!')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('Muestra error del servidor si la API de citas falla', async () => {
    setupFetchMock({ citasOk: false, citasError: 'Horario no disponible' });

    const { container } = render(
      <AgendarCita
        pacienteId="pac-001"
        pacienteNombre="Juan Pérez"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-06-10', name: 'fecha' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '10:00' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '10:00' }));

    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

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

  it('Muestra fallback genérico cuando no hay slots configurados', async () => {
    setupFetchMock({ slotsSlots: [] });

    const { container } = render(
      <AgendarCita
        pacienteId="pac-001"
        pacienteNombre="Juan Pérez"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-06-10', name: 'fecha' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '09:00' })).toBeInTheDocument();
    });
  });
});
