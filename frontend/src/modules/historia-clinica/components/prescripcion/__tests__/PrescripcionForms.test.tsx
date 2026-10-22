import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../../core/api/client';
import { PrescripcionAmbForm } from '../PrescripcionAmbForm';
import { PrescripcionHospForm, ordenesDesdeGuardadas } from '../PrescripcionHospForm';

vi.mock('../../../../../core/api/client', () => ({
  apiClient: { get: vi.fn(), put: vi.fn() },
}));

/** Prescripción guardada completa (lista para reenviar) del ámbito indicado; sin ámbito = legado. */
const guardada = (nombreComercial: string, ambitoAtencion?: string) => ({
  // Ambos ámbitos se prescriben por molde; articuloId es de prescripciones anteriores y no se reenvía.
  articuloId: `art-${nombreComercial}`,
  catalogoClinicoId: `molde-${nombreComercial}`,
  nombreGenerico: nombreComercial,
  nombreComercial,
  ...(ambitoAtencion ? { ambitoAtencion } : {}),
  formaDiscreta: false,
  dosisCantidad: 1,
  dosisUnidad: 'TAB',
  viaAdministracionCodigo: 'VO',
  frecuenciaIntervalo: 8,
  frecuenciaUnidad: 'HORAS',
  duracionTratamientoDias: 5,
  cantidadTotalDispensar: 10,
  diagnosticoAsociadoCie: 'R50',
});

const MIXTAS = [guardada('AmbMed', 'AMBULATORIO'), guardada('HospMed', 'INTRAHOSPITALARIO'), guardada('LegadoMed')];

/** El autoguardado espera 800 ms tras el último cambio: margen para el debounce y el PUT. */
const ESPERA_AUTOSAVE = { timeout: 3000 };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** El próximo PUT queda en vuelo hasta llamar a liberar(): permite observar el estado `saving`. */
function putPendiente() {
  let liberar!: () => void;
  vi.mocked(apiClient.put).mockImplementationOnce(
    () => new Promise((r) => (liberar = () => r({ data: { alertasCdss: [] } }))) as any,
  );
  return () => liberar();
}

const conQuery = (ui: ReactNode) => <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>;

type CuerpoPut = { prescripciones: { articuloId?: string; catalogoClinicoId?: string; ambitoAtencion: string; cantidadTotalDispensar?: number }[] };
const ultimoPut = () => vi.mocked(apiClient.put).mock.calls.at(-1)!;
const moldesEnviados = () => (ultimoPut()[1] as CuerpoPut).prescripciones.map((p) => p.catalogoClinicoId);

beforeEach(() => {
  vi.mocked(apiClient.get).mockReset().mockResolvedValue({ data: [] });
  vi.mocked(apiClient.put).mockReset().mockResolvedValue({ data: { alertasCdss: [] } });
});

// Sin `globals` en Vitest, RTL no registra su cleanup automático.
afterEach(cleanup);

describe('PrescripcionAmbForm — ámbito', () => {
  it('carga solo las ambulatorias (y las sin ámbito) y guarda con ?ambito=AMBULATORIO', async () => {
    render(conQuery(<PrescripcionAmbForm folioId="folio-1" atencionId="atencion-1" defaultValues={MIXTAS as any} />));

    expect(screen.getAllByTitle('Eliminar medicamento')).toHaveLength(2);
    // El medicamento elegido se muestra como valor del buscador de cada fila.
    const medicamentos = screen.getAllByLabelText<HTMLInputElement>('Buscar medicamento').map((i) => i.value);
    expect(medicamentos).toEqual(['AmbMed', 'LegadoMed']);

    // Cualquier cambio dispara el autoguardado (sin blur).
    fireEvent.change(screen.getAllByPlaceholderText(/Tomar 1 tableta/)[0], { target: { value: 'Con comida' } });

    await waitFor(() => expect(apiClient.put).toHaveBeenCalledTimes(1), ESPERA_AUTOSAVE);
    const [url, cuerpo, config] = ultimoPut();
    expect(url).toBe('/clinical-records/folios/folio-1/prescripciones');
    expect(config).toEqual({ params: { ambito: 'AMBULATORIO' } });
    // Solo el molde: la ambulatoria nunca envía la presentación comercial (Etapa 4).
    expect((cuerpo as CuerpoPut).prescripciones.map((p) => [p.catalogoClinicoId, p.ambitoAtencion])).toEqual([
      ['molde-AmbMed', 'AMBULATORIO'],
      ['molde-LegadoMed', 'AMBULATORIO'],
    ]);
    expect((cuerpo as CuerpoPut).prescripciones.every((p) => !('articuloId' in p))).toBe(true);
  });

  it('busca en los moldes para prescribir, no en las presentaciones comerciales', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    render(conQuery(<PrescripcionAmbForm folioId="folio-1" defaultValues={[]} />));
    fireEvent.change(screen.getByLabelText('Buscar medicamento'), { target: { value: 'acetam' } });
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/farmacia/moldes/prescripcion', { params: { buscar: 'acetam' } }), ESPERA_AUTOSAVE);
    expect(vi.mocked(apiClient.get).mock.calls.some(([url]) => url === '/farmacia/medicamentos')).toBe(false);
  });
});

