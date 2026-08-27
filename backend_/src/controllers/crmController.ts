import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

// ─────────────────────────────────────────────
// GET /api/crm/leads  — listar leads
// ─────────────────────────────────────────────
export async function getLeads(req: Request, res: Response): Promise<void> {
  try {
    const { etapa, calificacion, search, limit = '100', offset = '0' } = req.query as Record<string, string>;

    const where: any = {};
    if (etapa && etapa !== 'TODOS') where.etapa = etapa;
    if (calificacion) where.calificacion = calificacion;
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } },
        { email:    { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.crmLead.findMany({
        where,
        include: { paciente: { select: { id: true, nombreCompleto: true, numeroDocumento: true } } },
        orderBy: [{ updatedAt: 'desc' }],
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.crmLead.count({ where }),
    ]);

    res.json({ success: true, total, leads });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────
// GET /api/crm/stats  — KPIs del dashboard
// ─────────────────────────────────────────────
export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalLeads,
      leadsEstesMes,
      convertidos,
      perdidos,
      porEtapa,
      porCalificacion,
      valorPipeline,
      seguimientosHoy,
    ] = await Promise.all([
      prisma.crmLead.count(),
      prisma.crmLead.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.crmLead.count({ where: { etapa: 'CONVERTIDO' } }),
      prisma.crmLead.count({ where: { etapa: 'PERDIDO' } }),
      prisma.crmLead.groupBy({ by: ['etapa'], _count: { id: true }, _sum: { valorEstimado: true } }),
      prisma.crmLead.groupBy({ by: ['calificacion'], _count: { id: true } }),
      prisma.crmLead.aggregate({ _sum: { valorEstimado: true } }),
      prisma.crmLead.count({
        where: {
          proximoContacto: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt:  new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
        },
      }),
    ]);

    const tasaConversion = totalLeads > 0 ? Math.round((convertidos / totalLeads) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalLeads,
        leadsEstesMes,
        convertidos,
        perdidos,
        tasaConversion,
        valorPipeline: valorPipeline._sum.valorEstimado ?? 0,
        seguimientosHoy,
        porEtapa,
        porCalificacion,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────
// POST /api/crm/leads  — crear lead
// ─────────────────────────────────────────────
export async function createLead(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }

    const {
      nombre, telefono, email, procedimientos, etapa, calificacion,
      valorEstimado, origen, notas, observaciones, tags,
      pacienteId, proximoContacto,
    } = req.body;

    if (!nombre) { res.status(400).json({ error: 'El nombre es obligatorio' }); return; }

    const lead = await prisma.crmLead.create({
      data: {
        nombre,
        telefono:       telefono   ?? null,
        email:          email      ?? null,
        procedimientos: procedimientos ?? [],
        etapa:          etapa      ?? 'NUEVO_LEAD',
        calificacion:   calificacion ?? 'COLD',
        valorEstimado:  valorEstimado ? parseFloat(valorEstimado) : 0,
        origen:         origen     ?? null,
        notas:          notas      ?? null,
        observaciones:  observaciones ?? null,
        tags:           tags       ?? [],
        pacienteId:     pacienteId ?? null,
        creadoPor:      req.user.userId,
        proximoContacto: proximoContacto ? new Date(proximoContacto) : null,
        ultimaInteraccion: new Date(),
      },
      include: { paciente: { select: { id: true, nombreCompleto: true } } },
    });

    res.status(201).json({ success: true, lead });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────
// PUT /api/crm/leads/:id  — actualizar lead
// ─────────────────────────────────────────────
export async function updateLead(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }

    const { id } = req.params;
    const {
      nombre, telefono, email, procedimientos, etapa, calificacion,
      valorEstimado, origen, notas, observaciones, tags,
      pacienteId, proximoContacto,
    } = req.body;

    const existing = await prisma.crmLead.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ error: 'Lead no encontrado' }); return; }

    const data: any = { ultimaInteraccion: new Date() };
    if (nombre        !== undefined) data.nombre        = nombre;
    if (telefono      !== undefined) data.telefono      = telefono;
    if (email         !== undefined) data.email         = email;
    if (procedimientos!== undefined) data.procedimientos= procedimientos;
    if (etapa         !== undefined) data.etapa         = etapa;
    if (calificacion  !== undefined) data.calificacion  = calificacion;
    if (valorEstimado !== undefined) data.valorEstimado = parseFloat(valorEstimado);
    if (origen        !== undefined) data.origen        = origen;
    if (notas         !== undefined) data.notas         = notas;
    if (observaciones !== undefined) data.observaciones = observaciones;
    if (tags          !== undefined) data.tags          = tags;
    if (pacienteId    !== undefined) data.pacienteId    = pacienteId ?? null;
    if (proximoContacto !== undefined) data.proximoContacto = proximoContacto ? new Date(proximoContacto) : null;

    const lead = await prisma.crmLead.update({
      where: { id },
      data,
      include: { paciente: { select: { id: true, nombreCompleto: true } } },
    });

    res.json({ success: true, lead });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────
