import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

type FabProps = {
  label: string;
  onClick: () => void;
};

export function Fab({ label, onClick }: FabProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-30 inline-flex h-14 -translate-x-1/2 items-center justify-center gap-2.5 rounded-full bg-slate-900 pl-4 pr-5 text-[0.9375rem] font-medium text-white shadow-elevated transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
    >
      <Plus className="h-5 w-5" strokeWidth={2.5} />
      <span>{label}</span>
    </motion.button>
  );
}