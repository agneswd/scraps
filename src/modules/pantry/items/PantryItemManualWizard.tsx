import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { CameraModal } from '@/modules/add-item/CameraModal';
import { ImageTrigger } from '@/modules/add-item/ImageTrigger';
import { PantryCategoryPicker } from '@/modules/pantry/items/PantryCategoryPicker';
import { Button } from '@/shared/ui/Button';
import type { PantryCategory } from '@/modules/pantry/pantry-categories';

type PantryItemManualWizardProps = {
  step: number;
  totalSteps: number;
  name: string;
  category: PantryCategory | null;
  quantity: number;
  unit: string;
  photo: Blob | null;
  previewUrl: string | null;
  barcode: string;
  canProceed: boolean;
  isSaving: boolean;
  error: string | null;
  onNameChange: (value: string) => void;
  onCategoryChange: (value: PantryCategory) => void;
  onQuantityChange: (value: number) => void;
  onUnitChange: (value: string) => void;
  onPhotoCapture: (blob: Blob) => void;
  onClearPhoto: () => void;
  onNext: () => void;
  onBack: () => void;
  onSave: () => void;
};

export function PantryItemManualWizard({
  step,
  totalSteps,
  name,
  category,
  quantity,
  unit,
  photo,
  previewUrl,
  barcode,
  canProceed,
  isSaving,
  error,
  onNameChange,
  onCategoryChange,
  onQuantityChange,
  onUnitChange,
  onPhotoCapture,
  onClearPhoto,
  onNext,
  onBack,
  onSave,
}: PantryItemManualWizardProps) {
  const { t } = useTranslation();
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col">
      {/* Progress dots */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={[
              'h-1.5 rounded-full transition-all duration-300',
              i === step ? 'w-6 bg-slate-900 dark:bg-white' : 'w-1.5 bg-slate-200 dark:bg-slate-700',
            ].join(' ')}
          />
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('pantry.nameLabel')}
              </label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={t('pantry.namePlaceholder')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
              />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="category" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('addItem.categoryLabel')}
              </label>
              <PantryCategoryPicker value={category} onChange={onCategoryChange} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="photo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('addItem.photoLabel')}
              </label>
              <div className="space-y-4">
                <ImageTrigger
                  photo={photo}
                  previewUrl={previewUrl}
                  onOpenModal={() => setIsCameraOpen(true)}
                  onClear={onClearPhoto}
                />
                <CameraModal
                  isOpen={isCameraOpen}
                  onClose={() => setIsCameraOpen(false)}
                  onCapture={(blob) => {
                    onPhotoCapture(blob);
                    setIsCameraOpen(false);
                  }}
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
              {barcode ? (
                <div className="mb-3 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {t('scanner.barcodeLabel')}: {barcode}
                </div>
              ) : null}
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('pantry.quantityLabel')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => onQuantityChange(Math.max(1, Number(e.target.value)))}
                  className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-sm font-semibold tabular-nums text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                />
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => onUnitChange(e.target.value)}
                  placeholder={t('pantry.unitPlaceholder')}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error ? <p className="mt-3 text-center text-xs text-red-500">{error}</p> : null}

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onBack}>
          {t('common.back')}
        </Button>
        {step < totalSteps - 1 ? (
          <Button className="flex-1" disabled={!canProceed} onClick={onNext}>
            {t('common.next')}
          </Button>
        ) : (
          <Button className="flex-1" disabled={!canProceed || isSaving} onClick={onSave}>
            {isSaving ? t('pantry.saving') : t('common.save')}
          </Button>
        )}
      </div>
    </div>
  );
}
