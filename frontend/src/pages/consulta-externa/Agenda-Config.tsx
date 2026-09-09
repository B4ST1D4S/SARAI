"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building2,
  MapPin,
  Stethoscope,
  User,
  Zap,
  Sparkles,
  Filter,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Video,
  Repeat,
  type LucideIcon,
} from "lucide-react"

type SelectOption = { value: string; label: string; hint?: string }

const SEDES: SelectOption[] = [
  { value: "norte", label: "Sede Principal Norte", hint: "Av. Libertador 1200" },
  { value: "sur", label: "Sede Sur - Ambulatorio", hint: "Calle 45 #22-10" },
  { value: "este", label: "Sede Este - Torre Médica", hint: "Cra. 7 #90-33" },
]

const DEPARTAMENTOS: SelectOption[] = [
  { value: "consulta-externa", label: "Consulta Externa Ambulatoria" },
  { value: "urgencias", label: "Urgencias y Observación" },
  { value: "cirugia", label: "Cirugía Programada" },
  { value: "imagenes", label: "Imágenes Diagnósticas" },
]

const CONSULTORIOS: SelectOption[] = [
  { value: "101", label: "Consultorio 101", hint: "Piso 1 · Ala A" },
  { value: "102", label: "Consultorio 102", hint: "Piso 1 · Ala A" },
  { value: "205", label: "Consultorio 205", hint: "Piso 2 · Ala B" },
  { value: "eco-1", label: "Sala de Ecografía 1", hint: "Piso 2 · Ala C" },
]

const ESPECIALIDADES: SelectOption[] = [
  { value: "cardiologia", label: "Cardiología" },
  { value: "dermatologia", label: "Dermatología" },
  { value: "pediatria", label: "Pediatría" },
  { value: "ortopedia", label: "Ortopedia y Traumatología" },
]

const PROFESIONALES: SelectOption[] = [
  { value: "cruiz", label: "Dr. Carlos Ruiz", hint: "Cardiólogo · RM 45291" },
  { value: "mlopez", label: "Dra. María López", hint: "Cardióloga · RM 51022" },
  { value: "jgomez", label: "Dr. Javier Gómez", hint: "Internista · RM 38771" },
]

const TIPOS_CONSULTA: (SelectOption & { duration: number })[] = [
  { value: "primera-vez", label: "Primera Vez", duration: 30 },
  { value: "control", label: "Control / Seguimiento", duration: 20 },
  { value: "procedimiento", label: "Procedimiento Menor", duration: 45 },
  { value: "teleconsulta", label: "Teleconsulta", duration: 15 },
]

const DIAS = [
  { key: "lun", label: "Lun", weekday: true },
  { key: "mar", label: "Mar", weekday: true },
  { key: "mie", label: "Mié", weekday: true },
  { key: "jue", label: "Jue", weekday: true },
  { key: "vie", label: "Vie", weekday: true },
  { key: "sab", label: "Sáb", weekday: false },
  { key: "dom", label: "Dom", weekday: false },
] as const

const HORIZONTES = [
  { key: "dia", label: "Día Específico" },
  { key: "semana", label: "Semana Actual" },
  { key: "mes", label: "Mes Completo" },
  { key: "rango", label: "Rango Personalizado" },
] as const

const INTERVALOS = [5, 10, 15, 20, 30, 45] as const

const MODALIDADES = [
  { key: "presencial", label: "Presencial", icon: Building2 },
  { key: "telemedicina", label: "Telemedicina", icon: Video },
  { key: "hibrida", label: "Híbrida", icon: Zap },
] as const

type Shift = { id: string; start: string; end: string }

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  const diff = eh * 60 + em - (sh * 60 + sm)
  return diff > 0 ? diff : 0
}

function addMinutes(time: string, add: number): string {
  const [h, m] = time.split(":").map(Number)
  const total = h * 60 + m + add
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

/* ---------- Small presentational primitives ---------- */

function FieldLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-400">
      <Icon className="h-3.5 w-3.5 text-amber-400/80" aria-hidden="true" />
      {children}
    </label>
  )
}

