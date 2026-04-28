import { useState } from 'react';
import { motion } from 'framer-motion';

interface Mark {
  id: string;
  posicionX: number;
  posicionY: number;
  intensidad: number;
  zona: string;
  tipo: string;
}

interface Body3DElegantProps {
  marks?: Mark[];
  onMarkClick?: (mark: Mark) => void;
  mode?: 'VISTA' | 'EDITAR' | 'COMPARAR';
  selectedTipo?: string;
  intensidad?: number;
  onBodyZoneClick?: (x: number, y: number, zona: string) => void;
}

export function Body3DElegant({ 
  marks = [], 
  onMarkClick,
  mode = 'VISTA',
  selectedTipo = 'IMPLANTE_MAMARIO',
  intensidad = 5,
  onBodyZoneClick
}: Body3DElegantProps) {
  const [view, setView] = useState<'frontal' | 'lateral' | 'posterior'>('frontal');
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [selectedMark, setSelectedMark] = useState<string | null>(null);

  const getProcedureColor = (tipo: string) => {
    const colors: Record<string, { fill: string; text: string }> = {
      IMPLANTE_MAMARIO: { fill: '#ec4899', text: 'Aumento Mamario' },
      LIPOSUCCION: { fill: '#06b6d4', text: 'Liposucción' },
      LIFTING_FACIAL: { fill: '#f59e0b', text: 'Lifting Facial' },
      RINOPLASTIA: { fill: '#8b5cf6', text: 'Rinoplastia' },
      ABDOMINOPLASTIA: { fill: '#10b981', text: 'Abdominoplastia' },
      BLEFAROPLASTIA: { fill: '#3b82f6', text: 'Blefaroplastia' },
      MENTOPLASTIA: { fill: '#6366f1', text: 'Mentoplastia' },
      OTOPLASTIA: { fill: '#ec4899', text: 'Otoplastia' },
      BICHECTOMIA: { fill: '#f97316', text: 'Bichectomía' },
      CELULITIS_EDEMA: { fill: '#ef4444', text: 'Edema' },
      CICATRIZ: { fill: '#d4af37', text: 'Cicatriz' },
      HEMATOMA: { fill: '#7c2d12', text: 'Hematoma' },
      SEGUIMIENTO: { fill: '#06b6d4', text: 'Seguimiento' },
    };
    return colors[tipo] || { fill: '#a78bfa', text: 'Procedimiento' };
  };

  const renderFrontalView = () => {
    const detectZoneName = (x: number, y: number) => {
      // Detectar zona basada en coordenadas del SVG (viewBox 0-300, 0-600)
      if (y < 90) {
        return x < 150 ? 'Cabeza/Frente' : 'Cabeza/Frente';
      }
      if (y < 110) {
        return 'Cuello';
      }
      if (y < 170) {
        return x < 130 ? 'Mama Izquierda' : 'Mama Derecha';
      }
      if (y < 320) {
        if (x < 100) return 'Brazo Izquierdo';
        if (x > 200) return 'Brazo Derecho';
        return 'Torso/Abdomen';
      }
      if (y < 450) {
        return x < 150 ? 'Muslo Izquierdo' : 'Muslo Derecho';
      }
      return x < 150 ? 'Pantorrilla Izquierda' : 'Pantorrilla Derecha';
    };

    const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
      if (mode !== 'EDITAR') return;

      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      
      // Calcular coordenadas en el viewport
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      // Convertir a coordenadas del SVG viewBox (0-300, 0-600)
      const svgX = (offsetX / rect.width) * 300;
      const svgY = (offsetY / rect.height) * 600;
      
      // Detectar zona automáticamente
      const detectedZone = detectZoneName(svgX, svgY);
      
      // Llamar al handler con las coordenadas exactas
      onBodyZoneClick?.(svgX, svgY, detectedZone);
    };

    return (
    <svg 
      viewBox="0 0 300 600" 
      className="w-full h-auto max-h-96" 
      data-mode={mode} 
      style={{ cursor: mode === 'EDITAR' ? 'crosshair' : 'default', pointerEvents: 'auto' }}
      onClick={handleSvgClick}
    >
      <defs>
        {/* Gradientes modernos y realistas */}
        <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%">
          <stop offset="0%" stopColor="#f5d5e3" />
          <stop offset="25%" stopColor="#fae8f3" />
          <stop offset="50%" stopColor="#f8dce6" />
          <stop offset="75%" stopColor="#f0ccd9" />
          <stop offset="100%" stopColor="#e8c0cc" />
        </linearGradient>
        <linearGradient id="chestGrad" x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#fef3fb" />
          <stop offset="30%" stopColor="#fce8f3" />
          <stop offset="60%" stopColor="#f5d5e3" />
          <stop offset="100%" stopColor="#e0b5cb" />
        </linearGradient>
        <radialGradient id="breastGrad" cx="35%" cy="25%" r="60%">
          <stop offset="0%" stopColor="#fef3fb" />
          <stop offset="40%" stopColor="#fce8f3" />
          <stop offset="70%" stopColor="#f5d5e3" />
          <stop offset="100%" stopColor="#d9a8bf" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* CABEZA */}
      <ellipse cx="150" cy="48" rx="32" ry="38" fill="url(#skinGrad)" stroke="#d4959f" strokeWidth="1.2" />
      <circle cx="138" cy="42" r="4.5" fill="#2d1f1a" />
      <circle cx="162" cy="42" r="4.5" fill="#2d1f1a" />
      <path d="M 150 48 L 150 58" stroke="#d4959f" strokeWidth="1" opacity="0.7" />
      <path d="M 145 60 Q 150 62 155 60" stroke="#d4959f" strokeWidth="0.8" opacity="0.6" fill="none" />

      {/* CUELLO */}
      <rect x="140" y="84" width="20" height="14" fill="url(#skinGrad)" stroke="#d4959f" strokeWidth="1" />

      {/* TORSO */}
      <ellipse cx="150" cy="135" rx="52" ry="70" fill="url(#chestGrad)" stroke="#d4959f" strokeWidth="1.2" />

      {/* MAMAS - Anatomía detallada */}
      <g>
        {/* Mama izquierda */}
        <ellipse cx="105" cy="130" rx="38" ry="55" fill="url(#breastGrad)" stroke="#d4959f" strokeWidth="1.2" />
        <ellipse cx="95" cy="110" rx="18" ry="20" fill="#fce8f3" opacity="0.7" />
        {/* Sombra bajo mama */}
        <ellipse cx="105" cy="160" rx="35" ry="15" fill="#d4959f" opacity="0.25" />

        {/* Mama derecha */}
        <ellipse cx="195" cy="130" rx="38" ry="55" fill="url(#breastGrad)" stroke="#d4959f" strokeWidth="1.2" />
        <ellipse cx="205" cy="110" rx="18" ry="20" fill="#fce8f3" opacity="0.7" />
        {/* Sombra bajo mama */}
        <ellipse cx="195" cy="160" rx="35" ry="15" fill="#d4959f" opacity="0.25" />
      </g>

      {/* LÍNEA CENTRAL Y COSTILLAS */}
      <line x1="150" y1="85" x2="150" y2="200" stroke="#d4959f" strokeWidth="0.9" opacity="0.5" />
      <path d="M 120 115 Q 130 125 135 145" stroke="#d4959f" strokeWidth="0.7" fill="none" opacity="0.4" />
      <path d="M 180 115 Q 170 125 165 145" stroke="#d4959f" strokeWidth="0.7" fill="none" opacity="0.4" />

      {/* ABDOMEN */}
      <ellipse cx="150" cy="275" rx="65" ry="75" fill="url(#skinGrad)" stroke="#d4959f" strokeWidth="1.2" />

      {/* ABDOMINALES - Definición realista */}
      <line x1="150" y1="210" x2="150" y2="340" stroke="#d4959f" strokeWidth="0.8" opacity="0.4" />
      <path d="M 130 230 Q 150 232 170 230" stroke="#d4959f" strokeWidth="0.7" fill="none" opacity="0.3" />
      <path d="M 125 270 Q 150 273 175 270" stroke="#d4959f" strokeWidth="0.7" fill="none" opacity="0.3" />
      <path d="M 120 310 Q 150 313 180 310" stroke="#d4959f" strokeWidth="0.7" fill="none" opacity="0.3" />

      {/* SOMBRA LATERAL DEL ABDOMEN */}
      <path d="M 95 260 Q 90 290 100 330" stroke="#d4959f" strokeWidth="1" fill="none" opacity="0.35" />
      <path d="M 205 260 Q 210 290 200 330" stroke="#d4959f" strokeWidth="1" fill="none" opacity="0.35" />

      {/* BRAZOS */}
      <g>
        {/* Brazo izquierdo */}
        <ellipse cx="75" cy="105" rx="26" ry="23" fill="url(#skinGrad)" stroke="#d4959f" strokeWidth="1.1" opacity="0.9" />
        <ellipse cx="40" cy="155" rx="22" ry="52" fill="url(#skinGrad)" stroke="#d4959f" strokeWidth="1.1" opacity="0.9" />
        <line x1="40" y1="160" x2="40" y2="200" stroke="#d4959f" strokeWidth="0.6" fill="none" opacity="0.35" />

        {/* Brazo derecho */}
        <ellipse cx="225" cy="105" rx="26" ry="23" fill="url(#skinGrad)" stroke="#d4959f" strokeWidth="1.1" opacity="0.9" />
        <ellipse cx="260" cy="155" rx="22" ry="52" fill="url(#skinGrad)" stroke="#d4959f" strokeWidth="1.1" opacity="0.9" />
        <line x1="260" y1="160" x2="260" y2="200" stroke="#d4959f" strokeWidth="0.6" fill="none" opacity="0.35" />
      </g>

      {/* CADERAS Y MUSLOS */}
      <g>
        {/* Cadera izquierda */}
        <ellipse cx="100" cy="360" rx="48" ry="42" fill="url(#skinGrad)" stroke="#d4959f" strokeWidth="1.1" opacity="0.9" />
        {/* Muslo izquierdo */}
        <ellipse cx="100" cy="465" rx="42" ry="68" fill="url(#skinGrad)" stroke="#d4959f" strokeWidth="1.1" />
        <line x1="100" y1="415" x2="100" y2="510" stroke="#d4959f" strokeWidth="0.7" fill="none" opacity="0.35" />

        {/* Cadera derecha */}
        <ellipse cx="200" cy="360" rx="48" ry="42" fill="url(#skinGrad)" stroke="#d4959f" strokeWidth="1.1" opacity="0.9" />
        {/* Muslo derecho */}
        <ellipse cx="200" cy="465" rx="42" ry="68" fill="url(#skinGrad)" stroke="#d4959f" strokeWidth="1.1" />
        <line x1="200" y1="415" x2="200" y2="510" stroke="#d4959f" strokeWidth="0.7" fill="none" opacity="0.35" />
      </g>

      {/* PANTORRILLAS */}
      <ellipse cx="95" cy="545" rx="28" ry="45" fill="url(#skinGrad)" stroke="#d4959f" strokeWidth="1" />
      <ellipse cx="205" cy="545" rx="28" ry="45" fill="url(#skinGrad)" stroke="#d4959f" strokeWidth="1" />

      {/* MARCADORES */}
      {marks.map((mark) => {
        const color = getProcedureColor(mark.tipo);
        const isSelected = selectedMark === mark.id;

        return (
          <g
            key={mark.id}
            onClick={() => {
              setSelectedMark(mark.id);
              onMarkClick?.(mark);
            }}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredZone(mark.id)}
            onMouseLeave={() => setHoveredZone(null)}
          >
            {/* Aura de fondo */}
            <circle
              cx={mark.posicionX}
              cy={mark.posicionY}
              r={24 + mark.intensidad * 1.5}
              fill={color.fill}
              opacity="0.1"
            />

            {/* Círculo principal */}
            <motion.circle
              cx={mark.posicionX}
              cy={mark.posicionY}
              r="14"
              fill={color.fill}
              stroke="white"
              strokeWidth="2.5"
              whileHover={{ r: 18 }}
              animate={{ scale: isSelected ? 1.3 : 1 }}
            />

            {/* Anillo de intensidad */}
            <circle
              cx={mark.posicionX}
              cy={mark.posicionY}
              r={9 * (mark.intensidad / 10)}
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              opacity="0.7"
            />

            {/* Tooltip */}
            {hoveredZone === mark.id && (
              <g>
                <rect
                  x={mark.posicionX + 20}
                  y={mark.posicionY - 30}
                  width="120"
                  height="45"
                  fill="#1e293b"
                  rx="6"
                  stroke={color.fill}
                  strokeWidth="1.5"
                />
                <text
                  x={mark.posicionX + 26}
                  y={mark.posicionY - 14}
                  className="text-xs"
                  fill={color.fill}
                  fontWeight="700"
                >
                  {color.text}
                </text>
                <text
                  x={mark.posicionX + 26}
                  y={mark.posicionY - 2}
                  className="text-xs"
                  fill="#cbd5e1"
                >
                  {mark.zona}
                </text>
                <text
                  x={mark.posicionX + 26}
                  y={mark.posicionY + 10}
                  className="text-xs"
                  fill="#94a3b8"
                >
                  {mark.intensidad}/10
                </text>
              </g>
            )}
          </g>
        );
      })}


    </svg>
    );
  };

  const renderLateralView = () => {
    const detectZoneName = (x: number, y: number) => {
      if (y < 90) return 'Cabeza';
      if (y < 110) return 'Cuello';
      if (y < 170) return 'Pecho/Hombro';
      if (y < 330) return 'Espalda/Torso';
      if (y < 430) return 'Abdomen/Cadera';
      if (y < 530) return 'Muslo';
      return 'Pantorrilla';
    };

    const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
      if (mode !== 'EDITAR') return;

      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      const svgX = (offsetX / rect.width) * 300;
      const svgY = (offsetY / rect.height) * 600;
      
      const detectedZone = detectZoneName(svgX, svgY);
      onBodyZoneClick?.(svgX, svgY, detectedZone);
    };

    return (
    <svg 
      viewBox="0 0 300 600" 
      className="w-full h-auto max-h-96"
      style={{ cursor: mode === 'EDITAR' ? 'crosshair' : 'default', pointerEvents: 'auto' }}
      onClick={handleSvgClick}
    >
      <defs>
        <linearGradient id="latSkinGrad" x1="0%" y1="0%" x2="100%">
          <stop offset="0%" stopColor="#daa7bc" />
          <stop offset="50%" stopColor="#f5d5e3" />
          <stop offset="100%" stopColor="#e8c7d4" />
        </linearGradient>
      </defs>

      {/* PERFIL LATERAL - Realista */}
      <ellipse cx="110" cy="48" rx="32" ry="38" fill="url(#latSkinGrad)" stroke="#d4959f" strokeWidth="1.2" />
      <circle cx="125" cy="45" r="4.5" fill="#2d1f1a" />
      <path d="M 115 80 Q 120 82 115 85" stroke="#d4959f" strokeWidth="0.8" fill="none" opacity="0.6" />

      {/* CUELLO */}
      <rect x="100" y="84" width="18" height="14" fill="url(#latSkinGrad)" stroke="#d4959f" strokeWidth="1" />

      {/* TRAPECIO Y HOMBRO */}
      <ellipse cx="70" cy="108" rx="35" ry="30" fill="url(#latSkinGrad)" stroke="#d4959f" strokeWidth="1.1" />

      {/* PECHO LATERAL */}
      <ellipse cx="125" cy="140" rx="48" ry="65" fill="url(#latSkinGrad)" stroke="#d4959f" strokeWidth="1.1" />
      <path d="M 100 110 Q 115 145 125 175" stroke="#d4959f" strokeWidth="0.8" fill="none" opacity="0.35" />

      {/* ABDOMEN LATERAL */}
      <ellipse cx="135" cy="275" rx="52" ry="80" fill="url(#latSkinGrad)" stroke="#d4959f" strokeWidth="1.1" />
      <line x1="135" y1="210" x2="135" y2="340" stroke="#d4959f" strokeWidth="0.8" fill="none" opacity="0.35" />

      {/* CADERA LATERAL */}
      <ellipse cx="125" cy="365" rx="52" ry="45" fill="url(#latSkinGrad)" stroke="#d4959f" strokeWidth="1.1" opacity="0.9" />

      {/* MUSLO */}
      <ellipse cx="130" cy="470" rx="44" ry="70" fill="url(#latSkinGrad)" stroke="#d4959f" strokeWidth="1.1" />
      <path d="M 130 420 Q 130 470 130 515" stroke="#d4959f" strokeWidth="0.7" fill="none" opacity="0.3" />

      {/* PANTORRILLA */}
      <ellipse cx="130" cy="545" rx="30" ry="42" fill="url(#latSkinGrad)" stroke="#d4959f" strokeWidth="1" />

      {/* BRAZO TRASERO (Sombreado) */}
      <ellipse cx="50" cy="150" rx="20" ry="55" fill="#d4959f" stroke="#d4959f" strokeWidth="1" opacity="0.55" />

      {/* MARCADORES LATERALES */}
      {marks.map((mark) => {
        const color = getProcedureColor(mark.tipo);
        return (
          <g key={`lat-${mark.id}`} onMouseEnter={() => setHoveredZone(mark.id)} onMouseLeave={() => setHoveredZone(null)}>
            <circle cx={mark.posicionX + 35} cy={mark.posicionY} r="13" fill={color.fill} stroke="white" strokeWidth="2" opacity="0.85" />
            {hoveredZone === mark.id && (
              <text x={mark.posicionX + 55} y={mark.posicionY - 5} className="text-xs" fill={color.fill} fontWeight="700">
                {color.text}
              </text>
            )}
          </g>
        );
      })}
    </svg>
    );
  };

  const renderPosteriorView = () => {
    const detectZoneName = (x: number, y: number) => {
      if (y < 90) return 'Cabeza';
      if (y < 110) return 'Cuello';
      if (y < 200) return 'Espalda';
      if (y < 380) return 'Espalda Media/Espalda Baja';
      if (y < 480) return 'Glúteos';
      if (y < 540) return 'Muslos';
      return 'Pantorrillas';
    };

    const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
      if (mode !== 'EDITAR') return;

      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      const svgX = (offsetX / rect.width) * 300;
      const svgY = (offsetY / rect.height) * 600;
      
      const detectedZone = detectZoneName(svgX, svgY);
      onBodyZoneClick?.(svgX, svgY, detectedZone);
    };

    return (
    <svg 
      viewBox="0 0 300 600" 
      className="w-full h-auto max-h-96"
      style={{ cursor: mode === 'EDITAR' ? 'crosshair' : 'default', pointerEvents: 'auto' }}
      onClick={handleSvgClick}
    >
      <defs>
        <linearGradient id="backSkinGrad" x1="100%" y1="0%" x2="0%">
          <stop offset="0%" stopColor="#daa7bc" />
          <stop offset="50%" stopColor="#f5d5e3" />
          <stop offset="100%" stopColor="#e8c7d4" />
        </linearGradient>
      </defs>

      {/* CABEZA POSTERIOR */}
      <ellipse cx="150" cy="48" rx="32" ry="38" fill="url(#backSkinGrad)" stroke="#d4959f" strokeWidth="1.2" />
      <ellipse cx="150" cy="68" rx="30" ry="14" fill="#d4959f" opacity="0.35" />

      {/* CUELLO */}
      <rect x="140" y="84" width="20" height="14" fill="url(#backSkinGrad)" stroke="#d4959f" strokeWidth="1" />

      {/* ESPALDA SUPERIOR - Trapecio */}
      <ellipse cx="150" cy="110" rx="60" ry="32" fill="url(#backSkinGrad)" stroke="#d4959f" strokeWidth="1.1" />
      <line x1="150" y1="85" x2="150" y2="140" stroke="#d4959f" strokeWidth="0.9" opacity="0.4" />

      {/* ESPALDA MEDIA - Lats */}
      <ellipse cx="150" cy="185" rx="65" ry="75" fill="url(#backSkinGrad)" stroke="#d4959f" strokeWidth="1.1" />
      <path d="M 115 155 Q 120 190 125 220" stroke="#d4959f" strokeWidth="0.7" fill="none" opacity="0.35" />
      <path d="M 185 155 Q 180 190 175 220" stroke="#d4959f" strokeWidth="0.7" fill="none" opacity="0.35" />

      {/* GLÚTEOS - Prominencia */}
      <g>
        <ellipse cx="115" cy="370" rx="48" ry="50" fill="url(#backSkinGrad)" stroke="#d4959f" strokeWidth="1.1" />
        <ellipse cx="185" cy="370" rx="48" ry="50" fill="url(#backSkinGrad)" stroke="#d4959f" strokeWidth="1.1" />
        <path d="M 150 395 Q 145 410 140 425" stroke="#d4959f" strokeWidth="0.9" fill="none" opacity="0.45" />
        <path d="M 150 395 Q 155 410 160 425" stroke="#d4959f" strokeWidth="0.9" fill="none" opacity="0.45" />
      </g>

      {/* MUSLOS POSTERIORES */}
      <ellipse cx="115" cy="475" rx="42" ry="70" fill="url(#backSkinGrad)" stroke="#d4959f" strokeWidth="1.1" />
      <ellipse cx="185" cy="475" rx="42" ry="70" fill="url(#backSkinGrad)" stroke="#d4959f" strokeWidth="1.1" />
      <path d="M 115 425 L 115 515" stroke="#d4959f" strokeWidth="0.7" fill="none" opacity="0.3" />
      <path d="M 185 425 L 185 515" stroke="#d4959f" strokeWidth="0.7" fill="none" opacity="0.3" />

      {/* PANTORRILLAS */}
      <ellipse cx="115" cy="545" rx="30" ry="42" fill="url(#backSkinGrad)" stroke="#d4959f" strokeWidth="1" />
      <ellipse cx="185" cy="545" rx="30" ry="42" fill="url(#backSkinGrad)" stroke="#d4959f" strokeWidth="1" />

      {/* MARCADORES POSTERIOR */}
      {marks.map((mark) => {
        const color = getProcedureColor(mark.tipo);
        const isSelected = selectedMark === mark.id;

        return (
          <g
            key={`back-${mark.id}`}
            onClick={() => {
              setSelectedMark(mark.id);
              onMarkClick?.(mark);
            }}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredZone(mark.id)}
            onMouseLeave={() => setHoveredZone(null)}
          >
            <circle cx={mark.posicionX} cy={mark.posicionY} r={24 + mark.intensidad * 1.5} fill={color.fill} opacity="0.1" />
            <motion.circle cx={mark.posicionX} cy={mark.posicionY} r="14" fill={color.fill} stroke="white" strokeWidth="2.5" whileHover={{ r: 18 }} animate={{ scale: isSelected ? 1.3 : 1 }} />
            <circle cx={mark.posicionX} cy={mark.posicionY} r={9 * (mark.intensidad / 10)} fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
          </g>
        );
      })}
    </svg>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6"
    >
      {/* SELECTOR DE VISTAS */}
      <div className="flex gap-3 justify-center">
        {(['frontal', 'lateral', 'posterior'] as const).map((v) => (
          <motion.button
            key={v}
            onClick={() => setView(v)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
              view === v
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {v === 'frontal' && '👀 Frontal'}
            {v === 'lateral' && '↔️ Lateral'}
            {v === 'posterior' && '🔙 Posterior'}
          </motion.button>
        ))}
      </div>

      {/* CONTENEDOR SVG */}
      <motion.div
        key={view}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700 shadow-2xl"
      >
        {view === 'frontal' && renderFrontalView()}
        {view === 'lateral' && renderLateralView()}
        {view === 'posterior' && renderPosteriorView()}
      </motion.div>

      {/* INFORMACIÓN DE PROCEDIMIENTOS */}
      {marks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-lg p-4 border border-slate-700"
        >
          <h3 className="text-sm font-semibold text-cyan-400 mb-3">Procedimientos Marcados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {marks.map((mark) => {
              const color = getProcedureColor(mark.tipo);
              return (
                <div
                  key={mark.id}
                  className="flex items-center gap-2 text-xs text-slate-300 p-2 rounded bg-slate-700"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color.fill }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white">{color.text}</p>
                    <p className="text-slate-400">
                      {mark.zona} • {mark.intensidad}/10
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <p className="text-center text-xs text-slate-500">
        ✨ Anatomía Realista • Interactiva • Profesional
      </p>
    </motion.div>
  );
}
