import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoaderCircle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { BarcodeScanner } from '@/modules/pantry/scanner/BarcodeScanner';
import { useResolveScannedBarcode } from '@/modules/pantry/scanner/use-scanner';
import { fetchProductImageBlob } from '@/modules/pantry/scanner/open-food-facts-api';
import { useCreatePantryItem, useIncrementQuantity } from '@/modules/pantry/use-pantry';
import { toPantryCategory, type PantryCategory } from '@/modules/pantry/pantry-categories';
import { useAiIdentify } from '@/modules/ai/use-ai-identify';
import { PantryEntryMethodPicker } from '@/modules/pantry/items/PantryEntryMethodPicker';
import { PantryItemAiFlow } from '@/modules/pantry/items/PantryItemAiFlow';
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

  async function handleAiIdentify() {
    if (!aiPhoto) return;
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
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('ai.identifyTitle')}>
        <PantryItemAiFlow
          isIdentifying={identifyPantryItem.isPending}
          aiPhoto={aiPhoto}
          aiPreviewUrl={aiPreviewUrl}
          onCapture={setAiPhoto}
          onClearPhoto={() => setAiPhoto(null)}
          onIdentify={() => void handleAiIdentify()}
          onBack={() => setMethod('manual')}
        />
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
