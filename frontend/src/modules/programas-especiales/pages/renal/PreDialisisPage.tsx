// Programa Renal — Pre-diálisis / Nefroprotección
// Seguimiento de pacientes con ERC antes de iniciar terapia de reemplazo renal
import { useState } from 'react';
import { motion } from 'framer-motion';

const ETAPAS = [
  { id: 'nefroproteccion', label: 'Nefroprotección', icon: '🛡️', color: '#22c55e',
    desc: 'Control de factores de riesgo · Retardo progresión ERC' },
  { id: 'predialytica', label: 'Etapa Pre-Dialítica', icon: '⚕️', color: '#f59e0b',
    desc: 'TFG 15-29 (G4) · Preparación acceso vascular' },
  { id: 'urgencia', label: 'Urgencia Dialítica', icon: '🚨', color: '#ef4444',
    desc: 'TFG < 15 (G5) · Inicio urgente de diálisis' },
];

const INDICADORES = [
  { label: 'Pacientes ERC G1-G4', valor: 0, meta: '—', icon: '👥', color: '#00B4D8' },
  { label: 'Control PA < 130/80', valor: 0, meta: '≥ 70%', icon: '💓', color: '#22c55e' },
  { label: 'HbA1c Controlada', valor: 0, meta: '≤ 7%', icon: '🩸', color: '#f59e0b' },
  { label: 'Con IECA/ARA-II', valor: 0, meta: '≥ 80%', icon: '💊', color: '#a855f7' },
];

export function PreDialisisPage() {
  const [etapaSeleccionada, setEtapaSeleccionada] = useState<string | null>(null);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white font-black text-2xl tracking-tight flex items-center gap-2">
            ⚕️ Pre-diálisis / Nefroprotección
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            Programa Renal · ERC estadios G1–G4 · Res. 3241/2008
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#00B4D8]/15 text-[#00B4D8] border border-[#00B4D8]/30 rounded-xl text-sm font-semibold hover:bg-[#00B4D8]/25 transition-colors">
          + Inscribir Paciente
        </button>
      </div>

      {/* Indicadores rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {INDICADORES.map((ind) => (
          <div key={ind.label} className="p-4 rounded-xl bg-white/3 border border-white/8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{ind.icon}</span>
              <span className="text-white/30 text-xs">{ind.meta}</span>
            </div>
            <p className="text-white font-black text-2xl">{ind.valor}</p>
            <p className="text-white/40 text-xs mt-0.5">{ind.label}</p>
          </div>
        ))}
      </div>

      {/* Etapas del programa */}
      <div>
        <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Etapas del Programa</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ETAPAS.map((etapa) => (
            <motion.button
              key={etapa.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => setEtapaSeleccionada(etapa.id === etapaSeleccionada ? null : etapa.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                etapaSeleccionada === etapa.id
                  ? 'border-white/20 bg-white/8'
                  : 'border-white/8 bg-white/3 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{etapa.icon}</span>
                <div className="w-2 h-2 rounded-full" style={{ background: etapa.color }} />
              </div>
              <p className="text-white font-bold text-sm">{etapa.label}</p>
              <p className="text-white/40 text-xs mt-1">{etapa.desc}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-white/25 text-xs">0 pacientes</span>
                <span className="text-xs" style={{ color: etapa.color }}>Ver →</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Objetivos de nefroprotección */}
      <div className="p-5 rounded-xl bg-white/3 border border-white/8">
        <h3 className="text-white/70 font-bold text-sm mb-4 flex items-center gap-2">
          🎯 Objetivos de Nefroprotección — KDIGO 2024
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { label: 'Presión Arterial', meta: '< 130/80 mmHg (< 120/80 si proteinuria)', icon: '💓' },
            { label: 'HbA1c en Diabéticos', meta: '≤ 7% (53 mmol/mol)', icon: '🩸' },
            { label: 'Proteinuria', meta: '< 0.5 g/día o < 500 mg/g creatinina', icon: '💧' },
            { label: 'LDL Colesterol', meta: '< 70 mg/dL (alto riesgo CV)', icon: '🫀' },
            { label: 'IECA / ARA-II', meta: 'Indicado en proteinuria > 300 mg/g', icon: '💊' },
            { label: 'Hemoglobina', meta: '10–12 g/dL con EPO si anemia ERC', icon: '🔴' },
            { label: 'Calcio/Fósforo', meta: 'Ca 8.4-9.5 · P < 5.5 mg/dL', icon: '🦴' },
            { label: 'Bicarbonato', meta: '> 22 mEq/L para retardar progresión', icon: '⚗️' },
          ].map((obj) => (
            <div key={obj.label} className="flex items-start gap-2 p-2 rounded-lg bg-white/3">
              <span>{obj.icon}</span>
              <div>
                <p className="text-white/70 font-semibold">{obj.label}</p>
                <p className="text-white/35">{obj.meta}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nota de desarrollo */}
      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 text-blue-300/60 text-xs flex items-start gap-2">
        <span className="text-base">🚧</span>
        <div>
          <p className="font-semibold text-blue-300/80">Módulo en construcción activa</p>
          <p className="mt-0.5">
            Historia clínica de nefroprotección, clasificación KDIGO automática, seguimiento de laboratorios,
            medicamentos nefroprotectores y alertas de progresión están en desarrollo.
            La arquitectura está preparada — los datos se guardarán en las mismas tablas del Programa Renal.
          </p>
        </div>
      </div>
    </div>
  );
}
