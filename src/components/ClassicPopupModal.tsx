import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ClassicPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-md', 'max-w-2xl', 'max-w-4xl'
  maxHeight?: string;
  headerActions?: React.ReactNode;
}

export function ClassicPopupModal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = 'max-w-2xl',
  maxHeight = 'max-h-[85vh]',
  headerActions,
}: ClassicPopupModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden select-none"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop with soft blur and darkened overlay that completely blocks interactions with desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md cursor-pointer"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full ${maxWidth} ${maxHeight} flex flex-col rounded-3xl bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--outline)] shadow-2xl overflow-hidden z-10 select-text`}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--outline-var)] bg-[var(--surface-dim)] shrink-0 select-none">
              <div className="flex items-center gap-2.5 min-w-0">
                {icon && (
                  <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--outline-var)] shadow-xs shrink-0">
                    {icon}
                  </div>
                )}
                <h3 className="text-sm font-black tracking-tight text-[var(--on-surface)] truncate">
                  {title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {headerActions}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface)] hover:bg-[var(--surface-bright)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)] border border-[var(--outline-var)] transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                >
                  <X size={15} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 relative">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
