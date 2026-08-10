import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { Language, ThemeMode, Material3Palette } from '../types';

/**
 * LinkerRoute — embeds the Scramjet proxy server's own frontend.
 *
 * The proxy server (scramjet-proxy/, started via `npm run proxy`) has its
 * own M3 Expressive UI with tabs, URL bar, quick links, and a theme bridge
 * (theme.js) that receives LINKER_CONFIG postMessage from this parent app.
 *
 * This component:
 *  - Points at the proxy server (http://localhost:8080)
 *  - If `initialUrl` is provided, appends /proxy/{encodedUrl} so the proxy
 *    auto-loads that site
 *  - Sends the current theme + palette to the iframe on load and on change
 *  - Responds to LINKER_CONFIG_REQUEST from the iframe (sent on proxy load)
 */

interface LinkerRouteProps {
  lang: Language;
  theme: ThemeMode;
  palette: Material3Palette;
  initialUrl?: string;
}

const PROXY_BASE = 'http://localhost:8080';

export function LinkerRoute({ theme, palette, initialUrl }: LinkerRouteProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const src = useMemo(() => {
    if (!initialUrl) return PROXY_BASE;
    let normalized = initialUrl.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = 'https://' + normalized;
    return `${PROXY_BASE}/proxy/${encodeURIComponent(normalized)}`;
  }, [initialUrl]);

  // Send theme config to the proxy iframe.
  const sendTheme = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: 'LINKER_CONFIG', theme, palette },
        '*',
      );
    }
  }, [theme, palette]);

  // Send theme when theme/palette changes.
  useEffect(() => {
    sendTheme();
  }, [sendTheme]);

  // Respond to the iframe's theme request (sent on its load).
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'LINKER_CONFIG_REQUEST') {
        sendTheme();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [sendTheme]);

  // Also send theme when the iframe finishes loading.
  const handleLoad = () => {
    sendTheme();
  };

  return (
    <iframe
      ref={iframeRef}
      src={src}
      onLoad={handleLoad}
      className="h-full w-full border-0 bg-white"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-modals"
      referrerPolicy="no-referrer"
      title="LinkerRoute"
    />
  );
}
