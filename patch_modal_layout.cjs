const fs = require('fs');
let content = fs.readFileSync('src/components/LisyanConnectModal.tsx', 'utf-8');

// Replace wrapper
const beforeWrapper = `  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={\`fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 \${isFullscreen ? 'bg-[var(--bg)]' : 'bg-black/40 backdrop-blur-md'}\`}
    >
      <div className={\`flex flex-col bg-[var(--surface)] border border-[var(--outline)] shadow-2xl transition-all duration-500 overflow-hidden \${isFullscreen ? 'w-full h-full rounded-none border-none' : 'w-full max-w-xl rounded-3xl h-[85vh] max-h-[800px]'}\`}>`;

const afterWrapper = `  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={isMobile 
        ? \`fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 \${isFullscreen ? 'bg-[var(--bg)]' : 'bg-black/40 backdrop-blur-md'}\`
        : \`fixed z-[200] flex flex-col overflow-hidden shadow-2xl border border-[var(--outline)] bg-[var(--surface)] transition-all duration-300 \${isFullscreen ? 'inset-0 rounded-none border-none' : 'inset-10 rounded-3xl'}\`
      }
    >
      <div className={isMobile 
        ? \`flex flex-col bg-[var(--surface)] border border-[var(--outline)] shadow-2xl transition-all duration-500 overflow-hidden \${isFullscreen ? 'w-full h-full rounded-none border-none' : 'w-full max-w-xl rounded-3xl h-[85vh] max-h-[800px]'}\`
        : "flex flex-col h-full w-full"
      }>`;

content = content.replace(beforeWrapper, afterWrapper);

// Replace landing view entirely
const beforeLanding = `            {view === 'landing' && (
              <motion.div
                key="landing"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                {!isMobile && (
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-[var(--on-surface)] mb-2 tracking-tight">
                      {lang === 'ru' ? 'Откройте LinkerRu везде' : 'Open LinkerRu anywhere'}
                    </h2>
                    <p className="text-xs font-bold text-[var(--on-surface-var)] max-w-md mx-auto mb-4">
                      {lang === 'ru' 
                        ? 'Lisyan Connect позволяет передавать файлы напрямую между устройствами. Чтобы открыть на телефоне, отсканируйте код или введите адрес:' 
                        : 'Lisyan Connect allows direct file transfer between devices. To open on phone, scan the code or enter this address:'}
                    </p>
                    <div className="mt-4 flex flex-col items-center">
                      <div className="bg-white p-2 rounded-2xl mb-2">
                        <QRCode value={'https://linkerrulauncher.netlify.app/'} size={80} />
                      </div>
                      <code className="text-[10px] font-mono font-bold bg-[var(--surface-dim)] px-2 py-1 rounded text-[var(--on-surface-var)] break-all max-w-[250px]">
                        https://linkerrulauncher.netlify.app/
                      </code>
                    </div>
                  </div>
                )}

                <div className="mb-6 max-w-md mx-auto w-full bg-[var(--surface-dim)] border border-[var(--outline)] rounded-2xl p-4 flex items-start gap-3">
                  <div className="text-[var(--on-surface-var)] shrink-0 mt-0.5">
                    <AlertTriangle size={18} />
                  </div>
                  <p className="text-xs font-bold text-[var(--on-surface-var)]">
                    {lang === 'ru' ? 'Lisyan Connect может не работать в публичных или школьных Wi-Fi сетях (из-за ограничений WebRTC). Рекомендуется использовать мобильную точку доступа или мобильный интернет.' : 'Lisyan Connect may not work on public or school Wi-Fi networks (due to WebRTC restrictions). It is recommended to use a mobile hotspot or cellular data.'}
                  </p>
                </div>

                <div className="space-y-6 max-w-sm mx-auto w-full">
                  {!isMobile && (
                  <div className="space-y-3">
                    <label className="text-xs font-black text-[var(--on-surface-var)] uppercase ml-1">{lang === 'ru' ? 'Тип устройства' : 'Device Type'}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'pc', icon: Monitor, label: 'PC' },
                        { id: 'laptop', icon: Laptop, label: 'Laptop' },
                        { id: 'phone', icon: Smartphone, label: 'Phone' }
                      ].map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            onClick={() => setDeviceType(type.id as any)}
                            className={\`flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all \${deviceType === type.id ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-md' : 'border-[var(--outline)] bg-[var(--surface-dim)] text-[var(--on-surface-var)] hover:border-[var(--outline-high)]'}\`}
                          >
                            <Icon size={24} />
                            <span className="text-xs font-bold mt-2">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-xs font-black text-[var(--on-surface-var)] uppercase ml-1">{lang === 'ru' ? 'Имя устройства' : 'Device Name'}</label>
                    <input
                      type="text"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      placeholder={lang === 'ru' ? 'Введите имя...' : 'Enter name...'}
                      className="w-full bg-[var(--surface-dim)] border border-[var(--outline)] rounded-2xl px-4 py-3 text-[var(--on-surface)] text-sm font-semibold outline-none focus:border-[var(--accent)] transition-colors"
                    />
                  </div>

                  <div className="pt-4 flex flex-col gap-3">
                    <button
                      onClick={handleCreateRoom}
                      disabled={!deviceName || (!isMobile && !deviceType)}
                      className="w-full py-4 bg-[var(--accent)] text-white font-black rounded-2xl active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:active:scale-100"
                    >
                      {lang === 'ru' ? 'Создать комнату' : 'Create Room'}
                    </button>
                    <button
                      onClick={() => setView('guest')}
                      className="w-full py-4 bg-[var(--surface-dim)] text-[var(--on-surface)] font-black rounded-2xl border border-[var(--outline)] hover:bg-[var(--container)] active:scale-95 transition-all"
                    >
                      {lang === 'ru' ? 'Подключиться к комнату' : 'Join a Room'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}`;

