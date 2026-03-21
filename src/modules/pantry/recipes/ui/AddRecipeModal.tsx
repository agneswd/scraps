import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/ui/Modal';
import { RecipeEditor, type RecipeFormValue } from '@/modules/pantry/recipes/ui/RecipeEditor';
import { useCreateRecipe } from '@/modules/pantry/recipes/data/use-recipes';

type AddRecipeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AddRecipeModal({ isOpen, onClose }: AddRecipeModalProps) {
  const { t } = useTranslation();
  const createRecipe = useCreateRecipe();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(value: RecipeFormValue) {
    try {
      setError(null);
      await createRecipe.mutateAsync({
        title: value.title.trim(),
        description: value.description.trim() || undefined,
        instructions: value.instructions.trim(),
        servings: value.servings ? Number(value.servings) : undefined,
        prep_time: value.prepTime ? Number(value.prepTime) : undefined,
        cook_time: value.cookTime ? Number(value.cookTime) : undefined,
        source_url: value.sourceUrl.trim() || undefined,
        tags: value.tags.trim() || undefined,
        photo: value.photo,
        ingredients: value.ingredients,
      });
      onClose();
    } catch {
      setError(t('recipes.saveError'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('recipes.addTitle')}>
      <RecipeEditor
        submitLabel={createRecipe.isPending ? t('recipes.saving') : t('common.save')}
        isSubmitting={createRecipe.isPending}
        error={error}
        onCancel={onClose}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
}
