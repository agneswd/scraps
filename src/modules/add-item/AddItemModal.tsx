import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, LoaderCircle, Pencil } from 'lucide-react';
import { AiScanButton } from '@/modules/ai/AiScanButton';
import { useAiIdentify } from '@/modules/ai/use-ai-identify';
import { CameraCapture } from '@/modules/add-item/CameraCapture';
import { CategoryPicker } from '@/modules/add-item/CategoryPicker';
import { useAddItem } from '@/modules/add-item/use-add-item';
import type { LeftoverCategory } from '@/modules/dashboard/expiry-utils';
import { calculateDefaultExpiryDate } from '@/modules/dashboard/expiry-utils';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

type AddItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const totalSteps = 4;

type AddMode = 'choose' | 'manual' | 'ai';

function toLeftoverCategory(value: string): LeftoverCategory {
  const allowed: LeftoverCategory[] = ['meat', 'poultry', 'seafood', 'veg', 'dairy', 'grains', 'prepared', 'other'];
  return allowed.includes(value as LeftoverCategory) ? (value as LeftoverCategory) : 'other';
}

export function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  const { t } = useTranslation();
  const { createLeftover, isPending } = useAddItem();
  const identifyLeftover = useAiIdentify('leftover');
  const [mode, setMode] = useState<AddMode>('choose');
  const [step, setStep] = useState(0);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<LeftoverCategory | null>(null);
  const [customDays, setCustomDays] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [aiPhoto, setAiPhoto] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isOpen) {
      setMode('choose');
      setStep(0);
      setItemName('');
      setCategory(null);
      setCustomDays(null);
      setNotes('');
      setPhoto(null);
      setAiPhoto(null);
      setError(null);
    }
  }, [isOpen]);

  const canMoveForward =
    (step === 0 && itemName.trim().length > 0) ||
    (step === 1 && category !== null && (category !== 'other' || customDays != null)) ||
    step === 2 ||
    step === 3;

  async function handleSave() {
    if (!category) return;

    try {
      setError(null);
      await createLeftover({
        itemName: itemName.trim(),
        category,
        expiryDate: calculateDefaultExpiryDate(category, new Date(), customDays ?? undefined),
        notes: notes.trim(),
        photo,
      });
      onClose();
    } catch {
      setError(t('addItem.saveError'));
    }
  }

  async function handleAiIdentify() {
    if (!aiPhoto) {
      return;
    }

    try {
      setError(null);
      const result = await identifyLeftover.mutateAsync(aiPhoto);
      setItemName(result.name);
      setCategory(toLeftoverCategory(result.category));
      setCustomDays(result.estimated_expiry_days ?? null);
      setPhoto(aiPhoto);
      setMode('manual');
      setStep(0);
    } catch {
      setError(t('ai.identifyError'));
      setMode('manual');
      setStep(2);
      setPhoto(aiPhoto);
    }
  }

  if (mode === 'choose') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('addItem.title')}>
        <div className="space-y-3 p-1">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {t('ai.leftoverMethodPrompt')}
          </p>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-4 text-left transition-all hover:bg-slate-100 active:scale-[0.98] dark:bg-slate-800/60 dark:hover:bg-slate-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-700">
              <Pencil className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{t('addItem.methodManual')}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{t('addItem.methodManualHint')}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMode('ai')}
            className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-4 text-left transition-all hover:bg-slate-100 active:scale-[0.98] dark:bg-slate-800/60 dark:hover:bg-slate-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-700">
              <Camera className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{t('addItem.methodAi')}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{t('addItem.methodAiHint')}</p>
            </div>
          </button>
        </div>
      </Modal>
    );
  }

  if (mode === 'ai') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('ai.identifyTitle')}>
        {identifyLeftover.isPending ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <LoaderCircle className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" strokeWidth={2} />
            <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">{t('ai.identifying')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <CameraCapture hasPhoto={Boolean(aiPhoto)} onCapture={setAiPhoto} />
            {aiPhoto ? <AiScanButton onClick={() => void handleAiIdentify()} /> : null}
            <Button variant="secondary" className="w-full" onClick={() => setMode('manual')}>
              {t('common.back')}
            </Button>
          </div>
        )}
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('addItem.title')}>
      <div className="flex min-h-full flex-col">
        {/* Progress dots */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={[
                'h-1.5 rounded-full transition-all duration-300 ease-spring',
                i === step ? 'w-6 bg-slate-900 dark:bg-white' : 'w-1.5 bg-slate-200 dark:bg-slate-700',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Step content with slide animation */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            >
              {step === 0 ? (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('addItem.nameLabel')}
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(event) => setItemName(event.target.value)}
                    placeholder={t('addItem.namePlaceholder')}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[0.9375rem] text-slate-900 outline-none transition-all duration-200 ease-spring placeholder:text-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                    maxLength={60}
                    autoFocus
                  />
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('addItem.categoryLabel')}</p>
              <CategoryPicker
                value={category}
                customDays={customDays}
                onChange={setCategory}
                onCustomDaysChange={setCustomDays}
              />
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('addItem.photoLabel')}</p>
                  {previewUrl ? (
                    <div className="overflow-hidden rounded-2xl">
                      <img src={previewUrl} alt={t('addItem.previewAlt')} className="aspect-video w-full object-cover" />
                    </div>
                  ) : null}
                  <CameraCapture hasPhoto={Boolean(photo)} onCapture={setPhoto} />
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('addItem.notesLabel')}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value.slice(0, 60))}
                    placeholder={t('addItem.notesPlaceholder')}
                    className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[0.9375rem] text-slate-900 outline-none transition-all duration-200 ease-spring placeholder:text-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                  />
                  <p className="text-right text-xs text-slate-300 dark:text-slate-600">
                    {60 - notes.length}
                  </p>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {error ? (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400"
            >
              {error}
            </motion.p>
          ) : null}
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}>
            {step === 0 ? t('common.cancel') : t('common.back')}
          </Button>

          {step < totalSteps - 1 ? (
            <Button disabled={!canMoveForward} onClick={() => setStep((s) => s + 1)}>
              {t('common.next')}
            </Button>
          ) : (
            <Button disabled={isPending || !category || itemName.trim().length === 0} onClick={() => void handleSave()}>
              {isPending ? t('addItem.saving') : t('common.save')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
