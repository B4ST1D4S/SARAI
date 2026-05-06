import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────
// 1. ESPECIALIDADES
// ─────────────────────────────────────────

export async function getEspecialidades(req: Request, res: Response) {
  try {
    const items = await prisma.especialidad.findMany({
      orderBy: { nombre: 'asc' },
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener especialidades' });
  }
}

export async function createEspecialidad(req: Request, res: Response) {
  try {
    const { codigo, nombre, descripcion, aplicaAnestesia, aplicaPediatria,
            aplicaCirugia, aplicaInstrumentacion, aplicaMedicoFamiliar } = req.body;

    if (!codigo || !nombre) return res.status(400).json({ error: 'codigo y nombre son requeridos' });

    const existe = await prisma.especialidad.findFirst({ where: { OR: [{ codigo }, { nombre }] } });
    if (existe) return res.status(400).json({ error: 'Código o nombre ya existe' });

    const item = await prisma.especialidad.create({
      data: {
        codigo, nombre, descripcion,
        aplicaAnestesia: aplicaAnestesia ?? false,
        aplicaPediatria: aplicaPediatria ?? false,
        aplicaCirugia: aplicaCirugia ?? false,
        aplicaInstrumentacion: aplicaInstrumentacion ?? false,
        aplicaMedicoFamiliar: aplicaMedicoFamiliar ?? false,
        usuarioCreacion: (req as any).user?.id,
      },
    });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Error al crear especialidad' });
  }
}

export async function updateEspecialidad(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;
    delete data.id;
    const item = await prisma.especialidad.update({ where: { id }, data });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al actualizar especialidad' });
  }
}

export async function deleteEspecialidad(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const enUso = await prisma.tipoConsulta.findFirst({ where: { especialidadId: id } });
    if (enUso) return res.status(400).json({ error: 'Especialidad en uso. No se puede eliminar.' });
    await prisma.especialidad.update({ where: { id }, data: { estado: false } });
    res.json({ message: 'Especialidad desactivada' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar especialidad' });
  }
}

// ─────────────────────────────────────────
// 2. HC MÓDULOS
// ─────────────────────────────────────────

export async function getHCModulos(req: Request, res: Response) {
  try {
    const items = await prisma.hCModulo.findMany({ orderBy: { nombre: 'asc' } });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener módulos HC' });
  }
}

export async function createHCModulo(req: Request, res: Response) {
  try {
    const { codigo, nombre, descripcion, tipoFinalidad, tipoRips, parametrosConfiguracion, programaId } = req.body;
    if (!codigo || !nombre) return res.status(400).json({ error: 'codigo y nombre son requeridos' });

    const existe = await prisma.hCModulo.findUnique({ where: { codigo } });
    if (existe) return res.status(400).json({ error: 'Código ya existe' });

    const item = await prisma.hCModulo.create({
      data: { codigo, nombre, descripcion, tipoFinalidad, tipoRips, parametrosConfiguracion, programaId,
              usuarioCreacion: (req as any).user?.id },
    });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Error al crear módulo HC' });
  }
}

export async function updateHCModulo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;
    delete data.id;
    const item = await prisma.hCModulo.update({ where: { id }, data });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al actualizar módulo HC' });
  }
}

export async function deleteHCModulo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const enUso = await prisma.tipoConsulta.findFirst({ where: { hcModuloId: id } });
    if (enUso) return res.status(400).json({ error: 'Módulo HC en uso. No se puede eliminar.' });
    await prisma.hCModulo.update({ where: { id }, data: { activo: false } });
    res.json({ message: 'Módulo HC desactivado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar módulo HC' });
  }
}

// ─────────────────────────────────────────
// 3. DEPARTAMENTOS
// ─────────────────────────────────────────

export async function getDepartamentos(req: Request, res: Response) {
  try {
    const items = await prisma.departamento.findMany({ orderBy: { nombre: 'asc' } });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener departamentos' });
  }
}

