import { Camera, ImageUp, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ImageTriggerProps = {
  photo: Blob | null;
  onOpenModal: () => void;
  onClear: () => void;
  previewUrl: string | null;
};

export function ImageTrigger({ photo, onOpenModal, onClear, previewUrl }: ImageTriggerProps) {
  const { t } = useTranslation();

  if (photo && previewUrl) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700">
        <img
          src={previewUrl}
          alt={t('addItem.previewAlt', 'Photo preview')}
          className="aspect-video w-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
          <button
            type="button"
            onClick={onOpenModal}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-md transition-transform hover:scale-105 active:scale-95"
            aria-label={t('addItem.retake', 'Retake photo')}
          >
            <Camera className="h-5 w-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={onClear}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-md transition-transform hover:scale-105 active:scale-95"
            aria-label={t('addItem.clearPhoto', 'Clear photo')}
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        
        {/* Mobile-friendly overlay actions if hover isn't ideal */}
        <div className="absolute right-2 top-2 flex flex-col gap-2 md:hidden">
          <button
            type="button"
            onClick={onClear}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-transform active:scale-95"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenModal}
      className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 transition-colors hover:border-slate-300 hover:bg-slate-100 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600 dark:hover:bg-slate-800"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-900">
        <Camera className="h-5 w-5 text-slate-400 dark:text-slate-500" strokeWidth={2} />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('addItem.addPhoto', 'Add a photo')}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('addItem.addPhotoHint', 'Tap to use camera or select file')}
        </p>
      </div>
    </button>
  );
}
