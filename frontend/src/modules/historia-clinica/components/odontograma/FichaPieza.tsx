import { useId } from 'react';
import { ChevronLeft, ChevronRight, StickyNote, Trash2, X } from 'lucide-react';
import { VistaFrontal, VistaOclusal } from './AdvancedToothCard';
import {
  DEFINICIONES,
  ESTADOS_PIEZA,
  ESTADOS_SUPERFICIE,
  descripcionSuperficie,
  etiquetaHerramienta,
  nombrePieza,
  nombreSuperficie,
  superficieDeCara,
  type DefinicionEstado,
  type HerramientaId,
} from './catalogo';
import { CARAS, ORDEN_CUADRICULA } from './geometria';
import type { VistaPieza } from './hallazgos';
import { EstadoPiezaDental, type SuperficieDental } from './tipos';

const ACCENT_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b7a87] dark:focus-visible:outline-[#4cc3d0]';
const BOTON_ICONO = `inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#b9c8cd] text-[#566a71] hover:border-[#0b7a87] hover:text-[#0b7a87] disabled:opacity-40 dark:border-[#33474f] dark:text-[#93a7ae] dark:hover:border-[#4cc3d0] dark:hover:text-[#4cc3d0] ${ACCENT_RING}`;
const SELECT =
  'w-full rounded-md border border-[#b9c8cd] bg-white px-2 py-1.5 text-xs text-[#17262b] disabled:opacity-60 dark:border-[#33474f] dark:bg-[#162329] dark:text-[#e5edef]';
const SANA = '';

export interface FichaPiezaProps {
  fdi: number;
  pieza: VistaPieza;
  herramienta: HerramientaId;
  readOnly: boolean;
  onPieza: (fdi: number) => void;
  onSuperficie: (fdi: number, superficie: SuperficieDental) => void;
  onFijarSuperficie: (fdi: number, superficie: SuperficieDental, estado: EstadoPiezaDental | null) => void;
  onFijarGeneral: (fdi: number, estado: EstadoPiezaDental | null) => void;
  onNota: (fdi: number, texto: string) => void;
  onLimpiar: (fdi: number) => void;
  onNavegar: (fdi: number) => void;
  onCerrar: () => void;
}

/** Opciones de un selector; si el valor guardado no está en el catálogo (p. ej. ENDODONCIA) se muestra igual. */
function OpcionesEstado({ estados, actual }: { estados: readonly DefinicionEstado[]; actual: EstadoPiezaDental | null }) {
  const fueraDeCatalogo = actual !== null && !estados.some((d) => d.estado === actual);
  return (
    <>
      <option value={SANA}>Sana</option>
      {estados.map((d) => (
        <option key={d.estado} value={d.estado}>
          {d.etiqueta}
        </option>
      ))}
      {fueraDeCatalogo && <option value={actual}>{DEFINICIONES.get(actual)?.etiqueta ?? actual}</option>}
    </>
  );
}

const leerEstado = (valor: string): EstadoPiezaDental | null => (valor === SANA ? null : (valor as EstadoPiezaDental));

export function FichaPieza({
  fdi,
  pieza,
  herramienta,
  readOnly,
  onPieza,
  onSuperficie,
  onFijarSuperficie,
  onFijarGeneral,
  onNota,
  onLimpiar,
  onNavegar,
  onCerrar,
}: FichaPiezaProps) {
  const idTitulo = useId();
  const idNota = useId();
  const posicion = ORDEN_CUADRICULA.indexOf(fdi);
  const anterior = posicion > 0 ? ORDEN_CUADRICULA[posicion - 1] : null;
  const siguiente = posicion >= 0 && posicion < ORDEN_CUADRICULA.length - 1 ? ORDEN_CUADRICULA[posicion + 1] : null;
  const ausente = pieza.general === EstadoPiezaDental.AUSENTE_PERDIDO;
  const sinHallazgos = pieza.general === null && pieza.superficies.size === 0;

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby={idTitulo}
      className="fixed inset-x-0 bottom-0 z-40 flex max-h-[74vh] flex-col overflow-hidden rounded-t-2xl border border-[#b9c8cd] bg-white shadow-2xl lg:inset-x-auto lg:bottom-4 lg:right-4 lg:top-4 lg:max-h-none lg:w-[450px] lg:rounded-2xl dark:border-[#33474f] dark:bg-[#111d21]"
    >
      <header className="flex items-center gap-2 border-b border-[#e1e9eb] px-4 py-3 dark:border-[#1b2b31]">
        <button
          type="button"
          className={BOTON_ICONO}
          disabled={anterior === null}
          onClick={() => anterior !== null && onNavegar(anterior)}
          aria-label="Pieza anterior"
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <h3 id={idTitulo} className="font-mono text-base font-semibold tabular-nums">
            Pieza {fdi}
          </h3>
          <p className="truncate text-xs text-[#566a71] dark:text-[#93a7ae]">{nombrePieza(fdi)}</p>
        </div>
        <button
          type="button"
          className={BOTON_ICONO}
          disabled={siguiente === null}
          onClick={() => siguiente !== null && onNavegar(siguiente)}
          aria-label="Pieza siguiente"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
        <button type="button" className={BOTON_ICONO} onClick={onCerrar} aria-label="Cerrar ficha">
          <X size={16} aria-hidden />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-end justify-center gap-6">
          <VistaFrontal fdi={fdi} pieza={pieza} onPieza={readOnly ? undefined : onPieza} className="w-[72px]" />
          <VistaOclusal
            fdi={fdi}
            pieza={pieza}
            onSuperficie={readOnly ? undefined : onSuperficie}
            ampliada
            idPrefijo="ficha-"
            className="w-[190px]"
          />
        </div>
        {!readOnly && (
          <p className="mt-2 text-center text-[11px] text-[#566a71] dark:text-[#93a7ae]">
            Herramienta activa: <strong>{etiquetaHerramienta(herramienta)}</strong>
          </p>
        )}

        <fieldset disabled={readOnly} className="m-0 mt-4 flex min-w-0 flex-col gap-4 border-0 p-0">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#566a71] dark:text-[#93a7ae]">
              Estado general de la pieza
            </span>
            <select
              className={SELECT}
              value={pieza.general ?? SANA}
              onChange={(e) => onFijarGeneral(fdi, leerEstado(e.target.value))}
            >
              <OpcionesEstado estados={ESTADOS_PIEZA} actual={pieza.general} />
            </select>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#566a71] dark:text-[#93a7ae]">
              Superficies
            </span>
            {ausente && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Pieza ausente: quita la ausencia para registrar hallazgos de superficie.
              </p>
            )}
            <ul className="flex flex-col divide-y divide-[#e1e9eb] rounded-md border border-[#e1e9eb] dark:divide-[#1b2b31] dark:border-[#1b2b31]">
              {CARAS.map((cara) => {
                const sup = superficieDeCara(cara, fdi);
                const estado = pieza.superficies.get(sup) ?? null;
                return (
                  <li key={cara} className="grid grid-cols-[1fr_150px] items-center gap-2 px-2.5 py-1.5">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">{nombreSuperficie(sup)}</p>
                      <p className="truncate text-[11px] text-[#566a71] dark:text-[#93a7ae]">{descripcionSuperficie(sup)}</p>
                    </div>
                    <select
                      className={SELECT}
                      aria-label={`Estado de la superficie ${nombreSuperficie(sup)}`}
                      value={estado ?? SANA}
                      disabled={ausente && estado === null}
                      onChange={(e) => onFijarSuperficie(fdi, sup, leerEstado(e.target.value))}
                    >
                      <OpcionesEstado estados={ESTADOS_SUPERFICIE} actual={estado} />
                    </select>
                  </li>
                );
              })}
            </ul>
          </div>

          <label htmlFor={idNota} className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#566a71] dark:text-[#93a7ae]">
              <StickyNote size={12} aria-hidden /> Observación de la pieza
            </span>
            <textarea
              id={idNota}
              rows={3}
              value={pieza.nota}
              onChange={(e) => onNota(fdi, e.target.value)}
              placeholder="Movilidad, sensibilidad, recesión…"
              className={`${SELECT} resize-y`}
            />
          </label>

          {!readOnly && (
            <button
              type="button"
              disabled={sinHallazgos}
              onClick={() => onLimpiar(fdi)}
              className={`inline-flex items-center justify-center gap-1.5 self-start rounded-md border border-rose-300 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40 ${ACCENT_RING}`}
            >
              <Trash2 size={13} aria-hidden /> Marcar pieza como sana
            </button>
          )}
        </fieldset>
      </div>
    </aside>
  );
}
