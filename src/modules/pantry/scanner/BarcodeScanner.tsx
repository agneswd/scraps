import { useEffect, useId, useRef, useState } from 'react';
import { CameraOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/Button';

type BarcodeScannerProps = {
  onDetected: (barcode: string) => void;
  onCancel: () => void;
};

async function stopScanner(instance: { stop: () => Promise<void>; clear: () => void } | null) {
  if (!instance) {
    return;
  }

  try {
    await instance.stop();
  } catch {
    // Ignore stop failures during teardown.
  }

  try {
    instance.clear();
  } catch {
    // Ignore clear failures during teardown.
  }
}

export function BarcodeScanner({ onDetected, onCancel }: BarcodeScannerProps) {
  const { t } = useTranslation();
  const elementId = useId().replace(/:/g, '-');
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const hasDetectedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isDisposed = false;

    void import('html5-qrcode')
      .then(({ Html5Qrcode, Html5QrcodeSupportedFormats }) => {
        if (isDisposed) {
          return;
        }

        const scanner = new Html5Qrcode(elementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
          verbose: false,
        });
        scannerRef.current = scanner;

        return scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 260, height: 160 },
            aspectRatio: 1.777778,
            disableFlip: false,
          },
          (decodedText) => {
            if (hasDetectedRef.current) {
              return;
            }

            hasDetectedRef.current = true;
            void stopScanner(scanner).finally(() => {
              onDetected(decodedText);
            });
          },
          () => {
            // Ignore noisy per-frame decode errors.
          },
        );
      })
      .catch(() => {
        if (!isDisposed) {
          setError(t('scanner.cameraUnavailable'));
        }
      });

    return () => {
      isDisposed = true;
      void stopScanner(scannerRef.current);
      scannerRef.current = null;
      hasDetectedRef.current = false;
    };
  }, [elementId, onDetected, t]);

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
          <div className="flex flex-col items-center gap-2 text-center">
            <CameraOff className="h-6 w-6 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
            <p className="max-w-[220px] text-xs text-slate-400 dark:text-slate-500">
              {error}
            </p>
          </div>
        </div>
        <Button variant="secondary" className="w-full" onClick={onCancel}>
          {t('scanner.useManualInstead')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex-1 overflow-hidden rounded-3xl bg-black shadow-soft">
        <div id={elementId} className="min-h-[55vh]" />
      </div>
      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        {t('scanner.alignBarcode')}
      </p>
      <Button variant="secondary" className="w-full" onClick={onCancel}>
        {t('scanner.useManualInstead')}
      </Button>
    </div>
  );
}
