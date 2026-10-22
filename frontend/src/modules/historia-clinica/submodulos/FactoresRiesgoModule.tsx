import React from 'react';
import { Flame, Wine, Dumbbell, Factory } from 'lucide-react';
import type { FactoresRiesgoData } from '@/types/historiaClinica.types';
import type { SubmoduloProps } from '../registry';
import { ESTILO_INPUT, ESTILO_LABEL, ESTILO_SELECT } from '../components/common/campos';

export type { FactoresRiesgoData };

const TARJETA = 'p-3.5 rounded-xl bg-subtle/40 border border-border space-y-2';
const TITULO = 'text-xs font-bold text-primary flex items-center gap-1.5';

/** '' del input o del select → undefined (no registrado). */
const opcional = <T extends string>(valor: string): T | undefined => (valor === '' ? undefined : (valor as T));
const aDecimal = (texto: string): number | undefined => {
  const limpio = texto.trim().replace(',', '.');
  return limpio === '' ? undefined : Number(limpio);
};

export const FactoresRiesgoModule: React.FC<SubmoduloProps<FactoresRiesgoData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  const fuma = data.tabaquismo === 'CURRENT' || data.tabaquismo === 'FORMER';

  return (
    <fieldset disabled={readOnly} className="space-y-4 min-w-0 border-0 p-0 m-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tabaquismo (LOINC 72166-2) */}
        <div className={TARJETA}>
          <label htmlFor="fr-tabaquismo" className={TITULO}>
            <Flame size={14} className="text-warning" /> Tabaquismo
          </label>
          <select
            id="fr-tabaquismo"
            value={data.tabaquismo ?? ''}
            onChange={(e) => {
              const tabaquismo = opcional<NonNullable<FactoresRiesgoData['tabaquismo']>>(e.target.value);
              // El índice paquetes/año solo aplica a fumadores activos o exfumadores.
              const aplicaIndice = tabaquismo === 'CURRENT' || tabaquismo === 'FORMER';
              onChange(aplicaIndice ? { tabaquismo } : { tabaquismo, paquetesAnio: undefined });
            }}
            className={ESTILO_SELECT}
          >
            <option value="">Sin registrar</option>
            <option value="NEVER">Nunca ha fumado</option>
            <option value="FORMER">Exfumador</option>
            <option value="CURRENT">Fumador activo</option>
          </select>
          {fuma && (
            <div className="space-y-1 pt-1">
              <label htmlFor="fr-paquetes" className={ESTILO_LABEL}>
                Índice paquetes/año
              </label>
              <input
                id="fr-paquetes"
                type="number"
                step="0.1"
                min={0}
                inputMode="decimal"
                value={data.paquetesAnio ?? ''}
                onChange={(e) => onChange({ paquetesAnio: aDecimal(e.target.value) })}
                placeholder="Ej: 10.5"
                className={ESTILO_INPUT}
              />
            </div>
          )}
        </div>

        {/* Consumo de alcohol (LOINC 11331-6) */}
        <div className={TARJETA}>
          <label htmlFor="fr-alcohol" className={TITULO}>
            <Wine size={14} className="text-primary" /> Ingesta de Alcohol
          </label>
          <select
            id="fr-alcohol"
            value={data.alcohol ?? ''}
            onChange={(e) => onChange({ alcohol: opcional(e.target.value) })}
            className={ESTILO_SELECT}
          >
            <option value="">Sin registrar</option>
            <option value="NUNCA">No consume (Abstemio)</option>
            <option value="OCASIONAL">Ocasional / Social</option>
            <option value="MODERADO">Semanal / Moderado</option>
            <option value="FRECUENTE">Frecuente / Alto riesgo</option>
          </select>
        </div>

        {/* Actividad física (LOINC 68516-4) */}
        <div className={TARJETA}>
          <label htmlFor="fr-actividad" className={TITULO}>
            <Dumbbell size={14} className="text-primary" /> Actividad Física
          </label>
          <select
            id="fr-actividad"
            value={data.actividadFisica ?? ''}
            onChange={(e) => onChange({ actividadFisica: opcional(e.target.value) })}
            className={ESTILO_SELECT}
          >
            <option value="">Sin registrar</option>
            <option value="SEDENTARIO">Sedentario (&lt;30 min/semana)</option>
            <option value="LIGERO">Ligero (1-2 veces/semana)</option>
            <option value="MODERADO">Moderado (&ge;150 min/semana)</option>
            <option value="ACTIVO">Intenso / Atleta</option>
          </select>
        </div>
      </div>

      {/* Riesgo ocupacional / exposición */}
      <div className={TARJETA}>
        <label htmlFor="fr-exposicion" className={TITULO}>
          <Factory size={14} className="text-muted" /> Exposición Ocupacional / Ambiental
        </label>
        <input
          id="fr-exposicion"
          value={data.exposicionOcupacional ?? ''}
          onChange={(e) => onChange({ exposicionOcupacional: e.target.value })}
          placeholder="Ej: Humo de leña / biomasa, asbesto, solventes, polvos minerales..."
          className={ESTILO_INPUT}
        />
      </div>
    </fieldset>
  );
};

export default FactoresRiesgoModule;
