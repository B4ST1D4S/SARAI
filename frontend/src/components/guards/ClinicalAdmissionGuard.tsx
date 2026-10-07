import React from 'react';
import { AlertOctagon } from 'lucide-react';

export interface ClinicalAdmissionGuardProps {
  citaEstado?: string;
  children: React.ReactNode;
}

const ESTADOS_VALIDOS = ['ADMITIDO', 'EN_SALA'];

export const ClinicalAdmissionGuard: React.FC<ClinicalAdmissionGuardProps> = ({
  citaEstado,
  children,
}) => {
  // Bypass para desarrollo / pruebas locales si la variable está activa
  if (import.meta.env.VITE_ENABLE_HC_DEV_BYPASS === 'true') {
    return <>{children}</>;
  }

  const esValido = Boolean(citaEstado && ESTADOS_VALIDOS.includes(citaEstado));

  if (!esValido) {
    return (
      <div className="min-h-[500px] h-full flex items-center justify-center p-6 bg-app">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-6 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger shadow-inner">
            <AlertOctagon size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-primary">Atención Médica Bloqueada</h2>
            <p className="text-sm text-secondary leading-relaxed">
              El paciente no se encuentra en el estado de admisión requerido para iniciar el diligenciamiento clínico.
            </p>
            <div className="pt-2 text-xs text-muted">
              Estado actual del paciente:{' '}
              <span className="font-mono font-bold text-danger px-2 py-0.5 rounded-md bg-danger/10 border border-danger/20">
                {citaEstado || 'No definido'}
              </span>
            </div>
            <p className="text-xs text-muted pt-1">
              Estados válidos requeridos:{' '}
              <span className="font-semibold text-primary">ADMITIDO</span> o{' '}
              <span className="font-semibold text-primary">EN_SALA</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ClinicalAdmissionGuard;
