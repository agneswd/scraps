import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAiRecipeGenerate } from '@/modules/ai/use-ai-recipe-generate';
import { useCreateRecipe } from '@/modules/pantry/recipes/data/use-recipes';
import { RecipeEditor, type RecipeFormValue } from '@/modules/pantry/recipes/ui/RecipeEditor';
import { Modal } from '@/shared/ui/Modal';

type AiRecipeGenerateModalProps = {
  isOpen: boolean;
  pantryItems: string[];
  onClose: () => void;
};

function toFormValue(input?: {
  title: string;
  description?: string;
  instructions: string;
  servings?: number;
  prep_time?: number;
  cook_time?: number;
  source_url?: string;
  tags?: string;
  ingredients: Array<{ name: string; quantity?: number; unit?: string; optional?: boolean }>;
}) {
  if (!input) {
    return undefined;
  }

  return {
    title: input.title,
    description: input.description ?? '',
    instructions: input.instructions,
    servings: input.servings ? String(input.servings) : '',
    prepTime: input.prep_time ? String(input.prep_time) : '',
    cookTime: input.cook_time ? String(input.cook_time) : '',
    sourceUrl: input.source_url ?? '',
    tags: input.tags ?? '',
    photo: null,
    ingredients: input.ingredients,
  } satisfies RecipeFormValue;
}

export function AiRecipeGenerateModal({ isOpen, pantryItems, onClose }: AiRecipeGenerateModalProps) {
  const { t } = useTranslation();
  const generateRecipe = useAiRecipeGenerate();
  const createRecipe = useCreateRecipe();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || pantryItems.length === 0 || generateRecipe.data || generateRecipe.isPending) {
      return;
    }

    setError(null);
    generateRecipe.mutate(pantryItems, {
      onError: () => setError(t('ai.generateError')),
    });
  }, [generateRecipe, isOpen, pantryItems, t]);

  const initialValue = useMemo(() => toFormValue(generateRecipe.data), [generateRecipe.data]);

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
    <Modal isOpen={isOpen} onClose={onClose} title={t('ai.generateTitle')}>
      {generateRecipe.isPending && !initialValue ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-white">{t('ai.generating')}</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{pantryItems.join(', ')}</p>
        </div>
      ) : null}

      {!generateRecipe.isPending && initialValue ? (
        <RecipeEditor
          initialValue={initialValue}
          submitLabel={createRecipe.isPending ? t('recipes.saving') : t('common.save')}
          isSubmitting={createRecipe.isPending}
          error={error}
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      ) : null}

      {!generateRecipe.isPending && !initialValue && error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : null}
    </Modal>
  );
}
