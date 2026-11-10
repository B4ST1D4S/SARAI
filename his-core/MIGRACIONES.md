# Migraciones de base de datos (his-core)

Cada institución (tenant) tiene su propia base de datos. Los cambios de estructura se guardan como archivos SQL numerados en:

```
his-core/src/database/migrations/tenants/
```

| Archivo | Contenido |
|---|---|
| 001_adm_pacientes.sql | Pacientes |
| 002_seg_usuarios_y_profesionales.sql | Usuarios y profesionales |
| 003_seg_auth_tokens_y_bloqueos.sql | Tokens de sesión y bloqueos |
| 004_seg_usuarios_preferencias.sql | Preferencias de usuario |
| 005_arbol_fisico.sql | Sedes, centros de costo y consultorios |
| 006_motor_de_agenda.sql | Agenda |
| 007_hc_farmacia_y_admisiones.sql | Historia clínica, farmacia y admisiones |
| 008_hc_secciones_submodulos_plantillas.sql | Secciones y plantillas de historia clínica |
| 009_seg_usuarios_extendido.sql | Datos extendidos de usuarios |
| 010_facturacion_ingresos_cuentas.sql | Facturación, ingresos y cuentas |
| 011_programas_especiales_renal.sql | Programa renal y hemodiálisis |

## Al bajar cambios de la rama

Desde la raíz del proyecto:

```powershell
.\actualizar-rama.ps1
```

Hace `git pull`, `npm install` en his-core y frontend, y aplica las migraciones que falten.

Si prefiere hacerlo a mano:

```powershell
git pull
cd his-core
npm install
npm run migrate:tenants
cd ..\frontend
npm install
```

## Cómo funciona `npm run migrate:tenants`

- Lee los tenants activos de la base maestra (`his_master`), usando las credenciales de `his-core/.env`.
- En cada tenant revisa la tabla `sys_schema_migrations` y aplica **solo** los archivos que aún no se han aplicado, en orden.
- Cada archivo se ejecuta en una transacción: si falla, no queda a medias y no se marca como aplicado.
- Se puede correr las veces que quiera; si todo está al día muestra `Aplicadas: 0` y `Estado: OK`.
- No necesita Redis ni que el backend esté encendido.

## Agregar una migración nueva

1. Cree el siguiente archivo numerado, por ejemplo `012_nombre_descriptivo.sql`.
2. No modifique migraciones ya subidas: otros equipos ya las aplicaron y no se volverían a ejecutar.
3. Use `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` cuando sea posible.
4. Corra `npm run migrate:tenants` y súbalo junto con el código que lo usa.

## Problemas comunes

| Síntoma | Causa | Solución |
|---|---|---|
| El frontend dice "No se pudo conectar con el servidor" | his-core apagado | `cd his-core` y `npm run start:dev` |
| his-core se queda colgado al arrancar, sin errores | `argon2` viejo en `node_modules` | `npm install` en his-core (usa argon2 0.44.0) |
| Error 500 en un módulo nuevo | Faltan migraciones | `npm run migrate:tenants` |
| `npm install` del frontend falla con `UNKNOWN ... package-lock.json` | Otro proceso tiene ocupado el archivo | Detenga `npm run dev` del frontend y repita |
| Migración falla en un tenant | Credenciales o conflicto de datos | Revise la columna `Error` del resumen y `his-core/.env` |
