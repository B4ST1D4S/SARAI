import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

// ════════════════════════════════════════════════════════════════
// ODONTOLOGÍA · ODONTOGRAMA (Primera Vez + Tratamiento)
// Flujo clínico:
//   Hallazgo → Diagnóstico → Procedimiento (CUPS) → Plan → Tratamiento → Facturación
// Reutiliza el módulo de Facturación (Ingreso/Cuenta/CuentaItem) sin duplicar.
// ════════════════════════════════════════════════════════════════

const norm = (s?: string | null) => (s ?? '').toString().trim();
const toNum = (v: any, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
const toIntOrNull = (v: any) => {
  if (v === undefined || v === null || v === '') return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};
const round2 = (n: number) => Math.round(n * 100) / 100;

// Resuelve un medicoId válido: solo lo devuelve si el usuario existe (evita violar FK
// cuando el token referencia un usuario que ya no está en la BD).
async function resolverMedicoId(req: Request): Promise<string | null> {
  const userId = (req as any).user?.userId ?? null;
  if (!userId) return null;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  return u ? u.id : null;
}

// Registro de auditoría no bloqueante
async function audit(
  req: Request,
  tabla: string,
  registroId: string,
  operacion: string,
  antes: any,
  despues: any,
) {
  try {
    const usuarioId = (req as any).user?.userId;
    if (!usuarioId) return;
    await prisma.auditLog.create({
      data: {
        usuarioId,
        tablaAfectada: tabla,
        registroId,
        tipoOperacion: operacion,
        datosAntes: antes ?? undefined,
        datosDespues: despues ?? undefined,
        ipOrigen: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      },
    });
  } catch (e) {
    console.error('audit odonto:', e);
  }
}

const ODONTOGRAMA_INCLUDE = {
  paciente: { select: { id: true, nombreCompleto: true, numeroDocumento: true, tipoDocumento: true, fechaNacimiento: true } },
  medico: { select: { id: true, nombre: true, apellido: true } },
  riesgo: true,
  piezas: {
    include: {
      hallazgo: { select: { id: true, codigo: true, nombre: true, color: true, categoria: true } },
      estado: { select: { id: true, codigo: true, nombre: true, color: true } },
    },
    orderBy: { diente: 'asc' as const },
  },
  planItems: {
    include: {
      hallazgo: { select: { id: true, codigo: true, nombre: true, color: true } },
      prioridad: { select: { id: true, codigo: true, nombre: true, color: true, nivel: true } },
      cargo: { select: { id: true, codigo: true, descripcion: true, cupsCodigoStr: true } },
    },
    orderBy: { orden: 'asc' as const },
  },
} as const;

// ─────────────────────────────────────────────────────────────
//  CATÁLOGOS (un solo request para el frontend)
// ─────────────────────────────────────────────────────────────
export async function getCatalogos(_req: Request, res: Response): Promise<void> {
  try {
    const [hallazgos, estados, prioridades, riesgos] = await Promise.all([
      prisma.odontoHallazgo.findMany({
        where: { activo: true },
        orderBy: { orden: 'asc' },
        include: { sugerencias: { include: { cargo: { select: { id: true, codigo: true, descripcion: true } } } } },
      }),
      prisma.odontoEstado.findMany({ where: { activo: true }, orderBy: { orden: 'asc' } }),
      prisma.odontoPrioridad.findMany({ where: { activo: true }, orderBy: { orden: 'asc' } }),
      prisma.odontoRiesgo.findMany({ where: { activo: true }, orderBy: { orden: 'asc' } }),
    ]);
    res.json({ hallazgos, estados, prioridades, riesgos });
  } catch (e: any) {
    console.error('getCatalogos:', e);
    res.status(500).json({ error: 'Error al obtener los catálogos' });
  }
}

// Búsqueda de cargos facturables (procedimientos CUPS) — para el plan de tratamiento
export async function buscarCargos(req: Request, res: Response): Promise<void> {
  try {
    const q = norm(req.query.q as string);
    const where: any = { activo: true };
    if (q) {
      where.OR = [
        { codigo: { contains: q, mode: 'insensitive' } },
        { descripcion: { contains: q, mode: 'insensitive' } },
        { cupsCodigoStr: { contains: q, mode: 'insensitive' } },
      ];
    }
    const cargos = await prisma.tarifaCargo.findMany({
      where,
      take: 30,
      orderBy: { descripcion: 'asc' },
      include: { items: { where: { activo: true }, take: 1, orderBy: { updatedAt: 'desc' } } },
    });
    res.json(
      cargos.map((c) => ({
        id: c.id,
        codigo: c.codigo,
        descripcion: c.descripcion,
        cupsCodigoStr: c.cupsCodigoStr,
        precioSugerido: c.items.length ? c.items[0].precio : 0,
      })),
    );
  } catch (e: any) {
    console.error('buscarCargos odonto:', e);
    res.status(500).json({ error: 'Error al buscar procedimientos' });
  }
}

// ─────────────────────────────────────────────────────────────
//  ODONTOGRAMAS
// ─────────────────────────────────────────────────────────────
export async function getOdontogramasByPaciente(req: Request, res: Response): Promise<void> {
  try {
    const tipo = norm(req.query.tipo as string);
    const where: any = { pacienteId: req.params.pacienteId };
    if (tipo) where.tipo = tipo;
    const odontogramas = await prisma.odontograma.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        medico: { select: { id: true, nombre: true, apellido: true } },
        riesgo: true,
        _count: { select: { piezas: true, planItems: true } },
      },
    });
    res.json(odontogramas);
  } catch (e: any) {
    console.error('getOdontogramasByPaciente:', e);
    res.status(500).json({ error: 'Error al obtener los odontogramas' });
  }
}

