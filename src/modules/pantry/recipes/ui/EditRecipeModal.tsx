import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/ui/Modal';
import type { RecipeWithIngredients } from '@/modules/pantry/recipes/data/recipe-api';
import { RecipeEditor, type RecipeFormValue } from '@/modules/pantry/recipes/ui/RecipeEditor';
import { useUpdateRecipe } from '@/modules/pantry/recipes/data/use-recipes';

type EditRecipeModalProps = {
  isOpen: boolean;
  recipeWithIngredients: RecipeWithIngredients | null;
  onClose: () => void;
};

export function EditRecipeModal({ isOpen, recipeWithIngredients, onClose }: EditRecipeModalProps) {
  const { t } = useTranslation();
  const updateRecipe = useUpdateRecipe();
  const [error, setError] = useState<string | null>(null);

  const initialValue = useMemo(() => {
    if (!recipeWithIngredients) {
      return undefined;
    }

    return {
      title: recipeWithIngredients.recipe.title,
      description: recipeWithIngredients.recipe.description ?? '',
      instructions: recipeWithIngredients.recipe.instructions,
      servings: recipeWithIngredients.recipe.servings ? String(recipeWithIngredients.recipe.servings) : '',
      prepTime: recipeWithIngredients.recipe.prep_time ? String(recipeWithIngredients.recipe.prep_time) : '',
      cookTime: recipeWithIngredients.recipe.cook_time ? String(recipeWithIngredients.recipe.cook_time) : '',
      sourceUrl: recipeWithIngredients.recipe.source_url ?? '',
      tags: recipeWithIngredients.recipe.tags ?? '',
      photo: null,
      ingredients: recipeWithIngredients.ingredients.map((ingredient) => ({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        optional: ingredient.optional,
      })),
    };
  }, [recipeWithIngredients]);

  async function handleSubmit(value: RecipeFormValue) {
    if (!recipeWithIngredients) {
      return;
    }

    try {
      setError(null);
      await updateRecipe.mutateAsync({
        recipeId: recipeWithIngredients.recipe.id,
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
    <Modal isOpen={isOpen} onClose={onClose} title={t('recipes.editTitle')}>
      {initialValue ? (
        <RecipeEditor
          initialValue={initialValue}
          submitLabel={updateRecipe.isPending ? t('recipes.saving') : t('common.save')}
          isSubmitting={updateRecipe.isPending}
          error={error}
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      ) : null}
    </Modal>
  );
}