export async function createDepartamento(req: Request, res: Response) {
  try {
    const { codigo, nombre, descripcion } = req.body;
    if (!codigo || !nombre) return res.status(400).json({ error: 'codigo y nombre son requeridos' });

    const existe = await prisma.departamento.findUnique({ where: { codigo } });
    if (existe) return res.status(400).json({ error: 'Código ya existe' });

    const item = await prisma.departamento.create({ data: { codigo, nombre, descripcion } });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Error al crear departamento' });
  }
}

export async function updateDepartamento(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;
    delete data.id;
    const item = await prisma.departamento.update({ where: { id }, data });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al actualizar departamento' });
  }
}

export async function deleteDepartamento(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const enUso = await prisma.tipoConsulta.findFirst({ where: { departamentoId: id } });
    if (enUso) return res.status(400).json({ error: 'Departamento en uso.' });
    await prisma.departamento.update({ where: { id }, data: { estado: false } });
    res.json({ message: 'Departamento desactivado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar departamento' });
  }
}

// ─────────────────────────────────────────
// 4. SERVICIOS FACTURABLES
// ─────────────────────────────────────────

export async function getServicios(req: Request, res: Response) {
  try {
    const { search, categoria } = req.query;
    const where: any = { estado: true };
    if (search) where.OR = [
      { codigoCups: { contains: String(search), mode: 'insensitive' } },
      { nombre: { contains: String(search), mode: 'insensitive' } },
    ];
    if (categoria) where.categoria = categoria;
    const items = await prisma.servicioFacturable.findMany({ where, orderBy: { nombre: 'asc' }, take: 100 });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
}

export async function createServicio(req: Request, res: Response) {
  try {
    const { codigoCups, nombre, descripcion, categoria, subcategoria, tipoServicio,
            nivelComplejidad, conceptoRips, precioBase, requiereCantidad, esHonorario, esPOS } = req.body;
    if (!codigoCups || !nombre) return res.status(400).json({ error: 'codigoCups y nombre son requeridos' });

    const existe = await prisma.servicioFacturable.findUnique({ where: { codigoCups } });
    if (existe) return res.status(400).json({ error: 'Código CUPS ya existe' });

    const item = await prisma.servicioFacturable.create({
      data: { codigoCups, nombre, descripcion, categoria, subcategoria, tipoServicio,
              nivelComplejidad, conceptoRips, precioBase: precioBase ?? 0,
              requiereCantidad: requiereCantidad ?? false,
              esHonorario: esHonorario ?? false,
              esPOS: esPOS ?? false },
    });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Error al crear servicio' });
  }
}

export async function updateServicio(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;
    delete data.id;
    const item = await prisma.servicioFacturable.update({ where: { id }, data });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
}

export async function deleteServicio(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.servicioFacturable.update({ where: { id }, data: { estado: false } });
    res.json({ message: 'Servicio desactivado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
}

// ─────────────────────────────────────────
// 5. TIPOS DE CONSULTA
// ─────────────────────────────────────────

export async function getTiposConsulta(req: Request, res: Response) {
  try {
    const items = await prisma.tipoConsulta.findMany({
      where: { estado: true },
      include: {
        especialidad: { select: { id: true, nombre: true, codigo: true } },
        departamento: { select: { id: true, nombre: true, codigo: true } },
        hcModulo:     { select: { id: true, nombre: true, codigo: true } },
        serviciosConfig: {
          include: { servicio: { select: { id: true, codigoCups: true, nombre: true, precioBase: true } } },
        },
        preparaciones: { where: { estado: true }, select: { id: true, nombre: true } },
      },
      orderBy: { nombre: 'asc' },
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener tipos de consulta' });
  }
}

export async function getTipoConsultaById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const item = await prisma.tipoConsulta.findUnique({
      where: { id },
      include: {
        especialidad: true,
        departamento: true,
        hcModulo: true,
        serviciosConfig: { include: { servicio: true } },
        preparaciones: true,
      },
    });
    if (!item) return res.status(404).json({ error: 'Tipo de consulta no encontrado' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al obtener tipo de consulta' });
  }
}

export async function createTipoConsulta(req: Request, res: Response) {
  try {
    const { nombre, descripcion, especialidadId, departamentoId, hcModuloId,
            requiereCaja, manejaAnestesia, permiteAgendamiento, controlaTiempoCita,
            abreHistoriaClinica, permiteCargosAdicionales, esProgramaPYP,
            manejaProtocolos, clasificacion, esPsicologia,
            duracionMinutos, bodegaId, servicios } = req.body;

    if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });

    const tipoConsulta = await prisma.tipoConsulta.create({
      data: {
        nombre, descripcion,
        especialidadId: especialidadId || null,
        departamentoId: departamentoId || null,
        hcModuloId: hcModuloId || null,
        requiereCaja: requiereCaja ?? false,
        manejaAnestesia: manejaAnestesia ?? false,
        permiteAgendamiento: permiteAgendamiento ?? true,
        controlaTiempoCita: controlaTiempoCita ?? false,
        abreHistoriaClinica: abreHistoriaClinica ?? true,
        permiteCargosAdicionales: permiteCargosAdicionales ?? false,
        esProgramaPYP: esProgramaPYP ?? false,
        manejaProtocolos: manejaProtocolos ?? false,
        clasificacion: clasificacion ?? 'CONSULTA',
        esPsicologia: esPsicologia ?? false,
        duracionMinutos: duracionMinutos ?? 30,
        bodegaId: bodegaId || null,
        usuarioCreacion: (req as any).user?.id,
      },
    });

    // Crear relaciones de servicios si se pasan
    if (servicios && Array.isArray(servicios)) {
      for (const svc of servicios) {
        await prisma.configServicioConsulta.create({
          data: {
            tipoConsultaId: tipoConsulta.id,
            servicioId: svc.servicioId,
            esPrincipal: svc.esPrincipal ?? false,
            generaAutomatico: svc.generaAutomatico ?? false,
            requiereOrden: svc.requiereOrden ?? false,
            centroOperacionId: svc.centroOperacionId || null,
            cuentaContable: svc.cuentaContable || null,
            hcModuloId: svc.hcModuloId || null,
            usuarioCreacion: (req as any).user?.id,
          },
        });
      }
    }

    const result = await prisma.tipoConsulta.findUnique({
      where: { id: tipoConsulta.id },
      include: {
        especialidad: true,
        departamento: true,
        hcModulo: true,
        serviciosConfig: { include: { servicio: true } },
      },
    });
    res.status(201).json(result);
  } catch {
    res.status(500).json({ error: 'Error al crear tipo de consulta' });
  }
}

export async function updateTipoConsulta(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { servicios, ...data } = req.body;
    delete data.id;

    // Normalizar FKs vacías
    if (data.especialidadId === '') data.especialidadId = null;
    if (data.departamentoId === '') data.departamentoId = null;
    if (data.hcModuloId === '') data.hcModuloId = null;

    await prisma.tipoConsulta.update({ where: { id }, data });

    if (servicios && Array.isArray(servicios)) {
      // Reemplazar configuración de servicios
      await prisma.configServicioConsulta.deleteMany({ where: { tipoConsultaId: id } });
      for (const svc of servicios) {
        await prisma.configServicioConsulta.create({
          data: {
            tipoConsultaId: id,
            servicioId: svc.servicioId,
            esPrincipal: svc.esPrincipal ?? false,
            generaAutomatico: svc.generaAutomatico ?? false,
            requiereOrden: svc.requiereOrden ?? false,
            centroOperacionId: svc.centroOperacionId || null,
            cuentaContable: svc.cuentaContable || null,
            hcModuloId: svc.hcModuloId || null,
            usuarioCreacion: (req as any).user?.id,
          },
        });
      }
    }

    const result = await prisma.tipoConsulta.findUnique({
      where: { id },
      include: {
        especialidad: true,
        departamento: true,
        hcModulo: true,
        serviciosConfig: { include: { servicio: true } },
      },
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Error al actualizar tipo de consulta' });
  }
}

export async function deleteTipoConsulta(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.tipoConsulta.update({ where: { id }, data: { estado: false } });
    res.json({ message: 'Tipo de consulta desactivado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar tipo de consulta' });
  }
}

// ─────────────────────────────────────────
// 6. CONFIGURACIÓN SERVICIOS POR CONSULTA
// ─────────────────────────────────────────

export async function getConfigServicios(req: Request, res: Response) {
  try {
    const { tipoConsultaId } = req.params;
    const items = await prisma.configServicioConsulta.findMany({
      where: { tipoConsultaId },
      include: { servicio: true },
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener configuración de servicios' });
  }
}

export async function addServicioAConsulta(req: Request, res: Response) {
  try {
    const { tipoConsultaId } = req.params;
    const { servicioId, esPrincipal, generaAutomatico, requiereOrden,
            centroOperacionId, cuentaContable, hcModuloId } = req.body;

    if (!servicioId) return res.status(400).json({ error: 'servicioId es requerido' });

    // Si se marca como principal, desmarcar los demás
    if (esPrincipal) {
      await prisma.configServicioConsulta.updateMany({
        where: { tipoConsultaId }, data: { esPrincipal: false },
      });
    }

    const item = await prisma.configServicioConsulta.upsert({
      where: { tipoConsultaId_servicioId: { tipoConsultaId, servicioId } },
      create: {
        tipoConsultaId, servicioId,
        esPrincipal: esPrincipal ?? false,
        generaAutomatico: generaAutomatico ?? false,
        requiereOrden: requiereOrden ?? false,
        centroOperacionId: centroOperacionId || null,
        cuentaContable: cuentaContable || null,
        hcModuloId: hcModuloId || null,
        usuarioCreacion: (req as any).user?.id,
      },
      update: {
        esPrincipal: esPrincipal ?? false,
        generaAutomatico: generaAutomatico ?? false,
        requiereOrden: requiereOrden ?? false,
        centroOperacionId: centroOperacionId || null,
        cuentaContable: cuentaContable || null,
        hcModuloId: hcModuloId || null,
      },
    });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Error al agregar servicio a consulta' });
  }
}

export async function removeServicioDeConsulta(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.configServicioConsulta.delete({ where: { id } });
    res.json({ message: 'Servicio removido' });
  } catch {
    res.status(500).json({ error: 'Error al remover servicio' });
  }
}

// ─────────────────────────────────────────
// 7. REGLAS OPERATIVAS (Departamento × Servicio)
// ─────────────────────────────────────────

export async function getReglasOperativas(req: Request, res: Response) {
  try {
    const { departamentoId } = req.params;
    const items = await prisma.reglaOperativa.findMany({
      where: { departamentoId },
      include: { servicio: { select: { id: true, codigoCups: true, nombre: true } } },
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener reglas operativas' });
  }
}

export async function upsertReglaOperativa(req: Request, res: Response) {
  try {
    const { departamentoId } = req.params;
    const { servicioId, permiteSeleccion, manejaInsumos, generaOrden,
            liquidaHonorarios, cumplimientoAutomatico, tomadoAutomatico,
            cumplimientoParcial, manejaCentroCosto } = req.body;

    if (!servicioId) return res.status(400).json({ error: 'servicioId es requerido' });

    const item = await prisma.reglaOperativa.upsert({
      where: { departamentoId_servicioId: { departamentoId, servicioId } },
      create: {
        departamentoId, servicioId,
        permiteSeleccion: permiteSeleccion ?? true,
        manejaInsumos: manejaInsumos ?? false,
        generaOrden: generaOrden ?? false,
        liquidaHonorarios: liquidaHonorarios ?? false,
        cumplimientoAutomatico: cumplimientoAutomatico ?? false,
        tomadoAutomatico: tomadoAutomatico ?? false,
        cumplimientoParcial: cumplimientoParcial ?? false,
        manejaCentroCosto: manejaCentroCosto ?? false,
      },
      update: {
        permiteSeleccion, manejaInsumos, generaOrden, liquidaHonorarios,
        cumplimientoAutomatico, tomadoAutomatico, cumplimientoParcial, manejaCentroCosto,
      },
    });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al guardar regla operativa' });
  }
}

// ─────────────────────────────────────────
// 8. PREPARACIONES / RECOMENDACIONES
// ─────────────────────────────────────────

export async function getPreparaciones(req: Request, res: Response) {
  try {
    const { tipoConsultaId, especialidadId } = req.query;
    const where: any = { estado: true };
    if (tipoConsultaId) where.tipoConsultaId = tipoConsultaId;
    if (especialidadId) where.especialidadId = especialidadId;
    const items = await prisma.preparacion.findMany({ where, orderBy: { nombre: 'asc' } });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener preparaciones' });
  }
}

export async function createPreparacion(req: Request, res: Response) {
  try {
    const { nombre, descripcion, tipo, especialidadId, tipoConsultaId } = req.body;
    if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });

    const item = await prisma.preparacion.create({
      data: {
        nombre, descripcion,
        tipo: tipo ?? 'consulta',
        especialidadId: especialidadId || null,
        tipoConsultaId: tipoConsultaId || null,
        usuarioCreacion: (req as any).user?.id,
      },
    });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Error al crear preparación' });
  }
}

export async function updatePreparacion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;
    delete data.id;
    const item = await prisma.preparacion.update({ where: { id }, data });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al actualizar preparación' });
  }
}

export async function deletePreparacion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.preparacion.update({ where: { id }, data: { estado: false } });
    res.json({ message: 'Preparación desactivada' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar preparación' });
  }
}

// ─────────────────────────────────────────
// 9. CARGOS DE CONSULTA EXTERNA
// ─────────────────────────────────────────

export async function getCargos(req: Request, res: Response) {
  try {
    const { tipo, search } = req.query as Record<string, string>;
    const where: any = {};
    if (tipo) where.tipo = tipo;
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { codigo: { contains: search, mode: 'insensitive' } },
      ];
    }
    const items = await prisma.cargo.findMany({ where, orderBy: { nombre: 'asc' } });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener cargos' });
  }
}

