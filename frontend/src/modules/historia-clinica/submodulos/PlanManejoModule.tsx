import React from 'react';
import { ClipboardList, FileText, AlertTriangle, FileHeart, CalendarRange } from 'lucide-react';
import type {
  IncapacidadMedicaData,
  ModalidadServicio,
  PlanManejoData,
  TipoIncapacidad,
} from '@/types/historiaClinica.types';
import type { SubmoduloProps } from '../registry';
import {
  ESTILO_CAMPO_ERROR,
  ESTILO_ERROR_MSG,
  ESTILO_INPUT,
  ESTILO_LABEL,
  ESTILO_SELECT,
  ESTILO_TEXTAREA,
  clasesCampo,
} from '../components/common/campos';
import {
  CONDUCTA_MIN_CARACTERES,
  DIAS_INCAPACIDAD_MAX,
  erroresIncapacidad,
  fechaFinIncapacidad,
  hoyLocal,
  type CampoIncapacidad,
} from '../utils/validaciones';

export type { PlanManejoData, IncapacidadMedicaData };

export const TIPOS_INCAPACIDAD: { valor: TipoIncapacidad; etiqueta: string }[] = [
  { valor: 'ENFERMEDAD_GENERAL', etiqueta: 'Enfermedad general' },
  { valor: 'ENFERMEDAD_LABORAL', etiqueta: 'Enfermedad laboral' },
  { valor: 'ACCIDENTE_TRABAJO', etiqueta: 'Accidente de trabajo' },
  { valor: 'ACCIDENTE_TRANSITO', etiqueta: 'Accidente de tránsito' },
  { valor: 'LICENCIA_MATERNIDAD', etiqueta: 'Licencia de maternidad' },
  { valor: 'LICENCIA_PATERNIDAD', etiqueta: 'Licencia de paternidad' },
];

export const MODALIDADES_SERVICIO: { valor: ModalidadServicio; etiqueta: string }[] = [
  { valor: 'INTRAMURAL', etiqueta: 'Intramural' },
  { valor: 'EXTRAMURAL', etiqueta: 'Extramural' },
  { valor: 'TELEMEDICINA', etiqueta: 'Telemedicina' },
];

const formatoFecha = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '—');
const aEntero = (texto: string): number | undefined => (texto.trim() === '' ? undefined : Number(texto));

