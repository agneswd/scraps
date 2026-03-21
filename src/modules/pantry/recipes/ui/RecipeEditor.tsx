import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CameraCapture } from '@/modules/add-item/CameraCapture';
import type { RecipeIngredientInput } from '@/modules/pantry/recipes/data/recipe-api';
import { Button } from '@/shared/ui/Button';

export type RecipeFormValue = {
  title: string;
  description: string;
  instructions: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  sourceUrl: string;
  tags: string;
  ingredients: RecipeIngredientInput[];
  photo: Blob | null;
};

type RecipeEditorProps = {
  initialValue?: RecipeFormValue;
  submitLabel: string;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (value: RecipeFormValue) => Promise<void>;
};

const defaultIngredient = (): RecipeIngredientInput => ({
  name: '',
  quantity: undefined,
  unit: '',
  optional: false,
});

const defaultValue: RecipeFormValue = {
  title: '',
  description: '',
  instructions: '',
  servings: '',
  prepTime: '',
  cookTime: '',
  sourceUrl: '',
  tags: '',
  ingredients: [defaultIngredient()],
  photo: null,
};

export function RecipeEditor({
  initialValue = defaultValue,
  submitLabel,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: RecipeEditorProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState<RecipeFormValue>(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const previewUrl = useMemo(
    () => (value.photo ? URL.createObjectURL(value.photo) : null),
    [value.photo],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function updateIngredient(index: number, next: Partial<RecipeIngredientInput>) {
    setValue((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, ...next } : ingredient,
      ),
    }));
  }

  function addIngredient() {
    setValue((current) => ({
      ...current,
      ingredients: [...current.ingredients, defaultIngredient()],
    }));
  }

  function removeIngredient(index: number) {
    setValue((current) => ({
      ...current,
      ingredients: current.ingredients.length === 1
        ? [defaultIngredient()]
        : current.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index),
    }));
  }

  const canSubmit = value.title.trim().length > 0
    && value.instructions.trim().length > 0
    && value.ingredients.some((ingredient) => ingredient.name?.trim().length > 0);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('recipes.titleLabel')}
          </label>
          <input
            type="text"
            value={value.title}
            onChange={(event) => setValue((current) => ({ ...current, title: event.target.value }))}
            placeholder={t('recipes.titlePlaceholder')}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[0.9375rem] text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('recipes.descriptionLabel')}
          </label>
          <textarea
            value={value.description}
            onChange={(event) => setValue((current) => ({ ...current, description: event.target.value }))}
            placeholder={t('recipes.descriptionPlaceholder')}
            className="min-h-20 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[0.9375rem] text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('recipes.servingsLabel')}
            </label>
            <input
              type="number"
              min={1}
              value={value.servings}
              onChange={(event) => setValue((current) => ({ ...current, servings: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('recipes.prepTimeLabel')}
            </label>
            <input
              type="number"
              min={0}
              value={value.prepTime}
              onChange={(event) => setValue((current) => ({ ...current, prepTime: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('recipes.cookTimeLabel')}
            </label>
            <input
              type="number"
              min={0}
              value={value.cookTime}
              onChange={(event) => setValue((current) => ({ ...current, cookTime: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('recipes.ingredientsLabel')}
          </label>
          <button
            type="button"
            onClick={addIngredient}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            {t('recipes.addIngredient')}
          </button>
        </div>
        <div className="space-y-3">
          {value.ingredients.map((ingredient, index) => (
            <div key={`${index}-${ingredient.name}`} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
              <div className="grid grid-cols-[1fr,6rem,6rem,auto] gap-2">
                <input
                  type="text"
                  value={ingredient.name}
                  onChange={(event) => updateIngredient(index, { name: event.target.value })}
                  placeholder={t('recipes.ingredientNamePlaceholder')}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                />
                <input
                  type="number"
                  min={0}
                  value={ingredient.quantity ?? ''}
                  onChange={(event) => updateIngredient(index, {
                    quantity: event.target.value ? Number(event.target.value) : undefined,
                  })}
                  placeholder={t('recipes.qtyPlaceholder')}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                />
                <input
                  type="text"
                  value={ingredient.unit ?? ''}
                  onChange={(event) => updateIngredient(index, { unit: event.target.value })}
                  placeholder={t('recipes.unitPlaceholder')}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                  aria-label={t('recipes.removeIngredient')}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={Boolean(ingredient.optional)}
                  onChange={(event) => updateIngredient(index, { optional: event.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-600"
                />
                {t('recipes.optionalIngredient')}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('recipes.instructionsLabel')}
        </label>
        <textarea
          value={value.instructions}
          onChange={(event) => setValue((current) => ({ ...current, instructions: event.target.value }))}
          placeholder={t('recipes.instructionsPlaceholder')}
          className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[0.9375rem] text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('recipes.sourceUrlLabel')}
          </label>
          <input
            type="url"
            value={value.sourceUrl}
            onChange={(event) => setValue((current) => ({ ...current, sourceUrl: event.target.value }))}
            placeholder="https://"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('recipes.tagsLabel')}
          </label>
          <input
            type="text"
            value={value.tags}
            onChange={(event) => setValue((current) => ({ ...current, tags: event.target.value }))}
            placeholder={t('recipes.tagsPlaceholder')}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('recipes.photoLabel')}
        </label>
        {previewUrl ? (
          <img src={previewUrl} alt="" className="mb-3 h-36 w-full rounded-2xl object-cover" />
        ) : null}
        <CameraCapture hasPhoto={value.photo !== null} onCapture={(photo) => setValue((current) => ({ ...current, photo }))} />
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          disabled={isSubmitting || !canSubmit}
          onClick={() => void onSubmit(value)}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
