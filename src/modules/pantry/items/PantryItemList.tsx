import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { PackageOpen, Search } from 'lucide-react';
import { PantryItemCard } from '@/modules/pantry/items/PantryItemCard';
import type { PantryItemRecord } from '@/modules/pantry/pantry-api';
import type { PantryStatus } from '@/modules/pantry/pantry-categories';

type PantryItemListProps = {
  items: PantryItemRecord[];
  onItemTap: (item: PantryItemRecord) => void;
  onIncrement: (item: PantryItemRecord) => void;
  onDecrement: (item: PantryItemRecord) => void;
};

const STATUS_FILTERS: Array<{ key: PantryStatus | 'all'; label: string }> = [
  { key: 'all', label: 'pantry.filterAll' },
  { key: 'in_stock', label: 'pantry.filterInStock' },
  { key: 'low', label: 'pantry.filterLow' },
  { key: 'finished', label: 'pantry.filterFinished' },
];

export function PantryItemList({ items, onItemTap, onIncrement, onDecrement }: PantryItemListProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<PantryStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const query = search.trim().toLowerCase();
  const filtered = items
    .filter((i) => filter === 'all' || i.status === filter)
    .filter((i) => !query || i.name.toLowerCase().includes(query));

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <PackageOpen className="h-7 w-7 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {t('pantry.emptyState')}
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {t('pantry.emptyHint')}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search box */}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" strokeWidth={2} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('pantry.searchPlaceholder', 'Search items…')}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-700"
        />
      </div>

      {/* Status filter pills */}
      <div className="scrollbar-hidden mb-4 flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={[
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.96]',
              filter === key
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
            ].join(' ')}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {/* Item list */}
      <div className="space-y-2">
        {filtered.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, type: 'spring', stiffness: 100, damping: 20 }}
          >
            <PantryItemCard
              item={item}
              index={index}
              onTap={onItemTap}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
            />
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && items.length > 0 && (
        <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
          {t('pantry.noMatchingItems')}
        </p>
      )}
    </div>
  );
}
