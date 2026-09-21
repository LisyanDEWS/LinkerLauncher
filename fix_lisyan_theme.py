import re

with open('src/components/LisyanConnectModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add theme and activePalette to props
content = content.replace('lang: string;', 'lang: string;\n  theme: string;\n  activePalette: any;')
content = content.replace('lang }: LisyanConnectModalProps)', 'lang, theme, activePalette }: LisyanConnectModalProps)')

# Update the about:blank script to send LINKER_CONFIG to the iframe
about_blank_script = """                          <script>
                            window.addEventListener('message', (e) => {
                                if (e.data && e.data.type === 'CHILD_READY') {
                                    // Not needed if we just delay
                                }
                            });
                            setTimeout(() => {
                                const frame = document.getElementById('lc-frame');
                                if (frame && frame.contentWindow) {
                                    frame.contentWindow.postMessage({
                                        type: 'LINKER_CONFIG',
                                        theme: '${theme}',
                                        palette: ${JSON.stringify(activePalette)}
                                    }, '*');
                                }
                            }, 500);
                          </script>"""

iframe_repl = r'''<iframe id="lc-frame" src="${window.location.origin}/apps/lisyan-connect.html" style="width: 100vw; height: 100vh; border: none;" allow="camera; microphone; clipboard-write"></iframe>
                          ''' + about_blank_script

content = re.sub(r'<iframe src="\$\{window\.location\.origin\}\/apps\/lisyan-connect\.html".*?><\/iframe>', iframe_repl, content)

# Also update the modal's internal iframe to send the config
internal_iframe = r'''<iframe 
              src="/apps/lisyan-connect.html" 
              className="w-full h-full border-none"
              title="Lisyan Connect"
              allow="camera; microphone; clipboard-write"
            />'''

internal_iframe_repl = r'''<iframe 
              ref={(f) => {
                if (f && f.contentWindow) {
                  // Send config when it loads or on update
                  f.contentWindow.postMessage({
                    type: 'LINKER_CONFIG',
                    theme,
                    palette: activePalette
                  }, '*');
                }
              }}
              src="/apps/lisyan-connect.html" 
              className="w-full h-full border-none"
              title="Lisyan Connect"
              allow="camera; microphone; clipboard-write"
            />'''
content = content.replace(internal_iframe, internal_iframe_repl)


# And Linker.Ru button
linkerru_button_old = r'''window.open(window.location.origin + '/apps/lisyan-connect.html', '_blank');'''
linkerru_button_new = r'''const win = window.open(window.location.origin + '/apps/lisyan-connect.html', '_blank');
                     if (win) {
                       win.onload = () => {
                         win.postMessage({
                            type: 'LINKER_CONFIG',
                            theme,
                            palette: activePalette
                         }, '*');
                       };
                     }'''
content = content.replace(linkerru_button_old, linkerru_button_new)

with open('src/components/LisyanConnectModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
