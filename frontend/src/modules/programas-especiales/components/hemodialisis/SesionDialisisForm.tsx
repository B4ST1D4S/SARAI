import { useState } from 'react';
import { motion } from 'framer-motion';
import type {
  SesionHemodialisis,
  AccesoVascular,
  MaquinaDialisis,
  MedicamentoSesion,
  SignoVitalIntra,
} from '../../types';
import { ACCESO_LABELS, KTV_META, URR_META } from '../../types';

interface Props {
  inscripcionId: string;
  accesos: AccesoVascular[];
  maquinas: MaquinaDialisis[];
  sesionEditar?: SesionHemodialisis;
  onGuardar: (data: Partial<SesionHemodialisis>) => Promise<void>;
  onCancelar: () => void;
}

type Paso = 'preDialisis' | 'prescripcion' | 'anticoagulacion' | 'postDialisis' | 'medicamentos' | 'revision';

const PASOS: { id: Paso; label: string; icon: string }[] = [
  { id: 'preDialisis',    label: 'Pre-Diálisis',    icon: '📋' },
  { id: 'prescripcion',   label: 'Prescripción',    icon: '💊' },
  { id: 'anticoagulacion',label: 'Anticoagulación', icon: '🩸' },
  { id: 'postDialisis',   label: 'Post-Diálisis',   icon: '✅' },
  { id: 'medicamentos',   label: 'Medicamentos',    icon: '💉' },
  { id: 'revision',       label: 'Revisión',        icon: '📝' },
];

const INCIDENCIAS_OPCIONES = [
  'Hipotensión', 'Calambres', 'Náuseas', 'Vómitos', 'Cefalea',
  'Fiebre/Escalofrío', 'Sangrado acceso', 'Coagulación parcial',
  'Coagulación total', 'Desconexión accidental', 'Otro',
];

function Campo({
  label, unit, error, children, hint,
}: {
  label: string; unit?: string; error?: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-white/60 mb-1 font-medium">
        {label} {unit && <span className="text-white/30">({unit})</span>}
      </label>
      {children}
      {hint && <p className="text-white/30 text-xs mt-0.5">{hint}</p>}
      {error && <p className="text-red-400 text-xs mt-0.5">{error}</p>}
    </div>
  );
}

