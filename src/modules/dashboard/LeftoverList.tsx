import { useTranslation } from 'react-i18next';
import { LeftoverCard } from '@/modules/dashboard/LeftoverCard';
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

  if (leftovers.length === 0) {
    return (
      <article className="rounded-[32px] border border-dashed border-brand-300 bg-brand-50/80 p-6 text-sm leading-6 text-brand-900 dark:border-brand-500/40 dark:bg-brand-900/20 dark:text-brand-50">
        {t('dashboard.emptyState')}
      </article>
    );
  }

  return (
    <div className="space-y-4">
      {leftovers.map((leftover) => (
        <SwipeActions
          key={leftover.id}
          disabled={updatingId === leftover.id}
          onMarkConsumed={() => onMarkConsumed(leftover.id)}
          onMarkWasted={() => onMarkWasted(leftover.id)}
        >
          <LeftoverCard leftover={leftover} />
        </SwipeActions>
      ))}
    </div>
  );
}
