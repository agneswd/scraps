import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChefHat, ListChecks, PackageOpen, RotateCcw, Trash2 } from 'lucide-react';
import { useHistory, useClearHistory } from '@/modules/settings/use-history';
import { CATEGORY_ICONS } from '@/modules/dashboard/expiry-utils';

function getHistoryMeta(item: ReturnType<typeof useHistory>['history'][number], t: ReturnType<typeof useTranslation>['t']) {
  if (item.kind === 'archived-leftover') {
    return {
      actionLabel: item.action === 'consumed'
        ? t('dashboard.markConsumed')
        : t('dashboard.markWasted'),
      actionClass: item.action === 'consumed'
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-500 dark:text-red-400',
      Icon: CATEGORY_ICONS[item.category],
    };
  }

  if (item.entityType === 'pantry_item' && item.category && item.category in CATEGORY_ICONS) {
    return {
      actionLabel: t('settings.historyDeletedPantryItem', 'Deleted pantry item'),
      actionClass: 'text-red-500 dark:text-red-400',
      Icon: CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS],
    };
  }

  if (item.entityType === 'recipe') {
    return {
      actionLabel: t('settings.historyDeletedRecipe', 'Deleted recipe'),
      actionClass: 'text-red-500 dark:text-red-400',
      Icon: ChefHat,
    };
  }

  if (item.entityType === 'shopping_item') {
    return {
      actionLabel: t('settings.historyDeletedShoppingItem', 'Deleted shopping item'),
      actionClass: 'text-red-500 dark:text-red-400',
      Icon: ListChecks,
    };
  }

  return {
    actionLabel: t('settings.historyDeletedLeftover', 'Deleted leftover'),
    actionClass: 'text-red-500 dark:text-red-400',
    Icon: PackageOpen,
  };
}

export function HistoryLog() {
  const { t } = useTranslation();
  const { history, isLoading, restore, restoringId } = useHistory();
  const clearHistory = useClearHistory();
  const [confirmingClear, setConfirmingClear] = useState(false);

  function handleClearRequest() {
    setConfirmingClear(true);
  }

  function handleClearConfirm() {
    clearHistory.mutate(undefined, {
      onSuccess: () => setConfirmingClear(false),
      onError: () => setConfirmingClear(false),
    });
  }

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
        {t('settings.historyEmptyDetailed', 'No recent history yet.')}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {confirmingClear ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800/40 dark:bg-red-950/30">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            {t('settings.clearHistoryConfirmTitle')}
          </p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-500">
            {t('settings.clearHistoryConfirmBody')}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={clearHistory.isPending}
              onClick={handleClearConfirm}
              className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600"
            >
              {clearHistory.isPending ? t('common.saving', 'Clearing…') : t('settings.clearHistory')}
            </button>
            <button
              type="button"
              disabled={clearHistory.isPending}
              onClick={() => setConfirmingClear(false)}
              className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleClearRequest}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            {t('settings.clearHistory')}
          </button>
        </div>
      )}

      <ul className="space-y-2">
      {history.map((item) => {
        const { Icon, actionClass, actionLabel } = getHistoryMeta(item, t);
        const isRestoring = restoringId === item.id;

        return (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
              <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                {item.title}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                <span className={['font-medium', actionClass].join(' ')}>{actionLabel}</span>
                {' · '}
                {new Date(item.updated).toLocaleDateString()}
              </p>
            </div>

            <button
              type="button"
              disabled={isRestoring}
              onClick={() => restore(item)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 disabled:opacity-40 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              aria-label={t('leftover.restore', 'Restore')}
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
            </button>
          </li>
        );
      })}
    </ul>
    </div>
  );
}
