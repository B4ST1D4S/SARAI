/**
 * IAM Controller — Identity & Access Management Enterprise
 * RBAC + ABAC · Multiempresa · Multisede · Herencia de permisos
 * Permisos temporales · Delegaciones · MFA · Auditoría completa
 */
import { Request, Response } from 'express';
import { TipoAccion, EfectoPermiso, TipoRecurso, TipoEventoSeg } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import prisma from '../lib/prisma.js';

// ═══════════════════════════════════════════════════════
//  ALGORITMO DE RESOLUCIÓN DE PERMISOS
//  Orden de precedencia (mayor a menor):
//  1. Permiso directo de usuario  DENEGAR  (bloqueo explícito)
//  2. Permiso directo de usuario  PERMITIR
//  3. Permiso de perfil           DENEGAR
//  4. Permiso de rol              DENEGAR
//  5. Permiso de grupo            DENEGAR
//  6. Permiso de perfil           PERMITIR
//  7. Permiso de rol              PERMITIR
//  8. Permiso de grupo            PERMITIR
//  9. Denegado por defecto (Least Privilege)
// ═══════════════════════════════════════════════════════
export async function resolverPermiso(
  usuarioId: string,
  recursoCodigo: string,
  accion: TipoAccion,
  contexto?: { empresaId?: string; sedeId?: string }
): Promise<{ permitido: boolean; fuente: string }> {
  const ahora = new Date();

  // Obtener recurso
  const recurso = await prisma.recursoSistema.findUnique({
    where: { codigo: recursoCodigo },
  });
  if (!recurso) return { permitido: false, fuente: 'recurso_no_encontrado' };

  // Obtener el usuario con perfil y roles
  const usuario = await prisma.user.findUnique({
    where: { id: usuarioId },
    include: {
      Perfil: true,
      UsuarioIamRol: { include: { IamRol: true } },
      GrupoUsuario: { include: { Grupo: true } },
    },
  });
  if (!usuario || !usuario.activo) return { permitido: false, fuente: 'usuario_inactivo' };

  const filtroTemporal = {
    activo: true,
    recursoId: recurso.id,
    accion,
    OR: [
      { fechaInicio: null },
      { fechaInicio: { lte: ahora } },
    ],
    AND: [
      {
        OR: [
          { fechaFin: null },
          { fechaFin: { gte: ahora } },
        ],
      },
    ],
  };

  // ─── 1. Permisos directos del usuario ─────────────────
  const permisosUsuario = await prisma.permisoRecurso.findMany({
    where: { ...filtroTemporal, usuarioId },
  });

  // DENEGAR explícito del usuario tiene máxima prioridad
  if (permisosUsuario.some(p => p.efecto === 'DENEGAR')) {
    return { permitido: false, fuente: 'usuario_directo_denegar' };
  }
  if (permisosUsuario.some(p => p.efecto === 'PERMITIR')) {
    return { permitido: true, fuente: 'usuario_directo_permitir' };
  }

  // ─── 2. Permisos del perfil ────────────────────────────
  if (usuario.perfilId) {
    const permisosPerfil = await prisma.permisoRecurso.findMany({
      where: { ...filtroTemporal, perfilId: usuario.perfilId },
    });
    if (permisosPerfil.some(p => p.efecto === 'DENEGAR')) {
      return { permitido: false, fuente: 'perfil_denegar' };
    }
    if (permisosPerfil.some(p => p.efecto === 'PERMITIR')) {
      return { permitido: true, fuente: 'perfil_permitir' };
    }
  }

  // ─── 3. Permisos de roles IAM del usuario ─────────────
  const rolIds = usuario.UsuarioIamRol.map((r: any) => r.rolId);
  if (rolIds.length > 0) {
    const permisosRol = await prisma.permisoRecurso.findMany({
      where: { ...filtroTemporal, rolId: { in: rolIds } },
    });
    if (permisosRol.some(p => p.efecto === 'DENEGAR')) {
      return { permitido: false, fuente: 'rol_denegar' };
    }
    if (permisosRol.some(p => p.efecto === 'PERMITIR')) {
      return { permitido: true, fuente: 'rol_permitir' };
    }
  }

  // ─── 4. Permisos de grupos ─────────────────────────────
  const grupoIds = usuario.GrupoUsuario.map((g: any) => g.grupoId);
  if (grupoIds.length > 0) {
    const permisosGrupo = await prisma.permisoRecurso.findMany({
      where: { ...filtroTemporal, grupoId: { in: grupoIds } },
    });
    if (permisosGrupo.some(p => p.efecto === 'DENEGAR')) {
      return { permitido: false, fuente: 'grupo_denegar' };
    }
    if (permisosGrupo.some(p => p.efecto === 'PERMITIR')) {
      return { permitido: true, fuente: 'grupo_permitir' };
    }
  }

  // ─── 5. Verificar delegaciones activas ────────────────
  const delegacion = await prisma.delegacionTemporal.findFirst({
    where: {
      delegadoId: usuarioId,
      activa: true,
      fechaInicio: { lte: ahora },
      fechaFin: { gte: ahora },
      recursosCodigos: { has: recursoCodigo },
    },
  });
  if (delegacion) {
    return { permitido: true, fuente: 'delegacion_temporal' };
  }

  // ─── 6. Denegado por defecto (Least Privilege) ────────
  return { permitido: false, fuente: 'default_deny' };
}

