import { useState } from 'react';
import { Body3D } from '../components/Body3D';
import { motion } from 'framer-motion';

export function Body3DTestPage() {
  const [marks] = useState([
    {
      id: '1',
      tipo: 'IMPLANTE_MAMARIO' as const,
      posicionX: 35,
      posicionY: 45,
      intensidad: 6,
      fecha: '2026-04-17',
      zona: 'Mama Izquierda',
      nota: 'Implante mamario 320cc'
    },
    {
      id: '2',
      tipo: 'IMPLANTE_MAMARIO' as const,
      posicionX: 65,
      posicionY: 45,
      intensidad: 6,
      fecha: '2026-04-17',
      zona: 'Mama Derecha',
      nota: 'Implante mamario 320cc'
    },
    {
      id: '3',
      tipo: 'LIPOSUCCION' as const,
      posicionX: 50,
      posicionY: 70,
      intensidad: 4,
      fecha: '2026-04-17',
      zona: 'Abdomen',
      nota: 'Liposucción 400ml'
    },
    {
      id: '4',
      tipo: 'CICATRIZ' as const,
      posicionX: 50,
      posicionY: 85,
      intensidad: 5,
      fecha: '2026-04-17',
      zona: 'Pliegue Inframamario',
      nota: 'Evolución de cicatriz'
    }
  ]);

  const getColorClass = (tipo: string): string => {
    const colors: Record<string, string> = {
      IMPLANTE_MAMARIO: 'bg-pink-600',
      LIPOSUCCION: 'bg-cyan-600',
      LIFTING_FACIAL: 'bg-amber-600',
      RINOPLASTIA: 'bg-purple-600',
      ABDOMINOPLASTIA: 'bg-emerald-600',
      BLEFAROPLASTIA: 'bg-blue-600',
      MENTOPLASTIA: 'bg-indigo-600',
      CICATRIZ: 'bg-yellow-600',
      HEMATOMA: 'bg-red-800',
      CELULITIS_EDEMA: 'bg-red-600',
    };
    return colors[tipo] || 'bg-purple-600';
  };

  const getProcedureName = (tipo: string): string => {
    const names: Record<string, string> = {
      IMPLANTE_MAMARIO: 'Aumento Mamario',
      LIPOSUCCION: 'Liposucción',
      LIFTING_FACIAL: 'Lifting Facial',
      RINOPLASTIA: 'Rinoplastia',
      ABDOMINOPLASTIA: 'Abdominoplastia',
      BLEFAROPLASTIA: 'Blefaroplastia',
      MENTOPLASTIA: 'Mentoplastia',
      CICATRIZ: 'Cicatriz',
      HEMATOMA: 'Hematoma',
      CELULITIS_EDEMA: 'Edema',
    };
    return names[tipo] || tipo;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">Mapa Corporal 3D Estético</h1>
          <p className="text-slate-400">Visualización interactiva de procedimientos de cirugía estética</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <div className="lg:col-span-2">
            <div className="bg-slate-900 rounded-lg p-6 border border-slate-700 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-cyan-400">Modelo 3D - Historia Clínica</h2>
              <Body3D marks={marks} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">Procedimientos Documentados</h3>
              <div className="space-y-3">
                {marks.map((mark) => (
                  <motion.div
                    key={mark.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-slate-800 rounded p-3 border-l-4 border-cyan-500"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`${getColorClass(mark.tipo)} w-3 h-3 rounded-full mt-1.5 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white">{getProcedureName(mark.tipo)}</p>
                        <p className="text-xs text-slate-400">{mark.zona}</p>
                        {mark.nota && <p className="text-xs text-slate-500 italic mt-1">{mark.nota}</p>}
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-slate-300">Evolución:</span>
                          <span className="text-xs font-bold text-cyan-400">{mark.intensidad}/10</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">Leyenda Procedimientos</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-600" />
                  <span className="text-slate-300">Implante Mamario</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-600" />
                  <span className="text-slate-300">Liposucción</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-600" />
                  <span className="text-slate-300">Lifting Facial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-600" />
                  <span className="text-slate-300">Abdominoplastia</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-600" />
                  <span className="text-slate-300">Cicatriz/Evolución</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 bg-slate-900 rounded-lg border border-slate-700"
        >
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">Información Clínica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <p><strong className="text-slate-300">Paciente:</strong> Demo - Historia Clínica Estética</p>
              <p><strong className="text-slate-300">Fecha de Consulta:</strong> 17 de Abril de 2026</p>
              <p><strong className="text-slate-300">Tipo de Consulta:</strong> Control Post-operatorio</p>
            </div>
            <div>
              <p><strong className="text-slate-300">Procedimientos Realizados:</strong> Aumento mamario + Liposucción</p>
              <p><strong className="text-slate-300">Días Post-Op:</strong> 7 días</p>
              <p><strong className="text-slate-300">Estado General:</strong> Evolución favorable</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
