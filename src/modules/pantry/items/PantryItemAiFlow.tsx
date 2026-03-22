import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AiScanButton } from '@/modules/ai/AiScanButton';
import { CameraModal } from '@/modules/add-item/CameraModal';
import { ImageTrigger } from '@/modules/add-item/ImageTrigger';
import { Button } from '@/shared/ui/Button';

type PantryItemAiFlowProps = {
  isIdentifying: boolean;
  aiPhoto: Blob | null;
  aiPreviewUrl: string | null;
  onCapture: (blob: Blob) => void;
  onClearPhoto: () => void;
  onIdentify: () => void;
  onBack: () => void;
};

export function PantryItemAiFlow({
  isIdentifying,
  aiPhoto,
  aiPreviewUrl,
  onCapture,
  onClearPhoto,
  onIdentify,
  onBack,
}: PantryItemAiFlowProps) {
  const { t } = useTranslation();
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  if (isIdentifying) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <LoaderCircle className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" strokeWidth={2} />
        <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">{t('ai.identifying')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ImageTrigger
        photo={aiPhoto}
        previewUrl={aiPreviewUrl}
        onOpenModal={() => setIsCameraOpen(true)}
        onClear={onClearPhoto}
      />
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(blob) => {
          onCapture(blob);
          setIsCameraOpen(false);
        }}
      />
      {aiPhoto ? <AiScanButton className="w-full" onClick={onIdentify} /> : null}
      <Button variant="secondary" className="w-full" onClick={onBack}>
        {t('common.back')}
      </Button>
    </div>
  );
}
