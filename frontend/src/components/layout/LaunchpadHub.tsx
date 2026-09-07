import React from "react"
import {
  Activity,
  Stethoscope,
  Scissors,
  Receipt,
  ShieldCheck,
  HeartPulse,
  Pill,
  FlaskConical,
  Syringe,
  ClipboardList,
  CalendarDays,
  Users,
  BedDouble,
  FileText,
  Search,
  Plus,
  Bell,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  LayoutGrid,
  Clock,
  Timer,
  Gauge,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

export interface MacroTile {
  id: string
  title: string
  subtitle: string
  iconName: string
  badgeCount?: number
  badgeLabel?: string
  accentColor: "blue" | "emerald" | "amber" | "purple" | "rose" | "cyan"
  defaultPageId: string
  iamResource?: string
}

export interface QuickAction {
  id: string
  label: string
  iconName: string
  pageId?: string
}

export interface KpiItem {
  id: string
  label: string
  value: string | number
  subtext?: string
  trend?: {
    direction: "up" | "down" | "neutral"
    label: string
  }
  iconName: string
  accentColor: "blue" | "emerald" | "amber" | "purple" | "rose" | "cyan"
}

interface LaunchpadHubProps {
  userName?: string
  tiles?: MacroTile[]
  quickActions?: QuickAction[]
  kpis?: KpiItem[]
  showTiles?: boolean
  onSelectMacroModule: (moduleId: string, defaultPageId: string) => void
  onQuickAction?: (actionId: string, pageId?: string) => void
}

const ICONS: Record<string, LucideIcon> = {
  Activity,
  Stethoscope,
  Scissors,
  Receipt,
  ShieldCheck,
  HeartPulse,
  Pill,
  FlaskConical,
  Syringe,
  ClipboardList,
  CalendarDays,
  Users,
  BedDouble,
  FileText,
  Search,
  Plus,
  Bell,
  Settings,
  Clock,
  Timer,
  Gauge,
  TrendingUp,
}

function resolveIcon(name: string): LucideIcon {
  return ICONS[name] ?? LayoutGrid
}

const ACCENTS: Record<
  string,
  { icon: string; iconBg: string; glow: string; badge: string; ring: string }
> = {
  blue: {
    icon: "text-blue-500 dark:text-blue-400",
    iconBg: "bg-blue-500/10 border border-blue-500/20",
    glow: "group-hover:shadow-blue-500/10",
    badge: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    ring: "group-hover:border-blue-500/50",
  },
  emerald: {
    icon: "text-emerald-500 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10 border border-emerald-500/20",
    glow: "group-hover:shadow-emerald-500/10",
    badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    ring: "group-hover:border-emerald-500/50",
  },
  amber: {
    icon: "text-amber-500 dark:text-amber-400",
    iconBg: "bg-amber-500/10 border border-amber-500/20",
    glow: "group-hover:shadow-amber-500/10",
    badge: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    ring: "group-hover:border-amber-500/50",
  },
  purple: {
    icon: "text-purple-500 dark:text-purple-400",
    iconBg: "bg-purple-500/10 border border-purple-500/20",
    glow: "group-hover:shadow-purple-500/10",
    badge: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
    ring: "group-hover:border-purple-500/50",
  },
  rose: {
    icon: "text-rose-500 dark:text-rose-400",
    iconBg: "bg-rose-500/10 border border-rose-500/20",
    glow: "group-hover:shadow-rose-500/10",
    badge: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    ring: "group-hover:border-rose-500/50",
  },
  cyan: {
    icon: "text-cyan-500 dark:text-cyan-400",
    iconBg: "bg-cyan-500/10 border border-cyan-500/20",
    glow: "group-hover:shadow-cyan-500/10",
    badge: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
    ring: "group-hover:border-cyan-500/50",
  },
}

function resolveAccent(color: string) {
  return ACCENTS[color] ?? ACCENTS.blue
}

export const SARAI_DEFAULT_TILES: MacroTile[] = [
  {
    id: "CONSULTA",
    title: "Consulta Externa & Asistencial",
    subtitle: "Historias clínicas generales, odontología, estética y citas ambulatorias",
    iconName: "Stethoscope",
    badgeCount: 8,
    badgeLabel: "pacientes hoy",
    accentColor: "blue",
    defaultPageId: "pacientes",
  },
  {
    id: "CIRUGIA",
    title: "Cirugía & Quirófano",
    subtitle: "Programación quirúrgica, vista cirujano y consentimientos informados",
    iconName: "Scissors",
    badgeCount: 2,
    badgeLabel: "en procedimiento",
    accentColor: "cyan",
    defaultPageId: "vista-cirujano",
  },
  {
    id: "FACTURACION",
    title: "Facturación & FEV-RIPS",
    subtitle: "Validación Res. 2275, liquidación CUPS, contratos y cotizaciones",
    iconName: "Receipt",
    badgeCount: 14,
    badgeLabel: "pendientes CUV",
    accentColor: "amber",
    defaultPageId: "facturacion",
  },
  {
    id: "ADMINISTRACION",
    title: "Administración & Seguridad",
    subtitle: "Gestión de usuarios, auditoría, roles IAM y parametrización clínica",
    iconName: "ShieldCheck",
    accentColor: "emerald",
    defaultPageId: "admin",
  },
]

export const SARAI_DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: "nueva-historia", label: "Nueva Consulta / HC", iconName: "Plus", pageId: "historia" },
  { id: "buscar-paciente", label: "Directorio Pacientes", iconName: "Search", pageId: "pacientes" },
  { id: "agenda", label: "Agenda Médica", iconName: "CalendarDays", pageId: "agenda" },
  { id: "admision", label: "Triaje y Admisión", iconName: "Users", pageId: "admision" },
]

