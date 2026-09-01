// Programa VIH — TAR, Carga Viral, CD4, Adherencia
import { motion } from 'framer-motion';

const MODULOS_VIH = [
  { id: 'ingreso', label: 'Ingreso y Tamizaje', icon: '🔬', color: '#a855f7',
    desc: 'Prueba VIH · Confirmación · Estadificación OMS · Coinfecciones' },
  { id: 'tar', label: 'Inicio y Seguimiento TAR', icon: '💊', color: '#ec4899',
    desc: 'Esquema TAR · Cambios · Reacciones adversas · Adherencia' },
  { id: 'laboratorios', label: 'Laboratorios', icon: '🧪', color: '#00B4D8',
    desc: 'Carga Viral · CD4 · Genotipo · Coinfecciones · Vacunas' },
  { id: 'dispensacion', label: 'Dispensación TAR', icon: '📦', color: '#22c55e',
    desc: 'Entrega medicamentos · Adherencia · Stock · Alertas' },
  { id: 'adherencia', label: 'Adherencia', icon: '✅', color: '#f59e0b',
    desc: 'Escala Morisky · Registros dispensación · Indetectabilidad' },
  { id: 'equipo', label: 'Equipo Multidisciplinario', icon: '👥', color: '#6b7280',
    desc: 'Psicología · Trabajo Social · Nutrición · Infectología' },
];

const METAS_CAC = [
  { label: 'Carga Viral Indetectable', meta: '> 90% a 12 meses', icon: '📊' },
  { label: 'Retención en Cuidado', meta: '> 85% activos', icon: '🏥' },
  { label: 'Adherencia TAR', meta: '> 95%', icon: '✅' },
  { label: 'CD4 > 200 cel/µL', meta: 'En todos los activos', icon: '🔬' },
];

export function VIHPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white font-black text-2xl tracking-tight flex items-center gap-2">
            🔬 Programa VIH / SIDA
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            TAR · Carga Viral · CD4 · Adherencia · Dispensación · Res. 3442/2006 – Decreto 1543/1997
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded-xl text-sm font-semibold hover:bg-purple-500/25 transition-colors">
          + Inscribir Paciente
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pacientes Activos', valor: 0, icon: '👥', color: '#a855f7' },
          { label: 'En TAR', valor: 0, icon: '💊', color: '#ec4899' },
          { label: 'Carga Indetectable', valor: '—', icon: '📉', color: '#22c55e' },
          { label: 'Alertas Activas', valor: 0, icon: '🔔', color: '#ef4444' },
        ].map((kpi) => (
          <div key={kpi.label} className="p-4 rounded-xl bg-white/3 border border-white/8">
            <div className="text-xl mb-2">{kpi.icon}</div>
            <p className="text-white font-black text-2xl">{kpi.valor}</p>
            <p className="text-white/40 text-xs mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Módulos del programa */}
      <div>
        <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Módulos del Programa</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULOS_VIH.map((mod) => (
            <motion.div
              key={mod.id}
              whileHover={{ scale: 1.01 }}
              className="relative p-4 rounded-xl border border-white/8 bg-white/3 cursor-pointer hover:bg-white/5 transition-all overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: `linear-gradient(90deg, transparent, ${mod.color}, transparent)` }}
              />
              <div className="text-2xl mb-2">{mod.icon}</div>
              <p className="text-white font-bold text-sm">{mod.label}</p>
              <p className="text-white/40 text-xs mt-1">{mod.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Metas CAC */}
      <div className="p-5 rounded-xl bg-white/3 border border-white/8">
        <h3 className="text-white/70 font-bold text-sm mb-4 flex items-center gap-2">
          🎯 Metas Cuenta de Alto Costo — VIH
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {METAS_CAC.map((m) => (
            <div key={m.label} className="flex items-center gap-3 p-3 rounded-lg bg-white/3">
              <span className="text-xl">{m.icon}</span>
              <div>
                <p className="text-white/70 font-semibold text-sm">{m.label}</p>
                <p className="text-purple-400/70 text-xs">Meta: {m.meta}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Esquemas TAR primera línea */}
      <div className="p-5 rounded-xl bg-purple-500/5 border border-purple-500/15">
        <h3 className="text-purple-300/70 font-bold text-sm mb-3">
          💊 Esquemas TAR Primera Línea — MINSALUD Colombia 2023
        </h3>
        <div className="space-y-2 text-xs">
          {[
            { nombre: 'TDF + FTC + DTG', descripcion: 'Tenofovir + Emtricitabina + Dolutegravir (preferido)', clase: 'INTI + INSTI' },
            { nombre: 'TAF + FTC + DTG', descripcion: 'Tenofovir Alafenamida + Emtricitabina + Dolutegravir', clase: 'INTI + INSTI' },
            { nombre: 'ABC + 3TC + DTG', descripcion: 'Abacavir + Lamivudina + Dolutegravir (HLA-B*57:01 negativo)', clase: 'INTI + INSTI' },
          ].map((esq) => (
            <div key={esq.nombre} className="flex items-center gap-3 p-2 rounded-lg bg-white/3">
              <span className="text-purple-400/60 font-mono text-xs w-24 shrink-0">{esq.clase}</span>
              <div>
                <span className="text-white/70 font-semibold">{esq.nombre}</span>
                <span className="text-white/30 ml-2">{esq.descripcion}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 text-blue-300/60 text-xs flex items-start gap-2">
        <span className="text-base">🚧</span>
        <div>
          <p className="font-semibold text-blue-300/80">Módulo en construcción activa</p>
          <p className="mt-0.5">
            Historia clínica VIH, registro de carga viral y CD4, inicio/cambio de TAR, 
            dispensación de medicamentos, adherencia y equipo multidisciplinario están en desarrollo.
          </p>
        </div>
      </div>
    </div>
  );
}
