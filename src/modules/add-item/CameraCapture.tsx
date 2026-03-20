import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ImageUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resizeAndCompress } from '@/modules/add-item/image-utils';

type CameraCaptureProps = {
  onCapture: (file: Blob | null) => void;
};

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        return;
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
          },
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
    if (!videoRef.current || !stream) {
      return;
    }

    videoRef.current.srcObject = stream;
    void videoRef.current.play();
  }, [stream]);

  async function handleCapture() {
    if (!videoRef.current) {
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const context = canvas.getContext('2d');

      if (!context) {
        setError(t('errors.generic'));
        return;
      }

      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const rawBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('capture-failed'));
            return;
          }

          resolve(blob);
        }, 'image/png');
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

    if (!file) {
      return;
    }

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
        <div className="overflow-hidden rounded-[28px] border border-white/50 bg-black shadow-card dark:border-white/10">
          <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/70 text-slate-500 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-300">
          <div className="flex flex-col items-center gap-3 text-center">
            {error ? <CameraOff className="h-8 w-8" /> : <ImageUp className="h-8 w-8" />}
            <p className="max-w-xs text-sm leading-6">{error ?? t('addItem.fileFallback')}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {stream ? (
          <button
            type="button"
            onClick={() => void handleCapture()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            <Camera className="h-4 w-4" />
            {t('addItem.capture')}
          </button>
        ) : null}

        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900">
          <ImageUp className="h-4 w-4" />
          {t('addItem.uploadPhoto')}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void handleFileSelection(event)}
          />
        </label>

        <button
          type="button"
          onClick={() => onCapture(null)}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          {t('addItem.clearPhoto')}
        </button>
      </div>
    </div>
  );
}
