import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AiRecipeGenerateModal } from '@/modules/ai/AiRecipeGenerateModal';
import { PantryItemList } from '@/modules/pantry/items/PantryItemList';
import { EditPantryItemModal } from '@/modules/pantry/items/EditPantryItemModal';
import { useDeleteRecipe, useRecipes } from '@/modules/pantry/recipes/data/use-recipes';
import type { RecipeWithIngredients } from '@/modules/pantry/recipes/data/recipe-api';
import { AddRecipeModal } from '@/modules/pantry/recipes/ui/AddRecipeModal';
import { EditRecipeModal } from '@/modules/pantry/recipes/ui/EditRecipeModal';
import { RecipeDetailModal } from '@/modules/pantry/recipes/ui/RecipeDetailModal';
import { RecipeList } from '@/modules/pantry/recipes/ui/RecipeList';
import { usePantryItems, useIncrementQuantity, useUpdatePantryItem } from '@/modules/pantry/use-pantry';
import { Button } from '@/shared/ui/Button';
import type { PantryItemRecord } from '@/modules/pantry/pantry-api';

type PantryTab = 'items' | 'recipes';

const TABS: Array<{ key: PantryTab; label: string }> = [
  { key: 'items', label: 'pantry.tabItems' },
  { key: 'recipes', label: 'pantry.tabRecipes' },
];

function PantrySkeleton() {
  return (
    <div className="space-y-3 pt-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="skeleton h-[4.5rem]"
          style={{ animationDelay: `${i * 150}ms` }}
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

  function handleIncrement(item: PantryItemRecord) {
    incrementMutation.mutate({ id: item.id, currentQuantity: item.quantity, currentStatus: item.status });
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

  const activeTabIndex = TABS.findIndex((tab) => tab.key === activeTab);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('pantry.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('pantry.headline')}
          </p>
        </div>
        <PantrySkeleton />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <section className="rounded-2xl bg-red-50 p-6 dark:bg-red-950/30">
        <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          {t('errors.generic')}
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t('pantry.loadError')}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => void refetch()}>
          {t('dashboard.retry')}
        </Button>
      </section>
    );
  }

  // ── Content ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('pantry.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('pantry.headline')}
        </p>
      </div>

      {/* Tab switcher — CSS sliding pill (no layoutId motion conflict) */}
      <div className="relative flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {/* Sliding active background */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-1 rounded-lg bg-white shadow-soft transition-all duration-200 ease-spring dark:bg-slate-700"
          style={{
            width: `calc((100% - 0.5rem) / ${TABS.length})`,
            left: `calc(0.25rem + ${activeTabIndex} * (100% - 0.5rem) / ${TABS.length})`,
          }}
        />
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={isActive}
              className={[
                'relative flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
              ].join(' ')}
            >
              {t(tab.label)}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'items' && (
          <>
            <PantryItemList
              items={items ?? []}
              onItemTap={setEditItem}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />
          </>
        )}

        {activeTab === 'recipes' && (
          <>
            {recipesLoading ? <PantrySkeleton /> : (
              <RecipeList
                items={recipes ?? []}
                onAdd={() => setIsAddRecipeOpen(true)}
                onAiGenerate={() => setIsAiRecipeOpen(true)}
                onItemTap={setSelectedRecipe}
              />
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
          if (!selectedRecipe) return;
          deleteRecipe.mutate(selectedRecipe, {
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
