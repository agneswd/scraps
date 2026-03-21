import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RecipeMatchResult } from '@/modules/pantry/recipes/data/recipe-matching';
import { RecipeCard } from '@/modules/pantry/recipes/ui/RecipeCard';
import { Button } from '@/shared/ui/Button';

type RecipeListProps = {
  items: RecipeMatchResult[];
  onAdd: () => void;
  onItemTap: (item: RecipeMatchResult) => void;
};

export function RecipeList({ items, onAdd, onItemTap }: RecipeListProps) {
  const { t } = useTranslation();
  const [showCookableOnly, setShowCookableOnly] = useState(false);

  const filteredItems = showCookableOnly ? items.filter((item) => item.canMake) : items;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <ScrollText className="h-7 w-7 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {t('recipes.emptyState')}
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {t('recipes.emptyHint')}
        </p>
        <Button className="mt-4" onClick={onAdd}>
          {t('recipes.addTitle')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {t('recipes.savedRecipes')}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('recipes.savedRecipesCount', { count: items.length })}
          </p>
        </div>
        <Button onClick={onAdd}>{t('recipes.addTitle')}</Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setShowCookableOnly(false)}
          className={[
            'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.96]',
            !showCookableOnly
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
          ].join(' ')}
        >
          {t('recipes.showAll')}
        </button>
        <button
          type="button"
          onClick={() => setShowCookableOnly(true)}
          className={[
            'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.96]',
            showCookableOnly
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
          ].join(' ')}
        >
          {t('recipes.showCookableOnly')}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {filteredItems.map((item, index) => (
          <RecipeCard key={item.recipe.id} item={item} index={index} onTap={onItemTap} />
        ))}
      </div>
      {filteredItems.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
          {t('recipes.noCookableRecipes')}
        </p>
      ) : null}
    </div>
  );
}
