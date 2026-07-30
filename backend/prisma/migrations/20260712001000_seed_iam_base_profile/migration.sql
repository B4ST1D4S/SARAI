-- Perfil base IAM idempotente: Todo Acceso
-- Objetivo: que ambientes nuevos queden listos sin ejecutar scripts manuales.

-- 1) Resolver o crear perfil base "Todo Acceso"
WITH perfil_existente AS (
  SELECT "id"
  FROM "Perfil"
  WHERE "id" = 'perfil_base_todo_acceso'
     OR lower("nombre") = 'todo acceso'
  ORDER BY CASE WHEN "id" = 'perfil_base_todo_acceso' THEN 0 ELSE 1 END, "createdAt" ASC
  LIMIT 1
),
perfil_creado AS (
  INSERT INTO "Perfil" ("id", "empresaId", "nombre", "descripcion", "activo", "esBase", "createdAt", "updatedAt", "creadoPor")
  SELECT
    'perfil_base_todo_acceso',
    NULL,
    'Todo Acceso',
    'Perfil base del sistema con permisos globales de administración IAM.',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL
  WHERE NOT EXISTS (SELECT 1 FROM perfil_existente)
  RETURNING "id"
),
perfil_objetivo AS (
  SELECT "id" FROM perfil_creado
  UNION ALL
  SELECT "id" FROM perfil_existente
  LIMIT 1
)
UPDATE "Perfil" p
SET
  "nombre" = 'Todo Acceso',
  "descripcion" = COALESCE(p."descripcion", 'Perfil base del sistema con permisos globales de administración IAM.'),
  "activo" = true,
  "esBase" = true,
  "updatedAt" = CURRENT_TIMESTAMP
FROM perfil_objetivo po
WHERE p."id" = po."id";

-- 2) Garantizar permisos PERMITIR para todas las acciones sobre todos los recursos
WITH perfil_objetivo AS (
  SELECT "id"
  FROM "Perfil"
  WHERE "id" = 'perfil_base_todo_acceso'
     OR lower("nombre") = 'todo acceso'
  ORDER BY CASE WHEN "id" = 'perfil_base_todo_acceso' THEN 0 ELSE 1 END, "createdAt" ASC
  LIMIT 1
),
acciones("accion") AS (
  VALUES
    ('VER'::"TipoAccion"),
    ('CREAR'::"TipoAccion"),
    ('EDITAR'::"TipoAccion"),
    ('ELIMINAR'::"TipoAccion"),
    ('IMPRIMIR'::"TipoAccion"),
    ('EXPORTAR'::"TipoAccion"),
    ('APROBAR'::"TipoAccion"),
    ('RECHAZAR'::"TipoAccion"),
    ('FIRMAR'::"TipoAccion"),
    ('ANULAR'::"TipoAccion"),
    ('DELEGAR'::"TipoAccion"),
    ('CONFIGURAR'::"TipoAccion"),
    ('ADMIN'::"TipoAccion")
)
INSERT INTO "PermisoRecurso" (
  "id",
  "usuarioId",
  "perfilId",
  "rolId",
  "grupoId",
  "recursoId",
  "accion",
  "efecto",
  "scopeEmpresaId",
  "scopeSedeId",
  "fechaInicio",
  "fechaFin",
  "activo",
  "creadoPor",
  "motivo",
  "createdAt",
  "updatedAt"
)
SELECT
  'perm_base_todo_' || md5(po."id" || ':' || r."id" || ':' || a."accion"::text),
  NULL,
  po."id",
  NULL,
  NULL,
  r."id",
  a."accion",
  'PERMITIR'::"EfectoPermiso",
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  NULL,
  'Seed migración perfil base Todo Acceso',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM perfil_objetivo po
CROSS JOIN "RecursoSistema" r
CROSS JOIN acciones a
WHERE NOT EXISTS (
  SELECT 1
  FROM "PermisoRecurso" pr
  WHERE pr."perfilId" = po."id"
    AND pr."recursoId" = r."id"
    AND pr."accion" = a."accion"
);
