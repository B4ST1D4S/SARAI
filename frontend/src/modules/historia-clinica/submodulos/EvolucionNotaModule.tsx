import React from 'react';
import { FileEdit } from 'lucide-react';
import type { SubmoduloProps } from '../registry';
import { ESTILO_CAMPO_ERROR, ESTILO_ERROR_MSG, ESTILO_LABEL, ESTILO_TEXTAREA, clasesCampo } from '../components/common/campos';
import { REGLAS_EVOLUCION_NOTA, errorDeTexto } from '../utils/validaciones';

/** Clave alineada con draft.datos.evolucion_nota del Workbench. */
export interface EvolucionNotaData {
  notaEvolucion?: string;
}

/**
 * Nota de evolución clínica (Res. 1995/1999): evolución desde el último
 * control. No toca la enfermedad actual, que pertenece a MotivoConsultaModule.
 */
export const EvolucionNotaModule: React.FC<SubmoduloProps<EvolucionNotaData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  // Error derivado de `data`, sin estado local.
  const error = errorDeTexto(data.notaEvolucion, REGLAS_EVOLUCION_NOTA.notaEvolucion);

  return (
    <div className="space-y-1.5">
      <label htmlFor="evolucion_nota" className={`${ESTILO_LABEL} flex items-center gap-1.5`}>
        <FileEdit size={14} className="text-primary" />
        Nota de evolución clínica
      </label>
      <textarea
        id="evolucion_nota"
        value={data.notaEvolucion ?? ''}
        onChange={(e) => onChange({ notaEvolucion: e.target.value })}
        disabled={readOnly}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'evolucion_nota_error' : undefined}
        rows={6}
        placeholder="Evolución desde el último control, respuesta al tratamiento, hallazgos relevantes y adherencia..."
        className={clasesCampo(ESTILO_TEXTAREA, error && ESTILO_CAMPO_ERROR)}
      />
      {error && (
        <span id="evolucion_nota_error" role="alert" className={`block ${ESTILO_ERROR_MSG}`}>
          {error}
        </span>
      )}
    </div>
  );
};

export default EvolucionNotaModule;
