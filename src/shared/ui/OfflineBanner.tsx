import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-[60] border-b border-red-200 bg-red-50/95 backdrop-blur dark:border-red-900/60 dark:bg-red-950/90">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 text-sm font-semibold text-red-900 dark:text-red-100 sm:px-6 lg:px-8">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>{t('errors.offline')}</span>
      </div>
    </div>
  );
}