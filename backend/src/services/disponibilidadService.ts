import prisma from '../lib/prisma.js';

// ─── TIPOS ─────────────────────────────────────────────────────────────────

export interface CreateDisponibilidadRequest {
  medicoId: string;
  diaSemana: number;       // 0=Dom … 6=Sáb
  horaInicio: string;      // "08:00"
  horaFin: string;         // "18:00"
  duracionSlot?: number;   // minutos
  sede?: string;
  tipoAtencion?: string;
  consultorio?: string;
  fechaDesde?: string;     // ISO date, vigencia desde
  fechaHasta?: string;     // ISO date, vigencia hasta
}

export interface CreateBloqueRequest {
  medicoId: string;
  fechaInicio: string;   // ISO
  fechaFin: string;      // ISO
  motivo?: string;
  todoElDia?: boolean;
}

// ─── DISPONIBILIDAD ────────────────────────────────────────────────────────

export async function getDisponibilidadMedico(medicoId: string) {
  return prisma.disponibilidadMedico.findMany({
    where: { medicoId, activo: true },
    orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
  });
}

export async function createDisponibilidad(data: CreateDisponibilidadRequest) {
  const newData = {
    medicoId: data.medicoId,
    diaSemana: data.diaSemana,
    horaInicio: data.horaInicio,
    horaFin: data.horaFin,
    duracionSlot: data.duracionSlot ?? 60,
    sede: data.sede ?? 'Principal',
    tipoAtencion: data.tipoAtencion ?? 'CONSULTA',
    consultorio: data.consultorio ?? '',
    activo: true,
    fechaDesde: data.fechaDesde ? new Date(data.fechaDesde) : null,
    fechaHasta: data.fechaHasta ? new Date(data.fechaHasta) : null,
  };

  // Si ya existe una franja para ese médico y día, reemplazarla (upsert)
  const existente = await prisma.disponibilidadMedico.findFirst({
    where: { medicoId: data.medicoId, diaSemana: data.diaSemana, activo: true },
  });

  if (existente) {
    const { medicoId: _mid, ...updateFields } = newData;
    return prisma.disponibilidadMedico.update({
      where: { id: existente.id },
      data: updateFields,
    });
  }

  return prisma.disponibilidadMedico.create({ data: newData });
}

export async function updateDisponibilidad(id: string, data: Partial<CreateDisponibilidadRequest>) {
  const { medicoId, fechaDesde, fechaHasta, ...rest } = data;
  const updateData: any = { ...rest };
  if (medicoId) updateData.medico = { connect: { id: medicoId } };
  if (fechaDesde !== undefined) updateData.fechaDesde = fechaDesde ? new Date(fechaDesde) : null;
  if (fechaHasta !== undefined) updateData.fechaHasta = fechaHasta ? new Date(fechaHasta) : null;
  return prisma.disponibilidadMedico.update({ where: { id }, data: updateData });
}

export async function deleteDisponibilidad(id: string) {
  const franja = await prisma.disponibilidadMedico.findUnique({ where: { id } });
  if (!franja) throw new Error('Franja no encontrada');

  // Verificar citas futuras activas que caigan en esta franja
  const ahora = new Date();
  const citasFuturas = await prisma.cita.findMany({
    where: {
      medicoId: franja.medicoId,
      estado: { notIn: ['CANCELADA', 'NO_ASISTIO'] },
      fechaHora: { gte: ahora },
    },
    select: { id: true, fechaHora: true },
  });

  const [hIni, mIni] = franja.horaInicio.split(':').map(Number);
  const [hFin, mFin] = franja.horaFin.split(':').map(Number);
  const minIni = hIni * 60 + mIni;
  const minFin = hFin * 60 + mFin;

  const conCitas = citasFuturas.filter(c => {
    const d = new Date(c.fechaHora);
    if (d.getDay() !== franja.diaSemana) return false;
    const minCita = d.getHours() * 60 + d.getMinutes();
    return minCita >= minIni && minCita < minFin;
  });

  if (conCitas.length > 0) {
    throw new Error(
      `No se puede eliminar: hay ${conCitas.length} cita${conCitas.length !== 1 ? 's' : ''} activa${conCitas.length !== 1 ? 's' : ''} en esta franja`
    );
  }

  return prisma.disponibilidadMedico.update({ where: { id }, data: { activo: false } });
}

// ─── BLOQUEOS ──────────────────────────────────────────────────────────────

export async function getBloqueos(medicoId: string) {
  return prisma.bloqueDisponibilidad.findMany({
    where: { medicoId },
    orderBy: { fechaInicio: 'asc' },
  });
}

