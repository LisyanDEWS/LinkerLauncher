const fs = require('fs');
let content = fs.readFileSync('src/components/FullSettingsModal.tsx', 'utf-8');

const targetButton = `                <button
                  onClick={() => {
                    setActiveTab('about');
                    setSearchQuery('');
                  }}
                  className={\`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left \${
                    activeTab === 'about' && !searchQuery
                      ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm'
                      : 'text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)]'
                  }\`}
                  id="tab-about-btn"
                >
                  <Info size={16} />
                  <span>{t.page_about}</span>
                </button>`;

const replacementButton = targetButton + `
                <button
                  onClick={() => {
                    setActiveTab('developer');
                    setSearchQuery('');
                  }}
                  className={\`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left \${
                    activeTab === 'developer' && !searchQuery
                      ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm'
                      : 'text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)]'
                  }\`}
                  id="tab-dev-btn"
                >
                  <AlertTriangle size={16} />
                  <span>{lang === 'ru' ? 'Dev опции' : 'Dev Options'}</span>
                </button>`;

content = content.replace(targetButton, replacementButton);

const targetType = `type Tab = 'appearance' | 'language' | 'notifications' | 'security' | 'links' | 'toggles' | 'sound' | 'about';`;
const replacementType = `type Tab = 'appearance' | 'language' | 'notifications' | 'security' | 'links' | 'toggles' | 'sound' | 'about' | 'developer';`;

content = content.replace(targetType, replacementType);

const targetTitle = `                  ) : activeTab === 'about' ? (
                    <Info size={16} />
                  ) : (`;
const replacementTitle = `                  ) : activeTab === 'developer' ? (
                    <AlertTriangle size={16} />
                  ) : activeTab === 'about' ? (
                    <Info size={16} />
                  ) : (`;

content = content.replace(targetTitle, replacementTitle);

const targetTitleText = `                  {activeTab === 'about' ? t.page_about : ''}`;
const replacementTitleText = `                  {activeTab === 'about' ? t.page_about : activeTab === 'developer' ? (lang === 'ru' ? 'Опции разработчика' : 'Developer Options') : ''}`;

content = content.replace(targetTitleText, replacementTitleText);

const targetTabContent = `                    {activeTab === 'about' && (`;

const devTabContent = `                    {activeTab === 'developer' && (
                      <div className="flex flex-col gap-6 animate-fade-in pb-10" id="dev-options-tab">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="w-12 h-12 rounded-full bg-[var(--surface-dim)] border border-[var(--outline)] flex items-center justify-center text-[var(--on-surface)]">
                            <AlertTriangle size={24} className="text-red-500" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-[var(--on-surface)] uppercase tracking-tight">
                              {lang === 'ru' ? 'Опции разработчика' : 'Developer Options'}
                            </h3>
                            <p className="text-xs font-bold text-[var(--on-surface-var)] mt-1">
                              {lang === 'ru' ? 'Опасные действия' : 'Dangerous actions'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3" id="dev-danger-zone">
                          <div className="p-5 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl space-y-4">
                             <div className="flex flex-col gap-2">
                                <h4 className="text-sm font-black text-[var(--on-surface)]">
                                  {lang === 'ru' ? 'Уничтожить сессию' : 'Destroy Session'}
                                </h4>
                                <p className="text-xs font-bold text-[var(--on-surface-var)]">
                                  {lang === 'ru' 
                                    ? 'Это действие удалит все локальные данные, настройки, кастомные ссылки, и сбросит приложение до заводских настроек. Отменить это действие невозможно.' 
                                    : 'This action will delete all local data, settings, custom links, and reset the app to factory defaults. This cannot be undone.'}
                                </p>
                             </div>
                             <button
                               onClick={() => {
                                 if (window.confirm(lang === 'ru' ? 'Вы уверены? Все данные будут удалены.' : 'Are you sure? All data will be deleted.')) {
                                   localStorage.clear();
                                   window.location.reload();
                                 }
                               }}
                               className="w-full py-4 bg-red-500/10 text-red-500 hover:bg-red-500/20 active:bg-red-500/30 font-black rounded-xl border border-red-500/20 transition-all flex items-center justify-center gap-2"
                             >
                               <AlertTriangle size={18} />
                               {lang === 'ru' ? 'УНИЧТОЖИТЬ СЕССИЮ' : 'DESTROY SESSION'}
                             </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
`;

content = content.replace(targetTabContent, devTabContent + targetTabContent);

fs.writeFileSync('src/components/FullSettingsModal.tsx', content);
