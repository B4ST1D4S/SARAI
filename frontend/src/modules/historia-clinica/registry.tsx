import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { SubmoduloId } from '@/types/historiaClinica.types';

export interface SubmoduloProps<T = any> {
  data: T;
  onChange: (patch: Partial<T>) => void;
  readOnly?: boolean;
}

// 1. Carga diferida (Lazy Loading): no se cargan en memoria hasta que la plantilla los pide
// const MotivoConsultaModule = lazy(() => import('./submodulos/MotivoConsultaModule'));
const SignosVitalesModule = lazy(() => import('./submodulos/SignosVitalesModule'));
const MotivoConsultaModule = lazy(() => import('./submodulos/MotivoConsultaModule'));
const AntecedentesModule = lazy(() => import('./submodulos/AntecedentesModule'));
const RevisionSistemasModule = lazy(() => import('./submodulos/RevisionSistemasModule'));
const ExamenFisicoModule = lazy(() => import('./submodulos/ExamenFisicoModule'));
const DiagnosticosModule = lazy(() => import('./submodulos/DiagnosticosModule'));
const PlanManejoModule = lazy(() => import('./submodulos/PlanManejoModule'));
const SolicitudAyudasDiagModule = lazy(() => import('./submodulos/SolicitudAyudasDiagModule'));
const SolicitudProcedimientosModule = lazy(() => import('./submodulos/SolicitudProcedimientosModule'));

// Fallback elegante mientras carga el chunk del submódulo
const SubmoduloFallback: React.FC = () => (
  <div className="flex items-center justify-center p-6 bg-subtle/30 rounded-xl border border-border">
    <Loader2 className="w-5 h-5 animate-spin text-primary" />
    <span className="ml-2 text-xs text-secondary">Cargando submódulo clínico...</span>
  </div>
);

// Diccionario puro de componentes dinámicos
const REGISTRY_RAW: Partial<Record<SubmoduloId, React.LazyExoticComponent<React.ComponentType<SubmoduloProps<any>>>>> = {
  signos_vitales: SignosVitalesModule,
  motivo_consulta: MotivoConsultaModule,
  antecedentes: AntecedentesModule,
  revision_sistemas: RevisionSistemasModule,
  examen_fisico: ExamenFisicoModule,
  diagnosticos: DiagnosticosModule,
  plan_manejo: PlanManejoModule,
  solicitud_ayudas_diag: SolicitudAyudasDiagModule,
  solicitud_procedimientos: SolicitudProcedimientosModule,
};

// 2. Componente Envoltorio para consumir de forma segura desde el Workbench
export const RenderSubmodulo: React.FC<{
  id: SubmoduloId;
  data: any;
  onChange: (patch: any) => void;
  readOnly?: boolean;
}> = ({ id, data, onChange, readOnly }) => {
  const Component = REGISTRY_RAW[id];

  if (!Component) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted">
        Submódulo <span className="font-mono text-primary">[{id}]</span> en desarrollo o pendiente en catálogo.
      </div>
    );
  }

  return (
    <Suspense fallback={<SubmoduloFallback />}>
      <Component data={data} onChange={onChange} readOnly={readOnly} />
    </Suspense>
  );
};