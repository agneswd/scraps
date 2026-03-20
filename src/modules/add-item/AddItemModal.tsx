import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

export function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  const { t } = useTranslation();
  const { createLeftover, isPending } = useAddItem();
  const [step, setStep] = useState(0);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<LeftoverCategory | null>(null);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
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
      setStep(0);
      setItemName('');
      setCategory(null);
      setNotes('');
      setPhoto(null);
      setError(null);
    }
  }, [isOpen]);

  const canMoveForward =
    (step === 0 && itemName.trim().length > 0) ||
    (step === 1 && category !== null) ||
    step === 2 ||
    step === 3;

  async function handleSave() {
    if (!category) {
      return;
    }

    try {
      setError(null);
      await createLeftover({
        itemName: itemName.trim(),
        category,
        expiryDate: calculateDefaultExpiryDate(category),
        notes: notes.trim(),
        photo,
      });
      onClose();
    } catch {
      setError(t('addItem.saveError'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('addItem.title')}>
      <div className="flex min-h-full flex-col">
        <div className="mb-6 flex items-center justify-between rounded-full bg-brand-50/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 dark:bg-slate-900/80 dark:text-brand-200">
          <span>{t('addItem.progress', { current: step + 1, total: totalSteps })}</span>
          <span>{t(`addItem.steps.${step}`)}</span>
        </div>

        <div className="flex-1 space-y-6">
          {step === 0 ? (
            <section className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t('addItem.nameLabel')}
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                placeholder={t('addItem.namePlaceholder')}
                className="min-h-11 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-brand-500/20"
                maxLength={60}
              />
            </section>
          ) : null}

          {step === 1 ? (
            <section className="space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('addItem.categoryLabel')}</p>
              <CategoryPicker value={category} onChange={setCategory} />
            </section>
          ) : null}

          {step === 2 ? (
            <section className="space-y-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('addItem.photoLabel')}</p>
              <CameraCapture onCapture={setPhoto} />
              {previewUrl ? (
                <div className="overflow-hidden rounded-[28px] border border-white/50 bg-white/80 shadow-card dark:border-white/10 dark:bg-slate-950/80">
                  <img src={previewUrl} alt={t('addItem.previewAlt')} className="aspect-video w-full object-cover" />
                </div>
              ) : null}
            </section>
          ) : null}

          {step === 3 ? (
            <section className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t('addItem.notesLabel')}
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value.slice(0, 60))}
                placeholder={t('addItem.notesPlaceholder')}
                className="min-h-32 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-brand-500/20"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('addItem.notesCounter', { count: 60 - notes.length })}
              </p>
            </section>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-100">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={step === 0 ? onClose : () => setStep((current) => current - 1)}>
            {step === 0 ? t('common.cancel') : t('common.back')}
          </Button>

          {step < totalSteps - 1 ? (
            <Button disabled={!canMoveForward} onClick={() => setStep((current) => current + 1)}>
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
