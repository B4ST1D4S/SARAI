import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Trash2,
  Pill,
  Clock,
  Syringe,
  AlertCircle,
  Ban,
  FileText,
  Calendar,
  Calculator,
  Info,
} from 'lucide-react';
import { apiClient } from '../../../../core/api/client';
import { CatalogoAutocomplete } from '../../../../core/ui/CatalogoAutocomplete';
import { SaveStatusBadge } from '../common/SaveStatusBadge';
import { useSubmoduloAutosave } from '../../hooks/useSubmoduloAutosave';
import type { SubmoduloProps } from '../../types/submodulo';
import {
  ESTILO_ALERTA,
  buscarDiagnosticos,
  buscarMoldes,
  calcularCantidadDispensar,
  mensajeError,
  modoDeFila,
  textoDiagnostico,
  tomasTratamiento,
  volumenTratamiento,
  type AlertaCdss,
  type DiagnosticoCie,
  type ModoCalculoCantidad,
  type MoldePrescribible,
  type RespuestaGuardado,
} from './compartido';
import type { ItemPrescripcionHosp, PrescripcionHospFormProps, UnidadFrecuenciaHosp, ViaAdministracion } from './types';

// ---------------------------------------------------------------------------
// Persistencia: PUT /clinical-records/folios/:id/prescripciones (ámbito INTRAHOSPITALARIO)
// Se prescribe por MOLDE genérico (catalogoClinicoId), igual que la ambulatoria:
// el servidor rechaza articuloId. La presentación comercial la elige Farmacia al
// despachar la solicitud que crea enfermería (este formulario no la crea).
// ---------------------------------------------------------------------------

/** Fila de `prescripcion` del workspace (PrescripcionGuardada), que mezcla ámbitos. */
type RegistroGuardado = Omit<Partial<ItemPrescripcionHosp>, 'ambitoAtencion' | 'frecuenciaUnidad' | 'estado'> & {
  ambitoAtencion?: string;
  frecuenciaUnidad?: string;
  nombreComercial?: string | null;
  dosisUnidad?: string | null;
  formaDiscreta?: boolean;
  indicacionesPaciente?: string | null;
  frecuenciaTextoIndicacion?: string | null;
};

const LIMITE_INDICACIONES = 2000;
const UNIDADES_PROPIAS = ['DOSIS_UNICA', 'CONTINUA'] as const;
type UnidadPropia = (typeof UNIDADES_PROPIAS)[number];
const esUnidadPropia = (v: string | null | undefined): v is UnidadPropia =>
  UNIDADES_PROPIAS.some((u) => u === v);

/**
 * El servidor solo admite HORAS o DIAS. "Dosis única" se envía como 1 toma y
 * "continua" como 1 toma cada 24 horas; la unidad original viaja en
 * frecuenciaTextoIndicacion para poder restaurarla al recargar.
 */
export function frecuenciaParaServidor(
  intervalo: number | '',
  unidad: UnidadFrecuenciaHosp,
): { frecuenciaIntervalo: number; frecuenciaUnidad: 'HORAS' | 'DIAS'; frecuenciaTextoIndicacion?: UnidadPropia } {
  if (unidad === 'DOSIS_UNICA') return { frecuenciaIntervalo: 1, frecuenciaUnidad: 'DIAS', frecuenciaTextoIndicacion: 'DOSIS_UNICA' };
  if (unidad === 'CONTINUA') return { frecuenciaIntervalo: 24, frecuenciaUnidad: 'HORAS', frecuenciaTextoIndicacion: 'CONTINUA' };
  return { frecuenciaIntervalo: Number(intervalo), frecuenciaUnidad: unidad };
}

/** Días entre inicio y suspensión prevista (mínimo 1), para prellenar la duración; sin suspensión, vacío. */
export function diasDeTratamiento(inicioIso: string, suspensionIso?: string): number | '' {
  if (!suspensionIso) return '';
  const ms = new Date(suspensionIso).getTime() - new Date(inicioIso).getTime();
  if (!Number.isFinite(ms)) return '';
  return ms > 0 ? Math.ceil(ms / 86_400_000) : 1;
}

type CamposPosologia = Pick<
  ItemPrescripcionHosp,
  'dosisCantidad' | 'frecuenciaIntervalo' | 'frecuenciaUnidad' | 'duracionTratamientoDias' | 'modoCalculoCantidad'
>;

/**
 * La dosis única dura 1 día; las demás, lo que indique el médico.
 * SIMPLIFICACIÓN TEMPORAL: la duración va en días enteros (el servidor no admite
 * horas), así que una orden de menos de 24 horas cuenta como 1 día.
 */
export const duracionDe = (o: Pick<ItemPrescripcionHosp, 'frecuenciaUnidad' | 'duracionTratamientoDias'>): number | '' =>
  o.frecuenciaUnidad === 'DOSIS_UNICA' ? 1 : o.duracionTratamientoDias;

/**
 * Cantidad sugerida de la orden: el tope de lo que enfermería puede pedir a
 * Farmacia para este tratamiento (crearSolicitudDispensacion).
 *   - DISCRETA: dosis × tomas (el servidor exige exactamente ese cálculo);
 *   - LÍQUIDA y criterio médico: sin presentación no se conoce el envase, así
 *     que se reserva una unidad de consumo por administración (tomas). Farmacia
 *     elige la presentación y lo que despacha en cada solicitud.
 */
