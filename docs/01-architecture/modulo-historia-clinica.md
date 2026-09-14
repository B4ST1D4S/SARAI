# Arquitectura del Módulo de Historia Clínica (SARAI HIS)

## 1. Visión y Propósito
El módulo de diligenciamiento asistencial resuelve la fricción de navegación médica (fatiga por clics) mediante una experiencia de **Scroll Continuo Sectorizado (Cascada)** gobernada por un **Índice Lateral (Sub-sidebar)**.

Elimina el acoplamiento directo entre el formulario clínico y los códigos tarifarios (CUPS), reemplazándolo por una resolución jerárquica basada en la **Finalidad de la Consulta** y **Preferencias del Profesional**.

---

## 2. Jerarquía de Componentes

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Tipo de Consulta Macro (ej. Consulta de Cardiología)     │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Finalidad Operativa / Intención (PRIMERA_VEZ | CONTROL)  │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Plantilla de Historia Clínica (hc_plantillas_catalogo)   │
│    - Estructura JSONB con Secciones e Iconos                │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Secciones (Sub-sidebar: Valoración, Examen, Conducta)     │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Submódulos Atómicos en Cascada (Componentes React)       │
│    - MotivoConsulta, SignosVitales, PrescripcionModule...   │
└─────────────────────────────────────────────────────────────┘

3. Patrón de Resolución en Cascada (Overrides Médicos)

Para permitir que cada especialista o sede personalice su entorno de trabajo sin duplicar tipos de consulta ni alterar la facturación RIPS, el backend resuelve la plantilla con el siguiente orden de precedencia:

    Prioridad 1 (Override por Especialista):

    tipo_consulta_id + finalidad + profesional_id (+ sede_id opcional)

    Si el Dr. Ruiz tiene una plantilla adaptada a su estilo para controles, se carga esta.

    Prioridad 2 (Override por Sede):

    tipo_consulta_id + finalidad + sede_id (sin profesional específico)

    Si la Sede Norte protocoliza un formato particular.

    Prioridad 3 (Base Institucional):

    tipo_consulta_id + finalidad (con profesional_id IS NULL y sede_id IS NULL)

    Fallback estándar predeterminado.

4. Contrato de Datos de la Plantilla (JSON Schema)

Cada plantilla define sus secciones y la cascada de submódulos que el frontend en Vite + React renderiza de forma declarativa:
JSON

{
  "secciones": [
    {
      "id": "sec_valoracion",
      "titulo": "Valoración Clínica",
      "icono": "Stethoscope",
      "submodulos": [
        { "id": "motivo_consulta", "requerido": true },
        { "id": "signos_vitales", "requerido": true },
        { "id": "antecedentes", "requerido": false }
      ]
    },
    {
      "id": "sec_ordenamiento",
      "titulo": "Ordenamiento Médico",
      "icono": "Share2",
      "submodulos": [
        { "id": "prescripcion_medica", "requerido": false },
        { "id": "solicitud_ayudas_diag", "requerido": false }
      ]
    }
  ]
}

5. Dinámica de Diligenciamiento en Frontend

    Sub-sidebar Fija (Izquierda): Muestra las secciones (sec_valoracion, sec_ordenamiento). Cada ítem actúa como un ancla (scrollIntoView({ behavior: 'smooth' })) y cuenta con un indicador de progreso (submodulos_completados / submodulos_totales).

    Área de Trabajo Central (Cascada): Renderiza los bloques uno debajo del otro con scroll continuo vertical. Cada bloque expone su propio estado de validación interna.

    Persistencia Reactiva: Auto-guardado en borrador (draft) mediante almacenamiento local o debounced patching hacia el backend, evitando pérdida de datos por cierres inesperados de pestaña.