// Configuración del módulo Programas Especializados
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParametrizacionHDPage } from './renal/ParametrizacionHDPage';

type SeccionConfig = 'programas' | 'hemodialisis' | 'tamizajes' | 'alertas' | 'usuarios' | 'reportes';

const SECCIONES: { id: SeccionConfig; label: string; icon: string; desc: string }[] = [
  { id: 'programas',    label: 'Programas',         icon: '⚕️', desc: 'Activar/desactivar programas · Parámetros generales' },
  { id: 'hemodialisis', label: 'Hemodiálisis',       icon: '💧', desc: 'Sillones · Esquemas de turno · Jornadas · Máquinas' },
  { id: 'tamizajes',    label: 'Tamizajes',          icon: '📋', desc: 'Tipos de tamizaje · Periodicidad · Criterios de alerta' },
  { id: 'alertas',      label: 'Alertas Clínicas',   icon: '🔔', desc: 'Reglas de alerta · Umbrales · Notificaciones' },
  { id: 'usuarios',     label: 'Equipo y Usuarios',  icon: '👥', desc: 'Roles del programa · Permisos · Profesionales asignados' },
  { id: 'reportes',     label: 'Reportes CAC',       icon: '📊', desc: 'Indicadores Cuenta de Alto Costo · Envío automático' },
];

// Catálogo fijo (solo metadatos, el estado activo viene de props)
const CATALOGO_PROGRAMAS = [
  { codigo: 'RENAL', nombre: 'Programa Renal', pacientes: 1, color: '#00B4D8', icon: '🫀', bloqueado: true  },
  { codigo: 'VIH',   nombre: 'Programa VIH',   pacientes: 0, color: '#a855f7', icon: '🔬', bloqueado: false },
  { codigo: 'DIAB',  nombre: 'Diabetes',        pacientes: 0, color: '#f59e0b', icon: '🩺', bloqueado: false },
  { codigo: 'HTA',   nombre: 'Hipertensión',    pacientes: 0, color: '#ef4444', icon: '💓', bloqueado: false },
  { codigo: 'HEMO',  nombre: 'Hemofilia',        pacientes: 0, color: '#dc2626', icon: '🩸', bloqueado: false },
  { codigo: 'ART',   nombre: 'Artritis Reum.',   pacientes: 0, color: '#22c55e', icon: '🦴', bloqueado: false },
  { codigo: 'ONC',   nombre: 'Oncología',        pacientes: 0, color: '#ec4899', icon: '🎗️', bloqueado: false },
];

interface ConfiguracionPageProps {
  programasActivos: Record<string, boolean>;
  onTogglePrograma: (codigo: string) => void;
}