export function cantidadSugeridaHosp(o: CamposPosologia): number | '' {
  const { frecuenciaIntervalo, frecuenciaUnidad } = frecuenciaParaServidor(o.frecuenciaIntervalo, o.frecuenciaUnidad);
  const dias = duracionDe(o);
  if (modoDeFila(o) === 'DISCRETA') return calcularCantidadDispensar(o.dosisCantidad, frecuenciaIntervalo, frecuenciaUnidad, dias);
  return tomasTratamiento(frecuenciaIntervalo, frecuenciaUnidad, dias);
}

/**
 * Cantidad que se envía: en una forma discreta, siempre el cálculo; en las
 * demás, la que indicó el médico (p. ej. una infusión de alto volumen que gasta
 * más de un envase por administración) o, si no la tocó, la sugerida.
 */
export function cantidadHosp(o: CamposPosologia & Pick<ItemPrescripcionHosp, 'cantidadTotalDispensar'>): number | '' {
  if (modoDeFila(o) === 'DISCRETA' || o.cantidadTotalDispensar === undefined) return cantidadSugeridaHosp(o);
  return o.cantidadTotalDispensar;
}

const positivo = (v: number | '' | undefined) => typeof v === 'number' && Number.isFinite(v) && v > 0;
const enteroPositivo = (v: number | '' | undefined) => positivo(v) && Number.isInteger(v);

/** Una orden está lista para guardar si tiene todo lo que valida el servidor. */
export function ordenCompleta(o: ItemPrescripcionHosp): boolean {
  const intervaloOk = esUnidadPropia(o.frecuenciaUnidad) || enteroPositivo(o.frecuenciaIntervalo);
  return Boolean(
    o.catalogoClinicoId &&
      o.viaAdministracionCodigo &&
      o.diagnosticoAsociadoCie?.trim() &&
      positivo(o.dosisCantidad) &&
      intervaloOk &&
      enteroPositivo(duracionDe(o)) &&
      enteroPositivo(cantidadHosp(o)),
  );
}

const unaLinea = (v: string) => v.replace(/\s+/g, ' ').trim();

/**
 * Observaciones hospitalarias dentro de indicacionesPaciente (hc_prescripciones
 * no tiene columnas para ellas): una línea "Etiqueta: valor" por dato, que
 * `parsearIndicaciones` vuelve a separar al recargar.
 */
export function serializarIndicaciones(
  o: Pick<ItemPrescripcionHosp, 'fechaInicio' | 'fechaSuspension' | 'estado' | 'diluyente' | 'velocidadInfusion' | 'observacionesEnfermeria'>,
): string | undefined {
  const lineas: string[] = [];
  if (o.fechaInicio) lineas.push(`Inicio: ${o.fechaInicio}`);
  if (o.fechaSuspension) lineas.push(`Suspensión: ${o.fechaSuspension}`);
  if (o.estado === 'SUSPENDIDO') lineas.push('Estado: SUSPENDIDO');
  if (o.diluyente) lineas.push(`Diluyente: ${unaLinea(o.diluyente)}`);
  if (o.velocidadInfusion) lineas.push(`Velocidad de infusión: ${unaLinea(o.velocidadInfusion)}`);
  if (o.observacionesEnfermeria) lineas.push(`Enfermería: ${unaLinea(o.observacionesEnfermeria)}`);
  return lineas.length > 0 ? lineas.join('\n') : undefined;
}

export function parsearIndicaciones(
  texto: string | null | undefined,
): Pick<ItemPrescripcionHosp, 'fechaInicio' | 'fechaSuspension' | 'estado' | 'diluyente' | 'velocidadInfusion' | 'observacionesEnfermeria'> {
  const r: ReturnType<typeof parsearIndicaciones> = { fechaInicio: '', estado: 'EN_TRATAMIENTO' };
  const sueltas: string[] = [];
  for (const linea of (texto ?? '').split('\n')) {
    const m = /^(Inicio|Suspensión|Estado|Diluyente|Velocidad de infusión|Enfermería): (.*)$/.exec(linea);
    if (!m) {
      if (linea.trim()) sueltas.push(linea.trim());
      continue;
    }
    const valor = m[2].trim();
    if (m[1] === 'Inicio') r.fechaInicio = valor;
    else if (m[1] === 'Suspensión') r.fechaSuspension = valor;
    else if (m[1] === 'Estado') r.estado = valor === 'SUSPENDIDO' ? 'SUSPENDIDO' : 'EN_TRATAMIENTO';
    else if (m[1] === 'Diluyente') r.diluyente = valor;
    else if (m[1] === 'Velocidad de infusión') r.velocidadInfusion = valor;
    else r.observacionesEnfermeria = valor;
  }
  // Texto libre anterior al formato: se conserva como observación de enfermería.
  if (sueltas.length > 0) {
    r.observacionesEnfermeria = [r.observacionesEnfermeria, ...sueltas].filter(Boolean).join(' ');
  }
  return r;
}

/**
 * Cuerpo del PUT (?ambito=INTRAHOSPITALARIO). El servidor REEMPLAZA las
 * prescripciones intrahospitalarias del folio con esta lista. Solo el molde:
 * nunca articuloId; tampoco dosisUnidad (la deriva el servidor del molde).
 */
