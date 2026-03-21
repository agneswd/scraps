import { motion } from 'framer-motion';
import { Clock3, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { pocketbase } from '@/shared/api/pocketbase';
import type { RecipeMatchResult } from '@/modules/pantry/recipes/data/recipe-matching';

type RecipeCardProps = {
  item: RecipeMatchResult;
  index: number;
  onTap: (item: RecipeMatchResult) => void;
};

export function RecipeCard({ item, index, onTap }: RecipeCardProps) {
  const { t } = useTranslation();
  const totalMinutes = (item.recipe.prep_time ?? 0) + (item.recipe.cook_time ?? 0);
  const photoUrl = item.recipe.photo
    ? pocketbase.files.getURL(item.recipe, item.recipe.photo, { thumb: '240x160' })
    : null;

  return (
    <motion.button
      type="button"
      onClick={() => onTap(item)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 28 }}
      className="w-full overflow-hidden rounded-2xl bg-white text-left shadow-soft transition-all active:scale-[0.98] dark:bg-slate-800/80"
    >
      {photoUrl ? (
        <img src={photoUrl} alt="" className="h-36 w-full object-cover" />
      ) : (
        <div className="flex h-36 items-center justify-center bg-[radial-gradient(circle_at_top_left,#e2e8f0,transparent_55%),linear-gradient(135deg,#f8fafc,#e2e8f0)] dark:bg-[radial-gradient(circle_at_top_left,#334155,transparent_55%),linear-gradient(135deg,#0f172a,#1e293b)]">
          <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
            {t('recipes.noPhoto')}
          </span>
        </div>
      )}
      <div className="space-y-3 p-4">
        <div>
          <p className="text-base font-semibold text-slate-900 dark:text-white">{item.recipe.title}</p>
          {item.recipe.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
              {item.recipe.description}
            </p>
          ) : null}
        </div>
        <div>
          <span
            className={[
              'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
              item.canMake
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
            ].join(' ')}
          >
            {item.canMake
              ? t('recipes.canMake')
              : t('recipes.missingCount', { count: item.missing.length })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-400 dark:text-slate-500">
          {item.recipe.servings ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-700">
              <Users className="h-3.5 w-3.5" strokeWidth={2} />
              {t('recipes.servingsValue', { count: item.recipe.servings })}
            </span>
          ) : null}
          {totalMinutes > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-700">
              <Clock3 className="h-3.5 w-3.5" strokeWidth={2} />
              {t('recipes.minutesValue', { count: totalMinutes })}
            </span>
          ) : null}
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-700">
            {t('recipes.ingredientsValue', { count: item.ingredients.length })}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
