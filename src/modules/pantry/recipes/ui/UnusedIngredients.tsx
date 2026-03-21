import { PackageSearch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PantryItemRecord } from '@/modules/pantry/pantry-api';

type UnusedIngredientsProps = {
  items: PantryItemRecord[];
};

export function UnusedIngredients({ items }: UnusedIngredientsProps) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          {t('recipes.unusedTitle')}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {t('recipes.unusedBody')}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-100/80 bg-white p-4 shadow-soft dark:border-slate-700/40 dark:bg-slate-800/80">
        <div className="mb-3 flex items-center gap-2 text-slate-400 dark:text-slate-500">
          <PackageSearch className="h-4 w-4" strokeWidth={2} />
          <span className="text-xs font-medium uppercase tracking-[0.18em]">
            {t('recipes.unusedIngredients')}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item.id}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
            >
              {item.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
