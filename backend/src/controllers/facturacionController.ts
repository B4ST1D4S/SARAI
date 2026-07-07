import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

// ════════════════════════════════════════════════════════════════
// MÓDULO DE FACTURACIÓN (demo funcional)
// Flujo: al COMPLETAR una cita → se crea Ingreso + Cuenta (ABIERTA).
// A la cuenta se le adicionan ítems/servicios; luego se factura.
// Modelos: Ingreso · Cuenta · CuentaItem · Factura
// ════════════════════════════════════════════════════════════════

const norm = (s?: string | null) => (s ?? '').toString().trim();
const toNum = (v: any, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
const round2 = (n: number) => Math.round(n * 100) / 100;

// ─────────────────────────────────────────────────────────────
//  Helper reutilizable: crea Ingreso + Cuenta a partir de una cita.
//  Idempotente: si la cita ya tiene un ingreso, lo devuelve.
// ─────────────────────────────────────────────────────────────
export async function crearIngresoYCuentaDesdeCita(citaId: string) {
  const existente = await prisma.ingreso.findFirst({
    where: { citaId },
    include: { cuentas: true },
  });
  if (existente) return existente;

  const cita = await prisma.cita.findUnique({ where: { id: citaId } });
  if (!cita) throw new Error('Cita no encontrada');

  return prisma.ingreso.create({
    data: {
      pacienteId: cita.pacienteId,
      citaId: cita.id,
      medicoId: cita.medicoId,
      tipoIngreso: 'AMBULATORIO',
      entidad: cita.entidadSalud ?? null,
      estado: 'ACTIVO',
      cuentas: { create: { estado: 'ABIERTA' } },
    },
    include: { cuentas: true },
  });
}

// ─────────────────────────────────────────────────────────────
//  INGRESOS
// ─────────────────────────────────────────────────────────────
export async function getIngresos(req: Request, res: Response) {
  try {
    const search = norm(req.query.search as string);
    const estado = norm(req.query.estado as string);

    const where: any = {};
    if (estado) where.estado = estado;
    if (search) {
      where.paciente = {
        OR: [
          { nombreCompleto: { contains: search, mode: 'insensitive' } },
          { numeroDocumento: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const ingresos = await prisma.ingreso.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        paciente: { select: { id: true, nombreCompleto: true, numeroDocumento: true, tipoDocumento: true } },
        medico: { select: { id: true, nombre: true, apellido: true } },
        cuentas: {
          include: {
            _count: { select: { items: true } },
            items: { select: { valorTotal: true } },
            factura: { select: { id: true, numero: true, prefijo: true, estado: true } },
          },
        },
      },
    });

    // Calcular total por cuenta
    const data = ingresos.map((i) => ({
      ...i,
      cuentas: i.cuentas.map((c) => ({
        ...c,
        total: round2(c.items.reduce((s, it) => s + (it.valorTotal || 0), 0)),
        items: undefined,
      })),
    }));

    res.json(data);
  } catch (e: any) {
    console.error('getIngresos:', e);
    res.status(500).json({ error: 'Error al obtener los ingresos' });
  }
}

export async function getIngresoById(req: Request, res: Response) {
  try {
    const ingreso = await prisma.ingreso.findUnique({
      where: { id: req.params.id },
      include: {
        paciente: true,
        medico: { select: { id: true, nombre: true, apellido: true } },
        cita: { select: { id: true, fechaHora: true, tipoCita: true } },
        cuentas: { include: { items: true, factura: true } },
      },
    });
    if (!ingreso) return res.status(404).json({ error: 'Ingreso no encontrado' });
    res.json(ingreso);
  } catch (e: any) {
    console.error('getIngresoById:', e);
    res.status(500).json({ error: 'Error al obtener el ingreso' });
  }
}

// Crear ingreso manualmente (sin cita) — abre también una cuenta
export async function createIngreso(req: Request, res: Response) {
  try {
    const pacienteId = norm(req.body.pacienteId);
    if (!pacienteId) return res.status(400).json({ error: 'El paciente es requerido' });

    const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId } });
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

    const ingreso = await prisma.ingreso.create({
      data: {
        pacienteId,
        medicoId: norm(req.body.medicoId) || null,
        tipoIngreso: norm(req.body.tipoIngreso) || 'AMBULATORIO',
        entidad: norm(req.body.entidad) || null,
        plan: norm(req.body.plan) || null,
        observaciones: norm(req.body.observaciones) || null,
        estado: 'ACTIVO',
        cuentas: { create: { estado: 'ABIERTA' } },
      },
      include: { cuentas: true, paciente: true },
    });
    res.status(201).json(ingreso);
  } catch (e: any) {
    console.error('createIngreso:', e);
    res.status(500).json({ error: 'Error al crear el ingreso' });
  }
}

