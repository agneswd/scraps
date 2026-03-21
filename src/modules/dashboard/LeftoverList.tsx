import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { LeftoverCard } from '@/modules/dashboard/LeftoverCard';
import { LeftoverDetailModal } from '@/modules/dashboard/LeftoverDetailModal';
import { SwipeActions } from '@/modules/dashboard/SwipeActions';
import type { LeftoverRecord } from '@/modules/dashboard/leftover-api';

type LeftoverListProps = {
  leftovers: LeftoverRecord[];
  updatingId: string | null;
  onMarkConsumed: (id: string) => void;
  onMarkWasted: (id: string) => void;
};

export function LeftoverList({
  leftovers,
  updatingId,
  onMarkConsumed,
  onMarkWasted,
}: LeftoverListProps) {
  const { t } = useTranslation();
  const [selectedLeftover, setSelectedLeftover] = useState<LeftoverRecord | null>(null);

  if (leftovers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Package className="h-6 w-6 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-slate-400 dark:text-slate-500">
          {t('dashboard.emptyState')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {leftovers.map((leftover, index) => (
          <motion.div
            key={leftover.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 24,
              delay: index * 0.05,
            }}
          >
            <SwipeActions
              disabled={updatingId === leftover.id}
              onMarkConsumed={() => onMarkConsumed(leftover.id)}
              onMarkWasted={() => onMarkWasted(leftover.id)}
            >
              <LeftoverCard
                leftover={leftover}
                onClick={() => setSelectedLeftover(leftover)}
              />
            </SwipeActions>
          </motion.div>
        ))}
      </div>

      <LeftoverDetailModal
        leftover={selectedLeftover}
        onClose={() => setSelectedLeftover(null)}
      />
    </>
  );
}
