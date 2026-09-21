import React, { useState } from 'react';
import { Wifi, Radio } from 'lucide-react';

export const LISYAN_CONNECT_LOGO_URL =
  'https://github.com/user-attachments/assets/71a65dc6-fb8f-45fb-88a4-240d44cecee3';

export interface LisyanConnectLogoProps {
  className?: string;
  ringed?: boolean;
  variant?: 'badge' | 'raw' | 'squircle';
  theme?: 'light' | 'dark';
}

export function LisyanConnectLogo({
  className = 'w-7 h-7',
  ringed = false,
  variant = 'badge',
}: LisyanConnectLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (variant === 'raw') {
    if (hasError) return <Wifi className={`text-white ${className}`} />;
    return (
      <img
        src={LISYAN_CONNECT_LOGO_URL}
        alt="Lisyan Connect"
        className={`object-contain brightness-0 invert ${className}`}
        style={{
          filter: 'brightness(0) invert(1)',
        }}
        draggable={false}
        onError={() => setHasError(true)}
      />
    );
  }

  const containerShape = variant === 'squircle' ? 'rounded-2xl' : 'rounded-full';

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${containerShape} shadow-xs bg-[var(--accent)] text-[var(--on-accent)] p-1.5 ${
        ringed ? 'ring-2 ring-[var(--outline)]' : ''
      } ${className}`}
    >
      {!hasError ? (
        <img
          src={LISYAN_CONNECT_LOGO_URL}
          alt="Lisyan Connect"
          className="h-full w-full object-contain brightness-0 invert"
          style={{ filter: 'brightness(0) invert(1)' }}
          draggable={false}
          onError={() => setHasError(true)}
        />
      ) : (
        <Radio className="h-3/5 w-3/5 text-[var(--on-accent)]" />
      )}
    </span>
  );
}

export default LisyanConnectLogo;

