import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORY_ICONS, type LeftoverCategory } from '@/modules/dashboard/expiry-utils';

const categories = ['meat', 'poultry', 'seafood', 'veg', 'dairy', 'grains', 'prepared', 'other'] as const;

type CategoryPickerProps = {
  value: LeftoverCategory | null;
  customDays: number | null;
  onChange: (category: LeftoverCategory) => void;
  onCustomDaysChange: (days: number | null) => void;
};

export function CategoryPicker({ value, customDays, onChange, onCustomDaysChange }: CategoryPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {categories.map((category, index) => {
          const Icon = CATEGORY_ICONS[category];
          const isSelected = value === category;
          const label = category === 'other' ? t('categories.custom') : t(`categories.${category}`);

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
              <span className="leading-tight">{label}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {value === 'other' ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                {t('addItem.customDaysLabel')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={customDays ?? ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onCustomDaysChange(Number.isNaN(val) || val < 1 ? null : Math.min(30, val));
                  }}
                  placeholder="e.g. 7"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[0.9375rem] text-slate-900 outline-none transition-all duration-200 ease-spring placeholder:text-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                />
                <span className="shrink-0 text-sm text-slate-400 dark:text-slate-500">{t('addItem.customDaysSuffix')}</span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
