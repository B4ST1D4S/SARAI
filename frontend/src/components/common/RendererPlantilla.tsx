import { useEffect, useState } from 'react';
import { PlantillaTemplate } from '../../types/index';
import { motion } from 'framer-motion';

interface Field {
  id: string;
  label: string;
  tipo: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'radio';
  opciones?: string[];
  requerido?: boolean;
  placeholder?: string;
}

interface Seccion {
  id: string;
  nombre: string;
  campos: Field[];
}

interface RendererPlantillaProps {
  codigoCUPS: string;
  tipo?: string;
  onDatosCapturados: (datos: any) => void;
  cargandoPlantilla?: boolean;
}

/**
 * Componente que carga y renderiza dinámicamente una plantilla
 * desde la API, generando un formulario completamente personalizable
 */
export const RendererPlantilla: React.FC<RendererPlantillaProps> = ({
  codigoCUPS,
  tipo = 'historia-clinica',
  onDatosCapturados,
  cargandoPlantilla = false,
}) => {
  const [plantilla, setPlantilla] = useState<PlantillaTemplate | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datosFormulario, setDatosFormulario] = useState<Record<string, any>>({});

  // Cargar plantilla desde API
  useEffect(() => {
    cargarPlantilla();
  }, [codigoCUPS, tipo]);

  const cargarPlantilla = async () => {
    try {
      setCargando(true);
      setError(null);

      const url = new URL(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/cups/plantillas`);
      url.searchParams.append('cups', codigoCUPS);
      url.searchParams.append('tipo', tipo);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error('Error al cargar plantilla');
      }

      const datos: PlantillaTemplate[] = await response.json();

      if (datos.length === 0) {
        throw new Error('No se encontró plantilla para este procedimiento');
      }

      // Tomar la primera plantilla del tipo solicitado
      setPlantilla(datos[0]);

      // Inicializar datos vacíos para cada campo
      const datosIniciales: Record<string, any> = {};
      (datos[0].seccionesJSON as Seccion[]).forEach((seccion) => {
        seccion.campos.forEach((campo) => {
          if (campo.tipo === 'checkbox') {
            datosIniciales[campo.id] = [];
          } else {
            datosIniciales[campo.id] = '';
          }
        });
      });
      setDatosFormulario(datosIniciales);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  const manejarCambio = (fieldId: string, valor: any) => {
    setDatosFormulario((prev) => ({
      ...prev,
      [fieldId]: valor,
    }));
  };

  const manejarCheckbox = (fieldId: string, valor: string) => {
    setDatosFormulario((prev) => {
      const actual = prev[fieldId] || [];
      if (actual.includes(valor)) {
        return { ...prev, [fieldId]: actual.filter((v: string) => v !== valor) };
      } else {
        return { ...prev, [fieldId]: [...actual, valor] };
      }
    });
  };

  const manejarEnvio = () => {
    // Validar campos requeridos
    if (plantilla) {
      const seccionesJSON = plantilla.seccionesJSON as Seccion[];
      for (const seccion of seccionesJSON) {
        for (const campo of seccion.campos) {
          if (campo.requerido && !datosFormulario[campo.id]) {
            setError(`El campo "${campo.label}" es requerido`);
            return;
          }
        }
      }
    }

    // Enviar datos
    onDatosCapturados({
      plantillaId: plantilla?.id,
      codigoCUPS,
      tipo,
      datos: datosFormulario,
    });
  };

  if (cargando || cargandoPlantilla) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando plantilla...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">❌ Error: {error}</p>
        <button
          onClick={cargarPlantilla}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!plantilla) {
    return <div className="p-4 text-gray-600">No hay plantilla disponible</div>;
  }

  const seccionesJSON = plantilla.seccionesJSON as Seccion[];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          {plantilla.nombre}
        </h2>
        {plantilla.descripcion && <p className="text-gray-600 mt-1">{plantilla.descripcion}</p>}
      </div>

      {/* Secciones del formulario */}
      {seccionesJSON.map((seccion, idx) => (
        <motion.div
          key={seccion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 transition-colors"
        >
          {/* Título de sección */}
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">📋</span>
            <h3 className="text-lg font-semibold text-gray-900">{seccion.nombre}</h3>
          </div>

          {/* Campos */}
          <div className="space-y-4">
            {seccion.campos.map((campo) => (
              <div key={campo.id}>
                {/* Label */}
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {campo.label}
                  {campo.requerido && <span className="text-red-600 ml-1">*</span>}
                </label>

                {/* Campo según tipo */}
                {campo.tipo === 'text' && (
                  <input
                    type="text"
                    placeholder={campo.placeholder}
                    value={datosFormulario[campo.id] || ''}
                    onChange={(e) => manejarCambio(campo.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}

                {campo.tipo === 'textarea' && (
                  <textarea
                    placeholder={campo.placeholder}
                    value={datosFormulario[campo.id] || ''}
                    onChange={(e) => manejarCambio(campo.id, e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}

                {campo.tipo === 'number' && (
                  <input
                    type="number"
                    placeholder={campo.placeholder}
                    value={datosFormulario[campo.id] || ''}
                    onChange={(e) => manejarCambio(campo.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}

                {campo.tipo === 'date' && (
                  <input
                    type="date"
                    value={datosFormulario[campo.id] || ''}
                    onChange={(e) => manejarCambio(campo.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}

                {campo.tipo === 'select' && (
                  <select
                    value={datosFormulario[campo.id] || ''}
                    onChange={(e) => manejarCambio(campo.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    {campo.opciones?.map((opcion) => (
                      <option key={opcion} value={opcion}>
                        {opcion}
                      </option>
                    ))}
                  </select>
                )}

                {campo.tipo === 'radio' && (
                  <div className="space-y-2">
                    {campo.opciones?.map((opcion) => (
                      <label key={opcion} className="flex items-center">
                        <input
                          type="radio"
                          name={campo.id}
                          value={opcion}
                          checked={datosFormulario[campo.id] === opcion}
                          onChange={(e) => manejarCambio(campo.id, e.target.value)}
                          className="mr-2"
                        />
                        <span>{opcion}</span>
                      </label>
                    ))}
                  </div>
                )}

                {campo.tipo === 'checkbox' && (
                  <div className="space-y-2">
                    {campo.opciones?.map((opcion) => (
                      <label key={opcion} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={(datosFormulario[campo.id] || []).includes(opcion)}
                          onChange={() => manejarCheckbox(campo.id, opcion)}
                          className="mr-2"
                        />
                        <span>{opcion}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Botones de acción */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-red-800">{error}</p>
        </motion.div>
      )}

      <div className="flex gap-4 pt-4 border-t">
        <button
          onClick={manejarEnvio}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          ✅ Guardar Datos
        </button>
      </div>
    </motion.div>
  );
};

export default RendererPlantilla;
