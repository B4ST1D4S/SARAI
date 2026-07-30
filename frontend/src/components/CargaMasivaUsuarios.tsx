import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Download, FileText, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface Props { onClose: () => void; onSuccess: () => void; }

interface FilaError { fila: number; username: string; error: string; }
interface ResultadoCarga { total: number; creados: number; errores: number; detalle: FilaError[]; }

const COLUMNAS = [
  { nombre: 'username',             requerido: true,  desc: 'Identificador de acceso (sin espacios)' },
  { nombre: 'password',             requerido: true,  desc: 'Contraseña inicial del usuario' },
  { nombre: 'nombre',               requerido: true,  desc: 'Nombre(s) del usuario' },
  { nombre: 'apellido',             requerido: true,  desc: 'Apellido(s) del usuario' },
  { nombre: 'rol',                  requerido: true,  desc: 'MEDICO · AUXILIAR · RECEPCIONISTA · SUPER_ADMIN · PACIENTE' },
  { nombre: 'email',                requerido: false, desc: 'Correo electrónico institucional' },
  { nombre: 'telefono',             requerido: false, desc: 'Número de teléfono o celular' },
  { nombre: 'perfil_iam',           requerido: false, desc: 'Nombre exacto del perfil IAM (ej: "Todo Acceso")' },
  { nombre: 'tipo_documento',       requerido: false, desc: 'CC · CE · PS · TI' },
  { nombre: 'numero_documento',     requerido: false, desc: 'Número del documento de identidad' },
  { nombre: 'especialidad',         requerido: false, desc: 'Especialidad médica (aplica para MEDICO / AUXILIAR)' },
  { nombre: 'registro_profesional', requerido: false, desc: 'Tarjeta profesional (aplica para MEDICO / AUXILIAR)' },
  { nombre: 'registro_medico',      requerido: false, desc: 'Registro RETHUS (aplica para MEDICO)' },
];

const CSV_EJEMPLO = [
  COLUMNAS.map(c => c.nombre).join(','),
  'drlopez,Pass1234!,Eduardo,Lopez,MEDICO,elopez@clinica.com,3201112233,Todo Acceso,CC,10200001,Cirugia Estetica,TP-0001,RM-12345',
  'mruiz,Pass1234!,Martha,Ruiz,RECEPCIONISTA,mruiz@clinica.com,3101112244,,CC,10200002,,,',
  'amorales,Pass1234!,Andres,Morales,AUXILIAR,amorales@clinica.com,3001112255,,CC,10200003,Enfermeria,TP-0003,',
  'jmejia,Pass1234!,Julia,Mejia,MEDICO,jmejia@clinica.com,3111112266,Super admin,CC,10200004,Dermatologia,TP-0004,RM-67890',
].join('\n');