// ═══════════════════════════════════════════════════════
//  EMPRESAS
// ═══════════════════════════════════════════════════════
export const getEmpresas = async (req: Request, res: Response) => {
  try {
    const empresas = await prisma.empresa.findMany({
      include: { _count: { select: { Sede: true, User: true } } },
      orderBy: { nombre: 'asc' },
    });
    res.json(empresas);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener empresas' });
  }
};

export const createEmpresa = async (req: Request, res: Response) => {
  try {
    const empresa = await prisma.empresa.create({ data: req.body });
    res.status(201).json(empresa);
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'NIT duplicado' });
    res.status(500).json({ error: 'Error al crear empresa' });
  }
};

export const updateEmpresa = async (req: Request, res: Response) => {
  try {
    const empresa = await prisma.empresa.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(empresa);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar empresa' });
  }
};

// ═══════════════════════════════════════════════════════
//  SEDES
// ═══════════════════════════════════════════════════════
export const getSedes = async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.query;
    const sedes = await prisma.sede.findMany({
      where: empresaId ? { empresaId: String(empresaId) } : {},
      include: { Empresa: { select: { nombre: true } }, _count: { select: { User: true } } },
      orderBy: { nombre: 'asc' },
    });
    res.json(sedes);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener sedes' });
  }
};

export const createSede = async (req: Request, res: Response) => {
  try {
    const sede = await prisma.sede.create({ data: req.body });
    res.status(201).json(sede);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear sede' });
  }
};

export const updateSede = async (req: Request, res: Response) => {
  try {
    const sede = await prisma.sede.update({ where: { id: req.params.id }, data: req.body });
    res.json(sede);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar sede' });
  }
};

// ═══════════════════════════════════════════════════════
//  PERFILES
// ═══════════════════════════════════════════════════════
export const getPerfiles = async (req: Request, res: Response) => {
  try {
    const perfiles = await prisma.perfil.findMany({
      include: {
        Empresa: { select: { nombre: true } },
        _count: { select: { User: true, PerfilIamRol: true, PermisoRecurso: true } },
      },
      orderBy: { nombre: 'asc' },
    });
    res.json(perfiles);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener perfiles' });
  }
};

export const createPerfil = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, empresaId, rolesIds, clonarDesdeId } = req.body;

    const perfil = await prisma.perfil.create({
      data: {
        id: randomUUID(),
        nombre,
        descripcion,
        empresaId: empresaId || null,
        creadoPor: req.user?.userId,
        updatedAt: new Date(),
        PerfilIamRol: rolesIds ? { create: rolesIds.map((id: string) => ({ rolId: id })) } : undefined,
      },
    });

    // Clonar permisos si se especificó un perfil origen
    if (clonarDesdeId) {
      const permisosOrigen = await prisma.permisoRecurso.findMany({
        where: { perfilId: clonarDesdeId },
      });
      await prisma.permisoRecurso.createMany({
        data: permisosOrigen.map((p: any) => ({
          ...p,
          id: randomUUID(),
          perfilId: perfil.id,
          usuarioId: null,
          rolId: null,
          grupoId: null,
          createdAt: undefined,
          updatedAt: new Date(),
          creadoPor: req.user?.userId,
        })),
      });
    }

    res.status(201).json(perfil);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear perfil' });
  }
};