export function cuerpoGuardadoHosp(ordenes: ItemPrescripcionHosp[]) {
  return {
    prescripciones: ordenes.map((o) => {
      const indicaciones = serializarIndicaciones(o);
      return {
        catalogoClinicoId: o.catalogoClinicoId,
        ambitoAtencion: 'INTRAHOSPITALARIO' as const,
        dosisCantidad: Number(o.dosisCantidad),
        viaAdministracionCodigo: o.viaAdministracionCodigo,
        ...frecuenciaParaServidor(o.frecuenciaIntervalo, o.frecuenciaUnidad),
        duracionTratamientoDias: Number(duracionDe(o)),
        cantidadTotalDispensar: Number(cantidadHosp(o)),
        diagnosticoAsociadoCie: o.diagnosticoAsociadoCie.trim().toUpperCase(),
        ...(indicaciones ? { indicacionesPaciente: indicaciones } : {}),
      };
    }),
  };
}

/**
 * Órdenes intrahospitalarias a partir de las prescripciones del workspace. Las
 * anteriores a la regla por molde pueden traer articuloId: se ignora y la orden
 * se reenvía por su molde (catalogo_clinico_id es NOT NULL desde la 034).
 */
export function ordenesDesdeGuardadas(valores: Partial<ItemPrescripcionHosp>[] | undefined): ItemPrescripcionHosp[] {
  if (!Array.isArray(valores)) return [];
  return valores
    .map((d) => d as RegistroGuardado)
    // Sin ámbito (legado) cuenta como AMBULATORIO, igual que en el servidor.
    .filter((d) => d.ambitoAtencion === 'INTRAHOSPITALARIO')
    .map((d): ItemPrescripcionHosp => {
      const obs = parsearIndicaciones(d.indicacionesPaciente);
      const modo = modoDeFila(d);
      const vias = d.viasPermitidas ?? [];
      const via = String(d.viaAdministracionCodigo ?? '').trim();
      return {
        catalogoClinicoId: d.catalogoClinicoId || '',
        nombreGenerico: d.nombreGenerico || d.nombreComercial || '',
        principioActivo: d.principioActivo || undefined,
        concentracion: d.concentracion || undefined,
        formaFarmaceuticaCodigo: d.formaFarmaceuticaCodigo || undefined,
        formaFarmaceutica: d.formaFarmaceutica || undefined,
        modoCalculoCantidad: modo,
        // El servidor guarda en dosis_unidad la unidad de volumen de una líquida clasificada.
        unidadVolumen: modo === 'LIQUIDA' ? (d.unidadVolumen ?? d.dosisUnidad ?? null) : null,
        viasPermitidas: vias,
        ...obs,
        fechaInicio: obs.fechaInicio || new Date().toISOString(),
        dosisCantidad: d.dosisCantidad ?? '',
        viaAdministracionCodigo: via,
        viaAdministracionNombre: vias.find((v) => v.codigo === via)?.nombre ?? d.viaAdministracionNombre,
        frecuenciaIntervalo: d.frecuenciaIntervalo ?? 8,
        frecuenciaUnidad: esUnidadPropia(d.frecuenciaTextoIndicacion)
          ? d.frecuenciaTextoIndicacion
          : d.frecuenciaUnidad === 'DIAS'
            ? 'DIAS'
            : 'HORAS',
        duracionTratamientoDias: d.duracionTratamientoDias ?? '',
        // La guardada se conserva en las no discretas (pudo indicarla el médico); en las discretas se recalcula.
        ...(modo !== 'DISCRETA' && d.cantidadTotalDispensar !== undefined ? { cantidadTotalDispensar: d.cantidadTotalDispensar } : {}),
        diagnosticoAsociadoCie: d.diagnosticoAsociadoCie || '',
        diagnosticoAsociadoDescripcion: d.diagnosticoAsociadoDescripcion || undefined,
        ambitoAtencion: 'INTRAHOSPITALARIO',
      };
    });
}

/** Unidad en que va la dosis: mL en una líquida clasificada; la forma farmacéutica en las demás. */
export function unidadDosis(o: Pick<ItemPrescripcionHosp, 'modoCalculoCantidad' | 'unidadVolumen' | 'formaFarmaceutica' | 'formaFarmaceuticaCodigo'>): string {
  return (modoDeFila(o) === 'LIQUIDA' ? o.unidadVolumen : o.formaFarmaceutica || o.formaFarmaceuticaCodigo) ?? '';
}

/** "Cada 8 horas", "Dosis única", "Infusión continua". */
export function etiquetaFrecuencia(o: Pick<ItemPrescripcionHosp, 'frecuenciaIntervalo' | 'frecuenciaUnidad'>): string {
  if (o.frecuenciaUnidad === 'DOSIS_UNICA') return 'Dosis única';
  if (o.frecuenciaUnidad === 'CONTINUA') return 'Infusión continua';
  return `Cada ${o.frecuenciaIntervalo} ${o.frecuenciaUnidad === 'DIAS' ? 'días' : 'horas'}`;
}

/**
 * Detecta si una vía de administración corresponde a administración parenteral o endovenosa
 * que requiere dilución y velocidad de infusión.
 */
export function esViaParenteral(nombreOVia?: string): boolean {
  if (!nombreOVia) return false;
  return /parenteral|endovenos|intravenos|\bev\b|\biv\b|infusi[oó]n|perfusi[oó]n|subcut[aá]ne|intramuscular|intratecal/i.test(
    nombreOVia
  );
}

