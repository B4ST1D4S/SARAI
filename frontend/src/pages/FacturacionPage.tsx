import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CreditCard, CheckCircle } from 'lucide-react';
import { facturasService, initializeMockData } from '../services/mockData';

interface Factura {
  id: string;
  paciente: string;
  procedimiento: string;
  fecha: string;
  valor: number;
  estado: 'PENDIENTE' | 'PAGADA' | 'PARCIAL';
  cuotas: { numero: number; valor: number; estado: 'PAGADA' | 'PENDIENTE'; fecha?: string }[];
  notas: string;
}

export default function FacturacionPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [showNewFactura, setShowNewFactura] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);

  // Inicializar datos
  useEffect(() => {
    initializeMockData();
    setFacturas(facturasService.getAll() as Factura[]);
  }, []);

  const totalIngresos = facturas.filter((f) => f.estado === 'PAGADA').reduce((sum, f) => sum + f.valor, 0);
  const totalPendiente = facturas
    .filter((f) => f.estado === 'PENDIENTE' || f.estado === 'PARCIAL')
    .reduce((sum, f) => sum + f.cuotas.filter((c) => c.estado === 'PENDIENTE').reduce((s, c) => s + c.valor, 0), 0);

  const getEstadoColor = (estado: Factura['estado']) => {
    switch (estado) {
      case 'PAGADA':
        return 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
      case 'PARCIAL':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
      case 'PENDIENTE':
        return 'bg-red-500/20 border-red-500 text-red-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">💳 Facturación</h1>
            <p className="text-gray-400 text-xs sm:text-sm">Gestión de cobros, cuotas y paquetes</p>
          </div>
          <button
            onClick={() => setShowNewFactura(!showNewFactura)}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold text-sm transition self-start sm:self-auto"
          >
            + Nueva Factura
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 sm:mb-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg p-4 border border-emerald-500/30"
          >
            <div className="text-emerald-200 text-sm font-semibold mb-2">Ingresos Pagados</div>
            <div className="text-3xl font-bold text-white">${(totalIngresos / 1000000).toFixed(1)}M</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-red-600 to-red-800 rounded-lg p-4 border border-red-500/30"
          >
            <div className="text-red-200 text-sm font-semibold mb-2">Pendiente de Cobro</div>
            <div className="text-3xl font-bold text-white">${(totalPendiente / 1000000).toFixed(1)}M</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-4 border border-blue-500/30"
          >
            <div className="text-blue-200 text-sm font-semibold mb-2">Total Facturas</div>
            <div className="text-3xl font-bold text-white">{facturas.length}</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-lg p-4 border border-yellow-500/30"
          >
            <div className="text-yellow-200 text-sm font-semibold mb-2">% Cobrado</div>
            <div className="text-3xl font-bold text-white">
              {Math.round(
                (totalIngresos / (totalIngresos + totalPendiente)) * 100 || 0
              )}
              %
            </div>
          </motion.div>
        </div>

        {/* Form Nueva Factura */}
        {showNewFactura && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 border border-yellow-600/20 rounded-lg p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Nueva Factura</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Paciente"
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
              />
              <input
                type="text"
                placeholder="Procedimiento"
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
              />
              <input
                type="number"
                placeholder="Valor ($)"
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500"
              />
              <select className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                <option>1 Cuota</option>
                <option>2 Cuotas</option>
                <option>3 Cuotas</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition">
                Crear
              </button>
              <button
                onClick={() => setShowNewFactura(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}

        {/* Tabla de Facturas */}
        <div className="bg-slate-800 border border-yellow-600/20 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">📋 Facturas</h2>

          <div className="space-y-3">
            {facturas.map((factura) => (
              <motion.div
                key={factura.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedFactura(factura)}
                className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 cursor-pointer hover:border-yellow-600/50 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {factura.id} - {factura.paciente}
                    </h3>
                    <p className="text-gray-400 text-sm">{factura.procedimiento}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold text-lg">${(factura.valor / 1000000).toFixed(1)}M</p>
                    <span className={`px-3 py-1 rounded-full border text-xs font-semibold inline-block ${getEstadoColor(factura.estado)}`}>
                      {factura.estado}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-300">
                  <span>📅 {factura.fecha}</span>
                  <span>{factura.cuotas.length} cuota(s)</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detalle Factura */}
        {selectedFactura && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 border border-yellow-600/30 rounded-lg p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">📄 Detalle: {selectedFactura.id}</h2>
              <button
                onClick={() => setSelectedFactura(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-gray-400 text-sm font-semibold mb-2">INFORMACIÓN</h3>
                <div className="space-y-2 text-white">
                  <p>
                    <span className="text-gray-400">Paciente:</span> {selectedFactura.paciente}
                  </p>
                  <p>
                    <span className="text-gray-400">Procedimiento:</span> {selectedFactura.procedimiento}
                  </p>
                  <p>
                    <span className="text-gray-400">Fecha:</span> {selectedFactura.fecha}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-gray-400 text-sm font-semibold mb-2">TOTALES</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-white">
                    <span>Subtotal:</span>
                    <span className="font-bold">${(selectedFactura.valor / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>Impuestos:</span>
                    <span className="font-bold">${((selectedFactura.valor * 0.19) / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="border-t border-slate-600 pt-2 flex justify-between text-yellow-400 font-bold">
                    <span>TOTAL:</span>
                    <span>${((selectedFactura.valor * 1.19) / 1000000).toFixed(1)}M</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cuotas */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
              <h3 className="text-white font-bold mb-4">Cuotas de Pago</h3>
              <div className="space-y-2">
                {selectedFactura.cuotas.map((cuota) => (
                  <motion.div
                    key={cuota.numero}
                    className={`p-3 rounded-lg border flex justify-between items-center ${
                      cuota.estado === 'PAGADA'
                        ? 'bg-emerald-500/20 border-emerald-500'
                        : 'bg-red-500/20 border-red-500'
                    }`}
                  >
                    <div>
                      <p className="text-white font-semibold">Cuota {cuota.numero}</p>
                      {cuota.fecha && <p className="text-gray-300 text-xs">Pagada: {cuota.fecha}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">${(cuota.valor / 1000000).toFixed(1)}M</p>
                      <p className={`text-xs ${cuota.estado === 'PAGADA' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {cuota.estado}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {selectedFactura.estado !== 'PAGADA' && (
                <button className="w-full mt-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition">
                  💳 Registrar Pago
                </button>
              )}
            </div>

            {selectedFactura.notas && (
              <div className="mt-4 bg-slate-700/30 border border-slate-600 rounded p-3">
                <p className="text-gray-300 text-sm">
                  <span className="text-gray-400 font-semibold">Notas:</span> {selectedFactura.notas}
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
                📥 Descargar PDF
              </button>
              <button className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition">
                📧 Enviar por Email
              </button>
            </div>
          </motion.div>
        )}

        {/* Paquetes Especiales */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">📦 Paquetes Especiales</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { nombre: 'Liposucción + Abdominoplastia', valor: 9000000, ahorro: 1000000 },
              { nombre: 'Rinoplastia + Mentoplastia', valor: 6500000, ahorro: 500000 },
              { nombre: 'Mamoplastia + Liposucción', valor: 8500000, ahorro: 800000 },
            ].map((paquete, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-4 border border-purple-500/30"
              >
                <h3 className="text-white font-bold mb-2">{paquete.nombre}</h3>
                <div className="mb-3">
                  <p className="text-purple-200 text-sm">Valor especial</p>
                  <p className="text-2xl font-bold text-white">${(paquete.valor / 1000000).toFixed(1)}M</p>
                  <p className="text-emerald-300 text-xs">Ahorro: ${(paquete.ahorro / 1000000).toFixed(1)}M</p>
                </div>
                <button className="w-full py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded transition">
                  Activar
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
