import { useRef, useState, type ReactNode } from 'react';
import { useDrag } from '@use-gesture/react';
import { useTranslation } from 'react-i18next';

type SwipeActionsProps = {
  children: ReactNode;
  disabled?: boolean;
  onMarkConsumed: () => void;
  onMarkWasted: () => void;
};

const actionRevealWidth = 164;

export function SwipeActions({
  children,
  disabled = false,
  onMarkConsumed,
  onMarkWasted,
}: SwipeActionsProps) {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const startOffset = useRef(0);

  const bind = useDrag(
    ({ first, last, movement: [movementX] }) => {
      if (disabled) {
        return;
      }

      if (first) {
        startOffset.current = offset;
      }

      const nextOffset = Math.max(-actionRevealWidth, Math.min(0, startOffset.current + movementX));

      if (last) {
        setOffset(nextOffset < -actionRevealWidth / 2 ? -actionRevealWidth : 0);
        return;
      }

      setOffset(nextOffset);
    },
    {
      axis: 'x',
      pointer: {
        touch: true,
      },
    },
  );

  function runAction(action: () => void) {
    action();
    setOffset(0);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800">
      <div className="absolute inset-y-1 right-1 flex w-40 overflow-hidden rounded-[1.05rem]">
        <button
          type="button"
          disabled={disabled}
          onClick={() => runAction(onMarkConsumed)}
          className="flex-1 bg-emerald-400 px-3 text-xs font-medium text-white transition active:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-600"
        >
          {t('dashboard.markConsumed')}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => runAction(onMarkWasted)}
          className="flex-1 bg-red-400 px-3 text-xs font-medium text-white transition active:bg-red-500 disabled:opacity-50 dark:bg-red-600"
        >
          {t('dashboard.markWasted')}
        </button>
      </div>

      <div
        {...bind()}
        className="touch-pan-y will-change-transform"
        style={{ transform: `translate3d(${offset}px, 0, 0)` }}
      >
        {children}
      </div>
    </div>
  );
}
