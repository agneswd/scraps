import type { StatsSummary } from '@/modules/stats/stats-api';

type PeriodSummaryProps = {
  summary: StatsSummary;
  labels: {
    total: string;
    consumed: string;
    wasted: string;
    wasteRate: string;
  };
};

function formatValue(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function PeriodSummary({ summary, labels }: PeriodSummaryProps) {
  const metrics = [
    { label: labels.total, value: formatValue(summary.totalItems) },
    { label: labels.consumed, value: formatValue(summary.consumedCount) },
    { label: labels.wasted, value: formatValue(summary.wastedCount) },
    { label: labels.wasteRate, value: formatPercent(summary.wastePercentage) },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="rounded-[28px] border border-white/50 bg-white/80 p-5 shadow-card backdrop-blur dark:border-white/10 dark:bg-slate-950/80"
        >
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{metric.label}</p>
          <p className="mt-4 font-display text-4xl tracking-tight text-slate-950 dark:text-white">{metric.value}</p>
        </article>
      ))}
    </section>
  );
}