export async function createCargo(req: Request, res: Response) {
  try {
    const { codigo, nombre, descripcion, tipo, valor, unidad, codigoReferencia,
            aplicaIva, tasaIva, esObligatorio, aplicaPYP } = req.body;
    if (!codigo || !nombre) return res.status(400).json({ error: 'codigo y nombre son requeridos' });
    const existe = await prisma.cargo.findFirst({ where: { codigo } });
    if (existe) return res.status(400).json({ error: 'Ya existe un cargo con ese código' });
    const item = await prisma.cargo.create({
      data: {
        codigo, nombre, descripcion, tipo: tipo || 'CONSULTA',
        valor: Number(valor) || 0, unidad, codigoReferencia,
        aplicaIva: Boolean(aplicaIva), tasaIva: Number(tasaIva) || 0,
        esObligatorio: Boolean(esObligatorio), aplicaPYP: Boolean(aplicaPYP),
        usuarioCreacion: (req as any).user?.userId,
      },
    });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Error al crear cargo' });
  }
}

export async function updateCargo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { codigo, nombre, descripcion, tipo, valor, unidad, codigoReferencia,
            aplicaIva, tasaIva, esObligatorio, aplicaPYP, estado } = req.body;
    const item = await prisma.cargo.update({
      where: { id },
      data: {
        ...(codigo !== undefined && { codigo }),
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(tipo !== undefined && { tipo }),
        ...(valor !== undefined && { valor: Number(valor) }),
        ...(unidad !== undefined && { unidad }),
        ...(codigoReferencia !== undefined && { codigoReferencia }),
        ...(aplicaIva !== undefined && { aplicaIva: Boolean(aplicaIva) }),
        ...(tasaIva !== undefined && { tasaIva: Number(tasaIva) }),
        ...(esObligatorio !== undefined && { esObligatorio: Boolean(esObligatorio) }),
        ...(aplicaPYP !== undefined && { aplicaPYP: Boolean(aplicaPYP) }),
        ...(estado !== undefined && { estado: Boolean(estado) }),
      },
    });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al actualizar cargo' });
  }
}

