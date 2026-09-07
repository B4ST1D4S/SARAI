# Arquitectura de Autenticación, JWT y Refresh Token Rotation (RTR)

## 1. Algoritmo de Hashing: Argon2id
SARAI prohíbe el uso de `bcrypt` y `SHA`. Las contraseñas de los usuarios clínicos se procesan mediante **Argon2id** (`argon2.argon2id`), diseñado para resistir ataques por hardware especializado (GPU/ASIC) y ataques de canal lateral:
- Configuración estándar: `timeCost: 3`, `memoryCost: 65536` (64 MB), `parallelism: 4`.

## 2. JWT Access Token y Claims Asistenciales
El token de acceso tiene una vigencia reducida (15 minutos) y encapsula el contexto clínico y de tenencia para evitar lecturas continuas a la base de datos:

| Claim | Tipo | Propósito |
| :--- | :--- | :--- |
| `sub` | `UUID` | ID del usuario en la tabla `usuarios` del tenant. |
| `tenantId` | `UUID` | ID inmutable de la institución médica. |
| `tenantSubdomain`| `string` | Subdominio resuelto (ej. `demo`). |
| `rol` | `string` | `ADMIN`, `MEDICO_GENERAL`, `ESPECIALISTA`, etc. |
| `profesionalId` | `UUID \| null` | ID en `profesionales_salud` si aplica. |
| `registroMedico`| `string \| null` | Tarjeta profesional para firmas de fórmulas/historias. |
| `esAsistencial` | `boolean` | Flag directo para autorización en módulos clínicos. |
| `jti` | `UUID` | Identificador único del refresh token vinculado. |

## 3. Refresh Token Rotation (RTR)
Para mitigar la interceptación de sesiones, cada refresh token se utiliza **exactamente una vez**.

[Cliente]                           [Backend / Auth]                    [DB Tenant]
|                                      |                                  |
|-- 1. POST /api/v1/auth/refresh ----->|                                  |
|   (Cookie: __Host-refresh_token)     |-- 2. Hash(token) y consulta ---->|
|                                      |<-- 3. Token válido (no revocado)-|
|                                      |-- 4. Revoca token anterior ----->|
|                                      |-- 5. Genera nuevo par ---------->|
|<-- 6. Retorna nuevo AccessToken -----|
|    Set-Cookie: __Host-refresh_token  |


- **Detección de Reúso**: Si un token ya revocado intenta ser utilizado de nuevo, el sistema invalida **toda la cadena de tokens** del usuario por sospecha de compromiso.

## 4. Política de Cookies: Prefijo `__Host-`
El refresh token nunca se devuelve en el cuerpo JSON de la respuesta ni se almacena en `localStorage`. Se emite mediante una cookie con prefijo `__Host-`:

```typescript
res.cookie('__Host-refresh_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/v1/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
});

Reglas Críticas del Prefijo __Host-

    Debe incluir la bandera Secure en HTTPS (o entornos de staging/prod).

    No debe tener atributo Domain (queda anclada exclusivamente al host emisor).

    El atributo Path debe coincidir exactamente: Si se define con path: '/api/v1/auth/refresh', el método res.clearCookie() en el logout DEBE especificar exactamente el mismo path: '/api/v1/auth/refresh', de lo contrario el navegador ignorará la orden de destrucción y la sesión quedará huérfana.