const afterLanding = `            {view === 'landing' && (
              <motion.div
                key="landing"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={isMobile ? "flex flex-col h-full" : "flex flex-row h-full w-full divide-x divide-[var(--outline)]"}
              >
                {!isMobile && (
                  <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-[var(--surface-dim)] rounded-2xl flex items-center justify-center text-[var(--on-surface)] mb-6 shadow-sm border border-[var(--outline)]">
                      <Monitor size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-[var(--on-surface)] mb-4 tracking-tight">
                      {lang === 'ru' ? 'Откройте LinkerRu везде' : 'Open LinkerRu anywhere'}
                    </h2>
                    <p className="text-sm font-bold text-[var(--on-surface-var)] max-w-sm mx-auto mb-8">
                      {lang === 'ru' 
                        ? 'Lisyan Connect позволяет передавать файлы напрямую между устройствами. Чтобы открыть на телефоне, отсканируйте код или введите адрес:' 
                        : 'Lisyan Connect allows direct file transfer between devices. To open on phone, scan the code or enter this address:'}
                    </p>
                    <div className="bg-white p-4 rounded-3xl mb-4 shadow-sm">
                      <QRCode value={'https://linkerrulauncher.netlify.app/'} size={140} />
                    </div>
                    <code className="text-xs font-mono font-bold bg-[var(--surface-dim)] px-4 py-2 rounded-xl text-[var(--on-surface-var)] border border-[var(--outline)]">
                      https://linkerrulauncher.netlify.app/
                    </code>
                  </div>
                )}

                <div className={isMobile ? "flex flex-col h-full" : "flex-1 p-8 flex flex-col justify-center relative overflow-y-auto"}>
                  <div className="mb-6 max-w-md mx-auto w-full bg-[var(--surface-dim)] border border-[var(--outline)] rounded-2xl p-4 flex items-start gap-3">
                    <div className="text-[var(--on-surface-var)] shrink-0 mt-0.5">
                      <AlertTriangle size={18} />
                    </div>
                    <p className="text-xs font-bold text-[var(--on-surface-var)]">
                      {lang === 'ru' ? 'Lisyan Connect может не работать в публичных или школьных Wi-Fi сетях (из-за ограничений WebRTC). Рекомендуется использовать мобильную точку доступа или мобильный интернет.' : 'Lisyan Connect may not work on public or school Wi-Fi networks (due to WebRTC restrictions). It is recommended to use a mobile hotspot or cellular data.'}
                    </p>
                  </div>

                  <div className="space-y-6 max-w-sm mx-auto w-full">
                    {!isMobile && (
                    <div className="space-y-3">
                      <label className="text-xs font-black text-[var(--on-surface-var)] uppercase ml-1">{lang === 'ru' ? 'Тип устройства' : 'Device Type'}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'pc', icon: Monitor, label: 'PC' },
                          { id: 'laptop', icon: Laptop, label: 'Laptop' },
                          { id: 'phone', icon: Smartphone, label: 'Phone' }
                        ].map((type) => {
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.id}
                              onClick={() => setDeviceType(type.id as any)}
                              className={\`flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all \${deviceType === type.id ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-md' : 'border-[var(--outline)] bg-[var(--surface-dim)] text-[var(--on-surface-var)] hover:border-[var(--outline-high)]'}\`}
                            >
                              <Icon size={24} />
                              <span className="text-xs font-bold mt-2">{type.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    )}

                    <div className="space-y-3">
                      <label className="text-xs font-black text-[var(--on-surface-var)] uppercase ml-1">{lang === 'ru' ? 'Имя устройства' : 'Device Name'}</label>
                      <input
                        type="text"
                        value={deviceName}
                        onChange={(e) => setDeviceName(e.target.value)}
                        placeholder={lang === 'ru' ? 'Введите имя...' : 'Enter name...'}
                        className="w-full bg-[var(--surface-dim)] border border-[var(--outline)] rounded-2xl px-4 py-3 text-[var(--on-surface)] text-sm font-semibold outline-none focus:border-[var(--accent)] transition-colors"
                      />
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                      <button
                        onClick={handleCreateRoom}
                        disabled={!deviceName || (!isMobile && !deviceType)}
                        className="w-full py-4 bg-[var(--accent)] text-white font-black rounded-2xl active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:active:scale-100"
                      >
                        {lang === 'ru' ? 'Создать комнату' : 'Create Room'}
                      </button>
                      <button
                        onClick={() => setView('guest')}
                        className="w-full py-4 bg-[var(--surface-dim)] text-[var(--on-surface)] font-black rounded-2xl border border-[var(--outline)] hover:bg-[var(--container)] active:scale-95 transition-all"
                      >
                        {lang === 'ru' ? 'Подключиться к комнату' : 'Join a Room'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}`;

content = content.replace(beforeLanding, afterLanding);
fs.writeFileSync('src/components/LisyanConnectModal.tsx', content);
