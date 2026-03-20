import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AddItemModal } from '@/modules/add-item/AddItemModal';
import { ExpiryBanner } from '@/modules/dashboard/ExpiryBanner';
import { LeftoverList } from '@/modules/dashboard/LeftoverList';
import { countExpiringSoon } from '@/modules/dashboard/expiry-utils';
import { useLeftovers } from '@/modules/dashboard/use-leftovers';
import { Button } from '@/shared/ui/Button';
import { Fab } from '@/shared/ui/Fab';

export function DashboardPage() {
  const { t } = useTranslation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { leftovers, isError, isLoading, markConsumed, markWasted, refetch, updatingId } = useLeftovers();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="h-24 animate-pulse rounded-[32px] bg-white/70 shadow-card dark:bg-slate-950/70" />
        <div className="h-36 animate-pulse rounded-[32px] bg-white/70 shadow-card dark:bg-slate-950/70" />
        <div className="h-36 animate-pulse rounded-[32px] bg-white/70 shadow-card dark:bg-slate-950/70" />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="rounded-[32px] border border-red-200 bg-white/80 p-6 shadow-card dark:border-red-900/60 dark:bg-slate-950/80">
        <p className="font-display text-3xl tracking-tight text-slate-950 dark:text-white">
          {t('errors.generic')}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t('dashboard.loadErrorBody')}
        </p>
        <Button className="mt-5" onClick={() => void refetch()}>
          {t('dashboard.retry')}
        </Button>
      </section>
    );
  }

  const expiringSoonCount = countExpiringSoon(leftovers.map((leftover) => leftover.expiry_date));

  return (
    <>
      <section className="space-y-6 pb-24">
        <div className="rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-card backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-600 dark:text-brand-200">
            {t('dashboard.title')}
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-slate-950 dark:text-white">
            {t('dashboard.headline')}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t('dashboard.body')}
          </p>
        </div>

        <ExpiryBanner expiringCount={expiringSoonCount} />

        <LeftoverList
          leftovers={leftovers}
          updatingId={updatingId}
          onMarkConsumed={markConsumed}
          onMarkWasted={markWasted}
        />
      </section>

      <Fab label={t('addItem.fabLabel')} onClick={() => setIsAddModalOpen(true)} />
      <AddItemModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </>
  );
}
