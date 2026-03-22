import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { Select } from '@/shared/ui/Select';
import { useRecipes } from '@/modules/pantry/recipes/data/use-recipes';
import { useCreateShoppingListItems } from '@/modules/shopping-list/data/use-shopping-list';

type GenerateFromRecipeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function GenerateFromRecipeModal({ isOpen, onClose }: GenerateFromRecipeModalProps) {
  const { t } = useTranslation();
  const { data: recipes } = useRecipes();
  const createItems = useCreateShoppingListItems();
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const recipeOptions = useMemo(
    () => (recipes ?? []).map((recipe) => ({ value: recipe.recipe.id, label: recipe.recipe.title })),
    [recipes],
  );

  useEffect(() => {
    if (!isOpen) {
      setSelectedRecipeId('');
      setError(null);
    }
  }, [isOpen]);

  const selectedRecipe = (recipes ?? []).find((recipe) => recipe.recipe.id === selectedRecipeId) ?? null;
  const selectedIngredients = selectedRecipe?.ingredients.filter((ingredient) => !ingredient.optional) ?? [];

  async function handleGenerate() {
    if (!selectedRecipe || selectedIngredients.length === 0) {
      return;
    }

    try {
      setError(null);
      await createItems.mutateAsync(
        selectedIngredients.map((ingredient) => ({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          recipe_id: selectedRecipe.recipe.id,
          checked: false,
        })),
      );
      onClose();
    } catch {
      setError(t('shoppingList.generateError'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('shoppingList.generateTitle')}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('shoppingList.selectRecipeLabel')}
          </label>
          <Select
            value={selectedRecipeId}
            options={recipeOptions}
            onChange={setSelectedRecipeId}
            placeholder={t('shoppingList.selectRecipePlaceholder')}
          />
        </div>

        {selectedRecipe ? (
          <div className="space-y-2 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {selectedRecipe.recipe.title}
            </p>
            {selectedIngredients.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('shoppingList.noRecipeIngredients', 'This recipe has no required ingredients to add.')}
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {selectedIngredients.map((ingredient, index) => (
                  <li key={`${ingredient.name}-${index}`} className="rounded-xl bg-white px-3 py-2 dark:bg-slate-900">
                    {[ingredient.quantity, ingredient.unit, ingredient.name].filter(Boolean).join(' ')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            className="flex-1"
            disabled={createItems.isPending || !selectedRecipe || selectedIngredients.length === 0}
            onClick={() => void handleGenerate()}
          >
            {createItems.isPending ? t('shoppingList.saving') : t('shoppingList.generateAllCta', 'Add recipe ingredients')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
