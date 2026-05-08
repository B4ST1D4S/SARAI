import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  // Verificar solapamiento mismo día
  const existe = await prisma.disponibilidadMedico.findFirst({
    where: {
      medicoId: data.medicoId,
      diaSemana: data.diaSemana,
      activo: true,
      horaInicio: { lte: data.horaFin },
      horaFin: { gte: data.horaInicio },
    },
  });
  if (existe) {
    throw new Error(`Ya existe disponibilidad en ese horario para el día ${data.diaSemana}`);
  }
  return prisma.disponibilidadMedico.create({
    data: {
      ...data,
      duracionSlot: data.duracionSlot ?? 60,
      fechaDesde: data.fechaDesde ? new Date(data.fechaDesde) : undefined,
      fechaHasta: data.fechaHasta ? new Date(data.fechaHasta) : undefined,
    },
  });
}

export async function updateDisponibilidad(id: string, data: Partial<CreateDisponibilidadRequest>) {
  return prisma.disponibilidadMedico.update({ where: { id }, data });
}

export async function deleteDisponibilidad(id: string) {
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

// ─── SLOTS DISPONIBLES ────────────────────────────────────────────────────
// Dado medicoId + fecha (YYYY-MM-DD), retorna horas libres

export async function getSlotsDisponibles(medicoId: string, fecha: string): Promise<string[]> {
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

  // 4. Generar slots según configuración
  const slots: string[] = [];
  for (const disp of disponibilidades) {
    const [inicioH, inicioM] = disp.horaInicio.split(':').map(Number);
    const [finH, finM] = disp.horaFin.split(':').map(Number);
    const duracion = disp.duracionSlot;

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
