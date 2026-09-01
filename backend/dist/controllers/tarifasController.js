import prisma from '../lib/prisma.js';
// ════════════════════════════════════════════════════════════════
// MÓDULO DE TARIFAS / TARIFARIOS — Parametrización
// Clasificación (Grupo→Tipo) · Cargos (equivalencia CUPS) · Tarifarios · Ítems
// Inspirado en el módulo Tarifario del SIIS, modernizado para SARAI.
// ════════════════════════════════════════════════════════════════
const norm = (s) => (s ?? '').toString().trim();
const digits = (s) => norm(s).replace(/\D/g, '');
// ─────────────────────────────────────────────────────────────
//  CLASIFICACIÓN — Grupos y Tipos de cargo
// ─────────────────────────────────────────────────────────────
export async function getTarifaGrupos(_req, res) {
    try {
        const grupos = await prisma.tarifaGrupo.findMany({
            orderBy: { nombre: 'asc' },
            include: { tipos: { orderBy: { nombre: 'asc' } }, _count: { select: { cargos: true } } },
        });
        res.json(grupos);
    }
    catch {
        res.status(500).json({ error: 'Error al obtener los grupos de tarifa' });
    }
}
export async function createTarifaGrupo(req, res) {
    try {
        const codigo = norm(req.body.codigo);
        const nombre = norm(req.body.nombre);
        if (!codigo)
            return res.status(400).json({ error: 'El código es requerido' });
        if (!nombre)
            return res.status(400).json({ error: 'El nombre es requerido' });
        const existe = await prisma.tarifaGrupo.findUnique({ where: { codigo } });
        if (existe)
            return res.status(409).json({ error: 'Ya existe un grupo con ese código' });
        const grupo = await prisma.tarifaGrupo.create({ data: { codigo, nombre } });
        res.status(201).json(grupo);
    }
    catch {
        res.status(500).json({ error: 'Error al crear el grupo de tarifa' });
    }
}
export async function updateTarifaGrupo(req, res) {
    try {
        const { id } = req.params;
        const data = {};
        if (req.body.nombre !== undefined)
            data.nombre = norm(req.body.nombre);
        if (req.body.activo !== undefined)
            data.activo = !!req.body.activo;
        const grupo = await prisma.tarifaGrupo.update({ where: { id }, data });
        res.json(grupo);
    }
    catch {
        res.status(500).json({ error: 'Error al actualizar el grupo de tarifa' });
    }
}
export async function deleteTarifaGrupo(req, res) {
    try {
        const { id } = req.params;
        await prisma.tarifaGrupo.update({ where: { id }, data: { activo: false } });
        res.json({ ok: true });
    }
    catch {
        res.status(500).json({ error: 'Error al desactivar el grupo de tarifa' });
    }
}
export async function createTarifaTipo(req, res) {
    try {
        const grupoId = norm(req.body.grupoId);
        const codigo = norm(req.body.codigo);
        const nombre = norm(req.body.nombre);
        if (!grupoId)
            return res.status(400).json({ error: 'El grupo es requerido' });
        if (!codigo)
            return res.status(400).json({ error: 'El código es requerido' });
        if (!nombre)
            return res.status(400).json({ error: 'El nombre es requerido' });
        const existe = await prisma.tarifaTipo.findUnique({ where: { grupoId_codigo: { grupoId, codigo } } });
        if (existe)
            return res.status(409).json({ error: 'Ya existe un tipo con ese código en el grupo' });
        const tipo = await prisma.tarifaTipo.create({ data: { grupoId, codigo, nombre } });
        res.status(201).json(tipo);
    }
    catch {
        res.status(500).json({ error: 'Error al crear el tipo de cargo' });
    }
}
export async function updateTarifaTipo(req, res) {
    try {
        const { id } = req.params;
        const data = {};
        if (req.body.nombre !== undefined)
            data.nombre = norm(req.body.nombre);
        if (req.body.activo !== undefined)
            data.activo = !!req.body.activo;
        const tipo = await prisma.tarifaTipo.update({ where: { id }, data });
        res.json(tipo);
    }
    catch {
        res.status(500).json({ error: 'Error al actualizar el tipo de cargo' });
    }
}
export async function deleteTarifaTipo(req, res) {
    try {
        const { id } = req.params;
        await prisma.tarifaTipo.update({ where: { id }, data: { activo: false } });
        res.json({ ok: true });
    }
    catch {
        res.status(500).json({ error: 'Error al desactivar el tipo de cargo' });
    }
}
// ─────────────────────────────────────────────────────────────
//  CARGOS — catálogo interno con equivalencia al CUPS oficial
// ─────────────────────────────────────────────────────────────
/** Resuelve el id del CUPS oficial a partir de un código (con o sin puntos). */
async function resolverCupsId(codigoCups) {
    const d = digits(codigoCups);
    if (!d)
        return { id: null, codigo: null };
    const cups = await prisma.cupsCodigo.findUnique({ where: { codigo: d }, select: { id: true, codigo: true } });
    return { id: cups?.id ?? null, codigo: cups?.codigo ?? d };
}
export async function getCargosTarifa(req, res) {
    try {
        const { search, grupoId, tipoId, activo } = req.query;
        const page = Math.max(1, Number(req.query.page) || 1);
        const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 50));
        const where = {};
        if (search?.trim()) {
            const raw = search.trim();
            const d = raw.replace(/\D/g, '');
            where.OR = [
                { codigo: { contains: raw, mode: 'insensitive' } },
                { descripcion: { contains: raw, mode: 'insensitive' } },
                ...(d ? [{ cupsCodigoStr: { startsWith: d } }] : []),
            ];
        }
        if (grupoId)
            where.grupoId = grupoId;
        if (tipoId)
            where.tipoId = tipoId;
        if (activo !== undefined && activo !== '')
            where.activo = activo === 'true';
        const [total, items] = await Promise.all([
            prisma.tarifaCargo.count({ where }),
            prisma.tarifaCargo.findMany({
                where,
                orderBy: { codigo: 'asc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    grupo: { select: { id: true, codigo: true, nombre: true } },
                    tipo: { select: { id: true, codigo: true, nombre: true } },
                    cupsCodigo: { select: { id: true, codigo: true, codigoFormato: true, descripcion: true } },
                },
            }),
        ]);
        res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
    }
    catch {
        res.status(500).json({ error: 'Error al obtener los cargos' });
    }
}
export async function getCargosTarifaStats(_req, res) {
    try {
        const [total, activos, conCups] = await Promise.all([
            prisma.tarifaCargo.count(),
            prisma.tarifaCargo.count({ where: { activo: true } }),
            prisma.tarifaCargo.count({ where: { cupsCodigoId: { not: null } } }),
        ]);
        res.json({ total, activos, conCups, sinCups: total - conCups });
    }
    catch {
        res.status(500).json({ error: 'Error al obtener estadísticas de cargos' });
    }
}
export async function createCargoTarifa(req, res) {
    try {
        const codigo = norm(req.body.codigo);
        const descripcion = norm(req.body.descripcion);
        if (!codigo)
            return res.status(400).json({ error: 'El código es requerido' });
        if (!descripcion)
            return res.status(400).json({ error: 'La descripción es requerida' });
        const existe = await prisma.tarifaCargo.findUnique({ where: { codigo } });
        if (existe)
            return res.status(409).json({ error: 'Ya existe un cargo con ese código' });
        const { id: cupsCodigoId, codigo: cupsCodigoStr } = await resolverCupsId(req.body.cupsCodigo);
        const cargo = await prisma.tarifaCargo.create({
            data: {
                codigo,
                descripcion,
                cupsCodigoId,
                cupsCodigoStr,
                grupoId: norm(req.body.grupoId) || null,
                tipoId: norm(req.body.tipoId) || null,
                nivel: norm(req.body.nivel) || null,
                tipoUnidad: norm(req.body.tipoUnidad) || null,
                conceptoRips: norm(req.body.conceptoRips) || null,
            },
        });
        res.status(201).json(cargo);
    }
    catch {
        res.status(500).json({ error: 'Error al crear el cargo' });
    }
}
export async function updateCargoTarifa(req, res) {
    try {
        const { id } = req.params;
        const data = {};
        if (req.body.descripcion !== undefined)
            data.descripcion = norm(req.body.descripcion);
        if (req.body.grupoId !== undefined)
            data.grupoId = norm(req.body.grupoId) || null;
        if (req.body.tipoId !== undefined)
            data.tipoId = norm(req.body.tipoId) || null;
        if (req.body.nivel !== undefined)
            data.nivel = norm(req.body.nivel) || null;
        if (req.body.tipoUnidad !== undefined)
            data.tipoUnidad = norm(req.body.tipoUnidad) || null;
        if (req.body.conceptoRips !== undefined)
            data.conceptoRips = norm(req.body.conceptoRips) || null;
        if (req.body.activo !== undefined)
            data.activo = !!req.body.activo;
        if (req.body.cupsCodigo !== undefined) {
            const { id: cupsCodigoId, codigo: cupsCodigoStr } = await resolverCupsId(req.body.cupsCodigo);
            data.cupsCodigoId = cupsCodigoId;
            data.cupsCodigoStr = cupsCodigoStr;
        }
        const cargo = await prisma.tarifaCargo.update({ where: { id }, data });
        res.json(cargo);
    }
    catch {
        res.status(500).json({ error: 'Error al actualizar el cargo' });
    }
}
export async function deleteCargoTarifa(req, res) {
    try {
        const { id } = req.params;
        await prisma.tarifaCargo.update({ where: { id }, data: { activo: false } });
        res.json({ ok: true });
    }
    catch {
        res.status(500).json({ error: 'Error al desactivar el cargo' });
    }
}
/** Cargue masivo de cargos por archivo plano/CSV. */
export async function bulkCreateCargosTarifa(req, res) {
    try {
        const rows = Array.isArray(req.body.items) ? req.body.items : [];
        if (!rows.length)
            return res.status(400).json({ error: 'No se recibieron registros' });
        // Cache de grupos/tipos por código para resolver rápido
        const grupos = await prisma.tarifaGrupo.findMany({ select: { id: true, codigo: true } });
        const tipos = await prisma.tarifaTipo.findMany({ select: { id: true, codigo: true, grupoId: true } });
        const grupoByCod = new Map(grupos.map(g => [g.codigo.toUpperCase(), g.id]));
        const results = { created: 0, skipped: 0, errors: [] };
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const codigo = norm(row.codigo);
            const descripcion = norm(row.descripcion);
            if (!codigo || !descripcion) {
                results.errors.push({ fila: i + 1, error: 'codigo y descripcion son obligatorios' });
                continue;
            }
            const existe = await prisma.tarifaCargo.findUnique({ where: { codigo } });
            if (existe) {
                results.skipped++;
                continue;
            }
            const grupoId = row.grupo ? (grupoByCod.get(norm(row.grupo).toUpperCase()) ?? null) : null;
            const tipoId = (row.tipo && grupoId)
                ? (tipos.find(t => t.grupoId === grupoId && t.codigo.toUpperCase() === norm(row.tipo).toUpperCase())?.id ?? null)
                : null;
            const { id: cupsCodigoId, codigo: cupsCodigoStr } = await resolverCupsId(row.cupsCodigo);
            await prisma.tarifaCargo.create({
                data: {
                    codigo,
                    descripcion,
                    cupsCodigoId,
                    cupsCodigoStr,
                    grupoId,
                    tipoId,
                    nivel: norm(row.nivel) || null,
                    tipoUnidad: norm(row.tipoUnidad) || null,
                    conceptoRips: norm(row.conceptoRips) || null,
                },
            });
            results.created++;
        }
        res.json(results);
    }
    catch {
        res.status(500).json({ error: 'Error en el cargue masivo de cargos' });
    }
}
// ─────────────────────────────────────────────────────────────
//  TARIFARIOS — listas de precios
// ─────────────────────────────────────────────────────────────
export async function getTarifarios(req, res) {
    try {
        const { search, activo } = req.query;
        const where = {};
        if (search?.trim()) {
            where.OR = [
                { codigo: { contains: search.trim(), mode: 'insensitive' } },
                { nombre: { contains: search.trim(), mode: 'insensitive' } },
            ];
        }
        if (activo !== undefined && activo !== '')
            where.activo = activo === 'true';
        const tarifarios = await prisma.tarifario.findMany({
            where,
            orderBy: { nombre: 'asc' },
            include: {
                base: { select: { id: true, codigo: true, nombre: true } },
                _count: { select: { items: true } },
            },
        });
        res.json(tarifarios);
    }
    catch {
        res.status(500).json({ error: 'Error al obtener los tarifarios' });
    }
}
export async function getTarifarioById(req, res) {
    try {
        const { id } = req.params;
        const tarifario = await prisma.tarifario.findUnique({
            where: { id },
            include: { base: { select: { id: true, codigo: true, nombre: true } }, _count: { select: { items: true } } },
        });
        if (!tarifario)
            return res.status(404).json({ error: 'Tarifario no encontrado' });
        res.json(tarifario);
    }
    catch {
        res.status(500).json({ error: 'Error al obtener el tarifario' });
    }
}
export async function createTarifario(req, res) {
    try {
        const codigo = norm(req.body.codigo);
        const nombre = norm(req.body.nombre);
        if (!codigo)
            return res.status(400).json({ error: 'El código es requerido' });
        if (!nombre)
            return res.status(400).json({ error: 'El nombre es requerido' });
        const existe = await prisma.tarifario.findUnique({ where: { codigo } });
        if (existe)
            return res.status(409).json({ error: 'Ya existe un tarifario con ese código' });
        const baseId = norm(req.body.baseId) || null;
        const porcentaje = req.body.porcentaje !== undefined && req.body.porcentaje !== '' ? Number(req.body.porcentaje) : null;
        if (porcentaje !== null && !Number.isFinite(porcentaje))
            return res.status(400).json({ error: 'El porcentaje no es válido' });
        const tarifario = await prisma.tarifario.create({
            data: {
                codigo,
                nombre,
                descripcion: norm(req.body.descripcion) || null,
                tipo: norm(req.body.tipo) || null,
                baseId,
                porcentaje,
                vigenciaDesde: req.body.vigenciaDesde ? new Date(req.body.vigenciaDesde) : null,
                vigenciaHasta: req.body.vigenciaHasta ? new Date(req.body.vigenciaHasta) : null,
            },
        });
        res.status(201).json(tarifario);
    }
    catch {
        res.status(500).json({ error: 'Error al crear el tarifario' });
    }
}
export async function updateTarifario(req, res) {
    try {
        const { id } = req.params;
        const data = {};
        if (req.body.nombre !== undefined)
            data.nombre = norm(req.body.nombre);
        if (req.body.descripcion !== undefined)
            data.descripcion = norm(req.body.descripcion) || null;
        if (req.body.tipo !== undefined)
            data.tipo = norm(req.body.tipo) || null;
        if (req.body.baseId !== undefined)
            data.baseId = norm(req.body.baseId) || null;
        if (req.body.porcentaje !== undefined)
            data.porcentaje = req.body.porcentaje === '' ? null : Number(req.body.porcentaje);
        if (req.body.vigenciaDesde !== undefined)
            data.vigenciaDesde = req.body.vigenciaDesde ? new Date(req.body.vigenciaDesde) : null;
        if (req.body.vigenciaHasta !== undefined)
            data.vigenciaHasta = req.body.vigenciaHasta ? new Date(req.body.vigenciaHasta) : null;
        if (req.body.activo !== undefined)
            data.activo = !!req.body.activo;
        const tarifario = await prisma.tarifario.update({ where: { id }, data });
        res.json(tarifario);
    }
    catch {
        res.status(500).json({ error: 'Error al actualizar el tarifario' });
    }
}
export async function deleteTarifario(req, res) {
    try {
        const { id } = req.params;
        await prisma.tarifario.update({ where: { id }, data: { activo: false } });
        res.json({ ok: true });
    }
    catch {
        res.status(500).json({ error: 'Error al desactivar el tarifario' });
    }
}
/**
 * Genera/actualiza los ítems de un tarifario copiando los de su tarifario base
 * y aplicando el porcentaje configurado (ej. 110 = +10%).
 */
