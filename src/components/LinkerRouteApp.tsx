import React from 'react';

interface LinkerRouteAppProps {
  initialUrl?: string;
}

export function LinkerRouteApp({ initialUrl }: LinkerRouteAppProps) {
  const defaultUrl = localStorage.getItem('linkerru_server_url') || 'https://english.neeb.wtf/';
  const currentUrl = initialUrl || defaultUrl;

  return (
    <div className="flex h-full w-full flex-col bg-[var(--surface)] select-none overflow-hidden">
      <iframe
        src={currentUrl}
        className="w-full h-full border-none bg-[var(--surface)]"
        title="Space Proxy Hub Frame"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
        allow="fullscreen; autoplay; clipboard-read; clipboard-write"
      />
    </div>
  );
}

export const SpaceProxyHubApp = LinkerRouteApp;

