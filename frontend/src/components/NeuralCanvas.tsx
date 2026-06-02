import { useEffect, useRef } from 'react';

interface Props {
  opacity?: number;
  nodeCount?: number;
}

/**
 * Animated neural-network canvas background.
 * All nodes are equal-sized; connections fade with distance.
 * Uses fixed positioning so it covers the full viewport.
 */
export default function NeuralCanvas({ opacity = 1, nodeCount = 130 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const N         = nodeCount;
    const MAX_DIST  = 185;
    const MAX_DIST2 = MAX_DIST * MAX_DIST;
    const NODE_R    = 2;
    const GLOW_R    = 5;
    const SPEED     = 0.38;

    interface P { x: number; y: number; vx: number; vy: number; }

    const pts: P[] = Array.from({ length: N }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── Update positions ──────────────────────────────────
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }

      // ── Connections ───────────────────────────────────────
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MAX_DIST2) {
            const d     = Math.sqrt(d2);
            const alpha = (0.35 * (1 - d / MAX_DIST)).toFixed(3);
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(0,210,235,${alpha})`;
            ctx.lineWidth   = 0.7;
            ctx.stroke();
          }
        }
      }

      // ── Nodes (glow halo + core) ──────────────────────────
      for (const p of pts) {
        // Soft glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, GLOW_R, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,229,255,0.10)';
        ctx.fill();
        // Bright core
        ctx.beginPath();
        ctx.arc(p.x, p.y, NODE_R, 0, Math.PI * 2);
        ctx.fillStyle = '#00E5FF';
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [nodeCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ opacity, zIndex: 0 }}
    />
  );
}
