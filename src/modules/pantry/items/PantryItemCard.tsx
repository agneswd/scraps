import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { pocketbase } from '@/shared/api/pocketbase';
import { PANTRY_CATEGORY_ICONS } from '@/modules/pantry/pantry-categories';
import type { PantryItemRecord } from '@/modules/pantry/pantry-api';

type PantryItemCardProps = {
  item: PantryItemRecord;
  index: number;
  onTap: (item: PantryItemRecord) => void;
  onIncrement: (item: PantryItemRecord) => void;
  onDecrement: (item: PantryItemRecord) => void;
};

const statusDotColor: Record<string, string> = {
  in_stock: 'bg-emerald-400',
  low: 'bg-amber-400',
  finished: 'bg-slate-300 dark:bg-slate-600',
};

export function PantryItemCard({ item, index, onTap, onIncrement, onDecrement }: PantryItemCardProps) {
  const { t } = useTranslation();
  const Icon = PANTRY_CATEGORY_ICONS[item.category];

  const photoUrl = item.photo
    ? pocketbase.files.getURL(item, item.photo, { thumb: '80x80' })
    : null;

  return (
    <motion.button
      type="button"
      onClick={() => onTap(item)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 30 }}
      className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-soft transition-all active:scale-[0.98] dark:bg-slate-800/80"
    >
      {/* Photo or category icon */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-700">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500" strokeWidth={1.8} />
        )}
      </div>

      {/* Name + category + status */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotColor[item.status]}`} />
          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
            {item.name}
          </p>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
          {t(`categories.${item.category}`)}
          {item.unit ? ` · ${item.unit}` : ''}
        </p>
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDecrement(item); }}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 active:scale-90 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
          aria-label={t('pantry.decreaseQuantity')}
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <span className="min-w-[1.75rem] text-center text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onIncrement(item); }}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 active:scale-90 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
          aria-label={t('pantry.increaseQuantity')}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </motion.button>
  );
}