// ─────────────────────────────────────────────────────────────
//  CUENTAS
// ─────────────────────────────────────────────────────────────
export async function getCuentaById(req: Request, res: Response) {
  try {
    const cuenta = await prisma.cuenta.findUnique({
      where: { id: req.params.id },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        factura: true,
        ingreso: {
          include: {
            paciente: true,
            medico: { select: { id: true, nombre: true, apellido: true } },
          },
        },
      },
    });
    if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });
    const total = round2(cuenta.items.reduce((s, it) => s + (it.valorTotal || 0), 0));
    res.json({ ...cuenta, total });
  } catch (e: any) {
    console.error('getCuentaById:', e);
    res.status(500).json({ error: 'Error al obtener la cuenta' });
  }
}

// Agregar un ítem/servicio a la cuenta
export async function addCuentaItem(req: Request, res: Response) {
  try {
    const cuentaId = req.params.id;
    const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId } });
    if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });
    if (cuenta.estado !== 'ABIERTA')
      return res.status(409).json({ error: 'La cuenta no está abierta' });

    const cargoId = norm(req.body.cargoId) || null;
    let descripcion = norm(req.body.descripcion);
    let codigo = norm(req.body.codigo) || null;
    let departamento = norm(req.body.departamento) || null;
    let precioUnitario = toNum(req.body.precioUnitario, NaN);
    const cantidad = Math.max(toNum(req.body.cantidad, 1), 0.01);

    // Si viene un cargo, completar datos y precio sugerido desde el tarifario
    if (cargoId) {
      const cargo = await prisma.tarifaCargo.findUnique({
        where: { id: cargoId },
        include: { items: { where: { activo: true }, take: 1, orderBy: { updatedAt: 'desc' } } },
      });
      if (!cargo) return res.status(404).json({ error: 'Cargo no encontrado' });
      if (!descripcion) descripcion = cargo.descripcion;
      if (!codigo) codigo = cargo.cupsCodigoStr || cargo.codigo;
      if (!Number.isFinite(precioUnitario)) {
        precioUnitario = cargo.items.length ? cargo.items[0].precio : 0;
      }
    }

    if (!descripcion) return res.status(400).json({ error: 'La descripción es requerida' });
    if (!Number.isFinite(precioUnitario)) precioUnitario = 0;

    const valorTotal = round2(precioUnitario * cantidad);

    const item = await prisma.cuentaItem.create({
      data: {
        cuentaId,
        cargoId,
        codigo,
        descripcion,
        departamento,
        cantidad,
        precioUnitario,
        valorTotal,
      },
    });
    res.status(201).json(item);
  } catch (e: any) {
    console.error('addCuentaItem:', e);
    res.status(500).json({ error: 'Error al agregar el ítem' });
  }
}

export async function updateCuentaItem(req: Request, res: Response) {
  try {
    const item = await prisma.cuentaItem.findUnique({
      where: { id: req.params.itemId },
      include: { cuenta: true },
    });
    if (!item) return res.status(404).json({ error: 'Ítem no encontrado' });
    if (item.cuenta.estado !== 'ABIERTA')
      return res.status(409).json({ error: 'La cuenta no está abierta' });

    const cantidad = req.body.cantidad !== undefined ? Math.max(toNum(req.body.cantidad, item.cantidad), 0.01) : item.cantidad;
    const precioUnitario = req.body.precioUnitario !== undefined ? toNum(req.body.precioUnitario, item.precioUnitario) : item.precioUnitario;
    const data: any = {
      cantidad,
      precioUnitario,
      valorTotal: round2(precioUnitario * cantidad),
    };
    if (req.body.descripcion !== undefined) data.descripcion = norm(req.body.descripcion);
    if (req.body.departamento !== undefined) data.departamento = norm(req.body.departamento) || null;

    const updated = await prisma.cuentaItem.update({ where: { id: item.id }, data });
    res.json(updated);
  } catch (e: any) {
    console.error('updateCuentaItem:', e);
    res.status(500).json({ error: 'Error al actualizar el ítem' });
  }
}

export async function deleteCuentaItem(req: Request, res: Response) {
  try {
    const item = await prisma.cuentaItem.findUnique({
      where: { id: req.params.itemId },
      include: { cuenta: true },
    });
    if (!item) return res.status(404).json({ error: 'Ítem no encontrado' });
    if (item.cuenta.estado !== 'ABIERTA')
      return res.status(409).json({ error: 'La cuenta no está abierta' });
    await prisma.cuentaItem.delete({ where: { id: item.id } });
    res.json({ success: true });
  } catch (e: any) {
    console.error('deleteCuentaItem:', e);
    res.status(500).json({ error: 'Error al eliminar el ítem' });
  }
}

// ─────────────────────────────────────────────────────────────
//  Búsqueda de cargos facturables (para adicionar a una cuenta)
// ─────────────────────────────────────────────────────────────
export async function buscarCargos(req: Request, res: Response) {
  try {
    const search = norm(req.query.search as string);
    const where: any = { activo: true };
    if (search) {
      const dig = search.replace(/\D/g, '');
      where.OR = [
        { descripcion: { contains: search, mode: 'insensitive' } },
        { codigo: { contains: search, mode: 'insensitive' } },
        ...(dig ? [{ cupsCodigoStr: { startsWith: dig } }] : []),
      ];
    }
    const cargos = await prisma.tarifaCargo.findMany({
      where,
      take: 25,
      orderBy: { descripcion: 'asc' },
      include: {
        grupo: { select: { nombre: true } },
        items: { where: { activo: true }, take: 1, orderBy: { updatedAt: 'desc' } },
      },
    });
    const data = cargos.map((c) => ({
      id: c.id,
      codigo: c.codigo,
      descripcion: c.descripcion,
      cupsCodigoStr: c.cupsCodigoStr,
      grupo: c.grupo?.nombre ?? null,
      precioSugerido: c.items.length ? c.items[0].precio : 0,
    }));
    res.json(data);
  } catch (e: any) {
    console.error('buscarCargos:', e);
    res.status(500).json({ error: 'Error al buscar cargos' });
  }
}

