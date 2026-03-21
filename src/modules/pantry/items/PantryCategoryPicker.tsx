import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { PANTRY_CATEGORIES, PANTRY_CATEGORY_ICONS, type PantryCategory } from '@/modules/pantry/pantry-categories';

type PantryCategoryPickerProps = {
  value: PantryCategory | null;
  onChange: (category: PantryCategory) => void;
};

export function PantryCategoryPicker({ value, onChange }: PantryCategoryPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-4 gap-2">
      {PANTRY_CATEGORIES.map((category, index) => {
        const Icon = PANTRY_CATEGORY_ICONS[category];
        const isSelected = value === category;

        return (
          <motion.button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03, type: 'spring', stiffness: 300, damping: 20 }}
            whileTap={{ scale: 0.92 }}
            className={[
              'flex flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3 text-xs font-medium transition-all duration-200 ease-spring',
              isSelected
                ? 'bg-slate-900 text-white shadow-float dark:bg-white dark:text-slate-900'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
            ].join(' ')}
          >
            <Icon className="h-5 w-5" strokeWidth={1.5} />
            <span className="leading-tight">{t(`categories.${category}`)}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
