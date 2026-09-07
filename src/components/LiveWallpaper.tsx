import React, { useEffect, useRef } from 'react';
import type { Material3Palette, ThemeMode } from '../types';

interface LiveWallpaperProps {
  type: string; // 'animated-1' | 'animated-2' | 'animated-3' | 'animated-4'
  palette: Material3Palette;
  theme: ThemeMode;
  preview?: boolean;
  className?: string;
}

export function LiveWallpaper({
  type,
  palette,
  theme,
  preview = false,
  className = '',
}: LiveWallpaperProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth || (preview ? 240 : window.innerWidth));
    let height = (canvas.height = canvas.offsetHeight || (preview ? 160 : window.innerHeight));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || (preview ? 240 : window.innerWidth);
      height = canvas.height = canvas.offsetHeight || (preview ? 160 : window.innerHeight);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(canvas.parentElement);
    }

    const isDark = theme === 'dark';
    const p1 = palette.primary || '#6366f1';
    const p2 = palette.secondary || '#818cf8';
    const p3 = palette.tertiary || '#4f46e5';

    // Parse hex to RGB helper
    const hexToRgb = (hex: string) => {
      const clean = hex.replace('#', '');
      if (clean.length === 3) {
        return {
          r: parseInt(clean[0] + clean[0], 16),
          g: parseInt(clean[1] + clean[1], 16),
          b: parseInt(clean[2] + clean[2], 16),
        };
      }
      return {
        r: parseInt(clean.substring(0, 2), 16) || 100,
        g: parseInt(clean.substring(2, 4), 16) || 100,
        b: parseInt(clean.substring(4, 6), 16) || 100,
      };
    };

    const c1 = hexToRgb(p1);
    const c2 = hexToRgb(p2);
    const c3 = hexToRgb(p3);

    let startTime = performance.now();

    // 1. SILK WAVES RENDERER
    const renderSilkWaves = (t: number) => {
      const bg = isDark ? '#08080a' : '#f8f9fa';
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const waveCount = preview ? 3 : 5;
      const step = width / (preview ? 20 : 40);

      for (let w = 0; w < waveCount; w++) {
        const offset = (w * Math.PI) / 3;
        const speed = 0.0008 * (w % 2 === 0 ? 1 : -0.8);
        const yBase = height * (0.35 + (w * 0.12));
        const amp = (preview ? 12 : 35) + w * 4;

        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, yBase);

        for (let x = 0; x <= width + step; x += step) {
          const y =
            yBase +
            Math.sin(x * 0.005 + t * speed + offset) * amp +
            Math.cos(x * 0.002 - t * speed * 0.5) * (amp * 0.5);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, yBase - amp, width, height);
        const alpha = isDark ? (0.15 + w * 0.07) : (0.2 + w * 0.08);
        const col = w % 3 === 0 ? c1 : w % 3 === 1 ? c2 : c3;

        grad.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha * 0.9})`);
        grad.addColorStop(0.5, `rgba(${c2.r}, ${c2.g}, ${c2.b}, ${alpha * 0.6})`);
        grad.addColorStop(1, `rgba(${c3.r}, ${c3.g}, ${c3.b}, ${alpha * 0.2})`);

        ctx.fillStyle = grad;
        ctx.fill();
      }
    };

    // 2. FLUTED GLASS RENDERER
    const renderFlutedGlass = (t: number) => {
      const bg = isDark ? '#09090c' : '#f4f4f7';
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const barWidth = preview ? 8 : 18;
      const count = Math.ceil(width / barWidth);
      const timeOffset = t * 0.0006;

      for (let i = 0; i < count; i++) {
        const x = i * barWidth;
        const norm = i / count;
        const wave = Math.sin(norm * 6 + timeOffset);
        const wave2 = Math.cos(norm * 4 - timeOffset * 0.7);

        const col = (i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3);
        const opacity = (isDark ? 0.08 : 0.12) + Math.abs(wave) * (isDark ? 0.22 : 0.28);

        const barGrad = ctx.createLinearGradient(x, 0, x + barWidth, height);
        barGrad.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, ${opacity * 0.3})`);
        barGrad.addColorStop(0.3 + wave2 * 0.2, `rgba(${col.r}, ${col.g}, ${col.b}, ${opacity})`);
        barGrad.addColorStop(1, `rgba(${c1.r}, ${c1.g}, ${c1.b}, ${opacity * 0.15})`);

        ctx.fillStyle = barGrad;
        ctx.fillRect(x, 0, barWidth - 1, height);

        // Glass highlight reflection
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${0.04 + Math.max(0, wave) * 0.08})`
          : `rgba(255, 255, 255, ${0.2 + Math.max(0, wave) * 0.25})`;
        ctx.fillRect(x + barWidth - 2, 0, 1.5, height);
      }
    };

    // 3. RISO DITHER / HALFTONE RENDERER
    const renderRisoDither = (t: number) => {
      const bg = isDark ? '#0a0a0f' : '#f5f5f9';
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const spacing = preview ? 10 : 20;
      const timeSpeed = t * 0.001;

      for (let x = spacing / 2; x < width; x += spacing) {
        for (let y = spacing / 2; y < height; y += spacing) {
          const dist1 = Math.hypot(x - width * 0.3, y - height * 0.4);
          const dist2 = Math.hypot(x - width * 0.7, y - height * 0.6);
          const wave1 = Math.sin(dist1 * 0.02 - timeSpeed);
          const wave2 = Math.cos(dist2 * 0.02 + timeSpeed * 0.8);
          const val = (wave1 + wave2 + 2) / 4;

          const maxR = (spacing / 2) * 0.85;
          const radius = Math.max(0.5, val * maxR);

          const col = dist1 < dist2 ? c1 : c2;
          const alpha = isDark ? (0.25 + val * 0.5) : (0.2 + val * 0.45);

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha})`;
          ctx.fill();
        }
      }
    };

    // 4. STARFIELD COSMOS RENDERER
    const stars: { x: number; y: number; s: number; alpha: number; speed: number }[] = [];
    const starCount = preview ? 25 : 85;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        s: 0.8 + Math.random() * (preview ? 1.5 : 2.5),
        alpha: 0.3 + Math.random() * 0.7,
        speed: 0.001 + Math.random() * 0.002,
      });
    }

    const renderStarfield = (t: number) => {
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, width, height);

      // Nebula 1
      const neb1Grad = ctx.createRadialGradient(
        width * 0.35,
        height * 0.4,
        0,
        width * 0.35,
        height * 0.4,
        preview ? width * 0.6 : width * 0.45
      );
      neb1Grad.addColorStop(0, `rgba(${c1.r}, ${c1.g}, ${c1.b}, 0.28)`);
      neb1Grad.addColorStop(0.6, `rgba(${c2.r}, ${c2.g}, ${c2.b}, 0.12)`);
      neb1Grad.addColorStop(1, 'transparent');
      ctx.fillStyle = neb1Grad;
      ctx.fillRect(0, 0, width, height);

      // Nebula 2
      const neb2Grad = ctx.createRadialGradient(
        width * 0.75,
        height * 0.65,
        0,
        width * 0.75,
        height * 0.65,
        preview ? width * 0.5 : width * 0.4
      );
      neb2Grad.addColorStop(0, `rgba(${c3.r}, ${c3.g}, ${c3.b}, 0.22)`);
      neb2Grad.addColorStop(1, 'transparent');
      ctx.fillStyle = neb2Grad;
      ctx.fillRect(0, 0, width, height);

      // Stars
      for (const st of stars) {
        const pulse = 0.5 + 0.5 * Math.sin(t * st.speed + st.x);
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${st.alpha * pulse})`;
        ctx.fill();
      }
    };

    const loop = () => {
      const now = performance.now();
      const elapsed = now - startTime;

      if (type === 'animated-1') {
        renderSilkWaves(elapsed);
      } else if (type === 'animated-2') {
        renderFlutedGlass(elapsed);
      } else if (type === 'animated-3') {
        renderRisoDither(elapsed);
      } else if (type === 'animated-4') {
        renderStarfield(elapsed);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [type, palette, theme, preview]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      data-aifx={
        type === 'animated-1'
          ? 'silk-waves'
          : type === 'animated-2'
          ? 'fluted-glass'
          : type === 'animated-3'
          ? 'dither'
          : type === 'animated-4'
          ? 'starfield'
          : undefined
      }
      data-aifx-colors={`${palette.primary},${palette.secondary},${palette.tertiary}`}
      data-aifx-bg={palette.tertiary}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
}

export default LiveWallpaper;
