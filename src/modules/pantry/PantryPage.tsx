import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { PantryItemList } from '@/modules/pantry/items/PantryItemList';
import { EditPantryItemModal } from '@/modules/pantry/items/EditPantryItemModal';
import { usePantryItems, useIncrementQuantity, useUpdatePantryItem } from '@/modules/pantry/use-pantry';
import { Button } from '@/shared/ui/Button';
import type { PantryItemRecord } from '@/modules/pantry/pantry-api';

type PantryTab = 'items' | 'recipes';

function PantrySkeleton() {
  return (
    <div className="space-y-3 pt-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[4.5rem] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

export function PantryPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<PantryTab>('items');
  const [editItem, setEditItem] = useState<PantryItemRecord | null>(null);

  const { data: items, isLoading, isError, refetch } = usePantryItems();
  const incrementMutation = useIncrementQuantity();
  const updateMutation = useUpdatePantryItem();

  function handleIncrement(item: PantryItemRecord) {
    incrementMutation.mutate({ id: item.id, currentQuantity: item.quantity });
  }

  function handleDecrement(item: PantryItemRecord) {
    if (item.quantity <= 0) return;
    const newQuantity = item.quantity - 1;
    updateMutation.mutate({
      id: item.id,
      quantity: newQuantity,
      status: newQuantity === 0 ? 'finished' : item.status,
    });
  }

  const tabs: Array<{ key: PantryTab; label: string }> = [
    { key: 'items', label: t('pantry.tabItems') },
    { key: 'recipes', label: t('pantry.tabRecipes') },
  ];

  return (
    <div>
      {/* Header */}
      <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        {t('pantry.title')}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t('pantry.headline')}
      </p>

      {/* Tab switcher */}
      <div className="relative mt-5 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className="relative z-10 flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors"
          >
            <span className={activeTab === tab.key ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}>
              {tab.label}
            </span>
            {activeTab === tab.key && (
              <motion.div
                layoutId="pantry-tab-indicator"
                className="absolute inset-0 rounded-lg bg-white shadow-soft dark:bg-slate-700"
                style={{ zIndex: -1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-5">
        {activeTab === 'items' && (
          <>
            {isLoading && <PantrySkeleton />}

            {isError && (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('pantry.loadError')}
                </p>
                <Button variant="secondary" onClick={() => refetch()} className="mt-3">
                  {t('dashboard.retry')}
                </Button>
              </div>
            )}

            {!isLoading && !isError && items && (
              <PantryItemList
                items={items}
                onItemTap={setEditItem}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
              />
            )}
          </>
        )}

        {activeTab === 'recipes' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('pantry.recipesComingSoon')}
            </p>
          </div>
        )}
      </div>

      <EditPantryItemModal
        isOpen={editItem !== null}
        item={editItem}
        onClose={() => setEditItem(null)}
      />
    </div>
  );
}
