import { useEffect, useState } from 'react';
import { ProcedimientoCUPS } from '../../types/index';

interface SelectorProcedimientoProps {
  onSeleccionar: (procedimiento: ProcedimientoCUPS) => void;
  onCancelar?: () => void;
}

/**
 * Componente para seleccionar un procedimiento CUPS
 * Carga dinámicamente todos los procedimientos desde la API
 * Permite filtrar por categoría y búsqueda
 */
export const SelectorProcedimiento: React.FC<SelectorProcedimientoProps> = ({
  onSeleccionar,
  onCancelar,
}) => {
  const [procedimientos, setProcedimientos] = useState<ProcedimientoCUPS[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');

  // Obtener procedimientos disponibles
  useEffect(() => {
    cargarProcedimientos();
  }, []);

  const cargarProcedimientos = async () => {
    try {
      setCargando(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/cups/procedimientos`);

      if (!response.ok) {
        throw new Error('Error al cargar procedimientos');
      }

      const datos: ProcedimientoCUPS[] = await response.json();
      setProcedimientos(datos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  // Filtrar procedimientos
  const procedimientosFiltrados = procedimientos.filter((proc) => {
    const coincideBusqueda =
      proc.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      proc.codigoCUPS.includes(busqueda);

    const coincideCategoria = !filtroCategoria || proc.tipoCategoria === filtroCategoria;

    return coincideBusqueda && coincideCategoria;
  });

  // Obtener categorías únicas
  const categorias = [...new Set(procedimientos.map((p) => p.tipoCategoria))];

  if (cargando) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando procedimientos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">❌ Error: {error}</p>
        <button
          onClick={cargarProcedimientos}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Seleccionar Procedimiento</h2>
        <p className="text-gray-600 mt-1">Elige el procedimiento a realizar</p>
      </div>

      {/* Filtros */}
      <div className="space-y-4">
        {/* Búsqueda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔍 Buscar procedimiento
          </label>
          <input
            type="text"
            placeholder="Nombre o código CUPS..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filtro por categoría */}
        {categorias.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📂 Categoría
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFiltroCategoria('')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !filtroCategoria
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFiltroCategoria(cat)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filtroCategoria === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista de procedimientos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {procedimientosFiltrados.length === 0 ? (
          <div className="col-span-2 text-center py-8">
            <p className="text-gray-600">No se encontraron procedimientos</p>
          </div>
        ) : (
          procedimientosFiltrados.map((proc) => (
            <button
              key={proc.id}
              onClick={() => onSeleccionar(proc)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                    {proc.nombre}
                  </h3>
                  <p className="text-sm text-gray-500">CUPS: {proc.codigoCUPS}</p>
                </div>
                <span className="text-2xl">💉</span>
              </div>

              {/* Descripción */}
              {proc.descripcion && (
                <p className="text-sm text-gray-600 mb-3">{proc.descripcion}</p>
              )}

              {/* Info tags */}
              <div className="flex flex-wrap gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    proc.tipoCategoria === 'Facial'
                      ? 'bg-purple-100 text-purple-700'
                      : proc.tipoCategoria === 'Corporal'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {proc.tipoCategoria}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    proc.riesgoNivel === 'Bajo'
                      ? 'bg-green-100 text-green-700'
                      : proc.riesgoNivel === 'Medio'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  Riesgo: {proc.riesgoNivel}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                  {proc.diasSeguimiento} días seguimiento
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4 pt-4 border-t">
        <button
          onClick={onCancelar}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default SelectorProcedimiento;