export async function getOdontogramaById(req: Request, res: Response): Promise<void> {
  try {
    const odontograma = await prisma.odontograma.findUnique({
      where: { id: req.params.id },
      include: ODONTOGRAMA_INCLUDE,
    });
    if (!odontograma) {
      res.status(404).json({ error: 'Odontograma no encontrado' });
      return;
    }
    res.json(odontograma);
  } catch (e: any) {
    console.error('getOdontogramaById:', e);
    res.status(500).json({ error: 'Error al obtener el odontograma' });
  }
}

export async function crearOdontograma(req: Request, res: Response): Promise<void> {
  try {
    const pacienteId = norm(req.body.pacienteId);
    if (!pacienteId) {
      res.status(400).json({ error: 'El paciente es requerido' });
      return;
    }
    const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId } });
    if (!paciente) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }
    const tipo = norm(req.body.tipo) || 'PRIMERA_VEZ';
    const medicoId = await resolverMedicoId(req);
    const odontograma = await prisma.odontograma.create({
      data: {
        pacienteId,
        medicoId,
        historiaClinicaId: norm(req.body.historiaClinicaId) || null,
        citaId: norm(req.body.citaId) || null,
        tipo,
        denticion: norm(req.body.denticion) || 'PERMANENTE',
        estado: 'EN_PROCESO',
        hallazgosGenerales: req.body.hallazgosGenerales ?? undefined,
        estetica: req.body.estetica ?? undefined,
        riesgoId: norm(req.body.riesgoId) || null,
      },
      include: ODONTOGRAMA_INCLUDE,
    });
    await audit(req, 'Odontograma', odontograma.id, 'CREATE', null, { tipo, pacienteId });
    res.status(201).json(odontograma);
  } catch (e: any) {
    console.error('crearOdontograma:', e);
    res.status(500).json({ error: 'Error al crear el odontograma' });
  }
}

