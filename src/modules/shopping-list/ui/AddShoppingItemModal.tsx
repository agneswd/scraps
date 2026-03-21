import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { useCreateShoppingListItem } from '@/modules/shopping-list/data/use-shopping-list';

type AddShoppingItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AddShoppingItemModal({ isOpen, onClose }: AddShoppingItemModalProps) {
  const { t } = useTranslation();
  const createItem = useCreateShoppingListItem();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    try {
      setError(null);
      await createItem.mutateAsync({
        name: name.trim(),
        quantity: quantity ? Number(quantity) : undefined,
        unit: unit.trim() || undefined,
        checked: false,
      });
      setName('');
      setQuantity('');
      setUnit('');
      onClose();
    } catch {
      setError(t('shoppingList.saveError'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('shoppingList.addTitle')}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('shoppingList.nameLabel')}
          </label>
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('shoppingList.namePlaceholder')}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
          />
        </div>
        <div className="grid grid-cols-[7rem,1fr] gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('shoppingList.quantityLabel')}
            </label>
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('shoppingList.unitLabel')}
            </label>
            <input
              type="text"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              placeholder={t('shoppingList.unitPlaceholder')}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
            />
          </div>
        </div>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={createItem.isPending || name.trim().length === 0} onClick={() => void handleSubmit()}>
            {createItem.isPending ? t('shoppingList.saving') : t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