// ─────────────────────────────────────────────────────────────
//  FACTURAS
// ─────────────────────────────────────────────────────────────
export async function facturarCuenta(req: Request, res: Response) {
  try {
    const cuentaId = req.params.id;
    const cuenta = await prisma.cuenta.findUnique({
      where: { id: cuentaId },
      include: { items: true, ingreso: true, factura: true },
    });
    if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });
    if (cuenta.factura) return res.status(409).json({ error: 'La cuenta ya fue facturada' });
    if (cuenta.estado !== 'ABIERTA')
      return res.status(409).json({ error: 'La cuenta no está abierta' });
    if (cuenta.items.length === 0)
      return res.status(400).json({ error: 'La cuenta no tiene ítems para facturar' });

    const total = round2(cuenta.items.reduce((s, it) => s + (it.valorTotal || 0), 0));

    const factura = await prisma.$transaction(async (tx) => {
      const f = await tx.factura.create({
        data: {
          cuentaId,
          pacienteId: cuenta.ingreso.pacienteId,
          entidad: cuenta.ingreso.entidad,
          plan: cuenta.ingreso.plan,
          subtotal: total,
          total,
          estado: 'EMITIDA',
          observaciones: norm(req.body.observaciones) || null,
        },
      });
      await tx.cuenta.update({ where: { id: cuentaId }, data: { estado: 'FACTURADA' } });
      return f;
    });

    res.status(201).json(factura);
  } catch (e: any) {
    console.error('facturarCuenta:', e);
    res.status(500).json({ error: 'Error al facturar la cuenta' });
  }
}

export async function getFacturas(req: Request, res: Response) {
  try {
    const search = norm(req.query.search as string);
    const estado = norm(req.query.estado as string);
    const where: any = {};
    if (estado) where.estado = estado;
    if (search) {
      where.paciente = {
        OR: [
          { nombreCompleto: { contains: search, mode: 'insensitive' } },
          { numeroDocumento: { contains: search, mode: 'insensitive' } },
        ],
      };
    }
    const facturas = await prisma.factura.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: 100,
      include: {
        paciente: { select: { id: true, nombreCompleto: true, numeroDocumento: true, tipoDocumento: true } },
      },
    });
    res.json(facturas);
  } catch (e: any) {
    console.error('getFacturas:', e);
    res.status(500).json({ error: 'Error al obtener las facturas' });
  }
}

export async function getFacturaById(req: Request, res: Response) {
  try {
    const factura = await prisma.factura.findUnique({
      where: { id: req.params.id },
      include: {
        paciente: true,
        cuenta: {
          include: {
            items: { orderBy: { createdAt: 'asc' } },
            ingreso: { include: { medico: { select: { nombre: true, apellido: true } } } },
          },
        },
      },
    });
    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
    res.json(factura);
  } catch (e: any) {
    console.error('getFacturaById:', e);
    res.status(500).json({ error: 'Error al obtener la factura' });
  }
}

export async function anularFactura(req: Request, res: Response) {
  try {
    const factura = await prisma.factura.findUnique({ where: { id: req.params.id } });
    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
    if (factura.estado === 'ANULADA')
      return res.status(409).json({ error: 'La factura ya está anulada' });

    await prisma.$transaction(async (tx) => {
      await tx.factura.update({ where: { id: factura.id }, data: { estado: 'ANULADA' } });
      // Reabrir la cuenta para permitir correcciones
      await tx.cuenta.update({ where: { id: factura.cuentaId }, data: { estado: 'ABIERTA' } });
    });
    res.json({ success: true });
  } catch (e: any) {
    console.error('anularFactura:', e);
    res.status(500).json({ error: 'Error al anular la factura' });
  }
}

// ─────────────────────────────────────────────────────────────
//  Resumen / KPIs
// ─────────────────────────────────────────────────────────────
export async function getResumen(_req: Request, res: Response) {
  try {
    const [cuentasAbiertas, facturasEmitidas, agg] = await Promise.all([
      prisma.cuenta.count({ where: { estado: 'ABIERTA' } }),
      prisma.factura.count({ where: { estado: 'EMITIDA' } }),
      prisma.factura.aggregate({ _sum: { total: true }, where: { estado: { not: 'ANULADA' } } }),
    ]);
    res.json({
      cuentasAbiertas,
      facturasEmitidas,
      totalFacturado: round2(agg._sum.total || 0),
    });
  } catch (e: any) {
    console.error('getResumen:', e);
    res.status(500).json({ error: 'Error al obtener el resumen' });
  }
}