export async function updateOdontograma(req: Request, res: Response): Promise<void> {
  try {
    const data: any = {};
    if (req.body.hallazgosGenerales !== undefined) data.hallazgosGenerales = req.body.hallazgosGenerales;
    if (req.body.estetica !== undefined) data.estetica = req.body.estetica;
    if (req.body.resumenIA !== undefined) data.resumenIA = norm(req.body.resumenIA) || null;
    if (req.body.riesgoId !== undefined) data.riesgoId = norm(req.body.riesgoId) || null;
    if (req.body.denticion !== undefined) data.denticion = norm(req.body.denticion);
    if (req.body.estado !== undefined) data.estado = norm(req.body.estado);
    if (req.body.firmado !== undefined) data.firmado = !!req.body.firmado;

    const odontograma = await prisma.odontograma.update({
      where: { id: req.params.id },
      data,
      include: ODONTOGRAMA_INCLUDE,
    });
    await audit(req, 'Odontograma', odontograma.id, 'UPDATE', null, data);
    res.json(odontograma);
  } catch (e: any) {
    console.error('updateOdontograma:', e);
    res.status(500).json({ error: 'Error al actualizar el odontograma' });
  }
}

// ─────────────────────────────────────────────────────────────
//  HALLAZGOS POR PIEZA (reemplazo masivo por odontograma)
// ─────────────────────────────────────────────────────────────
export async function guardarPiezas(req: Request, res: Response): Promise<void> {
  try {
    const odontogramaId = req.params.id;
    const odontograma = await prisma.odontograma.findUnique({ where: { id: odontogramaId } });
    if (!odontograma) {
      res.status(404).json({ error: 'Odontograma no encontrado' });
      return;
    }
    const piezas: any[] = Array.isArray(req.body.piezas) ? req.body.piezas : [];

    // Reemplazo transaccional del set de hallazgos por pieza
    await prisma.$transaction([
      prisma.odontoPiezaHallazgo.deleteMany({ where: { odontogramaId } }),
      ...(piezas.length
        ? [
            prisma.odontoPiezaHallazgo.createMany({
              data: piezas
                .filter((p) => toIntOrNull(p.diente) !== null && norm(p.hallazgoId))
                .map((p) => ({
                  odontogramaId,
                  diente: toIntOrNull(p.diente) as number,
                  superficie: norm(p.superficie) || null,
                  hallazgoId: norm(p.hallazgoId),
                  estadoId: norm(p.estadoId) || null,
                  observaciones: norm(p.observaciones) || null,
                  colorOverride: norm(p.colorOverride) || null,
                })),
            }),
          ]
        : []),
    ]);

    const result = await prisma.odontoPiezaHallazgo.findMany({
      where: { odontogramaId },
      include: {
        hallazgo: { select: { id: true, codigo: true, nombre: true, color: true, categoria: true } },
        estado: { select: { id: true, codigo: true, nombre: true, color: true } },
      },
      orderBy: { diente: 'asc' },
    });
    await audit(req, 'OdontoPiezaHallazgo', odontogramaId, 'BULK_REPLACE', null, { total: result.length });
    res.json(result);
  } catch (e: any) {
    console.error('guardarPiezas:', e);
    res.status(500).json({ error: 'Error al guardar los hallazgos' });
  }
}

// ─────────────────────────────────────────────────────────────
//  PLAN DE TRATAMIENTO
// ─────────────────────────────────────────────────────────────