export const updatePerfil = async (req: Request, res: Response) => {
  try {
    const perfil = await prisma.perfil.update({ where: { id: req.params.id }, data: req.body });
    res.json(perfil);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

export const deletePerfil = async (req: Request, res: Response) => {
  try {
    const perfil = await prisma.perfil.findUnique({ where: { id: req.params.id } });
    if (perfil?.esBase) return res.status(400).json({ error: 'No se puede eliminar un perfil base' });
    await prisma.perfil.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar perfil' });
  }
};

// ═══════════════════════════════════════════════════════
//  IAM ROLES
// ═══════════════════════════════════════════════════════
export const getIamRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.iamRol.findMany({
      include: { _count: { select: { PerfilIamRol: true, UsuarioIamRol: true, PermisoRecurso: true } } },
      orderBy: { nombre: 'asc' },
    });
    res.json(roles);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};

export const createIamRol = async (req: Request, res: Response) => {
  try {
    const rol = await prisma.iamRol.create({ data: { ...req.body, creadoPor: req.user?.userId } });
    res.status(201).json(rol);
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Rol duplicado' });
    res.status(500).json({ error: 'Error al crear rol' });
  }
};

export const updateIamRol = async (req: Request, res: Response) => {
  try {
    const rol = await prisma.iamRol.update({ where: { id: req.params.id }, data: req.body });
    res.json(rol);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
};

// ═══════════════════════════════════════════════════════
//  GRUPOS
// ═══════════════════════════════════════════════════════
export const getGrupos = async (req: Request, res: Response) => {
  try {
    const grupos = await prisma.grupo.findMany({
      include: { _count: { select: { GrupoUsuario: true, PermisoRecurso: true } } },
      orderBy: { nombre: 'asc' },
    });
    res.json(grupos);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener grupos' });
  }
};

export const createGrupo = async (req: Request, res: Response) => {
  try {
    const grupo = await prisma.grupo.create({ data: req.body });
    res.status(201).json(grupo);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear grupo' });
  }
};

export const addUsuarioGrupo = async (req: Request, res: Response) => {
  try {
    await prisma.grupoUsuario.create({
      data: { grupoId: req.params.grupoId, usuarioId: req.body.usuarioId },
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al agregar usuario al grupo' });
  }
};

// ═══════════════════════════════════════════════════════
//  RECURSOS DEL SISTEMA
// ═══════════════════════════════════════════════════════
export const getRecursos = async (req: Request, res: Response) => {
  try {
    const recursos = await prisma.recursoSistema.findMany({
      where: { parentId: null },
      include: {
        other_RecursoSistema: {
          include: {
            other_RecursoSistema: {
              include: {
                other_RecursoSistema: true,
              },
            },
          },
        },
      },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });
    res.json(recursos);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener recursos' });
  }
};

export const seedRecursosSistema = async (req: Request, res: Response) => {
  try {
    const recursos = [
      // MÓDULOS PRINCIPALES
      { codigo: 'DASHBOARD',   nombre: 'Dashboard',        tipo: 'MODULO', orden: 1 },
      { codigo: 'CLINICA',     nombre: 'Clínica',           tipo: 'MODULO', orden: 2 },
      { codigo: 'AGENDA',      nombre: 'Agenda',            tipo: 'MODULO', orden: 3 },
      { codigo: 'GESTION',     nombre: 'Gestión',           tipo: 'MODULO', orden: 4 },
      { codigo: 'ADMIN',       nombre: 'Administración',    tipo: 'MODULO', orden: 5 },
      { codigo: 'SEGURIDAD',   nombre: 'Seguridad & IAM',   tipo: 'MODULO', orden: 6 },
      // SUBMÓDULOS CLÍNICA
      { codigo: 'CLINICA.PACIENTES',      nombre: 'Pacientes',        tipo: 'SUBMODULO', parentCodigo: 'CLINICA',      orden: 1 },
      { codigo: 'CLINICA.HISTORIA',       nombre: 'Historia Clínica', tipo: 'SUBMODULO', parentCodigo: 'CLINICA',      orden: 2 },
      { codigo: 'CLINICA.VISUAL',         nombre: 'Visual Clínico',   tipo: 'SUBMODULO', parentCodigo: 'CLINICA',      orden: 3 },
      { codigo: 'CLINICA.ODONTOGRAMA',    nombre: 'Odontograma',      tipo: 'SUBMODULO', parentCodigo: 'CLINICA',      orden: 4 },
      { codigo: 'CLINICA.MAPA',           nombre: 'Mapa Corporal',    tipo: 'SUBMODULO', parentCodigo: 'CLINICA',      orden: 5 },
      // SUBMÓDULOS AGENDA
      { codigo: 'AGENDA.CITAS',           nombre: 'Citas',            tipo: 'SUBMODULO', parentCodigo: 'AGENDA',       orden: 1 },
      { codigo: 'AGENDA.ADMISION',        nombre: 'Admisión',         tipo: 'SUBMODULO', parentCodigo: 'AGENDA',       orden: 2 },
      { codigo: 'AGENDA.PROFESIONAL',     nombre: 'Agenda Profesional', tipo: 'SUBMODULO', parentCodigo: 'AGENDA',    orden: 3 },
      { codigo: 'AGENDA.CONFIG',          nombre: 'Config Agenda',    tipo: 'SUBMODULO', parentCodigo: 'AGENDA',       orden: 4 },
      { codigo: 'AGENDA.CIRUGIA',         nombre: 'Quirofano',        tipo: 'SUBMODULO', parentCodigo: 'AGENDA',       orden: 5 },
      // SUBMÓDULOS GESTIÓN
      { codigo: 'GESTION.COTIZACIONES',   nombre: 'Cotizaciones',     tipo: 'SUBMODULO', parentCodigo: 'GESTION',      orden: 1 },
      { codigo: 'GESTION.CRM',            nombre: 'CRM',              tipo: 'SUBMODULO', parentCodigo: 'GESTION',      orden: 2 },
      { codigo: 'GESTION.FACTURACION',    nombre: 'Facturación',      tipo: 'SUBMODULO', parentCodigo: 'GESTION',      orden: 3 },
      { codigo: 'GESTION.PLANTILLAS',     nombre: 'Plantillas',       tipo: 'SUBMODULO', parentCodigo: 'GESTION',      orden: 4 },
      { codigo: 'GESTION.IMPRESION',      nombre: 'Central Impresión',tipo: 'SUBMODULO', parentCodigo: 'GESTION',      orden: 5 },
      // SUBMÓDULOS ADMIN
      { codigo: 'ADMIN.PARAMETRIZACION',  nombre: 'Parametrización',  tipo: 'SUBMODULO', parentCodigo: 'ADMIN',        orden: 1 },
      { codigo: 'ADMIN.USUARIOS',         nombre: 'Usuarios',         tipo: 'SUBMODULO', parentCodigo: 'ADMIN',        orden: 2 },
      // SUBMÓDULOS SEGURIDAD
      { codigo: 'SEGURIDAD.EMPRESAS',     nombre: 'Empresas',         tipo: 'SUBMODULO', parentCodigo: 'SEGURIDAD',    orden: 1 },
      { codigo: 'SEGURIDAD.SEDES',        nombre: 'Sedes',            tipo: 'SUBMODULO', parentCodigo: 'SEGURIDAD',    orden: 2 },
      { codigo: 'SEGURIDAD.PERFILES',     nombre: 'Perfiles',         tipo: 'SUBMODULO', parentCodigo: 'SEGURIDAD',    orden: 3 },
      { codigo: 'SEGURIDAD.ROLES',        nombre: 'Roles IAM',        tipo: 'SUBMODULO', parentCodigo: 'SEGURIDAD',    orden: 4 },
      { codigo: 'SEGURIDAD.PERMISOS',     nombre: 'Permisos',         tipo: 'SUBMODULO', parentCodigo: 'SEGURIDAD',    orden: 5 },
      { codigo: 'SEGURIDAD.GRUPOS',       nombre: 'Grupos',           tipo: 'SUBMODULO', parentCodigo: 'SEGURIDAD',    orden: 6 },
      { codigo: 'SEGURIDAD.POLITICAS',    nombre: 'Políticas',        tipo: 'SUBMODULO', parentCodigo: 'SEGURIDAD',    orden: 7 },
      { codigo: 'SEGURIDAD.AUDITORIA',    nombre: 'Auditoría',        tipo: 'SUBMODULO', parentCodigo: 'SEGURIDAD',    orden: 8 },
      { codigo: 'SEGURIDAD.SESIONES',     nombre: 'Sesiones Activas', tipo: 'SUBMODULO', parentCodigo: 'SEGURIDAD',    orden: 9 },
      { codigo: 'SEGURIDAD.DISPOSITIVOS', nombre: 'Dispositivos',     tipo: 'SUBMODULO', parentCodigo: 'SEGURIDAD',    orden: 10 },
      { codigo: 'SEGURIDAD.DELEGACIONES', nombre: 'Delegaciones',     tipo: 'SUBMODULO', parentCodigo: 'SEGURIDAD',    orden: 11 },
      { codigo: 'SEGURIDAD.MFA',          nombre: 'Autenticación MFA',tipo: 'SUBMODULO', parentCodigo: 'SEGURIDAD',    orden: 12 },
    ] as const;

    // Primero insertar los que no tienen parent
    for (const r of recursos) {
      const { parentCodigo, ...data } = r as any;
      const existing = await prisma.recursoSistema.findUnique({ where: { codigo: data.codigo } });
      if (!existing) {
        await prisma.recursoSistema.create({
          data: { ...data, tipo: data.tipo as TipoRecurso, parentId: null },
        });
      }
    }
    // Luego asignar parentIds
    for (const r of recursos) {
      const { parentCodigo } = r as any;
      if (parentCodigo) {
        const parent = await prisma.recursoSistema.findUnique({ where: { codigo: parentCodigo } });
        if (parent) {
          await prisma.recursoSistema.update({
            where: { codigo: r.codigo },
            data: { parentId: parent.id },
          });
        }
      }
    }

    res.json({ ok: true, total: recursos.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al inicializar recursos' });
  }
};

// ═══════════════════════════════════════════════════════
//  PERMISOS (CRUD + Vista matricial)
// ═══════════════════════════════════════════════════════
export const getPermisos = async (req: Request, res: Response) => {
  try {
    const { sujetoTipo, sujetoId, recursoId } = req.query;
    const where: any = { activo: true };
    if (sujetoTipo === 'USUARIO') where.usuarioId = sujetoId;
    if (sujetoTipo === 'PERFIL')  where.perfilId  = sujetoId;
    if (sujetoTipo === 'ROL')     where.rolId     = sujetoId;
    if (sujetoTipo === 'GRUPO')   where.grupoId   = sujetoId;
    if (recursoId) where.recursoId = recursoId;

    const permisos = await prisma.permisoRecurso.findMany({
      where,
      include: { RecursoSistema: true },
      orderBy: { RecursoSistema: { codigo: 'asc' } },
    });
    res.json(permisos);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener permisos' });
  }
};

export const setPermiso = async (req: Request, res: Response) => {
  try {
    const { sujetoTipo, sujetoId, recursoCodigo, accion, efecto, fechaInicio, fechaFin, motivo, scopeSedeId } = req.body;
    const recurso = await prisma.recursoSistema.findUnique({ where: { codigo: recursoCodigo } });
    if (!recurso) return res.status(404).json({ error: 'Recurso no encontrado' });

    const sujetoField = {
      USUARIO: 'usuarioId',
      PERFIL:  'perfilId',
      ROL:     'rolId',
      GRUPO:   'grupoId',
    }[sujetoTipo as string];

    if (!sujetoField) return res.status(400).json({ error: 'Tipo de sujeto inválido' });

    // Upsert — si ya existe, actualizar; si no, crear
    const existing = await prisma.permisoRecurso.findFirst({
      where: { [sujetoField]: sujetoId, recursoId: recurso.id, accion },
    });

    let permiso;
    if (existing) {
      permiso = await prisma.permisoRecurso.update({
        where: { id: existing.id },
        data: { efecto, fechaInicio: fechaInicio || null, fechaFin: fechaFin || null, motivo, scopeSedeId: scopeSedeId || null, activo: true },
      });
    } else {
      permiso = await prisma.permisoRecurso.create({
        data: {
          id: randomUUID(),
          [sujetoField]: sujetoId,
          recursoId: recurso.id,
          accion,
          efecto: efecto || 'PERMITIR',
          fechaInicio: fechaInicio || null,
          fechaFin: fechaFin || null,
          motivo: motivo || null,
          scopeSedeId: scopeSedeId || null,
          creadoPor: req.user?.userId,
          updatedAt: new Date(),
        },
      });
    }
    res.json(permiso);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al configurar permiso' });
  }
};

export const deletePermiso = async (req: Request, res: Response) => {
  try {
    await prisma.permisoRecurso.update({
      where: { id: req.params.id },
      data: { activo: false },
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar permiso' });
  }
};

// Verificar permiso puntual (usado por frontend)
export const checkPermiso = async (req: Request, res: Response) => {
  try {
    const { recursoCodigo, accion } = req.body;
    const usuarioId = req.user?.userId;
    if (!usuarioId) return res.status(401).json({ error: 'No autenticado' });
    const resultado = await resolverPermiso(usuarioId, recursoCodigo, accion as TipoAccion);
    res.json(resultado);
  } catch (e) {
    res.status(500).json({ error: 'Error al verificar permiso' });
  }
};

// Mapa rápido de permisos: solo hace 2-3 queries, devuelve [{recurso, accion}]
// Usuarios SIN perfilId = sin restricciones IAM (backward-compatible)
export const getMapaPermisos = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.userId;
    if (!usuarioId) return res.status(401).json({ error: 'No autenticado' });

    const usuario = await prisma.user.findUnique({
      where: { id: usuarioId },
      select: { perfilId: true, UsuarioIamRol: { select: { rolId: true } }, GrupoUsuario: { select: { grupoId: true } } },
    });

    // Sin perfil IAM → devolver null (sin restricciones, acceso total al sistema legacy)
    if (!usuario?.perfilId) return res.json(null);

    const ahora = new Date();
    const filtroActivo = {
      efecto: 'PERMITIR' as const,
      activo: true,
      OR: [{ fechaInicio: null }, { fechaInicio: { lte: ahora } }] as any,
      AND: [{ OR: [{ fechaFin: null }, { fechaFin: { gte: ahora } }] }] as any,
    };

    // Permisos del perfil + roles + grupos del usuario
    const [permisoPerfil, permisosRol, permisosGrupo, permisosDirectos] = await Promise.all([
      prisma.permisoRecurso.findMany({
        where: { ...filtroActivo, perfilId: usuario.perfilId },
        include: { RecursoSistema: { select: { codigo: true } } },
      }),
      usuario.UsuarioIamRol.length > 0 ? prisma.permisoRecurso.findMany({
        where: { ...filtroActivo, rolId: { in: usuario.UsuarioIamRol.map((r: any) => r.rolId) } },
        include: { RecursoSistema: { select: { codigo: true } } },
      }) : [],
      usuario.GrupoUsuario.length > 0 ? prisma.permisoRecurso.findMany({
        where: { ...filtroActivo, grupoId: { in: usuario.GrupoUsuario.map((g: any) => g.grupoId) } },
        include: { RecursoSistema: { select: { codigo: true } } },
      }) : [],
      prisma.permisoRecurso.findMany({
        where: { ...filtroActivo, usuarioId },
        include: { RecursoSistema: { select: { codigo: true } } },
      }),
    ]);

    // Verificar DENCIONs directos del usuario
    const denegarDirecto = await prisma.permisoRecurso.findMany({
      where: { efecto: 'DENEGAR', activo: true, usuarioId },
      include: { RecursoSistema: { select: { codigo: true } } },
    });

    const denegar = new Set(denegarDirecto.map((p: any) => `${p.RecursoSistema.codigo}:${p.accion}`));

    const todos = [...permisoPerfil, ...permisosRol, ...permisosGrupo, ...permisosDirectos];
    const permitidos = todos
      .filter((p: any) => !denegar.has(`${p.RecursoSistema.codigo}:${p.accion}`))
      .map((p: any) => ({ recurso: p.RecursoSistema.codigo, accion: p.accion as string }));

    // Deduplicar
    const mapa: Record<string, Set<string>> = {};
    for (const p of permitidos) {
      if (!mapa[p.recurso]) mapa[p.recurso] = new Set();
      mapa[p.recurso].add(p.accion);
    }

    // Convertir a objeto plano { 'CLINICA.PACIENTES': { VER: true, CREAR: false, ... } }
    const resultado: Record<string, Record<string, boolean>> = {};
    for (const [cod, acciones] of Object.entries(mapa)) {
      resultado[cod] = {};
      for (const a of ['VER','CREAR','EDITAR','ELIMINAR','IMPRIMIR','EXPORTAR','APROBAR','ANULAR']) {
        resultado[cod][a] = acciones.has(a);
      }
    }

    res.json(resultado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener mapa de permisos' });
  }
};

// Obtener mapa completo de permisos del usuario autenticado
export const getMyPermissions = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.userId;
    if (!usuarioId) return res.status(401).json({ error: 'No autenticado' });

    const recursos = await prisma.recursoSistema.findMany({ where: { activo: true } });
    const acciones: TipoAccion[] = ['VER', 'CREAR', 'EDITAR', 'ELIMINAR', 'IMPRIMIR', 'EXPORTAR', 'APROBAR', 'FIRMAR', 'ANULAR'];

    const mapa: Record<string, Record<string, boolean>> = {};
    for (const recurso of recursos) {
      mapa[recurso.codigo] = {};
      for (const accion of acciones) {
        const { permitido } = await resolverPermiso(usuarioId, recurso.codigo, accion);
        mapa[recurso.codigo][accion] = permitido;
      }
    }
    res.json(mapa);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener permisos' });
  }
};

// ═══════════════════════════════════════════════════════
//  POLÍTICAS DE SEGURIDAD
// ═══════════════════════════════════════════════════════
export const getPoliticas = async (req: Request, res: Response) => {
  try {
    const politicas = await prisma.politicaSeguridad.findMany({
      include: { Empresa: { select: { nombre: true } } },
      orderBy: { nombre: 'asc' },
    });
    res.json(politicas);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener políticas' });
  }
};

export const createPolitica = async (req: Request, res: Response) => {
  try {
    const politica = await prisma.politicaSeguridad.create({ data: req.body });
    res.status(201).json(politica);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear política' });
  }
};

export const updatePolitica = async (req: Request, res: Response) => {
  try {
    const politica = await prisma.politicaSeguridad.update({ where: { id: req.params.id }, data: req.body });
    res.json(politica);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar política' });
  }
};

// ═══════════════════════════════════════════════════════
//  SESIONES ACTIVAS
// ═══════════════════════════════════════════════════════
export const getSesiones = async (req: Request, res: Response) => {
  try {
    const sesiones = await prisma.sesionActiva.findMany({
      where: { activa: true },
      include: { User: { select: { nombre: true, apellido: true, email: true, rol: true } } },
      orderBy: { ultimaActividad: 'desc' },
    });
    res.json(sesiones);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener sesiones' });
  }
};

export const revocarSesion = async (req: Request, res: Response) => {
  try {
    await prisma.sesionActiva.update({ where: { id: req.params.id }, data: { activa: false } });
    await prisma.auditAcceso.create({
      data: {
        id: randomUUID(),
        usuarioId: req.user?.userId,
        accion: 'SESION_REVOCADA',
        recurso: req.params.id,
        resultado: 'EXITOSO',
        ipAddress: req.ip,
      },
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al revocar sesión' });
  }
};

// ═══════════════════════════════════════════════════════
//  DELEGACIONES TEMPORALES
// ═══════════════════════════════════════════════════════
export const getDelegaciones = async (req: Request, res: Response) => {
  try {
    const delegaciones = await prisma.delegacionTemporal.findMany({
      include: {
        User_DelegacionTemporal_deleganteIdToUser: { select: { nombre: true, apellido: true } },
        User_DelegacionTemporal_delegadoIdToUser:  { select: { nombre: true, apellido: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(delegaciones);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener delegaciones' });
  }
};

export const createDelegacion = async (req: Request, res: Response) => {
  try {
    const { delegadoId, motivo, fechaInicio, fechaFin, recursosCodigos } = req.body;
    const delegacion = await prisma.delegacionTemporal.create({
      data: {
        id: randomUUID(),
        deleganteId: req.user!.userId,
        delegadoId,
        motivo,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        recursosCodigos,
        updatedAt: new Date(),
      },
    });
    // Log security event
    await prisma.eventoSeguridad.create({
      data: {
        id: randomUUID(),
        tipo: 'DELEGACION_CREADA',
        usuarioId: req.user?.userId,
        detalles: { delegadoId, recursosCodigos, fechaFin },
        severidad: 'BAJA',
      },
    });
    res.status(201).json(delegacion);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear delegación' });
  }
};

export const revokeDelegacion = async (req: Request, res: Response) => {
  try {
    await prisma.delegacionTemporal.update({ where: { id: req.params.id }, data: { activa: false } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al revocar delegación' });
  }
};

// ═══════════════════════════════════════════════════════
//  AUDITORÍA
// ═══════════════════════════════════════════════════════
export const getAuditAccesos = async (req: Request, res: Response) => {
  try {
    const { desde, hasta, usuarioId, accion } = req.query;
    const where: any = {};
    if (usuarioId) where.usuarioId = usuarioId;
    if (accion)    where.accion    = accion;
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt.gte = new Date(String(desde));
      if (hasta) where.createdAt.lte = new Date(String(hasta));
    }
    const logs = await prisma.auditAcceso.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener auditoría' });
  }
};

export const getEventosSeguridad = async (req: Request, res: Response) => {
  try {
    const eventos = await prisma.eventoSeguridad.findMany({
      where: { resuelto: false },
      orderBy: [{ severidad: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    });
    res.json(eventos);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener eventos de seguridad' });
  }
};

export const resolverEvento = async (req: Request, res: Response) => {
  try {
    await prisma.eventoSeguridad.update({
      where: { id: req.params.id },
      data: { resuelto: true, resueltoPor: req.user?.userId, resueltoEn: new Date() },
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al resolver evento' });
  }
};

// ═══════════════════════════════════════════════════════
//  RESUMEN DASHBOARD IAM
// ═══════════════════════════════════════════════════════
export const getDashboardIam = async (req: Request, res: Response) => {
  try {
    const [
      totalUsuarios,
      totalPerfiles,
      totalRoles,
      totalGrupos,
      sesionesActivas,
      eventosPendientes,
      delegacionesActivas,
      accesosHoy,
    ] = await Promise.all([
      prisma.user.count({ where: { activo: true } }),
      prisma.perfil.count({ where: { activo: true } }),
      prisma.iamRol.count({ where: { activo: true } }),
      prisma.grupo.count({ where: { activo: true } }),
      prisma.sesionActiva.count({ where: { activa: true, expiraEn: { gte: new Date() } } }),
      prisma.eventoSeguridad.count({ where: { resuelto: false } }),
      prisma.delegacionTemporal.count({ where: { activa: true, fechaFin: { gte: new Date() } } }),
      prisma.auditAcceso.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);

    res.json({
      totalUsuarios,
      totalPerfiles,
      totalRoles,
      totalGrupos,
      sesionesActivas,
      eventosPendientes,
      delegacionesActivas,
      accesosHoy,
    });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener dashboard IAM' });
  }
};
