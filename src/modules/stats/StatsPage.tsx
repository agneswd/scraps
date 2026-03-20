import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type StatsPeriod } from '@/modules/stats/stats-api';
import { PeriodSummary } from '@/modules/stats/PeriodSummary';
import { useStats } from '@/modules/stats/use-stats';
import { WasteRatioBar } from '@/modules/stats/WasteRatioBar';
import { Button } from '@/shared/ui/Button';

const PERIOD_OPTIONS: StatsPeriod[] = ['7d', '30d', 'all'];

const periodTranslationKey: Record<StatsPeriod, string> = {
  '7d': 'stats.period7d',
  '30d': 'stats.period30d',
  all: 'stats.periodAll',
};

function StatsSkeleton() {
  return (
    <section className="space-y-4">
      <div className="h-32 animate-pulse rounded-[32px] bg-white/70 shadow-card dark:bg-slate-950/70" />
      <div className="h-24 animate-pulse rounded-[28px] bg-white/70 shadow-card dark:bg-slate-950/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-28 animate-pulse rounded-[28px] bg-white/70 shadow-card dark:bg-slate-950/70" />
        <div className="h-28 animate-pulse rounded-[28px] bg-white/70 shadow-card dark:bg-slate-950/70" />
        <div className="h-28 animate-pulse rounded-[28px] bg-white/70 shadow-card dark:bg-slate-950/70" />
        <div className="h-28 animate-pulse rounded-[28px] bg-white/70 shadow-card dark:bg-slate-950/70" />
      </div>
      <div className="h-64 animate-pulse rounded-[32px] bg-white/70 shadow-card dark:bg-slate-950/70" />
    </section>
  );
}

export function StatsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<StatsPeriod>('30d');
  const { summary, isError, isLoading, refetch } = useStats(period);

  if (isLoading) {
    return <StatsSkeleton />;
  }

  if (isError) {
    return (
      <section className="rounded-[32px] border border-red-200 bg-white/80 p-6 shadow-card dark:border-red-900/60 dark:bg-slate-950/80">
        <p className="font-display text-3xl tracking-tight text-slate-950 dark:text-white">{t('errors.generic')}</p>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{t('stats.loadErrorBody')}</p>
        <Button className="mt-5" onClick={() => void refetch()}>
          {t('stats.retry')}
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-card backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-600 dark:text-brand-200">
          {t('stats.title')}
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-slate-950 dark:text-white">
          {t('stats.headline')}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t('stats.body')}
        </p>
      </div>

      <div className="rounded-[28px] border border-white/50 bg-white/80 p-4 shadow-card backdrop-blur dark:border-white/10 dark:bg-slate-950/80 sm:flex sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('stats.periodLabel')}</p>
        <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
          {PERIOD_OPTIONS.map((option) => {
            const isActive = option === period;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                aria-pressed={isActive}
                className={[
                  'min-h-11 rounded-full px-4 text-sm font-semibold transition',
                  isActive
                    ? 'bg-brand-500 text-white shadow-card'
                    : 'bg-brand-50 text-slate-700 hover:bg-brand-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
                ].join(' ')}
              >
                {t(periodTranslationKey[option])}
              </button>
            );
          })}
        </div>
      </div>

      <PeriodSummary
        summary={summary}
        labels={{
          total: t('stats.total'),
          consumed: t('stats.consumed'),
          wasted: t('stats.wasted'),
          wasteRate: t('stats.wasteRate'),
        }}
      />

      <WasteRatioBar consumedCount={summary.consumedCount} wastedCount={summary.wastedCount} />

      {summary.totalItems === 0 ? (
        <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/70 p-6 shadow-card dark:border-slate-700 dark:bg-slate-950/70">
          <p className="font-display text-3xl tracking-tight text-slate-950 dark:text-white">{t('stats.emptyTitle')}</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{t('stats.emptyBody')}</p>
        </div>
      ) : null}
    </section>
  );
}
