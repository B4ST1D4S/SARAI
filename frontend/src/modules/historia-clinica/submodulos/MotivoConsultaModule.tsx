import React from 'react';
import { User, AlignLeft } from 'lucide-react';
import type { SubmoduloProps } from '../registry';
import { ESTILO_CAMPO_ERROR, ESTILO_ERROR_MSG, ESTILO_INPUT, ESTILO_LABEL, ESTILO_TEXTAREA, clasesCampo } from '../components/common/campos';
import { REGLAS_MOTIVO_CONSULTA, errorDeTexto } from '../utils/validaciones';

// Reexportado para no romper los imports existentes desde este módulo.
export { REGLAS_MOTIVO_CONSULTA };

/** Claves alineadas con draft.datos.motivo_consulta del Workbench. */
export interface MotivoConsultaData {
  motivo?: string;
  enfermedadActual?: string;
}

export const MotivoConsultaModule: React.FC<SubmoduloProps<MotivoConsultaData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  // Errores derivados de `data`, sin estado local.
  const errorMotivo = errorDeTexto(data.motivo, REGLAS_MOTIVO_CONSULTA.motivo);
  const errorEnfermedad = errorDeTexto(data.enfermedadActual, REGLAS_MOTIVO_CONSULTA.enfermedadActual);

  return (
    <div className="space-y-5">
      {/* Motivo de Consulta */}
      <div className="space-y-1.5">
        <label htmlFor="motivo_consulta" className={`${ESTILO_LABEL} flex items-center gap-1.5`}>
          <User size={14} className="text-primary" />
          Motivo de Consulta (Textual del paciente) <span className="text-danger">*</span>
        </label>
        <input
          id="motivo_consulta"
          value={data.motivo ?? ''}
          onChange={(e) => onChange({ motivo: e.target.value })}
          disabled={readOnly}
          aria-invalid={Boolean(errorMotivo)}
          aria-describedby={errorMotivo ? 'motivo_consulta_error' : undefined}
          placeholder='Ej: "Me duele mucho la cabeza desde ayer"'
          className={clasesCampo(ESTILO_INPUT, errorMotivo && ESTILO_CAMPO_ERROR)}
        />
        {errorMotivo && (
          <span id="motivo_consulta_error" role="alert" className={`block ${ESTILO_ERROR_MSG}`}>
            {errorMotivo}
          </span>
        )}
      </div>

      {/* Enfermedad Actual */}
      <div className="space-y-1.5">
        <label htmlFor="enfermedad_actual" className={`${ESTILO_LABEL} flex items-center gap-1.5`}>
          <AlignLeft size={14} className="text-primary" />
          Enfermedad Actual <span className="text-danger">*</span>
        </label>
        <textarea
          id="enfermedad_actual"
          value={data.enfermedadActual ?? ''}
          onChange={(e) => onChange({ enfermedadActual: e.target.value })}
          disabled={readOnly}
          aria-invalid={Boolean(errorEnfermedad)}
          aria-describedby={errorEnfermedad ? 'enfermedad_actual_error' : undefined}
          rows={4}
          placeholder="Describa el cuadro clínico, cronología, síntomas asociados..."
          className={clasesCampo(ESTILO_TEXTAREA, errorEnfermedad && ESTILO_CAMPO_ERROR)}
        />
        {errorEnfermedad && (
          <span id="enfermedad_actual_error" role="alert" className={`block ${ESTILO_ERROR_MSG}`}>
            {errorEnfermedad}
          </span>
        )}
      </div>
    </div>
  );
};

export default MotivoConsultaModule;