export function CargaMasivaUsuarios({ onClose, onSuccess }: Props) {
  const [archivo, setArchivo]     = useState<File | null>(null);
  const [cargando, setCargando]   = useState(false);
  const [resultado, setResultado] = useState<ResultadoCarga | null>(null);
  const [verCols, setVerCols]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const descargarPlantilla = () => {
    const bom = '\uFEFF'; // BOM para compatibilidad con Excel en español
    const blob = new Blob([bom + CSV_EJEMPLO], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_carga_masiva_usuarios.csv';
    link.click();
  };

  const handleCargar = async () => {
    if (!archivo || cargando) return;
    setCargando(true);
    setResultado(null);
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      const token = localStorage.getItem('accessToken') || '';
      const res = await fetch(`${API_BASE_URL}/usuarios/carga-masiva`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar el archivo');
      setResultado(data);
      if (data.creados > 0) onSuccess();
    } catch (e: any) {
      setResultado({ total: 0, creados: 0, errores: 1, detalle: [{ fila: 0, username: '-', error: e.message }] });
    } finally {
      setCargando(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0d0f14] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 bg-yellow-400 rounded-full" />
            <div>
              <h2 className="text-base font-bold text-white">Carga Masiva de Usuarios</h2>
              <p className="text-xs text-gray-500 mt-0.5">Importa múltiples usuarios desde un archivo CSV</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Descargar plantilla */}
          <button
            onClick={descargarPlantilla}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed
                       border-yellow-500/30 rounded-xl text-sm text-yellow-400/80 font-medium
                       hover:border-yellow-500/60 hover:text-yellow-400 hover:bg-yellow-500/5 transition-all"
          >
            <Download size={16} />
            Descargar plantilla CSV con todos los campos ({COLUMNAS.length} columnas)
          </button>

          {/* Zona de selección de archivo */}
          <div
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              archivo ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
            }`}
          >
            <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden"
              onChange={e => { setArchivo(e.target.files?.[0] ?? null); setResultado(null); }} />
            {archivo ? (
              <div className="flex items-center justify-center gap-2 text-yellow-400">
                <FileText size={20} />
                <span className="text-sm font-semibold">{archivo.name}</span>
                <span className="text-xs text-gray-500">({(archivo.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <>
                <Upload size={24} className="mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-400 font-medium">Haz clic para seleccionar el archivo CSV</p>
                <p className="text-xs text-gray-600 mt-1">Formato .csv — Máximo 5 MB</p>
              </>
            )}
          </div>

          {/* Referencia de columnas (expandible) */}
          <div className="rounded-xl border border-white/5 overflow-hidden">
            <button
              onClick={() => setVerCols(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Info size={14} className="text-yellow-400/60" />
                Referencia de columnas — {COLUMNAS.length} campos disponibles
              </div>
              <span className="text-gray-600 text-xs">{verCols ? '▲ Ocultar' : '▼ Ver detalle'}</span>
            </button>
            <AnimatePresence>
              {verCols && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <table className="w-full text-xs border-t border-white/5">
                    <thead>
                      <tr className="bg-[#080a0f]">
                        <th className="text-left text-gray-600 font-medium px-4 py-2 w-48">Columna CSV</th>
                        <th className="text-center text-gray-600 font-medium px-2 py-2 w-12">Req.</th>
                        <th className="text-left text-gray-600 font-medium px-4 py-2">Descripción / Valores</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COLUMNAS.map(c => (
                        <tr key={c.nombre} className="border-t border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="px-4 py-2 font-mono text-yellow-400/80">{c.nombre}</td>
                          <td className="px-2 py-2 text-center">
                            {c.requerido ? <span className="text-red-400 font-bold">*</span> : <span className="text-gray-700">—</span>}
                          </td>
                          <td className="px-4 py-2 text-gray-500">{c.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="px-4 py-2 text-xs text-gray-700 border-t border-white/[0.03]">
                    <span className="text-red-400 font-bold">*</span> Campo requerido. Las columnas opcionales pueden dejarse vacías.
                    Para <span className="text-gray-500">perfil_iam</span> usa el nombre exacto del perfil (distingue mayúsculas/minúsculas).
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Resultado de la importación */}
          <AnimatePresence>
            {resultado && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/5 overflow-hidden"
              >
                <div className="grid grid-cols-3 divide-x divide-white/5">
                  <div className="bg-white/[0.03] p-4 text-center">
                    <p className="text-2xl font-bold text-gray-300">{resultado.total}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Filas procesadas</p>
                  </div>
                  <div className="bg-emerald-500/10 p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{resultado.creados}</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Usuarios creados</p>
                  </div>
                  <div className={`p-4 text-center ${resultado.errores > 0 ? 'bg-red-500/10' : 'bg-white/[0.03]'}`}>
                    <p className={`text-2xl font-bold ${resultado.errores > 0 ? 'text-red-400' : 'text-gray-600'}`}>{resultado.errores}</p>
                    <p className={`text-xs mt-0.5 ${resultado.errores > 0 ? 'text-red-600' : 'text-gray-700'}`}>Con errores</p>
                  </div>
                </div>
                {resultado.detalle.length > 0 && (
                  <div className="border-t border-white/5 max-h-40 overflow-y-auto">
                    {resultado.detalle.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 px-4 py-2 border-b border-white/[0.03] last:border-0">
                        <AlertCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
                        <p className="text-xs">
                          <span className="text-gray-400">Fila {e.fila}</span>
                          {e.username !== '-' && <span className="text-gray-600"> · {e.username}</span>}
                          <span className="text-red-400"> — {e.error}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {resultado.creados > 0 && resultado.errores === 0 && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/5 border-t border-emerald-500/10 text-sm text-emerald-400">
                    <CheckCircle size={15} />
                    Todos los usuarios fueron creados exitosamente.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 text-sm transition-colors">
            Cerrar
          </button>
          <button
            onClick={handleCargar}
            disabled={!archivo || cargando}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500
                       text-slate-900 font-semibold text-sm disabled:opacity-40 hover:from-yellow-400 hover:to-amber-400 transition-all"
          >
            {cargando ? (
              <><div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />Procesando…</>
            ) : (
              <><Upload size={15} />Importar usuarios</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
