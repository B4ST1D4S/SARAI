import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { leadsService, initializeMockData } from '../services/mockData';

interface Lead {
  id: string;
  nombre: string;
  procedimiento: string;
  etapa: 'COTIZO' | 'AGENDO' | 'OPERO' | 'SEGUIMIENTO';
  valor: number;
  fechaContacto: string;
  proximoContacto: string;
  notas: string;
}

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filterEtapa, setFilterEtapa] = useState<Lead['etapa'] | 'TODOS'>('TODOS');
  const [showNewLead, setShowNewLead] = useState(false);

  // Inicializar datos
  useEffect(() => {
    initializeMockData();
    const allLeads = leadsService.getAll() as Lead[];
    
    // Agregar más leads si no existen
    if (allLeads.length === 1) {
      const hoy = new Date().toISOString().split('T')[0];
      
      leadsService.create({
        nombre: 'Carlos López',
        procedimiento: 'Rinoplastia',
        etapa: 'AGENDO',
        valor: 3500000,
        fechaContacto: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        proximoContacto: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notas: 'Cita confirmada para mayo',
      });

      leadsService.create({
        nombre: 'Patricia Rodríguez',
        procedimiento: 'Mamoplastia',
        etapa: 'OPERO',
        valor: 4200000,
        fechaContacto: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        proximoContacto: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notas: 'En seguimiento post-op día 10',
      });
    }

    setLeads(leadsService.getAll() as Lead[]);
  }, []);

  const etapas: { etapa: Lead['etapa']; color: string; nombre: string }[] = [
    { etapa: 'COTIZO', color: 'from-blue-600 to-blue-800', nombre: '💬 Cotizó' },
    { etapa: 'AGENDO', color: 'from-yellow-600 to-yellow-800', nombre: '📅 Agendó' },
    { etapa: 'OPERO', color: 'from-emerald-600 to-emerald-800', nombre: '✅ Operó' },
    { etapa: 'SEGUIMIENTO', color: 'from-purple-600 to-purple-800', nombre: '📊 Seguimiento' },
  ];

  const filteredLeads = filterEtapa === 'TODOS' ? leads : leads.filter((l) => l.etapa === filterEtapa);

  // Calcular valores por etapa
  const valorPorEtapa = (etapa: Lead['etapa']) =>
    leads.filter((l) => l.etapa === etapa).reduce((sum, l) => sum + l.valor, 0);

  const totalValor = leads.reduce((sum, l) => sum + l.valor, 0);

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">💎 CRM ESTÉTICO - Embudo de Ventas</h1>
          <p className="text-gray-400">Gestión de pacientes desde cotización hasta seguimiento</p>
        </div>

        {/* KPI Principal */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-xl p-8 mb-6 border border-yellow-500/30"
        >
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-yellow-100 text-sm font-semibold mb-2">VALOR TOTAL EN PIPELINE</p>
              <p className="text-4xl font-bold text-white">${(totalValor / 1000000).toFixed(1)}M</p>
            </div>
            <div>
              <p className="text-yellow-100 text-sm font-semibold mb-2">TOTAL OPORTUNIDADES</p>
              <p className="text-4xl font-bold text-white">{leads.length}</p>
            </div>
            <div>
              <p className="text-yellow-100 text-sm font-semibold mb-2">CONVERSIÓN COTIZO→OPERO</p>
              <p className="text-4xl font-bold text-white">
                {Math.round(
                  ((leads.filter((l) => l.etapa === 'OPERO').length / leads.filter((l) => l.etapa === 'COTIZO').length) * 100) || 0
                )}
                %
              </p>
            </div>
          </div>
        </motion.div>

        {/* Embudo Visual */}
        <div className="bg-slate-800 border border-yellow-600/20 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">📊 Embudo de Ventas</h2>

          <div className="space-y-4">
            {etapas.map((item, idx) => {
              const count = leads.filter((l) => l.etapa === item.etapa).length;
              const valor = valorPorEtapa(item.etapa);
              const ancho = Math.max(20, (count / leads.length) * 100);

              return (
                <motion.div
                  key={item.etapa}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="cursor-pointer hover:opacity-80 transition"
                  onClick={() => setFilterEtapa(item.etapa === filterEtapa ? 'TODOS' : item.etapa)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-bold flex items-center gap-2">
                      {item.nombre}
                      <span className="text-sm bg-slate-700 px-2 py-1 rounded">{count} clientes</span>
                    </h3>
                    <span className="text-yellow-400 font-bold">${(valor / 1000000).toFixed(1)}M</span>
                  </div>

                  <div className={`bg-gradient-to-r ${item.color} rounded-lg h-12 flex items-center justify-center text-white font-bold transition`}>
                    {Math.round(ancho)}%
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Tabla de Leads */}
        <div className="bg-slate-800 border border-yellow-600/20 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">📋 Leads Activos</h2>
            <button
              onClick={() => setShowNewLead(!showNewLead)}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition"
            >
              + Nuevo Lead
            </button>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setFilterEtapa('TODOS')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterEtapa === 'TODOS'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              Todos
            </button>
            {etapas.map((item) => (
              <button
                key={item.etapa}
                onClick={() => setFilterEtapa(item.etapa)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterEtapa === item.etapa
                    ? 'bg-yellow-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                {item.nombre}
              </button>
            ))}
          </div>

          {/* Cards de Leads */}
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <motion.div
                key={lead.id}
                whileHover={{ scale: 1.01 }}
                className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:border-yellow-600/50 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">{lead.nombre}</h3>
                    <p className="text-gray-400 text-sm">{lead.procedimiento}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold text-lg">${(lead.valor / 1000000).toFixed(1)}M</p>
                    <p className="text-gray-400 text-xs">Cotización</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm text-gray-300 mb-3">
                  <span>📅 Contacto: {lead.fechaContacto}</span>
                  <span>⏰ Próximo: {lead.proximoContacto}</span>
                  <span className="text-right">
                    <span className="px-2 py-1 bg-slate-600 rounded text-xs font-semibold">
                      {etapas.find((e) => e.etapa === lead.etapa)?.nombre}
                    </span>
                  </span>
                </div>

                {lead.notas && <p className="text-gray-400 text-sm bg-slate-600/30 p-2 rounded mb-3 italic">📝 {lead.notas}</p>}

                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition flex items-center justify-center gap-2">
                    <MessageCircle size={16} /> WhatsApp
                  </button>
                  <button className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded transition">
                    → Siguiente Etapa
                  </button>
                  <button className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded transition">
                    ✎ Editar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Campañas */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-lg p-4 border border-pink-500/30 cursor-pointer"
          >
            <div className="text-pink-200 font-semibold mb-2">🎂 Cumpleaños</div>
            <p className="text-white text-sm mb-4">Contactar pacientes el mes de su cumpleaños con ofertas especiales</p>
            <button className="w-full py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded transition">
              Ver Próximos
            </button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-4 border border-blue-500/30 cursor-pointer"
          >
            <div className="text-blue-200 font-semibold mb-2">🔄 Retoques</div>
            <p className="text-white text-sm mb-4">Campañas de retoques a pacientes post-operados 6+ meses</p>
            <button className="w-full py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded transition">
              Enviar Campaña
            </button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-4 border border-purple-500/30 cursor-pointer"
          >
            <div className="text-purple-200 font-semibold mb-2">📢 Referidos</div>
            <p className="text-white text-sm mb-4">Programa de referidos - Pacientes traen amigos/familia</p>
            <button className="w-full py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded transition">
              Activar
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
