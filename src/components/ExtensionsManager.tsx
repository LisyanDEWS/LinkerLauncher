import React, { useState, useEffect } from 'react';
import { Blocks, Paintbrush, Download, Check, Trash2, Search, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWindows } from './WindowManager';
import { Language } from '../types';

interface ExtensionsManagerProps {
  lang: Language;
  wm: ReturnType<typeof useWindows>;
  playChime?: (type?: 'click' | 'alert' | 'reset' | 'victory' | 'toast') => void;
  triggerToast?: (text: string) => void;
}

interface ExtensionItem {
  id: string;
  name: string;
  category: string;
  description: { ru: string; en: string; uk: string };
  version: string;
  size: string;
  author: string;
  icon: React.ReactNode;
}

export function ExtensionsManager({ lang, wm, playChime, triggerToast }: ExtensionsManagerProps) {
  // Installed extensions state persisted in localStorage (defaults to empty list until installed)
  const [installedIds, setInstalledIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('linkerru_installed_extensions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Downloading simulation states: { [extId]: progressPercentage }
  const [downloadingMap, setDownloadingMap] = useState<Record<string, number>>({});
  const [statusTextMap, setStatusTextMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'installed' | 'store'>('all');

  useEffect(() => {
    localStorage.setItem('linkerru_installed_extensions', JSON.stringify(installedIds));
  }, [installedIds]);

  const extensionsList: ExtensionItem[] = [
    {
      id: 'wallpaper-plus',
      name: 'Wallpaper+',
      category: lang === 'ru' ? 'Персонализация' : lang === 'uk' ? 'Персоналізація' : 'Personalization',
      description: {
        ru: 'Расширенная 4K галерея обоев с движком мгновенного применения на рабочий стол LinkerRu.',
        uk: 'Розширена 4K галерея шпалер із рушієм миттєвого застосування на робочий стіл LinkerRu.',
        en: 'Advanced 4K wallpaper gallery with direct desktop engine for LinkerRu.',
      },
      version: 'v2.4.0',
      size: '1.2 MB',
      author: 'Linker Studio',
      icon: <Paintbrush size={24} />,
    },
  ];

  const handleOpenExtension = (extId: string) => {
    playChime?.('click');
    if (extId === 'wallpaper-plus') {
      wm.open({
        id: 'wallpaper-plus',
        title: 'Wallpaper+',
        icon: <Paintbrush size={14} className="text-[var(--on-surface)]" />,
        singleton: true,
        initialWidth: 1024,
        initialHeight: 720,
        minWidth: 460,
        minHeight: 340,
        render: () => (
          <iframe
            src="/wallpaper-ext.html"
            title="Wallpaper+"
            className="w-full h-full border-none bg-transparent"
          />
        ),
      });
    } else {
      triggerToast?.(lang === 'ru' ? `Запуск ${extId}...` : lang === 'uk' ? `Запуск ${extId}...` : `Launching ${extId}...`);
    }
  };

  const handleInstallSimulation = (extId: string) => {
    if (downloadingMap[extId] !== undefined) return;
    playChime?.('click');

    let progress = 0;
    setDownloadingMap((prev) => ({ ...prev, [extId]: 0 }));
    setStatusTextMap((prev) => ({ ...prev, [extId]: lang === 'ru' ? 'Подключение...' : lang === 'uk' ? 'Підключення...' : 'Connecting...' }));

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 18) + 12;
      if (progress < 40) {
        setStatusTextMap((prev) => ({ ...prev, [extId]: lang === 'ru' ? 'Загрузка пакета...' : lang === 'uk' ? 'Завантаження пакета...' : 'Downloading package...' }));
      } else if (progress < 80) {
        setStatusTextMap((prev) => ({ ...prev, [extId]: lang === 'ru' ? 'Распаковка ресурсов...' : lang === 'uk' ? 'Розпакування ресурсів...' : 'Unpacking assets...' }));
      } else if (progress < 100) {
        setStatusTextMap((prev) => ({ ...prev, [extId]: lang === 'ru' ? 'Регистрация манифеста...' : lang === 'uk' ? 'Реєстрація маніфесту...' : 'Registering manifest...' }));
      }

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setDownloadingMap((prev) => {
            const next = { ...prev };
            delete next[extId];
            return next;
          });
          setStatusTextMap((prev) => {
            const next = { ...prev };
            delete next[extId];
            return next;
          });
          setInstalledIds((prev) => Array.from(new Set([...prev, extId])));
          playChime?.('victory');
          const extName = extensionsList.find((e) => e.id === extId)?.name || extId;
          triggerToast?.(lang === 'ru' ? `Расширение ${extName} установлено!` : lang === 'uk' ? `Розширення ${extName} встановлено!` : `${extName} extension installed!`);
        }, 400);
      } else {
        setDownloadingMap((prev) => ({ ...prev, [extId]: progress }));
      }
    }, 250);
  };

  const handleUninstall = (extId: string) => {
    playChime?.('click');
    setInstalledIds((prev) => prev.filter((id) => id !== extId));
    const extName = extensionsList.find((e) => e.id === extId)?.name || extId;
    triggerToast?.(lang === 'ru' ? `Расширение ${extName} удалено` : lang === 'uk' ? `Розширення ${extName} видалено` : `${extName} uninstalled`);
  };

  const filteredExtensions = extensionsList.filter((ext) => {
    const isInstalled = installedIds.includes(ext.id);
    if (activeTab === 'installed' && !isInstalled) return false;
    if (activeTab === 'store' && isInstalled) return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = ext.name.toLowerCase().includes(query);
      const matchDesc = (ext.description[lang] || ext.description.en).toLowerCase().includes(query);
      const matchCat = ext.category.toLowerCase().includes(query);
      return matchName || matchDesc || matchCat;
    }
    return true;
  });

  return (
    <div className="w-full h-full bg-transparent text-[var(--on-surface)] flex flex-col p-5 md:p-6 overflow-y-auto select-none font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--outline-var)]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-[var(--accent)] text-white shadow-sm">
              <Blocks size={20} />
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              {lang === 'ru' ? 'Менеджер расширений' : lang === 'uk' ? 'Менеджер розширень' : 'Extension Store & Manager'}
            </h2>
          </div>
          <p className="text-xs text-[var(--on-surface-var)]">
            {lang === 'ru'
              ? 'Управление плагинами, обоями и системными виджетами'
              : lang === 'uk'
              ? 'Керування плагінами, шпалерами та системними віджетами'
              : 'Manage plugins, wallpapers, and desktop widgets'}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--on-surface-var)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ru' ? 'Поиск расширений...' : lang === 'uk' ? 'Пошук розширень...' : 'Search extensions...'}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--container)] border border-[var(--outline-var)] text-xs focus:outline-none focus:border-[var(--accent)] text-[var(--on-surface)] transition-all"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => { playChime?.('click'); setActiveTab('all'); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'bg-[var(--container)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
          }`}
        >
          {lang === 'ru' ? 'Все' : lang === 'uk' ? 'Усі' : 'All'} ({extensionsList.length})
        </button>
        <button
          onClick={() => { playChime?.('click'); setActiveTab('installed'); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'installed'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'bg-[var(--container)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
          }`}
        >
          {lang === 'ru' ? 'Установленные' : lang === 'uk' ? 'Встановлені' : 'Installed'} ({installedIds.length})
        </button>
        <button
          onClick={() => { playChime?.('click'); setActiveTab('store'); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'store'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'bg-[var(--container)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
          }`}
        >
          {lang === 'ru' ? 'Каталог' : lang === 'uk' ? 'Каталог' : 'Store'} ({extensionsList.length - installedIds.length})
        </button>
      </div>

      {/* Extension Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExtensions.map((ext) => {
          const isInstalled = installedIds.includes(ext.id);
          const progress = downloadingMap[ext.id];
          const isDownloading = progress !== undefined;

          return (
            <motion.div
              key={ext.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative bg-[var(--container)] p-4 rounded-2xl border border-[var(--outline-var)] hover:border-[var(--outline)] transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[var(--accent)] text-white shadow-sm">
                      {ext.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[var(--on-surface)]">{ext.name}</h3>
                      <p className="text-[11px] text-[var(--on-surface-var)]">
                        {ext.category} • {ext.version} • {ext.size}
                      </p>
                    </div>
                  </div>

                  {isInstalled && (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-semibold text-[10px] flex items-center gap-1">
                      <Check size={10} /> {lang === 'ru' ? 'Установлено' : lang === 'uk' ? 'Встановлено' : 'Installed'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[var(--on-surface-var)] leading-relaxed mb-4">
                  {ext.description[lang] || ext.description.en}
                </p>
              </div>

              {/* Action area */}
              <div className="pt-3 border-t border-[var(--outline-var)]/60 flex items-center justify-between">
                <span className="text-[10px] text-[var(--on-surface-var)]">
                  {lang === 'ru' ? 'Автор:' : lang === 'uk' ? 'Автор:' : 'Author:'} <strong className="text-[var(--on-surface)]">{ext.author}</strong>
                </span>

                <div className="flex items-center gap-2">
                  {isDownloading ? (
                    <div className="flex flex-col items-end gap-1 min-w-[130px]">
                      <span className="text-[10px] font-medium text-[var(--accent)] animate-pulse">
                        {statusTextMap[ext.id] || 'Loading...'} {progress}%
                      </span>
                      <div className="w-full h-1.5 bg-[var(--surface)] rounded-full overflow-hidden border border-[var(--outline-var)]">
                        <div
                          className="h-full bg-[var(--accent)] transition-all duration-200"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : isInstalled ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUninstall(ext.id)}
                        title={lang === 'ru' ? 'Удалить расширение' : lang === 'uk' ? 'Видалити розширення' : 'Uninstall extension'}
                        className="p-2 rounded-xl bg-[var(--surface)] text-[var(--on-surface-var)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>

                      <button
                        onClick={() => handleOpenExtension(ext.id)}
                        className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-bold text-xs flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-sm"
                      >
                        <ExternalLink size={13} />
                        {lang === 'ru' ? 'Открыть' : lang === 'uk' ? 'Відкрити' : 'Open'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleInstallSimulation(ext.id)}
                      className="px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--accent)] hover:text-white hover:border-transparent font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Download size={13} />
                      {lang === 'ru' ? 'Загрузить' : lang === 'uk' ? 'Завантажити' : 'Install'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredExtensions.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--on-surface-var)]">
          <Blocks size={36} className="mb-2 opacity-40" />
          <p className="text-sm font-medium">
            {lang === 'ru' ? 'Расширения не найдены' : lang === 'uk' ? 'Розширення не знайдено' : 'No extensions found'}
          </p>
        </div>
      )}
    </div>
  );
}
