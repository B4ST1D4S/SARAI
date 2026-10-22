import { describe, expect, it } from 'vitest';
import {
  cuerpoGuardado,
  filaCompleta,
  type PrescripcionFila,
  calcularCantidadDispensar,
} from './PrescripcionForm';
import { camposDelMolde, cantidadDeFila, filaCompleta as filaLista } from './PrescripcionAmbForm';
import { modoDeFila, volumenTratamiento } from './compartido';
import {
  PrescripcionAmbForm,
  PrescripcionForm,
  esViaParenteral,
  type BaseMedicamentoCatalogo,
  type ItemPrescripcionAmb,
  type ItemPrescripcionHosp,
} from './index';

const completa: PrescripcionFila = {
  catalogoClinicoId: 'c0000000-0000-4000-8000-000000000001',
  nombreGenerico: 'ACETAMINOFEN 500 MG TABLETA',
  formaFarmaceuticaCodigo: 'TA',
  formaFarmaceutica: 'TABLETA',
  formaDiscreta: true,
  viasPermitidas: [{ codigo: '048', nombre: 'ORAL' }],
  ambitoAtencion: 'AMBULATORIO',
  dosisCantidad: 1,
  dosisUnidad: 'TA',
  viaAdministracionCodigo: '048',
  frecuenciaIntervalo: 8,
  frecuenciaUnidad: 'HORAS',
  duracionTratamientoDias: 5,
  cantidadTotalDispensar: '',
  diagnosticoAsociadoCie: ' r509 ',
  indicacionesPaciente: '',
};
const jarabe: PrescripcionFila = {
  ...completa,
  nombreGenerico: 'ACETAMINOFEN JARABE',
  formaFarmaceuticaCodigo: 'JA',
  formaFarmaceutica: 'JARABE',
  formaDiscreta: false,
  dosisCantidad: 5,
  cantidadTotalDispensar: 1,
};

describe('prescripción (farmacia, flujo mínimo)', () => {
  it('una fila solo está lista con medicamento del catálogo, vía, diagnóstico y todos los números positivos', () => {
    expect(filaCompleta(completa)).toBe(true);
    expect(filaCompleta(jarabe)).toBe(true);
    for (const cambio of [
      { catalogoClinicoId: '' }, // escribió texto pero no eligió del catálogo
      { viaAdministracionCodigo: '' },
      { diagnosticoAsociadoCie: '  ' }, // escribió pero no eligió del catálogo CIE
      { dosisCantidad: '' as const },
      { duracionTratamientoDias: Number.NaN }, // input numérico vacío
    ]) {
      expect(filaCompleta({ ...completa, ...cambio })).toBe(false);
    }
    expect(filaCompleta({ ...jarabe, cantidadTotalDispensar: '' })).toBe(false); // no discreta: la indica el médico
    expect(filaCompleta({ ...jarabe, cantidadTotalDispensar: 0 })).toBe(false);
  });

  it('el cuerpo del PUT tiene exactamente los campos del DTO, sin dosisUnidad (la deriva el servidor)', () => {
    const { prescripciones } = cuerpoGuardado([
      completa,
      { ...jarabe, ambitoAtencion: 'INTRAHOSPITALARIO', indicacionesPaciente: ' tomar con agua ' },
    ]);
    expect(prescripciones[0]).toEqual({
      catalogoClinicoId: completa.catalogoClinicoId,
      ambitoAtencion: 'AMBULATORIO',
      dosisCantidad: 1,
      viaAdministracionCodigo: '048',
      frecuenciaIntervalo: 8,
      frecuenciaUnidad: 'HORAS',
      duracionTratamientoDias: 5,
      cantidadTotalDispensar: 15,
      diagnosticoAsociadoCie: 'R509',
    });
    expect(prescripciones[1]).toMatchObject({
      ambitoAtencion: 'INTRAHOSPITALARIO',
      cantidadTotalDispensar: 1,
      indicacionesPaciente: 'tomar con agua',
    });
  });

  it('forma discreta: se envía la cantidad calculada aunque la fila guarde otra; no discreta: la del médico', () => {
    expect(cantidadDeFila({ ...completa, cantidadTotalDispensar: 999 })).toBe(15);
    expect(cantidadDeFila({ ...completa, dosisCantidad: 2 })).toBe(30);
    expect(cantidadDeFila(jarabe)).toBe(1);
    expect(cantidadDeFila({ ...jarabe, dosisCantidad: 50 })).toBe(1); // no se recalcula con la dosis
  });

  it('quitar el último medicamento envía una lista vacía (el servidor borra las del folio)', () => {
    expect(cuerpoGuardado([])).toEqual({ prescripciones: [] });
  });
});