function Input({
  value, onChange, type = 'text', placeholder, min, max, step, disabled,
}: {
  value: any; onChange: (v: any) => void; type?: string; placeholder?: string;
  min?: number; max?: number; step?: number; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
        placeholder-white/20 focus:outline-none focus:border-[#00B4D8]/50 focus:bg-white/8 transition-colors
        disabled:opacity-40"
    />
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white
        focus:outline-none focus:border-[#00B4D8]/50 transition-colors"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// Calcular Kt/V Daugirdas 2ª generación
function calcularKtV(bunPre: number, bunPost: number, ufL: number, pesoPost: number, tiempoMin: number): number {
  const R = bunPost / bunPre;
  const ln = -Math.log(R - 0.008 * tiempoMin);
  const ktv = ln + (4 - 3.5 * R) * (ufL / pesoPost);
  return Math.round(ktv * 100) / 100;
}

function calcularURR(bunPre: number, bunPost: number): number {
  return Math.round(((bunPre - bunPost) / bunPre) * 100 * 10) / 10;
}

export function SesionDialisisForm({ inscripcionId, accesos, maquinas, sesionEditar, onGuardar, onCancelar }: Props) {
  const [paso, setPaso] = useState<Paso>('preDialisis');
  const [guardando, setGuardando] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado del formulario
  const [form, setForm] = useState<Partial<SesionHemodialisis>>({
    inscripcionId,
    fechaSesion: sesionEditar?.fechaSesion ?? new Date().toISOString().slice(0, 16),
    turno: sesionEditar?.turno ?? undefined,
    nefrologo: sesionEditar?.nefrologo ?? '',
    enfermero: sesionEditar?.enfermero ?? '',
    maquinaId: sesionEditar?.maquinaId ?? '',
    codigoMaquina: sesionEditar?.codigoMaquina ?? '',
    accesoVascularId: sesionEditar?.accesoVascularId ?? '',
    sillon: sesionEditar?.sillon ?? '',
    // Pre
    pesoPre: sesionEditar?.pesoPre ?? undefined,
    pesoSeco: sesionEditar?.pesoSeco ?? undefined,
    taSistolicaPre: sesionEditar?.taSistolicaPre ?? undefined,
    taDiastolicaPre: sesionEditar?.taDiastolicaPre ?? undefined,
    frecCardiacaPre: sesionEditar?.frecCardiacaPre ?? undefined,
    temperaturaPre: sesionEditar?.temperaturaPre ?? undefined,
    saturacionO2Pre: sesionEditar?.saturacionO2Pre ?? undefined,
    // Prescripción
    tiempoPrescrito: sesionEditar?.tiempoPrescrito ?? 240,
    qbPrescrito: sesionEditar?.qbPrescrito ?? undefined,
    qdPrescrito: sesionEditar?.qdPrescrito ?? 500,
    ufPrescrita: sesionEditar?.ufPrescrita ?? undefined,
    filtroTipo: sesionEditar?.filtroTipo ?? '',
    filtroLote: sesionEditar?.filtroLote ?? '',
    filtroReutilizado: sesionEditar?.filtroReutilizado ?? false,
    filtroUsos: sesionEditar?.filtroUsos ?? undefined,
    concentracionDializado: sesionEditar?.concentracionDializado ?? '',
    temperaturaDializado: sesionEditar?.temperaturaDializado ?? 37,
    // Anticoagulación
    tipoAnticoagulacion: sesionEditar?.tipoAnticoagulacion ?? undefined,
    heparinaInicial: sesionEditar?.heparinaInicial ?? undefined,
    heparinaMantenimiento: sesionEditar?.heparinaMantenimiento ?? undefined,
    heparinaTotal: sesionEditar?.heparinaTotal ?? undefined,
    // Post
    tiempoReal: sesionEditar?.tiempoReal ?? undefined,
    qbReal: sesionEditar?.qbReal ?? undefined,
    ufReal: sesionEditar?.ufReal ?? undefined,
    ktVSesion: sesionEditar?.ktVSesion ?? undefined,
    urrSesion: sesionEditar?.urrSesion ?? undefined,
    pesoPost: sesionEditar?.pesoPost ?? undefined,
    taSistolicaPost: sesionEditar?.taSistolicaPost ?? undefined,
    taDiastolicaPost: sesionEditar?.taDiastolicaPost ?? undefined,
    frecCardiacaPost: sesionEditar?.frecCardiacaPost ?? undefined,
    temperaturaPost: sesionEditar?.temperaturaPost ?? undefined,
    saturacionO2Post: sesionEditar?.saturacionO2Post ?? undefined,
    toleranciaDialisis: sesionEditar?.toleranciaDialisis ?? undefined,
    estadoConciencia: sesionEditar?.estadoConciencia ?? 'CONSCIENTE',
    incidencias: sesionEditar?.incidencias ?? [],
    observaciones: sesionEditar?.observaciones ?? '',
    estadoSesion: sesionEditar?.estadoSesion ?? 'COMPLETADA',
    medicamentosSesion: sesionEditar?.medicamentosSesion ?? [],
    signosVitalesIntra: sesionEditar?.signosVitalesIntra ?? [],
  });

  // BUN para cálculo Kt/V
  const [bunPre, setBunPre] = useState<number | undefined>();
  const [bunPost, setBunPost] = useState<number | undefined>();
  const [ktVCalc, setKtVCalc] = useState<{ ktv: number; urr: number } | null>(null);

  const set = (field: keyof SesionHemodialisis, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleIncidencia = (inc: string) => {
    setForm((f) => ({
      ...f,
      incidencias: f.incidencias?.includes(inc)
        ? f.incidencias.filter((i) => i !== inc)
        : [...(f.incidencias ?? []), inc],
    }));
  };

  const calcularAdecuacion = () => {
    if (bunPre && bunPost && form.ufReal && form.pesoPost && form.tiempoReal) {
      const ktv = calcularKtV(bunPre, bunPost, form.ufReal, form.pesoPost, form.tiempoReal);
      const urr = calcularURR(bunPre, bunPost);
      setKtVCalc({ ktv, urr });
      set('ktVSesion', ktv);
      set('urrSesion', urr);
    }
  };

  const [errorGuardar, setErrorGuardar] = useState('');

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.pesoPre) e.pesoPre = 'Peso pre-diálisis es obligatorio';
    if (!form.fechaSesion) e.fechaSesion = 'Fecha de sesión es obligatoria';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGuardar = async () => {
    if (!validar()) { setPaso('preDialisis'); return; }
    setGuardando(true);
    setErrorGuardar('');
    try {
      await onGuardar(form);
    } catch (e: any) {
      setErrorGuardar(e.message ?? 'Error al guardar la sesión');
    } finally {
      setGuardando(false);
    }
  };

  const pasoActual = PASOS.findIndex((p) => p.id === paso);

  // ── Renderizado por paso ──────────────────────────────────

  const renderPaso = () => {
    switch (paso) {
      // ─────────── PRE-DIÁLISIS ───────────────────────────
      case 'preDialisis':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo label="Fecha y hora de sesión" error={errors.fechaSesion}>
                <Input type="datetime-local" value={form.fechaSesion?.slice(0,16)} onChange={(v) => set('fechaSesion', v)} />
              </Campo>
              <Campo label="Turno">
                <Select
                  value={form.turno ?? ''}
                  onChange={(v) => set('turno', v as any)}
                  placeholder="Seleccionar turno"
                  options={[
                    { value: 'MANANA', label: '☀️ Mañana' },
                    { value: 'TARDE',  label: '🌤️ Tarde' },
                    { value: 'NOCHE',  label: '🌙 Noche' },
                  ]}
                />
              </Campo>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo label="Nefrólogo tratante">
                <Input value={form.nefrologo} onChange={(v) => set('nefrologo', v)} placeholder="Nombre del nefrólogo" />
              </Campo>
              <Campo label="Enfermero/a">
                <Input value={form.enfermero} onChange={(v) => set('enfermero', v)} placeholder="Nombre del enfermero/a" />
              </Campo>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Campo label="Máquina">
                <Select
                  value={form.maquinaId ?? ''}
                  onChange={(v) => {
                    const m = maquinas.find((m) => m.id === v);
                    set('maquinaId', v);
                    if (m) set('codigoMaquina', m.codigo);
                  }}
                  placeholder="Seleccionar máquina"
                  options={maquinas.map((m) => ({ value: m.id, label: `${m.codigo} – ${m.marca}` }))}
                />
              </Campo>
              <Campo label="Sillón">
                <Input value={form.sillon} onChange={(v) => set('sillon', v)} placeholder="Ej: A1, B3..." />
              </Campo>
              <Campo label="Acceso Vascular">
                <Select
                  value={form.accesoVascularId ?? ''}
                  onChange={(v) => set('accesoVascularId', v)}
                  placeholder="Seleccionar acceso"
                  options={accesos
                    .filter((a) => a.estado === 'ACTIVO')
                    .map((a) => ({
                      value: a.id,
                      label: `${ACCESO_LABELS[a.tipo] ?? a.tipo} ${a.lateralidad ?? ''}`.trim(),
                    }))}
                />
              </Campo>
            </div>

            <div className="p-3 bg-[#00B4D8]/5 border border-[#00B4D8]/20 rounded-xl">
              <p className="text-[#00B4D8] text-xs font-semibold mb-3">📊 Signos Vitales Pre-Diálisis</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <Campo label="Peso pre" unit="kg" error={errors.pesoPre}>
                  <Input type="number" step={0.1} min={30} max={200} value={form.pesoPre} onChange={(v) => set('pesoPre', v)} />
                </Campo>
                <Campo label="Peso seco" unit="kg" hint="Peso seco objetivo">
                  <Input type="number" step={0.1} min={30} max={200} value={form.pesoSeco} onChange={(v) => set('pesoSeco', v)} />
                </Campo>
                <Campo label="PA sistólica" unit="mmHg">
                  <Input type="number" min={60} max={250} value={form.taSistolicaPre} onChange={(v) => set('taSistolicaPre', v)} />
                </Campo>
                <Campo label="PA diastólica" unit="mmHg">
                  <Input type="number" min={40} max={150} value={form.taDiastolicaPre} onChange={(v) => set('taDiastolicaPre', v)} />
                </Campo>
                <Campo label="Frec. cardíaca" unit="lpm">
                  <Input type="number" min={30} max={200} value={form.frecCardiacaPre} onChange={(v) => set('frecCardiacaPre', v)} />
                </Campo>
                <Campo label="Temperatura" unit="°C">
                  <Input type="number" step={0.1} min={35} max={42} value={form.temperaturaPre} onChange={(v) => set('temperaturaPre', v)} />
                </Campo>
                <Campo label="SatO₂" unit="%">
                  <Input type="number" min={70} max={100} value={form.saturacionO2Pre} onChange={(v) => set('saturacionO2Pre', v)} />
                </Campo>
              </div>

              {form.pesoPre && form.pesoSeco && (
                <div className="mt-3 p-2 bg-white/5 rounded-lg">
                  <p className="text-xs text-white/60">
                    Ganancia inter-dialítica:{' '}
                    <span className={`font-bold ${(form.pesoPre - form.pesoSeco) > 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {(form.pesoPre - form.pesoSeco).toFixed(1)} kg
                    </span>
                    {(form.pesoPre - form.pesoSeco) > 3 && (
                      <span className="text-amber-400 ml-2">⚠️ Superior a 3 kg</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      // ─────────── PRESCRIPCIÓN ────────────────────────────
      case 'prescripcion':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Campo label="Tiempo prescrito" unit="min">
                <Input type="number" min={60} max={480} value={form.tiempoPrescrito} onChange={(v) => set('tiempoPrescrito', v)} />
              </Campo>
              <Campo label="Flujo sangre (QB)" unit="mL/min">
                <Input type="number" min={100} max={600} value={form.qbPrescrito} onChange={(v) => set('qbPrescrito', v)} />
              </Campo>
              <Campo label="Flujo dializado (QD)" unit="mL/min">
                <Input type="number" min={300} max={800} value={form.qdPrescrito} onChange={(v) => set('qdPrescrito', v)} />
              </Campo>
              <Campo label="UF prescrita" unit="L">
                <Input type="number" step={0.1} min={0} max={10} value={form.ufPrescrita} onChange={(v) => set('ufPrescrita', v)} />
              </Campo>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Campo label="Concentración dializante">
                <Input value={form.concentracionDializado} onChange={(v) => set('concentracionDializado', v)} placeholder="Ej: Bicarbonato 35 mEq/L" />
              </Campo>
              <Campo label="Temperatura dializante" unit="°C">
                <Input type="number" step={0.5} min={35} max={39} value={form.temperaturaDializado} onChange={(v) => set('temperaturaDializado', v)} />
              </Campo>
            </div>

            <div className="p-3 bg-white/3 border border-white/8 rounded-xl">
              <p className="text-white/60 text-xs font-semibold mb-3">🔬 Filtro / Dializador</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Campo label="Tipo de filtro">
                  <Input value={form.filtroTipo} onChange={(v) => set('filtroTipo', v)} placeholder="Ej: Polisulfona 1.8 m²" />
                </Campo>
                <Campo label="Lote filtro">
                  <Input value={form.filtroLote} onChange={(v) => set('filtroLote', v)} placeholder="Número de lote" />
                </Campo>
                <Campo label="¿Reutilizado?">
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={form.filtroReutilizado}
                      onChange={(e) => set('filtroReutilizado', e.target.checked)}
                      className="accent-[#00B4D8]"
                    />
                    <span className="text-white/70 text-sm">Sí, filtro reutilizado</span>
                  </div>
                </Campo>
                {form.filtroReutilizado && (
                  <Campo label="N.° de uso">
                    <Input type="number" min={1} max={20} value={form.filtroUsos} onChange={(v) => set('filtroUsos', v)} />
                  </Campo>
                )}
              </div>
            </div>
          </div>
        );

      // ─────────── ANTICOAGULACIÓN ─────────────────────────
      case 'anticoagulacion':
        return (
          <div className="space-y-4">
            <Campo label="Tipo de anticoagulación">
              <Select
                value={form.tipoAnticoagulacion ?? ''}
                onChange={(v) => set('tipoAnticoagulacion', v as any)}
                placeholder="Seleccionar tipo"
                options={[
                  { value: 'HEPARINA_NO_FRACCIONADA', label: 'Heparina no fraccionada (HNF)' },
                  { value: 'ENOXAPARINA',             label: 'Enoxaparina (HBPM)' },
                  { value: 'CITRATO',                 label: 'Citrato (anticoagulación regional)' },
                  { value: 'SIN_ANTICOAGULACION',     label: 'Sin anticoagulación (lavados salinos)' },
                ]}
              />
            </Campo>

            {form.tipoAnticoagulacion === 'HEPARINA_NO_FRACCIONADA' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
                <Campo label="Bolo inicial" unit="UI">
                  <Input type="number" min={0} max={10000} value={form.heparinaInicial} onChange={(v) => set('heparinaInicial', v)} />
                </Campo>
                <Campo label="Mantenimiento" unit="UI/h">
                  <Input type="number" min={0} max={2000} value={form.heparinaMantenimiento} onChange={(v) => set('heparinaMantenimiento', v)} />
                </Campo>
                <Campo label="Total sesión" unit="UI">
                  <Input type="number" min={0} max={30000} value={form.heparinaTotal} onChange={(v) => set('heparinaTotal', v)} />
                </Campo>
              </div>
            )}

            {form.tipoAnticoagulacion === 'ENOXAPARINA' && (
              <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
                <Campo label="Dosis Enoxaparina" unit="mg">
                  <Input type="number" step={0.5} min={0} max={200} value={form.heparinaTotal} onChange={(v) => set('heparinaTotal', v)} />
                </Campo>
              </div>
            )}

            {form.tipoAnticoagulacion === 'SIN_ANTICOAGULACION' && (
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-amber-300 text-xs">
                ⚠️ Recuerde registrar los lavados salinos periódicos en las observaciones.
              </div>
            )}
          </div>
        );

      // ─────────── POST-DIÁLISIS ───────────────────────────
      case 'postDialisis':
        return (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <p className="text-emerald-400 text-xs font-semibold mb-3">✅ Parámetros Logrados</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <Campo label="Tiempo real" unit="min">
                  <Input type="number" min={0} max={480} value={form.tiempoReal} onChange={(v) => set('tiempoReal', v)} />
                </Campo>
                <Campo label="QB real" unit="mL/min">
                  <Input type="number" min={50} max={600} value={form.qbReal} onChange={(v) => set('qbReal', v)} />
                </Campo>
                <Campo label="UF lograda" unit="L">
                  <Input type="number" step={0.1} min={0} max={10} value={form.ufReal} onChange={(v) => set('ufReal', v)} />
                </Campo>
              </div>
            </div>

            <div className="p-3 bg-[#00B4D8]/5 border border-[#00B4D8]/20 rounded-xl">
              <p className="text-[#00B4D8] text-xs font-semibold mb-3">📊 Signos Vitales Post-Diálisis</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <Campo label="Peso post" unit="kg">
                  <Input type="number" step={0.1} min={30} max={200} value={form.pesoPost} onChange={(v) => set('pesoPost', v)} />
                </Campo>
                <Campo label="PA sistólica" unit="mmHg">
                  <Input type="number" min={60} max={250} value={form.taSistolicaPost} onChange={(v) => set('taSistolicaPost', v)} />
                </Campo>
                <Campo label="PA diastólica" unit="mmHg">
                  <Input type="number" min={40} max={150} value={form.taDiastolicaPost} onChange={(v) => set('taDiastolicaPost', v)} />
                </Campo>
                <Campo label="Frec. cardíaca" unit="lpm">
                  <Input type="number" min={30} max={200} value={form.frecCardiacaPost} onChange={(v) => set('frecCardiacaPost', v)} />
                </Campo>
                <Campo label="Temperatura" unit="°C">
                  <Input type="number" step={0.1} min={35} max={42} value={form.temperaturaPost} onChange={(v) => set('temperaturaPost', v)} />
                </Campo>
              </div>
            </div>

            {/* Cálculo de adecuación (Kt/V) */}
            <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl">
              <p className="text-purple-300 text-xs font-semibold mb-3">
                🧮 Cálculo de Adecuación Dialítica – Fórmula Daugirdas 2ª Generación
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <Campo label="BUN pre-diálisis" unit="mg/dL">
                  <input
                    type="number"
                    value={bunPre ?? ''}
                    onChange={(e) => setBunPre(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                      placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </Campo>
                <Campo label="BUN post-diálisis" unit="mg/dL">
                  <input
                    type="number"
                    value={bunPost ?? ''}
                    onChange={(e) => setBunPost(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                      placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </Campo>
                <div className="flex items-end">
                  <button
                    onClick={calcularAdecuacion}
                    disabled={!bunPre || !bunPost || !form.ufReal || !form.pesoPost || !form.tiempoReal}
                    className="w-full py-2 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30
                      hover:bg-purple-600/30 transition-colors text-sm font-medium disabled:opacity-40"
                  >
                    Calcular Kt/V
                  </button>
                </div>
                {ktVCalc && (
                  <div className="p-2 bg-white/5 rounded-lg border border-white/8">
                    <p className="text-xs text-white/50">Resultado:</p>
                    <p className={`text-lg font-black ${ktVCalc.ktv >= KTV_META ? 'text-emerald-400' : 'text-amber-400'}`}>
                      Kt/V {ktVCalc.ktv}
                    </p>
                    <p className={`text-xs ${ktVCalc.urr >= URR_META ? 'text-emerald-400' : 'text-amber-400'}`}>
                      URR {ktVCalc.urr}%
                    </p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Campo label="Kt/V logrado" hint={`Meta ≥ ${KTV_META}`}>
                  <Input type="number" step={0.01} min={0} max={3} value={form.ktVSesion} onChange={(v) => set('ktVSesion', v)} />
                </Campo>
                <Campo label="URR (%)" hint={`Meta ≥ ${URR_META}%`}>
                  <Input type="number" step={0.1} min={0} max={100} value={form.urrSesion} onChange={(v) => set('urrSesion', v)} />
                </Campo>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo label="Tolerancia a la diálisis">
                <Select
                  value={form.toleranciaDialisis ?? ''}
                  onChange={(v) => set('toleranciaDialisis', v)}
                  placeholder="Seleccionar"
                  options={[
                    { value: 'BUENA',   label: '✅ Buena' },
                    { value: 'REGULAR', label: '⚠️ Regular' },
                    { value: 'MALA',    label: '❌ Mala' },
                  ]}
                />
              </Campo>
              <Campo label="Estado de conciencia">
                <Select
                  value={form.estadoConciencia ?? ''}
                  onChange={(v) => set('estadoConciencia', v)}
                  placeholder="Seleccionar"
                  options={[
                    { value: 'CONSCIENTE',       label: 'Consciente y orientado' },
                    { value: 'SOMNOLIENTO',      label: 'Somnoliento' },
                    { value: 'CONFUSO',          label: 'Confuso' },
                    { value: 'ESTUPOR',          label: 'Estupor' },
                  ]}
                />
              </Campo>
            </div>

            <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
              <p className="text-amber-400 text-xs font-semibold mb-2">⚠️ Incidencias intrasesión</p>
              <div className="flex flex-wrap gap-2">
                {INCIDENCIAS_OPCIONES.map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => toggleIncidencia(inc)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.incidencias?.includes(inc)
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                    }`}
                  >
                    {inc}
                  </button>
                ))}
              </div>
            </div>

            <Campo label="Estado de la sesión">
              <Select
                value={form.estadoSesion ?? 'COMPLETADA'}
                onChange={(v) => set('estadoSesion', v as any)}
                options={[
                  { value: 'COMPLETADA',  label: '✅ Completada' },
                  { value: 'SUSPENDIDA',  label: '⚠️ Suspendida' },
                  { value: 'CANCELADA',   label: '❌ Cancelada' },
                ]}
              />
            </Campo>

            <Campo label="Observaciones generales">
              <textarea
                value={form.observaciones ?? ''}
                onChange={(e) => set('observaciones', e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                  placeholder-white/20 focus:outline-none focus:border-[#00B4D8]/50 transition-colors resize-none"
                placeholder="Observaciones del nefrólogo, plan de ajustes, etc."
              />
            </Campo>
          </div>
        );

      // ─────────── MEDICAMENTOS ────────────────────────────
      case 'medicamentos':
        return <MedicamentosStep form={form} set={set} />;

      // ─────────── REVISIÓN FINAL ──────────────────────────
      case 'revision':
        return <RevisionStep form={form} bunPre={bunPre} bunPost={bunPost} />;

      default:
        return null;
    }
  };

  return (
    <div className="bg-[#0d0f14] border border-white/8 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">
            {sesionEditar ? '✏️ Editar Sesión de Hemodiálisis' : '+ Nueva Sesión de Hemodiálisis'}
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            Complete todos los datos requeridos por la Resolución 3241/2008
          </p>
        </div>
        <button onClick={onCancelar} className="text-white/40 hover:text-white/70 transition-colors text-xl">
          ✕
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 overflow-x-auto border-b border-white/5 bg-white/3">
        {PASOS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setPaso(p.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
              paso === p.id
                ? 'border-[#00B4D8] text-[#00B4D8] bg-[#00B4D8]/5'
                : i < pasoActual
                ? 'border-emerald-500 text-emerald-400/70 hover:text-emerald-400'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
            {i < pasoActual && <span className="text-emerald-400">✓</span>}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="p-6 overflow-y-auto max-h-[60vh]">
        <motion.div
          key={paso}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderPaso()}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
        <button
          onClick={() => {
            const i = PASOS.findIndex((p) => p.id === paso);
            if (i > 0) setPaso(PASOS[i - 1].id);
          }}
          disabled={pasoActual === 0}
          className="text-sm px-4 py-2 rounded-lg bg-white/5 text-white/60 border border-white/10
            hover:bg-white/10 transition-colors disabled:opacity-30"
        >
          ← Anterior
        </button>

        <div className="flex flex-col items-end gap-1.5">
          {errorGuardar && (
            <p className="text-red-400 text-xs max-w-xs text-right">⚠️ {errorGuardar}</p>
          )}
          <div className="flex items-center gap-2">
            {pasoActual < PASOS.length - 1 ? (
              <button
                onClick={() => setPaso(PASOS[pasoActual + 1].id)}
                className="text-sm px-4 py-2 rounded-lg bg-[#00B4D8]/15 text-[#00B4D8] border border-[#00B4D8]/30
                  hover:bg-[#00B4D8]/25 transition-colors font-medium"
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="text-sm px-6 py-2 rounded-lg bg-[#00B4D8] text-white font-semibold
                  hover:bg-[#0099b8] transition-colors disabled:opacity-50"
              >
                {guardando ? '⏳ Guardando…' : '💾 Guardar sesión'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-componente: Medicamentos ──────────────────────────────

function MedicamentosStep({
  form,
  set,
}: {
  form: Partial<SesionHemodialisis>;
  set: (field: keyof SesionHemodialisis, value: any) => void;
}) {
  const meds: MedicamentoSesion[] = form.medicamentosSesion ?? [];

  const addMed = () => {
    set('medicamentosSesion', [...meds, { nombre: '', dosis: '', via: 'IV', hora: '' }]);
  };

  const updateMed = (i: number, field: keyof MedicamentoSesion, v: string) => {
    const n = [...meds];
    n[i] = { ...n[i], [field]: v };
    set('medicamentosSesion', n);
  };

  const removeMed = (i: number) => {
    set('medicamentosSesion', meds.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-white/70 text-sm font-medium">Medicamentos administrados en sesión</p>
        <button
          onClick={addMed}
          className="text-xs px-3 py-1.5 rounded-lg bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/30
            hover:bg-[#00B4D8]/20 transition-colors"
        >
          + Agregar medicamento
        </button>
      </div>

      {meds.length === 0 ? (
        <div className="text-center py-8 text-white/30 text-sm border border-dashed border-white/10 rounded-xl">
          No hay medicamentos registrados para esta sesión
        </div>
      ) : (
        <div className="space-y-3">
          {meds.map((m, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-white/5 rounded-xl border border-white/8">
              <input
                value={m.nombre}
                onChange={(e) => updateMed(i, 'nombre', e.target.value)}
                placeholder="Nombre del medicamento"
                className="col-span-2 bg-transparent border-b border-white/15 px-1 py-1 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00B4D8]/50"
              />
              <input
                value={m.dosis}
                onChange={(e) => updateMed(i, 'dosis', e.target.value)}
                placeholder="Dosis"
                className="bg-transparent border-b border-white/15 px-1 py-1 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00B4D8]/50"
              />
              <select
                value={m.via}
                onChange={(e) => updateMed(i, 'via', e.target.value)}
                className="bg-transparent border-b border-white/15 px-1 py-1 text-sm text-white focus:outline-none focus:border-[#00B4D8]/50"
              >
                <option value="IV">IV</option>
                <option value="SC">SC</option>
                <option value="VO">VO</option>
                <option value="Circuito">Circuito HD</option>
              </select>
              <div className="flex items-center gap-1">
                <input
                  value={m.hora ?? ''}
                  onChange={(e) => updateMed(i, 'hora', e.target.value)}
                  placeholder="Hora"
                  type="time"
                  className="flex-1 bg-transparent border-b border-white/15 px-1 py-1 text-sm text-white focus:outline-none focus:border-[#00B4D8]/50"
                />
                <button
                  onClick={() => removeMed(i)}
                  className="text-red-400/60 hover:text-red-400 transition-colors text-sm ml-1"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 bg-white/3 border border-white/8 rounded-xl">
        <p className="text-white/50 text-xs mb-2">Medicamentos frecuentes en HD</p>
        <div className="flex flex-wrap gap-2">
          {[
            { nombre: 'Eritropoyetina (EPO alfa)', dosis: 'según protocolo', via: 'SC' },
            { nombre: 'Hierro sacarosa IV', dosis: '100 mg', via: 'IV' },
            { nombre: 'Carbonato de calcio', dosis: 'según formulación', via: 'VO' },
            { nombre: 'Sevelamer', dosis: 'según formulación', via: 'VO' },
            { nombre: 'Cinacalcet', dosis: 'según formulación', via: 'VO' },
            { nombre: 'Vitamina D activa', dosis: 'según formulación', via: 'IV' },
          ].map((med) => (
            <button
              key={med.nombre}
              onClick={() => set('medicamentosSesion', [...meds, { ...med }])}
              className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70 transition-colors"
            >
              + {med.nombre}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-componente: Revisión final ────────────────────────────

function RevisionStep({
  form,
  bunPre,
  bunPost,
}: {
  form: Partial<SesionHemodialisis>;
  bunPre?: number;
  bunPost?: number;
}) {
  const ufLograda = (form.pesoPre ?? 0) - (form.pesoPost ?? 0);
  const ktVOk = form.ktVSesion != null && form.ktVSesion >= KTV_META;
  const urrOk  = form.urrSesion != null && form.urrSesion >= URR_META;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-[#00B4D8]/5 border border-[#00B4D8]/20 rounded-xl">
        <h3 className="text-[#00B4D8] font-bold text-sm mb-4">📋 Resumen de la Sesión</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { l: 'Fecha', v: form.fechaSesion ? new Date(form.fechaSesion).toLocaleString('es-CO') : '—' },
            { l: 'Turno', v: form.turno ?? '—' },
            { l: 'Nefrólogo', v: form.nefrologo || '—' },
            { l: 'Enfermero/a', v: form.enfermero || '—' },
            { l: 'Máquina', v: form.codigoMaquina || '—' },
            { l: 'Peso pre → post', v: form.pesoPre ? `${form.pesoPre} → ${form.pesoPost ?? '?'} kg` : '—' },
            { l: 'UF por peso', v: ufLograda > 0 ? `${ufLograda.toFixed(1)} kg` : '—' },
            { l: 'UF lograda', v: form.ufReal ? `${form.ufReal} L` : '—' },
            { l: 'Tiempo real', v: form.tiempoReal ? `${form.tiempoReal} min` : '—' },
            { l: 'QB real', v: form.qbReal ? `${form.qbReal} mL/min` : '—' },
            { l: 'Filtro', v: form.filtroTipo || '—' },
            { l: 'Anticoagulación', v: form.tipoAnticoagulacion?.replace(/_/g,' ') ?? '—' },
          ].map((item) => (
            <div key={item.l} className="bg-white/5 rounded-lg p-2">
              <p className="text-white/40 text-xs">{item.l}</p>
              <p className="text-white text-sm font-medium">{item.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Adecuación dialítica */}
      <div className={`p-4 rounded-xl border ${
        ktVOk && urrOk
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-amber-500/5 border-amber-500/20'
      }`}>
        <h3 className={`font-bold text-sm mb-3 ${ktVOk && urrOk ? 'text-emerald-400' : 'text-amber-400'}`}>
          {ktVOk && urrOk ? '✅' : '⚠️'} Adecuación Dialítica
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-white/40 text-xs">Kt/V (meta ≥ {KTV_META})</p>
            <p className={`text-xl font-black ${ktVOk ? 'text-emerald-400' : 'text-amber-400'}`}>
              {form.ktVSesion?.toFixed(2) ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-white/40 text-xs">URR (meta ≥ {URR_META}%)</p>
            <p className={`text-xl font-black ${urrOk ? 'text-emerald-400' : 'text-amber-400'}`}>
              {form.urrSesion?.toFixed(1) ?? '—'}%
            </p>
          </div>
        </div>
        {(!ktVOk || !urrOk) && (
          <p className="text-amber-300/70 text-xs mt-2">
            ⚠️ La adecuación no cumple la meta. Evalúe ajuste de prescripción.
          </p>
        )}
      </div>

      {form.incidencias && form.incidencias.length > 0 && (
        <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <p className="text-amber-400 text-xs font-semibold mb-2">⚠️ Incidencias registradas</p>
          <div className="flex flex-wrap gap-2">
            {form.incidencias.map((inc, i) => (
              <span key={i} className="text-xs bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20">
                {inc}
              </span>
            ))}
          </div>
        </div>
      )}

      {(form.medicamentosSesion ?? []).length > 0 && (
        <div className="p-3 bg-white/3 border border-white/8 rounded-xl">
          <p className="text-white/60 text-xs font-semibold mb-2">💊 Medicamentos ({form.medicamentosSesion!.length})</p>
          <div className="space-y-1">
            {form.medicamentosSesion!.map((m, i) => (
              <p key={i} className="text-white/70 text-xs">
                • {m.nombre} — {m.dosis} {m.via} {m.hora ? `a las ${m.hora}` : ''}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
