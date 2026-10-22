import type { KeyboardEvent } from 'react';
import {
  CARAS,
  CENTRO_OCLUSAL,
  CRUZ,
  FORMAS_VESTIBULARES,
  IMPLANTE,
  POSICION_ETIQUETA,
  SECTORES_OCLUSALES,
  SURCOS,
  TRANSFORM_ARCADA_INFERIOR,
  VIEWBOX,
  cuadranteDe,
  esSuperior,
  posicionDeCara,
  tipoDePieza,
} from './geometria';
import { DEFINICIONES, nombreSuperficie, superficieDeCara } from './catalogo';
import type { VistaPieza } from './hallazgos';
import { EstadoPiezaDental, type SuperficieDental } from './tipos';

/* Tokens visuales del prototipo */
const TRAZO = 'stroke-[#24373e] dark:stroke-[#0a1215] [stroke-linejoin:round]';
const CORONA_SANA = 'fill-white dark:fill-[#eef4f6]';
const RAIZ = 'fill-[#c6dce4] dark:fill-[#7ea3b0]';
const SECTOR_SANO = 'fill-white dark:fill-[#eef4f6]';
const CRUZ_CLS = 'pointer-events-none fill-none stroke-[#566a71] dark:stroke-[#93a7ae] [stroke-linecap:round]';
const ACCENT_RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b7a87] dark:focus-visible:outline-[#4cc3d0]';

const alActivar = (accion: () => void) => (e: KeyboardEvent<SVGElement>) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    accion();
  }
};

/* ---------- Vista frontal (vestibular): corona + raíces ---------- */

export interface VistaFrontalProps {
  fdi: number;
  pieza: VistaPieza;
  /** Sin handler la vista es de solo lectura. */
  onPieza?: (fdi: number) => void;
  className?: string;
}

export function VistaFrontal({ fdi, pieza, onPieza, className = '' }: VistaFrontalProps) {
  const forma = FORMAS_VESTIBULARES[tipoDePieza(fdi)];
  const estado = pieza.general;
  const ausente = estado === EstadoPiezaDental.AUSENTE_PERDIDO;
  const etiqueta = estado ? (DEFINICIONES.get(estado)?.etiqueta ?? estado) : 'sin hallazgos';
  const activar = onPieza ? () => onPieza(fdi) : undefined;

  return (
    <svg
      viewBox={VIEWBOX.vestibular}
      className={`group block h-auto overflow-visible rounded ${activar ? `cursor-pointer ${ACCENT_RING}` : ''} ${className}`}
      role={activar ? 'button' : 'img'}
      tabIndex={activar ? 0 : undefined}
      aria-label={`Pieza ${fdi}, vista frontal: ${etiqueta}`}
      onClick={activar}
      onKeyDown={activar ? alActivar(activar) : undefined}
    >
      <title>{`Pieza ${fdi} · vista frontal`}</title>
      <rect width={60} height={120} fill="transparent" />
      <g
        transform={esSuperior(fdi) ? undefined : TRANSFORM_ARCADA_INFERIOR}
        className={ausente ? 'opacity-[.35]' : undefined}
      >
        {estado === EstadoPiezaDental.IMPLANTE ? (
          <g className={activar ? 'group-hover:opacity-80' : undefined}>
            <path d={IMPLANTE.cuerpo} strokeWidth={1.5} className={`${TRAZO} ${DEFINICIONES.get(EstadoPiezaDental.IMPLANTE)?.fill ?? ''}`} />
            <path d={IMPLANTE.roscas} strokeWidth={1.2} className="fill-none stroke-white/60" />
          </g>
        ) : (
          <path d={forma.raiz} strokeWidth={1.5} className={`${TRAZO} ${RAIZ} ${activar ? 'group-hover:opacity-80' : ''}`} />
        )}
        <path
          d={forma.corona}
          strokeWidth={1.5}
          className={`${TRAZO} ${estado === EstadoPiezaDental.CORONA ? (DEFINICIONES.get(estado)?.fill ?? '') : CORONA_SANA} ${activar ? 'group-hover:opacity-80' : ''}`}
        />
      </g>
      {ausente && <path d={CRUZ.vestibular} strokeWidth={5} className={CRUZ_CLS} />}
    </svg>
  );
}

/* ---------- Vista oclusal: 5 sectores con contorno anatómico ---------- */

export interface VistaOclusalProps {
  fdi: number;
  pieza: VistaPieza;
  onSuperficie?: (fdi: number, superficie: SuperficieDental) => void;
  /** Versión de la ficha: rótulos alrededor y nombre en la cara central. */
  ampliada?: boolean;
  /** Prefijo de id para no repetir ids cuando la misma pieza aparece en la cuadrícula y en la ficha. */
  idPrefijo: string;
  className?: string;
}

