import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export interface SaveStatusBadgeProps {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  /** Tiempo que permanece visible "Guardado" (ms). */
  successDurationMs?: number;
}

const BASE = 'flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md border';

/**
 * Estado del guardado de una sección. "Guardado" se oculta solo; el error
 * queda hasta el siguiente intento.
 */
export function SaveStatusBadge({
  isPending,
  isSuccess,
  isError,
  successDurationMs = 2500,
}: SaveStatusBadgeProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  // Durante un guardado isSuccess pasa a false, así que cada éxito reinicia el temporizador.
  useEffect(() => {
    if (!isSuccess) {
      setShowSuccess(false);
      return;
    }
    setShowSuccess(true);
    const t = setTimeout(() => setShowSuccess(false), successDurationMs);
    return () => clearTimeout(t);
  }, [isSuccess, successDurationMs]);

  if (isPending) {
    return (
      <div role="status" className={`${BASE} text-primary bg-primary/10 border-primary/20`}>
        <Loader2 size={12} className="animate-spin" /> Guardando...
      </div>
    );
  }
  if (isError) {
    return (
      <div role="alert" className={`${BASE} text-danger bg-danger/10 border-danger/20`}>
        <AlertCircle size={12} /> Error al guardar
      </div>
    );
  }
  if (showSuccess) {
    return (
      <div
        role="status"
        className={`${BASE} text-success bg-success/10 border-success/20 animate-in fade-in zoom-in duration-300`}
      >
        <CheckCircle2 size={12} /> Guardado
      </div>
    );
  }
  return null;
}

export default SaveStatusBadge;
