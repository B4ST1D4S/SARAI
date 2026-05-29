/**
 * Tests del Módulo 3 — Historia Clínica
 * Verifica que el formulario se pre-cargue con pacienteId externo
 * y que los campos principales estén presentes
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

// Mock de api.ts
vi.mock('../services/api', () => ({
  getAllPacientes: vi.fn(),
  getHistoriasMedico: vi.fn(),
  createHistoriaClinica: vi.fn(),
}));

import HistoriaClinicaPage from '../pages/HistoriaClinicaPage';
import * as apiModule from '../services/api';

const mockLocalStorage = (() => {
  let store: Record<string, string> = {
    accessToken: 'token-test-valido',
  };
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

const PACIENTES_MOCK = [
  { id: 'pac-001', nombreCompleto: 'Carlos Mendoza', tipoDocumento: 'CC', numeroDocumento: '12345678' },
  { id: 'pac-002', nombreCompleto: 'Ana García', tipoDocumento: 'CC', numeroDocumento: '87654321' },
];

describe('HistoriaClinicaPage — Vista principal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiModule.getAllPacientes as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { pacientes: PACIENTES_MOCK },
      error: null,
    });
    (apiModule.getHistoriasMedico as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { historias: [] },
      error: null,
    });
  });

  it('Renderiza el título Historia Clinica (h1)', async () => {
    render(<HistoriaClinicaPage />);
    await waitFor(() => {
      // Múltiples h1 posibles — verificar que al menos uno tiene "Historia"
      const headings = screen.getAllByRole('heading', { name: /Historia/i });
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('Muestra botón Nueva Historia cuando formulario está cerrado', async () => {
    render(<HistoriaClinicaPage showFormExternal={false} />);

    await waitFor(() => {
      expect(screen.getByText('+ Nueva Historia')).toBeInTheDocument();
    });
    // Navegación de secciones NO visible
    expect(screen.queryByRole('button', { name: /^Anamnesis$/i })).not.toBeInTheDocument();
  });
});

describe('HistoriaClinicaPage — Apertura desde Agenda Profesional', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiModule.getAllPacientes as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { pacientes: PACIENTES_MOCK },
      error: null,
    });
    (apiModule.getHistoriasMedico as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { historias: [] },
      error: null,
    });
  });

  it('Abre formulario automáticamente cuando llega pacienteIdExterno', async () => {
    render(
      <HistoriaClinicaPage
        pacienteIdExterno="pac-001"
        showFormExternal={true}
      />
    );

    await waitFor(() => {
      // Con el formulario abierto, los botones de navegación aparecen
      const secciones = screen.getAllByText('Datos Generales');
      expect(secciones.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });

  it('Con pacienteIdExterno y form abierto, los pacientes están en el select', async () => {
    render(
      <HistoriaClinicaPage
        pacienteIdExterno="pac-001"
        showFormExternal={true}
      />
    );

    await waitFor(() => {
      // Los pacientes del mock deben estar como opciones en el select
      // Usamos getAllByText para manejar múltiples ocurrencias
      const opciones = screen.getAllByText(/Carlos Mendoza/i);
      expect(opciones.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });

  it('El formulario tiene botón de navegación Anamnesis', async () => {
    render(
      <HistoriaClinicaPage
        pacienteIdExterno="pac-001"
        showFormExternal={true}
      />
    );

    await waitFor(() => {
      // "Anamnesis" aparece en los botones de navegación lateral y en el tipo de historia
      const elems = screen.getAllByText(/^Anamnesis$/i);
      expect(elems.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });

  it('El formulario tiene botón de navegación Diagnostico y Plan', async () => {
    render(
      <HistoriaClinicaPage
        pacienteIdExterno="pac-001"
        showFormExternal={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Diagnostico y Plan/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('HistoriaClinicaPage — Control externo desde SARAI/App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiModule.getAllPacientes as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { pacientes: PACIENTES_MOCK },
      error: null,
    });
    (apiModule.getHistoriasMedico as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { historias: [] },
      error: null,
    });
  });

  it('showFormExternal=true muestra botón Cancelar', async () => {
    render(<HistoriaClinicaPage showFormExternal={true} />);

    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('showFormExternal=false muestra botón Nueva Historia', async () => {
    render(<HistoriaClinicaPage showFormExternal={false} />);

    await waitFor(() => {
      expect(screen.getByText('+ Nueva Historia')).toBeInTheDocument();
    });
  });

  it('onRegisterCampos recibe la función de llenado cuando el form está abierto', async () => {
    const onRegisterCampos = vi.fn();

    render(
      <HistoriaClinicaPage
        showFormExternal={true}
        onRegisterCampos={onRegisterCampos}
      />
    );

    await waitFor(() => {
      // onRegisterCampos se llama en useEffect con función cuando showForm es true
      expect(onRegisterCampos).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
