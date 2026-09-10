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
      html, body { width: 100%; height: 100%; overflow: hidden; background: #0f0f11; color: #fff; font-family: system-ui, -apple-system, sans-serif; }
      #loader-container {
        position: absolute; inset: 0; z-index: 50; display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: #0f0f11; transition: opacity 0.3s ease;
      }
      .spinner {
        width: 40px; height: 40px; border: 3px solid rgba(255, 255, 255, 0.1); border-top-color: #3b82f6; border-radius: 50%;
        animation: spin 1s linear infinite; margin-bottom: 16px;
      }
      .progress-container {
        width: 200px; height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden; margin-top: 12px;
      }
      .progress-bar {
        height: 100%; background: #3b82f6; width: 0%; transition: width 0.1s ease-out;
      }
      .loader-text { font-size: 13px; font-weight: 600; color: #e2e8f0; }
      .loader-percent { font-size: 13px; font-weight: 600; color: #94a3b8; margin-left: 8px; }
      iframe { width: 100%; height: 100%; border: none; display: block; }
      @keyframes spin { to { transform: rotate(360deg); } }
    `;
    doc.head.appendChild(style);

    // Create loader UI
    const loaderContainer = doc.createElement('div');
    loaderContainer.id = 'loader-container';
    
    const spinner = doc.createElement('div');
    spinner.className = 'spinner';
    
    const textRow = doc.createElement('div');
    textRow.style.display = 'flex';
    textRow.style.alignItems = 'center';
    
    const textSpan = doc.createElement('span');
    textSpan.className = 'loader-text';
    textSpan.innerText = `Запуск ${title}...`;
    
    const percentSpan = doc.createElement('span');
    percentSpan.className = 'loader-percent';
    percentSpan.innerText = '0%';
    
    textRow.appendChild(textSpan);
    textRow.appendChild(percentSpan);
    
    const progressContainer = doc.createElement('div');
    progressContainer.className = 'progress-container';
    
    const progressBar = doc.createElement('div');
    progressBar.className = 'progress-bar';
    progressContainer.appendChild(progressBar);
    
    loaderContainer.appendChild(spinner);
    loaderContainer.appendChild(textRow);
    loaderContainer.appendChild(progressContainer);
    doc.body.appendChild(loaderContainer);

    // Inject iframe pointing to the destination
    const iframe = doc.createElement('iframe');
    iframe.src = url;
    iframe.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals';
    iframe.allow = 'fullscreen; clipboard-read; clipboard-write; autoplay';
    doc.body.appendChild(iframe);

    // Animate loader
    let progress = 0;
    const duration = 18000; // 18 seconds
    const intervalTime = 50;
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(100, (elapsed / duration) * 100);
      
      progressBar.style.width = `${progress}%`;
      percentSpan.innerText = `${Math.round(progress)}%`;
      
      if (progress >= 100) {
        clearInterval(interval);
        loaderContainer.style.opacity = '0';
        setTimeout(() => {
          if (loaderContainer.parentNode) {
            loaderContainer.parentNode.removeChild(loaderContainer);
          }
        }, 300);
      }
    }, intervalTime);

  } catch (e) {
    console.error('Failed to open about:blank tab, falling back:', e);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
