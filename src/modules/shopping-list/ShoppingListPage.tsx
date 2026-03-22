import { useMemo, useState } from 'react';
import { ListChecks } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useRecipes } from '@/modules/pantry/recipes/data/use-recipes';
import type { ShoppingListItemRecord } from '@/modules/shopping-list/data/shopping-list-api';
import { AddShoppingItemModal } from '@/modules/shopping-list/ui/AddShoppingItemModal';
import { GenerateFromRecipeModal } from '@/modules/shopping-list/ui/GenerateFromRecipeModal';
import { ShoppingListItem } from '@/modules/shopping-list/ui/ShoppingListItem';
import {
  useClearCheckedShoppingListItems,
  useDeleteShoppingListItem,
  useShoppingList,
  useToggleShoppingListItem,
} from '@/modules/shopping-list/data/use-shopping-list';
import { Button } from '@/shared/ui/Button';

export function ShoppingListPage() {
  const { t } = useTranslation();
  const { data: items, isLoading, isError, refetch } = useShoppingList();
  const { data: recipes } = useRecipes();
  const toggleItem = useToggleShoppingListItem();
  const deleteItem = useDeleteShoppingListItem();
  const clearChecked = useClearCheckedShoppingListItems();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const checkedItems = useMemo(() => (items ?? []).filter((item) => item.checked), [items]);

  const recipeTitles = useMemo(
    () => new Map((recipes ?? []).map((recipeWithIngredients) => [recipeWithIngredients.recipe.id, recipeWithIngredients.recipe.title])),
    [recipes],
  );

  const groupedItems = useMemo(() => {
    const groups = new Map<string, ShoppingListItemRecord[]>();

    for (const item of items ?? []) {
      const groupKey = item.recipe_id || 'manual';
      const current = groups.get(groupKey) ?? [];
      current.push(item);
      groups.set(groupKey, current);
    }

    return Array.from(groups.entries());
  }, [items]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('shoppingList.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('shoppingList.headline')}
          </p>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-16" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <section className="rounded-2xl bg-red-50 p-6 dark:bg-red-950/30">
        <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{t('errors.generic')}</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('shoppingList.loadError')}</p>
        <Button variant="secondary" className="mt-4" onClick={() => void refetch()}>
          {t('dashboard.retry')}
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {/* Page header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('shoppingList.title')}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('shoppingList.headline')}
            </p>
          </div>
          {/* Desktop: action buttons in header row */}
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <Button
              variant="secondary"
              className="min-h-10 whitespace-nowrap px-4 text-xs"
              onClick={() => setIsGenerateOpen(true)}
            >
              {t('shoppingList.generateTitle')}
            </Button>
            <Button className="min-h-10 whitespace-nowrap px-4 text-xs" onClick={() => setIsAddOpen(true)}>
              {t('shoppingList.addTitle')}
            </Button>
          </div>
        </div>
        {/* Mobile: action buttons below title, full-width */}
        <div className="flex gap-2 sm:hidden">
          <Button
            variant="secondary"
            className="min-h-10 flex-1 whitespace-nowrap px-3 text-xs"
            onClick={() => setIsGenerateOpen(true)}
          >
            {t('shoppingList.generateTitle')}
          </Button>
          <Button className="min-h-10 flex-1 whitespace-nowrap px-3 text-xs" onClick={() => setIsAddOpen(true)}>
            {t('shoppingList.addTitle')}
          </Button>
        </div>
      </div>

      {(items ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <ListChecks className="h-7 w-7 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t('shoppingList.emptyState')}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {t('shoppingList.emptyHint')}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedItems.map(([groupKey, groupItems], groupIdx) => {
            const previousItemsCount = groupedItems.slice(0, groupIdx).reduce((acc, [, items]) => acc + items.length, 0);
            return (
            <div key={groupKey} className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                {groupKey === 'manual'
                  ? t('shoppingList.manualSection')
                  : recipeTitles.get(groupKey) ?? t('shoppingList.recipeSectionFallback')}
              </p>
              <div className="space-y-2">
                {groupItems.map((item, itemIdx) => {
                  const globalIndex = previousItemsCount + itemIdx;
                  return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20, delay: globalIndex * 0.06 }}
                  >
                    <ShoppingListItem
                      item={item}
                      onToggle={(currentItem) => toggleItem.mutate({ id: currentItem.id, checked: !currentItem.checked })}
                      onDelete={(currentItem) => deleteItem.mutate(currentItem)}
                    />
                  </motion.div>
                )})}
              </div>
            </div>
          )})}
        </div>
      )}

      {checkedItems.length > 0 ? (
        <div className="pointer-events-none fixed bottom-[calc(6.75rem+env(safe-area-inset-bottom))] right-4 z-50 md:bottom-6 md:right-8">
          <Button
            variant="secondary"
            className="pointer-events-auto min-h-11 rounded-full px-4 shadow-elevated"
            onClick={() => clearChecked.mutate()}
            disabled={clearChecked.isPending}
          >
            {clearChecked.isPending ? t('shoppingList.clearing') : t('shoppingList.clearChecked')}
          </Button>
        </div>
      ) : null}

      <AddShoppingItemModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <GenerateFromRecipeModal isOpen={isGenerateOpen} onClose={() => setIsGenerateOpen(false)} />
    </section>
  );
}
