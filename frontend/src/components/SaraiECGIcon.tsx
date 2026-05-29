/**
 * SaraiECGIcon v3 — fiel a imagen de referencia
 *
 * Proporciones clave (medidas de la imagen):
 *   - Spikes ECG: ~3× más altos que las letras
 *   - Letras pequeñas y compactas, centradas en baseline
 *   - Múltiples complejos QRS en cada lado (ICU style)
 *   - 3 arcos de sonido por lado
 *   - Círculo grande con micrófono retro
 *
 * ViewBox: 900×200   Baseline: y=100
 * Letra span: y=68→132 (64px)
 * Spike span: y=4→196  (192px)  → 3× letras
 */

import { motion } from 'framer-motion';

export interface SaraiECGIconProps {
  color?: string;
  width?: number;
  speed?: 'idle' | 'active' | 'fast';
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

const FX = 'sarai-ecg-v3';

export default function SaraiECGIcon({
  color     = '#00f5ff',
  width,
  speed     = 'idle',
  pulse     = false,
  className = '',
  style,
  title,
}: SaraiECGIconProps) {
  const dur = speed === 'fast' ? 0.5 : speed === 'active' ? 1.0 : 2.8;
  const SW  = 2.6;
  const SWT = 1.6;

  // Si no se pasa width explícito → ocupa el 100% del contenedor (responsive)
  const svgWidth  = width ?? '100%';
  const svgHeight = width ? Math.round(width * 200 / 900) : undefined;

  return (
    <svg
      viewBox="0 0 900 200"
      width={svgWidth}
      height={svgHeight ?? undefined}
      style={{ display: 'block', ...style }}
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}

      <defs>
        <filter id={`${FX}-g`} x="-15%" y="-90%" width="130%" height="280%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4"  result="b1"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="9"  result="b2"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="1"  result="b0"/>
          <feMerge>
            <feMergeNode in="b2"/>
            <feMergeNode in="b1"/>
            <feMergeNode in="b0"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id={`${FX}-s`} x="-50%" y="-150%" width="200%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="sb"/>
          <feMerge>
            <feMergeNode in="sb"/>
            <feMergeNode in="sb"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <motion.g
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={`url(#${FX}-g)`}
        animate={{ opacity: [0.80, 1, 0.80] }}
        transition={{ repeat: Infinity, duration: dur, ease: 'easeInOut' }}
      >

        {/* ═══ BASELINE CONTINUA (y=100) ═══
            Conecta todos los elementos. Los paths se superponen a ella. */}
        <path strokeWidth={SW} d="M 0,100 L 900,100"/>

        {/* ═══ ECG IZQUIERDO — dos complejos QRS ═══
            Primer QRS más pequeño (x 0–55), segundo más alto (x 55–115) */}
        <motion.path
          strokeWidth={SW + 0.4}
          filter={`url(#${FX}-s)`}
          d="
            M 0,100 L 14,100
            L 19,82 L 24,100
            L 36,100
            L 42,4 L 54,196 L 62,100
            L 76,100
            L 81,68 L 88,132 L 94,100
            L 110,100
          "
          animate={pulse ? { opacity: [0.65, 1, 0.65] } : {}}
          transition={pulse ? { repeat: Infinity, duration: dur * 0.5 } : {}}
        />

        {/* ═══ LETRA S (x 114–174) — centrada en y=100 ═══
            Dos arcos iguales, endpoints en y=100 (izq y der) */}
        <path strokeWidth={SW} d="
          M 174,100
          C 174,68  114,68  114,84
          C 114,100 174,100 174,116
          C 174,132 114,132 114,100
        "/>

        {/* ═══ LETRA A izquierda (x 181–232) ═══ */}
        <path strokeWidth={SW} d="M 181,132 L 206,68 L 232,132"/>
        <path strokeWidth={SW} d="M 189,108 L 224,108"/>

        {/* ═══ LETRA R (x 240–306) ═══ */}
        <path strokeWidth={SW} d="M 240,132 L 240,68"/>
        <path strokeWidth={SW} d="M 240,68 L 270,68 C 307,68 307,104 270,104 L 240,104"/>
        <path strokeWidth={SW} d="M 270,104 L 306,132"/>

        {/* ═══ ARCOS SONIDO IZQUIERDA ((( ═══
            3 arcos abriendo a la izquierda (como paréntesis "(")
            Posición: entre letra R y círculo */}
        <motion.path strokeWidth={SW}
          d="M 344,58 C 324,76 324,124 344,142"
          animate={{ opacity: [0.40, 1, 0.40] }}
          transition={{ repeat: Infinity, duration: dur, delay: dur * 0.3, ease: 'easeInOut' }}
        />
        <motion.path strokeWidth={SW}
          d="M 354,67 C 338,83 338,117 354,133"
          animate={{ opacity: [0.60, 1, 0.60] }}
          transition={{ repeat: Infinity, duration: dur, delay: dur * 0.15, ease: 'easeInOut' }}
        />
        <motion.path strokeWidth={SW}
          d="M 364,76 C 352,89 352,111 364,124"
          animate={{ opacity: [0.80, 1, 0.80] }}
          transition={{ repeat: Infinity, duration: dur, ease: 'easeInOut' }}
        />

        {/* ═══ CÍRCULO CENTRAL (cx=430 cy=100 r=60) ═══ */}
        <circle cx="430" cy="100" r="60" strokeWidth={SW}/>

        {/* ═══ MICRÓFONO RETRO ═══ */}
        {/* Cápsula */}
        <rect x="418" y="64" width="24" height="52" rx="12" strokeWidth={SW - 0.3}/>
        {/* Rejilla (5 líneas horizontales) */}
        <path strokeWidth={SWT} opacity="0.9" d="M 421,72  L 441,72"/>
        <path strokeWidth={SWT} opacity="0.9" d="M 421,79  L 441,79"/>
        <path strokeWidth={SWT} opacity="0.9" d="M 421,86  L 441,86"/>
        <path strokeWidth={SWT} opacity="0.9" d="M 421,93  L 441,93"/>
        <path strokeWidth={SWT} opacity="0.9" d="M 421,100 L 441,100"/>
        {/* Stand / soporte */}
        <path strokeWidth={SW - 0.3} d="M 410,116 C 410,138 450,138 450,116"/>
        {/* Vástago */}
        <path strokeWidth={SW - 0.3} d="M 430,138 L 430,146"/>
        {/* Base */}
        <path strokeWidth={SW - 0.3} d="M 419,146 L 441,146"/>

        {/* ═══ ARCOS SONIDO DERECHA ))) ═══ */}
        <motion.path strokeWidth={SW}
          d="M 496,76 C 508,89 508,111 496,124"
          animate={{ opacity: [0.80, 1, 0.80] }}
          transition={{ repeat: Infinity, duration: dur, ease: 'easeInOut' }}
        />
        <motion.path strokeWidth={SW}
          d="M 506,67 C 522,83 522,117 506,133"
          animate={{ opacity: [0.60, 1, 0.60] }}
          transition={{ repeat: Infinity, duration: dur, delay: dur * 0.15, ease: 'easeInOut' }}
        />
        <motion.path strokeWidth={SW}
          d="M 516,58 C 536,76 536,124 516,142"
          animate={{ opacity: [0.40, 1, 0.40] }}
          transition={{ repeat: Infinity, duration: dur, delay: dur * 0.3, ease: 'easeInOut' }}
        />

        {/* ═══ LETRA A derecha (x 544–598) ═══ */}
        <path strokeWidth={SW} d="M 544,132 L 571,68 L 598,132"/>
        <path strokeWidth={SW} d="M 552,108 L 590,108"/>

        {/* ═══ LETRA I (x 606–658) — serifs arriba y abajo ═══ */}
        <path strokeWidth={SW} d="M 606,68  L 658,68"/>   {/* barra superior */}
        <path strokeWidth={SW} d="M 632,68  L 632,132"/>  {/* vástago */}
        <path strokeWidth={SW} d="M 606,132 L 658,132"/>  {/* barra inferior */}

        {/* ═══ ECG DERECHO — dos complejos QRS ═══
            Primer más pequeño (x 660–730), segundo más alto (x 730–800), cola (800–900) */}
        <motion.path
          strokeWidth={SW + 0.4}
          filter={`url(#${FX}-s)`}
          d="
            M 660,100 L 672,100
            L 677,68 L 684,132 L 690,100
            L 704,100
            L 710,4 L 722,196 L 730,100
            L 744,100
            L 749,82 L 754,100
            L 900,100
          "
          animate={pulse ? { opacity: [0.65, 1, 0.65] } : {}}
          transition={pulse ? { repeat: Infinity, duration: dur * 0.5, delay: 0.25 } : {}}
        />

      </motion.g>
    </svg>
  );
}
