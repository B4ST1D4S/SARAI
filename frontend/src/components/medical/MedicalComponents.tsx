import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../common/UIComponents';

// Comparador Antes/Después (Slider)
interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  onPositionChange?: (position: number) => void;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Antes',
  afterLabel = 'Después',
  onPositionChange,
}) => {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedPosition = Math.min(Math.max(newPosition, 0), 100);
    setPosition(clampedPosition);
    onPositionChange?.(clampedPosition);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onMouseMove={handleMouseMove}
      onTouchMove={(e) => {
        if (!containerRef.current) return;
        const touch = e.touches[0];
        const rect = containerRef.current.getBoundingClientRect();
        const newPosition = ((touch.clientX - rect.left) / rect.width) * 100;
        const clampedPosition = Math.min(Math.max(newPosition, 0), 100);
        setPosition(clampedPosition);
        onPositionChange?.(clampedPosition);
      }}
      className="relative w-full overflow-hidden rounded-lg cursor-col-resize bg-slate-800 aspect-square"
    >
      {/* Before Image */}
      <img
        src={beforeImage}
        alt={beforeLabel}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* After Image */}
      <div
        style={{ width: `${position}%` }}
        className="absolute inset-0 overflow-hidden"
      >
        <img
          src={afterImage}
          alt={afterLabel}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Divider */}
      <motion.div
        style={{ left: `${position}%` }}
        className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-amber-400 to-transparent"
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-400 rounded-full p-2">
          <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 5a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H3a1 1 0 110-2h5V6a1 1 0 011-1z" />
          </svg>
        </div>
      </motion.div>

      {/* Labels */}
      <div className="absolute top-4 left-4 text-white font-bold text-lg drop-shadow-lg">
        {beforeLabel}
      </div>
      <div className="absolute top-4 right-4 text-white font-bold text-lg drop-shadow-lg">
        {afterLabel}
      </div>
    </motion.div>
  );
};

// Mapa Corporal Interactivo
interface BodyZone {
  id: string;
  name: string;
  edema: 'none' | 'leve' | 'moderado' | 'severo';
  dolor: number; // 1-10
  fibrosis: boolean;
  anotacion?: string;
}

interface BodyMapProps {
  zones: BodyZone[];
  onZoneSelect?: (zoneId: string) => void;
  onZoneUpdate?: (zoneId: string, updates: Partial<BodyZone>) => void;
}

const BODY_ZONES = [
  { id: 'frente', name: 'Frente', x: 50, y: 8 },
  { id: 'nariz', name: 'Nariz', x: 50, y: 15 },
  { id: 'mejillas', name: 'Mejillas', x: 35, y: 20 },
  { id: 'barbilla', name: 'Barbilla', x: 50, y: 28 },
  { id: 'cuello', name: 'Cuello', x: 50, y: 35 },
  { id: 'pecho', name: 'Pecho', x: 50, y: 45 },
  { id: 'abdomen', name: 'Abdomen', x: 50, y: 55 },
  { id: 'cadera', name: 'Cadera', x: 40, y: 65 },
  { id: 'muslo', name: 'Muslo', x: 35, y: 75 },
  { id: 'rodilla', name: 'Rodilla', x: 35, y: 85 },
];

