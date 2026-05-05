/**
 * Tests del Módulo 2 — Agenda Profesional
 * Verifica que las citas carguen, cambien de estado y naveguen a Historia
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de api.ts
vi.mock('../services/api', () => ({
  getCitasMedico: vi.fn(),
  completarCita: vi.fn(),
  cancelarCitaApi: vi.fn(),
}));

// Mock de mockData (servicio local de la agenda)
vi.mock('../services/mockData', () => ({
  citasService: {
    getAll: () => [],
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  initializeMockData: vi.fn(),
}));

import AgendaProfesionalPage from '../pages/AgendaProfesionalPage';
import * as apiModule from '../services/api';

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

const CITAS_MOCK = [
  {
    id: 'cita-001',
    pacienteId: 'pac-001',
    paciente: { id: 'pac-001', nombreCompleto: 'Carlos Mendoza' },
    fechaHora: new Date(Date.now() + 3600000).toISOString(),
    duracionMinutos: 60,
    tipoCita: 'CONSULTA',
    motivo: 'Consulta inicial',
    estado: 'EN_SALA',
    notas: '',
  },
  {
    id: 'cita-002',
    pacienteId: 'pac-002',
    paciente: { id: 'pac-002', nombreCompleto: 'Ana García' },
    fechaHora: new Date(Date.now() + 7200000).toISOString(),
    duracionMinutos: 30,
    tipoCita: 'CONTROL',
    motivo: 'Control postoperatorio',
    estado: 'PENDIENTE',
    notas: 'Revisar cicatrización',
  },
];

describe('AgendaProfesionalPage — Visualización', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiModule.getCitasMedico as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { citas: CITAS_MOCK },
      error: null,
    });
  });

  it('Renderiza el título Agenda Profesional', async () => {
    render(<AgendaProfesionalPage />);
    expect(screen.getByText('Agenda Profesional')).toBeInTheDocument();
  });

  it('Muestra las citas cargadas desde la API', async () => {
    render(<AgendaProfesionalPage />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });
  });

  it('Muestra botón "Atender → Historia Clínica" para citas EN_SALA', async () => {
    render(<AgendaProfesionalPage />);

    await waitFor(() => {
      expect(screen.getByText(/Atender.*Historia Clínica/i)).toBeInTheDocument();
    });
  });

  it('Muestra botón "Confirmar" para citas PENDIENTES', async () => {
    render(<AgendaProfesionalPage />);

    await waitFor(() => {
      expect(screen.getByText(/✓ Confirmar/i)).toBeInTheDocument();
    });
  });
});

describe('AgendaProfesionalPage — Acciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiModule.getCitasMedico as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { citas: CITAS_MOCK },
      error: null,
    });
    (apiModule.completarCita as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { success: true, cita: { id: 'cita-001', estado: 'COMPLETADA' } },
      error: null,
    });
  });

  it('Al hacer "Atender" llama onAbrirHistoriaPaciente con el pacienteId correcto', async () => {
    const onAbrirHistoriaPaciente = vi.fn();
    render(
      <AgendaProfesionalPage onAbrirHistoriaPaciente={onAbrirHistoriaPaciente} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Atender.*Historia Clínica/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Atender.*Historia Clínica/i));

    await waitFor(() => {
      expect(apiModule.completarCita).toHaveBeenCalledWith('cita-001', 'token-test-valido');
      expect(onAbrirHistoriaPaciente).toHaveBeenCalledWith('pac-001', 'Carlos Mendoza');
    });
  });

  it('Si no hay onAbrirHistoriaPaciente, llama onNavegar con "historia"', async () => {
    const onNavegar = vi.fn();
    render(<AgendaProfesionalPage onNavegar={onNavegar} />);

    await waitFor(() => {
      expect(screen.getByText(/Atender.*Historia Clínica/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Atender.*Historia Clínica/i));

    await waitFor(() => {
      expect(onNavegar).toHaveBeenCalledWith('historia');
    });
  });
});

describe('AgendaProfesionalPage — Fallback a mock si API falla', () => {
  it('Si la API falla, carga datos mock (array vacío)', async () => {
    (apiModule.getCitasMedico as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: 'Network error',
    });

    render(<AgendaProfesionalPage />);

    await waitFor(() => {
      // Con mock vacío no hay citas, debe mostrar el mensaje de sin citas
      expect(screen.getByText(/No hay citas programadas/i)).toBeInTheDocument();
    });
  });
});