// DELETE /api/crm/leads/:id  — eliminar lead
// ─────────────────────────────────────────────
export async function deleteLead(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }

    const { id } = req.params;
    const existing = await prisma.crmLead.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ error: 'Lead no encontrado' }); return; }

    await prisma.crmLead.delete({ where: { id } });
    res.json({ success: true, message: 'Lead eliminado' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────
// POST /api/crm/sync  — importar cotizaciones existentes
// ─────────────────────────────────────────────
export async function syncLeads(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }

    // Traer todas las cotizaciones con datos del paciente
    const cotizaciones = await prisma.cotizacion.findMany({
      include: {
        paciente: {
          select: { id: true, nombreCompleto: true, telefonos: true, email: true, whatsapp: true },
        },
      },
      orderBy: { creadoEn: 'desc' },
    });

    // IDs de pacientes que ya tienen un lead en el CRM
    const existingLeads = await prisma.crmLead.findMany({
      where: { pacienteId: { not: null } },
      select: { pacienteId: true },
    });
    const existingPacienteIds = new Set(existingLeads.map(l => l.pacienteId));

    // Agrupar por paciente — nos quedamos con la cotización más reciente (índice 0)
    const byPaciente = new Map<string, typeof cotizaciones[0]>();
    for (const cot of cotizaciones) {
      if (!byPaciente.has(cot.pacienteId)) byPaciente.set(cot.pacienteId, cot);
    }

    let created = 0;
    let skipped = 0;

    for (const [pacienteId, cot] of byPaciente.entries()) {
      if (existingPacienteIds.has(pacienteId)) { skipped++; continue; }

      const paciente = cot.paciente;

      // Extraer nombres de procedimientos desde las líneas (formato: "Nombre — Zonas")
      const lineas = Array.isArray(cot.lineas) ? (cot.lineas as any[]) : [];
      const procedimientos = lineas
        .map((l: any) => {
          const desc: string = l.descripcion ?? '';
          return desc.split(' — ')[0].split(' - ')[0].trim();
        })
        .filter((p: string) => p.length > 0)
        .slice(0, 10);

      // Etapa basada en el estado de la cotización
      let etapa = 'COTIZACION_ENVIADA';
      if (cot.estado === 'ACEPTADA')  etapa = 'CONVERTIDO';
      if (cot.estado === 'RECHAZADA') etapa = 'PERDIDO';

      // Calificación: HOT si aceptada, WARM en otros casos
      const calificacion = cot.estado === 'ACEPTADA' ? 'HOT' : 'WARM';

      const telefono = (paciente.whatsapp || paciente.telefonos?.[0]) ?? null;

      await prisma.crmLead.create({
        data: {
          nombre:            paciente.nombreCompleto,
          telefono,
          email:             paciente.email ?? null,
          procedimientos,
          etapa,
          calificacion,
          valorEstimado:     cot.total,
          origen:            'PRESENCIAL',
          notas:             `Cotización: ${cot.descripcionServicio}`,
          tags:              ['importado'],
          pacienteId,
          creadoPor:         req.user.userId,
          ultimaInteraccion: cot.creadoEn,
        },
      });
      created++;
    }

    res.json({
      success: true,
      created,
      skipped,
      message: `${created} leads importados${skipped > 0 ? `, ${skipped} ya existían` : ''}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
