import React from 'react';
import { motion } from 'framer-motion';
import { MACRO_MODULES, MacroModule } from '../config/navigation.config';
import { useIam } from '../context/IamContext';
import { ChevronRight } from 'lucide-react';

interface LaunchpadHubProps {
  onSelectModule: (moduleId: string, defaultPageId: string) => void;
  userName?: string;
}

export const LaunchpadHub: React.FC<LaunchpadHubProps> = ({ onSelectModule, userName = 'Profesional' }) => {
  const { canDo } = useIam();

  // Filtrar módulos: solo mostrar si el usuario tiene permiso en al menos un submódulo
  const visibleModules = MACRO_MODULES.filter((module) => {
    return module.submodules.some((sub) => !sub.iamResource || canDo(sub.iamResource, 'VER'));
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-[calc(100vh-80px)] p-6 lg:p-12 flex flex-col justify-center max-w-7xl mx-auto">
      {/* Encabezado de bienvenida */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-2">
          Bienvenido a SARAI, <span className="text-cyan-400">{userName}</span>
        </h1>
        <p className="text-slate-400 text-base lg:text-lg">
          Seleccione el entorno de trabajo para iniciar la jornada clínica o administrativa.
        </p>
      </div>

      {/* Grilla de Macro-Módulos */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {visibleModules.map((mod) => {
          const Icon = mod.icon;
          const defaultSubmodule = mod.submodules.find(s => !s.iamResource || canDo(s.iamResource, 'VER')) || mod.submodules[0];

          return (
            <motion.div
              key={mod.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectModule(mod.id, defaultSubmodule.id)}
              className="cursor-pointer group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md transition-all duration-200 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between h-56"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3.5 rounded-xl border bg-gradient-to-br ${mod.accentColor}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {mod.submodules.length} submódulos
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              <div className="flex items-center text-xs font-medium text-cyan-400 group-hover:translate-x-1 transition-transform">
                <span>Ingresar al módulo</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};