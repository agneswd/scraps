import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type StatsPeriod } from '@/modules/stats/stats-api';
import { PeriodSummary } from '@/modules/stats/PeriodSummary';
import { useStats } from '@/modules/stats/use-stats';
import { WasteRatioBar } from '@/modules/stats/WasteRatioBar';
import { Button } from '@/shared/ui/Button';
import { BarChart3 } from 'lucide-react';

const PERIOD_OPTIONS: StatsPeriod[] = ['7d', '30d', 'all'];

const periodTranslationKey: Record<StatsPeriod, string> = {
  '7d': 'stats.period7d',
  '30d': 'stats.period30d',
  all: 'stats.periodAll',
};

function StatsSkeleton() {
  return (
    <div className="space-y-3 pt-2">
      <div className="skeleton h-10 w-48" />
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-20" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
      <div className="skeleton h-16" />
    </div>
  );
}

export function StatsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<StatsPeriod>('30d');
  const { summary, isError, isLoading, refetch } = useStats(period);

  if (isLoading) return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {t('stats.title')}
      </h1>
      <StatsSkeleton />
    </div>
  );

  if (isError) {
    return (
      <section className="rounded-2xl bg-red-50 p-6 dark:bg-red-950/30">
        <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{t('errors.generic')}</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('stats.loadErrorBody')}</p>
        <Button variant="secondary" className="mt-4" onClick={() => void refetch()}>
          {t('stats.retry')}
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('stats.title')}
        </h1>
      </div>

      {/* Period toggle — pill selector */}
      <div className="relative flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {/* Sliding active background */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-1 rounded-lg bg-white shadow-soft transition-all duration-200 ease-spring dark:bg-slate-700"
          style={{
            width: `calc((100% - 0.5rem) / ${PERIOD_OPTIONS.length})`,
            left: `calc(0.25rem + ${PERIOD_OPTIONS.indexOf(period)} * (100% - 0.5rem) / ${PERIOD_OPTIONS.length})`,
          }}
        />
        {PERIOD_OPTIONS.map((option) => {
          const isActive = option === period;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setPeriod(option)}
              aria-pressed={isActive}
              className={[
                'relative flex-1 rounded-lg py-2 text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
              ].join(' ')}
            >
              {t(periodTranslationKey[option])}
            </button>
          );
        })}
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
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <BarChart3 className="h-6 w-6 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('stats.emptyBody')}</p>
        </div>
      ) : null}
    </section>
  );
}
