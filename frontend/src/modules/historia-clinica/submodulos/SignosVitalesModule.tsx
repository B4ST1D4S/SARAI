import React from 'react';
import { Activity, Heart, Wind, Thermometer, Droplet, Scale, Ruler, AlertTriangle, CheckCircle2, type LucideIcon } from 'lucide-react';
import type { SubmoduloProps } from '../registry';
import { ESTILO_ERROR_MSG, ESTILO_INPUT, ESTILO_LABEL, clasesCampo } from '../components/common/campos';
import {
  calcularImc,
  clasificarImc,
  errorRangoSigno,
  evaluarSignosVitales,
  type AlertaSigno,
  type CampoSigno,
  type NivelAlerta,
  type SignosVitalesMedidos,
} from '../utils/validaciones';

/** Claves alineadas con draft.datos.signos_vitales del Workbench. */
export interface SignosVitalesData extends SignosVitalesMedidos {
  /** Copia derivada de peso y talla, para que el borrador la persista; la UI siempre la recalcula. */
  imc?: number;
  perimetroAbdominal?: number;
}

const BORDE_ALERTA: Record<NivelAlerta, string> = {
  ambar: '!border-warning bg-warning/5',
  rojo: '!border-danger bg-danger/5',
};

const BANNER_ALERTA: Record<NivelAlerta, string> = {
  ambar: 'bg-warning/10 text-warning border-warning/20',
  rojo: 'bg-danger/10 text-danger border-danger/20',
};

/** '' del input → undefined (sin dato); cualquier otro texto → número, aceptando coma decimal. */
const aNumero = (texto: string): number | undefined => {
  const limpio = texto.trim().replace(',', '.');
  if (limpio === '') return undefined;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : undefined;
};

interface CampoProps {
  campo: CampoSigno;
  etiqueta: string;
  unidad: string;
  icono: LucideIcon;
  placeholder: string;
  step?: string;
  data: SignosVitalesData;
  alerta?: AlertaSigno;
  onValor: (campo: CampoSigno, valor: number | undefined) => void;
}

function CampoSignoVital({ campo, etiqueta, unidad, icono: Icono, placeholder, step, data, alerta, onValor }: CampoProps) {
  const error = errorRangoSigno(campo, data[campo]);
  const id = `sv-${campo}`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={`${ESTILO_LABEL} flex items-center gap-1`}>
        <Icono size={12} className="text-primary" /> {etiqueta}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          step={step}
          inputMode="decimal"
          value={data[campo] ?? ''}
          onChange={(e) => onValor(campo, aNumero(e.target.value))}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder={placeholder}
          className={clasesCampo(ESTILO_INPUT, 'font-semibold pr-10', alerta && BORDE_ALERTA[alerta.nivel], error && '!border-danger')}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-muted">{unidad}</span>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className={ESTILO_ERROR_MSG}>
          {error}
        </p>
      )}
    </div>
  );
}

