import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Edit2, Check } from 'lucide-react';

interface Plantilla {
  id: string;
  nombre: string;
  procedimiento: string;
  categoria: 'FACIAL' | 'CORPORAL' | 'NO_INVASIVO';
  riesgosAutomaticos: string[];
  checklistPrequirurgico: string[];
  controlPostop: string[];
  contenido: string;
}

export default function PlantillasPage() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([
    {
      id: '1',
      nombre: 'Liposucción Abdominal',
      procedimiento: 'LIPOSUCCION',
      categoria: 'CORPORAL',
      riesgosAutomaticos: [
        'Hematoma',
        'Seroma',
        'Irregularidad de contorno',
        'Adormecimiento',
        'Infección',
        'Embolia grasa',
      ],
      checklistPrequirurgico: [
        'Fotos de frente',
        'Fotos de perfil',
        'Fotos lateral',
        'Mediciones (cintura, caderas)',
        'Consentimiento firmado',
        'Exámenes de laboratorio',
        'Autorización anestesia',
      ],
      controlPostop: ['Día 1: Dolor/Drenaje', 'Día 3: Foto', 'Día 7: Control', 'Día 15: Faja', 'Día 30: Evaluación'],
      contenido: `## LIPOSUCCIÓN ABDOMINAL

### ANAMNESIS
- [ ] Edad: ___
- [ ] Peso actual: ___
- [ ] Altura: ___
- [ ] IMC: ___
- [ ] Obesidad previa: [ ] Sí [ ] No
- [ ] Antecedentes quirúrgicos: ___

### EXAMEN FÍSICO
- Inspección: Cantidad de grasa, distribución, flacidez de piel
- Palpación: Firmeza, lipomas, irregularidades
- Medición cintura: ___
- Medición caderas: ___

### PLAN
- Liposucción abdominal con [técnica]
- Cantidad esperada: ___ cc
- Anestesia: [tipo]
- Internación: [sí/no]`,
    },
    {
      id: '2',
      nombre: 'Rinoplastia',
      procedimiento: 'RINOPLASTIA',
      categoria: 'FACIAL',
      riesgosAutomaticos: [
        'Asimetría nasal',
        'Dificultad respiratoria',
        'Cambio de voz',
        'Infección',
        'Deformidad',
        'Necesidad de reintervención',
      ],
      checklistPrequirurgico: [
        'Fotos frontal',
        'Fotos perfil derecho',
        'Fotos perfil izquierdo',
        'TAC nasal',
        'Rinomanometría',
        'Consentimiento informado',
      ],
      controlPostop: [
        'Día 1: Dolor/Edema',
        'Día 7: Cambio vendaje',
        'Día 14: Retiro gafas',
        'Mes 1: Control',
        'Mes 6: Evaluación final',
      ],
      contenido: `## RINOPLASTIA

### INDICACIONES
- [ ] Función respiratoria comprometida
- [ ] Insatisfacción estética
- [ ] Deformidad traumática
- [ ] Combinado: [ ] Septoplastia [ ] Turbinectomía

### TÉCNICA QUIRÚRGICA
- [ ] Enfoque abierto [ ] Cerrado
- [ ] Preservación ósea [ ] Osteotomía
- [ ] Injerto cartilaginoso: [ ] Sí [ ] No

### COMPLICACIONES EXPLICADAS
- Asimetría residual
- Cambios cicatriciales`,
    },
    {
      id: '3',
      nombre: 'Botox (No invasivo)',
      procedimiento: 'BOTOX',
      categoria: 'NO_INVASIVO',
      riesgosAutomaticos: ['Parálisis asimétrica', 'Cejas caídas', 'Sonrisa asimétrica', 'Efecto temporal'],
      checklistPrequirurgico: ['Fotos de frente', 'Fotos sonrisa', 'Consentimiento visual'],
      controlPostop: ['Día 3: Seguimiento', 'Día 7: Resultado', 'Día 14: Ajustes si necesario'],
      contenido: `## BOTOX - TOXINA BOTULÍNICA

### INDICACIONES
- [ ] Líneas de expresión frontal
- [ ] Entrecejo
- [ ] Patas de gallo
- [ ] Cejas caídas
- [ ] Mandíbula cuadrada

### DOSIS
- Frente: ___ U
- Entrecejo: ___ U
- Patas de gallo: ___ U
- TOTAL: ___ U

### RESULTADOS
- Tiempo: 3-7 días
- Máximo efecto: 2 semanas
- Duración: 3-4 meses`,
    },
  ]);

  const [selectedPlantilla, setSelectedPlantilla] = useState<Plantilla | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categoriaColor: Record<string, string> = {
    FACIAL: 'from-purple-600 to-purple-800',
    CORPORAL: 'from-blue-600 to-blue-800',
    NO_INVASIVO: 'from-green-600 to-green-800',
  };

  const categoriaNombre: Record<string, string> = {
    FACIAL: '👤 Facial',
    CORPORAL: '💪 Corporal',
    NO_INVASIVO: '💉 No Invasivo',
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📋 Plantillas por Procedimiento</h1>
          <p className="text-gray-400">Historias clínicas adaptables por tipo de procedimiento</p>
        </div>

        {/* Grid de Plantillas */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {plantillas.map((plantilla) => (
            <motion.div
              key={plantilla.id}
              whileHover={{ scale: 1.05 }}
              onClick={() => setSelectedPlantilla(plantilla)}
              className={`bg-gradient-to-br ${categoriaColor[plantilla.categoria]} rounded-lg p-6 border border-opacity-30 cursor-pointer shadow-lg transition hover:shadow-2xl`}
            >
              <h3 className="text-white font-bold text-lg mb-2">{plantilla.nombre}</h3>
              <p className="text-white/80 text-sm mb-4">{categoriaNombre[plantilla.categoria]}</p>

              <div className="space-y-2 mb-4">
                <div className="text-xs text-white/70">
                  <p>📋 {plantilla.checklistPrequirurgico.length} items preop</p>
                </div>
                <div className="text-xs text-white/70">
                  <p>⚠️ {plantilla.riesgosAutomaticos.length} riesgos automáticos</p>
                </div>
                <div className="text-xs text-white/70">
                  <p>📅 {plantilla.controlPostop.length} controles</p>
                </div>
              </div>

              <button className="w-full py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded transition">
                Ver Detalle
              </button>
            </motion.div>
          ))}
        </div>

        {/* Detalle de Plantilla */}
        {selectedPlantilla && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 border border-yellow-600/20 rounded-lg p-8 mb-6"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{selectedPlantilla.nombre}</h2>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r ${categoriaColor[selectedPlantilla.categoria]} text-white`}>
                  {categoriaNombre[selectedPlantilla.categoria]}
                </span>
              </div>
              <button
                onClick={() => setSelectedPlantilla(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              {/* Riesgos */}
              <div>
                <h3 className="text-red-400 font-bold text-lg mb-3">⚠️ Riesgos Automáticos</h3>
                <div className="space-y-2">
                  {selectedPlantilla.riesgosAutomaticos.map((riesgo, idx) => (
                    <div key={idx} className="bg-red-500/20 border border-red-500/50 px-3 py-2 rounded text-red-300 text-sm">
                      • {riesgo}
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist Preop */}
              <div>
                <h3 className="text-yellow-400 font-bold text-lg mb-3">📋 Checklist Preop</h3>
                <div className="space-y-2">
                  {selectedPlantilla.checklistPrequirurgico.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 rounded" />
                      <span className="text-gray-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Control Post-Op */}
              <div>
                <h3 className="text-blue-400 font-bold text-lg mb-3">📅 Control Post-Op</h3>
                <div className="space-y-2">
                  {selectedPlantilla.controlPostop.map((control, idx) => (
                    <div key={idx} className="bg-blue-500/20 border border-blue-500/50 px-3 py-2 rounded text-blue-300 text-sm">
                      {control}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contenido Plantilla */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-6">
              <h3 className="text-white font-bold mb-4">📄 Contenido de Historia Clínica</h3>
              <pre className="text-gray-300 text-sm overflow-x-auto bg-slate-600/30 p-4 rounded">
                {selectedPlantilla.contenido}
              </pre>
            </div>

            {/* Acciones */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  setCopiedId(selectedPlantilla.id);
                  setTimeout(() => setCopiedId(null), 2000);
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
              >
                {copiedId === selectedPlantilla.id ? (
                  <>
                    <Check size={20} /> Copiada
                  </>
                ) : (
                  <>
                    <Copy size={20} /> Usar Esta Plantilla
                  </>
                )}
              </motion.button>

              <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2">
                <Edit2 size={20} /> Editar Plantilla
              </button>

              <button className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition">
                📄 Nueva desde esta
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
