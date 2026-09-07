```markdown
# Integración Frontend: Cliente API, Cookies y Rotación Silenciosa (RTR)

## 1. Arquitectura de Sesión Híbrida
SARAI utiliza un modelo desacoplado de sesión en el navegador que neutraliza los vectores comunes de ataque:

1. **Access Token en Memoria / Almacenamiento Local Temporal**:
   - Se inyecta en el encabezado estándar `Authorization: Bearer <accessToken>`.
   - Se utiliza para la firma de transacciones clínicas en tiempo real.
2. **Refresh Token Confinado en Cookie `__Host-`**:
   - `HttpOnly`: Inaccesible desde scripts de JavaScript (`document.cookie`), anulando la filtración por vulnerabilidades XSS.
   - `SameSite=Strict`: Previene el envío del token en contextos cruzados (mitigación de CSRF).
   - `Path=/api/v1/auth/refresh`: El navegador restringe el envío de la cookie exclusivamente al endpoint de rotación.

---

## 2. Ciclo de Vida del Helper `apiCall`

El archivo `src/services/api.ts` implementa una cola de reintentos concurrentes (*Request Queuing*) para evitar que ráfagas de peticiones con token expirado generen múltiples intentos de refresco desincronizados:

Petición A (401) ----> ¿Refresco en curso? (NO) ----> Inicia POST /auth/refresh
|
Petición B (401) ----> ¿Refresco en curso? (SÍ) ----> Encolar en failedQueue
Petición C (401) ----> ¿Refresco en curso? (SÍ) ----> Encolar en failedQueue
|
Nuevo Token Recibido
|
+----------------+----------------+
v                                 v
Reintenta A                       Reintenta B y C
(Token Renovado)                  (Vaciado de Cola)


---

## 3. Resolución Dinámica de Tenancy en el Cliente

Todo consumo clínico requiere la cabecera `x-tenant-id`. La función `getSubdomain()` extrae la institución según el contexto de red:

```typescript
export const getSubdomain = (): string => {
  if (typeof window === 'undefined') return 'demo';
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // Soporte para dominios tipo: clinica-norte.sarai.lat
  if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'localhost') {
    return parts[0];
  }
  return import.meta.env.VITE_DEFAULT_TENANT || 'demo';
};

4. Reglas Críticas para Desarrolladores de Frontend

    Obligatoriedad de credentials: 'include':
    Cualquier llamada nativa con fetch fuera del helper apiCall omitirá las cookies del navegador si no incluye esta bandera explícita.

    Mapeo de Respuestas de Login:
    El backend devuelve el objeto del usuario bajo la clave usuario (convención clínica en español). Asegurar el almacenamiento correcto:
    TypeScript

    localStorage.setItem('user', JSON.stringify(response.data?.usuario));

    Ruta de Logout Canónica:
    Al invocar logout(), el frontend debe esperar la resolución de POST /api/v1/auth/logout antes de redirigir al login; de lo contrario, la respuesta que destruye la cookie (Max-Age=0) podría ser cancelada por la navegación de la página.