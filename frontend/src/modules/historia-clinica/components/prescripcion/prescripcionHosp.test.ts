import { describe, expect, it } from 'vitest';
import {
  cantidadHosp,
  cantidadSugeridaHosp,
  cuerpoGuardadoHosp,
  diasDeTratamiento,
  etiquetaFrecuencia,
  frecuenciaParaServidor,
  ordenCompleta,
  ordenesDesdeGuardadas,
  parsearIndicaciones,
  serializarIndicaciones,
  unidadDosis,
} from './PrescripcionHospForm';
import type { ItemPrescripcionHosp } from './types';

const MOLDE = 'c0000000-0000-4000-8000-000000000001';

// 1 tableta cada 12 horas por 3 días = 6 tomas = 6 tabletas.
const orden = (cambios: Partial<ItemPrescripcionHosp> = {}): ItemPrescripcionHosp => ({
  catalogoClinicoId: MOLDE,
  nombreGenerico: 'METRONIDAZOL 500 MG TABLETA',
  principioActivo: 'Metronidazol',
  concentracion: '500 mg',
  formaFarmaceuticaCodigo: 'TA',
  formaFarmaceutica: 'TABLETA',
  modoCalculoCantidad: 'DISCRETA',
  unidadVolumen: null,
  viasPermitidas: [{ codigo: '048', nombre: 'ORAL' }],
  fechaInicio: '2026-10-07T10:00:00.000Z',
  dosisCantidad: 1,
  viaAdministracionCodigo: '048',
  frecuenciaIntervalo: 12,
  frecuenciaUnidad: 'HORAS',
  duracionTratamientoDias: 3,
  diagnosticoAsociadoCie: 'a419',
  estado: 'EN_TRATAMIENTO',
  ambitoAtencion: 'INTRAHOSPITALARIO',
  ...cambios,
});
const jarabe = (cambios: Partial<ItemPrescripcionHosp> = {}) =>
  orden({ modoCalculoCantidad: 'LIQUIDA', formaFarmaceutica: 'JARABE', formaFarmaceuticaCodigo: 'JA', unidadVolumen: 'ML', dosisCantidad: 5, ...cambios });

describe('frecuenciaParaServidor', () => {
  it('horas y días pasan tal cual', () => {
    expect(frecuenciaParaServidor(8, 'HORAS')).toEqual({ frecuenciaIntervalo: 8, frecuenciaUnidad: 'HORAS' });
    expect(frecuenciaParaServidor(2, 'DIAS')).toEqual({ frecuenciaIntervalo: 2, frecuenciaUnidad: 'DIAS' });
  });

  it('dosis única es 1 toma y continua es 1 toma cada 24 horas, con la unidad original en el texto', () => {
    expect(frecuenciaParaServidor(8, 'DOSIS_UNICA')).toEqual({
      frecuenciaIntervalo: 1, frecuenciaUnidad: 'DIAS', frecuenciaTextoIndicacion: 'DOSIS_UNICA',
    });
    expect(frecuenciaParaServidor(8, 'CONTINUA')).toEqual({
      frecuenciaIntervalo: 24, frecuenciaUnidad: 'HORAS', frecuenciaTextoIndicacion: 'CONTINUA',
    });
  });
});

describe('diasDeTratamiento (prellenado de la duración)', () => {
  it('sin suspensión prevista no prellena', () => {
    expect(diasDeTratamiento('2026-10-07T10:00:00.000Z')).toBe('');
  });

  it('redondea hacia arriba los días hasta la suspensión', () => {
    expect(diasDeTratamiento('2026-10-07T10:00:00.000Z', '2026-10-10T10:00:00.000Z')).toBe(3);
    expect(diasDeTratamiento('2026-10-07T10:00:00.000Z', '2026-10-10T11:00:00.000Z')).toBe(4);
  });

  it('una suspensión anterior al inicio cuenta como 1 día', () => {
    expect(diasDeTratamiento('2026-10-07T10:00:00.000Z', '2026-10-06T10:00:00.000Z')).toBe(1);
  });
});

