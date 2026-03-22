import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAiRecipeGenerate } from '@/modules/ai/use-ai-recipe-generate';
import { useCreateRecipe } from '@/modules/pantry/recipes/data/use-recipes';
import { RecipeEditor, type RecipeFormValue } from '@/modules/pantry/recipes/ui/RecipeEditor';
import { Button } from '@/shared/ui/Button';
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
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPrompt('');
      setError(null);
      generateRecipe.reset();
    }
  // generateRecipe.reset() is intentionally only triggered on open-state changes.
  // Depending on the whole mutation object causes a render loop because the object identity changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const initialValue = useMemo(() => toFormValue(generateRecipe.data), [generateRecipe.data]);
  const isGenerating = generateRecipe.isPending;

  function handleGenerate() {
    setError(null);
    generateRecipe.mutate(
      {
        pantryItems,
        prompt: prompt.trim() || undefined,
      },
      {
        onError: () => setError(t('ai.generateError')),
      },
    );
  }

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
      {!initialValue && !isGenerating ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {t('ai.generatePromptLabel', 'Recipe direction')}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t('ai.generatePromptHint', 'Optional: tell AI the cuisine, style, or ingredient focus you want.')}
            </p>
          </div>

          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={t('ai.generatePromptPlaceholder', 'e.g. Italian pasta, high protein, quick dinner')}
            className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
          />

          {pantryItems.length > 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {pantryItems.join(', ')}
            </p>
          ) : null}

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1" onClick={handleGenerate} disabled={pantryItems.length === 0}>
              {t('ai.generateCta', 'Generate recipe')}
            </Button>
          </div>
        </div>
      ) : null}

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
            onClick={handleGenerate}
            className="text-sm font-medium text-slate-600 underline underline-offset-2 dark:text-slate-300"
          >
            {t('dashboard.retry')}
          </button>
        </div>
      ) : null}
    </Modal>
  );
}
