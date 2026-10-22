import React from 'react';
import { Scissors } from 'lucide-react';
import type { ProcedimientoItem, SolicitudProcedimientosData } from '@/types/historiaClinica.types';
import type { SubmoduloProps } from '../registry';
import { ESTILO_LABEL, ESTILO_SELECT } from '../components/common/campos';
import { ListaOrdenesCups, nuevoIdOrden } from './SolicitudAyudasDiagModule';

export type { ProcedimientoItem, SolicitudProcedimientosData };

type AmbitoProcedimiento = NonNullable<ProcedimientoItem['tipoAmbito']>;

const AMBITOS: { valor: AmbitoProcedimiento; etiqueta: string }[] = [
  { valor: 'AMBULATORIO', etiqueta: 'Ambulatorio' },
  { valor: 'HOSPITALARIO', etiqueta: 'Hospitalario' },
  { valor: 'URGENCIAS', etiqueta: 'Urgencias' },
  { valor: 'QUIRURGICO', etiqueta: 'Quirúrgico' },
];

const procedimientoVacio = (): ProcedimientoItem => ({
  id: nuevoIdOrden('proc'),
  codigoCups: '',
  descripcion: '',
  cantidad: 1,
  justificacion: '',
  tipoAmbito: 'AMBULATORIO',
});

/** Solicitud de procedimientos quirúrgicos o ambulatorios (CUPS). */
export const SolicitudProcedimientosModule: React.FC<SubmoduloProps<SolicitudProcedimientosData>> = (props) => (
  <ListaOrdenesCups<ProcedimientoItem>
    {...props}
    titulo="Solicitud de Procedimientos"
    icono={Scissors}
    unidad={['procedimiento', 'procedimientos']}
    textoAgregar="Agregar procedimiento"
    prefijoId="proc"
    ordenVacia={procedimientoVacio}
    placeholderCodigo="Ej: 890201"
    placeholderDescripcion="Ej: Cauterización, Resección de lesión..."
    placeholderJustificacion="Justificación del procedimiento, diagnóstico asociado o técnica propuesta..."
    placeholderObservaciones="Condiciones previas, consentimiento informado, preparación o anestesia..."
    camposExtra={(orden, index, actualizar) => (
      <div className="w-full md:w-36 space-y-1">
        <label htmlFor={`proc-ambito-${index}`} className={ESTILO_LABEL}>
          Ámbito
        </label>
        <select
          id={`proc-ambito-${index}`}
          value={orden.tipoAmbito ?? 'AMBULATORIO'}
          onChange={(e) => actualizar({ tipoAmbito: e.target.value as AmbitoProcedimiento })}
          className={ESTILO_SELECT}
        >
          {AMBITOS.map((a) => (
            <option key={a.valor} value={a.valor}>
              {a.etiqueta}
            </option>
          ))}
        </select>
      </div>
    )}
  />
);

export default SolicitudProcedimientosModule;
