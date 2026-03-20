import { CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  CATEGORY_ICONS,
  formatTimeRemaining,
  getExpiryToneClasses,
} from '@/modules/dashboard/expiry-utils';
import { getLeftoverPhotoUrl, type LeftoverRecord } from '@/modules/dashboard/leftover-api';

type LeftoverCardProps = {
  leftover: LeftoverRecord;
};

export function LeftoverCard({ leftover }: LeftoverCardProps) {
  const { t } = useTranslation();
  const CategoryIcon = CATEGORY_ICONS[leftover.category];
  const photoUrl = getLeftoverPhotoUrl(leftover);

  return (
    <article className="rounded-[28px] border border-white/50 bg-white/90 p-4 shadow-card backdrop-blur dark:border-white/10 dark:bg-slate-950/85">
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-[22px] bg-brand-50 dark:bg-slate-900">
          {photoUrl ? (
            <img src={photoUrl} alt={leftover.item_name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-brand-600 dark:text-brand-200">
              <CategoryIcon className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-display text-2xl tracking-tight text-slate-950 dark:text-white">
              {leftover.item_name}
            </h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <CategoryIcon className="h-3.5 w-3.5" />
              {t(`categories.${leftover.category}`)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
              <CalendarClock className="h-4 w-4" />
              <span>{new Date(leftover.expiry_date).toLocaleDateString()}</span>
            </div>
            <div
              className={[
                'inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold',
                getExpiryToneClasses(leftover.expiry_date),
              ].join(' ')}
            >
              {formatTimeRemaining(leftover.expiry_date, t)}
            </div>
          </div>

          {leftover.notes ? (
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{leftover.notes}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
