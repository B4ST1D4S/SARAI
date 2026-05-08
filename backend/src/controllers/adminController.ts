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
      select: {
        id: true, nombre: true, descripcion: true, clasificacion: true,
        duracionMinutos: true, estado: true,
        requiereCaja: true, manejaAnestesia: true, permiteAgendamiento: true,
        controlaTiempoCita: true, abreHistoriaClinica: true,
        permiteCargosAdicionales: true, esProgramaPYP: true,
        manejaProtocolos: true, esPsicologia: true,
        especialidadId: true, departamentoId: true, hcModuloId: true,
        bodegaId: true,
        especialidad: { select: { id: true, nombre: true, codigo: true } },
        departamento: { select: { id: true, nombre: true, codigo: true } },
        hcModulo:     { select: { id: true, nombre: true, codigo: true } },
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

    // Validación de unicidad: nombre + especialidad
    const existeNombre = await prisma.tipoConsulta.findFirst({
      where: {
        nombre: { equals: nombre.trim(), mode: 'insensitive' },
        estado: true,
        ...(especialidadId ? { especialidadId } : {}),
      },
    });
    if (existeNombre) {
      return res.status(409).json({
        error: `Ya existe un tipo de consulta con el nombre "${nombre.trim()}"${especialidadId ? ' para esa especialidad' : ''}. Verifique antes de guardar.`,
      });
    }

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
    // Desestructurar solo campos escalares — descartar relaciones anidadas
    const {
      nombre, descripcion, especialidadId, departamentoId, hcModuloId,
      requiereCaja, manejaAnestesia, permiteAgendamiento, controlaTiempoCita,
      abreHistoriaClinica, permiteCargosAdicionales, esProgramaPYP,
      manejaProtocolos, clasificacion, esPsicologia, duracionMinutos, bodegaId,
      estado, servicios,
    } = req.body;

    await prisma.tipoConsulta.update({
      where: { id },
      data: {
        nombre, descripcion,
        especialidadId: especialidadId || null,
        departamentoId: departamentoId || null,
        hcModuloId: hcModuloId || null,
        requiereCaja, manejaAnestesia, permiteAgendamiento, controlaTiempoCita,
        abreHistoriaClinica, permiteCargosAdicionales, esProgramaPYP,
        manejaProtocolos, clasificacion, esPsicologia,
        ...(duracionMinutos !== undefined && { duracionMinutos: Number(duracionMinutos) }),
        ...(bodegaId !== undefined && { bodegaId: bodegaId || null }),
        ...(estado !== undefined && { estado }),
      },
    });

    if (servicios && Array.isArray(servicios)) {
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
    const items = await prisma.preparacion.findMany({
      where,
      include: {
        especialidad: { select: { id: true, nombre: true } },
        tipoConsulta: { select: { id: true, nombre: true } },
      },
      orderBy: { nombre: 'asc' },
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener preparaciones' });
  }
}

export async function createPreparacion(req: Request, res: Response) {
  try {
    const { nombre, descripcion, tipo, especialidadId, tipoConsultaId } = req.body;
    if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });

    const existe = await prisma.preparacion.findFirst({
      where: {
        nombre: { equals: nombre.trim(), mode: 'insensitive' },
        estado: true,
        ...(tipo ? { tipo } : {}),
      },
    });
    if (existe) return res.status(409).json({ error: `Ya existe una preparación con el nombre "${nombre.trim()}". Verifique antes de guardar.` });

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

// ─────────────────────────────────────────
// 10. TIPOS DE CONSULTORIO
// ─────────────────────────────────────────

export async function getTiposConsultorio(req: Request, res: Response) {
  try {
    const items = await prisma.tipoConsultorio.findMany({
      where: { estado: true },
      orderBy: { codigo: 'asc' },
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener tipos de consultorio' });
  }
}

export async function createTipoConsultorio(req: Request, res: Response) {
  try {
    const { codigo, tipoConsultorio, descripcion, indiceAutomatico } = req.body;
    if (!codigo || !tipoConsultorio) return res.status(400).json({ error: 'codigo y tipoConsultorio son requeridos' });
    const existe = await prisma.tipoConsultorio.findUnique({ where: { codigo } });
    if (existe) return res.status(400).json({ error: 'Código ya existe' });
    const item = await prisma.tipoConsultorio.create({
      data: {
        codigo, tipoConsultorio, descripcion,
        indiceAutomatico: indiceAutomatico ? Number(indiceAutomatico) : null,
        usuarioCreacion: (req as any).user?.id,
      },
    });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Error al crear tipo de consultorio' });
  }
}

export async function updateTipoConsultorio(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { codigo, tipoConsultorio, descripcion, indiceAutomatico, estado } = req.body;
    const item = await prisma.tipoConsultorio.update({
      where: { id },
      data: {
        ...(codigo !== undefined && { codigo }),
        ...(tipoConsultorio !== undefined && { tipoConsultorio }),
        ...(descripcion !== undefined && { descripcion }),
        ...(indiceAutomatico !== undefined && { indiceAutomatico: indiceAutomatico !== '' ? Number(indiceAutomatico) : null }),
        ...(estado !== undefined && { estado: Boolean(estado) }),
      },
    });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al actualizar tipo de consultorio' });
  }
}

export async function deleteTipoConsultorio(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.tipoConsultorio.update({ where: { id }, data: { estado: false } });
    res.json({ message: 'Tipo de consultorio desactivado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar tipo de consultorio' });
  }
}

// ─────────────────────────────────────────
// 11. DEPARTAMENTO × CARGO
// ─────────────────────────────────────────

export async function getDepartamentoCargos(req: Request, res: Response) {
  try {
    const { departamentoId } = req.params;
    const items = await prisma.departamentoCargo.findMany({
      where: { departamentoId },
      include: {
        cargo: { select: { id: true, codigo: true, nombre: true, tipo: true, valor: true } },
      },
      orderBy: { cargo: { nombre: 'asc' } },
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener departamento-cargos' });
  }
}

export async function createDepartamentoCargo(req: Request, res: Response) {
  try {
    const { departamentoId } = req.params;
    const {
      cargoId, permiteSeleccion, manejaInsumos, cumplimientoAutomatico,
      tomadoAutomatico, interfaceExterno, generaOrden, liquidaHonorarios,
      cumplimientoParcial, manejaCentroCosto,
    } = req.body;
    if (!cargoId) return res.status(400).json({ error: 'cargoId es requerido' });
    const existe = await prisma.departamentoCargo.findFirst({ where: { departamentoId, cargoId } });
    if (existe) return res.status(400).json({ error: 'El cargo ya está asignado a este departamento' });
    const item = await prisma.departamentoCargo.create({
      data: {
        departamentoId, cargoId,
        permiteSeleccion: permiteSeleccion ?? true,
        manejaInsumos: manejaInsumos ?? false,
        cumplimientoAutomatico: cumplimientoAutomatico ?? false,
        tomadoAutomatico: tomadoAutomatico ?? false,
        interfaceExterno: interfaceExterno ?? false,
        generaOrden: generaOrden ?? false,
        liquidaHonorarios: liquidaHonorarios ?? false,
        cumplimientoParcial: cumplimientoParcial ?? false,
        manejaCentroCosto: manejaCentroCosto ?? false,
        usuarioCreacion: (req as any).user?.id,
      },
      include: { cargo: { select: { id: true, codigo: true, nombre: true, tipo: true } } },
    });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Error al crear departamento-cargo' });
  }
}

export async function updateDepartamentoCargo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      permiteSeleccion, manejaInsumos, cumplimientoAutomatico,
      tomadoAutomatico, interfaceExterno, generaOrden, liquidaHonorarios,
      cumplimientoParcial, manejaCentroCosto,
    } = req.body;
    const item = await prisma.departamentoCargo.update({
      where: { id },
      data: {
        permiteSeleccion, manejaInsumos, cumplimientoAutomatico,
        tomadoAutomatico, interfaceExterno, generaOrden, liquidaHonorarios,
        cumplimientoParcial, manejaCentroCosto,
      },
      include: { cargo: { select: { id: true, codigo: true, nombre: true, tipo: true } } },
    });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al actualizar departamento-cargo' });
  }
}

export async function deleteDepartamentoCargo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.departamentoCargo.delete({ where: { id } });
    res.json({ message: 'Asignación eliminada' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar departamento-cargo' });
  }
}

// ─────────────────────────────────────────
// 12. CAMPOS DEL FORMULARIO DE PACIENTE
// ─────────────────────────────────────────

const CAMPOS_BASE = [
  // Documentación
  { nombre:'tipoDocumento',            etiqueta:'Tipo de Documento',          seccion:'documentacion', tipoCampo:'select',   esObligatorio:true,  orden:1 },
  { nombre:'numeroDocumento',          etiqueta:'Número de Documento',         seccion:'documentacion', tipoCampo:'text',     esObligatorio:true,  orden:2 },
  // Datos Personales
  { nombre:'primerNombre',             etiqueta:'Primer Nombre',               seccion:'personal',      tipoCampo:'text',     esObligatorio:true,  orden:1 },
  { nombre:'segundoNombre',            etiqueta:'Segundo Nombre',              seccion:'personal',      tipoCampo:'text',     esObligatorio:false, orden:2 },
  { nombre:'apellidoPaterno',          etiqueta:'Apellido Paterno',            seccion:'personal',      tipoCampo:'text',     esObligatorio:true,  orden:3 },
  { nombre:'apellidoMaterno',          etiqueta:'Apellido Materno',            seccion:'personal',      tipoCampo:'text',     esObligatorio:true,  orden:4 },
  { nombre:'fechaNacimiento',          etiqueta:'Fecha de Nacimiento',         seccion:'personal',      tipoCampo:'date',     esObligatorio:true,  orden:5 },
  { nombre:'edadCalculada',            etiqueta:'Edad (Calculada)',            seccion:'personal',      tipoCampo:'number',   esObligatorio:false, orden:6 },
  { nombre:'lugarNacimiento',          etiqueta:'Lugar de Nacimiento',         seccion:'personal',      tipoCampo:'text',     esObligatorio:false, orden:7 },
  // Contacto
  { nombre:'domicilioActual',          etiqueta:'Domicilio Actual',            seccion:'contacto',      tipoCampo:'text',     esObligatorio:false, orden:1 },
  { nombre:'barrioSector',             etiqueta:'Barrio / Sector',             seccion:'contacto',      tipoCampo:'text',     esObligatorio:false, orden:2 },
  { nombre:'telefonoFijo',             etiqueta:'Teléfono Fijo',               seccion:'contacto',      tipoCampo:'text',     esObligatorio:false, orden:3 },
  { nombre:'numeroCelular',            etiqueta:'Número Celular',              seccion:'contacto',      tipoCampo:'tel',      esObligatorio:true,  orden:4 },
  { nombre:'ciudadResidencia',         etiqueta:'Ciudad de Residencia',        seccion:'contacto',      tipoCampo:'text',     esObligatorio:false, orden:5 },
  { nombre:'correoElectronico',        etiqueta:'Correo Electrónico',          seccion:'contacto',      tipoCampo:'email',    esObligatorio:true,  orden:6 },
  // Laboral
  { nombre:'profesionOcupacion',       etiqueta:'Profesión / Ocupación',       seccion:'laboral',       tipoCampo:'text',     esObligatorio:false, orden:1 },
  { nombre:'direccionTrabajo',         etiqueta:'Dirección Laboral',           seccion:'laboral',       tipoCampo:'text',     esObligatorio:false, orden:2 },
  { nombre:'telefonoLaboral',          etiqueta:'Teléfono Laboral',            seccion:'laboral',       tipoCampo:'tel',      esObligatorio:false, orden:3 },
  // Demográfico
  { nombre:'generoBiologico',          etiqueta:'Género Biológico',            seccion:'demografico',   tipoCampo:'select',   esObligatorio:true,  orden:1 },
  { nombre:'generoSentido',            etiqueta:'Género Sentido',              seccion:'demografico',   tipoCampo:'select',   esObligatorio:false, orden:2 },
  { nombre:'estadoCivil',              etiqueta:'Estado Civil',                seccion:'demografico',   tipoCampo:'select',   esObligatorio:true,  orden:3 },
  { nombre:'grupoEtnico',              etiqueta:'Grupo Étnico',                seccion:'demografico',   tipoCampo:'select',   esObligatorio:true,  orden:4 },
  { nombre:'creenciaReligiosa',        etiqueta:'Creencia Religiosa',          seccion:'demografico',   tipoCampo:'text',     esObligatorio:false, orden:5 },
  { nombre:'nivelEducacion',           etiqueta:'Nivel de Educación',          seccion:'demografico',   tipoCampo:'select',   esObligatorio:true,  orden:6 },
  { nombre:'orientacionSexual',        etiqueta:'Orientación Sexual',          seccion:'demografico',   tipoCampo:'select',   esObligatorio:false, orden:7 },
  { nombre:'discapacidadDiagnosticada',etiqueta:'Discapacidad Diagnosticada',  seccion:'demografico',   tipoCampo:'select',   esObligatorio:true,  orden:8 },
  // Consulta
  { nombre:'tipoConsulta',             etiqueta:'Tipo de Consulta',            seccion:'consulta',      tipoCampo:'select',   esObligatorio:true,  orden:1 },
  { nombre:'formaAsignacion',          etiqueta:'Forma de Asignación',         seccion:'consulta',      tipoCampo:'select',   esObligatorio:true,  orden:2 },
  // Salud
  { nombre:'entidadSalud',             etiqueta:'EPS / Entidad de Salud',      seccion:'salud',         tipoCampo:'text',     esObligatorio:false, orden:1 },
  // Notas
  { nombre:'notasPaciente',            etiqueta:'Notas del Paciente',          seccion:'notas',         tipoCampo:'textarea', esObligatorio:false, orden:1 },
  { nombre:'observacionesAdicionales', etiqueta:'Observaciones Adicionales',   seccion:'notas',         tipoCampo:'textarea', esObligatorio:false, orden:2 },
];

export async function getCamposPaciente(req: Request, res: Response) {
  try {
    // Auto-seed si la tabla está vacía
    const count = await prisma.campoPaciente.count();
    if (count === 0) {
      await prisma.campoPaciente.createMany({
        data: CAMPOS_BASE.map(c => ({ ...c, esPersonalizado: false, esVisible: true, estado: true })),
        skipDuplicates: true,
      });
    }
    const { seccion } = req.query as Record<string, string>;
    const where: any = { estado: true };
    if (seccion) where.seccion = seccion;
    const items = await prisma.campoPaciente.findMany({ where, orderBy: [{ seccion: 'asc' }, { orden: 'asc' }] });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener campos del paciente' });
  }
}

export async function createCampoPaciente(req: Request, res: Response) {
  try {
    const { nombre, etiqueta, seccion, tipoCampo, esObligatorio, opciones, placeholder, orden } = req.body;
    if (!nombre || !etiqueta || !seccion) return res.status(400).json({ error: 'nombre, etiqueta y seccion son requeridos' });
    const existe = await prisma.campoPaciente.findUnique({ where: { nombre } });
    if (existe) return res.status(400).json({ error: 'Ya existe un campo con ese nombre interno' });
    const item = await prisma.campoPaciente.create({
      data: {
        nombre, etiqueta, seccion,
        tipoCampo: tipoCampo || 'text',
        esObligatorio: Boolean(esObligatorio),
        esPersonalizado: true,
        esVisible: true,
        opciones: opciones || null,
        placeholder: placeholder || null,
        orden: Number(orden) || 99,
        usuarioCreacion: (req as any).user?.id,
      },
    });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Error al crear campo' });
  }
}

export async function updateCampoPaciente(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { etiqueta, seccion, tipoCampo, esVisible, esObligatorio, opciones, placeholder, orden, estado } = req.body;
    const item = await prisma.campoPaciente.update({
      where: { id },
      data: {
        ...(etiqueta     !== undefined && { etiqueta }),
        ...(seccion      !== undefined && { seccion }),
        ...(tipoCampo    !== undefined && { tipoCampo }),
        ...(esVisible    !== undefined && { esVisible: Boolean(esVisible) }),
        ...(esObligatorio!== undefined && { esObligatorio: Boolean(esObligatorio) }),
        ...(opciones     !== undefined && { opciones }),
        ...(placeholder  !== undefined && { placeholder }),
        ...(orden        !== undefined && { orden: Number(orden) }),
        ...(estado       !== undefined && { estado: Boolean(estado) }),
      },
    });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al actualizar campo' });
  }
}

