import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, LoaderCircle, Pencil, Sparkles } from 'lucide-react';
import { useAiIdentify } from '@/modules/ai/use-ai-identify';
import { CameraModal } from '@/modules/add-item/CameraModal';
import { ImageTrigger } from '@/modules/add-item/ImageTrigger';
import { CategoryPicker } from '@/modules/add-item/CategoryPicker';
import { useAddItem } from '@/modules/add-item/use-add-item';
import type { LeftoverCategory } from '@/modules/dashboard/expiry-utils';
import { calculateDefaultExpiryDate, toLeftoverCategory } from '@/modules/dashboard/expiry-utils';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

type AddItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// 2 steps: 0 = name + category, 1 = photo + notes (both optional)
const TOTAL_STEPS = 2;

type AddMode = 'choose' | 'manual' | 'ai';

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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  const aiPreviewUrl = useMemo(() => (aiPhoto ? URL.createObjectURL(aiPhoto) : null), [aiPhoto]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (aiPreviewUrl) URL.revokeObjectURL(aiPreviewUrl);
    };
  }, [previewUrl, aiPreviewUrl]);

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
      setIsCameraOpen(false);
    }
  }, [isOpen]);

  const canProceed = step === 0
    ? itemName.trim().length > 0 && category !== null && (category !== 'other' || customDays != null)
    : true; // step 1 (photo/notes) is always optional

  const isAiSubmitting = identifyLeftover.isPending || isPending;

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

  async function handleAiCapture(capturedPhoto: Blob) {
    try {
      setError(null);
      setAiPhoto(capturedPhoto);

      const result = await identifyLeftover.mutateAsync(capturedPhoto);
      const nextCategory = toLeftoverCategory(result.category);
      const nextCustomDays = result.estimated_expiry_days ?? null;

      setItemName(result.name);
      setCategory(nextCategory);
      setCustomDays(nextCustomDays);
      setPhoto(capturedPhoto);

      try {
        await createLeftover({
          itemName: result.name.trim(),
          category: nextCategory,
          expiryDate: calculateDefaultExpiryDate(nextCategory, new Date(), nextCustomDays ?? undefined),
          notes: '',
          photo: capturedPhoto,
        });
        onClose();
      } catch {
        setError(t('addItem.saveError'));
        setMode('manual');
        setStep(0);
      }
    } catch {
      setError(t('ai.identifyError'));
      setMode('manual');
      setPhoto(capturedPhoto);
      setStep(0);
    }
  }

  // ── Method chooser ─────────────────────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('addItem.title')}>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode('ai');
            }}
            className="flex w-full items-center gap-4 rounded-2xl bg-slate-900 p-4 text-left transition-all active:scale-[0.98] dark:bg-white"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 dark:bg-slate-900/15">
              <Sparkles className="h-5 w-5 text-white dark:text-slate-900" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white dark:text-slate-900">{t('addItem.methodAi')}</p>
              <p className="text-xs text-white/60 dark:text-slate-500">{t('addItem.methodAiHint')}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className="flex w-full items-center gap-4 rounded-2xl bg-slate-50 p-4 text-left transition-all active:scale-[0.98] hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-700">
              <Pencil className="h-5 w-5 text-slate-600 dark:text-slate-300" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('addItem.methodManual')}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{t('addItem.methodManualHint')}</p>
            </div>
          </button>
        </div>
      </Modal>
    );
  }

  // ── AI scan mode ───────────────────────────────────────────────────────────
  if (mode === 'ai') {
    if (!isAiSubmitting && !error) {
      return (
        <CameraModal
          isOpen={isOpen}
          onClose={() => {
            setMode('choose');
            setAiPhoto(null);
          }}
          onCapture={(blob) => {
            void handleAiCapture(blob);
          }}
          closeOnCapture={false}
          closeOnUpload={false}
        />
      );
    }

    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('ai.identifyTitle')}>
        {isAiSubmitting ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 dark:bg-white">
              <Sparkles className="h-6 w-6 text-white dark:text-slate-900" strokeWidth={1.8} />
            </div>
            <p className="mt-5 text-base font-semibold text-slate-900 dark:text-white">{t('ai.identifying')}</p>
            <p className="mt-1 text-sm text-slate-400">{t('ai.identifyingHint')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {aiPreviewUrl ? <img src={aiPreviewUrl} alt="" className="h-36 w-full rounded-2xl object-cover" /> : null}
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('ai');
              }}
              className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {t('ai.scanButton')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('manual'); setStep(0); }}
              className="w-full py-2 text-center text-sm text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
            >
              {t('common.back')}
            </button>
          </div>
        )}
      </Modal>
    );
  }

  // ── Manual multi-step ──────────────────────────────────────────────────────
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('addItem.title')}>
      <div className="flex flex-col">
        {/* Progress dots */}
        <div className="mb-5 flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={[
                'h-1.5 rounded-full transition-all duration-300 ease-spring',
                i === step ? 'w-7 bg-slate-900 dark:bg-white' : 'w-1.5 bg-slate-200 dark:bg-slate-700',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
          >
            {step === 0 ? (
              <div className="space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('addItem.nameLabel')}
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder={t('addItem.namePlaceholder')}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[0.9375rem] text-slate-900 outline-none transition-all ease-spring placeholder:text-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                    maxLength={60}
                    autoFocus
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('addItem.categoryLabel')}</p>
                  <CategoryPicker
                    value={category}
                    customDays={customDays}
                    onChange={setCategory}
                    onCustomDaysChange={setCustomDays}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Photo */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('addItem.photoLabel')}
                    <span className="ml-1 text-slate-300 dark:text-slate-600">{t('common.optional')}</span>
                  </p>
                  <ImageTrigger
                    photo={photo}
                    previewUrl={previewUrl}
                    onOpenModal={() => setIsCameraOpen(true)}
                    onClear={() => setPhoto(null)}
                  />
                  <CameraModal
                    isOpen={isCameraOpen}
                    onClose={() => setIsCameraOpen(false)}
                    onCapture={(blob) => {
                      setPhoto(blob);
                      setIsCameraOpen(false);
                    }}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="flex items-baseline justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>
                      {t('addItem.notesLabel')}
                      <span className="ml-1 text-slate-300 dark:text-slate-600">{t('common.optional')}</span>
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">{60 - notes.length}</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value.slice(0, 60))}
                    placeholder={t('addItem.notesPlaceholder')}
                    className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[0.9375rem] text-slate-900 outline-none transition-all ease-spring placeholder:text-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                  />
                </div>
              </div>
            )}
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

        {/* Footer actions */}
        <div className="mt-6 flex items-center gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={step === 0 ? onClose : () => setStep(0)}
          >
            {step === 0 ? t('common.cancel') : t('common.back')}
          </Button>

          {step < TOTAL_STEPS - 1 ? (
            <Button className="flex-1" disabled={!canProceed} onClick={() => setStep(1)}>
              {t('common.next')}
            </Button>
          ) : (
            <Button
              className="flex-1"
              disabled={isPending || !category || itemName.trim().length === 0}
              onClick={() => void handleSave()}
            >
              {isPending ? t('addItem.saving') : t('common.save')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