export const PlanManejoModule: React.FC<SubmoduloProps<PlanManejoData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  const inc = data.incapacidad ?? {};
  // Todo se deriva de `data` en cada render. Mientras se diligencia, un campo
  // solo muestra su error si ya tiene valor: lo que falta se exige al cierre.
  const errores = erroresIncapacidad(inc);
  const errorVisible = (campo: CampoIncapacidad) => {
    const valor = inc[campo];
    return valor !== undefined && valor !== '' ? errores[campo] : undefined;
  };
  const conductaCorta =
    (data.conducta ?? '').trim() !== '' && (data.conducta ?? '').trim().length < CONDUCTA_MIN_CARACTERES;

  // La incapacidad se emite completa (clon con el cambio) dentro del objeto del plan.
  const cambiarIncapacidad = (cambios: Partial<IncapacidadMedicaData>) => {
    const siguiente = { ...inc, ...cambios };
    onChange({ incapacidad: { ...siguiente, fechaFin: fechaFinIncapacidad(siguiente.fechaInicio, siguiente.dias) } });
  };

  const mensaje = (campo: CampoIncapacidad) => {
    const error = errorVisible(campo);
    return error ? <p role="alert" className={ESTILO_ERROR_MSG}>{error}</p> : null;
  };

  const radiosSiNo = (campo: 'esProrroga' | 'esRetroactiva', etiqueta: string) => (
    <fieldset className="space-y-1 min-w-0 border-0 p-0 m-0">
      <legend className={ESTILO_LABEL}>
        {etiqueta} <span className="text-danger">*</span>
      </legend>
      <div className="flex items-center gap-4 h-10">
        {([true, false] as const).map((valor) => (
          <label key={String(valor)} className="flex items-center gap-1.5 text-sm text-secondary">
            <input
              type="radio"
              name={`incap-${campo}`}
              checked={inc[campo] === valor}
              onChange={() => cambiarIncapacidad({ [campo]: valor })}
              className="text-primary focus:ring-primary/40"
            />
            {valor ? 'Sí' : 'No'}
          </label>
        ))}
      </div>
      {mensaje(campo)}
    </fieldset>
  );

  return (
    <fieldset disabled={readOnly} className="space-y-5 min-w-0 border-0 p-0 m-0">
      {/* 1. Conducta médica */}
      <div className="space-y-1.5">
        <label htmlFor="pm-conducta" className={`${ESTILO_LABEL} flex items-center gap-1.5`}>
          <ClipboardList size={14} className="text-primary" /> Conducta Médica / Plan de Acción{' '}
          <span className="text-danger">*</span>
        </label>
        <textarea
          id="pm-conducta"
          value={data.conducta ?? ''}
          onChange={(e) => onChange({ conducta: e.target.value })}
          rows={3}
          aria-invalid={conductaCorta}
          placeholder="Conducta terapéutica, plan farmacológico, solicitudes paraclínicas, remisiones o controles..."
          className={clasesCampo(ESTILO_TEXTAREA, conductaCorta && ESTILO_CAMPO_ERROR)}
        />
        {conductaCorta && (
          <p role="alert" className={ESTILO_ERROR_MSG}>
            Describa la conducta médica (mínimo {CONDUCTA_MIN_CARACTERES} caracteres).
          </p>
        )}
      </div>

      {/* 2. Recomendaciones */}
      <div className="space-y-1.5">
        <label htmlFor="pm-recomendaciones" className={`${ESTILO_LABEL} flex items-center gap-1.5`}>
          <FileText size={14} className="text-primary" /> Recomendaciones Generales
        </label>
        <textarea
          id="pm-recomendaciones"
          value={data.recomendaciones ?? ''}
          onChange={(e) => onChange({ recomendaciones: e.target.value })}
          rows={3}
          placeholder="Indicaciones higiénico-dietéticas, actividad física, cuidados domiciliarios..."
          className={ESTILO_TEXTAREA}
        />
      </div>

      {/* 3. Signos de alarma */}
      <div className="bg-warning/5 border border-warning/20 rounded-xl p-3.5 space-y-1.5">
        <label htmlFor="pm-signos-alarma" className="text-xs font-bold text-warning uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle size={14} /> Signos de Alarma / Cuándo acudir a urgencias
        </label>
        <textarea
          id="pm-signos-alarma"
          value={data.signosAlarma ?? ''}
          onChange={(e) => onChange({ signosAlarma: e.target.value })}
          rows={2}
          placeholder="Consultar a urgencias en caso de fiebre persistente >38.5°C, dificultad respiratoria, dolor torácico..."
          className={clasesCampo(ESTILO_TEXTAREA, '!border-warning/30 focus:!border-warning focus:!ring-warning/40')}
        />
      </div>

      {/* 4. Certificado de incapacidad */}
      <div className="bg-subtle/50 border border-border rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FileHeart size={16} className="text-primary" />
            <div>
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Incapacidad Médica</h4>
              <p className="text-[11px] text-muted">¿La condición clínica amerita reposo laboral o escolar?</p>
            </div>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              id="pm-incapacidad-requiere"
              checked={Boolean(inc.requiere)}
              onChange={(e) => cambiarIncapacidad({ requiere: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-xs font-semibold text-primary">Otorgar incapacidad</span>
          </label>
        </div>

        {inc.requiere && (
          <div className="pt-3 border-t border-border/70 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="incap-tipo" className={ESTILO_LABEL}>
                Tipo de incapacidad <span className="text-danger">*</span>
              </label>
              <select
                id="incap-tipo"
                value={inc.tipoIncapacidad ?? ''}
                onChange={(e) => cambiarIncapacidad({ tipoIncapacidad: (e.target.value || undefined) as TipoIncapacidad | undefined })}
                className={ESTILO_SELECT}
              >
                <option value="">Seleccione…</option>
                {TIPOS_INCAPACIDAD.map((t) => (
                  <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="incap-modalidad" className={ESTILO_LABEL}>
                Modalidad del servicio <span className="text-danger">*</span>
              </label>
              <select
                id="incap-modalidad"
                value={inc.modalidadServicio ?? ''}
                onChange={(e) =>
                  cambiarIncapacidad({ modalidadServicio: (e.target.value || undefined) as ModalidadServicio | undefined })
                }
                className={ESTILO_SELECT}
              >
                <option value="">Seleccione…</option>
                {MODALIDADES_SERVICIO.map((m) => (
                  <option key={m.valor} value={m.valor}>{m.etiqueta}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="incap-inicio" className={ESTILO_LABEL}>
                Fecha de inicio <span className="text-danger">*</span>
              </label>
              <input
                id="incap-inicio"
                type="date"
                value={inc.fechaInicio ?? ''}
                // Sugiere retroactiva si inicia antes de hoy; el médico puede corregirla.
                onChange={(e) =>
                  cambiarIncapacidad({
                    fechaInicio: e.target.value || undefined,
                    esRetroactiva: e.target.value ? e.target.value < hoyLocal() : inc.esRetroactiva,
                  })
                }
                aria-invalid={Boolean(errorVisible('fechaInicio'))}
                className={clasesCampo(ESTILO_INPUT, errorVisible('fechaInicio') && ESTILO_CAMPO_ERROR)}
              />
              {mensaje('fechaInicio')}
            </div>

            <div className="space-y-1">
              <label htmlFor="incap-dias" className={ESTILO_LABEL}>
                Número de días <span className="text-danger">*</span>
              </label>
              <input
                id="incap-dias"
                type="number"
                min={1}
                max={DIAS_INCAPACIDAD_MAX}
                step={1}
                inputMode="numeric"
                value={inc.dias ?? ''}
                onChange={(e) => cambiarIncapacidad({ dias: aEntero(e.target.value) })}
                aria-invalid={Boolean(errorVisible('dias'))}
                className={clasesCampo(ESTILO_INPUT, errorVisible('dias') && ESTILO_CAMPO_ERROR)}
              />
              {mensaje('dias')}
            </div>

            <div className="space-y-1">
              <span className={ESTILO_LABEL}>Fecha de finalización</span>
              <p data-testid="incap-fecha-fin" className="h-10 flex items-center gap-1.5 text-sm text-secondary">
                <CalendarRange size={14} className="text-primary" />
                {formatoFecha(fechaFinIncapacidad(inc.fechaInicio, inc.dias))}
              </p>
            </div>

            {radiosSiNo('esProrroga', 'Prórroga')}
            {radiosSiNo('esRetroactiva', 'Incapacidad retroactiva')}

            <div className="space-y-1">
              <label htmlFor="incap-cie" className={ESTILO_LABEL}>
                Diagnóstico CIE-10 <span className="text-danger">*</span>
              </label>
              <input
                id="incap-cie"
                value={inc.codigoCie10 ?? ''}
                onChange={(e) => cambiarIncapacidad({ codigoCie10: e.target.value.toUpperCase() })}
                maxLength={6}
                placeholder="Ej: J06.9"
                aria-invalid={Boolean(errorVisible('codigoCie10'))}
                className={clasesCampo(ESTILO_INPUT, 'font-mono', errorVisible('codigoCie10') && ESTILO_CAMPO_ERROR)}
              />
              {mensaje('codigoCie10')}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label htmlFor="incap-cie-desc" className={ESTILO_LABEL}>
                Descripción del diagnóstico
              </label>
              <input
                id="incap-cie-desc"
                value={inc.descripcionDiagnostico ?? ''}
                onChange={(e) => cambiarIncapacidad({ descripcionDiagnostico: e.target.value })}
                placeholder="Ej: Infección aguda de las vías respiratorias superiores"
                className={ESTILO_INPUT}
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <label htmlFor="incap-obs" className={ESTILO_LABEL}>
                Observación de la incapacidad <span className="text-danger">*</span>
              </label>
              <textarea
                id="incap-obs"
                rows={3}
                value={inc.observaciones ?? ''}
                onChange={(e) => cambiarIncapacidad({ observaciones: e.target.value })}
                placeholder="Justificación clínica y recomendaciones durante la incapacidad"
                className={ESTILO_TEXTAREA}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="incap-ciudad" className={ESTILO_LABEL}>Ciudad donde labora</label>
              <input
                id="incap-ciudad"
                value={inc.ciudadLabora ?? ''}
                onChange={(e) => cambiarIncapacidad({ ciudadLabora: e.target.value })}
                maxLength={120}
                className={ESTILO_INPUT}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label htmlFor="incap-dependencia" className={ESTILO_LABEL}>Dependencia</label>
              <input
                id="incap-dependencia"
                value={inc.dependencia ?? ''}
                onChange={(e) => cambiarIncapacidad({ dependencia: e.target.value })}
                maxLength={120}
                placeholder="Área o dependencia donde labora el paciente"
                className={ESTILO_INPUT}
              />
            </div>
          </div>
        )}
      </div>
    </fieldset>
  );
};

export default PlanManejoModule;