export async function deleteCampoPaciente(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const campo = await prisma.campoPaciente.findUnique({ where: { id } });
    if (!campo) return res.status(404).json({ error: 'Campo no encontrado' });
    if (!campo.esPersonalizado) return res.status(400).json({ error: 'Solo se pueden eliminar campos personalizados' });
    await prisma.campoPaciente.update({ where: { id }, data: { estado: false } });
    res.json({ message: 'Campo eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar campo' });
  }
}

export async function resetCamposPaciente(req: Request, res: Response) {
  try {
    for (const c of CAMPOS_BASE) {
      await prisma.campoPaciente.updateMany({
        where: { nombre: c.nombre, esPersonalizado: false },
        data: { esVisible: true, esObligatorio: c.esObligatorio, estado: true },
      });
    }
    const items = await prisma.campoPaciente.findMany({ where: { estado: true }, orderBy: [{ seccion: 'asc' }, { orden: 'asc' }] });
    res.json({ message: 'Campos base restaurados a valores por defecto', items });
  } catch {
    res.status(500).json({ error: 'Error al restaurar campos' });
  }
}

// ─────────────────────────────────────────
// 13. PARÁMETROS DEL SISTEMA (key-value por grupo)
// ─────────────────────────────────────────

const PARAMS_CLINICA = [
  { clave:'nombre_clinica',      etiqueta:'Nombre de la Clínica',    valor:'EstetIA Clínica', tipo:'text',  orden:1  },
  { clave:'nit',                 etiqueta:'NIT / RUT',                valor:'',               tipo:'text',  orden:2  },
  { clave:'direccion',           etiqueta:'Dirección',                valor:'',               tipo:'text',  orden:3  },
  { clave:'ciudad',              etiqueta:'Ciudad',                   valor:'',               tipo:'text',  orden:4  },
  { clave:'telefono',            etiqueta:'Teléfono',                 valor:'',               tipo:'tel',   orden:5  },
  { clave:'email_contacto',      etiqueta:'Email de Contacto',        valor:'',               tipo:'email', orden:6  },
  { clave:'sitio_web',           etiqueta:'Sitio Web',                valor:'',               tipo:'url',   orden:7  },
  { clave:'representante_legal', etiqueta:'Representante Legal',      valor:'',               tipo:'text',  orden:8  },
  { clave:'regimen_tributario',  etiqueta:'Régimen Tributario',       valor:'',               tipo:'text',  orden:9  },
  { clave:'logo_url',            etiqueta:'URL del Logo',             valor:'',               tipo:'url',   orden:10 },
];