describe('PrescripcionAmbForm — autoguardado', () => {
  it('reporta la telemetría dirty → saving → limpio a onSaveStateChange', async () => {
    const onSaveStateChange = vi.fn();
    render(
      conQuery(
        <PrescripcionAmbForm
          folioId="folio-1"
          defaultValues={[guardada('AmbMed', 'AMBULATORIO')] as any}
          onSaveStateChange={onSaveStateChange}
        />,
      ),
    );

    const liberar = putPendiente();
    fireEvent.change(screen.getByPlaceholderText(/Tomar 1 tableta/), { target: { value: 'Con comida' } });

    await waitFor(() => expect(apiClient.put).toHaveBeenCalledTimes(1), ESPERA_AUTOSAVE);
    await waitFor(() =>
      expect(onSaveStateChange).toHaveBeenLastCalledWith('prescripcion', { dirty: true, saving: true, error: null }),
    );
    liberar();
    await waitFor(() =>
      expect(onSaveStateChange).toHaveBeenLastCalledWith('prescripcion', { dirty: false, saving: false, error: null }),
    );

    expect(onSaveStateChange.mock.calls.every(([id]) => id === 'prescripcion')).toBe(true);
    expect(onSaveStateChange.mock.calls.map(([, s]) => s)).toEqual([
      { dirty: true, saving: false, error: null },
      { dirty: true, saving: true, error: null },
      { dirty: false, saving: false, error: null },
    ]);
  });

  it('al eliminar una fila persiste la lista remanente aunque quede una fila incompleta', async () => {
    render(
      conQuery(
        <PrescripcionAmbForm
          folioId="folio-1"
          defaultValues={[guardada('AmbMed', 'AMBULATORIO'), guardada('OtroMed', 'AMBULATORIO')] as any}
        />,
      ),
    );

    // Fila nueva vacía: incompleta, no debe bloquear el guardado del resto.
    fireEvent.click(screen.getByText(/Agregar medicamento ambulatorio/));
    expect(screen.getAllByTitle('Eliminar medicamento')).toHaveLength(3);

    fireEvent.click(screen.getAllByTitle('Eliminar medicamento')[0]);
    expect(screen.getAllByTitle('Eliminar medicamento')).toHaveLength(2);

    await waitFor(() => expect(apiClient.put).toHaveBeenCalled(), ESPERA_AUTOSAVE);
    expect(ultimoPut()[2]).toEqual({ params: { ambito: 'AMBULATORIO' } });
    expect(moldesEnviados()).toEqual(['molde-OtroMed']);
  });

  it('readOnly: campos deshabilitados, sin botones de agregar/eliminar y sin PUT', async () => {
    const { container } = render(
      conQuery(
        <PrescripcionAmbForm folioId="folio-1" defaultValues={[guardada('AmbMed', 'AMBULATORIO')] as any} readOnly />,
      ),
    );

    expect(screen.queryByTitle('Eliminar medicamento')).toBeNull();
    expect(screen.queryByText(/Agregar medicamento ambulatorio/)).toBeNull();

    const campos = Array.from(container.querySelectorAll('input, select, textarea'));
    expect(campos.length).toBeGreaterThan(0);
    for (const campo of campos) expect(campo.matches(':disabled')).toBe(true);
    expect(screen.getByLabelText('Buscar medicamento').matches(':disabled')).toBe(true);

    fireEvent.change(screen.getByPlaceholderText(/Tomar 1 tableta/), { target: { value: 'Editado' } });
    await esperar(1200);
    expect(apiClient.put).not.toHaveBeenCalled();
  });
});