function CustomSelect({
  icon,
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  icon: LucideIcon
  label: string
  options: SelectOption[]
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <div className="relative">
      <FieldLabel icon={icon}>{label}</FieldLabel>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors",
          "border-slate-800/80 bg-slate-950/60 hover:border-amber-500/40",
          open ? "border-amber-500/60 ring-1 ring-amber-500/20" : "",
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className={selected ? "block truncate text-gray-100" : "block truncate text-gray-500"}>
            {selected ? selected.label : placeholder}
          </span>
          {selected?.hint && <span className="block truncate text-[11px] text-gray-500">{selected.hint}</span>}
        </span>
        <ChevronRight
          className={["h-4 w-4 shrink-0 text-gray-500 transition-transform", open ? "rotate-90" : ""].join(" ")}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.ul
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute z-20 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-slate-800/80 bg-slate-900/95 p-1 shadow-2xl shadow-black/50 backdrop-blur-md"
              role="listbox"
            >
              {options.map((o) => {
                const active = o.value === value
                return (
                  <li key={o.value} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(o.value)
                        setOpen(false)
                      }}
                      className={[
                        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        active ? "bg-amber-500/15 text-amber-200" : "text-gray-300 hover:bg-white/5",
                      ].join(" ")}
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{o.label}</span>
                        {o.hint && <span className="block truncate text-[11px] text-gray-500">{o.hint}</span>}
                      </span>
                      {active && <CheckCircle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />}
                    </button>
                  </li>
                )
              })}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function StepHeader({ index, title, subtitle }: { index: number; title: string; subtitle: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20">
        {index}
      </span>
      <div>
        <h3 className="text-base font-semibold text-gray-100">{title}</h3>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  )
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={[
        "rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  )
}

/* ---------- Main component ---------- */

export default function AgendaConfig() {
  // Step 1
  const [sede, setSede] = useState("norte")
  const [departamento, setDepartamento] = useState("consulta-externa")
  const [consultorio, setConsultorio] = useState("101")
  const [especialidad, setEspecialidad] = useState("cardiologia")
  const [profesional, setProfesional] = useState("cruiz")
  const [tipoConsulta, setTipoConsulta] = useState("control")

  // Step 2
  const [horizonte, setHorizonte] = useState<(typeof HORIZONTES)[number]["key"]>("mes")
  const [startDate, setStartDate] = useState("2026-09-08")
  const [endDate, setEndDate] = useState("2026-10-08")
  const [days, setDays] = useState<Record<string, boolean>>({
    lun: true,
    mar: true,
    mie: true,
    jue: true,
    vie: true,
    sab: false,
    dom: false,
  })
  const [excludeHolidays, setExcludeHolidays] = useState(true)
  const [exclusions, setExclusions] = useState<string[]>(["25 Dic", "01 Ene"])
  const [newExclusion, setNewExclusion] = useState("")

  // Step 3
  const [shifts, setShifts] = useState<Shift[]>([
    { id: "s1", start: "08:00", end: "12:00" },
    { id: "s2", start: "14:00", end: "18:00" },
  ])
  const [interval, setInterval] = useState<number>(20)
  const [customInterval, setCustomInterval] = useState("")
  const [overbooking, setOverbooking] = useState("2")
  const [modalidad, setModalidad] = useState<(typeof MODALIDADES)[number]["key"]>("presencial")

  const tipo = TIPOS_CONSULTA.find((t) => t.value === tipoConsulta)
  const activeInterval = customInterval ? Number(customInterval) : interval

  const activeDaysCount = Object.values(days).filter(Boolean).length

  const dailyMinutes = useMemo(
    () => shifts.reduce((sum, s) => sum + minutesBetween(s.start, s.end), 0),
    [shifts],
  )

  // Rough horizon estimate (weeks in range) for a lively counter.
  const weeksInRange = useMemo(() => {
    const s = new Date(startDate).getTime()
    const e = new Date(endDate).getTime()
    if (isNaN(s) || isNaN(e) || e < s) return 1
    return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24 * 7)))
  }, [startDate, endDate])

  const totalDias = horizonte === "dia" ? 1 : activeDaysCount * weeksInRange
  const slotsPerDay = activeInterval > 0 ? Math.floor(dailyMinutes / activeInterval) : 0
  const cuposEstimados = slotsPerDay * totalDias
  const horasAsistenciales = Math.round((dailyMinutes / 60) * totalDias)

  const previewSlots = useMemo(() => {
    if (!shifts[0] || activeInterval <= 0) return []
    const out: string[] = []
    let t = shifts[0].start
    for (let i = 0; i < 8; i++) {
      out.push(t)
      t = addMinutes(t, activeInterval)
      if (minutesBetween(shifts[0].start, t) > minutesBetween(shifts[0].start, shifts[0].end)) break
    }
    return out
  }, [shifts, activeInterval])

  const toggleDay = (key: string) => setDays((d) => ({ ...d, [key]: !d[key] }))
  const setWeekdays = () =>
    setDays({ lun: true, mar: true, mie: true, jue: true, vie: true, sab: false, dom: false })
  const setAllDays = () =>
    setDays({ lun: true, mar: true, mie: true, jue: true, vie: true, sab: true, dom: true })

  const addShift = () =>
    setShifts((s) => [...s, { id: `s${Date.now()}`, start: "18:00", end: "20:00" }])
  const removeShift = (id: string) => setShifts((s) => s.filter((sh) => sh.id !== id))
  const updateShift = (id: string, field: "start" | "end", value: string) =>
    setShifts((s) => s.map((sh) => (sh.id === id ? { ...sh, [field]: value } : sh)))

  const addExclusion = () => {
    const v = newExclusion.trim()
    if (v && !exclusions.includes(v)) setExclusions((e) => [...e, v])
    setNewExclusion("")
  }

  return (
    <div className="min-h-screen bg-[#080a0f] px-4 py-8 text-gray-200 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow-lg shadow-amber-500/25">
              <Calendar className="h-5 w-5 text-slate-950" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-50">Configuración de Agenda Médica</h1>
              <p className="text-sm text-gray-500">SARAI HIS · Generación masiva de disponibilidad</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Asistente inteligente
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(320px,0.55fr)]">
          {/* LEFT: Wizard */}
          <div className="space-y-6">
            {/* Step 1 */}
            <Card>
              <StepHeader
                index={1}
                title="Definición Asistencial & Espacio Físico"
                subtitle="Ubicación, recurso y perfil del prestador"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CustomSelect
                  icon={MapPin}
                  label="Sede"
                  options={SEDES}
                  value={sede}
                  onChange={setSede}
                  placeholder="Seleccione sede"
                />
                <CustomSelect
                  icon={Building2}
                  label="Departamento / Servicio"
                  options={DEPARTAMENTOS}
                  value={departamento}
                  onChange={setDepartamento}
                  placeholder="Seleccione servicio"
                />
                <CustomSelect
                  icon={Building2}
                  label="Consultorio / Recurso"
                  options={CONSULTORIOS}
                  value={consultorio}
                  onChange={setConsultorio}
                  placeholder="Seleccione recurso"
                />
                <CustomSelect
                  icon={Stethoscope}
                  label="Especialidad Médica"
                  options={ESPECIALIDADES}
                  value={especialidad}
                  onChange={setEspecialidad}
                  placeholder="Seleccione especialidad"
                />
                <CustomSelect
                  icon={User}
                  label="Profesional Asignado"
                  options={PROFESIONALES}
                  value={profesional}
                  onChange={setProfesional}
                  placeholder="Seleccione profesional"
                />
                <div>
                  <CustomSelect
                    icon={Filter}
                    label="Tipo de Consulta"
                    options={TIPOS_CONSULTA}
                    value={tipoConsulta}
                    onChange={setTipoConsulta}
                    placeholder="Seleccione tipo"
                  />
                  {tipo && (
                    <motion.span
                      key={tipo.value}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300"
                    >
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      Duración por defecto: {tipo.duration} min
                    </motion.span>
                  )}
                </div>
              </div>
            </Card>

            {/* Step 2 */}
            <Card>
              <StepHeader
                index={2}
                title="Horizonte Temporal & Reglas de Repetición"
                subtitle="Rango de fechas, días activos y exclusiones"
              />

              <div className="mb-5 flex flex-wrap gap-2">
                {HORIZONTES.map((h) => {
                  const active = horizonte === h.key
                  return (
                    <motion.button
                      key={h.key}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setHorizonte(h.key)}
                      className={[
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-amber-500/50 bg-amber-500/15 text-amber-200"
                          : "border-slate-800/80 bg-slate-950/40 text-gray-400 hover:border-amber-500/30",
                      ].join(" ")}
                    >
                      {h.label}
                    </motion.button>
                  )
                })}
              </div>

              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel icon={Calendar}>Fecha de Inicio</FieldLabel>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-800/80 bg-slate-950/60 px-3.5 py-2.5 text-sm text-gray-100 outline-none transition-colors [color-scheme:dark] focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <FieldLabel icon={Calendar}>Fecha de Fin</FieldLabel>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-800/80 bg-slate-950/60 px-3.5 py-2.5 text-sm text-gray-100 outline-none transition-colors [color-scheme:dark] focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <FieldLabel icon={Repeat}>Días de la semana</FieldLabel>
                  <div className="flex gap-3 text-[11px]">
                    <button
                      type="button"
                      onClick={setWeekdays}
                      className="font-medium text-amber-400 hover:text-amber-300"
                    >
                      Lunes a Viernes
                    </button>
                    <button
                      type="button"
                      onClick={setAllDays}
                      className="font-medium text-amber-400 hover:text-amber-300"
                    >
                      Todos
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DIAS.map((d) => {
                    const active = days[d.key]
                    return (
                      <motion.button
                        key={d.key}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleDay(d.key)}
                        className={[
                          "h-10 w-12 rounded-lg border text-xs font-semibold transition-colors",
                          active
                            ? "border-amber-500/50 bg-gradient-to-br from-yellow-400/20 to-amber-600/20 text-amber-200"
                            : "border-slate-800/80 bg-slate-950/40 text-gray-500 hover:border-amber-500/30",
                        ].join(" ")}
                      >
                        {d.label}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
                <button
                  type="button"
                  onClick={() => setExcludeHolidays((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <span className="text-sm text-gray-300">Excluir domingos y festivos nacionales</span>
                  <span
                    className={[
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                      excludeHolidays ? "bg-gradient-to-r from-yellow-400 to-amber-600" : "bg-slate-700",
                    ].join(" ")}
                  >
                    <motion.span
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={[
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow",
                        excludeHolidays ? "left-[22px]" : "left-0.5",
                      ].join(" ")}
                    />
                  </span>
                </button>

                <div>
                  <span className="mb-2 block text-[11px] font-medium text-gray-500">
                    Exclusiones personalizadas
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <AnimatePresence>
                      {exclusions.map((ex) => (
                        <motion.span
                          key={ex}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 px-2.5 py-1 text-xs text-gray-300"
                        >
                          {ex}
                          <button
                            type="button"
                            onClick={() => setExclusions((e) => e.filter((x) => x !== ex))}
                            className="text-gray-500 hover:text-amber-400"
                            aria-label={`Quitar exclusión ${ex}`}
                          >
                            <X className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                    <input
                      value={newExclusion}
                      onChange={(e) => setNewExclusion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                          e.preventDefault()
                          addExclusion()
                        }
                      }}
                      placeholder="+ Fecha"
                      className="w-24 rounded-lg border border-slate-800/80 bg-slate-950/60 px-2.5 py-1 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-amber-500/50"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Step 3 */}
            <Card>
              <StepHeader
                index={3}
                title="Jornada, Intervalos & Capacidad"
                subtitle="Bloques horarios, duración de cita y modalidad"
              />

              <div className="mb-5 space-y-3">
                <AnimatePresence initial={false}>
                  {shifts.map((s, i) => (
                    <motion.div
                      key={s.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-bold text-amber-300">
                        {i + 1}
                      </span>
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="time"
                          value={s.start}
                          onChange={(e) => updateShift(s.id, "start", e.target.value)}
                          className="flex-1 rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-sm text-gray-100 outline-none [color-scheme:dark] focus:border-amber-500/60"
                        />
                        <span className="text-gray-600">—</span>
                        <input
                          type="time"
                          value={s.end}
                          onChange={(e) => updateShift(s.id, "end", e.target.value)}
                          className="flex-1 rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-sm text-gray-100 outline-none [color-scheme:dark] focus:border-amber-500/60"
                        />
                      </div>
                      {shifts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeShift(s.id)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                          aria-label={`Eliminar jornada ${i + 1}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={addShift}
                  className="flex items-center gap-1.5 text-xs font-medium text-amber-400 transition-colors hover:text-amber-300"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Agregar otra jornada
                </button>
              </div>

              <div className="mb-5">
                <FieldLabel icon={Clock}>Duración del intervalo</FieldLabel>
                <div className="flex flex-wrap items-center gap-2">
                  {INTERVALOS.map((iv) => {
                    const active = !customInterval && interval === iv
                    return (
                      <motion.button
                        key={iv}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setInterval(iv)
                          setCustomInterval("")
                        }}
                        className={[
                          "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "border-amber-500/50 bg-amber-500/15 text-amber-200"
                            : "border-slate-800/80 bg-slate-950/40 text-gray-400 hover:border-amber-500/30",
                        ].join(" ")}
                      >
                        {iv} min
                      </motion.button>
                    )
                  })}
                  <input
                    type="number"
                    min={1}
                    value={customInterval}
                    onChange={(e) => setCustomInterval(e.target.value)}
                    placeholder="Otro"
                    className="w-20 rounded-lg border border-slate-800/80 bg-slate-950/60 px-2.5 py-1.5 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel icon={AlertTriangle}>Sobrecupos máximos permitidos</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    value={overbooking}
                    onChange={(e) => setOverbooking(e.target.value)}
                    className="w-full rounded-xl border border-slate-800/80 bg-slate-950/60 px-3.5 py-2.5 text-sm text-gray-100 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <FieldLabel icon={Zap}>Modalidad</FieldLabel>
                  <div className="flex gap-2">
                    {MODALIDADES.map((m) => {
                      const active = modalidad === m.key
                      const Icon = m.icon
                      return (
                        <motion.button
                          key={m.key}
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setModalidad(m.key)}
                          className={[
                            "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors",
                            active
                              ? "border-amber-500/50 bg-amber-500/15 text-amber-200"
                              : "border-slate-800/80 bg-slate-950/40 text-gray-400 hover:border-amber-500/30",
                          ].join(" ")}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          {m.label}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT: Live preview (sticky) */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <Card className="border-amber-500/20">
              <div className="mb-5 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 shadow-lg shadow-amber-500/20">
                  <Sparkles className="h-4 w-4 text-slate-950" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold text-gray-100">Resumen de Impacto en Vivo</h3>
              </div>

              <div className="mb-5 grid grid-cols-3 gap-2">
                <Metric label="Total Días" value={totalDias} />
                <Metric label="Cupos Estimados" value={cuposEstimados} highlight />
                <Metric label="Horas Asist." value={horasAsistenciales} suffix="h" />
              </div>

              <div className="mb-5">
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Vista previa de cupos
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <AnimatePresence mode="popLayout">
                    {previewSlots.map((slot) => (
                      <motion.span
                        key={slot}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="rounded-md border border-slate-800/80 bg-slate-950/60 px-2 py-1 text-[11px] font-medium text-gray-300"
                      >
                        {slot}
                      </motion.span>
                    ))}
                    {previewSlots.length > 0 && (
                      <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-300">
                        +{Math.max(0, (slotsPerDay || 0) - previewSlots.length)} más
                      </span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                <span className="text-xs font-medium text-emerald-300">Sin cruces de agenda detectados</span>
              </div>

              <div className="flex flex-col gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-yellow-400 to-amber-600 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition-shadow hover:shadow-amber-500/40"
                >
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  Confirmar y Generar Agenda
                </motion.button>
                <button
                  type="button"
                  className="rounded-xl border border-slate-800/80 px-4 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-slate-700 hover:text-gray-200"
                >
                  Cancelar / Limpiar
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  suffix = "",
  highlight = false,
}: {
  label: string
  value: number
  suffix?: string
  highlight?: boolean
}) {
  return (
    <div
      className={[
        "rounded-xl border p-3 text-center",
        highlight
          ? "border-amber-500/30 bg-gradient-to-br from-yellow-400/10 to-amber-600/10"
          : "border-slate-800/80 bg-slate-950/40",
      ].join(" ")}
    >
      <motion.p
        key={value}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={[
          "text-xl font-bold tabular-nums",
          highlight ? "text-amber-300" : "text-gray-100",
        ].join(" ")}
      >
        {value.toLocaleString("es")}
        {suffix}
      </motion.p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  )
}
