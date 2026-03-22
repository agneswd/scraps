import { useEffect, useState, useMemo } from 'react';
import { Camera, Link2, LoaderCircle, Pencil, Text } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AiScanButton } from '@/modules/ai/AiScanButton';
import { useAiRecipeParse } from '@/modules/ai/use-ai-recipe-parse';
import { CameraModal } from '@/modules/add-item/CameraModal';
import { ImageTrigger } from '@/modules/add-item/ImageTrigger';
import { Modal } from '@/shared/ui/Modal';
import { RecipeEditor, type RecipeFormValue } from '@/modules/pantry/recipes/ui/RecipeEditor';
import { useCreateRecipe } from '@/modules/pantry/recipes/data/use-recipes';
import { Button } from '@/shared/ui/Button';

type AddRecipeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type AddRecipeMode = 'choose' | 'manual' | 'url' | 'text' | 'photo';

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

export function AddRecipeModal({ isOpen, onClose }: AddRecipeModalProps) {
  const { t } = useTranslation();
  const createRecipe = useCreateRecipe();
  const parseRecipe = useAiRecipeParse();
  const [mode, setMode] = useState<AddRecipeMode>('choose');
  const [error, setError] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const [photoValue, setPhotoValue] = useState<Blob | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [initialValue, setInitialValue] = useState<RecipeFormValue | undefined>(undefined);

  const previewUrl = useMemo(() => {
    return photoValue ? URL.createObjectURL(photoValue) : null;
  }, [photoValue]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isOpen) {
      setMode('choose');
      setError(null);
      setUrlValue('');
      setTextValue('');
      setPhotoValue(null);
      setInitialValue(undefined);
    }
  }, [isOpen]);

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

  async function handleAiImport() {
    try {
      setError(null);
      const result = await parseRecipe.mutateAsync(
        mode === 'url'
          ? { type: 'url', value: urlValue }
          : mode === 'text'
            ? { type: 'text', value: textValue }
            : { type: 'photo', value: photoValue as Blob },
      );
      setInitialValue(toFormValue(result));
      setMode('manual');
    } catch {
      setError(t('ai.parseRecipeError'));
    }
  }

  if (mode === 'choose') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('recipes.addTitle')}>
        <div className="space-y-3 p-1">
          <button type="button" onClick={() => setMode('manual')} className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-4 text-left transition-all hover:bg-slate-100 active:scale-[0.98] dark:bg-slate-800/60 dark:hover:bg-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-700"><Pencil className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" strokeWidth={1.8} /></div>
            <div><p className="text-sm font-medium text-slate-900 dark:text-white">{t('recipes.methodManual')}</p></div>
          </button>
          <button type="button" onClick={() => setMode('url')} className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-4 text-left transition-all hover:bg-slate-100 active:scale-[0.98] dark:bg-slate-800/60 dark:hover:bg-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-700"><Link2 className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" strokeWidth={1.8} /></div>
            <div><p className="text-sm font-medium text-slate-900 dark:text-white">{t('recipes.methodUrl')}</p></div>
          </button>
          <button type="button" onClick={() => setMode('text')} className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-4 text-left transition-all hover:bg-slate-100 active:scale-[0.98] dark:bg-slate-800/60 dark:hover:bg-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-700"><Text className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" strokeWidth={1.8} /></div>
            <div><p className="text-sm font-medium text-slate-900 dark:text-white">{t('recipes.methodText')}</p></div>
          </button>
          <button type="button" onClick={() => setMode('photo')} className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-4 text-left transition-all hover:bg-slate-100 active:scale-[0.98] dark:bg-slate-800/60 dark:hover:bg-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-700"><Camera className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" strokeWidth={1.8} /></div>
            <div><p className="text-sm font-medium text-slate-900 dark:text-white">{t('recipes.methodPhoto')}</p></div>
          </button>
        </div>
      </Modal>
    );
  }

  if (parseRecipe.isPending) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('recipes.addTitle')}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <LoaderCircle className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" strokeWidth={2} />
          <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">{t('ai.parsingRecipe')}</p>
        </div>
      </Modal>
    );
  }

  if (mode === 'url' || mode === 'text' || mode === 'photo') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('recipes.addTitle')}>
        <div className="space-y-4">
          {mode === 'url' ? (
            <input
              type="url"
              autoFocus
              value={urlValue}
              onChange={(event) => setUrlValue(event.target.value)}
              placeholder="https://"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
            />
          ) : null}
          {mode === 'text' ? (
            <textarea
              autoFocus
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
              placeholder={t('recipes.pasteTextPlaceholder')}
              className="min-h-40 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
            />
          ) : null}
          {mode === 'photo' ? (
            <div className="space-y-4">
              <ImageTrigger
                photo={photoValue}
                previewUrl={previewUrl}
                onOpenModal={() => setIsCameraOpen(true)}
                onClear={() => setPhotoValue(null)}
              />
              <CameraModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={(blob) => {
                  setPhotoValue(blob);
                  setIsCameraOpen(false);
                }}
              />
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setMode('choose')}>{t('common.back')}</Button>
            <AiScanButton
              className="flex-1"
              label={t('ai.importButton')}
              onClick={() => void handleAiImport()}
              isLoading={parseRecipe.isPending}
            />
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('recipes.addTitle')}>
      <RecipeEditor
        initialValue={initialValue}
        submitLabel={createRecipe.isPending ? t('recipes.saving') : t('common.save')}
        isSubmitting={createRecipe.isPending}
        error={error}
        onCancel={() => {
          if (initialValue) {
            setMode('choose');
            setInitialValue(undefined);
            return;
          }
          onClose();
        }}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
}