/** Formatea una fecha ISO a formato legible local */
function formatoFechaCorta(fechaIso?: string): string {
  if (!fechaIso) return '—';
  try {
    const d = new Date(fechaIso);
    return isNaN(d.getTime()) ? fechaIso : d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return fechaIso;
  }
}

/** Retorna la fecha y hora actual en formato YYYY-MM-DDTHH:mm para inputs datetime-local */
function fechaHoraActualLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Lo que se hereda del molde elegido (o se vacía al deselegirlo); una sola vía se preselecciona. */
function camposDelMolde(m: MoldePrescribible | null, viaActual = ''): Partial<Borrador> {
  if (!m) {
    return {
      catalogoClinicoId: '', nombreGenerico: '', principioActivo: '', concentracion: '', formaFarmaceuticaCodigo: '',
      formaFarmaceutica: '', modoCalculoCantidad: 'CRITERIO_MEDICO', unidadVolumen: null, viasPermitidas: [], viaAdministracionCodigo: '',
      cantidadTotalDispensar: undefined,
    };
  }
  const vias = m.viasPermitidas ?? [];
  return {
    // Otro medicamento: el tope que hubiera indicado el médico ya no aplica.
    cantidadTotalDispensar: undefined,
    catalogoClinicoId: m.id,
    nombreGenerico: m.nombre,
    principioActivo: m.principioActivo,
    concentracion: m.concentracion,
    formaFarmaceuticaCodigo: m.formaFarmaceuticaCodigo ?? '',
    formaFarmaceutica: m.formaFarmaceutica,
    modoCalculoCantidad: m.modoCalculoCantidad,
    unidadVolumen: m.modoCalculoCantidad === 'LIQUIDA' ? m.unidadVolumen : null,
    viasPermitidas: vias,
    viaAdministracionCodigo: vias.length === 1 ? vias[0].codigo : vias.some((v) => v.codigo === viaActual) ? viaActual : '',
  };
}

/** La orden que se está escribiendo: fechas en formato datetime-local hasta agregarla. */
type Borrador = Omit<ItemPrescripcionHosp, 'estado' | 'ambitoAtencion'> & { modoCalculoCantidad: ModoCalculoCantidad };

const borradorVacio = (): Borrador => ({
  ...(camposDelMolde(null) as Pick<Borrador, 'catalogoClinicoId' | 'nombreGenerico' | 'modoCalculoCantidad' | 'viaAdministracionCodigo'>),
  fechaInicio: fechaHoraActualLocal(),
  fechaSuspension: '',
  diluyente: '',
  velocidadInfusion: '',
  observacionesEnfermeria: '',
  dosisCantidad: '',
  frecuenciaIntervalo: 8,
  frecuenciaUnidad: 'HORAS',
  duracionTratamientoDias: '',
  diagnosticoAsociadoCie: '',
  diagnosticoAsociadoDescripcion: '',
});

const numeroDe = (v: string): number | '' => (v === '' ? '' : Number(v));

export const PRESCRIPCION_HOSP_SUBMODULO_ID = 'prescripcion_hospitalaria';

