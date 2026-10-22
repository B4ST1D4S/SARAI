# Guía Técnica: Creación y Extensión de Submódulos Clínicos

Este documento establece el contrato arquitectónico oficial para crear nuevos submódulos dentro del módulo de Historia Clínica. Todo nuevo formulario asistencial debe adherirse estrictamente a estas pautas para garantizar consistencia visual, seguridad contra pérdida de datos y validez legal.

---

## 1. Contrato de Interfaz (`SubmoduloProps`)

Cada submódulo es un componente React puro que debe implementar la interfaz canónica tipada:

```typescript
import { SubmoduloProps } from '@/features/historia-clinica/types/submodulo';

export interface MiNuevoSubmoduloData {
  campo_a: string;
  campo_b: number | null;
}

export const MiNuevoSubmoduloForm: React.FC<SubmoduloProps<MiNuevoSubmoduloData>> = ({
  folioId,
  datosIniciales,
  readOnly = false,
  onSaveStateChange,
  onRegisterFlush,
}) => {
  // Implementación...
};

Reglas del Contrato:

    readOnly: Si es true, todo input, selector, textarea y botón de mutación/adición debe quedar inhabilitado (disabled) o encerrado en un <fieldset disabled={readOnly}>.

    onSaveStateChange: Reportar cambios de estado { dirty, saving, error } para que el orquestador (ClinicalWorkspace) bloquee el botón de firma mientras existan operaciones en tránsito.

    onRegisterFlush: Exponer la función de guardado forzado para el vaciado síncrono previo a la firma del folio.

2. Persistencia y Autosave (useSubmoduloAutosave)

Queda estrictamente prohibido el uso de mutaciones dispersas en eventos onBlur o mutaciones manuales con TanStack Query sin registrar. Todo formulario debe usar el hook centralizado:
TypeScript

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSubmoduloAutosave } from '@/features/historia-clinica/hooks/useSubmoduloAutosave';
import { SaveStatusBadge } from '@/features/historia-clinica/components/common/SaveStatusBadge';

const form = useForm<MiNuevoSubmoduloData>({
  resolver: zodResolver(miNuevoSubmoduloSchema),
  defaultValues: datosIniciales ?? DEFAULT_VALUES,
});

const { status, error } = useSubmoduloAutosave({
  submoduloId: 'mi_nuevo_submodulo',
  form,
  saveFn: async (values) => {
    // 1. Sanitizar tipos (strings vacíos '' -> null en columnas numéricas)
    // 2. Invocar apiClient.patch o put
    await apiClient.patch(`/clinical-records/folios/${folioId}/seccion/mi_seccion`, values);
  },
  readOnly,
  onSaveStateChange,
  onRegisterFlush,
});

return (
  <form>
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-sm font-bold text-slate-800">Mi Submódulo</h3>
      <SaveStatusBadge error="{error}" status="{status}"/>
    </div>
    {/* Inputs... */}
  </form>
);

Características Obligatorias del Hook:

    Debounce unificado: 800 ms gestionado internamente con form.watch().

    Vaciado atómico (flush): Soporte automático para ClinicalWorkspace.handleCerrarFolio.

    Safe Reset: No invocar form.reset() destructivo tras guardar; usar reset(getValues(), { keepValues: true }).

3. Validaciones con Zod y Sanitización de Datos

    Rangos Fisiológicos: Si el submódulo captura constantes biológicas o medidas, definir límites fisiológicos estrictos con mensajes descriptivos.

    Sanitización Null vs. Empty String:
    TypeScript

    // En PostgreSQL, '' provoca fallos de sintaxis en tipos SMALLINT, INTEGER y NUMERIC
    peso: z.preprocess((val) => (val === '' || val === undefined ? null : Number(val)), z.number().nullable())

    Envío de Payloads Completos: Si la sección de base de datos tiene columnas NOT NULL, enviar siempre el payload completo consolidado mediante form.getValues(), nunca fragmentos basados únicamente en dirtyFields.

4. Tokens de Diseño y Coherencia Visual

Queda prohibido introducir clases arbitrarias de Tailwind (como acentos indigo) o alturas desalineadas. Importar siempre los tokens canónicos:
TypeScript

import {
  ESTILO_INPUT,
  ESTILO_SELECT,
  ESTILO_TEXTAREA,
  ESTILO_LABEL,
  ESTILO_ERROR_MSG,
  clasesCampo,
} from '@/features/historia-clinica/components/common/campos';

    Inputs y Selects: Altura estricta h-10 text-sm rounded-lg border-slate-200 dark:border-slate-700.

    Foco: Paleta central focus:ring-teal-500/20 focus:border-teal-500.

    Alertas y Riesgo: El color rose-500/600 se reserva exclusivamente para criticidad alta (anafilaxia, alertas vitales severas). Estados normales o no evaluables deben usar tonos neutros slate.

5. Registro en el Workspace (registry.ts)

Para que el orquestador reconozca el nuevo submódulo, se debe vincular en frontend/src/features/historia-clinica/components/registry.ts:

    Añadir el tipo de datos al mapa:
    TypeScript

    export interface SubmoduloDataMap {
      // ...existentes
      mi_nuevo_submodulo: MiNuevoSubmoduloData;
    }

    Registrar el componente dinámico en SUBMODULO_COMPONENTS:
    TypeScript

    export const SUBMODULO_COMPONENTS: Record<string, React.ComponentType<SubmoduloProps<any>>> = {
      // ...existentes
      mi_nuevo_submodulo: MiNuevoSubmoduloForm,
    };

    Registrar alias en SUBMODULO_ALIAS si existen variaciones heredadas en las plantillas.

6. Persistencia en Backend (his-core) y Validez Legal

Cuando el submódulo requiera una nueva tabla o columna:

    Migración SQL Idempotente: Crear archivo correlativo en his-core/src/database/migrations/tenants/ (ej. 040_hc_nuevo_submodulo.sql).

    Mapeo de Sección: Registrar en clinical-record.service.ts dentro de SECCIONES_CONFIG.

    Sello de Integridad y PDF: Si la información del submódulo forma parte del acto médico cerrado, debe incorporarse a:

        sello-integridad.ts (requiere evaluar versionamiento del hash criptográfico).

        clinical-pdf.worker.ts (renderizado tipográfico en el PDF oficial).