export async function deleteCargo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.cargo.update({ where: { id }, data: { estado: false } });
    res.json({ message: 'Cargo desactivado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar cargo' });
  }
}

export async function bulkCreateCargos(req: Request, res: Response) {
  try {
    const { items } = req.body as { items: any[] };
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'Se requiere un arreglo de items' });

    const results = { created: 0, skipped: 0, errors: [] as string[] };
    for (const row of items) {
      if (!row.codigo || !row.nombre) { results.errors.push(`Fila sin codigo/nombre: ${JSON.stringify(row)}`); continue; }
      const exists = await prisma.cargo.findFirst({ where: { codigo: row.codigo } });
      if (exists) { results.skipped++; continue; }
      await prisma.cargo.create({ data: { codigo: row.codigo, nombre: row.nombre, descripcion: row.descripcion, tipo: row.tipo || 'CONSULTA', valor: Number(row.valor) || 0, unidad: row.unidad, codigoReferencia: row.codigoReferencia, usuarioCreacion: (req as any).user?.userId } });
      results.created++;
    }
    res.json(results);
  } catch {
    res.status(500).json({ error: 'Error en cargue masivo de cargos' });
  }
}

// ─── Bulk genérico por entidad ──────────────────────────────
export async function bulkCreateEspecialidades(req: Request, res: Response) {
  try {
    const { items } = req.body as { items: any[] };
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'Se requiere arreglo items' });
    const results = { created: 0, skipped: 0, errors: [] as string[] };
    for (const row of items) {
      if (!row.codigo || !row.nombre) { results.errors.push(`Sin codigo/nombre: ${JSON.stringify(row)}`); continue; }
      const exists = await prisma.especialidad.findFirst({ where: { OR: [{ codigo: row.codigo }, { nombre: row.nombre }] } });
      if (exists) { results.skipped++; continue; }
      await prisma.especialidad.create({ data: { codigo: row.codigo, nombre: row.nombre, descripcion: row.descripcion, usuarioCreacion: (req as any).user?.userId } });
      results.created++;
    }
    res.json(results);
  } catch {
    res.status(500).json({ error: 'Error en cargue masivo de especialidades' });
  }
}

