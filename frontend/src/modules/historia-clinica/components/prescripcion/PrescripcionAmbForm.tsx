import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, AlertCircle, Calculator, Info } from 'lucide-react';
import { apiClient } from '../../../../core/api/client';
import { CatalogoAutocomplete } from '../../../../core/ui/CatalogoAutocomplete';
import { useSubmoduloAutosave } from '../../hooks/useSubmoduloAutosave';
import { SaveStatusBadge } from '../common/SaveStatusBadge';
import type { SubmoduloProps } from '../../types/submodulo';
import type { ItemPrescripcionAmb, ViaAdministracion } from './types';
import {
  ESTILO_ALERTA,
  buscarDiagnosticos,
  buscarMoldes,
  calcularCantidadDispensar,
  mensajeError,
  modoDeFila,
  textoDiagnostico,
  volumenTratamiento,
  type AlertaCdss,
  type DiagnosticoCie,
  type ModoCalculoCantidad,
  type MoldePrescribible,
  type RespuestaGuardado,
} from './compartido';

/** Una fila del formulario: compatible con ItemPrescripcionAmb y con el PUT /clinical-records/folios/:id/prescripciones. */
export interface PrescripcionFila {
  /** Molde genérico prescrito (inv_catalogo_clinico.id). */
  catalogoClinicoId: string;
  /** Descripción genérica del molde, para mostrar. */
  nombreGenerico: string;
  principioActivo?: string;
  concentracion?: string;
  /** Heredada del molde: es la unidad de la dosis en las formas no líquidas (no la elige el médico). */
  formaFarmaceuticaCodigo?: string;
  formaFarmaceutica?: string;
  /** Cómo se obtiene la cantidad: DISCRETA (se calcula), LIQUIDA (volumen calculado, envases del médico) o criterio médico. */
  modoCalculoCantidad?: ModoCalculoCantidad;
  formaDiscreta?: boolean;
  /** Unidad de la dosis en una líquida clasificada (mL). */
  unidadVolumen?: string | null;
  viasPermitidas?: ViaAdministracion[];
  ambitoAtencion: 'AMBULATORIO' | 'INTRAHOSPITALARIO';
  /** En unidades de la forma farmacéutica (1 tableta, 5 de jarabe...). */
  dosisCantidad: number | '';
  /** Código de la forma farmacéutica. El servidor lo deriva del medicamento; no se envía. */
  dosisUnidad: string;
  viaAdministracionCodigo: string;
  frecuenciaIntervalo: number | '';
  frecuenciaUnidad: 'HORAS' | 'DIAS';
  duracionTratamientoDias: number | '';
  /** Solo se usa si la forma NO es discreta (en una líquida: envases); si lo es, manda el cálculo. */
  cantidadTotalDispensar: number | '';
  diagnosticoAsociadoCie: string;
  diagnosticoAsociadoDescripcion?: string;
  indicacionesPaciente: string;
  // Aliases para ItemPrescripcionAmb
  diasTratamiento?: number | '';
  cantidadDispensar?: number | '';
  indicaciones?: string;
}

export const FILA_VACIA: PrescripcionFila = {
  catalogoClinicoId: '',
  nombreGenerico: '',
  principioActivo: '',
  concentracion: '',
  formaFarmaceuticaCodigo: '',
  formaFarmaceutica: '',
  modoCalculoCantidad: 'CRITERIO_MEDICO',
  formaDiscreta: false,
  unidadVolumen: null,
  viasPermitidas: [],
  ambitoAtencion: 'AMBULATORIO',
  dosisCantidad: '',
  dosisUnidad: '',
  viaAdministracionCodigo: '',
  frecuenciaIntervalo: 8,
  frecuenciaUnidad: 'HORAS',
  duracionTratamientoDias: '',
  cantidadTotalDispensar: '',
  diagnosticoAsociadoCie: '',
  diagnosticoAsociadoDescripcion: '',
  indicacionesPaciente: '',
};

const positivo = (v: number | '' | undefined) => typeof v === 'number' && Number.isFinite(v) && v > 0;

