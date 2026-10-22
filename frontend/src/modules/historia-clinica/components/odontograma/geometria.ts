/**
 * Geometría pura del odontograma.
 * Sin React ni contrato de dominio: solo numeración FDI, posiciones y cadenas `d` de paths SVG.
 */

export type TipoPieza = 'incisivo' | 'canino' | 'premolar' | 'molar';
export type Cuadrante = 1 | 2 | 3 | 4;
export type PosicionSector = 'arriba' | 'derecha' | 'abajo' | 'izquierda' | 'centro';
export type PosicionLateral = Exclude<PosicionSector, 'centro'>;

/**
 * Cara anatómica independiente de la nomenclatura clínica.
 * `central` → OCLUSAL/INCISAL e `interna` → PALATINO/LINGUAL se resuelven en el catálogo.
 */
export type CaraAnatomica = 'central' | 'mesial' | 'distal' | 'vestibular' | 'interna';
export const CARAS: readonly CaraAnatomica[] = ['central', 'mesial', 'distal', 'vestibular', 'interna'];

export const VIEWBOX = {
  vestibular: '0 0 60 120',
  oclusal: '0 0 60 60',
  oclusalAmpliado: '-27 -13 114 86',
} as const;

const CX = 30;
const CY = 30;
export const CENTRO_OCLUSAL = { x: CX, y: CY } as const;

/* ---------- Numeración FDI ---------- */

export function cuadranteDe(fdi: number): Cuadrante {
  const q = Math.floor(fdi / 10);
  if (q < 1 || q > 4) throw new RangeError(`Pieza FDI fuera de la dentición permanente: ${fdi}`);
  return q as Cuadrante;
}
export const posicionEnArcada = (fdi: number): number => fdi % 10;
export const esSuperior = (fdi: number): boolean => cuadranteDe(fdi) <= 2;
export const esAnterior = (fdi: number): boolean => posicionEnArcada(fdi) <= 3;

export function tipoDePieza(fdi: number): TipoPieza {
  const n = posicionEnArcada(fdi);
  if (n <= 2) return 'incisivo';
  if (n === 3) return 'canino';
  if (n <= 5) return 'premolar';
  return 'molar';
}

function rango(desde: number, hasta: number): number[] {
  const paso = desde <= hasta ? 1 : -1;
  const out: number[] = [];
  for (let i = desde; i !== hasta + paso; i += paso) out.push(i);
  return out;
}

export interface GrupoCuadrante {
  readonly cuadrante: Cuadrante;
  readonly piezas: readonly number[];
}
/** Orden visual de la cuadrícula: fila superior Q1 | Q2, fila inferior Q4 | Q3. */
export const CUADRICULA: readonly GrupoCuadrante[] = [
  { cuadrante: 1, piezas: rango(18, 11) },
  { cuadrante: 2, piezas: rango(21, 28) },
  { cuadrante: 4, piezas: rango(48, 41) },
  { cuadrante: 3, piezas: rango(31, 38) },
];
export const ORDEN_CUADRICULA: readonly number[] = CUADRICULA.flatMap((g) => g.piezas);

/**
 * Dónde se dibuja cada cara en la vista oclusal.
 * Q1 y Q4: mesial a la derecha del dibujo (hacia la línea media). Q2 y Q3: a la izquierda.
 * Arcada superior: vestibular arriba. Inferior: vestibular abajo.
 * PENDIENTE: validar esta convención con el odontólogo; se cambia solo aquí.
 */
export function posicionDeCara(cara: CaraAnatomica, q: Cuadrante): PosicionSector {
  const superior = q <= 2;
  const mesialDerecha = q === 1 || q === 4;
  switch (cara) {
    case 'central':
      return 'centro';
    case 'mesial':
      return mesialDerecha ? 'derecha' : 'izquierda';
    case 'distal':
      return mesialDerecha ? 'izquierda' : 'derecha';
    case 'vestibular':
      return superior ? 'arriba' : 'abajo';
    case 'interna':
      return superior ? 'abajo' : 'arriba';
  }
}

/* ---------- Vista oclusal: superelipses por tipo de pieza ---------- */

interface ParametrosOclusales {
  /** Semiancho mesio-distal. */
  readonly rx: number;
  /** Semialto vestíbulo-lingual. */
  readonly ry: number;
  /** Exponente de la superelipse: 2 = elipse, mayor = más cuadrado. */
  readonly n: number;
  /** Escala de la cara central respecto al contorno. */
  readonly ix: number;
  readonly iy: number;
}

export const PARAMETROS_OCLUSALES: Readonly<Record<TipoPieza, ParametrosOclusales>> = {
  molar: { rx: 28, ry: 26, n: 3.4, ix: 0.46, iy: 0.46 },
  premolar: { rx: 24, ry: 28, n: 2.6, ix: 0.44, iy: 0.4 },
  canino: { rx: 22, ry: 26, n: 1.8, ix: 0.46, iy: 0.4 },
  incisivo: { rx: 28, ry: 19, n: 2.6, ix: 0.58, iy: 0.4 },
};

function radioSuperelipse(a: number, b: number, n: number, t: number): number {
  return Math.pow(Math.pow(Math.abs(Math.cos(t) / a), n) + Math.pow(Math.abs(Math.sin(t) / b), n), -1 / n);
}

