import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AiRecipeGenerateModal } from '@/modules/ai/AiRecipeGenerateModal';
import { PantryItemList } from '@/modules/pantry/items/PantryItemList';
import { EditPantryItemModal } from '@/modules/pantry/items/EditPantryItemModal';
import {
  findUnusedPantryItems,
  matchRecipesToPantry,
} from '@/modules/pantry/recipes/data/recipe-matching';
import { useDeleteRecipe, useRecipes } from '@/modules/pantry/recipes/data/use-recipes';
import type { RecipeWithIngredients } from '@/modules/pantry/recipes/data/recipe-api';
import { AddRecipeModal } from '@/modules/pantry/recipes/ui/AddRecipeModal';
import { EditRecipeModal } from '@/modules/pantry/recipes/ui/EditRecipeModal';
import { RecipeDetailModal } from '@/modules/pantry/recipes/ui/RecipeDetailModal';
import { RecipeList } from '@/modules/pantry/recipes/ui/RecipeList';
import { UnusedIngredients } from '@/modules/pantry/recipes/ui/UnusedIngredients';
import { usePantryItems, useIncrementQuantity, useUpdatePantryItem } from '@/modules/pantry/use-pantry';
import { Button } from '@/shared/ui/Button';
import type { PantryItemRecord } from '@/modules/pantry/pantry-api';

type PantryTab = 'items' | 'recipes';

function PantrySkeleton() {
  return (
    <div className="space-y-3 pt-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[4.5rem] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

export function PantryPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<PantryTab>('items');
  const [editItem, setEditItem] = useState<PantryItemRecord | null>(null);
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false);
  const [isAiRecipeOpen, setIsAiRecipeOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithIngredients | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<RecipeWithIngredients | null>(null);

  const { data: items, isLoading, isError, refetch } = usePantryItems();
  const { data: recipes, isLoading: recipesLoading } = useRecipes();
  const deleteRecipe = useDeleteRecipe();
  const incrementMutation = useIncrementQuantity();
  const updateMutation = useUpdatePantryItem();
  const recipeMatches = matchRecipesToPantry(recipes ?? [], items ?? []);
  const unusedIngredients = findUnusedPantryItems(items ?? [], recipes ?? []);

  function handleIncrement(item: PantryItemRecord) {
    incrementMutation.mutate({ id: item.id, currentQuantity: item.quantity });
  }

  function handleDecrement(item: PantryItemRecord) {
    if (item.quantity <= 0) return;
    const newQuantity = item.quantity - 1;
    updateMutation.mutate({
      id: item.id,
      quantity: newQuantity,
      status: newQuantity === 0 ? 'finished' : item.status,
    });
  }

  const tabs: Array<{ key: PantryTab; label: string }> = [
    { key: 'items', label: t('pantry.tabItems') },
    { key: 'recipes', label: t('pantry.tabRecipes') },
  ];

  return (
    <div>
      {/* Header */}
      <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        {t('pantry.title')}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t('pantry.headline')}
      </p>

      {/* Tab switcher */}
      <div className="relative mt-5 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className="relative z-10 flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors"
          >
            <span className={activeTab === tab.key ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}>
              {tab.label}
            </span>
            {activeTab === tab.key && (
              <motion.div
                layoutId="pantry-tab-indicator"
                className="absolute inset-0 rounded-lg bg-white shadow-soft dark:bg-slate-700"
                style={{ zIndex: -1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-5">
        {activeTab === 'items' && (
          <>
            {isLoading && <PantrySkeleton />}

            {isError && (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('pantry.loadError')}
                </p>
                <Button variant="secondary" onClick={() => refetch()} className="mt-3">
                  {t('dashboard.retry')}
                </Button>
              </div>
            )}

            {!isLoading && !isError && items && (
              <>
                <PantryItemList
                  items={items}
                  onItemTap={setEditItem}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                />
                <UnusedIngredients items={unusedIngredients} />
              </>
            )}
          </>
        )}

        {activeTab === 'recipes' && (
          <>
            {recipesLoading ? <PantrySkeleton /> : null}
            {!recipesLoading && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="secondary" onClick={() => setIsAiRecipeOpen(true)}>
                    {t('ai.generateTitle')}
                  </Button>
                </div>
                <RecipeList
                  items={recipeMatches}
                  onAdd={() => setIsAddRecipeOpen(true)}
                  onItemTap={setSelectedRecipe}
                />
              </div>
            )}
          </>
        )}
      </div>

      <EditPantryItemModal
        isOpen={editItem !== null}
        item={editItem}
        onClose={() => setEditItem(null)}
      />

      <AddRecipeModal isOpen={isAddRecipeOpen} onClose={() => setIsAddRecipeOpen(false)} />

      <AiRecipeGenerateModal
        isOpen={isAiRecipeOpen}
        pantryItems={(items ?? [])
          .filter((item) => item.status !== 'finished' && item.quantity > 0)
          .map((item) => item.name)}
        onClose={() => setIsAiRecipeOpen(false)}
      />

      <RecipeDetailModal
        recipeWithIngredients={selectedRecipe}
        isDeleting={deleteRecipe.isPending}
        onClose={() => setSelectedRecipe(null)}
        onEdit={() => {
          setEditingRecipe(selectedRecipe);
          setSelectedRecipe(null);
        }}
        onDelete={() => {
          if (!selectedRecipe) {
            return;
          }
          deleteRecipe.mutate(selectedRecipe.recipe.id, {
            onSuccess: () => setSelectedRecipe(null),
          });
        }}
      />

      <EditRecipeModal
        isOpen={editingRecipe !== null}
        recipeWithIngredients={editingRecipe}
        onClose={() => setEditingRecipe(null)}
      />
    </div>
  );
}