/**
 * Cantidad que se enviará: la calculada si la forma es discreta; la del médico
 * si no. En una líquida clasificada se calcula el VOLUMEN (volumenTratamiento)
 * y los envases los indica el médico: la fórmula va por molde, sin
 * presentación comercial, así que no se conoce el contenido del frasco. En las
 * demás no discretas (crema, sin clasificar), criterio médico.
 */
export function cantidadDeFila(f: PrescripcionFila): number | '' {
  if (modoDeFila(f) === 'DISCRETA') {
    return calcularCantidadDispensar(f.dosisCantidad, f.frecuenciaIntervalo, f.frecuenciaUnidad, f.duracionTratamientoDias ?? f.diasTratamiento);
  }
  return f.cantidadTotalDispensar ?? f.cantidadDispensar ?? '';
}

/** Una fila está lista para guardar si tiene todos los campos obligatorios. */
export function filaCompleta(f: PrescripcionFila): boolean {
  const duracion = f.duracionTratamientoDias ?? f.diasTratamiento;
  return Boolean(
    f.catalogoClinicoId &&
    f.viaAdministracionCodigo &&
    f.diagnosticoAsociadoCie?.trim() &&
    positivo(f.dosisCantidad) &&
    positivo(f.frecuenciaIntervalo) &&
    positivo(duracion) &&
    positivo(cantidadDeFila(f))
  );
}

/**
 * Cuerpo del PUT (?ambito=AMBULATORIO). El servidor REEMPLAZA las prescripciones
 * ambulatorias del folio con esta lista. Solo el molde: nunca articuloId (el
 * servidor lo rechaza en este ámbito).
 */
export function cuerpoGuardado(filas: PrescripcionFila[]) {
  return {
    prescripciones: filas.map((f) => {
      const duracion = Number(f.duracionTratamientoDias ?? f.diasTratamiento);
      const indicaciones = (f.indicacionesPaciente ?? f.indicaciones ?? '').trim();

      return {
        catalogoClinicoId: f.catalogoClinicoId,
        ambitoAtencion: f.ambitoAtencion || 'AMBULATORIO',
        dosisCantidad: Number(f.dosisCantidad),
        viaAdministracionCodigo: f.viaAdministracionCodigo,
        frecuenciaIntervalo: Number(f.frecuenciaIntervalo),
        frecuenciaUnidad: f.frecuenciaUnidad,
        duracionTratamientoDias: duracion,
        cantidadTotalDispensar: Number(cantidadDeFila(f)),
        diagnosticoAsociadoCie: f.diagnosticoAsociadoCie.trim().toUpperCase(),
        ...(indicaciones ? { indicacionesPaciente: indicaciones } : {}),
      };
    }),
  };
}

/** Campos de la fila que vienen del molde elegido (o se vacían al deselegirlo). */
export function camposDelMolde(m: MoldePrescribible | null, viaActual = ''): Partial<PrescripcionFila> {
  if (!m) {
    return {
      catalogoClinicoId: '', nombreGenerico: '', principioActivo: '', concentracion: '', formaFarmaceuticaCodigo: '',
      formaFarmaceutica: '', modoCalculoCantidad: 'CRITERIO_MEDICO', formaDiscreta: false, unidadVolumen: null, viasPermitidas: [],
      dosisUnidad: '', viaAdministracionCodigo: '', cantidadTotalDispensar: '',
    };
  }
  const vias = m.viasPermitidas ?? [];
  const via = vias.length === 1 ? vias[0].codigo : vias.some((v) => v.codigo === viaActual) ? viaActual : '';
  const liquida = m.modoCalculoCantidad === 'LIQUIDA';
  return {
    catalogoClinicoId: m.id,
    nombreGenerico: m.nombre,
    principioActivo: m.principioActivo,
    concentracion: m.concentracion,
    formaFarmaceuticaCodigo: m.formaFarmaceuticaCodigo ?? '',
    formaFarmaceutica: m.formaFarmaceutica,
    modoCalculoCantidad: m.modoCalculoCantidad,
    formaDiscreta: m.modoCalculoCantidad === 'DISCRETA',
    unidadVolumen: liquida ? m.unidadVolumen : null,
    viasPermitidas: vias,
    // La unidad de la dosis la fija el servidor igual: mL en una líquida, la forma en las demás.
    dosisUnidad: (liquida ? m.unidadVolumen : m.formaFarmaceuticaCodigo) ?? '',
    viaAdministracionCodigo: via,
    // Otra forma: la cantidad anterior ya no aplica (la calculada se recalcula; la manual se vuelve a indicar).
    cantidadTotalDispensar: '',
  };
}

