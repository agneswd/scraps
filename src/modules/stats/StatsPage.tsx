import { useTranslation } from 'react-i18next';

export function StatsPage() {
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-card backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-600 dark:text-brand-200">
          {t('stats.title')}
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-slate-950 dark:text-white">
          {t('stats.scaffold.headline')}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t('stats.scaffold.body')}
        </p>
      </div>
    </section>
  );
}
