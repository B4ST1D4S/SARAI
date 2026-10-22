import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { apiClient } from '../../../../core/api/client';
import { useSubmoduloAutosave } from '../../hooks/useSubmoduloAutosave';
import type { SubmoduloProps } from '../../types/submodulo';
import { SaveStatusBadge } from '../common/SaveStatusBadge';
import { ESTILO_LABEL } from '../common/campos';
import { AdvancedToothCard } from './AdvancedToothCard';
import { BarraHerramientas } from './BarraHerramientas';
import { BORRAR, TITULO_CUADRANTE, ambitoHerramienta, etiquetaHerramienta, type HerramientaId } from './catalogo';
import { FichaPieza } from './FichaPieza';
import { CUADRICULA } from './geometria';
import {
  conEstadoGeneral,
  conObservacion,
  conSuperficie,
  contarPorEstado,
  indexarPosiciones,
  limpiarPieza,
  normalizarOdontograma,
  vistaDePieza,
} from './hallazgos';
import { EstadoPiezaDental, type OdontogramaDataDto, type PiezaDentalDto, type SuperficieDental } from './tipos';

export const ODONTOGRAMA_SUBMODULO_ID = 'odontograma';

const ESCRITURA = { shouldDirty: true, shouldTouch: true } as const;

/** Bordes punteados de línea media y plano oclusal según la posición del cuadrante en la cuadrícula. */
const bordeCuadrante = (i: number): string =>
  [
    'border-dashed border-[#b9c8cd] dark:border-[#33474f]',
    i > 0 ? 'border-t-[1.5px]' : '',
    i === 1 ? 'md:border-l-[1.5px] md:border-t-0' : '',
    i === 3 ? 'md:border-l-[1.5px]' : '',
  ].join(' ');

