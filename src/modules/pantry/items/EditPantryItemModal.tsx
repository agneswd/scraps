import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { CameraCapture } from '@/modules/add-item/CameraCapture';
import { useUpdatePantryItem, useDeletePantryItem } from '@/modules/pantry/use-pantry';
import { PANTRY_CATEGORIES, type PantryCategory } from '@/modules/pantry/pantry-categories';
import type { PantryItemRecord } from '@/modules/pantry/pantry-api';
import type { PantryStatus } from '@/modules/pantry/pantry-categories';

type EditPantryItemModalProps = {
  isOpen: boolean;
  item: PantryItemRecord | null;
  onClose: () => void;
};

const STATUS_OPTIONS: PantryStatus[] = ['in_stock', 'low', 'finished'];

export function EditPantryItemModal({ isOpen, item, onClose }: EditPantryItemModalProps) {
  const { t } = useTranslation();
  const updateItem = useUpdatePantryItem();
  const deleteItem = useDeletePantryItem();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<PantryCategory>('other');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('');
  const [status, setStatus] = useState<PantryStatus>('in_stock');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const previewUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    if (item && isOpen) {
      setName(item.name);
      setCategory(item.category);
      setQuantity(item.quantity);
      setUnit(item.unit ?? '');
      setStatus(item.status);
      setPhoto(null);
      setPhotoChanged(false);
      setError(null);
      setConfirmDelete(false);
    }
  }, [item, isOpen]);

  async function handleSave() {
    try {
      setError(null);
      await updateItem.mutateAsync({
        id: item!.id,
        name: name.trim(),
        category,
        quantity,
        unit: unit.trim() || undefined,
        status,
        ...(photoChanged ? { photo } : {}),
      });
      onClose();
    } catch {
      setError(t('pantry.saveError'));
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    try {
      await deleteItem.mutateAsync(item!.id);
      onClose();
    } catch {
      setError(t('pantry.deleteError'));
    }
  }

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('pantry.editTitle')}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="space-y-4"
      >
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('pantry.nameLabel')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('addItem.categoryLabel')}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PantryCategory)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {PANTRY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{t(`categories.${cat}`)}</option>
            ))}
          </select>
        </div>

        {/* Quantity + Unit */}
        <div className="flex gap-3">
          <div className="w-24">
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('pantry.quantityLabel')}
            </label>
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-semibold tabular-nums text-slate-900 outline-none transition-all focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('pantry.unitLabel')}
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder={t('pantry.unitPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('pantry.statusLabel')}
          </label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={[
                  'flex-1 rounded-xl px-3 py-2 text-xs font-medium transition-all active:scale-[0.96]',
                  status === s
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                ].join(' ')}
              >
                {t(`pantry.status_${s}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Photo */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('addItem.photoLabel')}
          </label>
          <CameraCapture
            hasPhoto={photo !== null}
            onCapture={(blob) => { setPhoto(blob); setPhotoChanged(true); }}
          />
        </div>

        {error && <p className="text-center text-xs text-red-500">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={handleDelete}
            className={confirmDelete ? '!bg-red-50 !text-red-600 dark:!bg-red-900/20 dark:!text-red-400' : ''}
          >
            {confirmDelete ? t('pantry.confirmDelete') : t('pantry.delete')}
          </Button>
          <Button
            disabled={!name.trim() || updateItem.isPending}
            onClick={handleSave}
          >
            {updateItem.isPending ? t('pantry.saving') : t('common.save')}
          </Button>
        </div>
      </motion.div>
    </Modal>
  );
}