export async function generarTarifarioDesdeBase(req, res) {
    try {
        const { id } = req.params;
        const tarifario = await prisma.tarifario.findUnique({ where: { id } });
        if (!tarifario)
            return res.status(404).json({ error: 'Tarifario no encontrado' });
        if (!tarifario.baseId)
            return res.status(400).json({ error: 'El tarifario no tiene un tarifario base configurado' });
        const factor = (tarifario.porcentaje ?? 100) / 100;
        const sobrescribir = req.body.sobrescribir === true || req.body.sobrescribir === 'true';
        const baseItems = await prisma.tarifaItem.findMany({ where: { tarifarioId: tarifario.baseId, activo: true } });
        const existentes = await prisma.tarifaItem.findMany({ where: { tarifarioId: id }, select: { cargoId: true } });
        const yaTiene = new Set(existentes.map(e => e.cargoId));
        let creados = 0, actualizados = 0, omitidos = 0;
        for (const bi of baseItems) {
            const precio = Math.round(bi.precio * factor * 100) / 100;
            if (yaTiene.has(bi.cargoId)) {
                if (sobrescribir) {
                    await prisma.tarifaItem.update({ where: { tarifarioId_cargoId: { tarifarioId: id, cargoId: bi.cargoId } }, data: { precio } });
                    actualizados++;
                }
                else {
                    omitidos++;
                }
            }
            else {
                await prisma.tarifaItem.create({ data: { tarifarioId: id, cargoId: bi.cargoId, precio } });
                creados++;
            }
        }
        res.json({ creados, actualizados, omitidos, factor });
    }
    catch {
        res.status(500).json({ error: 'Error al generar el tarifario desde la base' });
    }
}
// ─────────────────────────────────────────────────────────────
//  ÍTEMS de un tarifario (precios por cargo)
// ─────────────────────────────────────────────────────────────
export async function getTarifarioItems(req, res) {
    try {
        const { id } = req.params; // tarifarioId
        const { search, activo } = req.query;
        const page = Math.max(1, Number(req.query.page) || 1);
        const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 50));
        const where = { tarifarioId: id };
        if (activo !== undefined && activo !== '')
            where.activo = activo === 'true';
        if (search?.trim()) {
            const raw = search.trim();
            const d = raw.replace(/\D/g, '');
            where.cargo = {
                OR: [
                    { codigo: { contains: raw, mode: 'insensitive' } },
                    { descripcion: { contains: raw, mode: 'insensitive' } },
                    ...(d ? [{ cupsCodigoStr: { startsWith: d } }] : []),
                ],
            };
        }
        const [total, items] = await Promise.all([
            prisma.tarifaItem.count({ where }),
            prisma.tarifaItem.findMany({
                where,
                orderBy: { cargo: { codigo: 'asc' } },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    cargo: {
                        select: {
                            id: true, codigo: true, descripcion: true, cupsCodigoStr: true,
                            grupo: { select: { codigo: true, nombre: true } },
                            tipo: { select: { codigo: true, nombre: true } },
                        },
                    },
                },
            }),
        ]);
        res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
    }
    catch {
        res.status(500).json({ error: 'Error al obtener los ítems del tarifario' });
    }
}
/** Crea o actualiza el precio de un cargo en un tarifario. */
export async function upsertTarifarioItem(req, res) {
    try {
        const { id } = req.params; // tarifarioId
        const cargoId = norm(req.body.cargoId);
        const precio = Number(req.body.precio);
        if (!cargoId)
            return res.status(400).json({ error: 'El cargo es requerido' });
        if (!Number.isFinite(precio) || precio < 0)
            return res.status(400).json({ error: 'El precio no es válido' });
        const item = await prisma.tarifaItem.upsert({
            where: { tarifarioId_cargoId: { tarifarioId: id, cargoId } },
            update: { precio, activo: req.body.activo !== undefined ? !!req.body.activo : undefined },
            create: { tarifarioId: id, cargoId, precio },
        });
        res.json(item);
    }
    catch {
        res.status(500).json({ error: 'Error al guardar el ítem del tarifario' });
    }
}
export async function deleteTarifarioItem(req, res) {
    try {
        const { itemId } = req.params;
        await prisma.tarifaItem.delete({ where: { id: itemId } });
        res.json({ ok: true });
    }
    catch {
        res.status(500).json({ error: 'Error al eliminar el ítem del tarifario' });
    }
}
/** Cargue masivo de precios (ítems) por archivo plano/CSV: columnas cargo, precio. */
export async function bulkTarifarioItems(req, res) {
    try {
        const { id } = req.params; // tarifarioId
        const rows = Array.isArray(req.body.items) ? req.body.items : [];
        if (!rows.length)
            return res.status(400).json({ error: 'No se recibieron registros' });
        const tarifario = await prisma.tarifario.findUnique({ where: { id }, select: { id: true } });
        if (!tarifario)
            return res.status(404).json({ error: 'Tarifario no encontrado' });
        const results = { created: 0, updated: 0, errors: [] };
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const codCargo = norm(row.cargo || row.codigo);
            const precio = Number(row.precio);
            if (!codCargo) {
                results.errors.push({ fila: i + 1, error: 'falta el código del cargo' });
                continue;
            }
            if (!Number.isFinite(precio) || precio < 0) {
                results.errors.push({ fila: i + 1, error: 'precio inválido' });
                continue;
            }
            const cargo = await prisma.tarifaCargo.findUnique({ where: { codigo: codCargo }, select: { id: true } });
            if (!cargo) {
                results.errors.push({ fila: i + 1, error: `cargo "${codCargo}" no existe` });
                continue;
            }
            const existe = await prisma.tarifaItem.findUnique({ where: { tarifarioId_cargoId: { tarifarioId: id, cargoId: cargo.id } } });
            await prisma.tarifaItem.upsert({
                where: { tarifarioId_cargoId: { tarifarioId: id, cargoId: cargo.id } },
                update: { precio },
                create: { tarifarioId: id, cargoId: cargo.id, precio },
            });
            if (existe)
                results.updated++;
            else
                results.created++;
        }
        res.json(results);
    }
    catch {
        res.status(500).json({ error: 'Error en el cargue masivo de precios' });
    }
}
