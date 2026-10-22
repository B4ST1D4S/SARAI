import { describe, expect, it } from 'vitest';
import type { AlergiaItem } from '@/types/historiaClinica.types';
import {
  calcularImc,
  clasificarImc,
  erroresCierreAlergias,
  errorRangoSigno,
  erroresRangoSignos,
  evaluarSignosVitales,
  type SignosVitalesMedidos,
} from '../validaciones';

const NORMALES: SignosVitalesMedidos = { paSistolica: 120, paDiastolica: 80, fc: 75, spo2: 97, temp: 36.8 };

const evaluar = (cambios: SignosVitalesMedidos) => evaluarSignosVitales({ ...NORMALES, ...cambios });

describe('evaluarSignosVitales', () => {
  it('sin alertas con todos los signos en rango normal', () => {
    expect(evaluar({})).toEqual({});
  });

  it('signos sin dato no generan alertas', () => {
    expect(evaluarSignosVitales({})).toEqual({});
  });

  describe('presión arterial', () => {
    it.each([
      [159, 99],
      [140, 90],
      [90, 60],
    ])('normal / sin alerta: %i/%i', (paSistolica, paDiastolica) => {
      expect(evaluar({ paSistolica, paDiastolica }).tension).toBeUndefined();
    });

    it.each([
      [160, 80],
      [130, 100],
      [179, 119],
    ])('HTA estadio II en ámbar: %i/%i', (paSistolica, paDiastolica) => {
      expect(evaluar({ paSistolica, paDiastolica }).tension).toEqual({ nivel: 'ambar', mensaje: 'HTA estadio II' });
    });

    it.each([
      [180, 80],
      [130, 120],
      [200, 130],
    ])('crisis HTA en rojo: %i/%i', (paSistolica, paDiastolica) => {
      expect(evaluar({ paSistolica, paDiastolica }).tension).toEqual({ nivel: 'rojo', mensaje: 'Crisis HTA' });
    });

    it.each([
      [89, 70],
      [110, 59],
      [80, 50],
    ])('hipotensión en ámbar: %i/%i', (paSistolica, paDiastolica) => {
      expect(evaluar({ paSistolica, paDiastolica }).tension).toEqual({ nivel: 'ambar', mensaje: 'Hipotensión' });
    });
  });

  describe('frecuencia cardíaca', () => {
    it.each([50, 75, 120])('normal: %i lpm', (fc) => {
      expect(evaluar({ fc }).frecuenciaCardiaca).toBeUndefined();
    });

    it.each([0, 30, 39, 39.9])('bradicardia extrema en rojo: %d lpm', (fc) => {
      expect(evaluar({ fc }).frecuenciaCardiaca).toEqual({ nivel: 'rojo', mensaje: 'Bradicardia extrema' });
    });

    it.each([40, 45, 49.9])('bradicardia moderada en ámbar: %d lpm', (fc) => {
      expect(evaluar({ fc }).frecuenciaCardiaca).toEqual({ nivel: 'ambar', mensaje: 'Bradicardia moderada' });
    });

    it.each([120.1, 121, 140])('taquicardia moderada en ámbar: %d lpm', (fc) => {
      expect(evaluar({ fc }).frecuenciaCardiaca).toEqual({ nivel: 'ambar', mensaje: 'Taquicardia moderada' });
    });

    it.each([140.1, 141, 180])('taquicardia severa en rojo: %d lpm', (fc) => {
      expect(evaluar({ fc }).frecuenciaCardiaca).toEqual({ nivel: 'rojo', mensaje: 'Taquicardia severa' });
    });
  });

  describe('SpO2', () => {
    it.each([90, 95, 100])('normal: %i%%', (spo2) => {
      expect(evaluar({ spo2 }).saturacion).toBeUndefined();
    });

    it.each([89.9, 85, 70])('hipoxemia en rojo: %d%%', (spo2) => {
      expect(evaluar({ spo2 }).saturacion).toEqual({ nivel: 'rojo', mensaje: 'Hipoxemia' });
    });
  });

  describe('temperatura', () => {
    it.each([35, 36.5, 38.4])('normal: %d °C', (temp) => {
      expect(evaluar({ temp }).temperatura).toBeUndefined();
    });

    it.each([38.5, 39, 41])('fiebre en ámbar: %d °C', (temp) => {
      expect(evaluar({ temp }).temperatura).toEqual({ nivel: 'ambar', mensaje: 'Fiebre' });
    });

    it.each([34.9, 33, 30])('hipotermia en ámbar: %d °C', (temp) => {
      expect(evaluar({ temp }).temperatura).toEqual({ nivel: 'ambar', mensaje: 'Hipotermia' });
    });
  });

  it('evalúa cada signo de forma independiente', () => {
    expect(evaluar({ paSistolica: 185, fc: 35, spo2: 85, temp: 39 })).toEqual({
      tension: { nivel: 'rojo', mensaje: 'Crisis HTA' },
      frecuenciaCardiaca: { nivel: 'rojo', mensaje: 'Bradicardia extrema' },
      saturacion: { nivel: 'rojo', mensaje: 'Hipoxemia' },
      temperatura: { nivel: 'ambar', mensaje: 'Fiebre' },
    });
  });
});

