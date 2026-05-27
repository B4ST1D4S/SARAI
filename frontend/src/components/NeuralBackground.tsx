import { useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  pulse: number;
  pulseSpeed: number;
  colorIdx: 0 | 1 | 2;
}

const COLORS = [
  { r: 212, g: 175, b: 55  },  // gold  (#d4af37)
  { r: 6,   g: 182, b: 212 },  // cyan  (#06b6d4)
  { r: 139, g: 92,  b: 246 },  // violet (#8b5cf6)
];

export default function NeuralBackground() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);

  useEffect(() => {
    if (theme !== 'dark') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle count adapts to screen size (performance friendly)
    const N = Math.min(75, Math.max(40, Math.floor(window.innerWidth * window.innerHeight / 16000)));
    const MAX_DIST = 170;

    const particles: Particle[] = Array.from({ length: N }, () => {
      const roll = Math.random();
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.40,
        vy: (Math.random() - 0.5) * 0.40,
        radius: Math.random() * 1.8 + 0.5,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.010 + Math.random() * 0.022,
        colorIdx: (roll < 0.28 ? 0 : roll < 0.65 ? 1 : 2) as 0 | 1 | 2,
      };
    });

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // ── Move particles (wrap at edges) ──────────────────────
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        if (p.x < -30) p.x = W + 30;
        else if (p.x > W + 30) p.x = -30;
        if (p.y < -30) p.y = H + 30;
        else if (p.y > H + 30) p.y = -30;
      }

      // ── Draw connections ─────────────────────────────────────
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > MAX_DIST * MAX_DIST) continue;

          const d = Math.sqrt(d2);
          const t = 1 - d / MAX_DIST;
          const alpha = t * t * 0.30;

          const ca = COLORS[a.colorIdx], cb = COLORS[b.colorIdx];
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, `rgba(${ca.r},${ca.g},${ca.b},${alpha})`);
          grad.addColorStop(1, `rgba(${cb.r},${cb.g},${cb.b},${alpha * 0.5})`);

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = t * 0.85;
          ctx.stroke();
        }
      }

      // ── Draw nodes ───────────────────────────────────────────
      for (const p of particles) {
        const pf = 0.72 + 0.28 * Math.sin(p.pulse);
        const c  = COLORS[p.colorIdx];
        const coreAlpha = pf * (p.colorIdx === 0 ? 0.60 : 0.50);
        const r = p.radius * pf;

        // Glow halo
        const haloR = r * 5.5;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
        glow.addColorStop(0,   `rgba(${c.r},${c.g},${c.b},${coreAlpha * 0.55})`);
        glow.addColorStop(0.4, `rgba(${c.r},${c.g},${c.b},${coreAlpha * 0.18})`);
        glow.addColorStop(1,   `rgba(${c.r},${c.g},${c.b},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${coreAlpha})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [theme]);

  if (theme !== 'dark') return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