describe('al elegir un molde genérico (Etapa 4: la ambulatoria se prescribe por molde)', () => {
  const molde = {
    id: 'm1', iumNivel1: 'IUM-1', nombre: 'ACETAMINOFEN 500 MG TABLETA', principioActivo: 'ACETAMINOFEN', concentracion: '500 mg',
    formaFarmaceuticaCodigo: 'TA', formaFarmaceutica: 'TABLETA', modoCalculoCantidad: 'DISCRETA' as const, formaDiscreta: true,
    formaLiquida: false, unidadVolumen: null, viasPermitidas: [{ codigo: '048', nombre: 'ORAL' }],
  };
  const jarabe = {
    ...molde, id: 'm2', nombre: 'ACETAMINOFEN 150 MG/5 ML JARABE', concentracion: '150 mg/5 ML', formaFarmaceuticaCodigo: 'JA',
    formaFarmaceutica: 'JARABE', modoCalculoCantidad: 'LIQUIDA' as const, formaDiscreta: false, formaLiquida: true, unidadVolumen: 'ML',
  };

  it('hereda molde, forma (unidad de la dosis), modo de cálculo y vías; una sola vía se preselecciona', () => {
    expect(camposDelMolde(molde)).toMatchObject({
      catalogoClinicoId: 'm1', nombreGenerico: 'ACETAMINOFEN 500 MG TABLETA', formaFarmaceuticaCodigo: 'TA', formaFarmaceutica: 'TABLETA',
      dosisUnidad: 'TA', modoCalculoCantidad: 'DISCRETA', formaDiscreta: true, unidadVolumen: null,
      viasPermitidas: [{ codigo: '048', nombre: 'ORAL' }], viaAdministracionCodigo: '048', cantidadTotalDispensar: '',
    });
    expect(camposDelMolde(molde)).not.toHaveProperty('articuloId');
  });

  it('líquida clasificada: la dosis va en la unidad de volumen del molde', () => {
    expect(camposDelMolde(jarabe)).toMatchObject({ modoCalculoCantidad: 'LIQUIDA', formaDiscreta: false, unidadVolumen: 'ML', dosisUnidad: 'ML' });
  });

  it('con varias vías conserva la elegida solo si está permitida para el nuevo molde', () => {
    const varias = { ...molde, viasPermitidas: [{ codigo: '048', nombre: 'ORAL' }, { codigo: '061', nombre: 'TOPICA' }] };
    expect(camposDelMolde(varias, '061').viaAdministracionCodigo).toBe('061');
    expect(camposDelMolde(varias, '036').viaAdministracionCodigo).toBe('');
    expect(camposDelMolde(varias).viaAdministracionCodigo).toBe('');
  });

  it('deseleccionar vacía todo lo heredado', () => {
    expect(camposDelMolde(null)).toMatchObject({
      catalogoClinicoId: '', formaFarmaceutica: '', modoCalculoCantidad: 'CRITERIO_MEDICO', formaDiscreta: false, viasPermitidas: [],
      viaAdministracionCodigo: '', dosisUnidad: '',
    });
  });

  it('LÍQUIDA: el volumen se calcula (igual que el servidor) y los envases los indica el médico', () => {
    // 5 mL cada 8 h por 5 días = 15 tomas = 75 mL.
    expect(volumenTratamiento(5, 8, 'HORAS', 5)).toBe(75);
    expect(volumenTratamiento(0.1, 24, 'HORAS', 30)).toBe(3); // sin ruido de coma flotante
    expect(volumenTratamiento('', 8, 'HORAS', 5)).toBe('');
    const filaJarabe = { ...completa, ...camposDelMolde(jarabe), dosisCantidad: 5 as const, cantidadTotalDispensar: 2 };
    expect(modoDeFila(filaJarabe)).toBe('LIQUIDA');
    expect(cantidadDeFila(filaJarabe)).toBe(2); // envases del médico, no el volumen
    expect(filaLista({ ...filaJarabe, cantidadTotalDispensar: '' })).toBe(false);
    // Filas guardadas antes de traer el modo: se deduce de formaDiscreta.
    expect(modoDeFila({ formaDiscreta: true })).toBe('DISCRETA');
    expect(modoDeFila({ formaDiscreta: false })).toBe('CRITERIO_MEDICO');
  });
});

