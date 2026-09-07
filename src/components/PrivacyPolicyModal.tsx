import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X, Cloud, Lock, HardDrive, EyeOff } from 'lucide-react';
import { Language } from '../types';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export function PrivacyPolicyModal({ isOpen, onClose, lang }: PrivacyPolicyModalProps) {
  const isRu = lang === 'ru';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl bg-[var(--surface)] border border-[var(--outline-var)] shadow-2xl overflow-hidden z-10 text-[var(--on-surface)]"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[var(--outline-var)] flex items-center justify-between bg-[var(--surface-dim)]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    {isRu ? 'Политика конфиденциальности' : 'Privacy Policy'}
                  </h3>
                  <p className="text-[11px] font-semibold text-[var(--on-surface-var)]">
                    LinkerRu :Re • {isRu ? 'Безопасность и хранение данных' : 'Security & Data Storage'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs font-medium leading-relaxed text-[var(--on-surface-var)]">
              {/* Section 1 */}
              <div className="p-4 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)]/60 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] shrink-0 mt-0.5">
                  <Cloud size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-[var(--on-surface)]">
                    {isRu ? '1. Облачная синхронизация данных' : '1. Cloud Data Synchronization'}
                  </h4>
                  <p>
                    {isRu
                      ? 'LinkerRu :Re синхронизирует ваши настройки интерфейса, активные темы оформления, обои, виджеты и персональные ссылки с защищённым сервером на базе Firebase Firestore. Это обеспечивает сохранность персонализации и доступ к вашему рабочему столу с любого устройства при входе в систему.'
                      : 'LinkerRu :Re synchronizes your interface settings, active themes, wallpapers, widgets, and personalized links with a secure cloud server powered by Firebase Firestore. This ensures your personalized workspace is preserved and accessible from any device upon sign-in.'}
                  </p>
                </div>
              </div>

              {/* Section 2 */}
              <div className="p-4 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)]/60 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] shrink-0 mt-0.5">
                  <Lock size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-[var(--on-surface)]">
                    {isRu ? '2. Защита учетных записей и паролей' : '2. Account & Password Security'}
                  </h4>
                  <p>
                    {isRu
                      ? 'Все пароли и учетные данные шифруются в соответствии со стандартами Firebase Authentication. Доступ к вашим личным данным ограничен строгими правилами безопасности (Firestore Security Rules), исключающими доступ посторонних пользователей к вашему профилю.'
                      : 'All passwords and authentication credentials are encrypted using industry-standard Firebase Authentication security protocols. Access to your personal data is protected by strict owner-scoped security rules that prevent unauthorized access.'}
                  </p>
                </div>
              </div>

              {/* Section 3 */}
              <div className="p-4 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)]/60 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] shrink-0 mt-0.5">
                  <HardDrive size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-[var(--on-surface)]">
                    {isRu ? '3. Локальное кэширование и контроль' : '3. Local Caching & User Control'}
                  </h4>
                  <p>
                    {isRu
                      ? 'Для обеспечения плавности анимаций и мгновенной загрузки копия ваших настроек сохраняется в локальной памяти браузера. Вы можете полностью уничтожить сессию и удалить кэшированные данные одним нажатием в разделе «Безопасность» настроек.'
                      : 'For smooth animations and instant loading speeds, a cache of your preferences is stored in your browser local storage. You can completely destroy your local session and clear cached data at any time via the Security settings.'}
                  </p>
                </div>
              </div>

              {/* Section 4 */}
              <div className="p-4 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)]/60 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] shrink-0 mt-0.5">
                  <EyeOff size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-[var(--on-surface)]">
                    {isRu ? '4. Защита от передачи третьим лицам' : '4. No Third-Party Selling'}
                  </h4>
                  <p>
                    {isRu
                      ? 'Мы не продаём ваши личные данные, не внедряем сторонние рекламные трекеры и не передаём информацию третьим лицам. Все сервисы LinkerRu служат исключительно для комфортной работы пользователя.'
                      : 'We do not sell your personal data, employ third-party ad tracking, or transmit your information to external advertisers. LinkerRu services are built solely for user comfort.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-[var(--outline-var)] flex items-center justify-between bg-[var(--surface-dim)]/50">
              <span className="text-[10px] font-semibold text-[var(--on-surface-var)]">
                {isRu ? 'Обновлено: Сентябрь 2026' : 'Updated: September 2026'}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--on-accent)] text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
              >
                {isRu ? 'Понятно' : 'Understood'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