export const SignosVitalesModule: React.FC<SubmoduloProps<SignosVitalesData>> = ({
  data = {},
  onChange,
  readOnly = false,
}) => {
  // Todo se deriva de `data` en cada render: sin useState ni useEffect.
  const imc = calcularImc(data.pesoKg, data.tallaCm);
  const clasificacion = clasificarImc(imc);
  const alertas = evaluarSignosVitales(data);
  const listaAlertas = Object.values(alertas).filter((a): a is AlertaSigno => Boolean(a));
  const hayMedicion = (['paSistolica', 'paDiastolica', 'fc', 'spo2', 'temp'] as CampoSigno[]).some((c) => data[c] !== undefined);
  const nivelBanner: NivelAlerta = listaAlertas.some((a) => a.nivel === 'rojo') ? 'rojo' : 'ambar';

  // Peso y talla viajan con su IMC recalculado en el mismo parche.
  const onValor = (campo: CampoSigno, valor: number | undefined) => {
    if (campo === 'pesoKg' || campo === 'tallaCm') {
      const siguiente = { ...data, [campo]: valor };
      onChange({ [campo]: valor, imc: calcularImc(siguiente.pesoKg, siguiente.tallaCm) ?? undefined });
    } else {
      onChange({ [campo]: valor });
    }
  };

  const comunes = { data, onValor };

  return (
    <fieldset disabled={readOnly} className="space-y-4 min-w-0 border-0 p-0 m-0">
      {/* Banner de semáforo clínico (informativo, no bloquea el cierre) */}
      {listaAlertas.length > 0 ? (
        <div role="status" className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${BANNER_ALERTA[nivelBanner]}`}>
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{listaAlertas.map((a) => a.mensaje).join(' · ')}</span>
        </div>
      ) : (
        hayMedicion && (
          <div role="status" className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold bg-success/10 text-success border-success/20">
            <CheckCircle2 size={14} /> Signos vitales dentro de rangos esperados
          </div>
        )
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Tensión arterial: dos campos con una sola alerta */}
        <div className="col-span-2 md:col-span-1 space-y-1">
          <span className={`${ESTILO_LABEL} flex items-center gap-1`}>
            <Activity size={12} className="text-primary" /> T. Arterial (mmHg)
          </span>
          <div className="flex items-center gap-2">
            {(['paSistolica', 'paDiastolica'] as const).map((campo, i) => (
              <React.Fragment key={campo}>
                {i === 1 && <span className="text-muted font-light text-lg">/</span>}
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label={campo === 'paSistolica' ? 'Tensión sistólica' : 'Tensión diastólica'}
                  value={data[campo] ?? ''}
                  onChange={(e) => onValor(campo, aNumero(e.target.value))}
                  aria-invalid={Boolean(errorRangoSigno(campo, data[campo]))}
                  placeholder={campo === 'paSistolica' ? '120' : '80'}
                  className={clasesCampo(
                    ESTILO_INPUT,
                    'font-semibold text-center',
                    alertas.tension && BORDE_ALERTA[alertas.tension.nivel],
                    errorRangoSigno(campo, data[campo]) && '!border-danger',
                  )}
                />
              </React.Fragment>
            ))}
          </div>
          {(['paSistolica', 'paDiastolica'] as const).map((campo) => {
            const error = errorRangoSigno(campo, data[campo]);
            return error ? <p key={campo} role="alert" className={ESTILO_ERROR_MSG}>{error}</p> : null;
          })}
        </div>

        <CampoSignoVital campo="fc" etiqueta="F. Cardíaca" unidad="lpm" icono={Heart} placeholder="75" alerta={alertas.frecuenciaCardiaca} {...comunes} />
        <CampoSignoVital campo="fr" etiqueta="F. Respiratoria" unidad="rpm" icono={Wind} placeholder="16" {...comunes} />
        <CampoSignoVital campo="temp" etiqueta="Temperatura" unidad="°C" icono={Thermometer} placeholder="36.5" step="0.1" alerta={alertas.temperatura} {...comunes} />
        <CampoSignoVital campo="spo2" etiqueta="SpO2" unidad="%" icono={Droplet} placeholder="98" alerta={alertas.saturacion} {...comunes} />
        <CampoSignoVital campo="pesoKg" etiqueta="Peso" unidad="kg" icono={Scale} placeholder="70" step="0.1" {...comunes} />
        <CampoSignoVital campo="tallaCm" etiqueta="Talla" unidad="cm" icono={Ruler} placeholder="170" {...comunes} />

        {/* IMC derivado de peso y talla */}
        <div className="space-y-1">
          <span className={ESTILO_LABEL}>IMC</span>
          <div className="h-10 px-3 rounded-xl border border-border bg-subtle/50 flex items-center justify-between">
            <span className="text-sm font-bold text-primary" aria-label="Índice de masa corporal">{imc ?? '--'}</span>
            <span className="text-[9px] text-muted">kg/m²</span>
          </div>
          {clasificacion && (
            <span
              className={`text-[10px] font-semibold ${
                clasificacion.nivel === 'normal' ? 'text-success' : clasificacion.nivel === 'ambar' ? 'text-warning' : 'text-danger'
              }`}
            >
              {clasificacion.mensaje}
            </span>
          )}
        </div>
      </div>
    </fieldset>
  );
};

export default SignosVitalesModule;
