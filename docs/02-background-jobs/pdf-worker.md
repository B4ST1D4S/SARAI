# Workers Asíncronos: Compilación de Historias Clínicas en PDF

## 1. Propósito y Arquitectura
La compilación de una Historia Clínica Completa, Epicrisis o Fórmulas Médicas requiere renderizar documentos legalmente vinculantes con:
- Diagramas corporales vectoriales (anotaciones SVG / Canvas de evolución de heridas o procedimientos).
- Firmas digitales y registros médicos de los profesionales tratantes.
- Trazabilidad y sellos de tiempo inmutables.

El renderizado mediante motores Chromium headless (ej. Puppeteer / Playwright) demanda alta memoria RAM y ciclos de CPU. El módulo `pdf-worker` aísla este consumo en la cola `pdf-generation-queue`.

## 2. Diagrama de Secuencia

[Médico en Frontend] ---> POST /api/v1/historias/{id}/exportar-pdf
|
v
[API Core (NestJS)]
| (Encola job: { historiaId, tenantId, tipoDoc })
v
[pdf-generation-queue]
|
v
[PDF Worker Engine]
|
+-----------------------+-----------------------+
|                                               |
v                                               v

    Consulta Datos Clínicos                     2. Renderizado HTML + Handlebars
    (Pool aislado del Tenant)                      Inyección de SVG Mapa Corporal
    |                                               |
    +-----------------------+-----------------------+
    v
    3. Generación en Chromium
    (Puppeteer - Buffer binario)
    |
    4. Persistencia en Storage
    (Supabase Storage / S3)
    |
    5. Notificación al Cliente
    (URL firmada con caducidad)


## 3. Directivas de Rendimiento y Recursos
- **Gestión de Instancias de Navegador**: No abrir y cerrar una instancia de Chromium por cada página o documento. Se debe utilizar un pool de páginas o un browser singleton reutilizable para mitigar bloqueos de memoria (`OOM`).
- **Seguridad en Renderizado**: Todo contenido ingresado por usuarios (motivo de consulta, antecedentes) debe ser sanitizado previamente para evitar inyecciones XSS en el motor de renderizado HTML del PDF.
- **Manejo de Activos Estáticos**: Logos institucionales y firmas médicas en Base64 deben validarse para no exceder tamaños máximos que provoquen timeout durante la rasterización.

## 4. Contrato de Entrada del Job

```typescript
export interface GeneratePdfJobPayload {
  tenantId: string;
  subdomain: string;
  solicitanteId: string;
  tipoDocumento: 'HISTORIA_COMPLETA' | 'EPICRISIS' | 'FORMULA_MEDICA' | 'MAPA_CORPORAL';
  referenciaId: string; // ID de historia_clinica, cita_id o paciente_id
  metadata: {
    incluirMapaCorporal: boolean;
    incluirFirmas: boolean;
  };
}

5. Salida y Entrega al Usuario

El worker nunca devuelve el binario crudo mediante llamadas bloqueantes. Al finalizar:

    Sube el PDF a un bucket privado con cifrado en reposo.

    Emite un evento por WebSockets/SSE al cliente (DOCUMENTO_PDF_LISTO) con la URL presignada temporal.

    El frontend de React descarga el archivo o lo abre en una pestaña segura sin degradar la navegación de la interfaz médica.