import { Eraser, Info, Layers, Square } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BORRAR, ESTADOS_PIEZA, ESTADOS_SUPERFICIE, type DefinicionEstado, type HerramientaId } from './catalogo';
import type { EstadoPiezaDental } from './tipos';

const ACCENT_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b7a87] dark:focus-visible:outline-[#4cc3d0]';

const BOTON_BASE =
  'inline-flex min-h-[32px] items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors motion-reduce:transition-none';
const BOTON_INACTIVO =
  'border-[#b9c8cd] bg-white text-[#17262b] hover:border-[#0b7a87] dark:border-[#33474f] dark:bg-[#162329] dark:text-[#e5edef] dark:hover:border-[#4cc3d0]';
const BOTON_ACTIVO =
  'border-[#0b7a87] bg-[#0b7a87]/10 text-[#0b7a87] ring-1 ring-[#0b7a87] dark:border-[#4cc3d0] dark:bg-[#4cc3d0]/10 dark:text-[#4cc3d0] dark:ring-[#4cc3d0]';

export interface BarraHerramientasProps {
  herramienta: HerramientaId;
  conteo: ReadonlyMap<EstadoPiezaDental, number>;
  /** Mensaje cuando la herramienta no aplica sobre lo que se tocó. */
  aviso: string | null;
  onCambiar: (h: HerramientaId) => void;
}

interface GrupoProps {
  titulo: string;
  icono: LucideIcon;
  estados: readonly DefinicionEstado[];
  herramienta: HerramientaId;
  conteo: ReadonlyMap<EstadoPiezaDental, number>;
  onCambiar: (h: HerramientaId) => void;
}

function GrupoHerramientas({ titulo, icono: Icono, estados, herramienta, conteo, onCambiar }: GrupoProps) {
  return (
    <div role="group" aria-label={titulo} className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#566a71] dark:text-[#93a7ae]">
        <Icono size={12} aria-hidden /> {titulo}
      </span>
      {estados.map((d) => {
        const activa = herramienta === d.estado;
        const n = conteo.get(d.estado) ?? 0;
        return (
          <button
            key={d.estado}
            type="button"
            aria-pressed={activa}
            onClick={() => onCambiar(d.estado)}
            className={`${BOTON_BASE} ${activa ? BOTON_ACTIVO : BOTON_INACTIVO} ${ACCENT_RING}`}
          >
            <span aria-hidden className={`h-3 w-3 rounded-sm ${d.bg}`} />
            {d.etiqueta}
            {n > 0 && (
              <span className={`min-w-[18px] rounded-full px-1 text-center font-mono text-[10px] tabular-nums ${d.bg} ${d.textoSobreColor}`}>
                {n}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function BarraHerramientas({ herramienta, conteo, aviso, onCambiar }: BarraHerramientasProps) {
  return (
    <div className="flex flex-col gap-2">
      <div
        role="toolbar"
        aria-label="Herramientas del odontograma"
        className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[10px] border border-[#b9c8cd] bg-white px-3 py-2 dark:border-[#33474f] dark:bg-[#111d21]"
      >
        <GrupoHerramientas
          titulo="Superficie"
          icono={Layers}
          estados={ESTADOS_SUPERFICIE}
          herramienta={herramienta}
          conteo={conteo}
          onCambiar={onCambiar}
        />
        <GrupoHerramientas
          titulo="Pieza"
          icono={Square}
          estados={ESTADOS_PIEZA}
          herramienta={herramienta}
          conteo={conteo}
          onCambiar={onCambiar}
        />
        <button
          type="button"
          aria-pressed={herramienta === BORRAR}
          onClick={() => onCambiar(BORRAR)}
          className={`${BOTON_BASE} ${herramienta === BORRAR ? BOTON_ACTIVO : BOTON_INACTIVO} ${ACCENT_RING} md:ml-auto`}
        >
          <Eraser size={14} aria-hidden /> Borrar
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`flex min-h-[20px] items-center gap-1.5 text-xs ${aviso ? 'text-amber-700 dark:text-amber-300' : 'text-[#566a71] dark:text-[#93a7ae]'}`}
      >
        <Info size={13} aria-hidden className="shrink-0" />
        {aviso ??
          'Los estados de superficie se marcan en la vista oclusal; los de pieza completa, en la vista frontal. Tocar de nuevo con la misma herramienta quita el hallazgo.'}
      </p>
    </div>
  );
}