describe('PrescripcionHospForm — ámbito', () => {
  it('ordenesDesdeGuardadas conserva estrictamente las INTRAHOSPITALARIAS', () => {
    expect(ordenesDesdeGuardadas(MIXTAS as any).map((o) => o.catalogoClinicoId)).toEqual(['molde-HospMed']);
  });

  it('al suspender reenvía la orden por su molde, sin la presentación comercial guardada', async () => {
    render(conQuery(<PrescripcionHospForm folioId="folio-1" defaultValues={MIXTAS as any} />));
    fireEvent.click(screen.getByTitle('Suspender medicamento'));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalledTimes(1), ESPERA_AUTOSAVE);
    const { prescripciones } = ultimoPut()[1] as CuerpoPut;
    expect(prescripciones.map((p) => [p.catalogoClinicoId, p.ambitoAtencion])).toEqual([['molde-HospMed', 'INTRAHOSPITALARIO']]);
    expect(prescripciones.every((p) => !('articuloId' in p))).toBe(true);
  });

  it('agrega una orden por molde: busca en los moldes, vía del molde, duración y CIE del catálogo', async () => {
    const molde = {
      id: 'molde-1', iumNivel1: null, nombre: 'METRONIDAZOL 500 MG TABLETA', principioActivo: 'METRONIDAZOL', concentracion: '500 mg',
      formaFarmaceuticaCodigo: 'TA', formaFarmaceutica: 'TABLETA', modoCalculoCantidad: 'DISCRETA', formaDiscreta: true,
      formaLiquida: false, unidadVolumen: null, viasPermitidas: [{ codigo: '048', nombre: 'ORAL' }],
    };
    vi.mocked(apiClient.get).mockImplementation((async (url: string) => ({
      data:
        url === '/farmacia/moldes/prescripcion' ? [molde]
        : url === '/catalogos/diagnosticos' ? [{ codigo_cie10: 'A419', titulo_cie10: 'SEPTICEMIA, NO ESPECIFICADA' }]
        : [],
    })) as any);
    render(conQuery(<PrescripcionHospForm folioId="folio-1" defaultValues={[]} />));

    fireEvent.change(screen.getByLabelText('Buscar medicamento'), { target: { value: 'metro' } });
    fireEvent.click(await screen.findByRole('button', { name: /METRONIDAZOL 500 MG TABLETA/ }));
    // Una sola vía permitida: se preselecciona; la unidad de la dosis es la forma del molde.
    expect(screen.getByLabelText<HTMLSelectElement>('Vía de administración').value).toBe('048');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toContain('ORAL');

    fireEvent.change(screen.getByLabelText('Dosis por administración'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Duración del tratamiento en días'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Buscar diagnóstico CIE-10'), { target: { value: 'A41' } });
    fireEvent.click(await screen.findByRole('button', { name: /SEPTICEMIA/ }));
    // 1 tableta cada 8 h por 7 días = 21 tomas.
    expect(screen.getByLabelText('Tope de dispensación calculado').textContent).toContain('21 TABLETA');
    // Forma discreta: el tope es el cálculo exacto y no se puede editar.
    expect(screen.queryByLabelText('Tope de unidades a dispensar')).toBeNull();

    fireEvent.click(screen.getByText(/Ordenar Medicamento Intrahospitalario/));
    expect(screen.getByText('Medicamentos en Tratamiento Intrahospitalario (1)')).toBeTruthy();

    await waitFor(() => expect(apiClient.put).toHaveBeenCalledTimes(1), ESPERA_AUTOSAVE);
    const [, cuerpo, config] = ultimoPut();
    expect(config).toEqual({ params: { ambito: 'INTRAHOSPITALARIO' } });
    expect((cuerpo as CuerpoPut).prescripciones).toEqual([
      expect.objectContaining({
        catalogoClinicoId: 'molde-1', ambitoAtencion: 'INTRAHOSPITALARIO', dosisCantidad: 1, viaAdministracionCodigo: '048',
        frecuenciaIntervalo: 8, frecuenciaUnidad: 'HORAS', duracionTratamientoDias: 7, cantidadTotalDispensar: 21,
        diagnosticoAsociadoCie: 'A419',
      }),
    ]);
    expect((cuerpo as CuerpoPut).prescripciones.every((p) => !('articuloId' in p) && !('dosisUnidad' in p))).toBe(true);
    // Nunca consulta las presentaciones comerciales ni crea solicitudes de dispensación.
    expect(vi.mocked(apiClient.get).mock.calls.some(([url]) => url === '/farmacia/medicamentos')).toBe(false);
    expect(vi.mocked(apiClient.put).mock.calls.every(([url]) => !String(url).includes('solicitudes-dispensacion'))).toBe(true);
  });

  it('forma no discreta: el tope sugerido (1 por administración) es editable y se envía el del médico', async () => {
    const solucion = {
      id: 'molde-ssn', iumNivel1: null, nombre: 'CLORURO DE SODIO 0.9 % SOLUCION INYECTABLE', principioActivo: 'CLORURO DE SODIO',
      concentracion: '0.9 %', formaFarmaceuticaCodigo: 'SI', formaFarmaceutica: 'SOLUCION INYECTABLE', modoCalculoCantidad: 'CRITERIO_MEDICO',
      formaDiscreta: false, formaLiquida: true, unidadVolumen: null, viasPermitidas: [{ codigo: '036', nombre: 'INTRAVENOSA' }],
    };
    vi.mocked(apiClient.get).mockImplementation((async (url: string) => ({
      data:
        url === '/farmacia/moldes/prescripcion' ? [solucion]
        : url === '/catalogos/diagnosticos' ? [{ codigo_cie10: 'E86X', titulo_cie10: 'DEPLECION DEL VOLUMEN' }]
        : [],
    })) as any);
    render(conQuery(<PrescripcionHospForm folioId="folio-1" defaultValues={[]} />));

    fireEvent.change(screen.getByLabelText('Buscar medicamento'), { target: { value: 'cloruro' } });
    fireEvent.click(await screen.findByRole('button', { name: /CLORURO DE SODIO 0.9 %/ }));
    fireEvent.change(screen.getByLabelText('Dosis por administración'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Unidad de frecuencia'), { target: { value: 'CONTINUA' } });
    fireEvent.change(screen.getByLabelText('Duración del tratamiento en días'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Buscar diagnóstico CIE-10'), { target: { value: 'E86' } });
    fireEvent.click(await screen.findByRole('button', { name: /DEPLECION/ }));

    // Continua por 2 días = 2 administraciones: sugiere 2 y el médico lo puede subir.
    const tope = screen.getByLabelText<HTMLInputElement>('Tope de unidades a dispensar');
    expect(tope.value).toBe('2');
    fireEvent.change(tope, { target: { value: '6' } });
    expect(tope.value).toBe('6');
    fireEvent.click(screen.getByText('Usar sugerido (2)'));
    expect(tope.value).toBe('2');
    fireEvent.change(tope, { target: { value: '6' } });

    fireEvent.click(screen.getByText(/Ordenar Medicamento Intrahospitalario/));
    await waitFor(() => expect(apiClient.put).toHaveBeenCalledTimes(1), ESPERA_AUTOSAVE);
    expect((ultimoPut()[1] as CuerpoPut).prescripciones).toEqual([
      expect.objectContaining({
        catalogoClinicoId: 'molde-ssn', frecuenciaIntervalo: 24, frecuenciaUnidad: 'HORAS', frecuenciaTextoIndicacion: 'CONTINUA',
        duracionTratamientoDias: 2, cantidadTotalDispensar: 6,
      }),
    ]);
  });

  it('forma no discreta: un tope vacío no agrega la orden', async () => {
    const solucion = {
      id: 'molde-ssn', iumNivel1: null, nombre: 'CLORURO DE SODIO 0.9 % SOLUCION INYECTABLE', principioActivo: 'CLORURO DE SODIO',
      concentracion: '0.9 %', formaFarmaceuticaCodigo: 'SI', formaFarmaceutica: 'SOLUCION INYECTABLE', modoCalculoCantidad: 'CRITERIO_MEDICO',
      formaDiscreta: false, formaLiquida: true, unidadVolumen: null, viasPermitidas: [{ codigo: '036', nombre: 'INTRAVENOSA' }],
    };
    vi.mocked(apiClient.get).mockImplementation((async (url: string) => ({
      data:
        url === '/farmacia/moldes/prescripcion' ? [solucion]
        : url === '/catalogos/diagnosticos' ? [{ codigo_cie10: 'E86X', titulo_cie10: 'DEPLECION DEL VOLUMEN' }]
        : [],
    })) as any);
    render(conQuery(<PrescripcionHospForm folioId="folio-1" defaultValues={[]} />));
    fireEvent.change(screen.getByLabelText('Buscar medicamento'), { target: { value: 'cloruro' } });
    fireEvent.click(await screen.findByRole('button', { name: /CLORURO DE SODIO 0.9 %/ }));
    fireEvent.change(screen.getByLabelText('Dosis por administración'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Duración del tratamiento en días'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Buscar diagnóstico CIE-10'), { target: { value: 'E86' } });
    fireEvent.click(await screen.findByRole('button', { name: /DEPLECION/ }));
    fireEvent.change(screen.getByLabelText('Tope de unidades a dispensar'), { target: { value: '' } });

    fireEvent.click(screen.getByText(/Ordenar Medicamento Intrahospitalario/));
    expect(screen.getByText(/tope de unidades a dispensar en números enteros/)).toBeTruthy();
    expect(screen.getByText('Medicamentos en Tratamiento Intrahospitalario (0)')).toBeTruthy();
  });

  it('sin duración no agrega la orden', async () => {
    const molde = {
      id: 'molde-1', iumNivel1: null, nombre: 'METRONIDAZOL 500 MG TABLETA', principioActivo: 'METRONIDAZOL', concentracion: '500 mg',
      formaFarmaceuticaCodigo: 'TA', formaFarmaceutica: 'TABLETA', modoCalculoCantidad: 'DISCRETA', formaDiscreta: true,
      formaLiquida: false, unidadVolumen: null, viasPermitidas: [{ codigo: '048', nombre: 'ORAL' }],
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: [molde] });
    render(conQuery(<PrescripcionHospForm folioId="folio-1" defaultValues={[]} />));
    fireEvent.change(screen.getByLabelText('Buscar medicamento'), { target: { value: 'metro' } });
    fireEvent.click(await screen.findByRole('button', { name: /METRONIDAZOL 500 MG TABLETA/ }));
    fireEvent.change(screen.getByLabelText('Dosis por administración'), { target: { value: '1' } });
    fireEvent.click(screen.getByText(/Ordenar Medicamento Intrahospitalario/));
    expect(screen.getByText(/duración del tratamiento en días enteros/)).toBeTruthy();
    expect(screen.getByText('Medicamentos en Tratamiento Intrahospitalario (0)')).toBeTruthy();
  });

  it('muestra solo las intrahospitalarias y guarda con ?ambito=INTRAHOSPITALARIO', async () => {
    render(conQuery(<PrescripcionHospForm folioId="folio-1" atencionId="atencion-1" defaultValues={MIXTAS as any} />));

    expect(screen.getByText('Medicamentos en Tratamiento Intrahospitalario (1)')).toBeTruthy();
    expect(screen.getByText('HospMed')).toBeTruthy();
    expect(screen.queryByText('AmbMed')).toBeNull();
    expect(screen.queryByText('LegadoMed')).toBeNull();

    fireEvent.click(screen.getByTitle('Eliminar orden'));
    // La fila se descarta de inmediato; el PUT llega tras el debounce.
    expect(screen.getByText('Medicamentos en Tratamiento Intrahospitalario (0)')).toBeTruthy();

    await waitFor(() => expect(apiClient.put).toHaveBeenCalledTimes(1), ESPERA_AUTOSAVE);
    const [url, cuerpo, config] = ultimoPut();
    expect(url).toBe('/clinical-records/folios/folio-1/prescripciones');
    expect(cuerpo).toEqual({ prescripciones: [] });
    expect(config).toEqual({ params: { ambito: 'INTRAHOSPITALARIO' } });
  });
});

describe('PrescripcionHospForm — autoguardado', () => {
  it('reporta la telemetría con id prescripcion_hospitalaria', async () => {
    const onSaveStateChange = vi.fn();
    render(
      conQuery(
        <PrescripcionHospForm folioId="folio-1" defaultValues={MIXTAS as any} onSaveStateChange={onSaveStateChange} />,
      ),
    );

    const liberar = putPendiente();
    fireEvent.click(screen.getByTitle('Suspender medicamento'));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalledTimes(1), ESPERA_AUTOSAVE);
    await waitFor(() =>
      expect(onSaveStateChange).toHaveBeenLastCalledWith('prescripcion_hospitalaria', {
        dirty: true,
        saving: true,
        error: null,
      }),
    );
    liberar();
    await waitFor(() =>
      expect(onSaveStateChange).toHaveBeenLastCalledWith('prescripcion_hospitalaria', {
        dirty: false,
        saving: false,
        error: null,
      }),
    );
  });

  it('readOnly: panel de nueva orden deshabilitado, sin acciones y sin PUT', async () => {
    render(conQuery(<PrescripcionHospForm folioId="folio-1" defaultValues={MIXTAS as any} readOnly />));

    expect(screen.getByText('HospMed')).toBeTruthy();
    expect(screen.queryByTitle('Eliminar orden')).toBeNull();
    expect(screen.queryByTitle('Suspender medicamento')).toBeNull();
    expect(screen.queryByText(/Ordenar Medicamento Intrahospitalario/)).toBeNull();

    const panel = screen.getByRole('group', { name: 'Nueva orden médica intrahospitalaria' });
    const campos = Array.from(panel.querySelectorAll('input, select'));
    expect(campos.length).toBeGreaterThan(0);
    for (const campo of campos) expect(campo.matches(':disabled')).toBe(true);

    await esperar(1200);
    expect(apiClient.put).not.toHaveBeenCalled();
  });
});