export const BodyMap: React.FC<BodyMapProps> = ({
  zones,
  onZoneSelect,
  onZoneUpdate,
}) => {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const getEdemaColor = (zone: BodyZone) => {
    switch (zone.edema) {
      case 'none':
        return 'bg-green-500';
      case 'leve':
        return 'bg-yellow-500';
      case 'moderado':
        return 'bg-orange-500';
      case 'severo':
        return 'bg-red-500';
      default:
        return 'bg-slate-600';
    }
  };

  return (
    <Card className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 relative h-96 bg-slate-800 rounded-lg overflow-hidden">
        {/* Body Outline (SVG) */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full opacity-20"
        >
          {/* Simplified body outline */}
          <circle cx="50" cy="15" r="8" fill="none" stroke="white" strokeWidth="0.5" />
          <path
            d="M 50 23 L 50 60 M 40 35 L 60 35 M 40 60 L 40 85 M 60 60 L 60 85"
            stroke="white"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>

        {/* Interactive Zones */}
        {BODY_ZONES.map((zone) => {
          const zoneData = zones.find((z) => z.id === zone.id);
          if (!zoneData) return null;

          return (
            <motion.button
              key={zone.id}
              whileHover={{ scale: 1.2 }}
              style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
              onClick={() => {
                setSelectedZone(zone.id);
                onZoneSelect?.(zone.id);
              }}
              className={`
                absolute transform -translate-x-1/2 -translate-y-1/2
                w-6 h-6 rounded-full border-2 border-white
                transition-all duration-200
                ${getEdemaColor(zoneData)}
                ${selectedZone === zone.id ? 'ring-2 ring-offset-2 ring-amber-400' : ''}
              `}
              title={`${zone.name}: ${zoneData.edema}`}
            />
          );
        })}
      </div>

      {/* Zone Details */}
      {selectedZone && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-80 space-y-4"
        >
          <div>
            <h3 className="text-lg font-bold text-white">
              {BODY_ZONES.find((z) => z.id === selectedZone)?.name}
            </h3>
          </div>

          {zones.find((z) => z.id === selectedZone) && (
            <>
              <div>
                <label className="text-sm text-slate-300 block mb-2">Edema</label>
                <select
                  value={zones.find((z) => z.id === selectedZone)?.edema || 'none'}
                  onChange={(e) =>
                    onZoneUpdate?.(selectedZone, {
                      edema: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                >
                  <option value="none">Sin edema</option>
                  <option value="leve">Leve</option>
                  <option value="moderado">Moderado</option>
                  <option value="severo">Severo</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-300 block mb-2">
                  Dolor (1-10): {zones.find((z) => z.id === selectedZone)?.dolor}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={zones.find((z) => z.id === selectedZone)?.dolor || 5}
                  onChange={(e) =>
                    onZoneUpdate?.(selectedZone, {
                      dolor: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={zones.find((z) => z.id === selectedZone)?.fibrosis || false}
                  onChange={(e) =>
                    onZoneUpdate?.(selectedZone, {
                      fibrosis: e.target.checked,
                    })
                  }
                  className="rounded bg-slate-700 border-slate-600"
                />
                <span className="text-sm text-slate-300">Presencia de fibrosis</span>
              </label>

              <textarea
                placeholder="Anotaciones clínicas..."
                value={zones.find((z) => z.id === selectedZone)?.anotacion || ''}
                onChange={(e) =>
                  onZoneUpdate?.(selectedZone, {
                    anotacion: e.target.value,
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
                rows={3}
              />
            </>
          )}
        </motion.div>
      )}
    </Card>
  );
};

// Gallery/Timeline Médica
interface MedicalTimelineProps {
  dates: Array<{
    date: string;
    title: string;
    images: string[];
  }>;
  onImageSelect?: (imageUrl: string) => void;
}

export const MedicalTimeline: React.FC<MedicalTimelineProps> = ({
  dates,
  onImageSelect,
}) => {
  return (
    <div className="space-y-6">
      {dates.map((entry, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <h3 className="text-sm text-slate-300 mb-3">{entry.date}</h3>
            <h4 className="font-semibold text-white mb-4">{entry.title}</h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {entry.images.map((image, imgIndex) => (
                <motion.img
                  key={imgIndex}
                  src={image}
                  alt={`${entry.title} ${imgIndex + 1}`}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => onImageSelect?.(image)}
                  className="w-full aspect-square object-cover rounded-lg cursor-pointer border border-slate-700 hover:border-amber-400 transition-colors"
                />
              ))}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

// Firma Digital Canvas
interface SignatureCanvasProps {
  onSignatureSave: (dataUrl: string) => void;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSignatureSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e as React.MouseEvent).clientX ? (e as React.MouseEvent).clientX - rect.left : (e as React.TouchEvent).touches[0].clientX - rect.left;
    const y = (e as React.MouseEvent).clientY ? (e as React.MouseEvent).clientY - rect.top : (e as React.TouchEvent).touches[0].clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e as React.MouseEvent).clientX ? (e as React.MouseEvent).clientX - rect.left : (e as React.TouchEvent).touches[0].clientX - rect.left;
    const y = (e as React.MouseEvent).clientY ? (e as React.MouseEvent).clientY - rect.top : (e as React.TouchEvent).touches[0].clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureSave(dataUrl);
    }
  };

  return (
    <Card>
      <h3 className="font-semibold text-white mb-4">Firma Digital</h3>
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
        className="w-full border-2 border-dashed border-slate-600 rounded-lg bg-slate-950 cursor-crosshair"
      />
      <div className="flex gap-3 mt-4">
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
        >
          Limpiar
        </button>
        <button
          onClick={saveSignature}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
        >
          Aceptar Firma
        </button>
      </div>
    </Card>
  );
};

export default {
  BeforeAfterSlider,
  BodyMap,
  MedicalTimeline,
  SignatureCanvas,
};
