import React, { useEffect, useState } from 'react';
import { Language } from '../types';

interface SpaceProxyAppProps {
  lang: Language;
  selectedServer: string;
  onSelectServer: (server: string) => void;
  activePalette: any;
  theme: 'light' | 'dark';
}

const SERVERS = [
  { id: 'S1', name: 'Server 1', region: 'English', url: 'https://english.neeb.wtf/' },
  { id: 'S2', name: 'Server 2', region: 'Extra Learning', url: 'https://extralearning.pirazymatma.pl/' },
  { id: 'S3', name: 'Server 3', region: 'Places', url: 'https://places.vjason.com/' },
];

export function SpaceProxyApp({
  selectedServer,
}: SpaceProxyAppProps) {
  const getServerUrl = (srvName: string) => {
    const match = SERVERS.find(s => s.name === srvName);
    return match ? match.url : SERVERS[0].url;
  };

  const [activeUrl, setActiveUrl] = useState<string>(() => getServerUrl(selectedServer));

  useEffect(() => {
    setActiveUrl(getServerUrl(selectedServer));
  }, [selectedServer]);

  return (
    <div className="flex h-full w-full flex-col bg-[var(--surface-dim)] text-[var(--on-surface)] select-none">
      <iframe
        key={activeUrl}
        src={activeUrl}
        className="w-full h-full border-none bg-[var(--surface)]"
        title="Proxy Frame"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
    </div>
  );
}

