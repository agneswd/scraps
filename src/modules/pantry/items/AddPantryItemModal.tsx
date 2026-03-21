import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Barcode, Camera, Pencil } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { PantryCategoryPicker } from '@/modules/pantry/items/PantryCategoryPicker';
import { CameraCapture } from '@/modules/add-item/CameraCapture';
import { useCreatePantryItem } from '@/modules/pantry/use-pantry';
import { type PantryCategory } from '@/modules/pantry/pantry-categories';

type AddPantryItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type EntryMethod = 'choose' | 'manual' | 'barcode' | 'ai';

export function AddPantryItemModal({ isOpen, onClose }: AddPantryItemModalProps) {
  const { t } = useTranslation();
  const createItem = useCreatePantryItem();

  const [method, setMethod] = useState<EntryMethod>('choose');
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PantryCategory | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    if (!isOpen) {
      setMethod('choose');
      setStep(0);
      setName('');
      setCategory(null);
      setQuantity(1);
      setUnit('');
      setPhoto(null);
      setError(null);
    }
  }, [isOpen]);

  const totalSteps = 4;

  const canProceed =
    (step === 0 && name.trim().length > 0) ||
    (step === 1 && category !== null) ||
    step === 2 ||
    step === 3;

  async function handleSave() {
    if (!category) return;

    try {
      setError(null);
      await createItem.mutateAsync({
        name: name.trim(),
        category,
        quantity,
        unit: unit.trim() || undefined,
        photo,
      });
      onClose();
    } catch {
      setError(t('pantry.saveError'));
    }
  }

  // Method chooser screen
  if (method === 'choose') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('pantry.addTitle')}>
        <div className="space-y-3 p-1">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {t('pantry.addMethodPrompt')}
          </p>

          <button
            type="button"
            onClick={() => setMethod('manual')}
            className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-4 text-left transition-all hover:bg-slate-100 active:scale-[0.98] dark:bg-slate-800/60 dark:hover:bg-slate-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-700">
              <Pencil className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {t('pantry.methodManual')}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t('pantry.methodManualHint')}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMethod('barcode')}
            className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-4 text-left transition-all hover:bg-slate-100 active:scale-[0.98] dark:bg-slate-800/60 dark:hover:bg-slate-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-700">
              <Barcode className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {t('pantry.methodBarcode')}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t('pantry.methodBarcodeHint')}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMethod('ai')}
            className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-4 text-left transition-all hover:bg-slate-100 active:scale-[0.98] dark:bg-slate-800/60 dark:hover:bg-slate-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-700">
              <Camera className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {t('pantry.methodAi')}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t('pantry.methodAiHint')}
              </p>
            </div>
          </button>
        </div>
      </Modal>
    );
  }

  // Manual entry flow
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('pantry.addTitle')}>
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
                  onChange={(e) => setName(e.target.value)}
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
                <PantryCategoryPicker value={category} onChange={setCategory} />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="photo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('addItem.photoLabel')}
                </label>
                <CameraCapture hasPhoto={photo !== null} onCapture={setPhoto} />
                {previewUrl && (
                  <img src={previewUrl} alt="" className="mt-3 h-32 w-full rounded-xl object-cover" />
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('pantry.quantityLabel')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-sm font-semibold tabular-nums text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                  />
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder={t('pantry.unitPlaceholder')}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <p className="mt-3 text-center text-xs text-red-500">{error}</p>
        )}

        {/* Navigation */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            onClick={() => (step > 0 ? setStep(step - 1) : setMethod('choose'))}
          >
            {t('common.back')}
          </Button>

          {step < totalSteps - 1 ? (
            <Button disabled={!canProceed} onClick={() => setStep(step + 1)}>
              {t('common.next')}
            </Button>
          ) : (
            <Button
              disabled={!canProceed || createItem.isPending}
              onClick={handleSave}
            >
              {createItem.isPending ? t('pantry.saving') : t('common.save')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
