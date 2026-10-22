import { type CaraAnatomica, type Cuadrante, cuadranteDe, esAnterior, esSuperior, posicionEnArcada } from './geometria';
import { EstadoPiezaDental, SuperficieDental } from './tipos';

export type AmbitoEstado = 'superficie' | 'pieza';

export interface DefinicionEstado {
  readonly estado: EstadoPiezaDental;
  readonly etiqueta: string;
  readonly ambito: AmbitoEstado;
  /** Clases Tailwind completas (literales, para que el compilador JIT las detecte). */
  readonly fill: string;
  readonly bg: string;
  readonly textoSobreColor: string;
}

export const ESTADOS_SUPERFICIE: readonly DefinicionEstado[] = [
  {
    estado: EstadoPiezaDental.CARIES,
    etiqueta: 'Caries',
    ambito: 'superficie',
    fill: 'fill-[#c93a32] dark:fill-[#e0534a]',
    bg: 'bg-[#c93a32] dark:bg-[#e0534a]',
    textoSobreColor: 'text-white',
  },
  {
    estado: EstadoPiezaDental.OBTURADO_RESINA,
    etiqueta: 'Resina',
    ambito: 'superficie',
    fill: 'fill-[#2f5fc4] dark:fill-[#5b8cf0]',
    bg: 'bg-[#2f5fc4] dark:bg-[#5b8cf0]',
    textoSobreColor: 'text-white',
  },
  {
    estado: EstadoPiezaDental.SELLANTE,
    etiqueta: 'Sellante',
    ambito: 'superficie',
    fill: 'fill-[#23875a] dark:fill-[#3cae7c]',
    bg: 'bg-[#23875a] dark:bg-[#3cae7c]',
    textoSobreColor: 'text-white',
  },
];

export const ESTADOS_PIEZA: readonly DefinicionEstado[] = [
  {
    estado: EstadoPiezaDental.CORONA,
    etiqueta: 'Corona',
    ambito: 'pieza',
    fill: 'fill-[#f2c230]',
    bg: 'bg-[#f2c230]',
    textoSobreColor: 'text-[#2b1d05]',
  },
  {
    estado: EstadoPiezaDental.IMPLANTE,
    etiqueta: 'Implante',
    ambito: 'pieza',
    fill: 'fill-[#7b4bb7] dark:fill-[#9a6fd6]',
    bg: 'bg-[#7b4bb7] dark:bg-[#9a6fd6]',
    textoSobreColor: 'text-white',
  },
  {
    estado: EstadoPiezaDental.AUSENTE_PERDIDO,
    etiqueta: 'Ausente',
    ambito: 'pieza',
    fill: 'fill-[#566a71] dark:fill-[#7d939b]',
    bg: 'bg-[#566a71] dark:bg-[#7d939b]',
    textoSobreColor: 'text-white',
  },
];

export const DEFINICIONES: ReadonlyMap<EstadoPiezaDental, DefinicionEstado> = new Map(
  [...ESTADOS_SUPERFICIE, ...ESTADOS_PIEZA].map((d) => [d.estado, d] as const),
);

export const BORRAR = 'BORRAR' as const;
export type HerramientaId = EstadoPiezaDental | typeof BORRAR;

export function ambitoHerramienta(h: HerramientaId): AmbitoEstado | 'ambos' {
  if (h === BORRAR) return 'ambos';
  return DEFINICIONES.get(h)?.ambito ?? 'superficie';
}
export function etiquetaHerramienta(h: HerramientaId): string {
  if (h === BORRAR) return 'Borrar';
  return DEFINICIONES.get(h)?.etiqueta ?? h;
}

/* ---------- Nomenclatura ---------- */

export function superficieDeCara(cara: CaraAnatomica, fdi: number): SuperficieDental {
  switch (cara) {
    case 'central':
      return esAnterior(fdi) ? SuperficieDental.INCISAL : SuperficieDental.OCLUSAL;
    case 'mesial':
      return SuperficieDental.MESIAL;
    case 'distal':
      return SuperficieDental.DISTAL;
    case 'vestibular':
      return SuperficieDental.VESTIBULAR;
    case 'interna':
      return esSuperior(fdi) ? SuperficieDental.PALATINO : SuperficieDental.LINGUAL;
  }
}

const INFO_SUPERFICIE: Readonly<Partial<Record<SuperficieDental, { nombre: string; descripcion: string }>>> = {
  [SuperficieDental.OCLUSAL]: { nombre: 'Oclusal', descripcion: 'Cara de masticación' },
  [SuperficieDental.INCISAL]: { nombre: 'Incisal', descripcion: 'Borde de corte' },
  [SuperficieDental.MESIAL]: { nombre: 'Mesial', descripcion: 'Hacia la línea media' },
  [SuperficieDental.DISTAL]: { nombre: 'Distal', descripcion: 'Lejos de la línea media' },
  [SuperficieDental.VESTIBULAR]: { nombre: 'Vestibular', descripcion: 'Hacia labios y mejillas' },
  [SuperficieDental.PALATINO]: { nombre: 'Palatino', descripcion: 'Hacia el paladar' },
  [SuperficieDental.LINGUAL]: { nombre: 'Lingual', descripcion: 'Hacia la lengua' },
  [SuperficieDental.GENERAL]: { nombre: 'Pieza completa', descripcion: 'Toda la pieza' },
};
export const nombreSuperficie = (s: SuperficieDental): string => INFO_SUPERFICIE[s]?.nombre ?? s;
export const descripcionSuperficie = (s: SuperficieDental): string => INFO_SUPERFICIE[s]?.descripcion ?? '';

const NOMBRE_POR_POSICION: readonly string[] = [
  '', 'Incisivo central', 'Incisivo lateral', 'Canino', 'Primer premolar',
  'Segundo premolar', 'Primer molar', 'Segundo molar', 'Tercer molar',
];
const LADO: Readonly<Record<Cuadrante, string>> = {
  1: 'superior derecho',
  2: 'superior izquierdo',
  3: 'inferior izquierdo',
  4: 'inferior derecho',
};
export const TITULO_CUADRANTE: Readonly<Record<Cuadrante, string>> = {
  1: 'Q1 · Superior derecho',
  2: 'Q2 · Superior izquierdo',
  3: 'Q3 · Inferior izquierdo',
  4: 'Q4 · Inferior derecho',
};
export const nombrePieza = (fdi: number): string =>
  `${NOMBRE_POR_POSICION[posicionEnArcada(fdi)] ?? 'Pieza'} ${LADO[cuadranteDe(fdi)]}`;