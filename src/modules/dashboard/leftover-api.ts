import type { RecordModel } from 'pocketbase';
import { pocketbase } from '@/shared/api/pocketbase';
import type { LeftoverCategory, LeftoverStatus } from '@/modules/dashboard/expiry-utils';

export type LeftoverRecord = RecordModel & {
  added_by: string;
  category: LeftoverCategory;
  expiry_date: string;
  household_id: string;
  item_name: string;
  notes?: string;
  notified_at?: string;
  photo?: string;
  status: LeftoverStatus;
};

type CreateLeftoverInput = {
  household_id: string;
  added_by: string;
  item_name: string;
  category: LeftoverCategory;
  expiry_date: string;
  notes?: string;
  status: LeftoverStatus;
  photo?: Blob | null;
};

function buildLeftoverFormData(input: CreateLeftoverInput) {
  const formData = new FormData();
  formData.set('household_id', input.household_id);
  formData.set('added_by', input.added_by);
  formData.set('item_name', input.item_name);
  formData.set('category', input.category);
  formData.set('expiry_date', input.expiry_date);
  formData.set('status', input.status);

  if (input.notes) {
    formData.set('notes', input.notes);
  }

  if (input.photo) {
    const extension = input.photo.type === 'image/jpeg' ? 'jpg' : 'webp';
    formData.set(
      'photo',
      new File([input.photo], `${input.item_name.toLowerCase().replace(/\s+/g, '-')}.${extension}`, {
        type: input.photo.type,
      }),
    );
  }

  return formData;
}

export async function createLeftover(input: CreateLeftoverInput) {
  return pocketbase.collection('leftovers').create<LeftoverRecord>(buildLeftoverFormData(input));
}

export async function listActiveLeftovers() {
  return pocketbase.collection('leftovers').getFullList<LeftoverRecord>({
    filter: 'status = "active"',
    sort: '+expiry_date',
  });
}

export async function updateLeftoverStatus(id: string, status: Exclude<LeftoverStatus, 'active'>) {
  return pocketbase.collection('leftovers').update<LeftoverRecord>(id, { status });
}

export async function restoreLeftover(id: string) {
  return pocketbase.collection('leftovers').update<LeftoverRecord>(id, { status: 'active' });
}

export async function deleteLeftover(id: string) {
  return pocketbase.collection('leftovers').delete(id);
}

type UpdateLeftoverFields = {
  item_name?: string;
  category?: string;
  expiry_date?: string;
  notes?: string;
  photo?: Blob | null;
};

export async function updateLeftover(id: string, fields: UpdateLeftoverFields) {
  const formData = new FormData();
  if (fields.item_name !== undefined) formData.set('item_name', fields.item_name);
  if (fields.category !== undefined) formData.set('category', fields.category);
  if (fields.expiry_date !== undefined) formData.set('expiry_date', fields.expiry_date);
  if (fields.notes !== undefined) formData.set('notes', fields.notes);
  if (fields.photo !== undefined) {
    if (fields.photo) {
      const extension = fields.photo.type === 'image/jpeg' ? 'jpg' : 'webp';
      formData.set('photo', new File([fields.photo], `photo.${extension}`, { type: fields.photo.type }));
    } else {
      formData.set('photo', '');
    }
  }
  return pocketbase.collection('leftovers').update<LeftoverRecord>(id, formData);
}

export async function listArchivedLeftovers(limit?: number) {
  if (limit) {
    const result = await pocketbase.collection('leftovers').getList<LeftoverRecord>(1, limit, {
      filter: '(status = "consumed" || status = "wasted")',
      sort: '-updated',
      fields: 'id,item_name,category,status,updated',
    });

    return result.items;
  }

  return pocketbase.collection('leftovers').getFullList<LeftoverRecord>({
    filter: '(status = "consumed" || status = "wasted")',
    sort: '-updated',
    fields: 'id,item_name,category,status,updated',
  });
}

export function getLeftoverPhotoUrl(leftover: LeftoverRecord) {
  if (!leftover.photo) {
    return null;
  }

  return pocketbase.files.getURL(leftover, leftover.photo);
}
