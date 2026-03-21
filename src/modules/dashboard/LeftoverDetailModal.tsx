import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Save, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryPicker } from '@/modules/add-item/CategoryPicker';
import { CameraCapture } from '@/modules/add-item/CameraCapture';
import {
  CATEGORY_ICONS,
  calculateDefaultExpiryDate,
  type LeftoverCategory,
} from '@/modules/dashboard/expiry-utils';
import { getLeftoverPhotoUrl, updateLeftover, type LeftoverRecord } from '@/modules/dashboard/leftover-api';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

type Props = {
  leftover: LeftoverRecord | null;
  onClose: () => void;
};

export function LeftoverDetailModal({ leftover, onClose }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<LeftoverCategory | null>(null);
  const [editCustomDays, setEditCustomDays] = useState<number | null>(null);
  const [editDaysFromToday, setEditDaysFromToday] = useState<number>(3);
  const [editNotes, setEditNotes] = useState('');
  const [editPhoto, setEditPhoto] = useState<Blob | 'keep' | null>('keep');
  const [saveError, setSaveError] = useState<string | null>(null);

  const photoUrl = leftover ? getLeftoverPhotoUrl(leftover) : null;

  const editPhotoPreviewUrl = useMemo(() => {
    if (editPhoto instanceof Blob) return URL.createObjectURL(editPhoto);
    return null;
  }, [editPhoto]);

  useEffect(() => {
    return () => {
      if (editPhotoPreviewUrl) URL.revokeObjectURL(editPhotoPreviewUrl);
    };
  }, [editPhotoPreviewUrl]);

  // Reset edit state when modal opens
  useEffect(() => {
    if (!leftover) return;
    const daysLeft = Math.max(
      1,
      Math.ceil((new Date(leftover.expiry_date).getTime() - Date.now()) / 86_400_000),
    );
    setEditName(leftover.item_name);
    setEditCategory(leftover.category);
    setEditCustomDays(leftover.category === 'other' ? daysLeft : null);
    setEditDaysFromToday(daysLeft);
    setEditNotes(leftover.notes ?? '');
    setEditPhoto('keep');
    setIsEditing(false);
    setSaveError(null);
  }, [leftover?.id]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!leftover || !editCategory) return;
      const expiryDate = editCategory === 'other'
        ? calculateDefaultExpiryDate('other', new Date(), editCustomDays ?? editDaysFromToday)
        : calculateDefaultExpiryDate(editCategory, new Date(), editDaysFromToday);
      await updateLeftover(leftover.id, {
        item_name: editName.trim(),
        category: editCategory,
        expiry_date: expiryDate,
        notes: editNotes.trim(),
        photo: editPhoto === 'keep' ? undefined : editPhoto,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leftovers'] });
      setIsEditing(false);
      setSaveError(null);
    },
    onError: () => {
      setSaveError(t('addItem.saveError'));
    },
  });

  const CategoryIcon = leftover ? CATEGORY_ICONS[leftover.category] : null;
  const displayPhotoUrl = editPhoto instanceof Blob ? editPhotoPreviewUrl : photoUrl;

  return (
    <Modal isOpen={leftover !== null} onClose={onClose} title={isEditing ? t('leftover.editTitle') : (leftover?.item_name ?? '')}>
      {leftover ? (
        <div className="space-y-5">
          {/* Photo */}
          {isEditing ? (
            <div className="space-y-3">
              {displayPhotoUrl ? (
                <div className="relative overflow-hidden rounded-2xl">
                  <img src={displayPhotoUrl} alt={editName} className="aspect-video w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setEditPhoto(null)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              ) : null}
              <CameraCapture hasPhoto={Boolean(displayPhotoUrl)} onCapture={(blob) => setEditPhoto(blob)} />
            </div>
          ) : (
            displayPhotoUrl ? (
              <div className="overflow-hidden rounded-2xl">
                <img src={displayPhotoUrl} alt={leftover.item_name} className="aspect-video w-full object-cover" />
              </div>
            ) : (
              CategoryIcon ? (
                <div className="flex h-32 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <CategoryIcon className="h-12 w-12 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                </div>
              ) : null
            )
          )}

          {/* Fields */}
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t('addItem.nameLabel')}
                </label>
                <input
                  type="text"
                  value={editName}
                  maxLength={60}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[0.9375rem] text-slate-900 outline-none transition-all ease-spring placeholder:text-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('addItem.categoryLabel')}</p>
                <CategoryPicker
                  value={editCategory}
                  customDays={editCustomDays}
                  onChange={setEditCategory}
                  onCustomDaysChange={setEditCustomDays}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t('leftover.daysFromTodayLabel')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={editDaysFromToday}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setEditDaysFromToday(Number.isNaN(v) || v < 1 ? 1 : Math.min(90, v));
                    }}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[0.9375rem] text-slate-900 outline-none transition-all ease-spring focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                  />
                  <span className="shrink-0 text-sm text-slate-400">{t('addItem.customDaysSuffix')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t('addItem.notesLabel')}
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value.slice(0, 60))}
                  placeholder={t('addItem.notesPlaceholder')}
                  className="min-h-20 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[0.9375rem] text-slate-900 outline-none transition-all ease-spring placeholder:text-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                />
                <p className="text-right text-xs text-slate-300 dark:text-slate-600">{60 - editNotes.length}</p>
              </div>

              {saveError ? (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
                  {saveError}
                </p>
              ) : null}

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setIsEditing(false)} className="flex-1">
                  {t('common.cancel')}
                </Button>
                <Button
                  disabled={updateMutation.isPending || !editCategory || !editName.trim()}
                  onClick={() => void updateMutation.mutateAsync()}
                  className="flex-1"
                >
                  <Save className="h-4 w-4" strokeWidth={2.5} />
                  {updateMutation.isPending ? t('addItem.saving') : t('common.save')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {leftover.item_name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {leftover.category === 'other' ? t('categories.custom') : t(`categories.${leftover.category}`)}
                    {' · '}
                    {new Date(leftover.expiry_date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  <Edit2 className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              {leftover.notes ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{leftover.notes}</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