export async function createBloqueo(data: CreateBloqueRequest) {
  return prisma.bloqueDisponibilidad.create({
    data: {
      medicoId: data.medicoId,
      fechaInicio: new Date(data.fechaInicio),
      fechaFin: new Date(data.fechaFin),
      motivo: data.motivo ?? 'Bloqueo',
      todoElDia: data.todoElDia ?? true,
    },
  });
}

export async function deleteBloqueo(id: string) {
  return prisma.bloqueDisponibilidad.delete({ where: { id } });
}

// ─── FRANJAS CON CONTEO DE CITAS ──────────────────────────────────────────
// Devuelve todas las franjas activas del médico con cuántas citas futuras activas
// caen dentro de cada una (para preview antes de eliminar).
export async function getDisponibilidadesConCitas(medicoId: string) {
  const franjas = await prisma.disponibilidadMedico.findMany({
    where: { medicoId, activo: true },
    orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
  });

  const ahora = new Date();
  const citas = await prisma.cita.findMany({
    where: {
      medicoId,
      estado: { notIn: ['CANCELADA', 'NO_ASISTIO'] },
      fechaHora: { gte: ahora },
    },
    select: { id: true, fechaHora: true },
  });

  return franjas.map(f => {
    const [hIni, mIni] = f.horaInicio.split(':').map(Number);
    const [hFin, mFin] = f.horaFin.split(':').map(Number);
    const minIni = hIni * 60 + mIni;
    const minFin = hFin * 60 + mFin;
    const numCitas = citas.filter(c => {
      const d = new Date(c.fechaHora);
      if (d.getDay() !== f.diaSemana) return false;
      const minCita = d.getHours() * 60 + d.getMinutes();
      return minCita >= minIni && minCita < minFin;
    }).length;
    return { ...f, numCitas };
  });
}


// ─── MÉDICOS POR TIPO DE CONSULTA ──────────────────────────────────────────

/**
 * Devuelve médicos activos que tengan al menos una franja de disponibilidad
 * activa. El tipoConsultaNombre se recibe pero NO filtra por él, ya que la
 * disponibilidad es por horario y el tipo solo afecta la duración del slot.
 */
export async function getMedicosPorTipoConsulta(_tipoConsultaNombre?: string) {
  // Médicos con disponibilidad activa
  const franjas = await prisma.disponibilidadMedico.findMany({
    where: { activo: true },
    select: { medicoId: true },
    distinct: ['medicoId'],
  });

  const medicoIds = franjas.map(f => f.medicoId);

  if (medicoIds.length === 0) {
    // Sin disponibilidad configurada: devolver todos los médicos activos
    return prisma.user.findMany({
      where: { rol: 'MEDICO', activo: true },
      select: { id: true, nombre: true, apellido: true, especialidad: true, registroMedico: true },
      orderBy: [{ apellido: 'asc' }],
    });
  }

  return prisma.user.findMany({
    where: { id: { in: medicoIds }, rol: 'MEDICO', activo: true },
    select: { id: true, nombre: true, apellido: true, especialidad: true, registroMedico: true },
    orderBy: [{ apellido: 'asc' }],
  });
}

// ─── DÍAS DISPONIBLES EN UN MES ────────────────────────────────────────────

/**
 * Devuelve un array de números de día (1-31) del mes indicado que tienen
 * al menos 1 slot libre. No hace 31 consultas separadas: primero carga la
 * configuración semanal, los bloqueos del mes y las citas del mes, y luego
 * computa los días disponibles en memoria.
 */