// Genera automáticamente ítems de plan a partir de hallazgos que generan tratamiento
export async function generarPlan(req: Request, res: Response): Promise<void> {
  try {
    const odontogramaId = req.params.id;
    const odontograma = await prisma.odontograma.findUnique({
      where: { id: odontogramaId },
      include: {
        piezas: { include: { hallazgo: { include: { sugerencias: { include: { cargo: { include: { items: { where: { activo: true }, take: 1, orderBy: { updatedAt: 'desc' } } } } } } } } } },
      },
    });
    if (!odontograma) {
      res.status(404).json({ error: 'Odontograma no encontrado' });
      return;
    }

    const prioridades = await prisma.odontoPrioridad.findMany();
    const prioMap = new Map(prioridades.map((p) => [p.codigo, p.id]));
    const planMedicoId = await resolverMedicoId(req);

    const existentes = await prisma.odontoPlanItem.count({ where: { odontogramaId } });
    let orden = existentes;
    const creados: any[] = [];

    for (const pieza of odontograma.piezas) {
      const h = pieza.hallazgo;
      if (!h.generaTratamiento) continue;
      // evitar duplicar si ya existe un item para esa pieza+hallazgo
      const yaExiste = await prisma.odontoPlanItem.findFirst({
        where: { odontogramaId, diente: pieza.diente, hallazgoId: h.id },
      });
      if (yaExiste) continue;

      const sugerencia = (h as any).sugerencias?.find((s: any) => s.porDefecto) || (h as any).sugerencias?.[0];
      const cargo = sugerencia?.cargo;
      const precio = cargo?.items?.length ? cargo.items[0].precio : 0;

      const item = await prisma.odontoPlanItem.create({
        data: {
          odontogramaId,
          pacienteId: odontograma.pacienteId,
          diente: pieza.diente,
          superficie: pieza.superficie,
          hallazgoId: h.id,
          diagnostico: h.nombre,
          cargoId: cargo?.id ?? null,
          codigoCups: cargo?.cupsCodigoStr ?? null,
          descripcionProcedimiento: cargo?.descripcion ?? `Tratamiento de ${h.nombre.toLowerCase()}`,
          prioridadId: h.prioridadDefault ? prioMap.get(h.prioridadDefault) ?? null : null,
          estadoTratamiento: 'PLANEADO',
          medicoId: planMedicoId,
          precio,
          orden: orden++,
        },
      });
      creados.push(item);
    }

    const planItems = await prisma.odontoPlanItem.findMany({
      where: { odontogramaId },
      include: {
        hallazgo: { select: { id: true, codigo: true, nombre: true, color: true } },
        prioridad: { select: { id: true, codigo: true, nombre: true, color: true, nivel: true } },
        cargo: { select: { id: true, codigo: true, descripcion: true, cupsCodigoStr: true } },
      },
      orderBy: { orden: 'asc' },
    });
    await audit(req, 'OdontoPlanItem', odontogramaId, 'GENERATE_PLAN', null, { creados: creados.length });
    res.json({ creados: creados.length, planItems });
  } catch (e: any) {
    console.error('generarPlan:', e);
    res.status(500).json({ error: 'Error al generar el plan de tratamiento' });
  }
}

export async function addPlanItem(req: Request, res: Response): Promise<void> {
  try {
    const odontogramaId = req.params.id;
    const odontograma = await prisma.odontograma.findUnique({ where: { id: odontogramaId } });
    if (!odontograma) {
      res.status(404).json({ error: 'Odontograma no encontrado' });
      return;
    }
    const diagnostico = norm(req.body.diagnostico);
    if (!diagnostico) {
      res.status(400).json({ error: 'El diagnóstico es requerido' });
      return;
    }

    let descripcionProcedimiento = norm(req.body.descripcionProcedimiento);
    let codigoCups = norm(req.body.codigoCups) || null;
    let precio = toNum(req.body.precio, NaN);
    const cargoId = norm(req.body.cargoId) || null;

    if (cargoId) {
      const cargo = await prisma.tarifaCargo.findUnique({
        where: { id: cargoId },
        include: { items: { where: { activo: true }, take: 1, orderBy: { updatedAt: 'desc' } } },
      });
      if (cargo) {
        if (!descripcionProcedimiento) descripcionProcedimiento = cargo.descripcion;
        if (!codigoCups) codigoCups = cargo.cupsCodigoStr || cargo.codigo;
        if (!Number.isFinite(precio)) precio = cargo.items.length ? cargo.items[0].precio : 0;
      }
    }
    if (!Number.isFinite(precio)) precio = 0;
    if (!descripcionProcedimiento) descripcionProcedimiento = diagnostico;

    const max = await prisma.odontoPlanItem.aggregate({ where: { odontogramaId }, _max: { orden: true } });

    const item = await prisma.odontoPlanItem.create({
      data: {
        odontogramaId,
        pacienteId: odontograma.pacienteId,
        diente: toIntOrNull(req.body.diente),
        superficie: norm(req.body.superficie) || null,
        hallazgoId: norm(req.body.hallazgoId) || null,
        diagnostico,
        cargoId,
        codigoCups,
        descripcionProcedimiento,
        prioridadId: norm(req.body.prioridadId) || null,
        estadoTratamiento: norm(req.body.estadoTratamiento) || 'PLANEADO',
        medicoId: await resolverMedicoId(req),
        observaciones: norm(req.body.observaciones) || null,
        precio,
        orden: (max._max.orden ?? 0) + 1,
      },
      include: {
        hallazgo: { select: { id: true, codigo: true, nombre: true, color: true } },
        prioridad: { select: { id: true, codigo: true, nombre: true, color: true, nivel: true } },
        cargo: { select: { id: true, codigo: true, descripcion: true, cupsCodigoStr: true } },
      },
    });
    await audit(req, 'OdontoPlanItem', item.id, 'CREATE', null, { diagnostico });
    res.status(201).json(item);
  } catch (e: any) {
    console.error('addPlanItem:', e);
    res.status(500).json({ error: 'Error al agregar el ítem al plan' });
  }
}