describe('cálculo automático de la cantidad a dispensar (formas discretas)', () => {
  // Mismos casos que his-core (cantidad-dispensar.ts): deben dar lo mismo.
  it.each([
    [1, 8, 'HORAS', 5, 15],
    [2, 8, 'HORAS', 5, 30],
    [1, 6, 'HORAS', 7, 28],
    [1, 24, 'HORAS', 30, 30],
    [1, 1, 'DIAS', 30, 30],
    [1, 2, 'DIAS', 14, 7],
    [1, 3, 'DIAS', 30, 10],
    [0.5, 12, 'HORAS', 5, 5],
    [1, 16, 'HORAS', 5, 8],
    [2, 16, 'HORAS', 5, 16],
    [0.1, 24, 'HORAS', 30, 3],
  ] as const)('%s cada %s %s por %s días → %s', (dosis, intervalo, unidad, dias, esperado) => {
    expect(calcularCantidadDispensar(dosis, intervalo, unidad, dias)).toBe(esperado);
  });

  it('retorna vacío si falta un valor, si no es positivo o si la unidad no es horas ni días', () => {
    expect(calcularCantidadDispensar('', 8, 'HORAS', 5)).toBe('');
    expect(calcularCantidadDispensar(1, '', 'HORAS', 5)).toBe('');
    expect(calcularCantidadDispensar(1, 8, 'HORAS', '')).toBe('');
    expect(calcularCantidadDispensar(1, 0, 'HORAS', 5)).toBe('');
    expect(calcularCantidadDispensar(1, 8, 'HORAS', -2)).toBe('');
    expect(calcularCantidadDispensar(1, 8, 'HORAS', Number.NaN)).toBe('');
    expect(calcularCantidadDispensar(1, 8, 'SEMANAS', 5)).toBe('');
  });
});

describe('detección de vía parenteral / infusión endovenosa', () => {
  it('identifica correctamente vías parenterales y endovenosas', () => {
    expect(esViaParenteral('INTRAVENOSA')).toBe(true);
    expect(esViaParenteral('ENDOVENOSA (EV)')).toBe(true);
    expect(esViaParenteral('INFUSION PARENTERAL CONTINUA')).toBe(true);
    expect(esViaParenteral('SUBCUTANEA')).toBe(true);
    expect(esViaParenteral('INTRAMUSCULAR')).toBe(true);
  });

  it('no detecta vías no parenterales', () => {
    expect(esViaParenteral('ORAL')).toBe(false);
    expect(esViaParenteral('TOPICA')).toBe(false);
    expect(esViaParenteral('OFTALMICA')).toBe(false);
    expect(esViaParenteral(undefined)).toBe(false);
  });
});

describe('compatibilidad y exportación de componentes', () => {
  it('PrescripcionForm reexporta PrescripcionAmbForm con retrocompatibilidad', () => {
    expect(PrescripcionForm).toBe(PrescripcionAmbForm);
  });

  it('las estructuras de tipos cumplen con las interfaces requeridas', () => {
    const catalogo: BaseMedicamentoCatalogo = {
      id: 'med-01',
      cum: '1990001-01',
      principioActivo: 'Ampicilina',
      concentracion: '1 g',
      formaFarmaceutica: 'Polvo para reconstituir',
    };

    const amb: ItemPrescripcionAmb = {
      ...catalogo,
      diasTratamiento: 7,
      cantidadDispensar: 21,
      indicaciones: 'Tomar cada 8 horas',
      dosisCantidad: 500,
      dosisUnidad: 'mg',
      viaAdministracionCodigo: '048',
      frecuenciaIntervalo: 8,
      frecuenciaUnidad: 'HORAS',
    };

    // La intrahospitalaria se prescribe por molde genérico: sin presentación comercial ni CUM.
    const hosp: ItemPrescripcionHosp = {
      catalogoClinicoId: 'c0000000-0000-4000-8000-000000000002',
      nombreGenerico: 'AMPICILINA 1 G POLVO PARA RECONSTITUIR',
      fechaInicio: '2026-10-03T08:00:00Z',
      diluyente: 'Solución Salina 0.9% 100 ml',
      velocidadInfusion: 'Pasar en 30 minutos',
      observacionesEnfermeria: 'Vigilar rash cutáneo',
      dosisCantidad: 1,
      viaAdministracionCodigo: '036',
      frecuenciaIntervalo: 6,
      frecuenciaUnidad: 'HORAS',
      duracionTratamientoDias: 7,
      diagnosticoAsociadoCie: 'A419',
      estado: 'EN_TRATAMIENTO',
    };

    expect(amb.diasTratamiento).toBe(7);
    expect(amb.cantidadDispensar).toBe(21);
    expect(hosp).not.toHaveProperty('articuloId');
    expect(hosp.diluyente).toBe('Solución Salina 0.9% 100 ml');
    expect(hosp.estado).toBe('EN_TRATAMIENTO');
  });
});
