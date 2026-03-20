import { useTranslation } from 'react-i18next';
import { CATEGORY_ICONS, type LeftoverCategory } from '@/modules/dashboard/expiry-utils';

const categories = ['meat', 'poultry', 'seafood', 'veg', 'dairy', 'grains', 'prepared', 'other'] as const;

type CategoryPickerProps = {
  value: LeftoverCategory | null;
  onChange: (category: LeftoverCategory) => void;
};

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          className={[
            'flex min-h-24 flex-col items-center justify-center gap-2 rounded-3xl border px-4 py-3 text-sm font-medium transition',
            value === category
              ? 'border-brand-500 bg-brand-500 text-white shadow-card'
              : 'border-slate-200 bg-white/80 text-slate-700 hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:border-brand-500/50 dark:hover:bg-slate-900',
          ].join(' ')}
        >
          {(() => {
            const Icon = CATEGORY_ICONS[category];
            return <Icon className="h-6 w-6" />;
          })()}
          {t(`categories.${category}`)}
        </button>
      ))}
    </div>
  );
}
