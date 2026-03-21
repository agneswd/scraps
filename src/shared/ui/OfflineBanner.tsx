import { WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="sticky top-0 z-[60] bg-red-500 dark:bg-red-600"
    >
      <div className="mx-auto flex max-w-lg items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white">
        <WifiOff className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
        <span>{t('errors.offline')}</span>
      </div>
    </motion.div>
  );
}