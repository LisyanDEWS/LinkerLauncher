import React from 'react';
import { Language } from '../types';

interface LinkerRouteAppProps {
  lang: Language;
  selectedServer: string;
  onSelectServer: (server: string) => void;
  activePalette: any;
  theme: 'light' | 'dark';
  initialUrl?: string;
}

export function LinkerRouteApp({
  activePalette,
  theme,
  initialUrl,
}: LinkerRouteAppProps) {
  const proxyUrl = initialUrl
    ? `http://localhost:8080/proxy/${encodeURIComponent(initialUrl.startsWith('http') ? initialUrl : 'https://' + initialUrl)}`
    : 'http://localhost:8080/';
  const themeParams = `?theme=${theme}&primary=${encodeURIComponent(activePalette.primary)}&secondary=${encodeURIComponent(activePalette.secondary)}&tertiary=${encodeURIComponent(activePalette.tertiary)}`;
  const finalUrl = `${proxyUrl}${themeParams}`;

  return (
    <div className="flex h-full w-full flex-col bg-[var(--surface-dim)] text-[var(--on-surface)] select-none">
      <iframe
        src={finalUrl}
        className="w-full h-full border-none bg-[var(--surface)]"
        title="LinkerRoute Frame"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
    </div>
  );
}