const PARAMS_AGENDA = [
  { clave:'duracion_default',      etiqueta:'Duración Default de Cita (min)', valor:'30',    tipo:'number',  orden:1 },
  { clave:'hora_inicio_atencion',  etiqueta:'Hora Inicio de Atención',        valor:'07:00', tipo:'time',    orden:2 },
  { clave:'hora_fin_atencion',     etiqueta:'Hora Fin de Atención',           valor:'18:00', tipo:'time',    orden:3 },
  { clave:'dias_min_anticipacion', etiqueta:'Días Mínimos de Anticipación',   valor:'0',     tipo:'number',  orden:4 },
  { clave:'dias_max_anticipacion', etiqueta:'Días Máximos de Anticipación',   valor:'90',    tipo:'number',  orden:5 },
  { clave:'intervalo_minutos',     etiqueta:'Intervalo de Agenda (min)',       valor:'30',    tipo:'number',  orden:6 },
  { clave:'max_citas_dia',         etiqueta:'Máx. Citas por Día',             valor:'20',    tipo:'number',  orden:7 },
  { clave:'recordatorio_horas',    etiqueta:'Recordatorio (horas antes)',      valor:'24',    tipo:'number',  orden:8 },
  { clave:'permite_solapamiento',  etiqueta:'Permite Citas Solapadas',         valor:'false', tipo:'boolean', orden:9 },
];

