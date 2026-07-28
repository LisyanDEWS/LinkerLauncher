import React, { useState } from 'react';
import { M3LoadingIndicator } from './m3-loading/M3LoadingIndicator';

interface LogoWithLoaderProps {
  src: string;
  alt: string;
  className?: string;
  loaderSize?: number;
  color?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export function LogoWithLoader({
  src,
  alt,
  className = '',
  loaderSize = 20,
  color = 'var(--accent)',
  onError,
}: LogoWithLoaderProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative inline-flex items-center justify-center overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-dim)] z-10 rounded-inherit">
          <M3LoadingIndicator size={loaderSize} color={color} />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          setLoaded(true);
          onError?.(e);
        }}
      />
    </div>
  );
}
