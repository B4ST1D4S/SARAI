import { motion } from 'framer-motion';
import { KPICard } from '../../components/shared/KPICard';
import { AlertaBadge } from '../../components/shared/Badges';
import { useDashboardRenal } from '../../hooks/useDashboardRenal';
import type { DashboardRenal } from '../../types';
import { KTV_META } from '../../types';

interface Props {
  onNavegarPacientes?: () => void;
  onNavegarHemodialisis?: () => void;
}

export function RenalDashboard({ onNavegarPacientes, onNavegarHemodialisis }: Props) {
  const { data, loading, error, refetch } = useDashboardRenal();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-white/40 text-sm animate-pulse">Cargando dashboard renal…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
        Error al cargar el dashboard: {error}
        <button onClick={refetch} className="ml-3 underline text-red-400">Reintentar</button>
      </div>
    );
  }

  const d = data ?? ({
    pacientes: { totalActivos: 0, totalHD: 0, totalDP: 0, totalPredialisis: 0, totalTraslado: 0, totalFallecidos: 0 },
    sesionesHoy: 0,
    adecuacion: { ktVPromedio30d: null, metaKtV: KTV_META },
    eventosRecientes: [],
    laboratoriosRecientes: [],
  } as DashboardRenal);

  const ktVOk = d.adecuacion.ktVPromedio30d != null && d.adecuacion.ktVPromedio30d >= d.adecuacion.metaKtV;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-2xl tracking-tight">
            Programa Renal
            <span className="ml-3 text-xs font-normal text-white/40 bg-[#00B4D8]/10 border border-[#00B4D8]/20 px-2 py-1 rounded-full">
              Alto Costo
            </span>
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Dashboard ejecutivo · Normativa: Res. 3241/2008 MINSALUD
          </p>
        </div>
        <button
          onClick={refetch}
          className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 transition-colors"
        >
          ↻ Actualizar
        </button>
      </div>

      {/* KPIs principales */}
      <div>
        <p className="text-white/40 text-xs uppercase tracking-wider mb-3 font-semibold">
          Pacientes Activos
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard
            label="Total Activos"
            value={d.pacientes.totalActivos}
            color="#00B4D8"
            icon="👥"
          />
          <KPICard
            label="Hemodiálisis"
            value={d.pacientes.totalHD}
            color="#4fc3f7"
            icon="💧"
          />
          <KPICard
            label="Diálisis Peritoneal"
            value={d.pacientes.totalDP}
            color="#81d4fa"
            icon="🫀"
          />
          <KPICard
            label="Pre-diálisis"
            value={d.pacientes.totalPredialisis}
            color="#a5f3fc"
            icon="⚕️"
          />
          <KPICard
            label="Trasladados"
            value={d.pacientes.totalTraslado}
            color="#f59e0b"
            icon="🔄"
          />
          <KPICard
            label="Fallecidos"
            value={d.pacientes.totalFallecidos}
            color="#6b7280"
            icon="📋"
          />
        </div>
      </div>

      {/* KPIs de calidad */}
      <div>
        <p className="text-white/40 text-xs uppercase tracking-wider mb-3 font-semibold">
          Indicadores de Calidad CAC
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard
            label="Sesiones hoy"
            value={d.sesionesHoy}
            color="#22c55e"
            icon="📅"
          />
          <KPICard
            label="Kt/V Promedio 30d"
            value={d.adecuacion.ktVPromedio30d?.toFixed(2) ?? '—'}
            meta={`Meta ≥ ${d.adecuacion.metaKtV}`}
            color={ktVOk ? '#22c55e' : '#f59e0b'}
            alert={!ktVOk && d.adecuacion.ktVPromedio30d != null}
            icon="🧮"
          />
          <KPICard
            label="Tasa Hospitalización"
            value="—"
            unit="/100 pac-mes"
            color="#a855f7"
            icon="🏥"
          />
          <KPICard
            label="Adherencia"
            value="—"
            unit="%"
            color="#00B4D8"
            icon="✅"
          />
        </div>
      </div>

      {/* Alertas y accesos rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alertas clínicas */}
        <div className="rounded-xl border border-white/8 bg-white/5 p-4">
          <h3 className="text-white font-semibold text-sm mb-3">🔔 Alertas Clínicas Activas</h3>
          {d.adecuacion.ktVPromedio30d != null && !ktVOk && (
            <AlertaBadge
              tipo="warning"
              icono="⚠️"
              texto={`Kt/V promedio (${d.adecuacion.ktVPromedio30d.toFixed(2)}) por debajo de la meta ≥ ${KTV_META}`}
            />
          )}
          {d.eventosRecientes.length > 0 && (
            <div className="mt-2">
              <AlertaBadge
                tipo="danger"
                icono="🚨"
                texto={`${d.eventosRecientes.length} evento(s) adverso(s) recientes sin resolver`}
              />
            </div>
          )}
          {d.pacientes.totalActivos === 0 && (
            <p className="text-white/30 text-xs text-center py-4">
              No hay alertas activas en este momento
            </p>
          )}
        </div>

        {/* Accesos rápidos */}
        <div className="rounded-xl border border-white/8 bg-white/5 p-4">
          <h3 className="text-white font-semibold text-sm mb-3">⚡ Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Registrar sesión HD', icon: '💧', color: '#00B4D8', action: onNavegarHemodialisis },
              { label: 'Ver pacientes', icon: '👥', color: '#4fc3f7', action: onNavegarPacientes },
              { label: 'Reportes CAC', icon: '📊', color: '#a855f7', action: undefined },
              { label: 'Configurar alertas', icon: '🔔', color: '#f59e0b', action: undefined },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                disabled={!item.action}
                className="flex items-center gap-2 p-3 rounded-xl border border-white/8 bg-white/3
                  hover:bg-white/8 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-white/70 text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Eventos adversos recientes */}
      {d.eventosRecientes.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <h3 className="text-red-300 font-semibold text-sm mb-3">🚨 Últimos Eventos Adversos</h3>
          <div className="space-y-2">
            {d.eventosRecientes.slice(0, 3).map((ev: any) => (
              <div key={ev.id} className="flex items-center gap-3 p-2 bg-white/3 rounded-lg">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    ev.severidad === 'CRITICO' ? 'bg-red-500/20 text-red-300' :
                    ev.severidad === 'GRAVE' ? 'bg-orange-500/20 text-orange-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {ev.severidad}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-xs font-medium truncate">
                    {ev.inscripcion?.paciente?.nombreCompleto ?? 'Paciente desconocido'}
                  </p>
                  <p className="text-white/40 text-xs">{ev.tipo} · {new Date(ev.fechaEvento).toLocaleDateString('es-CO')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
