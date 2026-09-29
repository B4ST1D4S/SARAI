// Programa Renal — Trasplante Renal
// Seguimiento pre y post trasplante renal
import { motion } from 'framer-motion';

const FASES = [
  { id: 'pretrasplante', label: 'Pre-trasplante', icon: '📋', color: '#00B4D8',
    desc: 'Evaluación · Lista de espera · Donante vivo' },
  { id: 'peritrasplante', label: 'Peri-trasplante', icon: '🏥', color: '#a855f7',
    desc: 'Inmunosupresión inducción · Post-QX inmediato' },
  { id: 'posttrasplante', label: 'Post-trasplante', icon: '💚', color: '#22c55e',
    desc: 'Seguimiento · Rechazo · Función injerto · Infecciones' },
];

const MONITOREO = [
  { label: 'Creatinina', unit: 'mg/dL', meta: '< 1.5 (buen injerto)', icon: '🧪' },
  { label: 'Tacrolimus', unit: 'ng/mL', meta: '5-10 (mantenimiento)', icon: '💊' },
  { label: 'Biopsias programadas', unit: '3m, 1a', meta: 'Protocolo BANFF', icon: '🔬' },
  { label: 'Función Injerto', unit: 'TFG', meta: '> 60 mL/min ideal', icon: '🫀' },
];

export function TrasplantePage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white font-black text-2xl tracking-tight flex items-center gap-2">
            🏥 Trasplante Renal
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            Programa Renal · Pre/Peri/Post-trasplante · Norma colombiana INVIMA
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#00B4D8]/15 text-[#00B4D8] border border-[#00B4D8]/30 rounded-xl text-sm font-semibold hover:bg-[#00B4D8]/25 transition-colors">
          + Nuevo Caso
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'En Lista de Espera', valor: 0, icon: '⏳', color: '#f59e0b' },
          { label: 'Trasplantados Activos', valor: 0, icon: '💚', color: '#22c55e' },
          { label: 'Supervivencia Injerto', valor: '—', icon: '📈', color: '#00B4D8' },
          { label: 'Rechazos Agudos', valor: 0, icon: '⚠️', color: '#ef4444' },
        ].map((kpi) => (
          <div key={kpi.label} className="p-4 rounded-xl bg-white/3 border border-white/8">
            <div className="text-xl mb-2">{kpi.icon}</div>
            <p className="text-white font-black text-2xl">{kpi.valor}</p>
            <p className="text-white/40 text-xs mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Fases */}
      <div>
        <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Fases del Programa</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FASES.map((fase) => (
            <motion.div
              key={fase.id}
              whileHover={{ scale: 1.01 }}
              className="p-4 rounded-xl border border-white/8 bg-white/3 cursor-pointer hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{fase.icon}</span>
                <div className="w-2 h-2 rounded-full" style={{ background: fase.color }} />
              </div>
              <p className="text-white font-bold text-sm">{fase.label}</p>
              <p className="text-white/40 text-xs mt-1">{fase.desc}</p>
              <p className="text-white/20 text-xs mt-3">0 pacientes</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Monitoreo post-trasplante */}
      <div className="p-5 rounded-xl bg-white/3 border border-white/8">
        <h3 className="text-white/70 font-bold text-sm mb-4">🔬 Monitoreo Estándar Post-trasplante</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MONITOREO.map((m) => (
            <div key={m.label} className="flex items-center gap-3 p-3 rounded-lg bg-white/3">
              <span className="text-xl">{m.icon}</span>
              <div>
                <p className="text-white/70 font-semibold text-sm">{m.label}</p>
                <p className="text-white/35 text-xs">{m.meta} · {m.unit}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inmunosupresión estándar */}
      <div className="p-5 rounded-xl bg-purple-500/5 border border-purple-500/15">
        <h3 className="text-purple-300/70 font-bold text-sm mb-3">💊 Esquema de Inmunosupresión Triple</h3>
        <div className="grid grid-cols-3 gap-3 text-xs">
          {[
            { med: 'Tacrolimus', dosis: '0.1-0.3 mg/kg/día', clase: 'Inhibidor calcineurina' },
            { med: 'Micofenolato', dosis: '720-1440 mg/día', clase: 'Antimetabolito' },
            { med: 'Prednisona', dosis: 'Reducción progresiva', clase: 'Corticoesteroide' },
          ].map((m) => (
            <div key={m.med} className="p-3 rounded-lg bg-white/3 border border-white/8 text-center">
              <p className="text-purple-300/80 font-bold">{m.med}</p>
              <p className="text-white/40 mt-1">{m.dosis}</p>
              <p className="text-white/25 mt-0.5">{m.clase}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 text-blue-300/60 text-xs flex items-start gap-2">
        <span className="text-base">🚧</span>
        <div>
          <p className="font-semibold text-blue-300/80">Módulo en construcción activa</p>
          <p className="mt-0.5">
            Historia clínica de trasplante, biopsias, niveles de inmunosupresores, alertas de rechazo
            y seguimiento post-trasplante están en desarrollo.
          </p>
        </div>
      </div>
    </div>
  );
}