export async function getDiasDisponibles(
  medicoId: string,
  mes: number,   // 1-12
  anio: number,
  duracionOverride?: number,
): Promise<number[]> {
  // 1. Configuración semanal del médico
  const franjas = await prisma.disponibilidadMedico.findMany({
    where: { medicoId, activo: true },
    select: { diaSemana: true, horaInicio: true, horaFin: true, duracionSlot: true },
  });
  if (franjas.length === 0) return [];

  const diasConFranja = new Set(franjas.map(f => f.diaSemana));

  // 2. Bloqueos del mes
  const inicioMes = new Date(Date.UTC(anio, mes - 1, 1));
  const finMes = new Date(Date.UTC(anio, mes, 0, 23, 59, 59));
  const bloqueos = await prisma.bloqueDisponibilidad.findMany({
    where: { medicoId, fechaInicio: { lte: finMes }, fechaFin: { gte: inicioMes } },
    select: { fechaInicio: true, fechaFin: true },
  });

  // 3. Citas ya ocupadas del mes
  const citas = await prisma.cita.findMany({
    where: {
      medicoId,
      fechaHora: { gte: inicioMes, lte: finMes },
      estado: { notIn: ['CANCELADA'] },
    },
    select: { fechaHora: true, duracionMinutos: true },
  });

  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  const diasEnMes = new Date(anio, mes, 0).getDate();
  const disponibles: number[] = [];

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaStr = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    if (fechaStr < hoyStr) continue;

    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    const diaSemana = fecha.getUTCDay();
    if (!diasConFranja.has(diaSemana)) continue;

    // ¿Hay bloqueo ese día?
    const bloqueado = bloqueos.some(b =>
      new Date(b.fechaInicio) <= new Date(fechaStr + 'T23:59:59Z') &&
      new Date(b.fechaFin) >= new Date(fechaStr + 'T00:00:00Z'),
    );
    if (bloqueado) continue;

    // Calcular slots libres en memoria (sin re-consulta)
    const franjasDelDia = franjas.filter(f => f.diaSemana === diaSemana);
    const ocupadas = new Set(
      citas
        .filter(c => {
          const d = new Date(c.fechaHora);
          const dStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
          return dStr === fechaStr;
        })
        .map(c => {
          const d = new Date(c.fechaHora);
          return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
        }),
    );

    let tieneLibre = false;
    outer: for (const f of franjasDelDia) {
      const duracion = duracionOverride ?? f.duracionSlot;
      const [hI, mI] = f.horaInicio.split(':').map(Number);
      const [hF, mF] = f.horaFin.split(':').map(Number);
      let cur = hI * 60 + mI;
      const fin = hF * 60 + mF;
      while (cur + duracion <= fin) {
        const slot = `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`;
        if (!ocupadas.has(slot)) { tieneLibre = true; break outer; }
        cur += duracion;
      }
    }
    if (tieneLibre) disponibles.push(dia);
  }

  return disponibles;
}

// ──────────────────────────────────────────────────────────────────────────
// Dado medicoId + fecha (YYYY-MM-DD) + duracionMinutos opcional (de TipoConsulta), retorna horas libres

export async function getSlotsDisponibles(medicoId: string, fecha: string, duracionOverride?: number): Promise<string[]> {
  const date = new Date(fecha + 'T00:00:00Z');
  const diaSemana = date.getUTCDay(); // 0=Dom…6=Sáb

  // 1. Obtener configuración del médico para ese día
  const disponibilidades = await prisma.disponibilidadMedico.findMany({
    where: { medicoId, diaSemana, activo: true },
  });

  if (disponibilidades.length === 0) return [];

  // 2. Verificar que no haya bloqueo ese día
  const bloqueado = await prisma.bloqueDisponibilidad.findFirst({
    where: {
      medicoId,
      fechaInicio: { lte: new Date(fecha + 'T23:59:59Z') },
      fechaFin: { gte: new Date(fecha + 'T00:00:00Z') },
    },
  });
  if (bloqueado) return [];

  // 3. Obtener citas ya programadas ese día
  const citasDelDia = await prisma.cita.findMany({
    where: {
      medicoId,
      fechaHora: {
        gte: new Date(fecha + 'T00:00:00Z'),
        lte: new Date(fecha + 'T23:59:59Z'),
      },
      estado: { notIn: ['CANCELADA'] },
    },
    select: { fechaHora: true, duracionMinutos: true },
  });

  const ocupadas = new Set(
    citasDelDia.map((c) => {
      const h = new Date(c.fechaHora);
      return `${String(h.getUTCHours()).padStart(2, '0')}:${String(h.getUTCMinutes()).padStart(2, '0')}`;
    })
  );

  // 4. Generar slots según configuración (duracion: TipoConsulta tiene prioridad sobre franja)
  const slots: string[] = [];
  for (const disp of disponibilidades) {
    const [inicioH, inicioM] = disp.horaInicio.split(':').map(Number);
    const [finH, finM] = disp.horaFin.split(':').map(Number);
    const duracion = duracionOverride ?? disp.duracionSlot;

    let totalMinutos = inicioH * 60 + inicioM;
    const finMinutos = finH * 60 + finM;

    while (totalMinutos + duracion <= finMinutos) {
      const hh = String(Math.floor(totalMinutos / 60)).padStart(2, '0');
      const mm = String(totalMinutos % 60).padStart(2, '0');
      const slot = `${hh}:${mm}`;
      if (!ocupadas.has(slot)) slots.push(slot);
      totalMinutos += duracion;
    }
  }

  return slots;
}