export async function updatePlanItem(req: Request, res: Response): Promise<void> {
  try {
    const data: any = {};
    if (req.body.diagnostico !== undefined) data.diagnostico = norm(req.body.diagnostico);
    if (req.body.descripcionProcedimiento !== undefined) data.descripcionProcedimiento = norm(req.body.descripcionProcedimiento);
    if (req.body.codigoCups !== undefined) data.codigoCups = norm(req.body.codigoCups) || null;
    if (req.body.prioridadId !== undefined) data.prioridadId = norm(req.body.prioridadId) || null;
    if (req.body.observaciones !== undefined) data.observaciones = norm(req.body.observaciones) || null;
    if (req.body.evolucion !== undefined) data.evolucion = norm(req.body.evolucion) || null;
    if (req.body.diente !== undefined) data.diente = toIntOrNull(req.body.diente);
    if (req.body.superficie !== undefined) data.superficie = norm(req.body.superficie) || null;
    if (req.body.precio !== undefined) data.precio = toNum(req.body.precio, 0);
    if (req.body.fechaProgramada !== undefined) data.fechaProgramada = req.body.fechaProgramada ? new Date(req.body.fechaProgramada) : null;

    if (req.body.cargoId !== undefined) {
      const cargoId = norm(req.body.cargoId) || null;
      data.cargoId = cargoId;
      if (cargoId) {
        const cargo = await prisma.tarifaCargo.findUnique({
          where: { id: cargoId },
          include: { items: { where: { activo: true }, take: 1, orderBy: { updatedAt: 'desc' } } },
        });
        if (cargo) {
          data.codigoCups = cargo.cupsCodigoStr || cargo.codigo;
          if (req.body.precio === undefined) data.precio = cargo.items.length ? cargo.items[0].precio : 0;
          if (req.body.descripcionProcedimiento === undefined) data.descripcionProcedimiento = cargo.descripcion;
        }
      }
    }

    const item = await prisma.odontoPlanItem.update({
      where: { id: req.params.itemId },
      data,
      include: {
        hallazgo: { select: { id: true, codigo: true, nombre: true, color: true } },
        prioridad: { select: { id: true, codigo: true, nombre: true, color: true, nivel: true } },
        cargo: { select: { id: true, codigo: true, descripcion: true, cupsCodigoStr: true } },
      },
    });
    await audit(req, 'OdontoPlanItem', item.id, 'UPDATE', null, data);
    res.json(item);
  } catch (e: any) {
    console.error('updatePlanItem:', e);
    res.status(500).json({ error: 'Error al actualizar el ítem' });
  }
}

