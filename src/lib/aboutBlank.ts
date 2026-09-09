/**
 * Utility to safely launch URLs in about:blank cloaked tab (Classic LinkerRu style)
 */
export function openAboutBlank(url: string, title: string = 'New Tab') {
  try {
    const win = window.open('about:blank', '_blank');
    if (!win) {
      // If popup blocker intervened, fallback to direct window.open
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    const doc = win.document;
    doc.title = title;

    // Favicon link if available
    const favicon = doc.createElement('link');
    favicon.rel = 'shortcut icon';
    favicon.href = 'https://www.google.com/favicon.ico';
    doc.head.appendChild(favicon);

    // Style the about:blank window
    const style = doc.createElement('style');
    style.textContent = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
      iframe { width: 100%; height: 100%; border: none; display: block; }
    `;
    doc.head.appendChild(style);

    // Inject iframe pointing to the destination
    const iframe = doc.createElement('iframe');
    iframe.src = url;
    iframe.allow = 'fullscreen; clipboard-read; clipboard-write; autoplay';
    doc.body.appendChild(iframe);
  } catch (e) {
    console.error('Failed to open about:blank tab, falling back:', e);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
