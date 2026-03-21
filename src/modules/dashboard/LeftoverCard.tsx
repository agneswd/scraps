import { CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  CATEGORY_ICONS,
  formatTimeRemaining,
  getExpiryTone,
} from '@/modules/dashboard/expiry-utils';
import { getLeftoverPhotoUrl, type LeftoverRecord } from '@/modules/dashboard/leftover-api';

type LeftoverCardProps = {
  leftover: LeftoverRecord;
  onClick?: () => void;
};

const toneBadgeClasses = {
  fresh: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  expired: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
};

export function LeftoverCard({ leftover, onClick }: LeftoverCardProps) {
  const { t } = useTranslation();
  const CategoryIcon = CATEGORY_ICONS[leftover.category];
  const photoUrl = getLeftoverPhotoUrl(leftover);
  const tone = getExpiryTone(leftover.expiry_date);

  return (
    <article
      onClick={onClick}
      className={[
        'flex items-center gap-3.5 rounded-2xl bg-white p-3 shadow-soft transition-all dark:bg-slate-800',
        onClick ? 'cursor-pointer hover:shadow-float active:scale-[0.99]' : '',
      ].join(' ')}
    >
      {/* Thumbnail */}
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-700">
        {photoUrl ? (
          <img src={photoUrl} alt={leftover.item_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
            <CategoryIcon className="h-6 w-6" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[0.9375rem] font-medium text-slate-900 dark:text-white">
          {leftover.item_name}
        </h2>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
            <CalendarClock className="h-3 w-3" strokeWidth={2} />
            {new Date(leftover.expiry_date).toLocaleDateString()}
          </span>
          <span
            className={[
              'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium',
              toneBadgeClasses[tone],
            ].join(' ')}
          >
            {formatTimeRemaining(leftover.expiry_date, t)}
          </span>
        </div>

        {leftover.notes ? (
          <p className="mt-1 truncate text-xs text-slate-400 dark:text-slate-500">{leftover.notes}</p>
        ) : null}
      </div>

      {/* Swipe hint: subtle colored bars indicate swipeable actions */}
      <div className="flex shrink-0 flex-col items-center gap-0.5 pr-0.5 opacity-30">
        <div className="h-1.5 w-4 rounded-full bg-emerald-500" />
        <div className="h-1.5 w-4 rounded-full bg-red-400" />
      </div>
    </article>
  );
}