export async function deletePlanItem(req: Request, res: Response): Promise<void> {
  try {
    const item = await prisma.odontoPlanItem.findUnique({ where: { id: req.params.itemId } });
    if (!item) {
      res.status(404).json({ error: 'Ítem no encontrado' });
      return;
    }
    if (item.facturado) {
      res.status(409).json({ error: 'No se puede eliminar un ítem ya facturado' });
      return;
    }
    await prisma.odontoPlanItem.delete({ where: { id: req.params.itemId } });
    await audit(req, 'OdontoPlanItem', req.params.itemId, 'DELETE', item, null);
    res.json({ ok: true });
  } catch (e: any) {
    console.error('deletePlanItem:', e);
    res.status(500).json({ error: 'Error al eliminar el ítem' });
  }
}

// ─────────────────────────────────────────────────────────────
//  Helper: asegura una Cuenta ABIERTA para el paciente (reusa Ingreso)
// ─────────────────────────────────────────────────────────────
async function asegurarCuentaAbierta(pacienteId: string, citaId: string | null, medicoId: string | null) {
  // 1. Cuenta abierta existente para un ingreso activo del paciente
  const cuentaAbierta = await prisma.cuenta.findFirst({
    where: { estado: 'ABIERTA', ingreso: { pacienteId, estado: 'ACTIVO' } },
    orderBy: { createdAt: 'desc' },
  });
  if (cuentaAbierta) return cuentaAbierta;

  // 2. Crear ingreso + cuenta
  const ingreso = await prisma.ingreso.create({
    data: {
      pacienteId,
      citaId: citaId || null,
      medicoId: medicoId || null,
      tipoIngreso: 'AMBULATORIO',
      estado: 'ACTIVO',
      observaciones: 'Generado desde Odontología',
      cuentas: { create: { estado: 'ABIERTA' } },
    },
    include: { cuentas: true },
  });
  return ingreso.cuentas[0];
}

// ─────────────────────────────────────────────────────────────
//  CAMBIO DE ESTADO DE TRATAMIENTO (con hook de facturación)
//  Al FINALIZAR un procedimiento con cargo → genera CuentaItem (cargo facturable).
// ─────────────────────────────────────────────────────────────
export async function cambiarEstadoTratamiento(req: Request, res: Response): Promise<void> {
  try {
    const itemId = req.params.itemId;
    const nuevoEstado = norm(req.body.estadoTratamiento);
    const ESTADOS = ['PLANEADO', 'AGENDADO', 'EN_TRATAMIENTO', 'FINALIZADO', 'SUSPENDIDO', 'CANCELADO'];
    if (!ESTADOS.includes(nuevoEstado)) {
      res.status(400).json({ error: 'Estado de tratamiento inválido' });
      return;
    }

    const item = await prisma.odontoPlanItem.findUnique({
      where: { id: itemId },
      include: { odontograma: true },
    });
    if (!item) {
      res.status(404).json({ error: 'Ítem no encontrado' });
      return;
    }

    const data: any = { estadoTratamiento: nuevoEstado };
    if (req.body.evolucion !== undefined) data.evolucion = norm(req.body.evolucion) || null;

    let facturacion: any = null;

    if (nuevoEstado === 'FINALIZADO') {
      data.fechaEjecucion = new Date();
      // Hook de facturación: crear cargo facturable si hay cargo y no se ha facturado
      if (item.cargoId && !item.facturado) {
        const cuenta = await asegurarCuentaAbierta(
          item.pacienteId,
          item.odontograma.citaId,
          await resolverMedicoId(req),
        );
        const cantidad = 1;
        const precioUnitario = toNum(item.precio, 0);
        const cuentaItem = await prisma.cuentaItem.create({
          data: {
            cuentaId: cuenta.id,
            cargoId: item.cargoId,
            codigo: item.codigoCups,
            descripcion: item.descripcionProcedimiento,
            departamento: 'ODONTOLOGIA',
            cantidad,
            precioUnitario,
            valorTotal: round2(precioUnitario * cantidad),
          },
        });
        data.cuentaItemId = cuentaItem.id;
        data.facturado = true;
        facturacion = { cuentaId: cuenta.id, cuentaItemId: cuentaItem.id, valor: cuentaItem.valorTotal };
      }
    }

    const actualizado = await prisma.odontoPlanItem.update({
      where: { id: itemId },
      data,
      include: {
        hallazgo: { select: { id: true, codigo: true, nombre: true, color: true } },
        prioridad: { select: { id: true, codigo: true, nombre: true, color: true, nivel: true } },
        cargo: { select: { id: true, codigo: true, descripcion: true, cupsCodigoStr: true } },
      },
    });

    // Registrar evolución en la línea de tiempo
    await prisma.odontoEvolucion.create({
      data: {
        odontogramaId: item.odontogramaId,
        pacienteId: item.pacienteId,
        planItemId: item.id,
        tipo: nuevoEstado === 'FINALIZADO' ? 'PROCEDIMIENTO' : 'PLANIFICACION',
        descripcion:
          norm(req.body.evolucion) ||
          `${item.descripcionProcedimiento} · estado: ${nuevoEstado}`,
        medicoId: await resolverMedicoId(req),
      },
    });

    await audit(req, 'OdontoPlanItem', item.id, 'CHANGE_STATE', { estado: item.estadoTratamiento }, { estado: nuevoEstado, facturacion });
    res.json({ item: actualizado, facturacion });
  } catch (e: any) {
    console.error('cambiarEstadoTratamiento:', e);
    res.status(500).json({ error: 'Error al cambiar el estado del tratamiento' });
  }
}

