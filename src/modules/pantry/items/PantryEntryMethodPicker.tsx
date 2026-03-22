import { Barcode, Camera, Pencil } from 'lucide-react';
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

  const methods = [
    {
      icon: Pencil,
      label: 'pantry.methodManual',
      hint: 'pantry.methodManualHint',
      onSelect: onSelectManual,
    },
    {
      icon: Barcode,
      label: 'pantry.methodBarcode',
      hint: 'pantry.methodBarcodeHint',
      onSelect: onSelectBarcode,
    },
    {
      icon: Camera,
      label: 'pantry.methodAi',
      hint: 'pantry.methodAiHint',
      onSelect: onSelectAi,
    },
  ] as const;

  return (
    <div className="space-y-3 p-1">
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        {t('pantry.addMethodPrompt')}
      </p>
      {methods.map(({ icon: Icon, label, hint, onSelect }) => (
        <button
          key={label}
          type="button"
          onClick={onSelect}
          className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-4 text-left transition-all hover:bg-slate-100 active:scale-[0.98] dark:bg-slate-800/60 dark:hover:bg-slate-800"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-700">
            <Icon className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{t(label)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{t(hint)}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
