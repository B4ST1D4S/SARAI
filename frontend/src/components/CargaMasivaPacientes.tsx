import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Download, File } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface CargaMasivaProps {
  onClose: () => void;
}

export function CargaMasivaPacientes({ onClose }: CargaMasivaProps) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);

  const handleDescargarPlantilla = () => {
    // Crear CSV de ejemplo
    const csvContent = `Tipo Documento,Número Documento,Primer Nombre,Segundo Nombre,Apellido Paterno,Apellido Materno,Fecha Nacimiento,Municipio Nacimiento,Domicilio Actual,Barrio/Sector,Ciudad Residencia,Teléfono Fijo,Celular,Email,Profesión/Ocupación,Teléfono Laboral,Dirección Trabajo,Género Biológico,Estado Civil,Grupo Étnico,Nivel Educación,Discapacidad,Notas Paciente
CC,1234567890,Juan,Carlos,García,López,1990-05-15,Bogotá,Calle 50 # 10-30,La Candelaria,Bogotá,15551234,3105551234,juan@example.com,Ingeniero,15559876,Carrera 7 # 45-50,F,Soltero,Mestizo,Pregrado,No,Paciente de prueba
CC,9876543210,María,Andrea,Rodríguez,Martínez,1992-08-20,Medellín,Cra 45 # 20-15,Laureles,Medellín,15552345,3115552345,maria@example.com,Doctora,15552345,Cra 80 # 50-30,F,Casado,Mestizo,Postgrado,No,Segunda paciente
CC,5555555555,Pedro,Luis,Sánchez,González,1988-03-10,Cali,Calle 10 # 5-20,San Antonio,Cali,15553456,3125553456,pedro@example.com,Abogado,15553456,Cra 5 # 10-15,M,Divorciado,Afrodescendiente,Pregrado,No,Tercera paciente`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_pacientes.csv';
    link.click();
  };

  const handleArchivoSeleccionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivo(file);
    }
  };

  const handleCargar = async () => {
    if (!archivo) return;

    setCargando(true);
    setProgreso(0);

    // Simular carga progresiva
    const interval = setInterval(() => {
      setProgreso((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 30;
      });
    }, 300);

    try {
      const formData = new FormData();
      formData.append('archivo', archivo);

      const token = localStorage.getItem('accessToken') || '';
      const response = await fetch(`${API_BASE_URL}/pacientes/carga-masiva', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(interval);

      if (response.ok) {
        setProgreso(100);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
        setProgreso(0);
      }
    } catch (error) {
      clearInterval(interval);
      console.error('Error en carga masiva:', error);
      alert('Error al cargar el archivo');
      setProgreso(0);
    } finally {
      setCargando(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 w-full max-w-2xl"
      >
        {/* Header */}
        <div className="bg-slate-900/95 backdrop-blur border-b border-slate-700 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Carga Masiva de Pacientes</h2>
            <p className="text-slate-400 text-sm mt-1">Importa múltiples pacientes desde un archivo CSV o Excel</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-8">
          <div className="space-y-6">
            {/* Instrucciones */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-cyan-400 mb-2">📋 Instrucciones:</h3>
              <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
                <li>Descarga la plantilla haciendo clic en el botón inferior</li>
                <li>Completa los datos de tus pacientes en el archivo CSV</li>
                <li>Asegúrate de que los encabezados sean idénticos a la plantilla</li>
                <li>Sube el archivo completado aquí</li>
              </ol>
            </div>

            {/* Botón descargar plantilla */}
            <button
              onClick={handleDescargarPlantilla}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
            >
              <Download size={20} />
              Descargar Plantilla
            </button>

            {/* Área de carga */}
            <div className="bg-slate-700/30 border-2 border-dashed border-slate-600 rounded-lg p-12 text-center hover:border-cyan-500 transition-colors cursor-pointer group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  setArchivo(file);
                }
              }}
            >
              <Upload size={48} className="mx-auto text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold text-white mb-2">Arrastra tu archivo aquí</h3>
              <p className="text-slate-400 mb-4">o</p>
              <label className="inline-block">
                <span className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-colors cursor-pointer">
                  Selecciona un archivo
                </span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleArchivoSeleccionado}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-400 mt-4">Soportados: CSV, XLSX, XLS</p>
            </div>

            {/* Archivo seleccionado */}
            {archivo && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <File size={24} className="text-cyan-400" />
                  <div>
                    <p className="text-white font-semibold">{archivo.name}</p>
                    <p className="text-sm text-slate-400">
                      {(archivo.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setArchivo(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </motion.div>
            )}

            {/* Barra de progreso */}
            {cargando && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-slate-300">Cargando...</p>
                  <p className="text-sm font-semibold text-cyan-400">{Math.round(progreso)}%</p>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progreso}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-cyan-600 to-blue-600"
                  />
                </div>
              </motion.div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-4 pt-6 border-t border-slate-700">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCargar}
                disabled={!archivo || cargando}
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargando ? 'Cargando...' : 'Cargar Pacientes'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}