// ─────────────────────────────────────────────────────────────
//  EVOLUCIÓN / LÍNEA DE TIEMPO
// ─────────────────────────────────────────────────────────────
export async function addEvolucion(req: Request, res: Response): Promise<void> {
  try {
    const odontogramaId = req.params.id;
    const odontograma = await prisma.odontograma.findUnique({ where: { id: odontogramaId } });
    if (!odontograma) {
      res.status(404).json({ error: 'Odontograma no encontrado' });
      return;
    }
    const descripcion = norm(req.body.descripcion);
    if (!descripcion) {
      res.status(400).json({ error: 'La descripción es requerida' });
      return;
    }
    const evolucion = await prisma.odontoEvolucion.create({
      data: {
        odontogramaId,
        pacienteId: odontograma.pacienteId,
        planItemId: norm(req.body.planItemId) || null,
        tipo: norm(req.body.tipo) || 'NOTA',
        descripcion,
        medicoId: await resolverMedicoId(req),
      },
    });
    res.status(201).json(evolucion);
  } catch (e: any) {
    console.error('addEvolucion:', e);
    res.status(500).json({ error: 'Error al agregar la evolución' });
  }
}

export async function getTimeline(req: Request, res: Response): Promise<void> {
  try {
    const evoluciones = await prisma.odontoEvolucion.findMany({
      where: { odontogramaId: req.params.id },
      orderBy: { fecha: 'desc' },
    });
    res.json(evoluciones);
  } catch (e: any) {
    console.error('getTimeline:', e);
    res.status(500).json({ error: 'Error al obtener la línea de tiempo' });
  }
}

// ─────────────────────────────────────────────────────────────
//  RESUMEN / KPIs
// ─────────────────────────────────────────────────────────────
export async function getResumen(_req: Request, res: Response): Promise<void> {
  try {
    const [totalOdontogramas, planAbierto, finalizados, facturados] = await Promise.all([
      prisma.odontograma.count(),
      prisma.odontoPlanItem.count({ where: { estadoTratamiento: { in: ['PLANEADO', 'AGENDADO', 'EN_TRATAMIENTO'] } } }),
      prisma.odontoPlanItem.count({ where: { estadoTratamiento: 'FINALIZADO' } }),
      prisma.odontoPlanItem.count({ where: { facturado: true } }),
    ]);
    res.json({ totalOdontogramas, planAbierto, finalizados, facturados });
  } catch (e: any) {
    console.error('getResumen odonto:', e);
    res.status(500).json({ error: 'Error al obtener el resumen' });
  }
}
