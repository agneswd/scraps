import { Clock3, Pencil, Trash2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { pocketbase } from '@/shared/api/pocketbase';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import type { RecipeWithIngredients } from '@/modules/pantry/recipes/data/recipe-api';

type RecipeDetailModalProps = {
  recipeWithIngredients: RecipeWithIngredients | null;
  isDeleting: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function RecipeDetailModal({
  recipeWithIngredients,
  isDeleting,
  onClose,
  onEdit,
  onDelete,
}: RecipeDetailModalProps) {
  const { t } = useTranslation();

  if (!recipeWithIngredients) {
    return null;
  }

  const totalMinutes = (recipeWithIngredients.recipe.prep_time ?? 0) + (recipeWithIngredients.recipe.cook_time ?? 0);
  const photoUrl = recipeWithIngredients.recipe.photo
    ? pocketbase.files.getURL(recipeWithIngredients.recipe, recipeWithIngredients.recipe.photo)
    : null;

  return (
    <Modal isOpen={recipeWithIngredients !== null} onClose={onClose} title={recipeWithIngredients.recipe.title}>
      <div className="space-y-5">
        {photoUrl ? <img src={photoUrl} alt="" className="h-48 w-full rounded-2xl object-cover" /> : null}

        <div className="flex flex-wrap gap-2 text-xs text-slate-400 dark:text-slate-500">
          {recipeWithIngredients.recipe.servings ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
              <Users className="h-3.5 w-3.5" strokeWidth={2} />
              {t('recipes.servingsValue', { count: recipeWithIngredients.recipe.servings })}
            </span>
          ) : null}
          {totalMinutes > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
              <Clock3 className="h-3.5 w-3.5" strokeWidth={2} />
              {t('recipes.minutesValue', { count: totalMinutes })}
            </span>
          ) : null}
        </div>

        {recipeWithIngredients.recipe.description ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{recipeWithIngredients.recipe.description}</p>
        ) : null}

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            {t('recipes.ingredientsLabel')}
          </p>
          <ul className="space-y-2">
            {recipeWithIngredients.ingredients.map((ingredient) => (
              <li key={ingredient.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800/70">
                <span className="font-medium text-slate-900 dark:text-white">{ingredient.name}</span>
                <span className="text-slate-400 dark:text-slate-500">
                  {[ingredient.quantity, ingredient.unit].filter(Boolean).join(' ') || t('recipes.asNeeded')}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            {t('recipes.instructionsLabel')}
          </p>
          <p className="whitespace-pre-line rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
            {recipeWithIngredients.recipe.instructions}
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onEdit}>
            <Pencil className="h-4 w-4" strokeWidth={2} />
            {t('recipes.editTitle')}
          </Button>
          <Button
            variant="secondary"
            className="flex-1 !bg-red-50 !text-red-600 dark:!bg-red-950/40 dark:!text-red-400"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
            {isDeleting ? t('recipes.deleting') : t('recipes.delete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
