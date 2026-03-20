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

export async function listActiveLeftovers() {
  return pocketbase.collection('leftovers').getFullList<LeftoverRecord>({
    filter: 'status = "active"',
    sort: '+expiry_date',
  });
}

export async function updateLeftoverStatus(id: string, status: Exclude<LeftoverStatus, 'active'>) {
  return pocketbase.collection('leftovers').update<LeftoverRecord>(id, { status });
}

export function getLeftoverPhotoUrl(leftover: LeftoverRecord) {
  if (!leftover.photo) {
    return null;
  }

  return pocketbase.files.getUrl(leftover, leftover.photo);
}