export const SARAI_DEFAULT_KPIS: KpiItem[] = [
  {
    id: "pacientes-ingresados",
    label: "Pacientes en Espera",
    value: 12,
    subtext: "Promedio: 14 min",
    trend: { direction: "down", label: "-4 min" },
    iconName: "Users",
    accentColor: "blue",
  },
  {
    id: "consultas-hoy",
    label: "Consultas Atendidas",
    value: 28,
    subtext: "Meta diaria: 40",
    trend: { direction: "up", label: "+15%" },
    iconName: "Activity",
    accentColor: "emerald",
  },
  {
    id: "rips-pendientes",
    label: "RIPS por Validar",
    value: 9,
    subtext: "Res. 2275 MSPS",
    trend: { direction: "neutral", label: "Al día" },
    iconName: "Receipt",
    accentColor: "amber",
  },
  {
    id: "quirofano-uso",
    label: "Ocupación Quirófano",
    value: "85%",
    subtext: "2 cirugías en curso",
    trend: { direction: "up", label: "+5%" },
    iconName: "Gauge",
    accentColor: "cyan",
  },
]

const TREND_ICONS = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  neutral: Minus,
} as const

const TREND_STYLES = {
  up: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  down: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20",
  neutral: "bg-white/10 text-gray-400 border border-white/10",
} as const

function getSaludo(): string {
  const hora = new Date().getHours()
  if (hora < 12) return "Buenos días"
  if (hora < 18) return "Buenas tardes"
  return "Buenas noches"
}

