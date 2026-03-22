import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ModalProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fullScreen?: boolean;
  onExitComplete?: () => void;
};

export function Modal({ children, isOpen, onClose, title, fullScreen = false, onExitComplete }: ModalProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const body = typeof document !== 'undefined' ? document.body : null;
  if (!body) return null;

  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center sm:px-6"
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{
              y: isOpen
                ? { type: 'spring', stiffness: 260, damping: 28 }
                : { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
            }}
            className={[
              'flex w-full flex-col overflow-hidden bg-white shadow-elevated outline-none dark:bg-slate-900',
              fullScreen
                ? 'h-[100dvh] max-h-none max-w-none rounded-none'
                : 'max-h-[94vh] max-w-lg rounded-t-[2rem] sm:rounded-[2rem]',
            ].join(' ')}
          >
            <div className={[
              'flex items-center justify-between px-6 pb-2 pt-5',
              fullScreen ? 'pt-[max(1.25rem,env(safe-area-inset-top))]' : '',
            ].join(' ')}>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 ease-spring hover:bg-slate-200 active:scale-90 dark:bg-slate-800 dark:text-slate-400"
                aria-label={t('common.close')}
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>

            <div className={[
              'overflow-y-auto pt-2',
              fullScreen ? 'flex-1 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]' : 'px-6 pb-8',
            ].join(' ')}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
