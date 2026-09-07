# Operaciones: Diccionario Exhaustivo de Variables de Entorno

Este documento cataloga cada variable requerida para el despliegue de **SARAI**. El sistema no debe iniciar si alguna variable catalogada como crítica se encuentra indefinida.

---

## 1. Backend Core (`his-core/.env`)

### Servidor HTTP y Entorno
| Variable | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `string` | `development` | `development`, `test` o `production`. Activa flags estrictos de cookies (`Secure`). |
| `PORT` | `number` | `3000` | Puerto TCP donde escucha la API de NestJS. |
| `API_PREFIX` | `string` | `api/v1` | Prefijo global para las rutas canónicas del controlador. |
| `CORS_ORIGINS` | `string` | `http://localhost:5173` | Lista separada por comas de orígenes permitidos con credenciales. |

### Base de Datos Master (`sarai_master`)
| Variable | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `MASTER_DB_HOST` | `string` | Sí | Host del cluster PostgreSQL central (ej. Supabase Pooler). |
| `MASTER_DB_PORT` | `number` | Sí | Puerto (usualmente `6543` o `5432`). |
| `MASTER_DB_NAME` | `string` | Sí | Nombre de la base de datos de control (ej. `postgres` o `sarai_master`). |
| `MASTER_DB_USER` | `string` | Sí | Usuario administrativo con permisos para consultar instituciones. |
| `MASTER_DB_PASSWORD` | `string` | Sí | Contraseña de autenticación (procesada vía SCRAM-SHA-256). |
| `MASTER_DB_SSL` | `boolean`| Sí | `true` en staging y producción; exige cifrado TLS. |

### Criptografía y Sesión (JWT / RTR)
| Variable | Tipo | Ejemplo / Longitud | Descripción |
| :--- | :--- | :--- | :--- |
| `JWT_SECRET` | `string` | Min. 64 caracteres hex | Llave secreta para la firma del Access Token (vida corta: 15m). |
| `JWT_EXPIRES_IN` | `string` | `15m` | Tiempo de vida antes de solicitar rotación. |
| `JWT_REFRESH_SECRET` | `string` | Min. 64 caracteres hex | Secreto criptográfico independiente para validar refresh tokens. |
| `REFRESH_TOKEN_TTL_DAYS` | `number`| `7` | Vigencia de la sesión antes de exigir re-autenticación obligatoria. |

---

## 2. Frontend Web (`frontend/.env`)

| Variable | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `string` | `http://localhost:3000/api/v1` | URL base consumida por el cliente HTTP `apiCall`. Debe incluir el prefijo `/api/v1`. |
| `VITE_DEFAULT_TENANT` | `string` | `demo` | Subdominio de contingencia si la aplicación corre en IP pura o `localhost`. |
| `VITE_APP_TITLE` | `string` | `SARAI - Asistente Clínico` | Título institucional en la pestaña del navegador. |

---

## 3. Matriz de Validación Rápida (.env.example)

### Backend (`his-core/.env.example`)
```env
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
CORS_ORIGINS=http://localhost:5173,[http://127.0.0.1:5173](http://127.0.0.1:5173)

MASTER_DB_HOST=aws-0-us-east-2.pooler.supabase.com
MASTER_DB_PORT=6543
MASTER_DB_NAME=postgres
MASTER_DB_USER=postgres.xxxxxxxx
MASTER_DB_PASSWORD=SuperSecretPassword2026*
MASTER_DB_SSL=true

JWT_SECRET=c8f8b894c25f4d89e5a31b4097f5d3780d6b67e23a4114f6b0f948f98c8c2a91
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=7f5e14b2d3c8a9018e47b6a5d4c3b2a10987654321fedcba0123456789abcdef
REFRESH_TOKEN_TTL_DAYS=7

Frontend (frontend/.env.example)
Fragmento de código

VITE_API_URL=http://localhost:3000/api/v1
VITE_DEFAULT_TENANT=demo
VITE_APP_TITLE=SARAI - HIS