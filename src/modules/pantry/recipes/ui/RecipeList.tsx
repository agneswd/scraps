import { ScrollText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RecipeWithIngredients } from '@/modules/pantry/recipes/data/recipe-api';
import { RecipeCard } from '@/modules/pantry/recipes/ui/RecipeCard';
import { Button } from '@/shared/ui/Button';

type RecipeListProps = {
  items: RecipeWithIngredients[];
  onAdd: () => void;
  onItemTap: (item: RecipeWithIngredients) => void;
};

export function RecipeList({ items, onAdd, onItemTap }: RecipeListProps) {
  const { t } = useTranslation();

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
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <RecipeCard key={item.recipe.id} item={item} index={index} onTap={onItemTap} />
        ))}
      </div>
    </div>
  );
}