export async function bulkCreateDepartamentos(req: Request, res: Response) {
  try {
    const { items } = req.body as { items: any[] };
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'Se requiere arreglo items' });
    const results = { created: 0, skipped: 0, errors: [] as string[] };
    for (const row of items) {
      if (!row.codigo || !row.nombre) { results.errors.push(`Sin codigo/nombre: ${JSON.stringify(row)}`); continue; }
      const exists = await prisma.departamento.findFirst({ where: { codigo: row.codigo } });
      if (exists) { results.skipped++; continue; }
      await prisma.departamento.create({ data: { codigo: row.codigo, nombre: row.nombre, descripcion: row.descripcion } });
      results.created++;
    }
    res.json(results);
  } catch {
    res.status(500).json({ error: 'Error en cargue masivo de departamentos' });
  }
}

export async function bulkCreateTiposConsulta(req: Request, res: Response) {
  try {
    const { items } = req.body as { items: any[] };
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'Se requiere arreglo items' });
    const results = { created: 0, skipped: 0, errors: [] as string[] };
    for (const row of items) {
      if (!row.nombre) { results.errors.push(`Sin nombre: ${JSON.stringify(row)}`); continue; }
      await prisma.tipoConsulta.create({ data: { nombre: row.nombre, descripcion: row.descripcion, clasificacion: row.clasificacion || 'CONSULTA', duracionMinutos: Number(row.duracionMinutos) || 30, usuarioCreacion: (req as any).user?.userId } });
      results.created++;
    }
    res.json(results);
  } catch {
    res.status(500).json({ error: 'Error en cargue masivo de tipos consulta' });
  }
}
