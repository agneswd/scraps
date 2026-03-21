import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { Select } from '@/shared/ui/Select';
import { matchRecipesToPantry } from '@/modules/pantry/recipes/data/recipe-matching';
import { useRecipes } from '@/modules/pantry/recipes/data/use-recipes';
import { usePantryItems } from '@/modules/pantry/use-pantry';
import { useCreateShoppingListItems } from '@/modules/shopping-list/data/use-shopping-list';

type GenerateFromRecipeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function GenerateFromRecipeModal({ isOpen, onClose }: GenerateFromRecipeModalProps) {
  const { t } = useTranslation();
  const { data: recipes } = useRecipes();
  const { data: pantryItems } = usePantryItems();
  const createItems = useCreateShoppingListItems();
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const matches = useMemo(
    () => matchRecipesToPantry(recipes ?? [], pantryItems ?? []),
    [pantryItems, recipes],
  );

  useEffect(() => {
    if (!isOpen) {
      setSelectedRecipeId('');
      setError(null);
    }
  }, [isOpen]);

  const selectedMatch = matches.find((match) => match.recipe.id === selectedRecipeId) ?? null;

  async function handleGenerate() {
    if (!selectedMatch || selectedMatch.missing.length === 0) {
      return;
    }

    try {
      setError(null);
      await createItems.mutateAsync(
        selectedMatch.missing.map((name) => ({
          name,
          recipe_id: selectedMatch.recipe.id,
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
            options={matches.map((match) => ({ value: match.recipe.id, label: match.recipe.title }))}
            onChange={setSelectedRecipeId}
            placeholder={t('shoppingList.selectRecipePlaceholder')}
          />
        </div>

        {selectedMatch ? (
          <div className="space-y-2 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {selectedMatch.recipe.title}
            </p>
            {selectedMatch.missing.length === 0 ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {t('shoppingList.nothingMissing')}
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {selectedMatch.missing.map((missingName) => (
                  <li key={missingName} className="rounded-xl bg-white px-3 py-2 dark:bg-slate-900">
                    {missingName}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            disabled={createItems.isPending || !selectedMatch || selectedMatch.missing.length === 0}
            onClick={() => void handleGenerate()}
          >
            {createItems.isPending ? t('shoppingList.saving') : t('shoppingList.generateCta')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