export interface PrescripcionAmbFormProps extends SubmoduloProps<Partial<PrescripcionFila | ItemPrescripcionAmb>[]> {
  onSave?: (items: ItemPrescripcionAmb[]) => void;
}

/**
 * Formulario de Prescripción Médica Ambulatoria (Dispensación Farmacia).
 *
 * El medicamento se busca en el catálogo de farmacia; de él se heredan la forma
 * farmacéutica (unidad de la dosis) y las vías permitidas. La cantidad a
 * dispensar se calcula sola si la forma es discreta; si no, la indica el médico.
 */
export const PRESCRIPCION_AMB_SUBMODULO_ID = 'prescripcion';

export function PrescripcionAmbForm({
  folioId,
  defaultValues,
  onSave,
  readOnly = false,
  onSaveStateChange,
}: PrescripcionAmbFormProps) {
  // El workspace mezcla ámbitos: aquí solo las ambulatorias (o sin ámbito, legado).
  const ambulatorias = Array.isArray(defaultValues)
    ? defaultValues.filter((p) => (p as any).ambitoAtencion === 'AMBULATORIO' || !(p as any).ambitoAtencion)
    : [];
  const iniciales = ambulatorias.length
    ? ambulatorias.map((p) => {
        const duracion = (p as any).duracionTratamientoDias ?? (p as any).diasTratamiento ?? '';
        const cantidad = (p as any).cantidadTotalDispensar ?? (p as any).cantidadDispensar ?? '';
        const indicaciones = (p as any).indicacionesPaciente ?? (p as any).indicaciones ?? '';
        // GET de prescripciones: trae el molde (catalogoClinicoId NOT NULL desde la 034) y su modo de cálculo.
        const modo = modoDeFila(p as PrescripcionFila);
        return {
          ...FILA_VACIA,
          ...p,
          catalogoClinicoId: (p as any).catalogoClinicoId || '',
          nombreGenerico: (p as any).nombreGenerico || (p as any).nombreComercial || '',
          modoCalculoCantidad: modo,
          unidadVolumen: modo === 'LIQUIDA' ? ((p as any).dosisUnidad ?? null) : null,
          duracionTratamientoDias: duracion,
          cantidadTotalDispensar: cantidad,
          indicacionesPaciente: indicaciones ?? '',
          viasPermitidas: (p as any).viasPermitidas ?? [],
          formaDiscreta: modo === 'DISCRETA',
          ambitoAtencion: 'AMBULATORIO' as const,
        };
      })
    : [{ ...FILA_VACIA }];

  const form = useForm<{ medicamentos: PrescripcionFila[] }>({
    defaultValues: { medicamentos: iniciales as PrescripcionFila[] },
  });
  const { register, control, setValue, watch } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'medicamentos' });

  /** Lo que el médico está escribiendo en cada buscador (por fila); sin entrada, se muestra lo elegido. */
  const [textos, setTextos] = useState<Record<string, { medicamento?: string; diagnostico?: string }>>({});
  const escribir = (id: string, campo: 'medicamento' | 'diagnostico', texto: string | undefined) =>
    setTextos((t) => ({ ...t, [id]: { ...t[id], [campo]: texto } }));

  const [alertasCdss, setAlertasCdss] = useState<AlertaCdss[]>([]);

  /**
   * Guarda con debounce cualquier cambio (también append/remove). Solo se envían
   * las filas completas: las incompletas no bloquean el guardado del resto y se
   * envían cuando el médico las termina.
   */
  const { status, error } = useSubmoduloAutosave({
    submoduloId: PRESCRIPCION_AMB_SUBMODULO_ID,
    form,
    readOnly,
    onSaveStateChange,
    saveFn: async (values) => {
      const filas = (values.medicamentos ?? []).filter(filaCompleta);
      const res = await apiClient.put<RespuestaGuardado>(`/clinical-records/folios/${folioId}/prescripciones`, cuerpoGuardado(filas), {
        params: { ambito: 'AMBULATORIO' },
      });
      setAlertasCdss(Array.isArray(res.data?.alertasCdss) ? res.data.alertasCdss : []);
      if (onSave) {
        const mappedAmb: ItemPrescripcionAmb[] = filas.map((f) => ({
          // Por molde: sin presentación comercial ni CUM.
          id: f.catalogoClinicoId,
          cum: '',
          principioActivo: f.principioActivo || f.nombreGenerico,
          concentracion: f.concentracion || '',
          formaFarmaceutica: f.formaFarmaceutica || '',
          nombreComercial: f.nombreGenerico,
          diasTratamiento: Number(f.duracionTratamientoDias || f.diasTratamiento || 0),
          cantidadDispensar: Number(cantidadDeFila(f) || 0),
          indicaciones: (f.indicacionesPaciente || f.indicaciones || '').trim(),
          dosisCantidad: f.dosisCantidad,
          dosisUnidad: (modoDeFila(f) === 'LIQUIDA' ? f.unidadVolumen : f.formaFarmaceuticaCodigo) || f.dosisUnidad,
          viaAdministracionCodigo: f.viaAdministracionCodigo,
          frecuenciaIntervalo: f.frecuenciaIntervalo,
          frecuenciaUnidad: f.frecuenciaUnidad,
          diagnosticoAsociadoCie: f.diagnosticoAsociadoCie,
        }));
        onSave(mappedAmb);
      }
    },
  });

  const aplicar = (index: number, campos: Partial<PrescripcionFila>) => {
    for (const [k, v] of Object.entries(campos)) {
      setValue(`medicamentos.${index}.${k}` as any, v as any, { shouldDirty: true });
    }
  };

  const filas = watch('medicamentos');
  const hayIncompletas = !readOnly && status !== 'idle' && (filas ?? []).some((f) => !filaCompleta(f));
  const entrada =
    'w-full h-9 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500';
  const soloLectura =
    'h-9 px-2 flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300';

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
      <div className="flex items-center justify-between h-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            Prescripción Ambulatoria (Farmacia)
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Fórmula médica para entrega externa al paciente
          </span>
        </div>

        <SaveStatusBadge isPending={status === 'saving'} isSuccess={status === 'saved'} isError={status === 'error'} />
      </div>

      {status === 'error' && error && (
        <div role="alert" className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          <AlertCircle size={12} /> {mensajeError(error)}
        </div>
      )}
      {hayIncompletas && (
        <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          Los medicamentos con campos obligatorios sin completar no se guardan hasta completarlos.
        </p>
      )}

      {alertasCdss.length > 0 && (
        <div className="space-y-2" aria-label="Alertas de seguridad del medicamento">
          {alertasCdss.map((a, i) => (
            <div key={`${a.sustancia}-${a.medicamento}-${i}`} role="alert" className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${ESTILO_ALERTA[a.severidad]}`}>
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>
                <span className="font-bold uppercase text-[10px] mr-1.5">Alergia · {a.severidad}</span>
                {a.mensaje}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* fieldset disabled: en solo lectura bloquea buscadores, posología e indicaciones a la vez. */}
      <fieldset disabled={readOnly} className="space-y-5 min-w-0 border-0 p-0 m-0">
      {fields.map((field, index) => {
        const fila = filas?.[index];
        const texto = textos[field.id] ?? {};
        const vias = fila?.viasPermitidas ?? [];
        const hayMedicamento = Boolean(fila?.catalogoClinicoId);
        const modo = fila ? modoDeFila(fila) : 'CRITERIO_MEDICO';
        const calculada =
          modo === 'DISCRETA'
            ? calcularCantidadDispensar(fila!.dosisCantidad, fila!.frecuenciaIntervalo, fila!.frecuenciaUnidad, fila!.duracionTratamientoDias)
            : '';
        const volumen =
          modo === 'LIQUIDA'
            ? volumenTratamiento(fila!.dosisCantidad, fila!.frecuenciaIntervalo, fila!.frecuenciaUnidad, fila!.duracionTratamientoDias)
            : '';
        // Unidad de la dosis: mL en una líquida clasificada; la forma farmacéutica en las demás.
        const unidadDosis = modo === 'LIQUIDA' ? fila?.unidadVolumen : fila?.formaFarmaceutica;
        const diagnosticoElegido = textoDiagnostico(fila?.diagnosticoAsociadoCie, fila?.diagnosticoAsociadoDescripcion);

        return (
          <div
            key={field.id}
            className="relative p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3"
          >
            {/* Medicamento genérico (molde): al elegirlo se heredan la forma, el modo de cálculo y las vías permitidas */}
            <div>
              <div className="flex items-center justify-between mb-1 pr-8">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Medicamento (denominación genérica) *
                </label>
                {fila?.principioActivo && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {fila.principioActivo} {fila.concentracion}
                  </span>
                )}
              </div>
              <CatalogoAutocomplete<MoldePrescribible>
                aria-label="Buscar medicamento"
                inputClassName={entrada}
                placeholder="Buscar por denominación genérica, principio activo o IUM"
                valor={texto.medicamento ?? fila?.nombreGenerico ?? ''}
                onCambiarTexto={(t) => {
                  escribir(field.id, 'medicamento', t);
                  if (fila?.catalogoClinicoId) aplicar(index, camposDelMolde(null));
                }}
                buscar={buscarMoldes}
                claveDe={(m) => m.id}
                onSeleccionar={(m) => {
                  aplicar(index, camposDelMolde(m, fila?.viaAdministracionCodigo));
                  escribir(field.id, 'medicamento', undefined);
                }}
                renderItem={(m) => (
                  <>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{m.nombre}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-2">
                      <span>{m.principioActivo} {m.concentracion}</span>
                      <span>· {m.formaFarmaceutica}</span>
                      {m.iumNivel1 && <span className="font-mono text-[10px] text-teal-600 dark:text-teal-400 font-medium">IUM: {m.iumNivel1}</span>}
                    </div>
                  </>
                )}
              />
            </div>

            {/* Dosificación y posología */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Dosis por toma *</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Ej. 1"
                    className={`${entrada} sin-flechas`}
                    {...register(`medicamentos.${index}.dosisCantidad`, { valueAsNumber: true })}
                  />
                  <div
                    className={`${soloLectura} min-w-24 max-w-40 truncate`}
                    title={
                      modo === 'LIQUIDA'
                        ? `Forma líquida: la dosis va en ${fila?.unidadVolumen ?? 'volumen'}`
                        : fila?.formaFarmaceutica
                          ? `Forma farmacéutica del medicamento: ${fila.formaFarmaceutica}`
                          : undefined
                    }
                  >
                    {unidadDosis || <span className="text-slate-400">Forma</span>}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Vía de administración *</label>
                {/* Controlado: las opciones llegan con el medicamento, en el mismo cambio que la vía. */}
                <select
                  className={entrada}
                  disabled={readOnly || !hayMedicamento || vias.length === 0}
                  value={fila?.viaAdministracionCodigo ?? ''}
                  onChange={(e) => aplicar(index, { viaAdministracionCodigo: e.target.value })}
                >
                  <option value="">
                    {!hayMedicamento ? 'Elija primero el medicamento' : vias.length ? 'Seleccione vía' : 'Sin vías permitidas'}
                  </option>
                  {vias.map((v) => (
                    <option key={v.codigo} value={v.codigo}>
                      {v.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Frecuencia: cada *</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="8"
                    className={`${entrada} sin-flechas`}
                    {...register(`medicamentos.${index}.frecuenciaIntervalo`, { valueAsNumber: true })}
                  />
                  <select className={`${entrada} w-22`} {...register(`medicamentos.${index}.frecuenciaUnidad`)}>
                    <option value="HORAS">horas</option>
                    <option value="DIAS">días</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Duración (días) *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ej. 5"
                  className={`${entrada} sin-flechas`}
                  {...register(`medicamentos.${index}.duracionTratamientoDias`, { valueAsNumber: true })}
                />
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Cantidad a dispensar *</label>
                {modo === 'DISCRETA' ? (
                  <>
                    <div className={`${soloLectura} font-semibold`} aria-label="Cantidad a dispensar calculada">
                      <Calculator size={12} className="mr-1.5 text-teal-600" />
                      {calculada === '' ? '—' : `${calculada} ${fila?.formaFarmaceutica ?? ''}`.trim()}
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                      Calculada: dosis × tomas del tratamiento (días y frecuencia).
                    </p>
                  </>
                ) : (
                  <>
                    {modo === 'LIQUIDA' && (
                      <div className={`${soloLectura} font-semibold mb-1`} aria-label="Volumen del tratamiento">
                        <Calculator size={12} className="mr-1.5 text-teal-600" />
                        {volumen === '' ? '—' : `${volumen} ${fila?.unidadVolumen ?? ''}`.trim()} en total
                      </div>
                    )}
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder={modo === 'LIQUIDA' ? 'Envases a entregar' : 'Total a entregar'}
                      aria-label={modo === 'LIQUIDA' ? 'Envases a entregar' : 'Cantidad total a entregar'}
                      disabled={!hayMedicamento}
                      className={`${entrada} sin-flechas`}
                      {...register(`medicamentos.${index}.cantidadTotalDispensar`, { valueAsNumber: true })}
                    />
                    {hayMedicamento && (
                      <p className="mt-0.5 flex items-start gap-1 text-[10px] text-amber-700 dark:text-amber-400">
                        <Info size={10} className="mt-px shrink-0" />
                        {modo === 'LIQUIDA'
                          ? 'El volumen se calcula con la dosis y las tomas; indique cuántos envases (frascos) cubren ese volumen.'
                          : 'Esta presentación se mide por volumen o peso: indique la cantidad total a entregar. No se calcula automáticamente.'}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Diagnóstico asociado (CIE-10) *
                </label>
                <CatalogoAutocomplete<DiagnosticoCie>
                  aria-label="Buscar diagnóstico CIE-10"
                  inputClassName={entrada}
                  placeholder="Buscar por código o descripción (ej. R50, fiebre)"
                  valor={texto.diagnostico ?? diagnosticoElegido}
                  onCambiarTexto={(t) => {
                    escribir(field.id, 'diagnostico', t);
                    if (fila?.diagnosticoAsociadoCie) aplicar(index, { diagnosticoAsociadoCie: '', diagnosticoAsociadoDescripcion: '' });
                  }}
                  buscar={buscarDiagnosticos}
                  claveDe={(d) => d.codigo_cie10}
                  onSeleccionar={(d) => {
                    aplicar(index, { diagnosticoAsociadoCie: d.codigo_cie10, diagnosticoAsociadoDescripcion: d.titulo_cie10 });
                    escribir(field.id, 'diagnostico', undefined);
                  }}
                  renderItem={(d) => (
                    <span className="text-slate-800 dark:text-slate-100">
                      <span className="font-mono bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 px-1.5 py-0.5 rounded mr-2">
                        {d.codigo_cie10}
                      </span>
                      {d.titulo_cie10}
                    </span>
                  )}
                />
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Ámbito de Dispensación
                </label>
                <div className={soloLectura} title="No genera solicitud a farmacia ni custodia del paciente">
                  Ambulatorio (fórmula para el paciente: ventanilla de farmacia o farmacia externa)
                </div>
              </div>
            </div>

            {/* Indicaciones para el paciente */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Indicaciones para el paciente
              </label>
              <textarea
                rows={2}
                placeholder="Ej. Tomar 1 tableta después de cada comida con abundante agua."
                className={`${entrada} h-auto py-1.5`}
                {...register(`medicamentos.${index}.indicacionesPaciente`)}
              />
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                title="Eliminar medicamento"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      })}
      </fieldset>

      {!readOnly && (
        <button
          type="button"
          onClick={() => append({ ...FILA_VACIA })}
          className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
        >
          <Plus size={14} /> Agregar medicamento ambulatorio
        </button>
      )}
    </form>
  );
}

export default PrescripcionAmbForm;