export const OdontogramaSubmodulo: React.FC<SubmoduloProps<OdontogramaDataDto>> = ({
  folioId,
  // El contrato real (types/submodulo.ts) expone la prop como `defaultValues`.
  defaultValues: datosIniciales,
  readOnly = false,
  onSaveStateChange,
  onRegisterFlush,
}) => {
  const form = useForm<OdontogramaDataDto>({ defaultValues: normalizarOdontograma(datosIniciales) });

  const { status } = useSubmoduloAutosave({
    submoduloId: ODONTOGRAMA_SUBMODULO_ID,
    form,
    saveFn: async (values) => {
      await apiClient.patch(`/clinical-records/folios/${folioId}/seccion/odontograma`, values);
    },
    readOnly,
    onSaveStateChange,
    onRegisterFlush,
  });

  const { control, getValues, setValue, register } = form;
  const piezas = useWatch({ control, name: 'piezas' });

  // `piezas` nunca cambia de longitud ni de orden: el índice de cada FDI es estable.
  const posiciones = useMemo(() => indexarPosiciones(piezas), [piezas]);
  const conteo = useMemo(() => contarPorEstado(piezas), [piezas]);
  const vista = useCallback(
    (fdi: number) => {
      const i = posiciones.get(fdi);
      return vistaDePieza(i === undefined ? undefined : piezas[i]);
    },
    [piezas, posiciones],
  );

  // Estado de interfaz (no clínico): queda local a propósito.
  const [herramienta, setHerramienta] = useState<HerramientaId>(EstadoPiezaDental.CARIES);
  const [aviso, setAviso] = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);

  useEffect(() => {
    if (seleccionada === null) return;
    const alPresionar = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setSeleccionada(null);
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [seleccionada]);

  /* ---------- Escrituras al formulario (única fuente de verdad) ---------- */

  /** Reemplaza `piezas.{i}` con la pieza transformada; el autosave lo detecta vía form.watch. */
  const actualizarPieza = useCallback(
    (fdi: number, transformar: (p: PiezaDentalDto) => PiezaDentalDto) => {
      if (readOnly) return;
      const i = posiciones.get(fdi);
      if (i === undefined) return;
      setValue(`piezas.${i}`, transformar(getValues(`piezas.${i}`)), ESCRITURA);
    },
    [readOnly, posiciones, getValues, setValue],
  );

  const escribirSuperficie = useCallback(
    (fdi: number, superficie: SuperficieDental, estado: EstadoPiezaDental | null) =>
      actualizarPieza(fdi, (p) => conSuperficie(p, superficie, estado)),
    [actualizarPieza],
  );
  const escribirGeneral = useCallback(
    (fdi: number, estado: EstadoPiezaDental | null) => actualizarPieza(fdi, (p) => conEstadoGeneral(p, estado)),
    [actualizarPieza],
  );
  const escribirNota = useCallback(
    (fdi: number, texto: string) => actualizarPieza(fdi, (p) => conObservacion(p, texto)),
    [actualizarPieza],
  );
  const limpiar = useCallback((fdi: number) => actualizarPieza(fdi, limpiarPieza), [actualizarPieza]);

  /* ---------- Clics con la herramienta activa ---------- */

  const alTocarSuperficie = useCallback(
    (fdi: number, superficie: SuperficieDental) => {
      if (ambitoHerramienta(herramienta) === 'pieza') {
        setAviso(`“${etiquetaHerramienta(herramienta)}” se aplica sobre la vista frontal de la pieza, no sobre la vista oclusal.`);
        return;
      }
      const actual = vista(fdi);
      if (actual.general === EstadoPiezaDental.AUSENTE_PERDIDO && herramienta !== BORRAR) {
        setAviso(`La pieza ${fdi} está marcada como ausente. Quita la ausencia para marcar superficies.`);
        return;
      }
      setAviso(null);
      const previo = actual.superficies.get(superficie) ?? null;
      escribirSuperficie(fdi, superficie, herramienta === BORRAR || previo === herramienta ? null : herramienta);
    },
    [herramienta, vista, escribirSuperficie],
  );

  const alTocarPieza = useCallback(
    (fdi: number) => {
      if (ambitoHerramienta(herramienta) === 'superficie') {
        setAviso(`“${etiquetaHerramienta(herramienta)}” se aplica sobre un sector de la vista oclusal, no sobre la vista frontal.`);
        return;
      }
      setAviso(null);
      const previo = vista(fdi).general;
      escribirGeneral(fdi, herramienta === BORRAR || previo === herramienta ? null : herramienta);
    },
    [herramienta, vista, escribirGeneral],
  );

  const alternarFicha = useCallback((fdi: number) => setSeleccionada((s) => (s === fdi ? null : fdi)), []);
  const cambiarHerramienta = useCallback((h: HerramientaId) => {
    setHerramienta(h);
    setAviso(null);
  }, []);

  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate>
      <div
        className={[
          'flex flex-col gap-4 text-sm text-[#17262b] transition-[padding] duration-200 motion-reduce:transition-none dark:text-[#e5edef]',
          seleccionada !== null ? 'pb-[76vh] lg:pb-0 lg:pr-[470px]' : '',
        ].join(' ')}
      >
        <div className="-mb-2 flex min-h-[22px] justify-end">
          <SaveStatusBadge isPending={status === 'saving'} isSuccess={status === 'saved'} isError={status === 'error'} />
        </div>

        {!readOnly && <BarraHerramientas herramienta={herramienta} conteo={conteo} aviso={aviso} onCambiar={cambiarHerramienta} />}

        <section
          aria-label="Odontograma FDI"
          className="grid grid-cols-1 rounded-[10px] border border-[#b9c8cd] bg-[#f6f9f9] [background-image:linear-gradient(#e1e9eb_1px,transparent_1px),linear-gradient(90deg,#e1e9eb_1px,transparent_1px)] [background-size:24px_24px] md:grid-cols-2 dark:border-[#33474f] dark:bg-[#111d21] dark:[background-image:linear-gradient(#1b2b31_1px,transparent_1px),linear-gradient(90deg,#1b2b31_1px,transparent_1px)]"
        >
          {CUADRICULA.map((grupo, i) => (
            <div key={grupo.cuadrante} className={`flex min-w-0 flex-col gap-2.5 px-2.5 pb-4 pt-3.5 ${bordeCuadrante(i)}`}>
              <h3 className="text-center font-mono text-[11px] font-medium uppercase tracking-[.1em] text-[#566a71] dark:text-[#93a7ae]">
                {TITULO_CUADRANTE[grupo.cuadrante]}
              </h3>
              <div className="grid grid-cols-8 gap-0.5 md:gap-1">
                {grupo.piezas.map((fdi) => (
                  <AdvancedToothCard
                    key={fdi}
                    fdi={fdi}
                    pieza={vista(fdi)}
                    seleccionada={seleccionada === fdi}
                    readOnly={readOnly}
                    onPieza={alTocarPieza}
                    onSuperficie={alTocarSuperficie}
                    onAbrirFicha={alternarFicha}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>

        <fieldset disabled={readOnly} className="m-0 min-w-0 border-0 p-0">
          <label className="flex flex-col gap-1">
            <span className={ESTILO_LABEL}>Observaciones generales</span>
            <textarea
              {...register('observaciones')}
              rows={3}
              placeholder="Higiene oral, oclusión, tejidos blandos…"
              className="w-full resize-y rounded-md border border-[#b9c8cd] bg-white px-2.5 py-2 text-sm disabled:opacity-60 dark:border-[#33474f] dark:bg-[#162329]"
            />
          </label>
        </fieldset>

        {seleccionada !== null && (
          <FichaPieza
            fdi={seleccionada}
            pieza={vista(seleccionada)}
            herramienta={herramienta}
            readOnly={readOnly}
            onPieza={alTocarPieza}
            onSuperficie={alTocarSuperficie}
            onFijarSuperficie={escribirSuperficie}
            onFijarGeneral={escribirGeneral}
            onNota={escribirNota}
            onLimpiar={limpiar}
            onNavegar={setSeleccionada}
            onCerrar={() => setSeleccionada(null)}
          />
        )}
      </div>
    </form>
  );
};