export function ConfiguracionPage({ programasActivos, onTogglePrograma }: ConfiguracionPageProps) {
  const [seccion, setSeccion] = useState<SeccionConfig>('programas');
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const handleToggle = (prog: typeof CATALOGO_PROGRAMAS[0]) => {
    if (prog.bloqueado) return;
    // Si lo van a desactivar, pedir confirmación
    if (programasActivos[prog.codigo]) {
      setConfirmando(prog.codigo);
    } else {
      onTogglePrograma(prog.codigo);
    }
  };

  const renderContenido = () => {
    switch (seccion) {
      case 'programas':
        return (
          <div className="space-y-4">
            <p className="text-white/40 text-xs">
              Gestiona qué programas están activos en el sistema y sus parámetros globales.
            </p>
            <div className="space-y-2">
              {CATALOGO_PROGRAMAS.map((prog) => {
                const activo = !!programasActivos[prog.codigo];
                return (
                  <motion.div
                    key={prog.codigo}
                    layout
                    className="flex items-center justify-between p-3 rounded-xl border transition-colors"
                    style={{
                      borderColor: activo ? prog.color + '40' : 'rgba(255,255,255,0.06)',
                      background: activo ? prog.color + '08' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{prog.icon}</span>
                      <div>
                        <p className="text-white font-semibold text-sm">{prog.nombre}</p>
                        <p className="text-white/35 text-xs">{prog.pacientes} pacientes activos · {prog.codigo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {prog.bloqueado && (
                        <span className="text-xs text-white/30">No se puede desactivar</span>
                      )}
                      <button
                        onClick={() => handleToggle(prog)}
                        disabled={prog.bloqueado}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          prog.bloqueado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } ${activo ? 'bg-[#00B4D8]' : 'bg-white/15'}`}
                        title={prog.bloqueado ? 'No se puede desactivar' : activo ? 'Click para desactivar' : 'Click para activar'}
                      >
                        <motion.span
                          layout
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
                          style={{ left: activo ? '1.25rem' : '0.125rem' }}
                        />
                      </button>
                      <span className={`text-xs font-semibold min-w-[50px] text-right ${activo ? 'text-emerald-400' : 'text-white/30'}`}>
                        {activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );

      case 'hemodialisis':
        return <ParametrizacionHDPage />;

      case 'tamizajes':
        return (
          <div className="space-y-4">
            <p className="text-white/40 text-xs">
              Define los tamizajes requeridos por programa, periodicidad y umbrales de alerta.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { nombre: 'Hepatitis B (AgHBs)', periodo: 'Anual', prog: 'Renal/VIH', obligatorio: true },
                { nombre: 'Hepatitis C (Anti-VHC)', periodo: 'Anual', prog: 'Renal/VIH', obligatorio: true },
                { nombre: 'VIH (Tamizaje)', periodo: 'Anual', prog: 'Renal', obligatorio: true },
                { nombre: 'VDRL/RPR', periodo: 'Anual', prog: 'Renal/VIH', obligatorio: true },
                { nombre: 'Ecocardiograma', periodo: '2 años', prog: 'Renal', obligatorio: false },
                { nombre: 'Fondo de Ojo', periodo: 'Anual', prog: 'Renal', obligatorio: false },
                { nombre: 'Carga Viral VIH', periodo: 'Cada 6m', prog: 'VIH', obligatorio: true },
                { nombre: 'CD4/CD8', periodo: 'Cada 6m', prog: 'VIH', obligatorio: true },
              ].map((t) => (
                <div key={t.nombre} className="p-2.5 rounded-lg bg-white/3 border border-white/8">
                  <p className="text-white/70 font-semibold">{t.nombre}</p>
                  <p className="text-white/35 mt-0.5">Cada: {t.periodo} · {t.prog}</p>
                  {t.obligatorio && (
                    <span className="text-xs text-red-400/60 mt-1 inline-block">● Obligatorio</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'alertas':
        return (
          <div className="space-y-4">
            <p className="text-white/40 text-xs">
              Configura las reglas automáticas para generar alertas clínicas y administrativas.
            </p>
            <div className="space-y-2">
              {[
                { regla: 'Kt/V < 1.2 en sesión HD', tipo: 'Clínica Crítica', activa: true, color: '#ef4444' },
                { regla: 'URR < 65% en sesión HD', tipo: 'Clínica Crítica', activa: true, color: '#ef4444' },
                { regla: 'Tamizaje vencido > 30 días', tipo: 'Administrativa', activa: true, color: '#f59e0b' },
                { regla: 'Carga Viral > 1000 cop/mL', tipo: 'Clínica', activa: true, color: '#ef4444' },
                { regla: 'CD4 < 200 cel/µL', tipo: 'Clínica Crítica', activa: true, color: '#ef4444' },
                { regla: 'Sin sesión HD > 4 días', tipo: 'Abandono', activa: true, color: '#a855f7' },
                { regla: 'Acceso vascular vencimiento < 30d', tipo: 'Preventiva', activa: false, color: '#6b7280' },
              ].map((alerta) => (
                <div key={alerta.regla} className="flex items-center justify-between p-3 rounded-xl border border-white/8 bg-white/3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: alerta.color }} />
                    <div>
                      <p className="text-white/70 text-sm">{alerta.regla}</p>
                      <p className="text-white/30 text-xs">{alerta.tipo}</p>
                    </div>
                  </div>
                  <button
                    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                      alerta.activa ? 'bg-[#00B4D8]' : 'bg-white/15'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${alerta.activa ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🚧</p>
            <p className="text-white/40">Sección en desarrollo</p>
          </div>
        );
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-white font-black text-2xl tracking-tight">⚙️ Configuración</h1>
        <p className="text-white/40 text-sm mt-0.5">Administración del módulo Programas Especializados</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar de secciones */}
        <div className="w-52 shrink-0 space-y-1">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                seccion === s.id
                  ? 'bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/20'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/4'
              }`}
            >
              <span>{s.icon}</span>
              <span className="font-medium">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 p-5 bg-white/3 border border-white/8 rounded-xl min-h-64">
          {seccion !== 'hemodialisis' && (
            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              {SECCIONES.find((s) => s.id === seccion)?.icon}
              {SECCIONES.find((s) => s.id === seccion)?.label}
            </h3>
          )}
          <motion.div
            key={seccion}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContenido()}
          </motion.div>
        </div>
      </div>

      {/* Modal de confirmación desactivar */}
      <AnimatePresence>
        {confirmando && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="rounded-2xl p-6 w-full max-w-sm border border-white/20"
              style={{ background: '#0d1526' }}
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            >
              <p className="text-xl mb-2">⚠️</p>
              <h3 className="text-white font-bold text-lg mb-2">¿Desactivar programa?</h3>
              <p className="text-white/50 text-sm mb-5">
                El programa <strong className="text-white">{CATALOGO_PROGRAMAS.find(p => p.codigo === confirmando)?.nombre}</strong> quedará
                inactivo y no aparecerá en el dashboard. Los datos existentes no se eliminan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmando(null)}
                  className="flex-1 py-2 rounded-lg text-white/60 border border-white/20 text-sm hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { onTogglePrograma(confirmando); setConfirmando(null); }}
                  className="flex-1 py-2 rounded-xl text-white font-bold text-sm bg-red-500/80 hover:bg-red-500"
                >
                  Sí, desactivar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
