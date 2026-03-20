import { useTranslation } from 'react-i18next';

type WasteRatioBarProps = {
  consumedCount: number;
  wastedCount: number;
};

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function WasteRatioBar({ consumedCount, wastedCount }: WasteRatioBarProps) {
  const { t } = useTranslation();
  const totalItems = consumedCount + wastedCount;
  const consumedPercentage = totalItems === 0 ? 0 : (consumedCount / totalItems) * 100;
  const wastedPercentage = totalItems === 0 ? 0 : (wastedCount / totalItems) * 100;

  return (
    <section className="rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-card backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-600 dark:text-brand-200">
            {t('stats.ratioLabel')}
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-tight text-slate-950 dark:text-white">
            {t('stats.ratioTitle')}
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('stats.ratioBody')}</p>
      </div>

      <div className="mt-6 h-5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80">
        {totalItems > 0 ? (
          <div className="flex h-full w-full">
            <div
              className="h-full bg-emerald-500 transition-[width] duration-500 dark:bg-emerald-400"
              style={{ width: `${consumedPercentage}%` }}
            />
            <div
              className="h-full bg-rose-500 transition-[width] duration-500 dark:bg-rose-400"
              style={{ width: `${wastedPercentage}%` }}
            />
          </div>
        ) : (
          <div className="h-full w-full bg-slate-300/60 dark:bg-slate-700/60" />
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[24px] bg-emerald-50/80 p-4 dark:bg-emerald-950/40">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              {t('stats.consumed')}
            </span>
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">
              {formatPercent(consumedPercentage)}
            </span>
          </div>
          <p className="mt-3 font-display text-3xl tracking-tight text-emerald-950 dark:text-emerald-50">
            {consumedCount}
          </p>
        </div>

        <div className="rounded-[24px] bg-rose-50/80 p-4 dark:bg-rose-950/40">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-rose-900 dark:text-rose-100">{t('stats.wasted')}</span>
            <span className="text-sm font-semibold text-rose-700 dark:text-rose-200">
              {formatPercent(wastedPercentage)}
            </span>
          </div>
          <p className="mt-3 font-display text-3xl tracking-tight text-rose-950 dark:text-rose-50">{wastedCount}</p>
        </div>
      </div>
    </section>
  );
}