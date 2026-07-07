import { Request, Response } from 'express';
import { PrismaClient, CupsNivel } from '@prisma/client';

const prisma = new PrismaClient();

// ════════════════════════════════════════════════
// CATÁLOGO CUPS — Resolución 2706 de 2025
// Tabla CupsCodigo (codificación oficial jerárquica)
// ════════════════════════════════════════════════

/**
 * Deriva la estructura jerárquica de un código CUPS a partir de su valor.
 * GRUPO (2) > SUBGRUPO (+1) > CATEGORÍA (+1) > SUBCATEGORÍA (+2) — máx. 6 dígitos.
 */
function derivarCups(codigoRaw: string) {
  const d = (codigoRaw || '').replace(/\D/g, '');
  let nivel: CupsNivel;
  let codigoFormato: string;
  const g = d.slice(0, 2);
  const sg = d.length >= 3 ? d[2] : null;
  const cat = d.length >= 4 ? d[3] : null;
  const sub = d.length >= 6 ? d.slice(4, 6) : null;

  if (d.length === 2) { nivel = 'GRUPO'; codigoFormato = `${g}.`; }
  else if (d.length === 3) { nivel = 'SUBGRUPO'; codigoFormato = `${g}.${sg}.`; }
  else if (d.length === 4) { nivel = 'CATEGORIA'; codigoFormato = `${g}.${sg}.${cat}.`; }
  else if (d.length === 6) { nivel = 'SUBCATEGORIA'; codigoFormato = `${g}.${sg}.${cat}.${sub}`; }
  else return null;

  let parentCodigo: string | null = null;
  if (nivel === 'SUBCATEGORIA') parentCodigo = d.slice(0, 4);
  else if (nivel === 'CATEGORIA') parentCodigo = d.slice(0, 3);
  else if (nivel === 'SUBGRUPO') parentCodigo = d.slice(0, 2);

  return {
    codigo: d,
    codigoFormato,
    nivel,
    grupo: g,
    subgrupo: sg,
    categoria: cat,
    subcategoria: sub,
    parentCodigo,
    esFacturable: nivel === 'SUBCATEGORIA',
  };
}

