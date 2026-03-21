import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
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
  // Stable string key for pantryItems so the effect only re-runs if items actually change.
  const pantryKey = pantryItems.join(',');

  // Single effect: reset any stale result then immediately kick off a fresh generation.
  // Calling mutate() after reset() is safe — mutate starts a new async operation
  // regardless of the mutation's current state.
  useEffect(() => {
    if (!isOpen || pantryItems.length === 0) return;

    setError(null);
    generateRecipe.reset();
    generateRecipe.mutate(pantryItems, {
      onError: () => setError(t('ai.generateError')),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pantryKey, t]);

  const initialValue = useMemo(() => toFormValue(generateRecipe.data), [generateRecipe.data]);

  // Show the spinner whenever we're waiting for a result. This covers:
  // - The mutation is actively running (isPending)
  // - The first render after modal opens before the effect fires (status === 'idle')
  const isGenerating = generateRecipe.isPending || generateRecipe.status === 'idle';

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
      {/* Loading: generating or just opened before the effect fires */}
      {isGenerating && !initialValue ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <LoaderCircle className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" strokeWidth={2} />
          <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">{t('ai.generating')}</p>
          {pantryItems.length > 0 ? (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto line-clamp-2">{pantryItems.join(', ')}</p>
          ) : null}
        </div>
      ) : null}

      {initialValue ? (
        <RecipeEditor
          initialValue={initialValue}
          submitLabel={createRecipe.isPending ? t('recipes.saving') : t('common.save')}
          isSubmitting={createRecipe.isPending}
          error={error}
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      ) : null}

      {!isGenerating && !initialValue && error ? (
        <div className="space-y-4 py-4">
          <p className="text-sm text-red-500">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              generateRecipe.mutate(pantryItems, {
                onError: () => setError(t('ai.generateError')),
              });
            }}
            className="text-sm font-medium text-slate-600 underline underline-offset-2 dark:text-slate-300"
          >
            {t('dashboard.retry')}
          </button>
        </div>
      ) : null}
    </Modal>
  );
}