export function PrescripcionHospForm({
  folioId,
  atencionId: _atencionId,
  onSave,
  defaultValues,
  readOnly = false,
  onSaveStateChange,
}: PrescripcionHospFormProps & Pick<SubmoduloProps, 'readOnly' | 'onSaveStateChange'>) {
  // Lista de tratamientos intrahospitalarios ordenados. Vive en react-hook-form
  // para que useSubmoduloAutosave detecte cada alta, suspensión o eliminación.
  const form = useForm<{ ordenes: ItemPrescripcionHosp[] }>({
    defaultValues: { ordenes: ordenesDesdeGuardadas(defaultValues) },
  });
  const ordenes = form.watch('ordenes') ?? [];
  const [alertasCdss, setAlertasCdss] = useState<AlertaCdss[]>([]);

  const { status, error } = useSubmoduloAutosave({
    submoduloId: PRESCRIPCION_HOSP_SUBMODULO_ID,
    form,
    readOnly,
    onSaveStateChange,
    saveFn: async (values) => {
      const items = values.ordenes ?? [];
      const res = await apiClient.put<RespuestaGuardado>(
        `/clinical-records/folios/${folioId}/prescripciones`,
        cuerpoGuardadoHosp(items),
        { params: { ambito: 'INTRAHOSPITALARIO' } },
      );
      setAlertasCdss(Array.isArray(res.data?.alertasCdss) ? res.data.alertasCdss : []);
      if (onSave) onSave(items);
    },
  });
  const errorGuardado = status === 'error' && error ? mensajeError(error) : null;

  // Orden que se está escribiendo y lo que el médico teclea en los buscadores.
  const [nueva, setNueva] = useState<Borrador>(borradorVacio);
  const [textoMedicamento, setTextoMedicamento] = useState<string | undefined>();
  const [textoCie, setTextoCie] = useState<string | undefined>();
  const [forzarParenteral, setForzarParenteral] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const cambiar = (campos: Partial<Borrador>) => setNueva((n) => ({ ...n, ...campos }));

  const hayMedicamento = Boolean(nueva.catalogoClinicoId);
  const vias: ViaAdministracion[] = nueva.viasPermitidas ?? [];
  const viaSeleccionada = vias.find((v) => v.codigo === nueva.viaAdministracionCodigo);
  const esParenteral = forzarParenteral || esViaParenteral(viaSeleccionada?.nombre);
  const modo = modoDeFila(nueva);
  const frecuenciaPropia = esUnidadPropia(nueva.frecuenciaUnidad);
  const frec = frecuenciaParaServidor(nueva.frecuenciaIntervalo, nueva.frecuenciaUnidad);
  const duracion = duracionDe(nueva);
  const cantidad = hayMedicamento ? cantidadHosp(nueva) : '';
  const sugerida = hayMedicamento ? cantidadSugeridaHosp(nueva) : '';
  const topeEditado = modo !== 'DISCRETA' && nueva.cantidadTotalDispensar !== undefined;
  const volumen = modo === 'LIQUIDA' ? volumenTratamiento(nueva.dosisCantidad, frec.frecuenciaIntervalo, frec.frecuenciaUnidad, duracion) : '';
  const unidad = unidadDosis(nueva);

  /** Reemplaza la lista; el hook la guarda completa tras el debounce (PUT ?ambito=INTRAHOSPITALARIO). */
  const actualizarOrdenes = (nuevas: ItemPrescripcionHosp[]) => {
    if (readOnly) return;
    form.setValue('ordenes', nuevas, { shouldDirty: true });
  };

  const limpiarFormulario = () => {
    setNueva(borradorVacio());
    setTextoMedicamento(undefined);
    setTextoCie(undefined);
    setForzarParenteral(false);
    setErrorValidacion(null);
  };

  /** La suspensión prevista prellena la duración (el médico puede corregirla). */
  const cambiarSuspension = (valor: string) => {
    const dias = valor && nueva.fechaInicio ? diasDeTratamiento(new Date(nueva.fechaInicio).toISOString(), new Date(valor).toISOString()) : '';
    cambiar({ fechaSuspension: valor, ...(dias !== '' ? { duracionTratamientoDias: dias } : {}) });
  };

  const agregarOrden = () => {
    if (!hayMedicamento) return setErrorValidacion('Busque y seleccione el medicamento (denominación genérica) del catálogo.');
    if (!positivo(nueva.dosisCantidad)) return setErrorValidacion('Ingrese una dosis numérica válida mayor a 0.');
    if (!nueva.viaAdministracionCodigo) return setErrorValidacion('Seleccione la vía de administración.');
    if (!frecuenciaPropia && !enteroPositivo(nueva.frecuenciaIntervalo)) {
      return setErrorValidacion('Especifique el intervalo de frecuencia en números enteros (ej. cada 8 horas).');
    }
    if (!enteroPositivo(duracion)) return setErrorValidacion('Indique la duración del tratamiento en días enteros.');
    if (!nueva.diagnosticoAsociadoCie.trim()) return setErrorValidacion('Busque y seleccione el diagnóstico CIE-10 asociado.');
    if (modo !== 'DISCRETA' && !enteroPositivo(cantidad)) {
      return setErrorValidacion('Indique el tope de unidades a dispensar en números enteros mayores a 0.');
    }

    const orden: ItemPrescripcionHosp = {
      ...nueva,
      fechaInicio: nueva.fechaInicio ? new Date(nueva.fechaInicio).toISOString() : new Date().toISOString(),
      fechaSuspension: nueva.fechaSuspension ? new Date(nueva.fechaSuspension).toISOString() : undefined,
      duracionTratamientoDias: duracion,
      diluyente: esParenteral && nueva.diluyente?.trim() ? nueva.diluyente.trim() : undefined,
      velocidadInfusion: esParenteral && nueva.velocidadInfusion?.trim() ? nueva.velocidadInfusion.trim() : undefined,
      observacionesEnfermeria: nueva.observacionesEnfermeria?.trim() || undefined,
      viaAdministracionNombre: viaSeleccionada?.nombre ?? nueva.viaAdministracionCodigo,
      estado: 'EN_TRATAMIENTO',
      ambitoAtencion: 'INTRAHOSPITALARIO',
    };
    if (!ordenCompleta(orden)) return setErrorValidacion('No se pudo calcular la cantidad con esa dosis, frecuencia y duración.');
    if ((serializarIndicaciones(orden) ?? '').length > LIMITE_INDICACIONES) {
      return setErrorValidacion(`Las observaciones de la orden superan los ${LIMITE_INDICACIONES} caracteres.`);
    }

    actualizarOrdenes([orden, ...ordenes]);
    limpiarFormulario();
  };

  // Suspender un tratamiento intrahospitalario
  const toggleSuspension = (index: number) => {
    const copia = ordenes.map((o, i): ItemPrescripcionHosp => {
      if (i !== index) return o;
      return o.estado === 'SUSPENDIDO'
        ? { ...o, estado: 'EN_TRATAMIENTO', fechaSuspension: undefined }
        : { ...o, estado: 'SUSPENDIDO', fechaSuspension: new Date().toISOString() };
    });
    actualizarOrdenes(copia);
  };

  // Eliminar orden
  const eliminarOrden = (index: number) => {
    actualizarOrdenes(ordenes.filter((_, i) => i !== index));
  };

  const entrada =
    'w-full h-9 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-60';
  const soloLectura =
    'h-9 px-2 flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300';

  return (
    <div className="space-y-6">
      {/* Encabezado del Módulo Intrahospitalario */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-teal-100 dark:border-teal-900/50 bg-teal-50/40 dark:bg-teal-950/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-sm">
            <Syringe size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Tratamiento y Órdenes Médicas Intrahospitalarias
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200">
                Hospitalización / Urgencias
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Se prescribe por denominación genérica: Farmacia elige la presentación al despachar la solicitud de enfermería.
            </p>
          </div>
        </div>

        <SaveStatusBadge isPending={status === 'saving'} isSuccess={status === 'saved'} isError={status === 'error'} />
      </div>

      {errorGuardado && (
        <div role="alert" className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorGuardado}</span>
        </div>
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

      {/* Formulario de Entrada: Nueva Orden Médica (fieldset disabled en solo lectura) */}
      <fieldset
        disabled={readOnly}
        aria-label="Nueva orden médica intrahospitalaria"
        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm space-y-4 min-w-0 disabled:opacity-70"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Plus size={14} className="text-teal-600 dark:text-teal-400" />
            Nueva Orden Médica Intrahospitalaria
          </span>
          <span className="text-[11px] text-slate-400">* Campos obligatorios</span>
        </div>

        {errorValidacion && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorValidacion}</span>
          </div>
        )}

        {/* Medicamento genérico (molde): al elegirlo se heredan la forma, el modo de cálculo y las vías permitidas */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Medicamento (denominación genérica) *
            </label>
            {nueva.principioActivo && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {nueva.principioActivo} {nueva.concentracion} · {nueva.formaFarmaceutica}
              </span>
            )}
          </div>
          <CatalogoAutocomplete<MoldePrescribible>
            aria-label="Buscar medicamento"
            inputClassName={entrada}
            placeholder="Buscar por denominación genérica, principio activo o IUM"
            valor={textoMedicamento ?? nueva.nombreGenerico}
            onCambiarTexto={(t) => {
              setTextoMedicamento(t);
              if (hayMedicamento) cambiar(camposDelMolde(null));
            }}
            buscar={buscarMoldes}
            claveDe={(m) => m.id}
            onSeleccionar={(m) => {
              cambiar(camposDelMolde(m, nueva.viaAdministracionCodigo));
              setTextoMedicamento(undefined);
              setErrorValidacion(null);
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

        {/* Fila de Parámetros Posológicos Básicos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Dosis por administración *
            </label>
            <div className="flex gap-1">
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Ej. 1"
                aria-label="Dosis por administración"
                className={`${entrada} sin-flechas`}
                value={nueva.dosisCantidad}
                onChange={(e) => cambiar({ dosisCantidad: numeroDe(e.target.value) })}
              />
              <div
                className={`${soloLectura} min-w-24 max-w-40 truncate`}
                title={
                  modo === 'LIQUIDA'
                    ? `Forma líquida: la dosis va en ${nueva.unidadVolumen ?? 'volumen'}`
                    : nueva.formaFarmaceutica
                      ? `Forma farmacéutica del medicamento: ${nueva.formaFarmaceutica}`
                      : undefined
                }
              >
                {unidad || <span className="text-slate-400">Forma</span>}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Vía de Administración *
            </label>
            {/* Solo las vías permitidas del molde: llegan con el medicamento. */}
            <select
              aria-label="Vía de administración"
              className={entrada}
              disabled={readOnly || !hayMedicamento || vias.length === 0}
              value={nueva.viaAdministracionCodigo}
              onChange={(e) => cambiar({ viaAdministracionCodigo: e.target.value })}
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
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Frecuencia de Administración *
            </label>
            <div className="flex gap-1">
              <input
                type="number"
                min="1"
                step="1"
                placeholder="8"
                aria-label="Intervalo de frecuencia"
                className={`${entrada} sin-flechas`}
                disabled={frecuenciaPropia}
                value={frecuenciaPropia ? '' : nueva.frecuenciaIntervalo}
                onChange={(e) => cambiar({ frecuenciaIntervalo: numeroDe(e.target.value) })}
              />
              <select
                aria-label="Unidad de frecuencia"
                className={`${entrada} w-22`}
                value={nueva.frecuenciaUnidad}
                onChange={(e) => cambiar({ frecuenciaUnidad: e.target.value as UnidadFrecuenciaHosp })}
              >
                <option value="HORAS">horas</option>
                <option value="DIAS">días</option>
                <option value="DOSIS_UNICA">dosis única</option>
                <option value="CONTINUA">continua</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Duración (días) *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Ej. 7"
              aria-label="Duración del tratamiento en días"
              className={`${entrada} sin-flechas`}
              disabled={nueva.frecuenciaUnidad === 'DOSIS_UNICA'}
              value={duracion}
              onChange={(e) => cambiar({ duracionTratamientoDias: numeroDe(e.target.value) })}
            />
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              {nueva.frecuenciaUnidad === 'DOSIS_UNICA' ? 'Dosis única: 1 día.' : 'Se prellena con la suspensión programada.'}
            </p>
          </div>

          <div className="col-span-2">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Diagnóstico asociado (CIE-10) *
            </label>
            <CatalogoAutocomplete<DiagnosticoCie>
              aria-label="Buscar diagnóstico CIE-10"
              inputClassName={entrada}
              placeholder="Buscar por código o descripción (ej. A419, sepsis)"
              valor={textoCie ?? textoDiagnostico(nueva.diagnosticoAsociadoCie, nueva.diagnosticoAsociadoDescripcion)}
              onCambiarTexto={(t) => {
                setTextoCie(t);
                if (nueva.diagnosticoAsociadoCie) cambiar({ diagnosticoAsociadoCie: '', diagnosticoAsociadoDescripcion: '' });
              }}
              buscar={buscarDiagnosticos}
              claveDe={(d) => d.codigo_cie10}
              onSeleccionar={(d) => {
                cambiar({ diagnosticoAsociadoCie: d.codigo_cie10, diagnosticoAsociadoDescripcion: d.titulo_cie10 });
                setTextoCie(undefined);
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

          {/* Tope de las solicitudes de enfermería: calculado en las discretas; sugerido y editable en las demás. */}
          <div className="col-span-2">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Tope de dispensación del tratamiento{modo !== 'DISCRETA' && hayMedicamento ? ' *' : ''}
            </label>
            {modo === 'DISCRETA' || !hayMedicamento ? (
              <div className={`${soloLectura} font-semibold`} aria-label="Tope de dispensación calculado">
                <Calculator size={12} className="mr-1.5 text-teal-600" />
                {cantidad === '' ? '—' : `${cantidad} ${nueva.formaFarmaceutica ?? ''}`.trim()}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  aria-label="Tope de unidades a dispensar"
                  className={`${entrada} sin-flechas w-28`}
                  value={cantidad}
                  onChange={(e) => cambiar({ cantidadTotalDispensar: numeroDe(e.target.value) })}
                />
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  unidad(es) de consumo
                  {volumen !== '' && <> · {volumen} {nueva.unidadVolumen} en total</>}
                </span>
                {topeEditado && sugerida !== '' && (
                  <button
                    type="button"
                    onClick={() => cambiar({ cantidadTotalDispensar: undefined })}
                    className="text-[10px] text-teal-600 hover:underline whitespace-nowrap"
                  >
                    Usar sugerido ({sugerida})
                  </button>
                )}
              </div>
            )}
            {hayMedicamento && (
              <p className="mt-0.5 flex items-start gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                <Info size={10} className="mt-px shrink-0" />
                {modo === 'DISCRETA'
                  ? 'Calculado: dosis × administraciones del tratamiento.'
                  : 'Sugerido: una unidad de consumo por administración. Auméntelo si cada administración gasta más de un envase (p. ej. infusiones de alto volumen); Farmacia elige la presentación al despachar.'}
              </p>
            )}
          </div>
        </div>

        {/* Sección Condicional: Infusión Endovenosa / Vía Parenteral */}
        <div
          className={`p-3 rounded-lg border transition-all ${
            esParenteral
              ? 'border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Syringe size={14} className={esParenteral ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'} />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Parámetros de Dilución e Infusión Parenteral
              </span>
              {esParenteral && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-300 px-1.5 py-0.5 rounded">
                  Vía Parenteral / IV Detectada
                </span>
              )}
            </div>

            <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={forzarParenteral}
                onChange={(e) => setForzarParenteral(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Habilitar campos de dilución manualmente
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Dilución / Solución Base
                </label>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => cambiar({ diluyente: 'SSN 0.9% 100 ml' })}
                    className="text-teal-600 hover:underline"
                  >
                    +SSN 100ml
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiar({ diluyente: 'DAD 5% 250 ml' })}
                    className="text-teal-600 hover:underline"
                  >
                    +DAD 5% 250ml
                  </button>
                </div>
              </div>
              <input
                disabled={!esParenteral}
                placeholder={esParenteral ? 'Ej. Solución Salina 0.9% 100 ml, DAD 5% 250 ml, etc.' : 'Se habilita con vía parenteral/endovenosa'}
                className={`${entrada} disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800`}
                value={nueva.diluyente ?? ''}
                onChange={(e) => cambiar({ diluyente: e.target.value })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Velocidad de Infusión (ml/h o gotas/min)
                </label>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => cambiar({ velocidadInfusion: 'Bomba a 20 ml/h' })}
                    className="text-teal-600 hover:underline"
                  >
                    +20 ml/h
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiar({ velocidadInfusion: 'Pasar en 1 hora' })}
                    className="text-teal-600 hover:underline"
                  >
                    +1 hora
                  </button>
                </div>
              </div>
              <input
                disabled={!esParenteral}
                placeholder={esParenteral ? 'Ej. 20 ml/h en bomba de infusión, 30 gotas/min, etc.' : 'Se habilita con vía parenteral/endovenosa'}
                className={`${entrada} disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800`}
                value={nueva.velocidadInfusion ?? ''}
                onChange={(e) => cambiar({ velocidadInfusion: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Fechas de Programación y Observaciones de Enfermería */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Fecha y Hora de Inicio *
            </label>
            <div className="relative">
              <Calendar size={13} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="datetime-local"
                className={`${entrada} pl-8`}
                value={nueva.fechaInicio}
                onChange={(e) => cambiar({ fechaInicio: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Fecha de Suspensión Programada (Opcional)
            </label>
            <input
              type="datetime-local"
              aria-label="Fecha de suspensión programada"
              className={entrada}
              value={nueva.fechaSuspension ?? ''}
              onChange={(e) => cambiarSuspension(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Instrucciones / Cuidados de Enfermería
            </label>
            <input
              placeholder="Ej. Control de PA previa, pasar lento en 45 min, etc."
              className={entrada}
              value={nueva.observacionesEnfermeria ?? ''}
              onChange={(e) => cambiar({ observacionesEnfermeria: e.target.value })}
            />
          </div>
        </div>

        {/* Botón de Agregar Orden */}
        {!readOnly && (
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={limpiarFormulario}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 rounded-lg"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={agregarOrden}
              className="disabled:opacity-60 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus size={14} /> Ordenar Medicamento Intrahospitalario
            </button>
          </div>
        )}
      </fieldset>

      {/* Tabla de Medicamentos Ordenados (Tratamientos Activos) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Medicamentos en Tratamiento Intrahospitalario ({ordenes.length})
            </h4>
            {folioId && (
              <span className="text-[11px] font-mono text-slate-400">Folio: {folioId}</span>
            )}
          </div>
        </div>

        {ordenes.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <Pill size={28} className="mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              No hay medicamentos ordenados para este paciente
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Utilice el formulario superior para prescribir medicamentos, antibióticos o soluciones endovenosas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
                <tr>
                  <th className="px-3.5 py-3">Medicamento</th>
                  <th className="px-3.5 py-3">Dosis & Vía</th>
                  <th className="px-3.5 py-3">Frecuencia</th>
                  <th className="px-3.5 py-3">Dilución / Infusión</th>
                  <th className="px-3.5 py-3">Cuidados de Enfermería</th>
                  <th className="px-3.5 py-3">Inicio / Suspensión</th>
                  <th className="px-3.5 py-3">Estado</th>
                  <th className="px-3.5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {ordenes.map((item, index) => {
                  const esActivo = item.estado !== 'SUSPENDIDO';
                  const dias = duracionDe(item);

                  return (
                    <tr
                      key={`${item.catalogoClinicoId}-${index}`}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        !esActivo ? 'opacity-60 bg-slate-50/30 dark:bg-slate-900/40' : ''
                      }`}
                    >
                      {/* Medicamento genérico & CIE */}
                      <td className="px-3.5 py-3 align-top">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{item.nombreGenerico}</div>
                        {(item.principioActivo || item.formaFarmaceutica) && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.principioActivo} {item.concentracion} · {item.formaFarmaceutica}
                          </div>
                        )}
                        {item.diagnosticoAsociadoCie && (
                          <span
                            className="inline-block mt-1 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-600 dark:text-slate-300"
                            title={item.diagnosticoAsociadoDescripcion}
                          >
                            CIE: {item.diagnosticoAsociadoCie}
                          </span>
                        )}
                      </td>

                      {/* Dosis & Vía */}
                      <td className="px-3.5 py-3 align-top">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {item.dosisCantidad} {unidadDosis(item)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.viaAdministracionNombre || item.viaAdministracionCodigo}
                        </div>
                      </td>

                      {/* Frecuencia y duración */}
                      <td className="px-3.5 py-3 align-top">
                        <div className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Clock size={12} className="text-slate-400" />
                          {etiquetaFrecuencia(item)}
                        </div>
                        {dias !== '' && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {dias} {dias === 1 ? 'día' : 'días'}
                          </div>
                        )}
                      </td>

                      {/* Dilución / Infusión */}
                      <td className="px-3.5 py-3 align-top">
                        {item.diluyente || item.velocidadInfusion ? (
                          <div className="space-y-0.5">
                            {item.diluyente && (
                              <div className="font-medium text-sky-700 dark:text-sky-300 text-[11px]">
                                {item.diluyente}
                              </div>
                            )}
                            {item.velocidadInfusion && (
                              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                Infusión: <span className="font-semibold">{item.velocidadInfusion}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Directa / Sin dilución</span>
                        )}
                      </td>

                      {/* Cuidados de Enfermería */}
                      <td className="px-3.5 py-3 align-top max-w-[200px]">
                        {item.observacionesEnfermeria ? (
                          <div className="flex items-start gap-1 text-[11px] text-slate-700 dark:text-slate-300">
                            <FileText size={12} className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                            <span>{item.observacionesEnfermeria}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Sin instrucciones especiales</span>
                        )}
                      </td>

                      {/* Horario: Inicio y Suspensión */}
                      <td className="px-3.5 py-3 align-top text-[11px] text-slate-600 dark:text-slate-400">
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Inicia:</span>{' '}
                          {formatoFechaCorta(item.fechaInicio)}
                        </div>
                        {item.fechaSuspension && (
                          <div className="text-rose-600 dark:text-rose-400 mt-0.5">
                            <span className="font-semibold">Susp:</span> {formatoFechaCorta(item.fechaSuspension)}
                          </div>
                        )}
                      </td>

                      {/* Estado: Badge "En Tratamiento" */}
                      <td className="px-3.5 py-3 align-top">
                        {esActivo ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            En Tratamiento
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <Ban size={10} /> Suspendido
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-3.5 py-3 align-top text-right space-x-1 whitespace-nowrap">
                        {!readOnly && (
                        <>
                        <button
                          type="button"
                          onClick={() => toggleSuspension(index)}
                          className={`p-1.5 rounded-lg text-xs transition-colors ${
                            esActivo
                              ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={esActivo ? 'Suspender medicamento' : 'Reanudar tratamiento'}
                        >
                          <Ban size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarOrden(index)}
                          className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Eliminar orden"
                        >
                          <Trash2 size={13} />
                        </button>
                        </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PrescripcionHospForm;
