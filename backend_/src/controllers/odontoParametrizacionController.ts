import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

// ════════════════════════════════════════════════════════════════
// ODONTOLOGÍA · PARAMETRIZACIÓN
// Catálogos: hallazgos, estados clínicos, prioridades, riesgo clínico
// y sugerencias de procedimientos (CUPS) por hallazgo.
// ════════════════════════════════════════════════════════════════

const norm = (s?: string | null) => (s ?? '').toString().trim();
const toInt = (v: any, def = 0) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
};
const toBool = (v: any, def = true) => (v === undefined || v === null ? def : !!v);

// ─────────────────────────────────────────────────────────────
//  HALLAZGOS
// ─────────────────────────────────────────────────────────────
export async function getHallazgos(req: Request, res: Response): Promise<void> {
  try {
    const incluirInactivos = norm(req.query.todos as string) === 'true';
    const hallazgos = await prisma.odontoHallazgo.findMany({
      where: incluirInactivos ? {} : { activo: true },
      orderBy: { orden: 'asc' },
      include: { sugerencias: { include: { cargo: { select: { id: true, codigo: true, descripcion: true } } } } },
    });
    res.json(hallazgos);
  } catch (e: any) {
    console.error('getHallazgos:', e);
    res.status(500).json({ error: 'Error al obtener los hallazgos' });
  }
}

export async function createHallazgo(req: Request, res: Response): Promise<void> {
  try {
    const codigo = norm(req.body.codigo);
    const nombre = norm(req.body.nombre);
    if (!codigo || !nombre) {
      res.status(400).json({ error: 'Código y nombre son requeridos' });
      return;
    }
    const hallazgo = await prisma.odontoHallazgo.create({
      data: {
        codigo: codigo.toUpperCase(),
        nombre,
        descripcion: norm(req.body.descripcion) || null,
        color: norm(req.body.color) || '#ef4444',
        icono: norm(req.body.icono) || null,
        categoria: norm(req.body.categoria) || null,
        generaTratamiento: toBool(req.body.generaTratamiento, true),
        prioridadDefault: norm(req.body.prioridadDefault) || null,
        orden: toInt(req.body.orden, 0),
        activo: toBool(req.body.activo, true),
      },
    });
    res.status(201).json(hallazgo);
  } catch (e: any) {
    if (e.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe un hallazgo con ese código' });
      return;
    }
    console.error('createHallazgo:', e);
    res.status(500).json({ error: 'Error al crear el hallazgo' });
  }
}

export async function updateHallazgo(req: Request, res: Response): Promise<void> {
  try {
    const data: any = {};
    if (req.body.nombre !== undefined) data.nombre = norm(req.body.nombre);
    if (req.body.descripcion !== undefined) data.descripcion = norm(req.body.descripcion) || null;
    if (req.body.color !== undefined) data.color = norm(req.body.color);
    if (req.body.icono !== undefined) data.icono = norm(req.body.icono) || null;
    if (req.body.categoria !== undefined) data.categoria = norm(req.body.categoria) || null;
    if (req.body.generaTratamiento !== undefined) data.generaTratamiento = !!req.body.generaTratamiento;
    if (req.body.prioridadDefault !== undefined) data.prioridadDefault = norm(req.body.prioridadDefault) || null;
    if (req.body.orden !== undefined) data.orden = toInt(req.body.orden, 0);
    if (req.body.activo !== undefined) data.activo = !!req.body.activo;

    const hallazgo = await prisma.odontoHallazgo.update({ where: { id: req.params.id }, data });
    res.json(hallazgo);
  } catch (e: any) {
    console.error('updateHallazgo:', e);
    res.status(500).json({ error: 'Error al actualizar el hallazgo' });
  }
}

export async function deleteHallazgo(req: Request, res: Response): Promise<void> {
  try {
    // Soft-delete para no romper registros clínicos históricos
    await prisma.odontoHallazgo.update({ where: { id: req.params.id }, data: { activo: false } });
    res.json({ ok: true });
  } catch (e: any) {
    console.error('deleteHallazgo:', e);
    res.status(500).json({ error: 'Error al eliminar el hallazgo' });
  }
}

