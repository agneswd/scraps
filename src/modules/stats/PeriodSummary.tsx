import { motion } from 'framer-motion';
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

export function PeriodSummary({ summary, labels }: PeriodSummaryProps) {
  const metrics = [
    { label: labels.total, value: summary.totalItems },
    { label: labels.consumed, value: summary.consumedCount },
    { label: labels.wasted, value: summary.wastedCount },
    { label: labels.wasteRate, value: `${Math.round(summary.wastePercentage)}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {metrics.map((metric, index) => (
        <motion.article
          key={metric.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
          className="rounded-2xl bg-white p-4 shadow-soft dark:bg-slate-800/80"
        >
          <p className="text-xs text-slate-400 dark:text-slate-500">{metric.label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{metric.value}</p>
        </motion.article>
      ))}
    </div>
  );
}