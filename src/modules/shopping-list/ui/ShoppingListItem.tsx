import { Check, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ShoppingListItemRecord } from '@/modules/shopping-list/data/shopping-list-api';

type ShoppingListItemProps = {
  item: ShoppingListItemRecord;
  onToggle: (item: ShoppingListItemRecord) => void;
  onDelete: (item: ShoppingListItemRecord) => void;
};

export function ShoppingListItem({ item, onToggle, onDelete }: ShoppingListItemProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100/80 bg-white p-3 shadow-soft dark:border-slate-700/40 dark:bg-slate-800/80">
      <button
        type="button"
        onClick={() => onToggle(item)}
        aria-label={t('shoppingList.toggleChecked')}
        className={[
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all',
          item.checked
            ? 'bg-emerald-500 text-white dark:bg-emerald-600'
            : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-500 dark:hover:bg-slate-600',
        ].join(' ')}
      >
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </button>

      <div className="min-w-0 flex-1">
        <p className={[
          'truncate text-sm font-medium',
          item.checked
            ? 'text-slate-400 line-through dark:text-slate-500'
            : 'text-slate-900 dark:text-white',
        ].join(' ')}>
          {item.name}
        </p>
        {(item.quantity || item.unit) ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {[item.quantity, item.unit].filter(Boolean).join(' ')}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onDelete(item)}
        aria-label={t('shoppingList.delete')}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}