// Sugerencias de procedimientos (cargos CUPS) por hallazgo
export async function setSugerencias(req: Request, res: Response): Promise<void> {
  try {
    const hallazgoId = req.params.id;
    const cargoIds: string[] = Array.isArray(req.body.cargoIds) ? req.body.cargoIds : [];
    const porDefecto = norm(req.body.porDefectoCargoId) || null;

    await prisma.odontoHallazgoSugerencia.deleteMany({ where: { hallazgoId } });
    if (cargoIds.length) {
      await prisma.odontoHallazgoSugerencia.createMany({
        data: cargoIds.map((cargoId) => ({ hallazgoId, cargoId, porDefecto: cargoId === porDefecto })),
        skipDuplicates: true,
      });
    }
    const sugerencias = await prisma.odontoHallazgoSugerencia.findMany({
      where: { hallazgoId },
      include: { cargo: { select: { id: true, codigo: true, descripcion: true } } },
    });
    res.json(sugerencias);
  } catch (e: any) {
    console.error('setSugerencias:', e);
    res.status(500).json({ error: 'Error al guardar las sugerencias' });
  }
}

// ─────────────────────────────────────────────────────────────
//  Helper genérico para catálogos simples (estado/prioridad/riesgo)
// ─────────────────────────────────────────────────────────────
type SimpleModel = 'odontoEstado' | 'odontoPrioridad' | 'odontoRiesgo';

function makeCatalog(model: SimpleModel, extraFields: string[] = []) {
  const delegate = () => (prisma as any)[model];

  const list = async (req: Request, res: Response): Promise<void> => {
    try {
      const todos = norm(req.query.todos as string) === 'true';
      const items = await delegate().findMany({
        where: todos ? {} : { activo: true },
        orderBy: { orden: 'asc' },
      });
      res.json(items);
    } catch (e: any) {
      console.error(`list ${model}:`, e);
      res.status(500).json({ error: 'Error al obtener el catálogo' });
    }
  };

  const create = async (req: Request, res: Response): Promise<void> => {
    try {
      const codigo = norm(req.body.codigo);
      const nombre = norm(req.body.nombre);
      if (!codigo || !nombre) {
        res.status(400).json({ error: 'Código y nombre son requeridos' });
        return;
      }
      const data: any = {
        codigo: codigo.toUpperCase(),
        nombre,
        color: norm(req.body.color) || undefined,
        orden: toInt(req.body.orden, 0),
        activo: toBool(req.body.activo, true),
      };
      for (const f of extraFields) if (req.body[f] !== undefined) data[f] = toInt(req.body[f], 0);
      const item = await delegate().create({ data });
      res.status(201).json(item);
    } catch (e: any) {
      if (e.code === 'P2002') {
        res.status(409).json({ error: 'Ya existe un registro con ese código' });
        return;
      }
      console.error(`create ${model}:`, e);
      res.status(500).json({ error: 'Error al crear el registro' });
    }
  };

  const update = async (req: Request, res: Response): Promise<void> => {
    try {
      const data: any = {};
      if (req.body.nombre !== undefined) data.nombre = norm(req.body.nombre);
      if (req.body.color !== undefined) data.color = norm(req.body.color);
      if (req.body.orden !== undefined) data.orden = toInt(req.body.orden, 0);
      if (req.body.activo !== undefined) data.activo = !!req.body.activo;
      for (const f of extraFields) if (req.body[f] !== undefined) data[f] = toInt(req.body[f], 0);
      const item = await delegate().update({ where: { id: req.params.id }, data });
      res.json(item);
    } catch (e: any) {
      console.error(`update ${model}:`, e);
      res.status(500).json({ error: 'Error al actualizar el registro' });
    }
  };

  const remove = async (req: Request, res: Response): Promise<void> => {
    try {
      await delegate().update({ where: { id: req.params.id }, data: { activo: false } });
      res.json({ ok: true });
    } catch (e: any) {
      console.error(`delete ${model}:`, e);
      res.status(500).json({ error: 'Error al eliminar el registro' });
    }
  };

  return { list, create, update, remove };
}

const estados = makeCatalog('odontoEstado');
const prioridades = makeCatalog('odontoPrioridad', ['nivel']);
const riesgos = makeCatalog('odontoRiesgo');

export const getEstados = estados.list;
export const createEstado = estados.create;
export const updateEstado = estados.update;
export const deleteEstado = estados.remove;

export const getPrioridades = prioridades.list;
export const createPrioridad = prioridades.create;
export const updatePrioridad = prioridades.update;
export const deletePrioridad = prioridades.remove;

export const getRiesgos = riesgos.list;
export const createRiesgo = riesgos.create;
export const updateRiesgo = riesgos.update;
export const deleteRiesgo = riesgos.remove;