export function VistaOclusal({ fdi, pieza, onSuperficie, ampliada = false, idPrefijo, className = '' }: VistaOclusalProps) {
  const q = cuadranteDe(fdi);
  const tipo = tipoDePieza(fdi);
  const sectores = SECTORES_OCLUSALES[tipo];
  const ausente = pieza.general === EstadoPiezaDental.AUSENTE_PERDIDO;
  const supCentral = superficieDeCara('central', fdi);
  const centralMarcada = pieza.superficies.has(supCentral);

  return (
    <svg
      viewBox={ampliada ? VIEWBOX.oclusalAmpliado : VIEWBOX.oclusal}
      className={`block h-auto touch-manipulation overflow-visible ${className}`}
      role="group"
      aria-label={`Pieza ${fdi}, vista oclusal${ampliada ? ' ampliada' : ''}`}
    >
      <g className={ausente ? 'opacity-[.35]' : undefined}>
        {CARAS.map((cara) => {
          const sup = superficieDeCara(cara, fdi);
          const estado = pieza.superficies.get(sup);
          const def = estado ? DEFINICIONES.get(estado) : undefined;
          const activar = onSuperficie ? () => onSuperficie(fdi, sup) : undefined;
          return (
            <path
              key={cara}
              id={`${idPrefijo}${fdi}-${sup}`}
              d={sectores[posicionDeCara(cara, q)]}
              strokeWidth={1.3}
              className={[
                TRAZO,
                def?.fill ?? SECTOR_SANO,
                'transition-opacity motion-reduce:transition-none',
                activar
                  ? 'cursor-pointer hover:opacity-75 focus-visible:outline-none focus-visible:[stroke-width:2.6] focus-visible:stroke-[#0b7a87] dark:focus-visible:stroke-[#4cc3d0]'
                  : '',
              ].join(' ')}
              role={activar ? 'button' : undefined}
              tabIndex={activar ? 0 : undefined}
              aria-label={`Pieza ${fdi}, ${nombreSuperficie(sup)}: ${def?.etiqueta ?? 'sana'}`}
              onClick={activar}
              onKeyDown={activar ? alActivar(activar) : undefined}
            >
              <title>{`${fdi} · ${nombreSuperficie(sup)}`}</title>
            </path>
          );
        })}
        {ampliada ? (
          <text
            x={CENTRO_OCLUSAL.x}
            y={CENTRO_OCLUSAL.y}
            textAnchor="middle"
            dominantBaseline="central"
            className={`pointer-events-none text-[4.4px] font-semibold ${centralMarcada ? 'fill-white' : 'fill-[#24373e]'}`}
          >
            {nombreSuperficie(supCentral)}
          </text>
        ) : (
          <path
            d={SURCOS[tipo]}
            strokeWidth={1.1}
            className="pointer-events-none fill-none stroke-[#24373e] opacity-40 [stroke-linecap:round] dark:stroke-[#0a1215]"
          />
        )}
      </g>
      {ampliada &&
        CARAS.map((cara) => {
          const pos = posicionDeCara(cara, q);
          if (pos === 'centro') return null;
          const et = POSICION_ETIQUETA[pos];
          return (
            <text
              key={cara}
              x={et.x}
              y={et.y}
              textAnchor={et.anchor}
              dominantBaseline="central"
              className="fill-[#17262b] text-[5.6px] font-semibold dark:fill-[#e5edef]"
            >
              {nombreSuperficie(superficieDeCara(cara, fdi))}
            </text>
          );
        })}
      {ausente && (
        <path
          d={ampliada ? CRUZ.oclusalAmpliado : CRUZ.oclusal}
          strokeWidth={ampliada ? 3 : 3.5}
          className={CRUZ_CLS}
        />
      )}
    </svg>
  );
}

/* ---------- Tarjeta de la cuadrícula: número + doble vista ---------- */

export interface AdvancedToothCardProps {
  fdi: number;
  pieza: VistaPieza;
  seleccionada: boolean;
  readOnly: boolean;
  onPieza: (fdi: number) => void;
  onSuperficie: (fdi: number, superficie: SuperficieDental) => void;
  onAbrirFicha: (fdi: number) => void;
}

export function AdvancedToothCard({
  fdi,
  pieza,
  seleccionada,
  readOnly,
  onPieza,
  onSuperficie,
  onAbrirFicha,
}: AdvancedToothCardProps) {
  const superior = esSuperior(fdi);
  return (
    <div
      className={[
        'flex min-w-0 items-center gap-1.5 rounded-lg border-[1.5px] py-1',
        superior ? 'flex-col' : 'flex-col-reverse',
        seleccionada
          ? 'border-[#0b7a87] bg-[#0b7a87]/10 dark:border-[#4cc3d0] dark:bg-[#4cc3d0]/10'
          : 'border-transparent',
      ].join(' ')}
    >
      <button
        type="button"
        id={`num-${fdi}`}
        onClick={() => onAbrirFicha(fdi)}
        aria-expanded={seleccionada}
        aria-label={`Abrir ficha de la pieza ${fdi}`}
        className={`relative min-h-[28px] w-full rounded-full border border-[#b9c8cd] bg-white font-mono text-xs font-medium tabular-nums hover:border-[#0b7a87] hover:text-[#0b7a87] md:w-auto md:min-w-[34px] md:px-1.5 dark:border-[#33474f] dark:bg-[#162329] dark:hover:border-[#4cc3d0] dark:hover:text-[#4cc3d0] ${ACCENT_RING}`}
      >
        {fdi}
        {pieza.nota !== '' && (
          <span
            title="Tiene notas"
            className="absolute -right-1 -top-1 h-2 w-2 rounded-full border-[1.5px] border-white bg-[#0b7a87] dark:border-[#162329] dark:bg-[#4cc3d0]"
          />
        )}
      </button>
      <VistaFrontal fdi={fdi} pieza={pieza} onPieza={readOnly ? undefined : onPieza} className="w-full max-w-[58px]" />
      <VistaOclusal
        fdi={fdi}
        pieza={pieza}
        onSuperficie={readOnly ? undefined : onSuperficie}
        idPrefijo="p"
        className="w-[96%] max-w-[56px]"
      />
    </div>
  );
}