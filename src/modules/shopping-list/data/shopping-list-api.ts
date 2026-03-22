import type { RecordModel } from 'pocketbase';
import { pocketbase } from '@/shared/api/pocketbase';

export type ShoppingListItemRecord = RecordModel & {
  household_id: string;
  added_by: string;
  name: string;
  quantity?: number;
  unit?: string;
  recipe_id?: string;
  checked?: boolean;
};

export type ShoppingListItemInput = {
  household_id: string;
  added_by: string;
  name: string;
  quantity?: number;
  unit?: string;
  recipe_id?: string;
  checked?: boolean;
};

export async function listShoppingListItems() {
  return pocketbase.collection('shopping_list_items').getFullList<ShoppingListItemRecord>({
    sort: 'checked,created',
  });
}

export async function createShoppingListItem(input: ShoppingListItemInput) {
  return pocketbase.collection('shopping_list_items').create<ShoppingListItemRecord>({
    ...input,
    checked: Boolean(input.checked),
  });
}

export async function createShoppingListItems(items: ShoppingListItemInput[]) {
  return Promise.all(items.map((item) => createShoppingListItem(item)));
}

export async function updateShoppingListItem(
  id: string,
  fields: Partial<Pick<ShoppingListItemRecord, 'name' | 'quantity' | 'unit' | 'checked'>>,
) {
  return pocketbase.collection('shopping_list_items').update<ShoppingListItemRecord>(id, fields);
}

export async function deleteShoppingListItem(id: string) {
  return pocketbase.collection('shopping_list_items').delete(id);
}

export async function clearCheckedShoppingListItems(items?: ShoppingListItemRecord[]) {
  const checkedItems = items ?? await pocketbase.collection('shopping_list_items').getFullList<ShoppingListItemRecord>({
    filter: 'checked = true',
  });

  await Promise.all(checkedItems.map((item) => deleteShoppingListItem(item.id)));
}
