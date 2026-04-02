import { ScrollText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RecipeWithIngredients } from '@/modules/pantry/recipes/data/recipe-api';
import { RecipeCard } from '@/modules/pantry/recipes/ui/RecipeCard';
import { Button } from '@/shared/ui/Button';

type RecipeListProps = {
  items: RecipeWithIngredients[];
  onAdd: () => void;
  onAiGenerate?: () => void;
  onItemTap: (item: RecipeWithIngredients) => void;
};

export function RecipeList({ items, onAdd, onAiGenerate, onItemTap }: RecipeListProps) {
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
        <div className="mt-4 flex flex-col items-center gap-2 w-full">
          <Button className="w-full max-w-xs min-h-10 whitespace-nowrap px-4 text-xs" onClick={onAdd}>
            {t('recipes.addTitle')}
          </Button>
          {onAiGenerate ? (
            <Button variant="secondary" className="w-full max-w-xs min-h-10 whitespace-nowrap px-4 text-xs" onClick={onAiGenerate}>
              {t('ai.generateTitle')}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:space-y-0">
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {t('recipes.savedRecipes')}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('recipes.savedRecipesCount', { count: items.length })}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
          {onAiGenerate ? (
            <Button variant="secondary" className="min-h-10 w-full whitespace-nowrap px-3 text-xs sm:w-auto sm:px-4" onClick={onAiGenerate}>
              {t('ai.generateTitle')}
            </Button>
          ) : null}
          <Button className="min-h-10 w-full whitespace-nowrap px-3 text-xs sm:w-auto sm:px-4" onClick={onAdd}>{t('recipes.addTitle')}</Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <RecipeCard key={item.recipe.id} item={item} index={index} onTap={onItemTap} />
        ))}
      </div>
    </div>
  );
}