async function seedParamGroup(grupo: string, defaults: any[]) {
  for (const p of defaults) {
    await prisma.parametroSistema.upsert({
      where: { grupo_clave: { grupo, clave: p.clave } },
      update: {},
      create: { grupo, ...p },
    });
  }
}

export async function getParametrosSistema(req: Request, res: Response) {
  try {
    const { grupo } = req.params;
    const count = await prisma.parametroSistema.count({ where: { grupo } });
    if (count === 0) {
      if (grupo === 'clinica') await seedParamGroup('clinica', PARAMS_CLINICA);
      else if (grupo === 'agenda') await seedParamGroup('agenda', PARAMS_AGENDA);
    }
    const items = await prisma.parametroSistema.findMany({
      where: { grupo, estado: true },
      orderBy: { orden: 'asc' },
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener parámetros del sistema' });
  }
}

export async function updateParametroSistema(req: Request, res: Response) {
  try {
    const { grupo, clave } = req.params;
    const { valor } = req.body;
    const item = await prisma.parametroSistema.upsert({
      where: { grupo_clave: { grupo, clave } },
      update: { valor },
      create: { grupo, clave, valor, etiqueta: clave, tipo: 'text', orden: 99 },
    });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al actualizar parámetro' });
  }
}

// ─────────────────────────────────────────
// 14. LISTAS DE VALORES (selects del formulario)
// ─────────────────────────────────────────

const LISTAS_BASE = [
  { grupo:'tipoDocumento',     valor:'CC',           etiqueta:'Cédula de Ciudadanía',   orden:1 },
  { grupo:'tipoDocumento',     valor:'TI',           etiqueta:'Tarjeta de Identidad',   orden:2 },
  { grupo:'tipoDocumento',     valor:'CE',           etiqueta:'Cédula de Extranjería',  orden:3 },
  { grupo:'tipoDocumento',     valor:'PA',           etiqueta:'Pasaporte',              orden:4 },
  { grupo:'tipoDocumento',     valor:'RC',           etiqueta:'Registro Civil',         orden:5 },
  { grupo:'tipoDocumento',     valor:'PEP',          etiqueta:'PEP',                    orden:6 },
  { grupo:'generoBiologico',   valor:'M',            etiqueta:'Masculino',              orden:1 },
  { grupo:'generoBiologico',   valor:'F',            etiqueta:'Femenino',               orden:2 },
  { grupo:'generoBiologico',   valor:'O',            etiqueta:'Otro',                   orden:3 },
  { grupo:'generoSentido',     valor:'Masculino',    etiqueta:'Masculino',              orden:1 },
  { grupo:'generoSentido',     valor:'Femenino',     etiqueta:'Femenino',               orden:2 },
  { grupo:'generoSentido',     valor:'NoConforme',   etiqueta:'No Conforme',            orden:3 },
  { grupo:'generoSentido',     valor:'NoResponde',   etiqueta:'Prefiero No Responder',  orden:4 },
  { grupo:'estadoCivil',       valor:'Soltero',      etiqueta:'Soltero/a',              orden:1 },
  { grupo:'estadoCivil',       valor:'Casado',       etiqueta:'Casado/a',               orden:2 },
  { grupo:'estadoCivil',       valor:'Divorciado',   etiqueta:'Divorciado/a',           orden:3 },
  { grupo:'estadoCivil',       valor:'Viudo',        etiqueta:'Viudo/a',                orden:4 },
  { grupo:'estadoCivil',       valor:'Union',        etiqueta:'Unión Libre',            orden:5 },
  { grupo:'grupoEtnico',       valor:'Mestizo',      etiqueta:'Mestizo',                orden:1 },
  { grupo:'grupoEtnico',       valor:'Afrodescendiente',etiqueta:'Afrodescendiente',    orden:2 },
  { grupo:'grupoEtnico',       valor:'Indigena',     etiqueta:'Indígena',               orden:3 },
  { grupo:'grupoEtnico',       valor:'Blanco',       etiqueta:'Blanco',                 orden:4 },
  { grupo:'grupoEtnico',       valor:'Otros',        etiqueta:'Otros',                  orden:5 },
  { grupo:'nivelEducacion',    valor:'Primaria',     etiqueta:'Primaria',               orden:1 },
  { grupo:'nivelEducacion',    valor:'Secundaria',   etiqueta:'Secundaria',             orden:2 },
  { grupo:'nivelEducacion',    valor:'Tecnico',      etiqueta:'Técnico',                orden:3 },
  { grupo:'nivelEducacion',    valor:'Pregrado',     etiqueta:'Pregrado',               orden:4 },
  { grupo:'nivelEducacion',    valor:'Postgrado',    etiqueta:'Postgrado',              orden:5 },
  { grupo:'orientacionSexual', valor:'Heterosexual', etiqueta:'Heterosexual',           orden:1 },
  { grupo:'orientacionSexual', valor:'Homosexual',   etiqueta:'Homosexual',             orden:2 },
  { grupo:'orientacionSexual', valor:'Bisexual',     etiqueta:'Bisexual',               orden:3 },
  { grupo:'orientacionSexual', valor:'NoResponde',   etiqueta:'Prefiero No Responder',  orden:4 },
  { grupo:'discapacidad',      valor:'No',           etiqueta:'No',                     orden:1 },
  { grupo:'discapacidad',      valor:'Si',           etiqueta:'Sí',                     orden:2 },
  { grupo:'formaAsignacion',   valor:'Directa',      etiqueta:'Asignación Directa',     orden:1 },
  { grupo:'formaAsignacion',   valor:'Referencia',   etiqueta:'Por Referencia',         orden:2 },
  { grupo:'formaAsignacion',   valor:'Agenda',       etiqueta:'Por Agenda',             orden:3 },
];

export async function getListasValores(req: Request, res: Response) {
  try {
    const { grupo } = req.query as Record<string, string>;
    const count = await prisma.listaValor.count();
    if (count === 0) {
      await prisma.listaValor.createMany({ data: LISTAS_BASE, skipDuplicates: true });
    }
    const where: any = {};
    if (grupo) where.grupo = grupo;
    const items = await prisma.listaValor.findMany({ where, orderBy: [{ grupo: 'asc' }, { orden: 'asc' }] });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener listas de valores' });
  }
}

export async function createListaValor(req: Request, res: Response) {
  try {
    const { grupo, valor, etiqueta, orden } = req.body;
    if (!grupo || !valor || !etiqueta) return res.status(400).json({ error: 'grupo, valor y etiqueta son requeridos' });
    const existe = await prisma.listaValor.findUnique({ where: { grupo_valor: { grupo, valor } } });
    if (existe) return res.status(400).json({ error: 'Ya existe ese valor en el grupo' });
    const item = await prisma.listaValor.create({ data: { grupo, valor, etiqueta, orden: Number(orden) || 99 } });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Error al crear valor de lista' });
  }
}

export async function updateListaValor(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { etiqueta, orden, activo } = req.body;
    const item = await prisma.listaValor.update({
      where: { id },
      data: {
        ...(etiqueta !== undefined && { etiqueta }),
        ...(orden    !== undefined && { orden: Number(orden) }),
        ...(activo   !== undefined && { activo: Boolean(activo) }),
      },
    });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al actualizar valor de lista' });
  }
}

export async function deleteListaValor(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.listaValor.update({ where: { id }, data: { activo: false } });
    res.json({ message: 'Valor desactivado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar valor de lista' });
  }
}