describe('cantidadHosp: tope de dispensación (no lo escribe el médico)', () => {
  it('DISCRETA: dosis × tomas, igual que exige el servidor', () => {
    expect(cantidadHosp(orden())).toBe(6);
    expect(cantidadHosp(orden({ dosisCantidad: 2 }))).toBe(12);
    expect(cantidadHosp(orden({ frecuenciaUnidad: 'DOSIS_UNICA', duracionTratamientoDias: 7, dosisCantidad: 2 }))).toBe(2);
  });

  it('LÍQUIDA y criterio médico: sugiere una unidad de consumo por administración, sin depender de la dosis', () => {
    expect(cantidadHosp(jarabe())).toBe(6);
    expect(cantidadHosp(jarabe({ dosisCantidad: 50 }))).toBe(6);
    expect(cantidadHosp(orden({ modoCalculoCantidad: 'CRITERIO_MEDICO', frecuenciaUnidad: 'CONTINUA', duracionTratamientoDias: 2 }))).toBe(2);
    expect(cantidadSugeridaHosp(jarabe({ cantidadTotalDispensar: 20 }))).toBe(6);
  });

  it('LÍQUIDA y criterio médico: manda el tope que indicó el médico (infusión de alto volumen)', () => {
    const infusion = orden({ modoCalculoCantidad: 'CRITERIO_MEDICO', frecuenciaUnidad: 'CONTINUA', duracionTratamientoDias: 2, cantidadTotalDispensar: 4 });
    expect(cantidadHosp(infusion)).toBe(4);
    expect(cantidadHosp(jarabe({ cantidadTotalDispensar: 20 }))).toBe(20);
    expect(cuerpoGuardadoHosp([infusion]).prescripciones[0].cantidadTotalDispensar).toBe(4);
    // Vacío, cero o fraccionario: la orden no está lista.
    for (const cantidadTotalDispensar of ['' as const, 0, 1.5]) {
      expect(ordenCompleta(jarabe({ cantidadTotalDispensar }))).toBe(false);
    }
    expect(ordenCompleta(jarabe({ cantidadTotalDispensar: 20 }))).toBe(true);
  });

  it('DISCRETA: el tope no es editable; se ignora cualquier cantidad y manda el cálculo', () => {
    expect(cantidadHosp(orden({ cantidadTotalDispensar: 99 }))).toBe(6);
    expect(cuerpoGuardadoHosp([orden({ cantidadTotalDispensar: 99 })]).prescripciones[0].cantidadTotalDispensar).toBe(6);
  });

  it('sin duración no hay cantidad (la orden no está completa)', () => {
    expect(cantidadHosp(orden({ duracionTratamientoDias: '' }))).toBe('');
    expect(ordenCompleta(orden({ duracionTratamientoDias: '' }))).toBe(false);
    expect(ordenCompleta(orden({ duracionTratamientoDias: 2.5 }))).toBe(false);
    expect(ordenCompleta(orden())).toBe(true);
  });

  it('la orden exige molde, vía, diagnóstico y dosis', () => {
    for (const cambio of [{ catalogoClinicoId: '' }, { viaAdministracionCodigo: '' }, { diagnosticoAsociadoCie: ' ' }, { dosisCantidad: '' as const }]) {
      expect(ordenCompleta(orden(cambio))).toBe(false);
    }
  });
});

describe('observaciones hospitalarias en indicacionesPaciente', () => {
  it('serializa y vuelve a separar todos los campos', () => {
    const o = orden({
      fechaSuspension: '2026-10-10T10:00:00.000Z',
      estado: 'SUSPENDIDO',
      diluyente: 'SSN 0.9% 100 mL',
      velocidadInfusion: '30 min',
      observacionesEnfermeria: 'Vigilar\nreacción local',
    });
    const texto = serializarIndicaciones(o);
    expect(texto).toContain('Diluyente: SSN 0.9% 100 mL');
    expect(texto).toContain('Enfermería: Vigilar reacción local'); // una sola línea por dato
    expect(parsearIndicaciones(texto)).toEqual({
      fechaInicio: o.fechaInicio,
      fechaSuspension: o.fechaSuspension,
      estado: 'SUSPENDIDO',
      diluyente: 'SSN 0.9% 100 mL',
      velocidadInfusion: '30 min',
      observacionesEnfermeria: 'Vigilar reacción local',
    });
  });

  it('texto libre anterior al formato se conserva como observación de enfermería', () => {
    expect(parsearIndicaciones('Dar con comida')).toMatchObject({
      estado: 'EN_TRATAMIENTO',
      observacionesEnfermeria: 'Dar con comida',
    });
  });

  it('sin datos no hay texto', () => {
    expect(serializarIndicaciones({ fechaInicio: '', estado: 'EN_TRATAMIENTO' })).toBeUndefined();
    expect(parsearIndicaciones(null)).toEqual({ fechaInicio: '', estado: 'EN_TRATAMIENTO' });
  });
});

describe('cuerpoGuardadoHosp', () => {
  it('envía solo el molde (nunca articuloId ni dosisUnidad), ámbito INTRAHOSPITALARIO y CIE en mayúsculas', () => {
    const { prescripciones } = cuerpoGuardadoHosp([orden({ diluyente: 'SSN' })]);
    expect(prescripciones).toHaveLength(1);
    const { indicacionesPaciente, ...resto } = prescripciones[0];
    expect(resto).toEqual({
      catalogoClinicoId: MOLDE,
      ambitoAtencion: 'INTRAHOSPITALARIO',
      dosisCantidad: 1,
      viaAdministracionCodigo: '048',
      frecuenciaIntervalo: 12,
      frecuenciaUnidad: 'HORAS',
      duracionTratamientoDias: 3,
      cantidadTotalDispensar: 6,
      diagnosticoAsociadoCie: 'A419',
    });
    expect(indicacionesPaciente).toContain('Diluyente: SSN');
  });

  it('dosis única: la unidad que acepta el servidor y 1 día de duración', () => {
    const { prescripciones } = cuerpoGuardadoHosp([orden({ frecuenciaUnidad: 'DOSIS_UNICA', duracionTratamientoDias: 5 })]);
    expect(prescripciones[0]).toMatchObject({
      frecuenciaIntervalo: 1, frecuenciaUnidad: 'DIAS', frecuenciaTextoIndicacion: 'DOSIS_UNICA', duracionTratamientoDias: 1, cantidadTotalDispensar: 1,
    });
  });

  it('lista vacía vacía las prescripciones del folio', () => {
    expect(cuerpoGuardadoHosp([])).toEqual({ prescripciones: [] });
  });
});

