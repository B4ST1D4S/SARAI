-- Seed idempotente de recursos IAM base (sin ejecutar scripts manuales)
WITH recursos(codigo, nombre, tipo, parent_codigo, orden) AS (
  VALUES
    ('DASHBOARD', 'Dashboard', 'MODULO', NULL, 1),
    ('CLINICA', 'Clínica', 'MODULO', NULL, 2),
    ('AGENDA', 'Agenda', 'MODULO', NULL, 3),
    ('GESTION', 'Gestión', 'MODULO', NULL, 4),
    ('ADMIN', 'Administración', 'MODULO', NULL, 5),
    ('SEGURIDAD', 'Seguridad & IAM', 'MODULO', NULL, 6),
    ('CLINICA.PACIENTES', 'Pacientes', 'SUBMODULO', 'CLINICA', 1),
    ('CLINICA.HISTORIA', 'Historia Clínica', 'SUBMODULO', 'CLINICA', 2),
    ('CLINICA.VISUAL', 'Visual Clínico', 'SUBMODULO', 'CLINICA', 3),
    ('CLINICA.ODONTOGRAMA', 'Odontograma', 'SUBMODULO', 'CLINICA', 4),
    ('CLINICA.MAPA', 'Mapa Corporal', 'SUBMODULO', 'CLINICA', 5),
    ('AGENDA.CITAS', 'Citas', 'SUBMODULO', 'AGENDA', 1),
    ('AGENDA.ADMISION', 'Admisión', 'SUBMODULO', 'AGENDA', 2),
    ('AGENDA.PROFESIONAL', 'Agenda Profesional', 'SUBMODULO', 'AGENDA', 3),
    ('AGENDA.CONFIG', 'Config Agenda', 'SUBMODULO', 'AGENDA', 4),
    ('AGENDA.CIRUGIA', 'Quirofano', 'SUBMODULO', 'AGENDA', 5),
    ('GESTION.COTIZACIONES', 'Cotizaciones', 'SUBMODULO', 'GESTION', 1),
    ('GESTION.CRM', 'CRM', 'SUBMODULO', 'GESTION', 2),
    ('GESTION.FACTURACION', 'Facturación', 'SUBMODULO', 'GESTION', 3),
    ('GESTION.PLANTILLAS', 'Plantillas', 'SUBMODULO', 'GESTION', 4),
    ('GESTION.IMPRESION', 'Central Impresión', 'SUBMODULO', 'GESTION', 5),
    ('ADMIN.PARAMETRIZACION', 'Parametrización', 'SUBMODULO', 'ADMIN', 1),
    ('ADMIN.USUARIOS', 'Usuarios', 'SUBMODULO', 'ADMIN', 2),
    ('SEGURIDAD.EMPRESAS', 'Empresas', 'SUBMODULO', 'SEGURIDAD', 1),
    ('SEGURIDAD.SEDES', 'Sedes', 'SUBMODULO', 'SEGURIDAD', 2),
    ('SEGURIDAD.PERFILES', 'Perfiles', 'SUBMODULO', 'SEGURIDAD', 3),
    ('SEGURIDAD.ROLES', 'Roles IAM', 'SUBMODULO', 'SEGURIDAD', 4),
    ('SEGURIDAD.PERMISOS', 'Permisos', 'SUBMODULO', 'SEGURIDAD', 5),
    ('SEGURIDAD.GRUPOS', 'Grupos', 'SUBMODULO', 'SEGURIDAD', 6),
    ('SEGURIDAD.POLITICAS', 'Políticas', 'SUBMODULO', 'SEGURIDAD', 7),
    ('SEGURIDAD.AUDITORIA', 'Auditoría', 'SUBMODULO', 'SEGURIDAD', 8),
    ('SEGURIDAD.SESIONES', 'Sesiones Activas', 'SUBMODULO', 'SEGURIDAD', 9),
    ('SEGURIDAD.DISPOSITIVOS', 'Dispositivos', 'SUBMODULO', 'SEGURIDAD', 10),
    ('SEGURIDAD.DELEGACIONES', 'Delegaciones', 'SUBMODULO', 'SEGURIDAD', 11),
    ('SEGURIDAD.MFA', 'Autenticación MFA', 'SUBMODULO', 'SEGURIDAD', 12)
)
INSERT INTO "RecursoSistema" ("id", "codigo", "nombre", "tipo", "parentId", "orden", "activo", "createdAt")
SELECT
  'recurso_' || lower(replace(codigo, '.', '_')) AS id,
  codigo,
  nombre,
  tipo::"TipoRecurso",
  NULL,
  orden,
  true,
  CURRENT_TIMESTAMP
