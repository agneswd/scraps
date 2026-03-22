import type { RecordModel } from 'pocketbase';
import { pocketbase, assertPbId } from '@/shared/api/pocketbase';
import type { PantryCategory, PantryStatus } from '@/modules/pantry/pantry-categories';

export type PantryItemRecord = RecordModel & {
  household_id: string;
  added_by: string;
  name: string;
  barcode?: string;
  category: PantryCategory;
  quantity: number;
  unit?: string;
  expiry_date?: string;
  photo?: string;
  status: PantryStatus;
};

export async function listPantryItems(statusFilter?: PantryStatus) {
  const filter = statusFilter ? `status = "${statusFilter}"` : '';
  return pocketbase.collection('pantry_items').getFullList<PantryItemRecord>({
    filter,
    sort: '-updated',
  });
}

export async function getPantryItemByBarcode(householdId: string, barcode: string) {
  // Reject barcodes that contain characters outside known barcode charsets
  // (EAN, UPC, CODE-39, CODE-128 subsets) to prevent filter-string injection.
  if (!/^[A-Za-z0-9 \-./+$%]+$/.test(barcode)) {
    return null;
  }

  try {
    return await pocketbase.collection('pantry_items').getFirstListItem<PantryItemRecord>(
      `household_id = "${assertPbId(householdId, 'householdId')}" && barcode = "${barcode}" && status != "finished"`,
    );
  } catch {
    return null;
  }
}

type CreatePantryItemInput = {
  household_id: string;
  added_by: string;
  name: string;
  barcode?: string;
  category: PantryCategory;
  quantity: number;
  unit?: string;
  expiry_date?: string;
  photo?: Blob | null;
  status: PantryStatus;
};

export async function createPantryItem(input: CreatePantryItemInput) {
  const formData = new FormData();
  formData.set('household_id', input.household_id);
  formData.set('added_by', input.added_by);
  formData.set('name', input.name);
  formData.set('category', input.category);
  formData.set('quantity', String(input.quantity));
  formData.set('status', input.status);

  if (input.barcode) formData.set('barcode', input.barcode);
  if (input.unit) formData.set('unit', input.unit);
  if (input.expiry_date) formData.set('expiry_date', input.expiry_date);

  if (input.photo) {
    const ext = input.photo.type === 'image/jpeg' ? 'jpg' : 'webp';
    formData.set('photo', new File([input.photo], `pantry.${ext}`, { type: input.photo.type }));
  }

  return pocketbase.collection('pantry_items').create<PantryItemRecord>(formData);
}

type UpdatePantryItemFields = {
  name?: string;
  category?: PantryCategory;
  quantity?: number;
  unit?: string;
  expiry_date?: string;
  status?: PantryStatus;
  photo?: Blob | null;
};

export async function updatePantryItem(id: string, fields: UpdatePantryItemFields) {
  const payload: Record<string, string | number> = {};

  if (fields.name !== undefined) payload.name = fields.name;
  if (fields.category !== undefined) payload.category = fields.category;
  if (fields.quantity !== undefined) payload.quantity = fields.quantity;
  if (fields.unit !== undefined) payload.unit = fields.unit;
  if (fields.expiry_date !== undefined) payload.expiry_date = fields.expiry_date;
  if (fields.status !== undefined) payload.status = fields.status;

  let updatedRecord: PantryItemRecord | null = null;

  if (Object.keys(payload).length > 0) {
    updatedRecord = await pocketbase.collection('pantry_items').update<PantryItemRecord>(id, payload);
  }

  if (fields.photo === undefined) {
    return updatedRecord ?? pocketbase.collection('pantry_items').getOne<PantryItemRecord>(id);
  }

  const formData = new FormData();
  if (fields.photo) {
    const ext = fields.photo.type === 'image/jpeg' ? 'jpg' : 'webp';
    formData.set('photo', new File([fields.photo], `pantry.${ext}`, { type: fields.photo.type }));
  } else {
    formData.set('photo', '');
  }

  return pocketbase.collection('pantry_items').update<PantryItemRecord>(id, formData);
}

export async function deletePantryItem(id: string) {
  return pocketbase.collection('pantry_items').delete(id);
}

export async function incrementPantryQuantity(id: string, currentQuantity: number, currentStatus: PantryStatus) {
  return pocketbase.collection('pantry_items').update<PantryItemRecord>(id, {
    quantity: currentQuantity + 1,
    status: currentQuantity <= 0 || currentStatus === 'finished' ? 'in_stock' : currentStatus,
  });
}
