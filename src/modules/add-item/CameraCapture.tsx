import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ImageUp, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resizeAndCompress } from '@/modules/add-item/image-utils';

type CameraCaptureProps = {
  hasPhoto?: boolean;
  onCapture: (file: Blob | null) => void;
};

export function CameraCapture({ hasPhoto = false, onCapture }: CameraCaptureProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) return;

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (isCancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        setStream(mediaStream);
      } catch {
        setError(t('addItem.cameraUnavailable'));
      }
    }

    void startCamera();

    return () => {
      isCancelled = true;
      setStream((currentStream) => {
        currentStream?.getTracks().forEach((track) => track.stop());
        return null;
      });
    };
  }, [t]);

  useEffect(() => {
    if (!videoRef.current || !stream) return;
    videoRef.current.srcObject = stream;
    void videoRef.current.play();
  }, [stream]);

  async function handleCapture() {
    if (!videoRef.current) return;

    try {
      // Limit capture resolution to prevent oversized intermediates on high-res cameras
      const maxCaptureSize = 1920;
      const scale = Math.min(1, maxCaptureSize / Math.max(videoRef.current.videoWidth, videoRef.current.videoHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(videoRef.current.videoWidth * scale);
      canvas.height = Math.round(videoRef.current.videoHeight * scale);

      const context = canvas.getContext('2d');
      if (!context) {
        setError(t('errors.generic'));
        return;
      }

      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const rawBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('capture-failed')); return; }
          resolve(blob);
        }, 'image/jpeg', 0.9);
      });

      const compressedBlob = await resizeAndCompress(rawBlob);
      setError(null);
      onCapture(compressedBlob);
    } catch {
      setError(t('addItem.captureError'));
    }
  }

  async function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressedBlob = await resizeAndCompress(file);
      setError(null);
      onCapture(compressedBlob);
    } catch {
      setError(t('addItem.captureError'));
    }
  }

  return (
    <div className="space-y-4">
      {stream ? (
        <div className="overflow-hidden rounded-2xl bg-black shadow-soft">
          <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
        </div>
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
          <div className="flex flex-col items-center gap-2 text-center">
            {error ? (
              <CameraOff className="h-6 w-6 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
            ) : (
              <ImageUp className="h-6 w-6 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
            )}
            <p className="max-w-[200px] text-xs text-slate-400 dark:text-slate-500">
              {error ?? t('addItem.fileFallback')}
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">
        {stream ? t('addItem.cameraHint') : t('addItem.fileFallback')}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {stream ? (
          <button
            type="button"
            onClick={() => void handleCapture()}
            className="col-span-2 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition-all duration-200 ease-spring active:scale-95 dark:bg-white dark:text-slate-900"
          >
            <Camera className="h-4 w-4" strokeWidth={2} />
            {t('addItem.capture')}
          </button>
        ) : null}

        <label className={[
          'inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-medium transition-all duration-200 ease-spring active:scale-95',
          stream
            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            : 'col-span-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900',
        ].join(' ')}>
          <ImageUp className="h-4 w-4" strokeWidth={2} />
          {t('addItem.uploadPhoto')}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void handleFileSelection(event)}
          />
        </label>

        {hasPhoto ? (
          <button
            type="button"
            onClick={() => onCapture(null)}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-sm text-slate-500 transition-all duration-200 ease-spring hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4" strokeWidth={2} />
            {t('addItem.clearPhoto')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
