import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

type WasteRatioBarProps = {
  consumedCount: number;
  wastedCount: number;
};

export function WasteRatioBar({ consumedCount, wastedCount }: WasteRatioBarProps) {
  const { t } = useTranslation();
  const totalItems = consumedCount + wastedCount;
  const consumedPct = totalItems === 0 ? 0 : (consumedCount / totalItems) * 100;
  const wastedPct = totalItems === 0 ? 0 : (wastedCount / totalItems) * 100;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-soft dark:bg-slate-800/80">
      <p className="text-xs font-medium text-slate-400 dark:text-slate-500">{t('stats.ratioLabel')}</p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        {totalItems > 0 ? (
          <div className="flex h-full">
            <motion.div
              className="h-full rounded-full bg-emerald-400 dark:bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${consumedPct}%` }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            />
            <motion.div
              className="h-full bg-red-400 dark:bg-red-500"
              initial={{ width: 0 }}
              animate={{ width: `${wastedPct}%` }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('stats.consumed')}</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
            {consumedCount}
          </p>
          <p className="text-xs text-emerald-500/70 dark:text-emerald-500/50">{Math.round(consumedPct)}%</p>
        </div>
        <div className="rounded-xl bg-red-50 p-3 dark:bg-red-950/30">
          <p className="text-xs text-red-500 dark:text-red-400">{t('stats.wasted')}</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-red-600 dark:text-red-300">{wastedCount}</p>
          <p className="text-xs text-red-400/70 dark:text-red-500/50">{Math.round(wastedPct)}%</p>
        </div>
      </div>
    </section>
  );
}