FROM recursos
ON CONFLICT ("codigo") DO UPDATE
SET
  "nombre" = EXCLUDED."nombre",
  "tipo" = EXCLUDED."tipo",
  "orden" = EXCLUDED."orden",
  "activo" = true;

WITH recursos(codigo, parent_codigo) AS (
  VALUES
    ('DASHBOARD', NULL),
    ('CLINICA', NULL),
    ('AGENDA', NULL),
    ('GESTION', NULL),
    ('ADMIN', NULL),
    ('SEGURIDAD', NULL),
    ('CLINICA.PACIENTES', 'CLINICA'),
    ('CLINICA.HISTORIA', 'CLINICA'),
    ('CLINICA.VISUAL', 'CLINICA'),
    ('CLINICA.ODONTOGRAMA', 'CLINICA'),
    ('CLINICA.MAPA', 'CLINICA'),
    ('AGENDA.CITAS', 'AGENDA'),
    ('AGENDA.ADMISION', 'AGENDA'),
    ('AGENDA.PROFESIONAL', 'AGENDA'),
    ('AGENDA.CONFIG', 'AGENDA'),
    ('AGENDA.CIRUGIA', 'AGENDA'),
    ('GESTION.COTIZACIONES', 'GESTION'),
    ('GESTION.CRM', 'GESTION'),
    ('GESTION.FACTURACION', 'GESTION'),
    ('GESTION.PLANTILLAS', 'GESTION'),
    ('GESTION.IMPRESION', 'GESTION'),
    ('ADMIN.PARAMETRIZACION', 'ADMIN'),
    ('ADMIN.USUARIOS', 'ADMIN'),
    ('SEGURIDAD.EMPRESAS', 'SEGURIDAD'),
    ('SEGURIDAD.SEDES', 'SEGURIDAD'),
    ('SEGURIDAD.PERFILES', 'SEGURIDAD'),
    ('SEGURIDAD.ROLES', 'SEGURIDAD'),
    ('SEGURIDAD.PERMISOS', 'SEGURIDAD'),
    ('SEGURIDAD.GRUPOS', 'SEGURIDAD'),
    ('SEGURIDAD.POLITICAS', 'SEGURIDAD'),
    ('SEGURIDAD.AUDITORIA', 'SEGURIDAD'),
    ('SEGURIDAD.SESIONES', 'SEGURIDAD'),
    ('SEGURIDAD.DISPOSITIVOS', 'SEGURIDAD'),
    ('SEGURIDAD.DELEGACIONES', 'SEGURIDAD'),
    ('SEGURIDAD.MFA', 'SEGURIDAD')
)
UPDATE "RecursoSistema" child
SET "parentId" = parent."id"
FROM recursos r
JOIN "RecursoSistema" parent ON parent."codigo" = r.parent_codigo
WHERE child."codigo" = r.codigo
  AND r.parent_codigo IS NOT NULL;

WITH recursos(codigo, parent_codigo) AS (
  VALUES
    ('DASHBOARD', NULL),
    ('CLINICA', NULL),
    ('AGENDA', NULL),
    ('GESTION', NULL),
    ('ADMIN', NULL),
    ('SEGURIDAD', NULL)
)
UPDATE "RecursoSistema" root
SET "parentId" = NULL
FROM recursos r
WHERE root."codigo" = r.codigo
  AND r.parent_codigo IS NULL;
