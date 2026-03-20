import { TriangleAlert } from 'lucide-react';
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
    <section className="flex items-start gap-3 rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950 shadow-card dark:border-amber-900 dark:bg-amber-950/70 dark:text-amber-100">
      <div className="rounded-full bg-amber-200/80 p-3 dark:bg-amber-900/80">
        <TriangleAlert className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em]">{t('dashboard.expiryBannerLabel')}</p>
        <p className="mt-1 text-base font-semibold">
          {t('dashboard.expiryBanner', { count: expiringCount })}
        </p>
      </div>
    </section>
  );
}
