import { Barcode, Pencil, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type PantryEntryMethodPickerProps = {
  onSelectManual: () => void;
  onSelectBarcode: () => void;
  onSelectAi: () => void;
};

export function PantryEntryMethodPicker({
  onSelectManual,
  onSelectBarcode,
  onSelectAi,
}: PantryEntryMethodPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {/* AI — featured / primary button */}
      <button
        type="button"
        onClick={onSelectAi}
        className="flex w-full items-center gap-4 rounded-2xl bg-slate-900 p-4 text-left transition-all active:scale-[0.98] dark:bg-white"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 dark:bg-slate-900/15">
          <Sparkles className="h-5 w-5 text-white dark:text-slate-900" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white dark:text-slate-900">{t('pantry.methodAi')}</p>
          <p className="text-xs text-white/60 dark:text-slate-500">{t('pantry.methodAiHint')}</p>
        </div>
      </button>

      {/* Manual */}
      <button
        type="button"
        onClick={onSelectManual}
        className="flex w-full items-center gap-4 rounded-2xl bg-slate-50 p-4 text-left transition-all active:scale-[0.98] hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-700">
          <Pencil className="h-5 w-5 text-slate-600 dark:text-slate-300" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('pantry.methodManual')}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{t('pantry.methodManualHint')}</p>
        </div>
      </button>

      {/* Barcode */}
      <button
        type="button"
        onClick={onSelectBarcode}
        className="flex w-full items-center gap-4 rounded-2xl bg-slate-50 p-4 text-left transition-all active:scale-[0.98] hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-700">
          <Barcode className="h-5 w-5 text-slate-600 dark:text-slate-300" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('pantry.methodBarcode')}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{t('pantry.methodBarcodeHint')}</p>
        </div>
      </button>
    </div>
  );
}
