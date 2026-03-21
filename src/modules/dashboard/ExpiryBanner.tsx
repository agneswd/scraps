import { TriangleAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

type ExpiryBannerProps = {
  expiringCount: number;
};

export function ExpiryBanner({ expiringCount }: ExpiryBannerProps) {
  const { t } = useTranslation();

  if (expiringCount === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/30"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
        <TriangleAlert className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          {t('dashboard.expiryBanner', { count: expiringCount })}
        </p>
      </div>
    </motion.section>
  );
}
