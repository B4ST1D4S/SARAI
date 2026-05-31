import { Request, Response } from 'express';
import prisma from '../lib/prisma.ts';

// ============================================
// PROCEDIMIENTOS CUPS
// ============================================

export async function getAllProcedimientos(req: Request, res: Response) {
  try {
    const procedimientos = await prisma.procedimientoCUPS.findMany({
      where: { activo: true },
      include: {
        plantillas: true,
        checklistTemplates: true,
        consentimientosTemplate: true,
      },
      orderBy: { nombre: 'asc' },
    });

    res.json(procedimientos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener procedimientos' });
  }
}

export async function getProcedimientoByCUPS(req: Request, res: Response) {
  try {
    const { cups } = req.params;

    const procedimiento = await prisma.procedimientoCUPS.findUnique({
      where: { codigoCUPS: cups },
      include: {
        plantillas: {
          where: { activa: true },
          orderBy: { ordenVisualizacion: 'asc' },
        },
        checklistTemplates: {
          where: { activo: true },
        },
        consentimientosTemplate: {
          where: { activo: true },
        },
      },
    });

    if (!procedimiento) {
      return res.status(404).json({ error: 'Procedimiento CUPS no encontrado' });
    }

    res.json(procedimiento);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener procedimiento' });
  }
}

export async function createProcedimiento(req: Request, res: Response) {
  try {
    const {
      codigoCUPS,
      nombre,
      descripcion,
      tipoCategoria,
      riesgoNivel,
      diasSeguimiento,
      datosAdicionales,
    } = req.body;

    // Validar que CUPS no exista
    const existe = await prisma.procedimientoCUPS.findUnique({
      where: { codigoCUPS },
    });

    if (existe) {
      return res.status(400).json({ error: 'Este CUPS ya existe' });
    }

    const nuevo = await prisma.procedimientoCUPS.create({
      data: {
        codigoCUPS,
        nombre,
        descripcion,
        tipoCategoria,
        riesgoNivel,
        diasSeguimiento: diasSeguimiento || 30,
        datosAdicionales,
      },
    });

    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear procedimiento' });
  }
}

export async function updateProcedimiento(req: Request, res: Response) {
  try {
    const { cups } = req.params;
    const { nombre, descripcion, tipoCategoria, riesgoNivel, diasSeguimiento, activo } = req.body;

    const actualizado = await prisma.procedimientoCUPS.update({
      where: { codigoCUPS: cups },
      data: {
        nombre,
        descripcion,
        tipoCategoria,
        riesgoNivel,
        diasSeguimiento,
        activo,
      },
    });

    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar procedimiento' });
  }
}

export async function deleteProcedimiento(req: Request, res: Response) {
  try {
    const { cups } = req.params;

    await prisma.procedimientoCUPS.update({
      where: { codigoCUPS: cups },
      data: { activo: false },
    });

    res.json({ mensaje: 'Procedimiento desactivado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar procedimiento' });
  }
}

// ============================================
// PLANTILLAS POR CUPS
// ============================================

export async function getPlantillasPorCUPS(req: Request, res: Response) {
  try {
    const { cups, tipo } = req.query;

    const where: any = {
      codigoCUPS: cups,
      activa: true,
    };

    if (tipo) {
      where.tipo = tipo;
    }

    const plantillas = await prisma.plantillaTemplate.findMany({
      where,
      orderBy: { ordenVisualizacion: 'asc' },
    });

    res.json(plantillas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener plantillas' });
  }
}

export async function getPlantillaById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const plantilla = await prisma.plantillaTemplate.findUnique({
      where: { id },
    });

    if (!plantilla) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    res.json(plantilla);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener plantilla' });
  }
}

export async function createPlantilla(req: Request, res: Response) {
  try {
    const {
      codigoCUPS,
      nombre,
      tipo,
      descripcion,
      seccionesJSON,
      requiereSignatura,
      requiereFoto,
      requiereMapaCorporal,
      ordenVisualizacion,
    } = req.body;

    const nueva = await prisma.plantillaTemplate.create({
      data: {
        codigoCUPS,
        nombre,
        tipo,
        descripcion,
        seccionesJSON,
        requiereSignatura: requiereSignatura || false,
        requiereFoto: requiereFoto || false,
        requiereMapaCorporal: requiereMapaCorporal || false,
        ordenVisualizacion: ordenVisualizacion || 1,
      },
    });

    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear plantilla' });
  }
}

export async function updatePlantilla(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;

    const actualizada = await prisma.plantillaTemplate.update({
      where: { id },
      data,
    });

    res.json(actualizada);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar plantilla' });
  }
}

export async function deletePlantilla(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.plantillaTemplate.update({
      where: { id },
      data: { activa: false },
    });

    res.json({ mensaje: 'Plantilla desactivada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar plantilla' });
  }
}

// ============================================
// CHECKLISTS
// ============================================

export async function getChecklistPorCUPS(req: Request, res: Response) {
  try {
    const { cups, fase } = req.query;

    const where: any = {
      codigoCUPS: cups,
      activo: true,
    };

    if (fase) {
      where.fase = fase;
    }

    const checklists = await prisma.checklistTemplate.findMany({
      where,
      orderBy: { fase: 'asc' },
    });

    res.json(checklists);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener checklists' });
  }
}

export async function createChecklist(req: Request, res: Response) {
  try {
    const { codigoCUPS, fase, nombre, itemsJSON, alertasAutomaticasJSON } = req.body;

    const nuevo = await prisma.checklistTemplate.create({
      data: {
        codigoCUPS,
        fase,
        nombre,
        itemsJSON,
        alertasAutomaticasJSON,
      },
    });

    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear checklist' });
  }
}

export async function updateChecklist(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;

    const actualizado = await prisma.checklistTemplate.update({
      where: { id },
      data,
    });

    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar checklist' });
  }
}

// ============================================
// CONSENTIMIENTOS
// ============================================

export async function getConsentimientoPorCUPS(req: Request, res: Response) {
  try {
    const { cups } = req.params;

    const consentimiento = await prisma.consentimientoTemplate.findUnique({
      where: { codigoCUPS: cups },
    });

    if (!consentimiento) {
      return res.status(404).json({ error: 'Consentimiento no encontrado para este CUPS' });
    }

    res.json(consentimiento);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener consentimiento' });
  }
}

export async function createConsentimiento(req: Request, res: Response) {
  try {
    const {
      codigoCUPS,
      titulo,
      seccionesJSON,
      riesgosJSON,
      recomendacionesJSON,
    } = req.body;

    const nuevo = await prisma.consentimientoTemplate.create({
      data: {
        codigoCUPS,
        titulo,
        seccionesJSON,
        riesgosJSON,
        recomendacionesJSON,
      },
    });

    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear consentimiento' });
  }
}

export async function updateConsentimiento(req: Request, res: Response) {
  try {
    const { cups } = req.params;
    const data = req.body;

    const actualizado = await prisma.consentimientoTemplate.update({
      where: { codigoCUPS: cups },
      data,
    });

    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar consentimiento' });
  }
}