// ─────────────────────────────────────────
// 15. MOTIVOS DE CITA / CANCELACIÓN
// ─────────────────────────────────────────

const MOTIVOS_BASE = [
  { nombre:'Consulta de primera vez',      tipo:'consulta',      orden:1 },
  { nombre:'Valoración estética general',  tipo:'consulta',      orden:2 },
  { nombre:'Control post-procedimiento',   tipo:'control',       orden:1 },
  { nombre:'Evaluación preoperatoria',     tipo:'preoperatorio', orden:1 },
  { nombre:'Seguimiento tratamiento',      tipo:'seguimiento',   orden:1 },
  { nombre:'Paciente no se presentó',      tipo:'cancelacion',   orden:1 },
  { nombre:'Cancelado por paciente',       tipo:'cancelacion',   orden:2 },
  { nombre:'Médico no disponible',         tipo:'cancelacion',   orden:3 },
  { nombre:'Reprogramado por paciente',    tipo:'cancelacion',   orden:4 },
  { nombre:'Emergencia médica',            tipo:'cancelacion',   orden:5 },
];

export async function getMotivosCita(req: Request, res: Response) {
  try {
    const { tipo } = req.query as Record<string, string>;
    const count = await prisma.motivoCita.count();
    if (count === 0) {
      await prisma.motivoCita.createMany({ data: MOTIVOS_BASE, skipDuplicates: true });
    }
    const where: any = { activo: true };
    if (tipo) where.tipo = tipo;
    const items = await prisma.motivoCita.findMany({ where, orderBy: [{ tipo: 'asc' }, { orden: 'asc' }] });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener motivos de cita' });
  }
}

export async function createMotivoCita(req: Request, res: Response) {
  try {
    const { nombre, descripcion, tipo, orden } = req.body;
    if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });

    const existe = await prisma.motivoCita.findFirst({
      where: { nombre: { equals: nombre.trim(), mode: 'insensitive' }, activo: true },
    });
    if (existe) return res.status(409).json({ error: `Ya existe un motivo de cita con el nombre "${nombre.trim()}". Verifique antes de guardar.` });

    const item = await prisma.motivoCita.create({
      data: { nombre, descripcion, tipo: tipo || 'consulta', orden: Number(orden) || 99 },
    });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Error al crear motivo' });
  }
}

export async function updateMotivoCita(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, tipo, orden, activo } = req.body;
    const item = await prisma.motivoCita.update({
      where: { id },
      data: {
        ...(nombre      !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(tipo        !== undefined && { tipo }),
        ...(orden       !== undefined && { orden: Number(orden) }),
        ...(activo      !== undefined && { activo: Boolean(activo) }),
      },
    });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al actualizar motivo' });
  }
}

export async function deleteMotivoCita(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.motivoCita.update({ where: { id }, data: { activo: false } });
    res.json({ message: 'Motivo desactivado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar motivo' });
  }
}