describe('ordenesDesdeGuardadas', () => {
  const guardada = {
    id: 'rx-1',
    // Prescripción anterior a la regla por molde: trae la presentación, que se ignora.
    articuloId: 'art-1',
    catalogoClinicoId: MOLDE,
    nombreGenerico: 'CEFTRIAXONA 1 G POLVO',
    nombreComercial: 'Rocephin',
    formaFarmaceuticaCodigo: 'PO',
    formaFarmaceutica: 'POLVO PARA RECONSTITUIR',
    formaDiscreta: false,
    dosisCantidad: 1,
    dosisUnidad: 'PO',
    viaAdministracionCodigo: '036 ',
    viasPermitidas: [{ codigo: '036', nombre: 'INTRAVENOSA' }],
    frecuenciaIntervalo: 1,
    frecuenciaUnidad: 'DIAS',
    frecuenciaTextoIndicacion: 'DOSIS_UNICA',
    duracionTratamientoDias: 1,
    cantidadTotalDispensar: 1,
    diagnosticoAsociadoCie: 'A419',
    diagnosticoAsociadoDescripcion: 'SEPTICEMIA, NO ESPECIFICADA',
    indicacionesPaciente: 'Inicio: 2026-10-07T10:00:00.000Z\nEstado: SUSPENDIDO\nDiluyente: SSN',
  };

  it('restaura molde, unidad propia, estado y observaciones; se reenvía sin articuloId', () => {
    const ordenes = ordenesDesdeGuardadas([{ ...guardada, ambitoAtencion: 'INTRAHOSPITALARIO' }] as never);
    expect(ordenes[0]).toMatchObject({
      catalogoClinicoId: MOLDE,
      nombreGenerico: 'CEFTRIAXONA 1 G POLVO',
      modoCalculoCantidad: 'CRITERIO_MEDICO',
      viaAdministracionCodigo: '036',
      viaAdministracionNombre: 'INTRAVENOSA',
      frecuenciaUnidad: 'DOSIS_UNICA',
      estado: 'SUSPENDIDO',
      diluyente: 'SSN',
      fechaInicio: '2026-10-07T10:00:00.000Z',
      duracionTratamientoDias: 1,
      // No discreta: se conserva el tope guardado (pudo indicarlo el médico).
      cantidadTotalDispensar: 1,
      diagnosticoAsociadoDescripcion: 'SEPTICEMIA, NO ESPECIFICADA',
    });
    expect(ordenes[0]).not.toHaveProperty('articuloId');
    expect(cuerpoGuardadoHosp(ordenes).prescripciones[0]).not.toHaveProperty('articuloId');
  });

  it('una discreta no conserva la cantidad guardada: se recalcula', () => {
    const [o] = ordenesDesdeGuardadas([{ ...guardada, modoCalculoCantidad: 'DISCRETA', cantidadTotalDispensar: 99, ambitoAtencion: 'INTRAHOSPITALARIO' }] as never);
    expect(o).not.toHaveProperty('cantidadTotalDispensar');
  });

  it('una líquida clasificada recupera la unidad de volumen de dosisUnidad', () => {
    const [o] = ordenesDesdeGuardadas([{ ...guardada, modoCalculoCantidad: 'LIQUIDA', dosisUnidad: 'ML', ambitoAtencion: 'INTRAHOSPITALARIO' }] as never);
    expect(o.unidadVolumen).toBe('ML');
    expect(unidadDosis(o)).toBe('ML');
  });

  it('ignora las prescripciones ambulatorias del mismo folio y tolera datos ausentes', () => {
    expect(ordenesDesdeGuardadas([{ ...guardada, ambitoAtencion: 'AMBULATORIO' }] as never)).toEqual([]);
    expect(ordenesDesdeGuardadas(undefined)).toEqual([]);
  });
});

describe('presentación', () => {
  it('la unidad de la dosis es la forma farmacéutica (o mL en una líquida clasificada), no la escribe el médico', () => {
    expect(unidadDosis(orden())).toBe('TABLETA');
    expect(unidadDosis(jarabe())).toBe('ML');
  });

  it('etiqueta de frecuencia sin "cada N días" para dosis única ni continua', () => {
    expect(etiquetaFrecuencia(orden())).toBe('Cada 12 horas');
    expect(etiquetaFrecuencia(orden({ frecuenciaUnidad: 'DIAS', frecuenciaIntervalo: 2 }))).toBe('Cada 2 días');
    expect(etiquetaFrecuencia(orden({ frecuenciaUnidad: 'DOSIS_UNICA' }))).toBe('Dosis única');
    expect(etiquetaFrecuencia(orden({ frecuenciaUnidad: 'CONTINUA' }))).toBe('Infusión continua');
  });
});
