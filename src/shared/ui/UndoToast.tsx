import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Undo2 } from 'lucide-react';

export type UndoToastData = {
  id: string;
  message: string;
  onUndo: () => void;
};

type UndoToastProps = {
  toast: UndoToastData | null;
  onDismiss: () => void;
  durationMs?: number;
};

export function UndoToast({ toast, onDismiss, durationMs = 5000 }: UndoToastProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [toast?.id, onDismiss, durationMs]);

  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          key={toast.id}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className="safe-bottom pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-5 md:bottom-6"
        >
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 shadow-elevated dark:bg-slate-100">
            <p className="text-sm font-medium text-white dark:text-slate-900">{toast.message}</p>
            <button
              type="button"
              onClick={() => { toast.onUndo(); onDismiss(); }}
              className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/30 dark:bg-slate-900/20 dark:text-slate-900 dark:hover:bg-slate-900/30"
            >
              <Undo2 className="h-3.5 w-3.5" strokeWidth={2.5} />
              {t('dashboard.undo')}
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
