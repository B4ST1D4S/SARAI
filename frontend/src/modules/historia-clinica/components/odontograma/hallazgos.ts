import { ORDEN_CUADRICULA } from './geometria';
import {
  EstadoPiezaDental,
  SuperficieDental,
  type HallazgoSuperficieDto,
  type OdontogramaDataDto,
  type PiezaDentalDto,
} from './tipos';

/** Vista derivada de una pieza para el render (no se persiste). */
export interface VistaPieza {
  /** Estado de pieza completa; null cuando estadoGeneral es SANO. */
  readonly general: EstadoPiezaDental | null;
  readonly superficies: ReadonlyMap<SuperficieDental, EstadoPiezaDental>;
  readonly nota: string;
}

export const PIEZA_VACIA: VistaPieza = { general: null, superficies: new Map(), nota: '' };

/** Orden estable de las superficies dentro del arreglo, para payloads deterministas. */
const ORDEN_SUPERFICIE: readonly SuperficieDental[] = [
  SuperficieDental.OCLUSAL,
  SuperficieDental.INCISAL,
  SuperficieDental.MESIAL,
  SuperficieDental.DISTAL,
  SuperficieDental.VESTIBULAR,
  SuperficieDental.PALATINO,
  SuperficieDental.LINGUAL,
  SuperficieDental.GENERAL,
];
const rangoSuperficie = (s: SuperficieDental) => ORDEN_SUPERFICIE.indexOf(s);
const ordenarSuperficies = (lista: HallazgoSuperficieDto[]) =>
  lista.sort((a, b) => rangoSuperficie(a.superficie) - rangoSuperficie(b.superficie));

export const piezaSana = (numeroPieza: number): PiezaDentalDto => ({
  numeroPieza,
  estadoGeneral: EstadoPiezaDental.SANO,
  superficies: [],
});

/** Una entrada por superficie (gana la última) y sin entradas SANO: la ausencia de hallazgo significa sana. */
function depurarSuperficies(lista: readonly HallazgoSuperficieDto[] | null | undefined): HallazgoSuperficieDto[] {
  const porSuperficie = new Map<SuperficieDental, HallazgoSuperficieDto>();
  for (const h of lista ?? []) {
    if (h.estado === EstadoPiezaDental.SANO) porSuperficie.delete(h.superficie);
    else porSuperficie.set(h.superficie, { ...h });
  }
  return ordenarSuperficies([...porSuperficie.values()]);
}

/**
 * Valores iniciales del formulario: las 32 piezas permanentes de la cuadrícula
 * (las que no llegan del backend entran sanas) más cualquier otra pieza recibida
 * (p. ej. temporales), que se conserva tal cual para no perderla al guardar.
 */
export function normalizarOdontograma(datos: Partial<OdontogramaDataDto> | null | undefined): OdontogramaDataDto {
  const recibidas = new Map<number, PiezaDentalDto>();
  for (const p of datos?.piezas ?? []) {
    recibidas.set(p.numeroPieza, {
      ...p,
      estadoGeneral: p.estadoGeneral ?? EstadoPiezaDental.SANO,
      superficies: depurarSuperficies(p.superficies),
    });
  }
  const enCuadricula = new Set(ORDEN_CUADRICULA);
  const piezas = [
    ...ORDEN_CUADRICULA.map((fdi) => recibidas.get(fdi) ?? piezaSana(fdi)),
    ...[...recibidas.values()].filter((p) => !enCuadricula.has(p.numeroPieza)).sort((a, b) => a.numeroPieza - b.numeroPieza),
  ];
  return { ...datos, observaciones: datos?.observaciones ?? '', piezas };
}

/** Posición de cada pieza dentro de `piezas` (para escribir con setValue(`piezas.${i}`)). */
export function indexarPosiciones(piezas: readonly PiezaDentalDto[]): ReadonlyMap<number, number> {
  return new Map(piezas.map((p, i) => [p.numeroPieza, i] as const));
}

export function vistaDePieza(p: PiezaDentalDto | undefined): VistaPieza {
  if (!p) return PIEZA_VACIA;
  return {
    general: p.estadoGeneral === EstadoPiezaDental.SANO ? null : p.estadoGeneral,
    superficies: new Map(p.superficies.map((h) => [h.superficie, h.estado] as const)),
    nota: p.observacion ?? '',
  };
}

/* ---------- Transformaciones inmutables de una pieza ---------- */

/** `null` o SANO quitan el hallazgo de esa superficie. */
export function conSuperficie(
  p: PiezaDentalDto,
  superficie: SuperficieDental,
  estado: EstadoPiezaDental | null,
): PiezaDentalDto {
  const resto = p.superficies.filter((h) => h.superficie !== superficie);
  const superficies =
    estado === null || estado === EstadoPiezaDental.SANO ? resto : ordenarSuperficies([...resto, { superficie, estado }]);
  return { ...p, superficies };
}

/** `null` vuelve la pieza a SANO; los hallazgos de superficie se conservan. */
export const conEstadoGeneral = (p: PiezaDentalDto, estado: EstadoPiezaDental | null): PiezaDentalDto => ({
  ...p,
  estadoGeneral: estado ?? EstadoPiezaDental.SANO,
});

/** Texto vacío elimina la clave `observacion` (opcional en el DTO). */
export function conObservacion(p: PiezaDentalDto, texto: string): PiezaDentalDto {
  const { observacion: _previa, ...resto } = p;
  return texto.trim() === '' ? resto : { ...resto, observacion: texto };
}

/** Pieza completa en SANO y sin superficies; conserva la observación. */
export const limpiarPieza = (p: PiezaDentalDto): PiezaDentalDto => ({
  ...p,
  estadoGeneral: EstadoPiezaDental.SANO,
  superficies: [],
});

/* ---------- Resúmenes ---------- */

/** Hallazgos por estado: cada superficie marcada y cada estado general distinto de SANO. */
export function contarPorEstado(piezas: readonly PiezaDentalDto[]): ReadonlyMap<EstadoPiezaDental, number> {
  const out = new Map<EstadoPiezaDental, number>();
  const sumar = (e: EstadoPiezaDental) => out.set(e, (out.get(e) ?? 0) + 1);
  for (const p of piezas) {
    if (p.estadoGeneral !== EstadoPiezaDental.SANO) sumar(p.estadoGeneral);
    for (const h of p.superficies) sumar(h.estado);
  }
  return out;
}
