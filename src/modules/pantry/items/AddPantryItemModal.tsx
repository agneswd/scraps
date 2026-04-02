import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { CameraModal } from '@/modules/add-item/CameraModal';
import { BarcodeScanner } from '@/modules/pantry/scanner/BarcodeScanner';
import { useResolveScannedBarcode } from '@/modules/pantry/scanner/use-scanner';
import { fetchProductImageBlob } from '@/modules/pantry/scanner/open-food-facts-api';
import { useCreatePantryItem, useIncrementQuantity } from '@/modules/pantry/use-pantry';
import { toPantryCategory, type PantryCategory } from '@/modules/pantry/pantry-categories';
import { useAiIdentify } from '@/modules/ai/use-ai-identify';
import { PantryEntryMethodPicker } from '@/modules/pantry/items/PantryEntryMethodPicker';
import { PantryItemManualWizard } from '@/modules/pantry/items/PantryItemManualWizard';

type AddPantryItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type EntryMethod = 'choose' | 'manual' | 'barcode' | 'ai';

const TOTAL_STEPS = 4;

export function AddPantryItemModal({ isOpen, onClose }: AddPantryItemModalProps) {
  const { t } = useTranslation();
  const createItem = useCreatePantryItem();
  const incrementQuantity = useIncrementQuantity();
  const scanner = useResolveScannedBarcode();
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
    }
  }, [isOpen, scanner]);

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

      if (result.outcome === 'existing-match') {
        await incrementQuantity.mutateAsync({
          id: result.item.id,
          currentQuantity: result.item.quantity,
          currentStatus: result.item.status,
        });
        onClose();
        return;
      }

      if (result.outcome === 'not-found') {
        setMethod('manual');
        setStep(0);
        setError(t('scanner.productNotFound'));
        return;
      }

      if (result.outcome === 'lookup-error') {
        setMethod('manual');
        setStep(0);
        setError(t('scanner.lookupFailed'));
        return;
      }

      // outcome === 'product-found' — pre-fill form and start async image fetch
      setName(result.product.name);
      setCategory(result.product.category);
      setQuantity(1);
      setUnit(result.product.quantityLabel ?? '');
      setPhoto(null);
      setStep(3);

      if (result.product.imageUrl) {
        void fetchProductImageBlob(result.product.imageUrl).then((blob) => {
          if (blob) setPhoto(blob);
        });
      }
    } catch {
      setMethod('manual');
      setStep(0);
      setError(t('scanner.lookupFailed'));
    }
  }

  async function handleAiCapture(capturedPhoto: Blob) {
    try {
      setError(null);
      setAiPhoto(capturedPhoto);
      const result = await identifyPantryItem.mutateAsync(capturedPhoto);
      const nextCategory = toPantryCategory(result.category);

      setName(result.name);
      setCategory(nextCategory);
      setQuantity(1);
      setPhoto(capturedPhoto);

      // Auto-save immediately — same behaviour as the leftover AI flow
      try {
        await createItem.mutateAsync({
          name: result.name.trim(),
          category: nextCategory,
          quantity: 1,
          photo: capturedPhoto,
        });
        onClose();
      } catch {
        // Save failed → drop into manual form with data pre-filled
        setError(t('pantry.saveError'));
        setMethod('manual');
        setStep(3);
      }
    } catch {
      // AI identification failed → manual fallback with photo
      setError(t('ai.identifyError'));
      setMethod('manual');
      setStep(0);
      setPhoto(capturedPhoto);
    }
  }

  if (method === 'choose') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('pantry.addTitle')}>
        <PantryEntryMethodPicker
          onSelectManual={() => setMethod('manual')}
          onSelectBarcode={() => {
            setMethod('barcode');
            setIsScannerOpen(true);
          }}
          onSelectAi={() => setMethod('ai')}
        />
      </Modal>
    );
  }

  if (method === 'barcode' && isScannerOpen) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('scanner.title')} fullScreen>
        <BarcodeScanner
          onDetected={(scannedBarcode) => void handleBarcodeDetected(scannedBarcode)}
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
    const isAiWorking = identifyPantryItem.isPending || createItem.isPending;

    // While not busy and no error, show the camera directly (instant flow)
    if (!isAiWorking && !error) {
      return (
        <CameraModal
          isOpen={isOpen}
          onClose={() => {
            setMethod('choose');
            setAiPhoto(null);
          }}
          onCapture={(blob) => void handleAiCapture(blob)}
          closeOnCapture={false}
          closeOnUpload={false}
        />
      );
    }

    // AI is processing — show spinner, or show error + retry
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('ai.identifyTitle')}>
        {isAiWorking ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 dark:bg-white">
              <Sparkles className="h-6 w-6 text-white dark:text-slate-900" strokeWidth={1.8} />
            </div>
            <p className="mt-5 text-base font-semibold text-slate-900 dark:text-white">{t('ai.identifying')}</p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">{t('ai.identifyingHint')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {aiPreviewUrl ? (
              <img src={aiPreviewUrl} alt="" className="h-36 w-full rounded-2xl object-cover" />
            ) : null}
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </p>
            <button
              type="button"
              onClick={() => { setError(null); setMethod('ai'); }}
              className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {t('ai.scanButton')}
            </button>
            <button
              type="button"
              onClick={() => { setMethod('manual'); setStep(0); }}
              className="w-full py-2 text-center text-sm text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
            >
              {t('common.back')}
            </button>
          </div>
        )}
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('pantry.addTitle')}>
      <PantryItemManualWizard
        step={step}
        totalSteps={TOTAL_STEPS}
        name={name}
        category={category}
        quantity={quantity}
        unit={unit}
        photo={photo}
        previewUrl={previewUrl}
        barcode={barcode}
        canProceed={canProceed}
        isSaving={createItem.isPending}
        error={error}
        onNameChange={setName}
        onCategoryChange={setCategory}
        onQuantityChange={setQuantity}
        onUnitChange={setUnit}
        onPhotoCapture={setPhoto}
        onClearPhoto={() => setPhoto(null)}
        onNext={() => setStep(step + 1)}
        onBack={() => (step > 0 ? setStep(step - 1) : setMethod('choose'))}
        onSave={() => void handleSave()}
      />
    </Modal>
  );
}