// ─── Listado paginado con búsqueda y filtros ──────────────────
export async function getCupsCodigos(req: Request, res: Response) {
  try {
    const { search, nivel, capitulo, activo, esFacturable } = req.query as Record<string, string>;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 50));

    const where: any = {};
    if (search?.trim()) {
      const raw = search.trim();
      const digits = raw.replace(/\D/g, ''); // código sin puntos
      where.OR = [
        ...(digits ? [{ codigo: { startsWith: digits } }] : []),
        { descripcion: { contains: raw, mode: 'insensitive' } },
      ];
    }
    if (nivel) where.nivel = nivel as CupsNivel;
    if (capitulo) where.capitulo = capitulo;
    if (activo !== undefined && activo !== '') where.activo = activo === 'true';
    if (esFacturable !== undefined && esFacturable !== '') where.esFacturable = esFacturable === 'true';

    const [total, items] = await Promise.all([
      prisma.cupsCodigo.count({ where }),
      prisma.cupsCodigo.findMany({
        where,
        orderBy: { codigo: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener el catálogo CUPS' });
  }
}

// ─── Estadísticas por nivel ───────────────────────────────────
export async function getCupsCodigosStats(_req: Request, res: Response) {
  try {
    const [total, porNivel, facturables] = await Promise.all([
      prisma.cupsCodigo.count(),
      prisma.cupsCodigo.groupBy({ by: ['nivel'], _count: true }),
      prisma.cupsCodigo.count({ where: { esFacturable: true } }),
    ]);
    const niveles: Record<string, number> = {};
    porNivel.forEach((p) => { niveles[p.nivel] = p._count; });
    res.json({ total, niveles, facturables });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener estadísticas CUPS' });
  }
}

// ─── Crear un código (formulario) ─────────────────────────────
export async function createCupsCodigo(req: Request, res: Response) {
  try {
    const { codigo, descripcion, seccion, capitulo, incluye, excluye, nota } = req.body;
    if (!codigo || !descripcion?.trim())
      return res.status(400).json({ error: 'Código y descripción son requeridos' });

    const der = derivarCups(codigo);
    if (!der)
      return res.status(400).json({ error: 'Código inválido: debe tener 2, 3, 4 o 6 dígitos (ej: 01, 010, 0101, 010101)' });

    const existe = await prisma.cupsCodigo.findUnique({ where: { codigo: der.codigo } });
    if (existe) return res.status(400).json({ error: `El código ${der.codigoFormato} ya existe` });

    let parentId: string | null = null;
    if (der.parentCodigo) {
      const parent = await prisma.cupsCodigo.findUnique({ where: { codigo: der.parentCodigo } });
      parentId = parent?.id ?? null;
    }

    const item = await prisma.cupsCodigo.create({
      data: {
        codigo: der.codigo,
        codigoFormato: der.codigoFormato,
        nivel: der.nivel,
        descripcion: descripcion.trim(),
        seccion: seccion ?? '',
        capitulo: capitulo ?? '',
        grupo: der.grupo,
        subgrupo: der.subgrupo,
        categoria: der.categoria,
        subcategoria: der.subcategoria,
        parentId,
        incluye: incluye || null,
        excluye: excluye || null,
        nota: nota || null,
        esFacturable: der.esFacturable,
      },
    });
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear el código CUPS' });
  }
}

// ─── Actualizar un código ─────────────────────────────────────
export async function updateCupsCodigo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { descripcion, seccion, capitulo, incluye, excluye, nota, esFacturable, activo } = req.body;
    const item = await prisma.cupsCodigo.update({
      where: { id },
      data: {
        ...(descripcion !== undefined && { descripcion: String(descripcion).trim() }),
        ...(seccion !== undefined && { seccion }),
        ...(capitulo !== undefined && { capitulo }),
        ...(incluye !== undefined && { incluye: incluye || null }),
        ...(excluye !== undefined && { excluye: excluye || null }),
        ...(nota !== undefined && { nota: nota || null }),
        ...(esFacturable !== undefined && { esFacturable: Boolean(esFacturable) }),
        ...(activo !== undefined && { activo: Boolean(activo) }),
      },
    });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar el código CUPS' });
  }
}

// ─── Eliminar (desactivar) ────────────────────────────────────
export async function deleteCupsCodigo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.cupsCodigo.update({ where: { id }, data: { activo: false } });
    res.json({ message: 'Código desactivado' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar el código CUPS' });
  }
}

// ─── Cargue masivo por archivo plano ──────────────────────────
export async function bulkCreateCupsCodigos(req: Request, res: Response) {
  try {
    const { items } = req.body as { items: any[] };
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'Se requiere un arreglo de items' });

    // Derivar y validar todas las filas
    const derivadas: any[] = [];
    const errors: string[] = [];
    for (const row of items) {
      const codigo = row.codigo ?? row.codigoFormato ?? '';
      const descripcion = (row.descripcion ?? '').trim();
      if (!codigo || !descripcion) { errors.push(`Fila sin código/descripción: ${JSON.stringify(row)}`); continue; }
      const der = derivarCups(codigo);
      if (!der) { errors.push(`Código inválido: ${codigo}`); continue; }
      derivadas.push({
        ...der,
        descripcion,
        seccion: row.seccion ?? '',
        capitulo: row.capitulo ?? '',
        incluye: row.incluye || null,
        excluye: row.excluye || null,
        nota: row.nota || null,
      });
    }

    // Insertar padres antes que hijos (menor longitud de código primero)
    derivadas.sort((a, b) => a.codigo.length - b.codigo.length);

    const results = { created: 0, skipped: 0, errors };
    for (const der of derivadas) {
      const existe = await prisma.cupsCodigo.findUnique({ where: { codigo: der.codigo } });
      if (existe) { results.skipped++; continue; }
      let parentId: string | null = null;
      if (der.parentCodigo) {
        const parent = await prisma.cupsCodigo.findUnique({ where: { codigo: der.parentCodigo } });
        parentId = parent?.id ?? null;
      }
      await prisma.cupsCodigo.create({
        data: {
          codigo: der.codigo,
          codigoFormato: der.codigoFormato,
          nivel: der.nivel,
          descripcion: der.descripcion,
          seccion: der.seccion,
          capitulo: der.capitulo,
          grupo: der.grupo,
          subgrupo: der.subgrupo,
          categoria: der.categoria,
          subcategoria: der.subcategoria,
          parentId,
          incluye: der.incluye,
          excluye: der.excluye,
          nota: der.nota,
          esFacturable: der.esFacturable,
        },
      });
      results.created++;
    }
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: 'Error en cargue masivo de códigos CUPS' });
  }
}
