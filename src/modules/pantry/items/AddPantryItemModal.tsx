import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Barcode, Camera, LoaderCircle, Pencil } from 'lucide-react';
import { AiScanButton } from '@/modules/ai/AiScanButton';
import { useAiIdentify } from '@/modules/ai/use-ai-identify';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { PantryCategoryPicker } from '@/modules/pantry/items/PantryCategoryPicker';
import { CameraModal } from '@/modules/add-item/CameraModal';
import { ImageTrigger } from '@/modules/add-item/ImageTrigger';
import { BarcodeScanner } from '@/modules/pantry/scanner/BarcodeScanner';
import { useScanner } from '@/modules/pantry/scanner/use-scanner';
import { useCreatePantryItem, useIncrementQuantity } from '@/modules/pantry/use-pantry';
import { type PantryCategory } from '@/modules/pantry/pantry-categories';

type AddPantryItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type EntryMethod = 'choose' | 'manual' | 'barcode' | 'ai';

function toPantryCategory(value: string): PantryCategory {
  const allowed: PantryCategory[] = ['meat', 'poultry', 'seafood', 'veg', 'dairy', 'grains', 'prepared', 'other', 'condiment', 'spice', 'beverage', 'frozen', 'baking', 'canned'];
  return allowed.includes(value as PantryCategory) ? (value as PantryCategory) : 'other';
}

export function AddPantryItemModal({ isOpen, onClose }: AddPantryItemModalProps) {
  const { t } = useTranslation();
  const createItem = useCreatePantryItem();
  const incrementQuantity = useIncrementQuantity();
  const scanner = useScanner();
  const identifyPantryItem = useAiIdentify('pantry');

  const [method, setMethod] = useState<EntryMethod>('choose');
  const [step, setStep] = useState(0);
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PantryCategory | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [aiPhoto, setAiPhoto] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

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
      scanner.reset();
      setMethod('choose');
      setStep(0);
      setBarcode('');
      setName('');
      setCategory(null);
      setQuantity(1);
      setUnit('');
      setPhoto(null);
      setAiPhoto(null);
      setError(null);
      setIsScannerOpen(false);
      setIsCameraOpen(false);
    }
  }, [isOpen, scanner]);

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
        barcode: barcode || undefined,
        photo,
      });
      onClose();
    } catch {
      setError(t('pantry.saveError'));
    }
  }

  async function handleBarcodeDetected(scannedBarcode: string) {
    setError(null);
    setBarcode(scannedBarcode);
    setIsScannerOpen(false);

    try {
      const result = await scanner.resolveBarcode(scannedBarcode);

      if (result.existingItem) {
        await incrementQuantity.mutateAsync({
          id: result.existingItem.id,
          currentQuantity: result.existingItem.quantity,
          currentStatus: result.existingItem.status,
        });
        onClose();
        return;
      }

      if (!result.product) {
        setStep(0);
        setError(t('scanner.productNotFound'));
        return;
      }

      setName(result.product.name);
      setCategory(result.product.category);
      setQuantity(1);
      setUnit(result.product.quantityLabel ?? '');
      setPhoto(result.product.imageBlob ?? null);
      setStep(3);
    } catch {
      setStep(0);
      setError(t('scanner.lookupFailed'));
    }
  }

  async function handleAiIdentify() {
    if (!aiPhoto) {
      return;
    }

    try {
      setError(null);
      const result = await identifyPantryItem.mutateAsync(aiPhoto);
      setName(result.name);
      setCategory(toPantryCategory(result.category));
      setQuantity(1);
      setPhoto(aiPhoto);
      setStep(3);
      setMethod('manual');
    } catch {
      setError(t('ai.identifyError'));
      setMethod('manual');
      setStep(2);
      setPhoto(aiPhoto);
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
            onClick={() => {
              setMethod('barcode');
              setIsScannerOpen(true);
            }}
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

  if (method === 'barcode' && isScannerOpen) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('scanner.title')} fullScreen>
        <BarcodeScanner
          onDetected={(scannedBarcode) => {
            void handleBarcodeDetected(scannedBarcode);
          }}
          onCancel={() => {
            setIsScannerOpen(false);
            setMethod('manual');
          }}
        />
      </Modal>
    );
  }

  if (method === 'barcode' && scanner.isResolving) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('scanner.title')} fullScreen>
        <div className="flex h-full flex-col items-center justify-center py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <LoaderCircle className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" strokeWidth={2} />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">
            {t('scanner.lookingUpProduct')}
          </p>
          {barcode ? (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{barcode}</p>
          ) : null}
        </div>
      </Modal>
    );
  }

  if (method === 'ai') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('ai.identifyTitle')}>
        {identifyPantryItem.isPending ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <LoaderCircle className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" strokeWidth={2} />
            <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">{t('ai.identifying')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ImageTrigger
              photo={aiPhoto}
              previewUrl={aiPreviewUrl}
              onOpenModal={() => setIsCameraOpen(true)}
              onClear={() => setAiPhoto(null)}
            />
            <CameraModal
              isOpen={isCameraOpen}
              onClose={() => setIsCameraOpen(false)}
              onCapture={(blob) => {
                setAiPhoto(blob);
                setIsCameraOpen(false);
              }}
            />
            {aiPhoto ? <AiScanButton className="w-full" onClick={() => void handleAiIdentify()} /> : null}
            <Button variant="secondary" className="w-full" onClick={() => setMethod('manual')}>
              {t('common.back')}
            </Button>
          </div>
        )}
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
                <div className="space-y-4">
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
            className="flex-1"
            onClick={() => (step > 0 ? setStep(step - 1) : setMethod('choose'))}
          >
            {t('common.back')}
          </Button>

          {step < totalSteps - 1 ? (
            <Button className="flex-1" disabled={!canProceed} onClick={() => setStep(step + 1)}>
              {t('common.next')}
            </Button>
          ) : (
            <Button
              className="flex-1"
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
