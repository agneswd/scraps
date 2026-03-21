import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { useHistory } from '@/modules/settings/use-history';
import { CATEGORY_ICONS } from '@/modules/dashboard/expiry-utils';

export function HistoryLog() {
  const { t } = useTranslation();
  const { history, isLoading, restore, restoringId } = useHistory();

  if (isLoading) {
    return (
      <div className="space-y-2 pt-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
        {t('settings.historyEmpty')}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {history.map((item) => {
        const CategoryIcon = CATEGORY_ICONS[item.category];
        const isRestoring = restoringId === item.id;
        const isConsumed = item.status === 'consumed';

        return (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
              <CategoryIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                {item.item_name}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                <span
                  className={[
                    'font-medium',
                    isConsumed
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400',
                  ].join(' ')}
                >
                  {isConsumed ? t('dashboard.markConsumed') : t('dashboard.markWasted')}
                </span>
                {' · '}
                {new Date(item.updated).toLocaleDateString()}
              </p>
            </div>

            <button
              type="button"
              disabled={isRestoring}
              onClick={() => restore(item.id)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 disabled:opacity-40 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              aria-label={t('leftover.restore')}
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