describe('calcularImc', () => {
  it('calcula peso / talla² con un decimal', () => {
    expect(calcularImc(64, 168)).toBe(22.7);
    expect(calcularImc(70, 170)).toBe(24.2);
  });

  it.each([
    [undefined, 170],
    [70, undefined],
    [0, 170],
    [70, 0],
    [-5, 170],
  ])('sin IMC si falta o es inválido el peso o la talla: %s kg / %s cm', (peso, talla) => {
    expect(calcularImc(peso, talla)).toBeNull();
  });
});

describe('clasificarImc', () => {
  it.each([
    [17, 'ambar', 'Bajo peso'],
    [18.5, 'normal', 'Peso normal'],
    [24.9, 'normal', 'Peso normal'],
    [25, 'ambar', 'Sobrepeso'],
    [30, 'rojo', 'Obesidad I'],
    [35, 'rojo', 'Obesidad II / Mórbida'],
  ])('IMC %d → %s (%s)', (imc, nivel, mensaje) => {
    expect(clasificarImc(imc)).toEqual({ nivel, mensaje });
  });

  it('sin IMC no hay clasificación', () => {
    expect(clasificarImc(null)).toBeNull();
  });
});

describe('rangos admitidos', () => {
  it('acepta los límites del rango', () => {
    expect(errorRangoSigno('fc', 30)).toBeUndefined();
    expect(errorRangoSigno('fc', 250)).toBeUndefined();
    expect(errorRangoSigno('temp', 36.6)).toBeUndefined();
  });

  it('rechaza valores fuera de rango', () => {
    expect(errorRangoSigno('fc', 1200)).toBe('F. cardíaca fuera de rango (30–250 lpm)');
    expect(errorRangoSigno('spo2', 101)).toBe('SpO2 fuera de rango (50–100 %)');
  });

  it('rechaza decimales en campos enteros, no en los decimales', () => {
    expect(errorRangoSigno('fc', 75.5)).toBe('F. cardíaca debe ser un número entero');
    expect(errorRangoSigno('pesoKg', 70.5)).toBeUndefined();
  });

  it('sin dato no hay error de rango', () => {
    expect(errorRangoSigno('fc', undefined)).toBeUndefined();
    expect(erroresRangoSignos({})).toEqual([]);
  });

  it('erroresRangoSignos reúne solo los signos fuera de rango', () => {
    expect(erroresRangoSignos({ ...NORMALES, fc: 1200, fr: 2 })).toEqual([
      'F. cardíaca fuera de rango (30–250 lpm)',
      'F. respiratoria fuera de rango (5–60 rpm)',
    ]);
  });
});

describe('erroresCierreAlergias', () => {
  const MENSAJE = 'Registre las alergias del paciente o marque «Sin alergias conocidas».';
  const alergia = (cambios: Partial<AlergiaItem> = {}): AlergiaItem => ({
    id: 'a1',
    sustancia: '',
    categoria: 'medication',
    tipo: 'allergy',
    criticidad: 'low',
    severidad: '',
    manifestacion: '',
    ...cambios,
  });

  it.each([
    ['sin datos', undefined],
    ['objeto vacío', {}],
    ['casilla desmarcada y sin alergias', { sinAlergiasConocidas: false, alergias: [] }],
    ['solo filas en blanco', { sinAlergiasConocidas: false, alergias: [alergia(), alergia({ id: 'a2', sustancia: '   ' })] }],
  ])('rechaza el cierre: %s', (_caso, data) => {
    expect(erroresCierreAlergias(data)).toEqual([MENSAJE]);
  });

  it('acepta «Sin alergias conocidas» marcada aunque no haya filas', () => {
    expect(erroresCierreAlergias({ sinAlergiasConocidas: true })).toEqual([]);
  });

  it('acepta al menos una alergia con sustancia escrita', () => {
    expect(erroresCierreAlergias({ alergias: [alergia(), alergia({ id: 'a2', sustancia: 'Penicilina' })] })).toEqual([]);
  });

  it('acepta una fila con solo la manifestación escrita (la fila queda como incompleta en pantalla)', () => {
    expect(erroresCierreAlergias({ alergias: [alergia({ manifestacion: 'Urticaria' })] })).toEqual([]);
  });
});
