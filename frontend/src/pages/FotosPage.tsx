import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, ZoomIn, Trash2 } from 'lucide-react';

export default function FotosPage() {
  const [fotos, setFotos] = useState<{ antes?: File; despues?: File; fecha: Date }>({
    fecha: new Date(),
  });
  const [galeriaFotos, setGaleriaFotos] = useState<any[]>([]);
  const [selectedFoto, setSelectedFoto] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'antes' | 'despues') => {
    const file = e.target.files?.[0];
    if (file) {
      setFotos(prev => ({
        ...prev,
        [tipo]: file,
      }));

      // Simular agregación a galería
      const reader = new FileReader();
      reader.onload = (event) => {
        const newFoto = {
          id: Date.now(),
          tipo,
          src: event.target?.result,
          fecha: new Date(),
        };
        setGaleriaFotos(prev => [...prev, newFoto]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComparador = () => {
    if (fotos.antes && fotos.despues) {
      // Aquí iría la lógica del comparador de slider
      alert('Comparador visual activado');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 sm:mb-8"
        >
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">Fotos Clínicas</h1>
          <p className="text-gray-400 text-xs sm:text-sm">
            Comparador visual antes y después
          </p>
        </motion.div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-5 sm:mb-8">
          {/* Subir Antes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border-2 border-dashed border-blue-500/30 rounded-xl p-8 hover:border-blue-500/60 transition cursor-pointer"
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFotoUpload(e, 'antes')}
              className="hidden"
              id="input-antes"
            />
            <label
              htmlFor="input-antes"
              className="flex flex-col items-center cursor-pointer"
            >
              <div className="bg-blue-500/20 p-4 rounded-lg mb-4">
                <Upload className="text-blue-400" size={32} />
              </div>
              <p className="text-white font-semibold mb-1">Foto ANTES</p>
              <p className="text-gray-400 text-sm text-center">
                {fotos.antes ? fotos.antes.name : 'Haz clic o arrastra imagen'}
              </p>
            </label>

            {fotos.antes && (
              <div className="mt-4">
                <img
                  src={URL.createObjectURL(fotos.antes)}
                  alt="Antes"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </motion.div>

          {/* Subir Después */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 border-2 border-dashed border-emerald-500/30 rounded-xl p-8 hover:border-emerald-500/60 transition cursor-pointer"
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFotoUpload(e, 'despues')}
              className="hidden"
              id="input-despues"
            />
            <label
              htmlFor="input-despues"
              className="flex flex-col items-center cursor-pointer"
            >
              <div className="bg-emerald-500/20 p-4 rounded-lg mb-4">
                <Upload className="text-emerald-400" size={32} />
              </div>
              <p className="text-white font-semibold mb-1">Foto DESPUÉS</p>
              <p className="text-gray-400 text-sm text-center">
                {fotos.despues ? fotos.despues.name : 'Haz clic o arrastra imagen'}
              </p>
            </label>

            {fotos.despues && (
              <div className="mt-4">
                <img
                  src={URL.createObjectURL(fotos.despues)}
                  alt="Después"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </motion.div>
        </div>

        {/* Botones de acción */}
        {fotos.antes && fotos.despues && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 mb-8 justify-center"
          >
            <button
              onClick={handleComparador}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <ZoomIn size={20} />
              Activar Comparador
            </button>
            <button
              onClick={() =>
                setFotos({
                  fecha: new Date(),
                })
              }
              className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-8 py-3 rounded-lg font-semibold transition flex items-center gap-2 border border-red-500/30"
            >
              <X size={20} />
              Limpiar
            </button>
          </motion.div>
        )}

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6">Timeline por Días</h2>

          <div className="space-y-4">
            {[1, 3, 7, 15, 30].map((dia) => (
              <div key={dia} className="flex items-center gap-4">
                <div className="bg-yellow-600/20 px-4 py-2 rounded-lg border border-yellow-600/30">
                  <p className="text-yellow-400 font-semibold text-sm">Día {dia}</p>
                </div>
                <div className="flex-1 bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                  <p className="text-gray-400 text-sm">
                    {dia === 1 && 'Dolor / Drenaje'}
                    {dia === 3 && 'Control de foto'}
                    {dia === 7 && 'Primera evaluación'}
                    {dia === 15 && 'Control de evolución'}
                    {dia === 30 && 'Evaluación final'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Galería */}
        {galeriaFotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <h2 className="text-xl font-bold text-white mb-6">Galería</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {galeriaFotos.map((foto) => (
                <motion.div
                  key={foto.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedFoto(foto.src)}
                >
                  <img
                    src={foto.src}
                    alt={`${foto.tipo}-${foto.fecha.toLocaleDateString()}`}
                    className="w-full h-48 object-cover rounded-lg border border-slate-600/50 group-hover:border-yellow-600/50 transition"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-2">
                    <button className="bg-blue-600 p-2 rounded-lg hover:bg-blue-700">
                      <ZoomIn className="text-white" size={20} />
                    </button>
                    <button className="bg-red-600 p-2 rounded-lg hover:bg-red-700">
                      <Trash2 className="text-white" size={20} />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                    {foto.tipo.toUpperCase()}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Modal de zoom */}
        {selectedFoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedFoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedFoto}
                alt="Zoom"
                className="w-full max-h-[90vh] object-contain rounded-lg"
                style={{ transform: `scale(${zoomLevel})` }}
              />
              <button
                onClick={() => setSelectedFoto(null)}
                className="absolute top-4 right-4 bg-red-600 p-2 rounded-lg hover:bg-red-700"
              >
                <X className="text-white" size={24} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
