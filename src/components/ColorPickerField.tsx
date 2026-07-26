import React, { useEffect, useRef, useState, useCallback } from 'react';

interface ColorPickerFieldProps {
  /** Current hex color value, e.g. "#8B5CF6". */
  value: string;
  /** Called with a new hex string whenever the picker changes. */
  onChange: (hex: string) => void;
  /** Optional label shown above the field. */
  label?: string;
}

/* ---------- color utils (hex <-> hsv) ---------- */

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  let r = 0, g = 0, b = 0;
  const clean = hex.replace('#', '');
  if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16) / 255;
    g = parseInt(clean.slice(2, 4), 16) / 255;
    b = parseInt(clean.slice(4, 6), 16) / 255;
  } else if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) / 255;
    g = parseInt(clean[1] + clean[1], 16) / 255;
    b = parseInt(clean[2] + clean[2], 16) / 255;
  }
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s: s * 100, v: v * 100 };
}

function hsvToHex(h: number, s: number, v: number): string {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/* ---------- M3 Expressive Color Picker ---------- */

export function ColorPickerField({ value, onChange, label }: ColorPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState(() => hexToHsv(value || '#8B5CF6'));
  const [hexInput, setHexInput] = useState(value || '#8B5CF6');
  const popoverRef = useRef<HTMLDivElement>(null);
  const satRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  // Which handle is being dragged ('sat' | 'hue' | null)
  const dragRef = useRef<'sat' | 'hue' | null>(null);

  // Sync external value → internal state when parent updates
  useEffect(() => {
    if (value && value !== hexInput) {
      setHexInput(value);
      setHsv(hexToHsv(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Global pointer move/up for dragging the saturation handle and hue handle.
  useEffect(() => {
    if (!open) return;
    const onMove = (e: PointerEvent) => {
      if (dragRef.current === 'sat' && satRef.current) {
        const rect = satRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        const next = { ...hsv, s: x * 100, v: (1 - y) * 100 };
        setHsv(next);
        const hex = hsvToHex(next.h, next.s, next.v);
        setHexInput(hex);
        onChange(hex);
      } else if (dragRef.current === 'hue' && hueRef.current) {
        const rect = hueRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const next = { ...hsv, h: x * 360 };
        setHsv(next);
        const hex = hsvToHex(next.h, next.s, next.v);
        setHexInput(hex);
        onChange(hex);
      }
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [open, hsv, onChange]);

  const onSatDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragRef.current = 'sat';
    if (satRef.current) {
      const rect = satRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      const next = { ...hsv, s: x * 100, v: (1 - y) * 100 };
      setHsv(next);
      const hex = hsvToHex(next.h, next.s, next.v);
      setHexInput(hex);
      onChange(hex);
    }
  }, [hsv, onChange]);

  const onHueDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragRef.current = 'hue';
    if (hueRef.current) {
      const rect = hueRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const next = { ...hsv, h: x * 360 };
      setHsv(next);
      const hex = hsvToHex(next.h, next.s, next.v);
      setHexInput(hex);
      onChange(hex);
    }
  }, [hsv, onChange]);

  const onHexCommit = (val: string) => {
    setHexInput(val);
    const clean = val.replace('#', '').trim();
    if (/^[0-9a-fA-F]{6}$/.test(clean) || /^[0-9a-fA-F]{3}$/.test(clean)) {
      const hex = clean.length === 3 ? `#${clean.split('').map(c => c + c).join('')}` : `#${clean}`;
      setHsv(hexToHsv(hex));
      onChange(hex);
    }
  };

  // Pure hue color (full saturation/value) for the saturation area background
  const hueColor = hsvToHex(hsv.h, 100, 100);

  return (
    <div className="flex flex-col gap-1 relative">
      {label && (
        <label className="text-[10px] font-bold text-[var(--on-surface-var)] uppercase">{label}</label>
      )}
      <div className="flex relative items-center gap-2">
        {/* Swatch button — opens the picker popover */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="h-8 w-8 shrink-0 rounded-xl border border-[var(--outline-var)] shadow-inner transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: value }}
          aria-label="Open color picker"
        />
        {/* Hex text input — manual entry */}
        <input
          type="text"
          value={hexInput}
          onChange={(e) => onHexCommit(e.target.value)}
          className="w-full bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-xl px-3 py-1.5 text-xs text-[var(--on-surface)] uppercase focus:border-[var(--accent)] outline-none"
          placeholder="#8B5CF6"
        />

        {/* M3 Expressive picker popover */}
        {open && (
          <div
            ref={popoverRef}
            className="absolute top-full left-0 z-50 mt-2 p-3 rounded-2xl border"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--outline)',
              boxShadow: '0 16px 40px -8px rgba(0,0,0,0.35)',
              width: 220,
            }}
          >
            {/* Saturation + Value area */}
            <div
              ref={satRef}
              onPointerDown={onSatDown}
              className="relative h-36 w-full rounded-2xl overflow-hidden cursor-crosshair touch-none"
              style={{
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
              }}
            >
              {/* Handle */}
              <div
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
                style={{
                  left: `calc(${hsv.s}% - 8px)`,
                  top: `calc(${100 - hsv.v}% - 8px)`,
                  backgroundColor: value,
                }}
              />
            </div>

            {/* Hue slider */}
            <div
              ref={hueRef}
              onPointerDown={onHueDown}
              className="relative h-4 w-full mt-3 rounded-full cursor-pointer touch-none"
              style={{
                background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
              }}
            >
              <div
                className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -translate-y-1/2"
                style={{
                  left: `calc(${(hsv.h / 360) * 100}% - 8px)`,
                  backgroundColor: hueColor,
                }}
              />
            </div>

            {/* Hex readout */}
            <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase text-[var(--on-surface-var)]">
              <span>HEX</span>
              <span className="tabular-nums text-[var(--on-surface)]">{hsvToHex(hsv.h, hsv.s, hsv.v)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ColorPickerField;