export function LaunchpadHub({
  userName,
  tiles = SARAI_DEFAULT_TILES,
  quickActions = SARAI_DEFAULT_QUICK_ACTIONS,
  kpis = SARAI_DEFAULT_KPIS,
  showTiles = true,
  onSelectMacroModule,
  onQuickAction,
}: LaunchpadHubProps) {
  return (
    <section
      aria-label="Portal de módulos SARAI"
      className="w-full max-w-7xl mx-auto rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md sm:p-8 transition-colors duration-200 select-none"
    >
      {/* Encabezado */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-inner">
            <HeartPulse className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {getSaludo()}
            </p>
            <h1 className="text-balance text-xl font-bold tracking-tight text-white sm:text-2xl">
              {userName ? `Bienvenido, ${userName}` : "Bienvenido a SARAI"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onQuickAction?.("notificaciones")}
            aria-label="Notificaciones"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#080a0f]" />
          </button>
          <button
            type="button"
            onClick={() => onQuickAction?.("configuracion", "admin")}
            aria-label="Configuración"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Accesos rápidos */}
      {quickActions.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2.5">
          {quickActions.map((action) => {
            const Icon = resolveIcon(action.iconName)
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onQuickAction?.(action.id, action.pageId)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-gray-200 transition-all hover:bg-white/10 hover:border-cyan-500/40 hover:text-cyan-300"
              >
                <Icon className="h-4 w-4 text-gray-400 group-hover:text-cyan-400" aria-hidden="true" />
                {action.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Cinta compacta de KPIs del Turno */}
      {kpis.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Indicadores del Turno
            </h2>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 font-semibold ml-1">
              En Vivo
            </span>
          </div>

          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map((kpi) => {
              const Icon = resolveIcon(kpi.iconName)
              const accent = resolveAccent(kpi.accentColor)
              const TrendIcon = kpi.trend ? TREND_ICONS[kpi.trend.direction] : null
              return (
                <li
                  key={kpi.id}
                  className="flex min-h-[76px] flex-col justify-center gap-1 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Icon className={["h-4 w-4 shrink-0", accent.icon].join(" ")} aria-hidden="true" />
                      <span className="truncate text-[11px] font-medium uppercase tracking-wide text-gray-400">
                        {kpi.label}
                      </span>
                    </span>

                    {kpi.trend && TrendIcon && (
                      <span
                        className={[
                          "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                          TREND_STYLES[kpi.trend.direction],
                        ].join(" ")}
                      >
                        <TrendIcon className="h-2.5 w-2.5" aria-hidden="true" />
                        <span>{kpi.trend.label}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-bold leading-none tracking-tight text-white">
                      {kpi.value}
                    </span>
                    {kpi.subtext && (
                      <span className="truncate text-[11px] text-gray-500">
                        {kpi.subtext}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Módulos principales: solo visibles en modo Hub */}
      {showTiles && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Macro-Módulos del Sistema
              </h2>
            </div>
            <span className="text-[11px] text-gray-500">Seleccione un entorno para desplegar funciones</span>
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((tile) => {
              const Icon = resolveIcon(tile.iconName)
              const accent = resolveAccent(tile.accentColor)
              return (
                <li key={tile.id}>
                  <button
                    type="button"
                    onClick={() => onSelectMacroModule(tile.id, tile.defaultPageId)}
                    className={[
                      "group relative flex h-full w-full flex-col justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-5 text-left backdrop-blur-md transition-all duration-200",
                      "hover:bg-white/[0.05] hover:shadow-xl hover:-translate-y-0.5",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                      accent.glow,
                      accent.ring,
                    ].join(" ")}
                  >
                    <div className="flex w-full items-start justify-between">
                      <span
                        className={[
                          "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
                          accent.iconBg,
                          accent.icon,
                        ].join(" ")}
                      >
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </span>

                      {typeof tile.badgeCount === "number" && (
                        <span
                          className={[
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                            accent.badge,
                          ].join(" ")}
                        >
                          {tile.badgeCount}
                          {tile.badgeLabel && (
                            <span className="font-normal opacity-85 text-[10px] ml-1">{tile.badgeLabel}</span>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="flex items-center gap-1.5 text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {tile.title}
                        <ArrowUpRight
                          className="h-4 w-4 text-gray-500 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 group-hover:text-cyan-300"
                          aria-hidden="true"
                        />
                      </h3>
                      <p className="mt-1 text-pretty text-xs leading-relaxed text-gray-400">
                        {tile.subtitle}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}

export default LaunchpadHub