/** Puntos del contorno entre dos ángulos (grados, sentido horario en coordenadas SVG). */
function muestrear(a: number, b: number, n: number, desde: number, hasta: number): string[] {
  const pasos = Math.max(8, Math.ceil(Math.abs(hasta - desde) / 3));
  const pts: string[] = [];
  for (let i = 0; i <= pasos; i++) {
    const t = ((desde + ((hasta - desde) * i) / pasos) * Math.PI) / 180;
    const r = radioSuperelipse(a, b, n, t);
    pts.push(`${(CX + r * Math.cos(t)).toFixed(2)},${(CY + r * Math.sin(t)).toFixed(2)}`);
  }
  return pts;
}

/**
 * Cinco paths cerrados con bordes compartidos exactos.
 * Los sectores laterales se cortan en las "esquinas" del contorno (ángulo atan2(ry, rx)).
 */
export function construirSectores(p: ParametrosOclusales): Readonly<Record<PosicionSector, string>> {
  const ia = p.rx * p.ix;
  const ib = p.ry * p.iy;
  const phi = (Math.atan2(p.ry, p.rx) * 180) / Math.PI;
  const sector = (desde: number, hasta: number): string =>
    `M${muestrear(p.rx, p.ry, p.n, desde, hasta).join(' L')} L${muestrear(ia, ib, p.n, hasta, desde).join(' L')} Z`;
  return {
    arriba: sector(180 + phi, 360 - phi),
    derecha: sector(-phi, phi),
    abajo: sector(phi, 180 - phi),
    izquierda: sector(180 - phi, 180 + phi),
    centro: `M${muestrear(ia, ib, p.n, 0, 360).join(' L')} Z`,
  };
}

export const SECTORES_OCLUSALES: Readonly<Record<TipoPieza, Readonly<Record<PosicionSector, string>>>> = {
  incisivo: construirSectores(PARAMETROS_OCLUSALES.incisivo),
  canino: construirSectores(PARAMETROS_OCLUSALES.canino),
  premolar: construirSectores(PARAMETROS_OCLUSALES.premolar),
  molar: construirSectores(PARAMETROS_OCLUSALES.molar),
};

/** Surcos decorativos de la cara central (sin eventos). */
export const SURCOS: Readonly<Record<TipoPieza, string>> = {
  molar: 'M22,30 C25,27 27,33 30,30 C33,27 35,33 38,30 M30,22 C28,25 32,27 30,30 C28,33 32,35 30,38',
  premolar: 'M23,30 C26,28 34,28 37,30',
  canino: 'M26,26 L30,30 L34,26',
  incisivo: 'M20,30 C25,29 35,29 40,30',
};

export interface PosicionEtiqueta {
  readonly x: number;
  readonly y: number;
  readonly anchor: 'start' | 'middle' | 'end';
}
/** Rótulos de la vista oclusal ampliada, fuera del contorno. */
export const POSICION_ETIQUETA: Readonly<Record<PosicionLateral, PosicionEtiqueta>> = {
  arriba: { x: 30, y: -6, anchor: 'middle' },
  abajo: { x: 30, y: 66, anchor: 'middle' },
  izquierda: { x: -1, y: 30, anchor: 'end' },
  derecha: { x: 61, y: 30, anchor: 'start' },
};

/* ---------- Vista vestibular (dibujada para arcada superior: raíces arriba) ---------- */

export const FORMAS_VESTIBULARES: Readonly<Record<TipoPieza, { readonly corona: string; readonly raiz: string }>> = {
  incisivo: {
    corona: 'M18,60 C22,57 38,57 42,60 L50,98 C51,106 46,112 38,112 L22,112 C14,112 9,106 10,98 Z',
    raiz: 'M19,62 C20,38 26,10 30,5 C34,10 40,38 41,62 Z',
  },
  canino: {
    corona: 'M15,60 C22,57 38,57 45,60 L51,92 C51,102 40,111 30,117 C20,111 9,102 9,92 Z',
    raiz: 'M18,62 C19,36 25,8 30,3 C35,8 41,36 42,62 Z',
  },
  premolar: {
    corona: 'M13,60 C22,57 38,57 47,60 L53,94 C53,106 45,112 37,111 C33,109 27,109 23,111 C15,112 7,106 7,94 Z',
    raiz: 'M17,62 C18,38 25,12 30,7 C35,12 42,38 43,62 Z',
  },
  molar: {
    corona:
      'M7,64 C9,57 21,56 30,56 C39,56 51,57 53,64 L58,94 C59,108 52,115 44,113 C40,111 38,108 35,110 C32,113 28,113 25,110 C22,108 20,111 16,113 C8,115 1,108 2,94 Z',
    raiz: 'M9,66 C5,46 7,22 14,8 C19,5 22,28 26,50 C28,56 29,60 30,62 C31,60 32,56 34,50 C38,28 41,5 46,8 C53,22 55,46 51,66 Z',
  },
};

export const IMPLANTE = {
  cuerpo: 'M21,62 H39 L35,14 Q30,5 25,14 Z',
  roscas: [22, 29, 36, 43, 50, 57]
    .map((y) => {
      const mitad = 4 + ((y - 14) / 48) * 6;
      return `M${30 - mitad},${y} L${30 + mitad},${y}`;
    })
    .join(' '),
} as const;

/** La arcada inferior reutiliza las mismas formas, reflejadas verticalmente. */
export const TRANSFORM_ARCADA_INFERIOR = 'translate(0,120) scale(1,-1)';

export const CRUZ = {
  vestibular: 'M10,28 L50,98 M50,28 L10,98',
  oclusal: 'M16,16 L44,44 M44,16 L16,44',
  oclusalAmpliado: 'M14,14 L46,46 M46,14 L14,46',
} as const;