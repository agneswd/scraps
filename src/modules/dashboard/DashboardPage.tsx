import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExpiryBanner } from '@/modules/dashboard/ExpiryBanner';
import { LeftoverList } from '@/modules/dashboard/LeftoverList';
import { countExpiringSoon } from '@/modules/dashboard/expiry-utils';
import { useLeftovers } from '@/modules/dashboard/use-leftovers';
import { Button } from '@/shared/ui/Button';
import { UndoToast, type UndoToastData } from '@/shared/ui/UndoToast';

function DashboardSkeleton() {
  return (
    <div className="space-y-3 pt-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="skeleton h-20"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const [undoToast, setUndoToast] = useState<UndoToastData | null>(null);

  // useRef so handleAction can always call the latest undoAction without
  // being itself recreated on every render (avoids stale closure with useCallback).
  const undoActionRef = useRef<((id: string) => Promise<void>) | null>(null);

  const handleAction = useCallback((id: string, name: string, status: 'consumed' | 'wasted') => {
    const label = status === 'consumed' ? t('dashboard.markConsumed') : t('dashboard.markWasted');
    setUndoToast({
      id: `${id}-${Date.now()}`,
      message: `${name} — ${label}`,
      onUndo: () => void undoActionRef.current?.(id),
    });
  }, [t]);

  const { leftovers, isError, isLoading, markConsumed, markWasted, refetch, updatingId, undoAction } = useLeftovers(handleAction);
  // Keep ref current without triggering a re-render.
  undoActionRef.current = undoAction;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <section className="rounded-2xl bg-red-50 p-6 dark:bg-red-950/30">
        <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          {t('errors.generic')}
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t('dashboard.loadErrorBody')}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => void refetch()}>
          {t('dashboard.retry')}
        </Button>
      </section>
    );
  }

  const expiringSoonCount = countExpiringSoon(leftovers.map((leftover) => leftover.expiry_date));

  return (
    <>
      <section className="space-y-4 pb-4">
        <div className="flex items-baseline justify-between gap-3 pr-14 md:pr-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('dashboard.title')}
          </h1>
          <span className="shrink-0 text-sm text-slate-400 dark:text-slate-500">
            {leftovers.length} {leftovers.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <ExpiryBanner expiringCount={expiringSoonCount} />

        <LeftoverList
          leftovers={leftovers}
          updatingId={updatingId}
          onMarkConsumed={markConsumed}
          onMarkWasted={markWasted}
        />
      </section>

      <UndoToast toast={undoToast} onDismiss={() => setUndoToast(null)} />
    </>
  );
}
